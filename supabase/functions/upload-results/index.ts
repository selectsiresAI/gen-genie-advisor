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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: verify user or service_role
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    ).auth.getUser(token);

    // Allow service_role calls (token == service_role key) or authenticated users
    const isServiceRole = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!user && !isServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // ============================
    // GET /upload-results/orders — List service orders with files ready for processing
    // ============================
    if (req.method === "GET" && action === "orders") {
      const { data: orders, error } = await supabase
        .from("service_orders")
        .select("id, ordem_servico_ssgen, nome_produto, etapa_atual, client_id, result_file_path, numero_amostras, liberacao_n_amostras, created_at")
        .not("result_file_path", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with client names
      const clientIds = [...new Set((orders ?? []).map((o: { client_id: string }) => o.client_id).filter(Boolean))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, nome")
        .in("id", clientIds);

      const clientMap = Object.fromEntries((clients ?? []).map((c: { id: string; nome: string }) => [c.id, c.nome]));

      const enriched = (orders ?? []).map((o: Record<string, unknown>) => ({
        ...o,
        client_name: clientMap[o.client_id as string] ?? "Desconhecido",
      }));

      return new Response(JSON.stringify({ data: enriched }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================
    // POST /upload-results/upload — Upload a result file to storage
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

      // Verify service order exists
      const { data: so, error: soErr } = await supabase
        .from("service_orders")
        .select("id, client_id")
        .eq("id", serviceOrderId)
        .single();

      if (soErr || !so) {
        return new Response(JSON.stringify({ error: "Service order not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upload to storage
      const storagePath = `${serviceOrderId}/${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("order-results")
        .upload(storagePath, file, { upsert: true });

      if (uploadErr) {
        return new Response(JSON.stringify({ error: `Upload failed: ${uploadErr.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update service order with file path
      await supabase
        .from("service_orders")
        .update({
          result_file_path: storagePath,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceOrderId);

      // Auto-trigger ingest-results on SSGEN Client after successful upload
      const ssgenClientUrl = Deno.env.get("SSGEN_CLIENT_URL");
      const ssgenClientKey = Deno.env.get("SSGEN_CLIENT_SERVICE_ROLE_KEY");

      let ingestResult = null;
      let ingestError = null;

      if (ssgenClientUrl && ssgenClientKey) {
        try {
          const ingestResp = await fetch(`${ssgenClientUrl}/functions/v1/ingest-results`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${ssgenClientKey}`,
              "Content-Type": "application/json",
              "apikey": ssgenClientKey,
            },
            body: JSON.stringify({
              file_path: storagePath,
              service_order_id: serviceOrderId,
              client_id: so.client_id,
            }),
          });

          ingestResult = await ingestResp.json();

          if (!ingestResp.ok) {
            ingestError = ingestResult.error ?? `Ingest returned ${ingestResp.status}`;
            console.error(`[upload-results] Auto-ingest failed for OS ${serviceOrderId}: ${ingestError}`);
          } else {
            console.log(`[upload-results] Auto-ingest OK for OS ${serviceOrderId}: ${ingestResult.genomic_results_inserted} results`);

            // Log the processing in audit
            await supabase
              .from("order_audit_log")
              .insert({
                order_id: serviceOrderId,
                field_name: "results_processed",
                old_value: null,
                new_value: JSON.stringify({
                  genomic_results_inserted: ingestResult.genomic_results_inserted,
                  females_proofs_updated: ingestResult.females_proofs_updated,
                  file_path: storagePath,
                }),
                changed_by: user?.id ?? null,
                user_email: user?.email ?? "service_role",
                changed_at: new Date().toISOString(),
              });
          }
        } catch (err) {
          ingestError = (err as Error).message;
          console.error(`[upload-results] Auto-ingest exception: ${ingestError}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        file_path: storagePath,
        client_id: so.client_id,
        service_order_id: serviceOrderId,
        ingest: ingestResult ? {
          genomic_results_inserted: ingestResult.genomic_results_inserted,
          females_proofs_updated: ingestResult.females_proofs_updated,
        } : null,
        ingest_error: ingestError,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================
    // POST /upload-results/process — Trigger ingest-results on SSGEN Client
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

      // Call ingest-results on SSGEN Client project
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
        return new Response(JSON.stringify({ error: result.error ?? "Ingest failed", status: ingestResp.status }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Log the processing in Tracker
      await supabase
        .from("order_audit_log")
        .insert({
          order_id: service_order_id,
          field_name: "results_processed",
          old_value: null,
          new_value: JSON.stringify({
            genomic_results_inserted: result.genomic_results_inserted,
            females_proofs_updated: result.females_proofs_updated,
            file_path,
          }),
          changed_by: user?.id ?? null,
          user_email: user?.email ?? "service_role",
          changed_at: new Date().toISOString(),
        });

      return new Response(JSON.stringify({
        success: true,
        ...result,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action. Use /orders, /upload, or /process" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
