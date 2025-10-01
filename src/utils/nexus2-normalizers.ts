import { read, utils } from "xlsx";

/** ======= Helpers de normalização ======= */
const strip = (value: unknown) => (value ?? "").toString().trim();
const up = (value: unknown) =>
  strip(value).toUpperCase().replace(/[^A-Z0-9]/g, " ").replace(/\s+/g, " ").trim();

const toIsoDate = (date: Date) =>
  Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 10);

const excelSerialToIso = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "";

  // Ajuste padrão: 25569 é o deslocamento para 1970-01-01 no calendário Excel
  const ms = Math.round((value - 25569) * 86400 * 1000);
  if (!Number.isFinite(ms)) return "";
  const date = new Date(ms);
  return toIsoDate(date);
};

/** Data: dd/mm/aaaa | dd-mm-aaaa | yyyymmdd -> aaaa-mm-dd */
export function normalizeDateFast(v: unknown): string {
  if (v instanceof Date) {
    const iso = toIsoDate(v);
    if (iso) return iso;
  }

  if (typeof v === "number" && Number.isFinite(v)) {
    const int = Math.trunc(v);
    const asEightDigits = String(int);
    if (asEightDigits.length === 8) {
      const s = asEightDigits.padStart(8, "0");
      const c = s.match(/^(\d{4})(\d{2})(\d{2})$/);
      if (c) return `${c[1]}-${c[2]}-${c[3]}`;
    }

    const iso = excelSerialToIso(v);
    if (iso) return iso;
  }

  const s = strip(v);
  // yyyymmdd
  const c1 = s.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (c1) return `${c1[1]}-${c1[2]}-${c1[3]}`;
  // dd/mm/aaaa ou dd-mm-aaaa
  const c2 = s.match(/^(\d{2})[/.-](\d{2})[/.-](\d{4})$/);
  if (c2) return `${c2[3]}-${c2[2]}-${c2[1]}`;
  return s; // se já estiver OK, retorna como veio
}

/** NAAB HO: aceita H ou HO. Exemplos aceitos:
 * 7H, 7HO, 07HO, 007HO, 7HO12345, 07-HO-012345, corrige H0/HOO...
 * Retorna "DDDHO" ou "DDDHO<bull>"
 */
export function normalizeNaabHOFast(v: unknown): string | null {
  const raw = strip(v);
  if (!raw) return null;

  const fixed = up(raw).replace(/H0/g, "HO").replace(/HOO+/g, "HO");
  // âncoras para evitar “scan” pesado
  const m = fixed.match(/^\s*(\d{1,3})\s*H(?:O)?\s*(\d{0,7})\s*$/);
  if (!m) return null;
  const stud = m[1].padStart(3, "0").slice(-3);
  const bull = (m[2] || "").replace(/\D/g, "");
  return bull ? `${stud}HO${bull}` : `${stud}HO`;
}

/** Aplica normalização nas colunas alvo */
export function applyFastNormalizers(
  row: Record<string, any>,
  opts: {
    dateCols?: string[];
    naabCols?: string[];
  } = {}
) {
  const out: Record<string, any> = { ...row };
  const { dateCols = [], naabCols = [] } = opts;

  for (const c of dateCols) {
    if (c in out && out[c] !== undefined && out[c] !== null) {
      out[c] = normalizeDateFast(out[c]);
    }
  }
  for (const c of naabCols) {
    const val = out[c];
    if (val !== undefined && val !== null) {
      const n = normalizeNaabHOFast(val);
      if (n) out[c] = n;
    }
  }
  return out;
}

/** ======= Leitura rápida ======= */

/** Sanitiza cabeçalhos (remove acentos/virgulas finais e normaliza underscores) */
function sanitizeHeader(h: string): string {
  const s = (h || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[,;:.]+$/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return s;
}

/** Detecta delimitador em CSV */
function detectDelimiter(text: string): "," | ";" {
  const head = text.split(/\r?\n/).slice(0, 3).join("\n");
  const sc = (head.match(/;/g) || []).length;
  const cc = (head.match(/,/g) || []).length;
  return sc > cc ? ";" : ",";
}

/** CSV -> objetos (rápido) */
export function parseCsvQuick(text: string) {
  const delim = detectDelimiter(text);
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
  if (!lines.length) return { headers: [], rows: [] as Record<string, any>[] };

  const rawHeaders = lines[0].split(delim).map(sanitizeHeader);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim);
    const obj: Record<string, any> = {};
    rawHeaders.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
    rows.push(obj);
  }
  return { headers: rawHeaders, rows };
}

/** XLSX -> objetos (fallback) */
export async function parseXlsxQuick(file: File) {
  const ab = await file.arrayBuffer();
  const wb = read(ab, { type: "array", cellDates: false, dense: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" }) as any[][];
  if (!aoa.length) return { headers: [], rows: [] as Record<string, any>[] };

  const headers = (aoa[0] as string[]).map(sanitizeHeader);
  const rows: Record<string, any>[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const line = aoa[r] || [];
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => (obj[h] = line[i] ?? ""));
    rows.push(obj);
  }
  return { headers, rows };
}
