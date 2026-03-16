CREATE UNIQUE INDEX IF NOT EXISTS females_client_id_identifier_unique 
ON public.females (client_id, identifier) 
WHERE identifier IS NOT NULL AND deleted_at IS NULL;