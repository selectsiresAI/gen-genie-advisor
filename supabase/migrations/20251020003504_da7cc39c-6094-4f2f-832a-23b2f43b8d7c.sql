
-- Criar função para sincronizar senhas temporárias com auth.users
-- Esta função deve ser executada manualmente via Supabase Admin API ou Dashboard

-- Primeiro, vamos criar uma view para facilitar a consulta das senhas temporárias
CREATE OR REPLACE VIEW admin_temp_passwords AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.temporary_password,
  u.email as auth_email
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.temporary_password IS NOT NULL
  AND p.email IS NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON VIEW admin_temp_passwords IS 
'View para administradores consultarem senhas temporárias. 
IMPORTANTE: Use o Supabase Dashboard ou Admin API para atualizar as senhas no auth.users:
1. Vá para Authentication > Users
2. Clique no usuário
3. Clique em "Reset Password"
4. Use a senha temporária desta view';

-- Criar função auxiliar para logs de atualização de senha
CREATE TABLE IF NOT EXISTS password_reset_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  reset_at timestamp with time zone DEFAULT now(),
  reset_by text,
  notes text
);

COMMENT ON TABLE password_reset_log IS 'Log de redefinições de senha para auditoria';
