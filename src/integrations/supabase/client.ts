import { createClient } from "@supabase/supabase-js";

const sanitizeUrl = (value?: string | null) => value?.replace(/\/$/, "");

const envSupabaseUrl = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const envSupabaseAnonKey = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined)?.trim();

export const supabaseUrl = envSupabaseUrl ?? "https://gzvweejdtycxzxrjplpc.supabase.co";
export const supabaseAnonKey = envSupabaseAnonKey ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dndlZWpkdHljeHp4cmpwbHBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NDgzMDIsImV4cCI6MjA3NDEyNDMwMn0.-1zb66szqJj5jf5rIrU8H3EzQb9p-5X91G3ZePnX9FQ";

const IMPORT_BULLS_ENV_BASE = sanitizeUrl(import.meta.env.VITE_SUPABASE_IMPORT_BULLS_URL as string | undefined);

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

const REST_FUNCTIONS_BASE = supabaseUrl
  ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/import-bulls`
  : undefined;

const FALLBACK_IMPORT_BULLS_BASE = "https://gzvweejdtycxzxrjplpc.functions.supabase.co/import-bulls";

const importBullsBaseCandidates = Array.from(
  new Set(
    [
      IMPORT_BULLS_ENV_BASE,
      DEFAULT_IMPORT_BULLS_BASE,
      sanitizeUrl(REST_FUNCTIONS_BASE),
      FALLBACK_IMPORT_BULLS_BASE
    ].filter(Boolean) as string[]
  )
);

export const importBullsFunctionBaseUrl = importBullsBaseCandidates[0];

export const getImportBullsFunctionUrl = (path = "") => {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${importBullsFunctionBaseUrl}${suffix}`;
};

export const getImportBullsFunctionUrlCandidates = (path = "") => {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return importBullsBaseCandidates.map((base) => `${base}${suffix}`);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
