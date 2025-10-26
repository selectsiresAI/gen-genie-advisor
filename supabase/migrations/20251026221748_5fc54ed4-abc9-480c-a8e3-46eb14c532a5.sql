
-- Adicionar políticas RLS na tabela user_roles para permitir leitura própria

-- Verificar se RLS está habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Policy para usuários verem sua própria role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy para admins verem todas as roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy para admins gerenciarem roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Adicionar comentários
COMMENT ON TABLE public.user_roles IS 'Tabela de roles de usuários - gerenciada apenas por admins';
COMMENT ON COLUMN public.user_roles.user_id IS 'Referência ao usuário em auth.users';
COMMENT ON COLUMN public.user_roles.role IS 'Role do usuário (admin, moderator, user)';
