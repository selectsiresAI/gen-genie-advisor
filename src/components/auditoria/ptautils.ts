// Mapeia as grandezas por PTA e define domínio dinâmico
export function isLowScalePTA(pta: string) {
  const low = new Set(["DPR", "LIV", "SCS"]);
  return low.has(pta.toUpperCase());
}

// Casas decimais sugeridas por PTA (labels/tooltip)
export function decimalsForPTA(pta: string) {
  const normalized = pta.toUpperCase();
  if (isLowScalePTA(normalized)) return 2;

  // HHP$, NM$, CM$, etc. should keep cents precision so the chart matches manual calculations
  if (normalized.includes("$")) return 2;

  return 0;
}

/**
 * Retorna [min, max] para o eixo Y com base nos valores da série e no tipo de PTA.
 * Regras:
 * - DPR/LIV/SCS: base [-1, 3], mas adapta aos dados (respeita extrapolações)
 * - Demais PTAs: min >= 0 e max = max_dado * 1.10
 * - Evita min == max (adiciona padding)
 */
export function computeYDomain(pta: string, values: number[]) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return [0, 1];

  let min = Math.min(...clean);
  let max = Math.max(...clean);

  if (isLowScalePTA(pta)) {
    min = Math.min(min, -1);
    max = Math.max(max, 3);
  } else {
    min = Math.max(0, Math.min(min, max)); // clamp em 0
    max = max * 1.1;
  }

  if (min === max) {
    const pad = Math.abs(max) * 0.1 || 1;
    min -= pad;
    max += pad;
  }

  // arredonda 2 casas para estabilidade visual
  return [Number(min.toFixed(2)), Number(max.toFixed(2))];
}

// Constrói dois pontos (x=minYear, x=maxYear) para a linha de tendência
export function trendLinePoints(
  data: { ano: number }[],
  slope?: number | null,
  intercept?: number | null
) {
  if (slope == null || intercept == null || !data.length) return [];
  const years = data.map((d) => d.ano);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  return [
    { ano: minY, trend: slope * minY + intercept },
    { ano: maxY, trend: slope * maxY + intercept },
  ];
}
