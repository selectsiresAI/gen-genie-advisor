
-- Migration 2: Funções e políticas para técnicos

-- Função para verificar se usuário é técnico de uma fazenda
CREATE OR REPLACE FUNCTION public.is_farm_technician(farm_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_farms
    WHERE farm_id = farm_uuid 
      AND user_id = auth.uid()
      AND role = 'technician'
  );
$$;

-- Atualizar política de visualização de fêmeas para incluir técnicos
DROP POLICY IF EXISTS "Farm members can view females" ON public.females;
CREATE POLICY "Farm members can view females"
ON public.females
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    is_farm_member(farm_id) 
    OR is_farm_technician(farm_id)
  )
);

-- Atualizar política de visualização de fazendas para incluir técnicos
DROP POLICY IF EXISTS "Users can view farms they are members of" ON public.farms;
CREATE POLICY "Users can view farms they are members of"
ON public.farms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_farms
    WHERE farm_id = farms.id 
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor', 'viewer', 'technician')
  )
);

-- View para listar técnicos por fazenda
CREATE OR REPLACE VIEW public.farm_technicians AS
SELECT 
  uf.farm_id,
  f.name as farm_name,
  p.id as technician_id,
  p.full_name as technician_name,
  p.email as technician_email,
  uf.created_at as assigned_at
FROM public.user_farms uf
JOIN public.farms f ON f.id = uf.farm_id
JOIN public.profiles p ON p.id = uf.user_id
WHERE uf.role = 'technician';

-- Comentários explicativos
COMMENT ON FUNCTION public.is_farm_technician IS 'Verifica se o usuário atual é técnico de uma fazenda específica';
COMMENT ON VIEW public.farm_technicians IS 'Lista todos os técnicos atribuídos a cada fazenda';
