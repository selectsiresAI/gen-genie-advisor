import Fuse from "fuse.js";
import { z } from "zod";

export const CANONICAL_LABELS = {
  animal_id: "Animal ID",
  herd_id: "Herd ID",
  farm_name: "Farm Name",
  cdcb_id: "CDCB ID",
  naab: "NAAB",
  bull_name: "Bull Name",
  reg: "Registration",
  dob: "Date of Birth",
  "hhp$": "HHP$",
  tpi: "TPI",
  "nm$": "NM$",
  "cm$": "CM$",
  "fm$": "FM$",
  "gm$": "GM$",
  f_sav: "F SAV",
  ptam: "PTA Milk",
  cfp: "CFP",
  ptaf: "PTA Fat",
  ptaf_pct: "PTA Fat %",
  ptap: "PTA Protein",
  ptap_pct: "PTA Protein %",
  pl: "PL",
  dpr: "DPR",
  liv: "LIV",
  scs: "SCS",
  mast: "MAST",
  met: "MET",
  rp: "RP",
  da: "DA",
  ket: "KET",
  mf: "MF",
  ptat: "PTAT",
  udc: "UDC",
  flc: "FLC",
  sce: "SCE",
  dce: "DCE",
  ssb: "SSB",
  dsb: "DSB",
  h_liv: "H LIV",
  ccr: "CCR",
  hcr: "HCR",
  fi: "FI",
  gl: "GL",
  efc: "EFC",
  bwc: "BWC",
  sta: "STA",
  str: "STR",
  dfm: "DFM",
  rua: "RUA",
  rls: "RLS",
  rtp: "RTP",
  ftl: "FTL",
  rw: "RW",
  rlr: "RLR",
  fta: "FTA",
  fls: "FLS",
  fua: "FUA",
  ruh: "RUH",
  ruw: "RUW",
  ucl: "UCL",
  udp: "UDP",
  ftp: "FTP",
  rfi: "RFI",
  beta_casein: "Beta-Casein",
  kappa_casein: "Kappa-Casein",
  gfi: "GFI",
} as const;

export type CanonicalField = keyof typeof CANONICAL_LABELS;

export const FIELD_SYNONYMS: Record<CanonicalField, string[]> = {
  animal_id: ["animal id", "animal", "id", "brinco", "ear tag", "tag"],
  herd_id: ["herd id", "farm id", "id fazenda", "id_farm", "herd"],
  farm_name: ["farm name", "fazenda", "nome fazenda", "farm"],
  cdcb_id: ["cdcb id", "cdcb", "id cdcb"],
  naab: ["naab", "naab code", "code", "bull code"],
  bull_name: ["bull name", "touro", "nome touro", "name"],
  reg: ["reg", "registration", "registro", "registro animal"],
  dob: ["dob", "date of birth", "birth", "data nasc", "nascimento", "birth date"],
  "hhp$": ["hhp$", "hhp", "hhp dollar", "hhp$®"],
  tpi: ["tpi"],
  "nm$": ["nm$", "nm", "net merit"],
  "cm$": ["cm$", "cm", "cheese merit"],
  "fm$": ["fm$", "fm", "fluid merit"],
  "gm$": ["gm$", "gm", "grazing merit"],
  f_sav: ["f sav", "fsav", "feed saved", "f saved"],
  ptam: ["ptam", "milk", "milk (lbs)", "milk (kg)", "pta milk", "leite", "leite (lbs)", "ptaleite", "pta leite", "ptamilk", "milk pta"],
  cfp: ["cfp", "cheese fat protein", "combined fat protein"],
  ptaf: ["ptaf", "fat", "pta fat", "gordura", "fat (lbs)", "fat (kg)", "ptafat"],
  ptaf_pct: ["ptaf%", "fat%", "% fat", "pct fat", "fat pct"],
  ptap: ["ptap", "protein", "pta protein", "proteína", "protein (lbs)", "protein (kg)", "ptaprot"],
  ptap_pct: ["ptap%", "prot%", "% protein", "pct protein", "protein %"],
  pl: ["pl", "productive life", "vida produtiva"],
  dpr: ["dpr", "daughter pregnancy rate"],
  liv: ["liv", "livability"],
  scs: ["scs", "somatic cell score", "ccs"],
  mast: ["mast", "mastitis"],
  met: ["met", "metritis"],
  rp: ["rp", "retained placenta"],
  da: ["da", "displaced abomasum"],
  ket: ["ket", "ketosis"],
  mf: ["mf", "milk fever", "febre do leite"],
  ptat: ["ptat"],
  udc: ["udc"],
  flc: ["flc"],
  sce: ["sce"],
  dce: ["dce"],
  ssb: ["ssb"],
  dsb: ["dsb"],
  h_liv: ["h liv", "heifer livability"],
  ccr: ["ccr", "cow conception rate"],
  hcr: ["hcr", "heifer conception rate"],
  fi: ["fi", "fertility index"],
  gl: ["gl", "gestation length"],
  efc: ["efc", "early first calving"],
  bwc: ["bwc", "body weight composite"],
  sta: ["sta", "stature"],
  str: ["str", "strength"],
  dfm: ["dfm", "dairy form"],
  rua: ["rua", "rear udder arch"],
  rls: ["rls", "rear legs side view"],
  rtp: ["rtp", "rump angle"],
  ftl: ["ftl", "front teat length"],
  rw: ["rw", "rear width", "rump width"],
  rlr: ["rlr", "rear legs rear view"],
  fta: ["fta", "front teat angle"],
  fls: ["fls", "fore udder length"],
  fua: ["fua", "fore udder attachment"],
  ruh: ["ruh", "rear udder height"],
  ruw: ["ruw", "rear udder width"],
  ucl: ["ucl", "udder cleft"],
  udp: ["udp", "udder depth"],
  ftp: ["ftp", "front teat placement"],
  rfi: ["rfi", "residual feed intake"],
  beta_casein: ["beta-casein", "beta casein", "b casein"],
  kappa_casein: ["kappa-casein", "kappa casein", "k casein"],
  gfi: ["gfi", "general feet index", "general feed index"],
} as const;

export type Unit = "raw" | "lbs" | "kg" | "%" | "$";

export const ImporterSchema = {
  CANONICAL_LABELS,
  FIELD_SYNONYMS,
  FIELD_UNITS: {
    ptam: ["lbs", "kg"],
    ptaf: ["lbs", "kg"],
    ptap: ["lbs", "kg"],
    ptaf_pct: ["%"],
    ptap_pct: ["%"],
    "hhp$": ["$"],
    "nm$": ["$"],
    "cm$": ["$"],
    "fm$": ["$"],
    "gm$": ["$"],
  } as Partial<Record<CanonicalField, Unit[]>>,
  CONVERSIONS: {
    lb_to_kg: (v: number) => v * 0.453592,
    kg_to_lb: (v: number) => v / 0.453592,
  },
} as const;

const STRING_FIELDS = new Set<CanonicalField>([
  "animal_id",
  "herd_id",
  "farm_name",
  "cdcb_id",
  "naab",
  "bull_name",
  "reg",
  "beta_casein",
  "kappa_casein",
]);

const DATE_FIELDS = new Set<CanonicalField>(["dob"]);

const FUSE_OPTIONS: Fuse.IFuseOptions<{ key: CanonicalField; term: string }> = {
  includeScore: true,
  shouldSort: true,
  threshold: 0.35,
  keys: ["term"],
};

export function buildFuseIndex() {
  const items: { key: CanonicalField; term: string }[] = [];
  (Object.keys(ImporterSchema.FIELD_SYNONYMS) as CanonicalField[]).forEach((k) => {
    ImporterSchema.FIELD_SYNONYMS[k].forEach((t) => items.push({ key: k, term: t.toLowerCase() }));
  });
  return new Fuse(items, FUSE_OPTIONS);
}

export type SuggestedMap = Record<string, CanonicalField | null>;

export function suggestMapping(columns: string[]): SuggestedMap {
  const fuse = buildFuseIndex();
  const used = new Set<CanonicalField>();
  const map: SuggestedMap = {};

  columns.forEach((colRaw) => {
    const col = colRaw.trim().toLowerCase();
    for (const [key, syns] of Object.entries(ImporterSchema.FIELD_SYNONYMS) as [CanonicalField, string[]][]) {
      if (syns.some((s) => s.toLowerCase() === col) && !used.has(key)) {
        map[colRaw] = key;
        used.add(key);
        return;
      }
    }
    const res = fuse.search(col, { limit: 3 });
    const cand = res.find((r) => !used.has(r.item.key) && (r.score ?? 1) <= 0.4);
    map[colRaw] = cand ? cand.item.key : null;
    if (cand) used.add(cand.item.key);
  });
  return map;
}

export function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean") return v ? 1 : 0;
  const s = String(v)
    .replace(/\s+/g, "")
    .replace(/%/g, "")
    .replace(/\$/g, "")
    .replace(/,/g, "");
  const num = Number(s);
  return Number.isNaN(num) ? null : num;
}

export function detectUnit(header: string): "lbs" | "kg" | "%" | null {
  const h = header.toLowerCase();
  if (h.includes("(kg)") || h.includes(" kg")) return "kg";
  if (h.includes("(lbs)") || h.includes("(lb)") || h.includes(" lbs")) return "lbs";
  if (h.includes("%")) return "%";
  return null;
}

export function toCanonicalValue(field: CanonicalField, header: string, value: any): number | string | null {
  const numeric = parseNumber(value);
  if (numeric === null) return null;
  const unit = detectUnit(header);

  if (["ptam", "ptaf", "ptap"].includes(field)) {
    if (unit === "kg") return ImporterSchema.CONVERSIONS.kg_to_lb(numeric);
    return numeric;
  }

  if (["ptaf_pct", "ptap_pct"].includes(field)) {
    return numeric;
  }

  return numeric;
}

function excelDateToISO(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }
  const str = String(value).trim();
  if (!str) return null;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export interface NormalizationOptions {
  herdId: string;
  entityId?: string;
  profileId?: string;
  batchId?: string;
}

export type NormalizedRecord = Partial<Record<CanonicalField, number | string | null>> & {
  herd_id: string;
  entity_id?: string;
  profile_id?: string;
  import_batch_id?: string;
};

export function normalizeRow(
  row: Record<string, any>,
  mapping: SuggestedMap,
  headers: string[],
  options: NormalizationOptions
): NormalizedRecord | null {
  const normalized: NormalizedRecord = {
    herd_id: options.herdId,
  };

  if (options.entityId) {
    normalized.entity_id = options.entityId;
  }

  if (options.profileId) {
    normalized.profile_id = options.profileId;
  }

  if (options.batchId) {
    normalized.import_batch_id = options.batchId;
  }

  let hasValue = false;

  headers.forEach((header) => {
    const canonical = mapping[header];
    if (!canonical) return;
    if (canonical === "herd_id") return;
    const rawValue = row[header];
    if (rawValue === undefined || rawValue === null || rawValue === "") return;

    if (DATE_FIELDS.has(canonical)) {
      const iso = excelDateToISO(rawValue);
      if (iso) {
        normalized[canonical] = iso;
        hasValue = true;
      }
      return;
    }

    if (STRING_FIELDS.has(canonical)) {
      const str = String(rawValue).trim();
      if (str) {
        normalized[canonical] = str;
        hasValue = true;
      }
      return;
    }

    const converted = toCanonicalValue(canonical, header, rawValue);
    if (converted !== null) {
      normalized[canonical] = converted;
      hasValue = true;
    }
  });

  return hasValue ? normalized : null;
}

export function normalizeRows(
  rows: Record<string, any>[],
  mapping: SuggestedMap,
  headers: string[],
  options: NormalizationOptions
): NormalizedRecord[] {
  const normalized: NormalizedRecord[] = [];
  rows.forEach((row) => {
    const record = normalizeRow(row, mapping, headers, options);
    if (record) {
      normalized.push(record);
    }
  });
  return normalized;
}

export type SupabaseConfig = { url: string; anonKey: string };

const SupabaseConfigSchema = z.object({
  url: z.string().min(1, "Supabase URL é obrigatório"),
  anonKey: z.string().min(1, "Supabase anon key é obrigatória"),
});

export function resolveSupabaseConfig(overrides?: Partial<SupabaseConfig>): SupabaseConfig {
  const w: any = typeof window !== "undefined" ? window : {};
  const g: any = typeof globalThis !== "undefined" ? globalThis : {};
  const ime: any = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  const pe: any = typeof process !== "undefined" && (process as any).env ? (process as any).env : undefined;

  const url =
    overrides?.url ||
    w.NEXT_PUBLIC_SUPABASE_URL ||
    w.SUPABASE_URL ||
    g.NEXT_PUBLIC_SUPABASE_URL ||
    g.SUPABASE_URL ||
    (ime && (ime.NEXT_PUBLIC_SUPABASE_URL || ime.VITE_SUPABASE_URL)) ||
    (pe && (pe.NEXT_PUBLIC_SUPABASE_URL || pe.VITE_SUPABASE_URL));

  const anonKey =
    overrides?.anonKey ||
    w.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    w.SUPABASE_ANON_KEY ||
    g.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    g.SUPABASE_ANON_KEY ||
    (ime && (ime.NEXT_PUBLIC_SUPABASE_ANON_KEY || ime.VITE_SUPABASE_ANON_KEY)) ||
    (pe && (pe.NEXT_PUBLIC_SUPABASE_ANON_KEY || pe.VITE_SUPABASE_ANON_KEY));

  const parsed = SupabaseConfigSchema.safeParse({ url, anonKey });
  if (!parsed.success) {
    throw new Error("Supabase config ausente. Forneça via props ou defina window.NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.");
  }

  return parsed.data;
}

export async function runImporterSelfTests() {
  const results: { id: string; passed: boolean; message: string }[] = [];

  const pushResult = (id: string, passed: boolean, message: string) => {
    results.push({ id, passed, message });
  };

  try {
    const mapping = suggestMapping(["PTA Leite"]);
    pushResult("T1", mapping["PTA Leite"] === "ptam", mapping["PTA Leite"] === "ptam" ? "Sinônimo PTAM ok" : "Falhou sinônimo PTAM");

    const mappingFuzzy = suggestMapping(["PTALeite"]);
    pushResult(
      "T2",
      mappingFuzzy["PTALeite"] === "ptam",
      mappingFuzzy["PTALeite"] === "ptam" ? "Fuzzy PTALeite ok" : "Fuzzy PTALeite falhou"
    );

    const kgToLb = toCanonicalValue("ptam", "PTA Milk (kg)", 10);
    const lbToKg = ImporterSchema.CONVERSIONS.lb_to_kg(22.0462);
    pushResult(
      "T3",
      kgToLb !== null && Math.abs((kgToLb ?? 0) - 22.0462) < 0.001 && Math.abs(lbToKg - 10) < 0.1,
      kgToLb !== null ? "Conversão kg↔lbs ok" : "Conversão falhou"
    );

    const unknown = suggestMapping(["Coluna X"]);
    pushResult("T4", unknown["Coluna X"] === null, unknown["Coluna X"] === null ? "Coluna desconhecida ignorada" : "Coluna desconhecida não nula");

    const duplicates = suggestMapping(["PTAM", "PTA Milk"]);
    pushResult(
      "T5",
      duplicates["PTAM"] === "ptam" && duplicates["PTA Milk"] === null,
      duplicates["PTAM"] === "ptam" && duplicates["PTA Milk"] === null ? "Duplicatas PTAM ok" : "Duplicatas PTAM falharam"
    );

    const supa = resolveSupabaseConfig({ url: "https://supabase.local", anonKey: "anon" });
    pushResult("T6", supa.url === "https://supabase.local" && supa.anonKey === "anon", "Config override ok");
  } catch (error: any) {
    console.error("runImporterSelfTests erro", error);
    pushResult("ERROR", false, error?.message ?? String(error));
  }

  const passed = results.every((r) => r.passed);
  console.group("Importador PTAs — Self Tests");
  results.forEach((r) => {
    const status = r.passed ? "✅" : "❌";
    console.log(`${status} ${r.id}: ${r.message}`);
  });
  console.groupEnd();
  return passed;
}

if (typeof window !== "undefined") {
  (window as any).runImporterSelfTests = runImporterSelfTests;
}
