import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// link-farm-by-tag: o técnico (user ToolSS) digita a TAG curta (cod_ssgen) que a
// Gabriely forneceu; o sistema resolve a fazenda pelo uuid canônico e vincula o
// técnico (role=technician). Registra tudo em farm_link_audit.
// TAG PURA (sem convite) — decisão do Diego 27/08/2026.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  let userId = "";
  let userEmail: string | null = null;
  let tag = "";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    userId = claimsData.claims.sub as string;
    userEmail = (claimsData.claims.email as string) ?? null;

    const body = await req.json().catch(() => ({}));
    tag = String(body?.tag ?? "").trim();
    if (!tag) return json({ error: "tag obrigatória" }, 400);

    // resolve a tag -> cliente canônico (Platform)
    const { data: client } = await admin
      .from("clients")
      .select("id, nome, owner_name, farm_name, cod_ssgen")
      .eq("cod_ssgen", tag)
      .is("deleted_at", null)
      .maybeSingle();

    if (!client) {
      await admin.from("farm_link_audit").insert({
        user_id: userId, user_email: userEmail, tag, result: "tag_not_found",
      });
      return json({ error: "Tag não encontrada. Confirme o código com a Gabriely." }, 404);
    }

    // NORMALIZAÇÃO: puxa o cadastro canônico do Tracker (mesmo uuid) e atualiza o Platform.
    const TRACKER_URL = Deno.env.get("TRACKER_URL");
    const TRACKER_SR = Deno.env.get("TRACKER_SERVICE_ROLE_KEY");
    if (TRACKER_URL && TRACKER_SR) {
      try {
        const tracker = createClient(TRACKER_URL, TRACKER_SR);
        const { data: tc } = await tracker
          .from("clients")
          .select("nome, email, cpf_cnpj, cidade, estado, representante, coordenador")
          .eq("id", client.id)
          .is("deleted_at", null)
          .maybeSingle();
        if (tc) {
          const patch: Record<string, unknown> = {};
          if (tc.email) patch.email = tc.email;
          if (tc.nome) patch.nome = tc.nome;
          if (tc.cidade) patch.cidade = tc.cidade;
          if (tc.estado) patch.estado = tc.estado;
          if (tc.cpf_cnpj != null) patch.cpf_cnpj = String(tc.cpf_cnpj);
          if (Object.keys(patch).length) {
            await admin.from("clients").update(patch).eq("id", client.id);
            Object.assign(client, patch);
          }
        }
      } catch (syncErr) {
        console.error("tracker sync warn:", (syncErr as Error)?.message);
      }
    }

    // já vinculado?
    const { data: existing } = await admin
      .from("user_farms")
      .select("id, role")
      .eq("client_id", client.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await admin.from("farm_link_audit").insert({
        user_id: userId, user_email: userEmail, client_id: client.id, tag,
        result: "already_linked", detail: existing.role,
      });
      return json({
        status: "already_linked", role: existing.role,
        farm: { id: client.id, nome: client.nome, tag },
      });
    }

    // cria o vínculo como técnico
    const { error: insErr } = await admin
      .from("user_farms")
      .insert({ user_id: userId, client_id: client.id, role: "technician" });
    if (insErr) throw insErr;

    // contagem de fêmeas ativas (resumo)
    const { count: femeas } = await admin
      .from("females")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id)
      .is("deleted_at", null);

    await admin.from("farm_link_audit").insert({
      user_id: userId, user_email: userEmail, client_id: client.id, tag, result: "linked",
    });

    return json({
      status: "linked",
      farm: {
        id: client.id,
        nome: client.nome,
        owner_name: client.owner_name,
        farm_name: client.farm_name,
        email: (client as Record<string, unknown>).email ?? null,
        tag,
        femeas: femeas ?? 0,
      },
    });
  } catch (err) {
    const msg = (err as Error)?.message ?? "Internal error";
    try {
      await admin.from("farm_link_audit").insert({
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        user_email: userEmail, tag, result: "error", detail: msg,
      });
    } catch (_) { /* ignore */ }
    console.error("link-farm-by-tag error:", msg);
    return json({ error: msg }, 500);
  }
});
