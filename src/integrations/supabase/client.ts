import { createClient } from "@supabase/supabase-js";

const sanitizeUrl = (value?: string | null) => value?.replace(/\/$/, "");

const decodeJwtPayload = (token?: string | null): Record<string, any> | undefined => {
  if (!token) return undefined;
  const segments = token.split(".");
  if (segments.length < 2) return undefined;

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padding = base64.length % 4 ? "=".repeat(4 - (base64.length % 4)) : "";
    const normalized = `${base64}${padding}`;
    const globalAtob =
      typeof globalThis !== "undefined" && typeof (globalThis as { atob?: typeof atob }).atob === "function"
        ? (globalThis as { atob: typeof atob }).atob
        : undefined;

    if (globalAtob) {
      const decoded = globalAtob(normalized);
      return JSON.parse(decoded);
    }

    const globalBuffer =
      typeof globalThis !== "undefined" && typeof (globalThis as any).Buffer !== "undefined"
        ? (globalThis as any).Buffer
        : undefined;

    if (globalBuffer) {
      const decoded = globalBuffer.from(normalized, "base64").toString("utf-8");
      return JSON.parse(decoded);
    }
  } catch (error) {
    // Could not decode Supabase token payload
  }

  return undefined;
};

const getProjectRefFromAnonKey = (anonKey?: string | null) => {
  const payload = decodeJwtPayload(anonKey);
  const ref = payload?.ref || payload?.project_id;
  return typeof ref === "string" ? ref : undefined;
};

const envSupabaseUrl = sanitizeUrl(import.meta.env.VITE_SUPABASE_URL as string | undefined);
const envSupabaseAnonKey = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined)?.trim();

export const supabaseUrl = envSupabaseUrl ?? "https://odactdxpecpiyiyaqfgi.supabase.co";
export const supabaseAnonKey = envSupabaseAnonKey ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYWN0ZHhwZWNwaXlpeWFxZmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjQ4MTYsImV4cCI6MjA4ODkwMDgxNn0.1Ybzv5-oqg1yHu2W1vBRDHN23tj0YzN_AbwBJyKcrpY";

const IMPORT_BULLS_ENV_BASE = sanitizeUrl(import.meta.env.VITE_SUPABASE_IMPORT_BULLS_URL as string | undefined);

const deriveHostsFromSupabaseConfig = () => {
  const hosts: string[] = [];

  try {
    if (supabaseUrl) {
      const { host } = new URL(supabaseUrl);
      hosts.push(host);
    }
  } catch (error) {
    // Could not parse provided supabaseUrl
  }

  const projectRef = getProjectRefFromAnonKey(supabaseAnonKey);
  if (projectRef) {
    hosts.push(`${projectRef}.supabase.co`);
  }

  return Array.from(new Set(hosts.filter(Boolean)));
};

const deriveImportBullsBases = () => {
  const hosts = deriveHostsFromSupabaseConfig();

  const bases = hosts.flatMap((host) => {
    if (!host.endsWith(".supabase.co")) return [];

    const restBase = `https://${host}/functions/v1/import-bulls`;
    const edgeBase = `https://${host.replace(".supabase.co", ".functions.supabase.co")}/import-bulls`;
    return [edgeBase, restBase];
  });

  return Array.from(
    new Set(
      [sanitizeUrl(IMPORT_BULLS_ENV_BASE), ...bases.map((value) => sanitizeUrl(value))].filter(Boolean) as string[]
    )
  );
};

const importBullsBaseCandidates = deriveImportBullsBases();

export const importBullsFunctionBaseUrl = importBullsBaseCandidates[0];

export const getImportBullsFunctionUrl = (path = "") => {
  if (!importBullsFunctionBaseUrl) {
    throw new Error("URL base para importação de touros não configurada.");
  }

  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${importBullsFunctionBaseUrl}${suffix}`;
};

export const getImportBullsFunctionUrlCandidates = (path = "") => {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return importBullsBaseCandidates.map((base) => `${base}${suffix}`);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth-token',
  }
});
