import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserData {
  email: string;
  password: string;
  full_name: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
