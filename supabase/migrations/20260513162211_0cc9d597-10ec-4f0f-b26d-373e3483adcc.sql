CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove agendamento anterior se existir
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'recalc-placeholder-bulls-daily';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

-- Agenda recálculo diário às 03:00 UTC
SELECT cron.schedule(
  'recalc-placeholder-bulls-daily',
  '0 3 * * *',
  $$ SELECT public.recalc_placeholder_bulls(); $$
);