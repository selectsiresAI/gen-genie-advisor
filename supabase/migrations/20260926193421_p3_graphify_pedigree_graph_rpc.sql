-- P3 Graphify (applied, not just researched): pedigree is literally graph-shaped
-- (bull -> sire -> mgs -> mmgs chains via NAAB codes). This RPC walks the chain from a
-- given bull and returns real nodes/edges built from live bulls data, matching the
-- convention already used by search_bulls/get_bull_by_naab (SECURITY DEFINER, STABLE,
-- callable by any authenticated user — same access level as those).
CREATE OR REPLACE FUNCTION public.get_bull_pedigree_graph(p_naab_code text, p_depth integer DEFAULT 3)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nodes jsonb := '[]'::jsonb;
  edges jsonb := '[]'::jsonb;
  seen text[] := '{}';
  current_gen text[];
  next_gen text[];
  gen_num integer := 0;
  b record;
BEGIN
  p_depth := LEAST(GREATEST(p_depth, 1), 6);
  current_gen := ARRAY[p_naab_code];

  WHILE gen_num < p_depth AND array_length(current_gen, 1) > 0 LOOP
    next_gen := '{}';
    FOR b IN
      SELECT naab_code, name, breed, company, tpi, nm_dollar, sire_naab, mgs_naab, mmgs_naab
      FROM public.bulls
      WHERE naab_code = ANY(current_gen) AND NOT (naab_code = ANY(seen))
    LOOP
      seen := array_append(seen, b.naab_code);
      nodes := nodes || jsonb_build_object(
        'id', b.naab_code, 'name', b.name, 'breed', b.breed, 'company', b.company,
        'tpi', b.tpi, 'nm_dollar', b.nm_dollar, 'generation', gen_num
      );
      IF b.sire_naab IS NOT NULL THEN
        edges := edges || jsonb_build_object('source', b.naab_code, 'target', b.sire_naab, 'relation', 'sire');
        next_gen := array_append(next_gen, b.sire_naab);
      END IF;
      IF b.mgs_naab IS NOT NULL THEN
        edges := edges || jsonb_build_object('source', b.naab_code, 'target', b.mgs_naab, 'relation', 'mgs');
        next_gen := array_append(next_gen, b.mgs_naab);
      END IF;
      IF b.mmgs_naab IS NOT NULL THEN
        edges := edges || jsonb_build_object('source', b.naab_code, 'target', b.mmgs_naab, 'relation', 'mmgs');
        next_gen := array_append(next_gen, b.mmgs_naab);
      END IF;
    END LOOP;
    gen_num := gen_num + 1;
    current_gen := next_gen;
  END LOOP;

  RETURN jsonb_build_object('nodes', nodes, 'edges', edges, 'root', p_naab_code, 'depth', p_depth);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_bull_pedigree_graph(text, integer) TO authenticated, anon;
