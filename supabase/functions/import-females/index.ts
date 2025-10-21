import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const action = segments[segments.length - 1];

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase environment variables");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const accessToken = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    console.error("Auth error", authError);
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (action === "upload") {
    try {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return jsonResponse({ error: "Arquivo inválido" }, 400);
      }

      const importBatchId = crypto.randomUUID();

      return jsonResponse({ import_batch_id: importBatchId, received_bytes: file.size });
    } catch (error) {
      console.error("Upload handler error", error);
      return jsonResponse({ error: "Erro ao processar upload" }, 500);
    }
  }

  if (action === "commit") {
    try {
      const { import_batch_id: importBatchId } = await req.json();

      if (!importBatchId) {
        return jsonResponse({ error: "import_batch_id é obrigatório" }, 400);
      }

      return jsonResponse({ status: "queued", import_batch_id: importBatchId });
    } catch (error) {
      console.error("Commit handler error", error);
      return jsonResponse({ error: "Erro ao processar commit" }, 500);
    }
  }

  return jsonResponse({ error: "Not found" }, 404);
});
