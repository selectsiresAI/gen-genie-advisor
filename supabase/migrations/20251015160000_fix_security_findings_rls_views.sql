-- Fix Security Findings (RLS + Views)
-- ==================================
-- This migration hardens view security and enforces RLS across the
-- tables highlighted during the security review. It is safe to rerun.

-- ===============================
-- 1) Views: usar SECURITY INVOKER
-- ===============================
-- Postgres 15+ aceita security_invoker para VIEW/MVIEW.
-- Isso garante que a view respeite as permissões de QUEM consulta (e não do criador).

do $$
declare
  v text;
  views text[] := array[
    'public.rebanho_view',
    'public.segmentacao_view',
    'public.ag_step6_table_view',
    'public.ag_step6_compare_view'
  ];
begin
  foreach v in array views loop
    begin
      execute format('alter view %s set (security_invoker = on);', v);
    exception
      when undefined_table then
        -- view inexistente: ignorar e seguir
        null;
    end;
  end loop;
end$$;

-- ===================================================
-- 2) Helpers: papel de admin (opcional) e membership
-- ===================================================

-- Se já existir uma coluna/claim de admin, ajuste aqui.
-- Exemplo: claim 'role' = 'admin' no JWT.
create or replace function public.is_admin() returns boolean
language sql
stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ? 'role')
    and (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin',
    false
  );
$$;

-- Checa se o usuário pertence à fazenda informada
create or replace function public.is_member_of_farm(_farm_id uuid) returns boolean
language sql
stable
as $$
  select exists (
    select 1
      from public.user_farms uf
     where uf.farm_id = _farm_id
       and uf.user_id = auth.uid()
  );
$$;

-- ================================================
-- 3) RLS: habilitar, revogar acesso público e criar políticas
-- ================================================

-- -------- PROFILES --------
alter table if exists public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated, public;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select
using ( id = auth.uid() or public.is_admin() );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update
using ( id = auth.uid() or public.is_admin() );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
for insert
with check ( auth.uid() is not null );

-- -------- FARMS --------
alter table if exists public.farms enable row level security;
revoke all on table public.farms from anon, authenticated, public;

drop policy if exists farms_select on public.farms;
create policy farms_select on public.farms
for select
using ( auth.uid() is not null and (public.is_member_of_farm(id) or public.is_admin()) );

-- -------- USER_FARMS (relacionamento) --------
alter table if exists public.user_farms enable row level security;
revoke all on table public.user_farms from anon, authenticated, public;

drop policy if exists user_farms_select on public.user_farms;
create policy user_farms_select on public.user_farms
for select
using ( auth.uid() is not null and (user_id = auth.uid() or public.is_admin()) );

-- -------- FEMALES (e DENORM) --------
alter table if exists public.females_ enable row level security;
alter table if exists public.females_denorm enable row level security;
revoke all on table public.females_ from anon, authenticated, public;
revoke all on table public.females_denorm from anon, authenticated, public;

drop policy if exists females__select on public.females_;
create policy females__select on public.females_
for select
using ( auth.uid() is not null and (public.is_member_of_farm(farm_id) or public.is_admin()) );

drop policy if exists females_denorm_select on public.females_denorm;
create policy females_denorm_select on public.females_denorm
for select
using ( auth.uid() is not null and (public.is_member_of_farm(farm_id) or public.is_admin()) );

-- -------- GENETIC RECORDS --------
alter table if exists public.genetic_records enable row level security;
revoke all on table public.genetic_records from anon, authenticated, public;

drop policy if exists genetic_records_select on public.genetic_records;
create policy genetic_records_select on public.genetic_records
for select
using ( auth.uid() is not null and (public.is_member_of_farm(farm_id) or public.is_admin()) );

-- -------- MATINGS --------
alter table if exists public.matings enable row level security;
revoke all on table public.matings from anon, authenticated, public;

drop policy if exists matings_select on public.matings;
create policy matings_select on public.matings
for select
using ( auth.uid() is not null and (public.is_member_of_farm(farm_id) or public.is_admin()) );

-- -------- SEMEN MOVEMENTS --------
alter table if exists public.semen_movements enable row level security;
revoke all on table public.semen_movements from anon, authenticated, public;

drop policy if exists semen_movements_select on public.semen_movements;
create policy semen_movements_select on public.semen_movements
for select
using ( auth.uid() is not null and (public.is_member_of_farm(farm_id) or public.is_admin()) );

-- -------- BULLS_DENORM (estava sem RLS) --------
alter table if exists public.bulls_denorm enable row level security;
revoke all on table public.bulls_denorm from anon, public;

drop policy if exists bulls_denorm_select on public.bulls_denorm;
create policy bulls_denorm_select on public.bulls_denorm
for select
using ( auth.uid() is not null or public.is_admin() );

-- ================================================
-- 4) (Opcional) Bloquear INSERT/UPDATE/DELETE ao público
-- ================================================
-- Repita, se aplicável, políticas de escrita apenas para admins ou serviços.
-- Exemplo genérico:
-- drop policy if exists females_denorm_write on public.females_denorm;
-- create policy females_denorm_write on public.females_denorm
-- for all
-- using ( false )
-- with check ( public.is_admin() );

-- ================================================
-- 5) Checklist pós-migração (comentários)
-- ================================================
-- - Verifique nas Policies do Supabase se nenhuma política ficou com USING true para SELECT.
-- - Garanta que o JWT inclua 'role'='admin' para contas administrativas (ou ajuste a função is_admin()).
-- - Se houver views adicionais marcadas pelo linter, repita o ALTER VIEW ... security_invoker=on.
-- - Teste rapidamente:
--     a) anônimo: SELECT * FROM farms -> deve falhar
--     b) user autenticado NÃO membro: SELECT * FROM females_denorm -> 0 linhas
--     c) user membro: SELECT * FROM females_denorm -> retorna as linhas da(s) fazenda(s) dele
