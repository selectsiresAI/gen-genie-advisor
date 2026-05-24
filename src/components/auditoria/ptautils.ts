// Utilidades para escala/decimais e reta de tendência

export function isLowScalePTA(pta: string) {
  return new Set(["DPR", "LIV", "SCS"]).has(pta.toUpperCase());
}

export function isMoneyPTA(pta: string) {
  // ajuste conforme suas PTAs monetárias
  return new Set(["HHP$", "NM$", "CM$", "FM$", "GM$", "TPI"]).has(pta.toUpperCase());
}

export function decimalsForPTA(pta: string) {
  if (isLowScalePTA(pta)) return 2;  // DPR/LIV/SCS
  if (isMoneyPTA(pta))    return 2;  // HHP$ e afins
  return 0;                           // demais PTAs
}

export function computeYDomain(pta: string, values: number[]) {
  const v = values.filter(Number.isFinite) as number[];
  if (!v.length) return [0, 1];

  let min = Math.min(...v);
  let max = Math.max(...v);

  if (isLowScalePTA(pta)) {
    min = Math.min(min, -1);
    max = Math.max(max, 3);
  } else {
    min = Math.min(0, min);
    max = max * 1.10;
  }

  if (min === max) {
    const pad = Math.abs(max) * 0.1 || 1;
    min -= pad; max += pad;
  }
  return [Number(min.toFixed(2)), Number(max.toFixed(2))];
}

export function trendLinePoints(
  data: { ano: number }[], slope?: number | null, intercept?: number | null
) {
  if (slope == null || intercept == null || !data.length) return [];
  const years = data.map(d => d.ano);
  const x1 = Math.min(...years), x2 = Math.max(...years);
  return [
    { ano: x1, tendencia: slope * x1 + intercept },
    { ano: x2, tendencia: slope * x2 + intercept },
  ];
}
