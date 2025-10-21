import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";

const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not configured for server-side usage");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
