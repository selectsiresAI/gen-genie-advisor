-- Ensure farm data is protected through row level security and hardened configuration

-- 1. Utility helper to verify farm membership
create schema if not exists sec;

create or replace function sec.is_member(p_farm_id uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.farm_members m
    where m.farm_id = p_farm_id
      and m.user_id = auth.uid()
  );
$$;

-- 2. Enforce RLS and restrict access to bulls_denorm
alter table if exists public.bulls_denorm enable row level security;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bulls_denorm'
  ) THEN
    EXECUTE (
      SELECT string_agg(
        format('drop policy if exists %I on public.bulls_denorm;', polname),
        ' '
      )
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'bulls_denorm'
    );
  END IF;
END;
$$;

create policy "read bulls_denorm for farm members"
on public.bulls_denorm
for select
using (sec.is_member(farm_id));

-- 3. Enforce RLS and restrict dashboard KPIs per farm
alter table if exists public.farm_dashboard_kpis enable row level security;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'farm_dashboard_kpis'
  ) THEN
    EXECUTE (
      SELECT string_agg(
        format('drop policy if exists %I on public.farm_dashboard_kpis;', polname),
        ' '
      )
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'farm_dashboard_kpis'
    );
  END IF;
END;
$$;

create policy "read kpis for farm members"
on public.farm_dashboard_kpis
for select
using (sec.is_member(farm_id));

-- 4. Enforce RLS and restrict semen inventory per farm
alter table if exists public.semen_inventory enable row level security;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'semen_inventory'
  ) THEN
    EXECUTE (
      SELECT string_agg(
        format('drop policy if exists %I on public.semen_inventory;', polname),
        ' '
      )
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'semen_inventory'
    );
  END IF;
END;
$$;

create policy "read inventory for farm members"
on public.semen_inventory
for select
using (sec.is_member(farm_id));

-- 5. Enforce RLS on female segmentations and remove permissive policies
alter table if exists public.female_segmentations enable row level security;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'female_segmentations'
  ) THEN
    EXECUTE (
      SELECT string_agg(
        format('drop policy if exists %I on public.female_segmentations;', polname),
        ' '
      )
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'female_segmentations'
    );
  END IF;
END;
$$;

create policy "read female_segmentations for farm members"
on public.female_segmentations
for select
using (sec.is_member(farm_id));

-- 6. Ensure extensions live in the extensions schema instead of public
create schema if not exists extensions;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT e.extname
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('alter extension %I set schema extensions;', rec.extname);
  END LOOP;
END;
$$;

-- 7. Fix search_path for functions under public schema
DO $$
DECLARE
  rec RECORD;
  target_schemas text := 'public,auth';
BEGIN
  FOR rec IN
    SELECT pg_proc.oid::regprocedure AS fn_sig
    FROM pg_proc
    JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
    WHERE n.nspname IN ('public')
  LOOP
    EXECUTE format('alter function %s set search_path = %s;', rec.fn_sig, target_schemas);
  END LOOP;
END;
$$;
