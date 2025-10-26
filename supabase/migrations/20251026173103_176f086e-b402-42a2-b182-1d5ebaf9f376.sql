-- ============================================================================
-- CORREÇÃO DO SISTEMA DE ROLES - REMOVE RECURSÃO EM RLS POLICIES
-- ============================================================================
-- Problema: As policies em user_roles usam has_role(), que consulta user_roles,
-- criando recursão infinita e bloqueando todas as queries.
--
-- Solução: 
-- 1. Remover TODAS as policies existentes
-- 2. Criar apenas uma policy simples de SELECT usando auth.uid()
-- 3. Não criar policies para INSERT/UPDATE/DELETE (feitas via Dashboard/Edge Functions)
-- ============================================================================

-- 1. Remover todas as policies existentes em user_roles
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- 2. Criar policy simples de SELECT sem recursão
-- Usuários autenticados podem ler apenas suas próprias roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 3. NÃO criar policies para INSERT/UPDATE/DELETE
-- Essas operações serão feitas apenas via:
-- - Supabase Dashboard (com permissões de admin)
-- - Edge Functions com service role key
-- Isso elimina completamente o risco de recursão em RLS policies

-- ============================================================================
-- NOTA: Para adicionar/remover roles de usuários, use:
-- 1. Supabase Dashboard > Table Editor > user_roles
-- 2. Edge Functions com supabase.auth.admin
-- ============================================================================