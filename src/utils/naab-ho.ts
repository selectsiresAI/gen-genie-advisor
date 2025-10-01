const HO_PATTERN = /(?:^|[^A-Z0-9])(?<stud>\d{1,3})[^A-Z0-9]*HO[^A-Z0-9]*(?<bull>\d{1,7})?(?:[^A-Z0-9]|$)/i;

/** Zero-left pad do stud (1–3 dígitos -> 3 dígitos) */
function padStud(stud: string | undefined): string {
  if (!stud) return "";
  const digits = stud.replace(/\D/g, "");
  return digits ? digits.padStart(3, "0").slice(-3) : "";
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
  if (!input) return null;

  const match = input.toUpperCase().match(HO_PATTERN);
  if (!match?.groups) return null;

  const stud = padStud(match.groups.stud);
  if (!stud) return null;

  const bull = (match.groups.bull || "").replace(/\D/g, "");
  return bull ? `${stud}HO${bull}` : `${stud}HO`;
}

/** Aplica normalização nas colunas informadas, preservando o original em <col>__original */
export function normalizeNaabFieldsHO<T extends Record<string, any>>(
  row: T,
  columns: string[]
): T {
  let out: Record<string, any> | null = null;
  for (const col of columns) {
    const val = row[col];
    if (typeof val !== "string" || val === "") continue;

    const normalized = normalizeNaabHO(val);
    if (!normalized) continue;

    if (!out) out = { ...row };
    out[col] = normalized;
    out[`${col}__original`] = val;
  }
  return (out as T) || row;
}
