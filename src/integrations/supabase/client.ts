import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://gzvweejdtycxzxrjplpc.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dndlZWpkdHljeHp4cmpwbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDgzMDIsImV4cCI6MjA3NDEyNDMwMn0.-1zb66szqJj5jf5rIrU8H3EzQb9p-5X91G3ZePnX9FQ";

const IMPORT_BULLS_ENV_BASE = (import.meta.env.VITE_SUPABASE_IMPORT_BULLS_URL as string | undefined)?.replace(/\/$/, "");

const deriveFunctionsBase = () => {
  try {
    const { host } = new URL(supabaseUrl);
    if (host.endsWith(".supabase.co")) {
      return `https://${host.replace(".supabase.co", ".functions.supabase.co")}`;
    }
  } catch (error) {
    console.warn("Não foi possível derivar o domínio das edge functions a partir do supabaseUrl", error);
  }
  return undefined;
};

const FUNCTIONS_BASE_ORIGIN = IMPORT_BULLS_ENV_BASE
  ? undefined
  : deriveFunctionsBase();

const DEFAULT_IMPORT_BULLS_BASE = FUNCTIONS_BASE_ORIGIN
  ? `${FUNCTIONS_BASE_ORIGIN}/import-bulls`
  : undefined;

const FALLBACK_IMPORT_BULLS_BASE = "https://gzvweejdtycxzxrjplpc.functions.supabase.co/import-bulls";

export const importBullsFunctionBaseUrl = (IMPORT_BULLS_ENV_BASE || DEFAULT_IMPORT_BULLS_BASE || FALLBACK_IMPORT_BULLS_BASE).replace(/\/$/, "");

export const getImportBullsFunctionUrl = (path = "") => {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${importBullsFunctionBaseUrl}${suffix}`;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
