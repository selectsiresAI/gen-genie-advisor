-- P2 internationalization: clients table was 100% Brazil-shaped (cep, cpf_cnpj, ie_rg),
-- no country/currency column at all. Nullable-safe via BR/BRL default so existing rows
-- keep their current de-facto assumption without a backfill/breaking change.
ALTER TABLE public.clients
  ADD COLUMN country text NOT NULL DEFAULT 'BR',
  ADD COLUMN currency text NOT NULL DEFAULT 'BRL';

COMMENT ON COLUMN public.clients.country IS 'ISO 3166-1 alpha-2 (e.g. BR, US). Default BR for existing rows created before internationalization.';
COMMENT ON COLUMN public.clients.currency IS 'ISO 4217 (e.g. BRL, USD). Default BRL for existing rows created before internationalization.';
