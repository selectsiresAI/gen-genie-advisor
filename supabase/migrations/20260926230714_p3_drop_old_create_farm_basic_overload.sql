-- CREATE OR REPLACE with new params created an overload instead of replacing (Postgres
-- resolves functions by full signature). Drop the stale 3-arg version so there's only
-- one create_farm_basic and it always writes city/state (even when the caller omits
-- them, since they default to NULL).
DROP FUNCTION IF EXISTS public.create_farm_basic(text, text, jsonb);
