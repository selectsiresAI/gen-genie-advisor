-- Ensure semen_inventory and farm_dashboard_kpis are protected by RLS

-- Helper DO block to enable and enforce RLS regardless of relation type
DO $$
DECLARE
    rel RECORD;
BEGIN
    FOR rel IN
        SELECT c.oid, c.relkind, c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN ('semen_inventory', 'farm_dashboard_kpis')
    LOOP
        IF rel.relkind = 'r' THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', rel.relname);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', rel.relname);
        ELSIF rel.relkind = 'm' THEN
            EXECUTE format('ALTER MATERIALIZED VIEW public.%I ENABLE ROW LEVEL SECURITY', rel.relname);
            EXECUTE format('ALTER MATERIALIZED VIEW public.%I FORCE ROW LEVEL SECURITY', rel.relname);
        ELSIF rel.relkind = 'v' THEN
            EXECUTE format('ALTER VIEW public.%I ENABLE ROW LEVEL SECURITY', rel.relname);
            EXECUTE format('ALTER VIEW public.%I FORCE ROW LEVEL SECURITY', rel.relname);
        END IF;
    END LOOP;
END;
$$;

-- Recreate restrictive policies
DO $$
DECLARE
    target text;
BEGIN
    FOR target IN SELECT unnest(ARRAY['semen_inventory', 'farm_dashboard_kpis'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Farm members can access %1$s" ON public.%1$s', target);
        EXECUTE format('DROP POLICY IF EXISTS "Farm members can view %1$s" ON public.%1$s', target);
        EXECUTE format('DROP POLICY IF EXISTS "Farm members can view %1$s data" ON public.%1$s', target);

        EXECUTE format($$CREATE POLICY "Farm members can access %1$s"
            ON public.%1$s
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL
                AND farm_id IS NOT NULL
                AND public.is_farm_member(farm_id)
            )$$, target);
    END LOOP;
END;
$$;
