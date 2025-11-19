/**
 * Calcula automaticamente o domínio do eixo Y baseado nos valores da PTA
 * para garantir visualização adequada independente da escala dos valores.
 */
export function getAdaptiveYAxisDomain(
  data: Array<any>,
  valueKey: string
): [number, number] {
  if (!data || data.length === 0) return [0, 1];

  const values = data
    .map((d) => d[valueKey])
    .filter((v) => typeof v === "number" && !Number.isNaN(v));

  if (values.length === 0) return [0, 1];

  const min = Math.min(...values);
  const max = Math.max(...values);

  let range = max - min;
  if (range === 0) {
    // evita linha "colada" e eixo travado
    range = Math.max(Math.abs(max) * 0.02, 0.1);
  }

  let padding: number;

  // PTAs muito grandes (Milk, NM$, TPI, etc.)
  if (max > 1000) {
    padding = range * 0.10;      // 10% de folga
  }
  // PTAs intermediárias (PL, UDC, etc.)
  else if (max > 10) {
    padding = range * 0.20;      // 20% de folga
  }
  // PTAs pequenas/decimais (SCS, DPR, CCR, etc.)
  else {
    // garante diferença visível mesmo entre 2.97 e 2.99
    padding = Math.max(range * 0.5, 0.2);
  }

  const yMin = min - padding;
  const yMax = max + padding;

  return [yMin, yMax];
}

/**
 * Versão que aceita múltiplas chaves de valores para calcular o domínio conjunto
 */
export function getAdaptiveYAxisDomainMultiple(
  data: Array<any>,
  valueKeys: string[]
): [number, number] {
  if (!data || data.length === 0 || !valueKeys.length) return [0, 1];

  const allValues: number[] = [];
  
  for (const key of valueKeys) {
    const values = data
      .map((d) => d[key])
      .filter((v) => typeof v === "number" && !Number.isNaN(v));
    allValues.push(...values);
  }

  if (allValues.length === 0) return [0, 1];

  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  let range = max - min;
  if (range === 0) {
    range = Math.max(Math.abs(max) * 0.02, 0.1);
  }

  let padding: number;

  if (max > 1000) {
    padding = range * 0.10;
  } else if (max > 10) {
    padding = range * 0.20;
  } else {
    padding = Math.max(range * 0.5, 0.2);
  }

  const yMin = min - padding;
  const yMax = max + padding;

  return [yMin, yMax];
}
