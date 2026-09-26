-- One-off smoke test to verify the app_logs table/RLS/grant chain end-to-end
-- (insert as service_role, confirm readable, then cleaned up in the next migration).
INSERT INTO public.app_logs (level, source, message, context)
VALUES ('info', 'rordens-smoke-test', 'verificacao de infraestrutura P2 26/09/2026', '{"test": true}'::jsonb);
