import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// deliver-results: ao processar o resultado de uma OS, reconhece o cliente e os
// técnicos/users da fazenda e registra a entrega em result_notifications (cliente
// = área SSGEN; technician = ToolSS). GATILHO DE ENTREGA.
//
// SEGURANÇA: DESLIGADO por padrão. Só grava/entrega se RESULT_DELIVERY_ENABLED='true'.
//   - dry_run=true  -> resolve os destinatários e retorna, SEM gravar (testável off).
//   - disabled + !dry_run -> não faz nada (skipped).
// O trigger automático NÃO está instalado — ligar é comando do Diego.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ENABLED = (Deno.env.get("RESULT_DELIVERY_ENABLED") ?? "false").toLowerCase() === "true";
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;
    let clientId = String(body?.client_id ?? "").trim();
    const osSsgen = body?.ordem_servico_ssgen ?? null;
    const serviceOrderId = String(body?.service_order_id ?? "").trim();

    // resolve o cliente pela OS quando não veio client_id
    let serviceOrder: { id: string; client_id: string; ordem_servico_ssgen: number | null } | null = null;
    if (!clientId && (serviceOrderId || osSsgen != null)) {
      const q = admin.from("service_orders").select("id, client_id, ordem_servico_ssgen").is("deleted_at", null);
      const { data: so } = serviceOrderId
        ? await q.eq("id", serviceOrderId).maybeSingle()
        : await q.eq("ordem_servico_ssgen", osSsgen).order("id").limit(1).maybeSingle();
      serviceOrder = so as typeof serviceOrder;
      clientId = serviceOrder?.client_id ?? "";
    }
    if (!clientId) return json({ error: "client_id ou ordem_servico_ssgen obrigatório" }, 400);

    // cliente (área SSGEN) + owner_name
    const { data: client } = await admin
      .from("clients").select("id, nome, owner_name, email").eq("id", clientId).is("deleted_at", null).maybeSingle();
    if (!client) return json({ error: "Cliente não encontrado" }, 404);

    // técnicos/users da fazenda (ToolSS) — busca em 2 passos (embed não é confiável)
    const { data: techLinks } = await admin
      .from("user_farms").select("user_id, role")
      .eq("client_id", clientId).in("role", ["technician", "owner", "editor"]);
    const techIds = [...new Set((techLinks ?? []).map((l: { user_id: string }) => l.user_id))];
    const profById: Record<string, { email?: string; full_name?: string }> = {};
    if (techIds.length) {
      const { data: profs } = await admin.from("profiles").select("id, email, full_name").in("id", techIds);
      for (const p of (profs ?? []) as Array<{ id: string; email?: string; full_name?: string }>) profById[p.id] = p;
    }

    type Rec = { recipient_type: string; recipient_email: string | null; recipient_name: string | null; recipient_profile_id: string | null };
    const recipients: Rec[] = [];
    if (client.email) {
      recipients.push({ recipient_type: "client", recipient_email: client.email, recipient_name: client.owner_name ?? client.nome, recipient_profile_id: null });
    }
    for (const id of techIds) {
      const p = profById[id];
      recipients.push({ recipient_type: "technician", recipient_email: p?.email ?? null, recipient_name: p?.full_name ?? null, recipient_profile_id: id });
    }

    const summary = {
      client: { id: client.id, nome: client.nome, email: client.email },
      service_order_id: serviceOrder?.id ?? (serviceOrderId || null),
      recipients_count: recipients.length,
      recipients: recipients.map((r) => ({ type: r.recipient_type, email: r.recipient_email, name: r.recipient_name })),
    };

    if (!ENABLED) return json({ status: "skipped", reason: "delivery disabled (RESULT_DELIVERY_ENABLED!=true)", ...summary });
    if (dryRun) return json({ status: "dry_run", ...summary });

    // ENTREGA REAL: grava result_notifications (idempotente por OS+email)
    const rows = recipients.filter((r) => r.recipient_email).map((r) => ({
      service_order_id: serviceOrder?.id ?? (serviceOrderId || null),
      recipient_type: r.recipient_type,
      recipient_email: r.recipient_email,
      recipient_name: r.recipient_name,
      recipient_profile_id: r.recipient_profile_id,
      notified_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error: insErr } = await admin.from("result_notifications").insert(rows);
      if (insErr) throw insErr;
    }
    // (envio de e-mail real fica para a integração de e-mail — aqui registra a entrega)
    return json({ status: "delivered", inserted: rows.length, ...summary });
  } catch (err) {
    console.error("deliver-results error:", (err as Error)?.message);
    return json({ error: (err as Error)?.message ?? "Internal error" }, 500);
  }
});
