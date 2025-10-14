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

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export type YearlyPoint = {
  ano: number;
  media: number | null;
  n: number | null;
};

type YearBucket = {
  weightedSum: number;
  totalWeight: number;
  fallbackSum: number;
  fallbackCount: number;
};

/**
 * Converte linhas do Supabase (que podem conter duplicidades por ano)
 * em uma série agregada por ano com média ponderada.
 */
export function buildYearlySeries(
  rows: { ano: number; media_ponderada_ano: number | null; n_total_ano: number | null }[]
): YearlyPoint[] {
  const buckets = new Map<number, YearBucket>();

  for (const row of rows) {
    const year = Number(row.ano);
    if (!Number.isFinite(year)) continue;

    const value = row.media_ponderada_ano;
    if (!isFiniteNumber(value)) continue;

    const weight = row.n_total_ano;
    const bucket = buckets.get(year) ?? {
      weightedSum: 0,
      totalWeight: 0,
      fallbackSum: 0,
      fallbackCount: 0,
    };

    if (isFiniteNumber(weight) && weight > 0) {
      bucket.weightedSum += value * weight;
      bucket.totalWeight += weight;
    } else {
      bucket.fallbackSum += value;
      bucket.fallbackCount += 1;
    }

    buckets.set(year, bucket);
  }

  return Array.from(buckets.entries())
    .map<YearlyPoint>(([ano, bucket]) => {
      if (bucket.totalWeight > 0) {
        return {
          ano,
          media: bucket.weightedSum / bucket.totalWeight,
          n: bucket.totalWeight,
        };
      }

      if (bucket.fallbackCount > 0) {
        return {
          ano,
          media: bucket.fallbackSum / bucket.fallbackCount,
          n: bucket.fallbackCount,
        };
      }

      return { ano, media: null, n: null };
    })
    .sort((a, b) => a.ano - b.ano);
}

/**
 * Média ponderada global usando n (total de animais) como peso.
 */
export function computeWeightedMean(points: YearlyPoint[]) {
  let weighted = 0;
  let totalWeight = 0;

  for (const point of points) {
    if (!isFiniteNumber(point.media)) continue;

    const weight = isFiniteNumber(point.n) && point.n > 0 ? point.n : 1;
    weighted += point.media * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return weighted / totalWeight;
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
