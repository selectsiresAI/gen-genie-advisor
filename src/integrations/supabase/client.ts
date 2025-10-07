import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? (globalThis as any).__SB_URL__;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? (globalThis as any).__SB_KEY__;

if (!supabaseUrl || !supabaseAnonKey) {
  // Evita crash silencioso
  console.warn(
    "[Supabase] Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes."
  );
}
