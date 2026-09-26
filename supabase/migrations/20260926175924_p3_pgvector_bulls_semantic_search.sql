-- P3: RAG semantic search for bulls. Enables pgvector, adds embedding storage on bulls,
-- HNSW cosine index, and a SECURITY DEFINER search RPC matching the convention already
-- used by search_bulls/get_bull_by_naab (both SECURITY DEFINER, STABLE). search_path
-- includes extensions so the vector <=> operator resolves inside the function body.
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

ALTER TABLE public.bulls ADD COLUMN IF NOT EXISTS embedding extensions.vector(1536);

CREATE INDEX IF NOT EXISTS idx_bulls_embedding_hnsw
  ON public.bulls USING hnsw (embedding extensions.vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.search_bulls_semantic(
  query_embedding extensions.vector(1536),
  match_count integer DEFAULT 10,
  similarity_threshold float DEFAULT 0.3
)
RETURNS TABLE(
  id uuid,
  naab_code text,
  name text,
  breed text,
  company text,
  tpi numeric,
  nm_dollar numeric,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    b.id, b.naab_code, b.name, b.breed, b.company, b.tpi, b.nm_dollar,
    1 - (b.embedding <=> query_embedding) AS similarity
  FROM public.bulls b
  WHERE b.embedding IS NOT NULL
    AND 1 - (b.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY b.embedding <=> query_embedding
  LIMIT match_count;
$$;
