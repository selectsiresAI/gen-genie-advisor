import { supabase, supabaseAnonKey, supabaseUrl } from "@/integrations/supabase/client";
import { PRIVACY_TEXTS, type PrivacyLocale } from "./texts";

// Versões vigentes dos dois documentos. Mudou o texto => subir aqui e em
// supabase/functions/toolss-privacy-consent/index.ts (todos passam a ver a tela de aceite de novo).
export const PRIVACY_VERSIONS = { policy: "1.0", terms: "1.0" } as const;
export const PRIVACY_EFFECTIVE = "2026-10-14";

export type PrivacyDoc = keyof typeof PRIVACY_VERSIONS;

export type DocBlock =
  | { type: "p"; key: string }
  | { type: "ul"; keys: string[] }
  | { type: "table"; head: [string, string]; rows: [string, string][] };

export interface DocSection {
  title: string;
  blocks: DocBlock[];
}

const rows = (prefix: string, n: number): [string, string][] =>
  Array.from({ length: n }, (_, i) => [`${prefix}.r${i + 1}.a`, `${prefix}.r${i + 1}.b`]);
const list = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}.l${i + 1}`);
const para = (prefix: string, n = 1): DocBlock[] => Array.from({ length: n }, (_, i) => ({ type: "p", key: `${prefix}.p${i + 1}` }));

export const POLICY_SECTIONS: DocSection[] = [
  { title: "p1.title", blocks: para("p1", 2) },
  { title: "p2.title", blocks: para("p2") },
  { title: "p3.title", blocks: [{ type: "table", head: ["th.group", "th.what"], rows: rows("p3", 4) }] },
  { title: "p4.title", blocks: para("p4") },
  { title: "p5.title", blocks: [{ type: "table", head: ["th.purpose", "th.base"], rows: rows("p5", 4) }] },
  { title: "p6.title", blocks: para("p6") },
  { title: "p7.title", blocks: [{ type: "table", head: ["th.who", "th.why"], rows: rows("p7", 4) }, ...para("p7")] },
  { title: "p8.title", blocks: para("p8") },
  { title: "p9.title", blocks: para("p9") },
  { title: "p10.title", blocks: [{ type: "ul", keys: list("p10", 4) }, ...para("p10")] },
  { title: "p11.title", blocks: para("p11") },
  { title: "p12.title", blocks: para("p12") },
  { title: "p13.title", blocks: para("p13") },
];

export const TERMS_SECTIONS: DocSection[] = [
  { title: "t1.title", blocks: para("t1") },
  { title: "t2.title", blocks: para("t2") },
  { title: "t3.title", blocks: [{ type: "ul", keys: list("t3", 2) }] },
  { title: "t4.title", blocks: [{ type: "ul", keys: list("t4", 4) }] },
  { title: "t5.title", blocks: para("t5") },
  { title: "t6.title", blocks: [{ type: "ul", keys: list("t6", 2) }] },
  { title: "t7.title", blocks: para("t7") },
  { title: "t8.title", blocks: para("t8") },
  { title: "t9.title", blocks: para("t9") },
  { title: "t10.title", blocks: para("t10") },
  { title: "t11.title", blocks: para("t11") },
];

/** Tradução dos textos de privacidade (independente do dicionário geral do app). */
export function ptx(locale: string, key: string, vars?: Record<string, string | number>): string {
  const lang = (PRIVACY_TEXTS as Record<string, Record<string, string>>)[locale] ?? PRIVACY_TEXTS["pt-BR"];
  let out = lang[key] ?? PRIVACY_TEXTS["pt-BR"][key] ?? key;
  for (const [k, v] of Object.entries(vars ?? {})) out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v));
  return out;
}

export type { PrivacyLocale };

export interface PrivacyStatus {
  versions: Record<PrivacyDoc, string>;
  accepted: boolean;
  policy_accepted_at: string | null;
  terms_accepted_at: string | null;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const res = await fetch(`${supabaseUrl}/functions/v1/toolss-privacy-consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}`, apikey: supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json as T;
}

export const privacyApi = {
  status: () => call<PrivacyStatus>({ action: "status" }),
  accept: (args: { locale: string; hashes: Record<PrivacyDoc, string> }) =>
    call<PrivacyStatus>({ action: "accept", versions: PRIVACY_VERSIONS, source: "login-gate", ...args }),
  farmAuthorization: (clientId: string, locale: string) => call<{ ok: boolean }>({ action: "farm_authorization", client_id: clientId, locale }),
};

/** "impressão digital" do texto do documento no idioma exibido (prova do que foi aceito) */
export async function docHash(doc: PrivacyDoc, locale: string): Promise<string> {
  const sections = doc === "policy" ? POLICY_SECTIONS : TERMS_SECTIONS;
  const text: string[] = [PRIVACY_VERSIONS[doc]];
  for (const s of sections) {
    text.push(ptx(locale, s.title));
    for (const b of s.blocks) {
      if (b.type === "p") text.push(ptx(locale, b.key));
      else if (b.type === "ul") b.keys.forEach((key) => text.push(ptx(locale, key)));
      else b.rows.forEach(([a, c]) => text.push(ptx(locale, a), ptx(locale, c)));
    }
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.join("\n")));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
