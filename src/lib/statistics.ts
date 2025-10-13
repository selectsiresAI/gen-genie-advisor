export type WeightedPoint = {
  x: number;
  y: number | null | undefined;
  weight?: number | null | undefined;
};

type NormalizedPoint = {
  x: number;
  y: number;
  weight: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizePoints(points: WeightedPoint[]): NormalizedPoint[] {
  return points
    .map((point) => {
      const x = Number(point.x);
      const rawY = point.y;
      const rawWeight = point.weight;

      if (!Number.isFinite(x)) {
        return null;
      }

      if (!isFiniteNumber(rawY)) {
        return null;
      }

      const weightValue = isFiniteNumber(rawWeight) ? rawWeight : 1;
      const weight = weightValue > 0 ? weightValue : 1;

      return { x, y: rawY, weight } satisfies NormalizedPoint;
    })
    .filter(Boolean) as NormalizedPoint[];
}

export function computeWeightedMean(points: WeightedPoint[]): number | null {
  const valid = normalizePoints(points);
  if (!valid.length) {
    return null;
  }

  const totalWeight = valid.reduce((acc, point) => acc + point.weight, 0);
  if (!totalWeight) {
    return null;
  }

  const weightedSum = valid.reduce((acc, point) => acc + point.y * point.weight, 0);
  return weightedSum / totalWeight;
}

export type WeightedRegressionResult = {
  slope: number;
  intercept: number;
  r2: number | null;
  count: number;
};

export function computeWeightedRegression(points: WeightedPoint[]): WeightedRegressionResult {
  const valid = normalizePoints(points);

  if (!valid.length) {
    return { slope: 0, intercept: 0, r2: null, count: 0 };
  }

  if (valid.length === 1) {
    return { slope: 0, intercept: valid[0]!.y, r2: null, count: 1 };
  }

  const totalWeight = valid.reduce((acc, point) => acc + point.weight, 0);
  if (!totalWeight) {
    return { slope: 0, intercept: 0, r2: null, count: valid.length };
  }

  const meanX = valid.reduce((acc, point) => acc + point.x * point.weight, 0) / totalWeight;
  const meanY = valid.reduce((acc, point) => acc + point.y * point.weight, 0) / totalWeight;

  const covariance =
    valid.reduce(
      (acc, point) => acc + point.weight * (point.x - meanX) * (point.y - meanY),
      0
    ) / totalWeight;
  const varianceX =
    valid.reduce((acc, point) => acc + point.weight * (point.x - meanX) ** 2, 0) / totalWeight;
  const varianceY =
    valid.reduce((acc, point) => acc + point.weight * (point.y - meanY) ** 2, 0) / totalWeight;

  const slope = varianceX ? covariance / varianceX : 0;
  const intercept = meanY - slope * meanX;

  let r2: number | null = null;
  if (varianceX && varianceY) {
    const numerator = covariance ** 2;
    const denominator = varianceX * varianceY;
    const rawR2 = denominator ? numerator / denominator : 0;
    if (Number.isFinite(rawR2)) {
      r2 = Math.max(0, Math.min(1, rawR2));
    }
  }

  return { slope, intercept, r2, count: valid.length };
}

export function buildTrendLine(
  points: WeightedPoint[],
  slope: number,
  intercept: number
): Array<{ x: number; y: number }> {
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) {
    return [];
  }

  const valid = normalizePoints(points);
  if (valid.length < 2) {
    return [];
  }

  const xs = valid.map((point) => point.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);

  if (minX === maxX) {
    return [];
  }

  return [
    { x: minX, y: intercept + slope * minX },
    { x: maxX, y: intercept + slope * maxX },
  ];
}
