export interface TrendPoint {
  x: number;
  y: number;
}

export interface LinearTrendModel {
  a: number;
  b: number;
  meanX: number;
  r2: number;
  predict: (x: number) => number;
}

export function computeLinearTrend(points: TrendPoint[]): LinearTrendModel | null {
  const validPoints = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));

  if (validPoints.length < 2) {
    return null;
  }

  const n = validPoints.length;
  const meanX = validPoints.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = validPoints.reduce((sum, point) => sum + point.y, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;

  for (const point of validPoints) {
    const centeredX = point.x - meanX;
    const centeredY = point.y - meanY;
    sxx += centeredX * centeredX;
    sxy += centeredX * centeredY;
    syy += centeredY * centeredY;
  }

  if (sxx === 0) {
    const r2 = syy === 0 ? 1 : 0;
    const predict = (x: number) => meanY;

    return {
      a: meanY,
      b: 0,
      meanX,
      r2,
      predict,
    };
  }

  const b = sxy / sxx;
  const a = meanY;
  const r2 = syy === 0 ? 1 : Math.max(0, Math.min(1, (sxy * sxy) / (sxx * syy)));

  const predict = (x: number) => a + b * (x - meanX);

  return {
    a,
    b,
    meanX,
    r2,
    predict,
  };
}
