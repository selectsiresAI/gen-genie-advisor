import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Versões vigentes dos dois documentos. Mudou o texto => subir aqui e em src/lib/privacy/index.ts
// (todos passam a ver a tela de aceite de novo).
const VERSIONS = { policy: "1.0", terms: "1.0" } as const;
type Doc = keyof typeof VERSIONS;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "não autenticado" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: auth, error: authErr } = await db.auth.getUser(jwt);
  const user = auth?.user;
  if (authErr || !user) return json({ error: "sessão inválida" }, 401);

  const body = await req.json().catch(() => ({})) as {
    action?: string; hashes?: Record<string, string>; versions?: Record<string, string>; locale?: string; source?: string; client_id?: string;
  };
  const action = body.action ?? "status";

  const status = async () => {
    const { data: rows } = await db
      .from("toolss_privacy_consents")
      .select("doc, doc_version, accepted_at")
      .eq("user_id", user.id)
      .order("accepted_at", { ascending: false })
      .limit(100);
    const list = rows ?? [];
    const at = (doc: Doc) => list.find((r) => r.doc === doc && r.doc_version === VERSIONS[doc])?.accepted_at ?? null;
    const policyAt = at("policy");
    const termsAt = at("terms");
    return {
      versions: VERSIONS,
      accepted: !!policyAt && !!termsAt,
      policy_accepted_at: policyAt,
      terms_accepted_at: termsAt,
    };
  };

  if (action === "status") return json(await status());

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const ua = req.headers.get("user-agent");
  const common = {
    user_id: user.id,
    user_email: user.email ?? null,
    ip,
    user_agent: ua ? ua.slice(0, 400) : null,
    locale: typeof body.locale === "string" ? body.locale.slice(0, 10) : null,
  };

  if (action === "accept") {
    // os dois documentos, cada um na sua versão vigente
    for (const doc of Object.keys(VERSIONS) as Doc[]) {
      if (body.versions?.[doc] !== VERSIONS[doc]) return json({ error: "versão dos documentos desatualizada, recarregue a página" }, 409);
    }
    const source = typeof body.source === "string" ? body.source.slice(0, 30) : "login-gate";
    const rows = (Object.keys(VERSIONS) as Doc[]).map((doc) => ({
      ...common, doc, doc_version: VERSIONS[doc], doc_hash: typeof body.hashes?.[doc] === "string" ? body.hashes[doc].slice(0, 128) : null, source,
    }));
    const { error } = await db.from("toolss_privacy_consents").insert(rows);
    if (error) return json({ error: error.message }, 500);
    return json(await status());
  }

  if (action === "farm_authorization") {
    const st = await status();
    if (!st.accepted) return json({ error: "aceite os documentos primeiro" }, 400);
    if (!body.client_id) return json({ error: "fazenda não informada" }, 400);
    // só quem tem vínculo com a fazenda registra a confirmação dela
    const { data: link } = await db.from("user_farms").select("client_id").eq("user_id", user.id).eq("client_id", body.client_id).maybeSingle();
    if (!link) return json({ error: "sem vínculo com esta fazenda" }, 403);
    const { error } = await db.from("toolss_farm_authorizations").insert({ ...common, client_id: body.client_id, terms_version: VERSIONS.terms });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "ação inválida" }, 400);
});
