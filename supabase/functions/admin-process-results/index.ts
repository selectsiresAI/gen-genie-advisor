import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const platformDb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: verify admin user
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    ).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: userRole } = await platformDb
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!userRole || userRole.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // ============================
    // GET /admin-process-results/orders
    // ============================
    if (req.method === "GET" && action === "orders") {
      // Get orders from Platform with file paths
      const { data: orders, error } = await platformDb
        .from("service_orders")
        .select("id, ordem_servico_ssgen, nome_produto, etapa_atual, client_id, result_file_path, numero_amostras, liberacao_n_amostras, created_at")
        .not("result_file_path", "is", null)
        .is("deleted_at", null)
        .order("ordem_servico_ssgen", { ascending: false });

      if (error) throw error;

      // Get client names from Platform
      const clientIds = [...new Set((orders ?? []).map((o: { client_id: string }) => o.client_id).filter(Boolean))];
      let clientMap: Record<string, string> = {};
      if (clientIds.length > 0) {
        const { data: clients } = await platformDb
          .from("clients")
          .select("id, nome")
          .in("id", clientIds);
        clientMap = Object.fromEntries((clients ?? []).map((c: { id: string; nome: string }) => [c.id, c.nome]));
      }

      // Check which are already processed (have genomic_results in Platform)
      const { data: processed } = await platformDb
        .from("genomic_results")
        .select("service_order_id")
        .not("service_order_id", "is", null);

      const processedMap: Record<string, number> = {};
      for (const p of (processed ?? [])) {
        const soId = p.service_order_id as string;
        processedMap[soId] = (processedMap[soId] ?? 0) + 1;
      }

      const enriched = (orders ?? []).map((o: Record<string, unknown>) => ({
        ...o,
        client_name: clientMap[o.client_id as string] ?? "Desconhecido",
        processed_count: processedMap[o.id as string] ?? 0,
        is_processed: (processedMap[o.id as string] ?? 0) > 0,
      }));

      return new Response(JSON.stringify({ data: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================
    // POST /admin-process-results/process
    // ============================
    if (req.method === "POST" && action === "process") {
      const body = await req.json();
      const { service_order_id, file_path, client_id } = body as {
        service_order_id: string;
        file_path: string;
        client_id: string;
      };

      if (!file_path || !client_id) {
        return new Response(JSON.stringify({ error: "file_path and client_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Call ingest-results on SSGEN Client
      const ssgenClientUrl = Deno.env.get("SSGEN_CLIENT_URL")!;
      const ssgenClientKey = Deno.env.get("SSGEN_CLIENT_SERVICE_ROLE_KEY")!;

      const ingestResp = await fetch(`${ssgenClientUrl}/functions/v1/ingest-results`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ssgenClientKey}`,
          "Content-Type": "application/json",
          "apikey": ssgenClientKey,
        },
        body: JSON.stringify({ file_path, service_order_id, client_id }),
      });

      const result = await ingestResp.json();

      if (!ingestResp.ok) {
        return new Response(JSON.stringify({
          error: result.error ?? "Processing failed",
          status: ingestResp.status,
        }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        ...result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================
    // POST /admin-process-results/upload
    // ============================
    if (req.method === "POST" && action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const serviceOrderId = formData.get("service_order_id") as string | null;

      if (!file || !serviceOrderId) {
        return new Response(JSON.stringify({ error: "file and service_order_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload to Platform storage
      const storagePath = `${serviceOrderId}/${file.name}`;
      const { error: uploadErr } = await platformDb.storage
        .from("order-results")
        .upload(storagePath, file, { upsert: true });

      if (uploadErr) {
        return new Response(JSON.stringify({ error: `Upload failed: ${uploadErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update service order in Platform
      await platformDb
        .from("service_orders")
        .update({
          result_file_path: storagePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceOrderId);

      // Get client_id for this order
      const { data: so } = await platformDb
        .from("service_orders")
        .select("client_id")
        .eq("id", serviceOrderId)
        .single();

      return new Response(JSON.stringify({
        success: true,
        file_path: storagePath,
        client_id: so?.client_id,
        service_order_id: serviceOrderId,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use /orders, /process, or /upload" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[admin-process-results] unhandled exception:", err);
    try {
      const logClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await logClient.from("app_logs").insert({
        level: "error",
        source: "admin-process-results",
        message: "unhandled exception",
        context: { message: (err as Error).message },
      });
    } catch (_e) {
      // swallow — logging must never break the response
    }
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
