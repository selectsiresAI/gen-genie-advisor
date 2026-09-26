/**
 * Parse numérico tolerante a formato BR e US. Mesma heurística de
 * supabase/functions/upload-females/index.ts:validateNumber — mantidas em sincronia
 * para que exibição/ordenação/contagem no client não divirjam do import oficial.
 * "3,167" (BR) → 3.167 | "1,234" (US milhar) → 1234 | "2.95" → 2.95 | "" → NaN
 */
export function parseNum(v: any): number {
  if (v == null) return NaN;
  if (typeof v === "number") return v;
  let s = String(v).trim();
  if (s === "" || s === "-" || s === "--") return NaN;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // Rightmost separator is the decimal one.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = s.split(",");
    // US thousands only if: single comma, exactly 3 digits after, integer part 4+ digits
    // (e.g. "1,234" "10,000"). Otherwise comma is decimal (BR/EU: "10,5" -> "10.5").
    if (parts.length === 2 && /^\d{3}$/.test(parts[1]) && /^-?\d{4,}$/.test(parts[0])) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(",", ".");
    }
  }
  return Number(s);
}

export function mean(values: number[]): number {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}
