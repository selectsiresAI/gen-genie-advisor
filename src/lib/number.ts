/**
 * Parse numérico tolerante a formato americano (vírgula = milhar, ponto = decimal).
 * "3,167" → 3167 | "2.95" → 2.95 | "-1.4" → -1.4 | "" → NaN
 */
export function parseNum(v: any): number {
  if (v == null) return NaN;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (s === "") return NaN;
  return Number(s.replace(/,/g, ""));
}

export function mean(values: number[]): number {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}
