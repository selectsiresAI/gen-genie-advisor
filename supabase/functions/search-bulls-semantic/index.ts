import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const ALLOWED_ORIGINS = [
  'https://toolss-ssb.lovable.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse(req, { error: 'Unauthorized' }, 401);
    }
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return jsonResponse(req, { error: 'Invalid token' }, 401);
    }

    const bodyText = await req.text();
    const body = bodyText.trim() ? JSON.parse(bodyText) : {};
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    if (!query) return jsonResponse(req, { error: 'query é obrigatória' }, 400);
    const requestedCount = body?.match_count ?? 10;
    if (typeof requestedCount !== 'number' || !Number.isInteger(requestedCount) || requestedCount < 1) {
      return jsonResponse(req, { error: 'match_count deve ser um inteiro positivo' }, 400);
    }
    const match_count = Math.min(requestedCount, 50);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    let vector: number[];
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: query }),
      });
      if (response.status !== 200) {
        throw new Error(`AI Gateway returned ${response.status}: ${await response.text()}`);
      }
      const data = await response.json();
      vector = data?.data?.[0]?.embedding;
      if (!Array.isArray(vector) || vector.length !== 1536 ||
        !vector.every(value => typeof value === 'number' && Number.isFinite(value))) {
        throw new Error('AI Gateway returned an invalid embedding');
      }
    } catch (error) {
      console.error('Error generating search embedding:', error);
      const message = error instanceof Error ? error.message : String(error);
      try {
        await supabase.from('app_logs').insert({
          level: 'error', source: 'search-bulls-semantic', message: 'embedding request failed',
          context: { message },
        });
      } catch (_e) {
        // swallow — logging must never break the response
      }
      return jsonResponse(req, { error: message }, 502);
    }

    const { data: results, error: rpcError } = await supabase.rpc('search_bulls_semantic', {
      query_embedding: JSON.stringify(vector), match_count,
    });
    if (rpcError) throw rpcError;
    return jsonResponse(req, { results });
  } catch (error) {
    console.error('Error in search-bulls-semantic function:', error);
    try {
      await supabase.from('app_logs').insert({
        level: 'error', source: 'search-bulls-semantic', message: 'unhandled exception',
        context: { message: error instanceof Error ? error.message : String(error) },
      });
    } catch (_e) {
      // swallow — logging must never break the response
    }
    return jsonResponse(req, {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error instanceof Error ? error.stack : undefined,
    }, 500);
  }
});
