-- Enable RLS on user_roles (caso ainda não esteja habilitado)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy para permitir que usuários leiam suas próprias roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy para permitir que admins gerenciem todas as roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);