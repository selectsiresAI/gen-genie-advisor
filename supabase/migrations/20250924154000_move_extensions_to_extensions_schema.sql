-- Ensure extensions are not installed in the public schema
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'fuzzystrmatch') THEN
        PERFORM 1 FROM pg_namespace WHERE nspname = 'extensions';
        EXECUTE 'ALTER EXTENSION fuzzystrmatch SET SCHEMA extensions';
    ELSE
        EXECUTE 'CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA extensions';
    END IF;
END;
$$;
