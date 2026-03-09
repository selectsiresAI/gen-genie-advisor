import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

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

interface UserData {
  email: string;
  password: string;
  full_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Validate JWT token
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: claimsData.claims.sub, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const { users } = await req.json() as { users: UserData[] };

    if (!users || !Array.isArray(users)) {
      throw new Error("Invalid request: users array is required");
    }

    const results = [];

    for (const userData of users) {
      try {
        // Create the auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
          },
        });

        if (authError) {
          console.error(`Error creating user ${userData.email}:`, authError);
          results.push({
            email: userData.email,
            success: false,
            error: authError.message,
          });
          continue;
        }

        // Update or create profile with full name
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: userData.full_name,
            email: userData.email,
          });

        if (profileError) {
          console.error(`Error updating profile for ${userData.email}:`, profileError);
          results.push({
            email: userData.email,
            success: false,
            error: `User created but profile update failed: ${profileError.message}`,
          });
          continue;
        }

        results.push({
          email: userData.email,
          success: true,
          user_id: authData.user.id,
        });
      } catch (error: any) {
        console.error(`Unexpected error for ${userData.email}:`, error);
        results.push({
          email: userData.email,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
