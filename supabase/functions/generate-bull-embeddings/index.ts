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
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: claimsData.claims.sub, _role: 'admin',
    });
    if (roleError || !isAdmin) {
      return jsonResponse(req, { error: 'Admin access required' }, 403);
    }

    const bodyText = await req.text();
    const body = bodyText.trim() ? JSON.parse(bodyText) : {};
    const requestedSize = body?.batch_size ?? 100;
    if (typeof requestedSize !== 'number' || !Number.isInteger(requestedSize) || requestedSize < 1) {
      return jsonResponse(req, { error: 'batch_size deve ser um inteiro positivo' }, 400);
    }
    const batch_size = Math.min(requestedSize, 500);
    const { data: bulls, error: selectError } = await supabase
      .from('bulls')
      .select('id, naab_code, name, breed, company, sire_naab, mgs_naab, mmgs_naab, pedigree')
      .is('embedding', null)
      .limit(batch_size);
    if (selectError) throw selectError;

    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (bulls?.length && !LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    for (const bull of bulls ?? []) {
      try {
        // Only add pedigree labels when there is actual content to embed.
        const identity = [bull.name, bull.naab_code, bull.breed, bull.company]
          .map(value => String(value ?? '').trim()).filter(Boolean).join(' ');
        const pedigree = [
          String(bull.pedigree ?? '').trim(),
          bull.sire_naab?.trim() ? `sire ${bull.sire_naab.trim()}` : '',
          bull.mgs_naab?.trim() ? `mgs ${bull.mgs_naab.trim()}` : '',
          bull.mmgs_naab?.trim() ? `mmgs ${bull.mmgs_naab.trim()}` : '',
        ].filter(Boolean).join(' ');
        const input = `${identity} ${pedigree ? `pedigree: ${pedigree}` : ''}`.trim();
        if (!input) {
          skipped++;
          continue;
        }

        const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: 'openai/text-embedding-3-small', input }),
        });
        if (response.status !== 200) {
          throw new Error(`AI Gateway returned ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        const vector = data?.data?.[0]?.embedding;
        if (!Array.isArray(vector) || vector.length !== 1536 ||
          !vector.every(value => typeof value === 'number' && Number.isFinite(value))) {
          throw new Error('AI Gateway returned an invalid embedding');
        }
        const { error: updateError } = await supabase.from('bulls')
          .update({ embedding: JSON.stringify(vector) }).eq('id', bull.id);
        if (updateError) throw updateError;
        succeeded++;
      } catch (error) {
        console.error('Error generating embedding for bull:', bull.id, error);
        failed++;
      }
    }

    const { count: remaining, error: countError } = await supabase.from('bulls')
      .select('*', { count: 'exact', head: true }).is('embedding', null);
    if (countError) throw countError;
    if (remaining === null) throw new Error('Não foi possível contar os touros pendentes');
    if (!bulls?.length && remaining === 0) {
      return jsonResponse(req, { message: 'Nenhum touro pendente de embedding', processed: 0, remaining: 0 });
    }
    return jsonResponse(req, {
      processed: bulls?.length ?? 0, succeeded, failed, skipped, remaining,
      message: remaining > 0
        ? `Ainda restam ${remaining} touros pendentes. Chame a função novamente para continuar.`
        : 'Processamento concluído. Nenhum touro pendente de embedding.',
    });
  } catch (error) {
    console.error('Error in generate-bull-embeddings function:', error);
    try {
      await supabase.from('app_logs').insert({
        level: 'error', source: 'generate-bull-embeddings', message: 'unhandled exception',
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
