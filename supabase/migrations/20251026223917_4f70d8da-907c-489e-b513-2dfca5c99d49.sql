-- Habilitar RLS na tabela error_reports
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários autenticados podem criar relatórios de erro" ON public.error_reports;
DROP POLICY IF EXISTS "Admins podem visualizar todos os relatórios" ON public.error_reports;
DROP POLICY IF EXISTS "Usuários podem visualizar seus próprios relatórios" ON public.error_reports;

-- Permitir que usuários autenticados criem relatórios de erro
CREATE POLICY "Usuários autenticados podem criar relatórios de erro"
ON public.error_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que admins visualizem todos os relatórios
CREATE POLICY "Admins podem visualizar todos os relatórios"
ON public.error_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'::app_role
  )
);

-- Permitir que usuários visualizem seus próprios relatórios
CREATE POLICY "Usuários podem visualizar seus próprios relatórios"
ON public.error_reports
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_status ON public.error_reports(status);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at DESC);

-- Adicionar comentários
COMMENT ON TABLE public.error_reports IS 'Relatórios de erros e problemas reportados pelos usuários';
COMMENT ON COLUMN public.error_reports.user_id IS 'Usuário que reportou o erro (pode ser NULL para relatórios anônimos)';