
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para sincronizar senhas temporárias a cada 5 minutos
SELECT cron.schedule(
  'sync-temp-passwords-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gzvweejdtycxzxrjplpc.supabase.co/functions/v1/sync-temp-passwords',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dndlZWpkdHljeHp4cmpwbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDgzMDIsImV4cCI6MjA3NDEyNDMwMn0.-1zb66szqJj5jf5rIrU8H3EzQb9p-5X91G3ZePnX9FQ'
    ),
    body := '{}'::jsonb
  );
  $$
);
