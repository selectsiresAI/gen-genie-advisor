/** Limpa string e padroniza caixa alta */
function clean(s: string): string {
  return (s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Zero-left pad do stud (1–3 dígitos -> 3 dígitos) */
function padStud(stud: string): string {
  const n = (stud || "").replace(/\D/g, "");
  if (!n) return "";
  return n.padStart(3, "0").slice(-3);
}

/**
 * Normaliza NAAB HO aceitando 1–3 dígitos à esquerda de "HO".
 * Exemplos aceitos:
 *  - "7HO", "07HO", "007HO"
 *  - "7HO12345", "07HO 012345", "007-HO-012345"
 *  - com espaços/hífens variados, caixa baixa etc.
 *
 * Retorna:
 *  - "DDDHO" ou "DDDHO<bull>" (se houver número do touro)
 *  - null se não reconhecer padrão HO válido
 */
export function normalizeNaabHO(input: string): string | null {
  const raw = clean(input);
  // Padrão: [stud 1-3] [opcional separador] HO [opcional separador] [bull 1-7]
  const re = /(?:^|\s)(?<stud>\d{1,3})\s*-?\s*HO\s*-?\s*(?<bull>\d{1,7})?(?:\s|$)/i;
  const m = raw.match(re);
  if (!m?.groups) return null;

  const stud = padStud(m.groups.stud);
  if (!stud) return null;

  const bull = (m.groups.bull || "").replace(/\D/g, "");
  return bull ? `${stud}HO${bull}` : `${stud}HO`;
}

/** Aplica normalização nas colunas informadas, preservando o original em <col>__original */
export function normalizeNaabFieldsHO<T extends Record<string, any>>(
  row: T,
  columns: string[]
): T {
  const out: Record<string, any> = { ...row };
  for (const col of columns) {
    const val = row[col];
    if (typeof val === "string" && val.trim() !== "") {
      const normalized = normalizeNaabHO(val);
      if (normalized) {
        out[col] = normalized;
        out[`${col}__original`] = val;
      }
    }
  }
  return out as T;
}
