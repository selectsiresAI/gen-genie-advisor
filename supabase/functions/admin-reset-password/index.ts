import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// admin-reset-password: admin (Gabriely) informa o e-mail do usuário travado; o
// sistema reseta a senha via Admin API e retorna uma senha provisória para entregar.
// Sem SMTP / sem e-mail. Só admin (has_role) pode chamar.

const ALLOWED_ORIGINS = [
  "https://toolss-ssb.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];
function cors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
function tempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const buf = new Uint8Array(10);
  crypto.getRandomValues(buf);
  const body = Array.from(buf, (b) => chars[b % chars.length]).join("");
  return `ToolSS-${body}!`;
}

Deno.serve(async (req) => {
  const headers = { ...cors(req), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

    const URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } });

    // valida chamador + role admin
    const anon = createClient(URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsErr } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims?.sub) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers });
    const callerId = claims.claims.sub as string;
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: callerId, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Acesso restrito a admin" }), { status: 403, headers });

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email) return new Response(JSON.stringify({ error: "email obrigatório" }), { status: 400, headers });

    // resolve o usuário pelo e-mail (profiles.id = auth.users.id)
    const { data: prof } = await admin.from("profiles").select("id, email, full_name").ilike("email", email).maybeSingle();
    if (!prof) return new Response(JSON.stringify({ error: "Usuário não encontrado com esse e-mail" }), { status: 404, headers });

    const pwd = tempPassword();
    const { error: updErr } = await admin.auth.admin.updateUserById(prof.id, { password: pwd, email_confirm: true });
    if (updErr) throw updErr;

    console.log(`admin-reset-password: ${callerId} resetou ${email}`);
    return new Response(JSON.stringify({
      status: "ok",
      email: prof.email,
      full_name: prof.full_name,
      temporary_password: pwd,
      message: "Senha provisória gerada. Entregue ao usuário e peça para trocar no primeiro acesso.",
    }), { headers });
  } catch (err) {
    console.error("admin-reset-password error:", (err as Error)?.message);
    return new Response(JSON.stringify({ error: (err as Error)?.message ?? "Internal error" }), { status: 500, headers });
  }
});
