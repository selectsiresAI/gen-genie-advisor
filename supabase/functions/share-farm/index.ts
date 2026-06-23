import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const farmId = String(body?.farm_id ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const role = String(body?.role ?? "viewer").trim();

    if (!farmId || !email) {
      return new Response(JSON.stringify({ error: "farm_id and email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["viewer", "editor", "technician"].includes(role)) {
      return new Response(JSON.stringify({ error: "invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller is owner/editor of that farm
    const { data: myMembership } = await admin
      .from("user_farms")
      .select("role")
      .eq("client_id", farmId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!myMembership || !["owner", "editor"].includes(myMembership.role)) {
      return new Response(JSON.stringify({ error: "Permission denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up profile by email (case-insensitive)
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();

    if (profile) {
      // Check existing membership
      const { data: existing } = await admin
        .from("user_farms")
        .select("id, role")
        .eq("client_id", farmId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ status: "already_member", role: existing.role }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: insErr } = await admin
        .from("user_farms")
        .insert({ user_id: profile.id, client_id: farmId, role });
      if (insErr) throw insErr;

      // Mark any pending invites for this email/farm as accepted
      await admin
        .from("farm_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("client_id", farmId)
        .ilike("invited_email", email)
        .eq("status", "pending");

      return new Response(JSON.stringify({ status: "granted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No profile — create or refresh pending invite
    const { data: existingInvite } = await admin
      .from("farm_invites")
      .select("id, status")
      .eq("client_id", farmId)
      .ilike("invited_email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return new Response(JSON.stringify({ status: "already_invited" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: invErr } = await admin
      .from("farm_invites")
      .insert({
        client_id: farmId,
        invited_email: email,
        invited_by: userId,
        role,
        status: "pending",
      });
    if (invErr) throw invErr;

    return new Response(JSON.stringify({ status: "invited" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("share-farm error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
