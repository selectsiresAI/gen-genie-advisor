-- Fix 3 Security Findings (fase final)
-- ====================================
-- 1) bulls_denorm: alinhar RLS com a tabela bulls (login + membro de fazenda ou admin)
-- 2) female_segmentations: remover políticas permissivas e exigir membership
-- 3) Views no schema public: garantir SECURITY INVOKER (inclui materialized views)

-- =====================================================
-- 1) bulls_denorm: RLS + política equivalente à bulls
--    (autenticado E membro de alguma fazenda, ou admin)
-- =====================================================

-- Funções auxiliares (se ainda não existirem)
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(
    (
      current_setting('request.jwt.claims', true)::jsonb ? 'role'
    )
    and (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin',
    false
  );
$$;

create or replace function public.has_farm_membership() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.user_farms uf where uf.user_id = auth.uid()
  );
$$;

create or replace function public.is_member_of_farm(_farm_id uuid) returns boolean
language sql stable as $$
  select exists (
    select 1
      from public.user_farms uf
     where uf.farm_id = _farm_id
       and uf.user_id = auth.uid()
  );
$$;

alter table if exists public.bulls_denorm enable row level security;
revoke all on table public.bulls_denorm from anon, public;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bulls_denorm'
  ) then
    execute (
      select string_agg(
        format('drop policy if exists %I on public.bulls_denorm;', polname),
        ' '
      )
      from pg_policies
      where schemaname = 'public'
        and tablename = 'bulls_denorm'
    );
  end if;
end;
$$;

create policy bulls_denorm_select on public.bulls_denorm
for select
using (
  auth.uid() is not null
  and (public.is_admin() or public.has_farm_membership())
);

-- =====================================================
-- 2) female_segmentations: remover USING true e exigir membership
-- =====================================================

alter table if exists public.female_segmentations enable row level security;
revoke all on table public.female_segmentations from anon, public;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'female_segmentations'
  ) then
    execute (
      select string_agg(
        format('drop policy if exists %I on public.female_segmentations;', polname),
        ' '
      )
      from pg_policies
      where schemaname = 'public'
        and tablename = 'female_segmentations'
    );
  end if;
end;
$$;

create policy female_segmentations_select on public.female_segmentations
for select
using (
  auth.uid() is not null
  and (public.is_member_of_farm(farm_id) or public.is_admin())
);

-- =====================================================
-- 3) Views marcadas como SECURITY DEFINER → forçar SECURITY INVOKER
--    (inclui materialized views) no schema public
-- =====================================================

do $fix$
declare
  r record;
begin
  -- Views normais
  for r in
    select n.nspname as schema, c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'v'  -- view
      and n.nspname = 'public'
  loop
    execute format('alter view %I.%I set (security_invoker = on);', r.schema, r.name);
  end loop;

  -- Materialized views
  for r in
    select n.nspname as schema, c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'm'  -- materialized view
      and n.nspname = 'public'
  loop
    execute format('alter materialized view %I.%I set (security_invoker = on);', r.schema, r.name);
  end loop;
exception
  when others then
    -- não falhar migração se alguma view não suportar a opção (PG < 15)
    raise notice 'Aviso ao ajustar security_invoker: %', sqlerrm;
end
$fix$;
