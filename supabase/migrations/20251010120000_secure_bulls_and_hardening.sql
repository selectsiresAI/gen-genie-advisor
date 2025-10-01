-- Harden access to bull breeding data and general security posture

-- 1. Ensure extensions live outside the public schema
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
DECLARE
    ext RECORD;
BEGIN
    FOR ext IN
        SELECT e.extname
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext.extname);
    END LOOP;
END;
$$;

-- 2. Enforce and tighten RLS on bulls_denorm
DO $$
DECLARE
    rel_kind "char";
BEGIN
    SELECT c.relkind
      INTO rel_kind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'bulls_denorm';

    IF rel_kind = 'r' THEN
        EXECUTE 'ALTER TABLE public.bulls_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER TABLE public.bulls_denorm FORCE ROW LEVEL SECURITY';
    ELSIF rel_kind = 'm' THEN
        EXECUTE 'ALTER MATERIALIZED VIEW public.bulls_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER MATERIALIZED VIEW public.bulls_denorm FORCE ROW LEVEL SECURITY';
    ELSIF rel_kind = 'v' THEN
        EXECUTE 'ALTER VIEW public.bulls_denorm ENABLE ROW LEVEL SECURITY';
        EXECUTE 'ALTER VIEW public.bulls_denorm FORCE ROW LEVEL SECURITY';
    END IF;
END;
$$;

DROP POLICY IF EXISTS "Farm users can access bulls_denorm" ON public.bulls_denorm;
DROP POLICY IF EXISTS "Farm members can access bulls_denorm" ON public.bulls_denorm;
DROP POLICY IF EXISTS "Authenticated users can view bulls denorm" ON public.bulls_denorm;
DROP POLICY IF EXISTS "Authenticated users can view bulls denorm data" ON public.bulls_denorm;

CREATE POLICY "Farm users can access bulls_denorm"
ON public.bulls_denorm
FOR SELECT
USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM public.user_farms uf
        WHERE uf.user_id = auth.uid()
    )
);

-- 3. Require callers to be authorised inside the RPC helper
CREATE OR REPLACE FUNCTION public.get_bulls_denorm()
RETURNS SETOF public.bulls_denorm
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required to access bull data'
            USING ERRCODE = '28000';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.user_farms uf
        WHERE uf.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have permission to view bull breeding data'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.bulls_denorm;
END;
$$;

-- 4. Ensure SECURITY DEFINER helpers run with a deterministic search_path
ALTER FUNCTION public.is_farm_member(uuid) SET search_path = public;
ALTER FUNCTION public.can_edit_farm(uuid) SET search_path = public;
ALTER FUNCTION public.is_farm_owner(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
