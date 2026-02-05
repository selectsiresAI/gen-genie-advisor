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

  // Padding proporcional ao range para garantir ~70% de ocupação visual
  // PTAs decimais com variação muito pequena (SCS, DPR, etc.)
  if (range < 0.5) {
    padding = range * 0.3;
  }
  // PTAs decimais com variação moderada
  else if (range < 5) {
    padding = range * 0.25;
  }
  // PTAs intermediárias (PL, UDC, etc.)
  else if (range < 50) {
    padding = range * 0.15;
  }
  // PTAs muito grandes (Milk, NM$, TPI, etc.)
  else {
    padding = range * 0.10;
  }

  // Garantir padding mínimo
  padding = Math.max(padding, range * 0.1);

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

  // Padding proporcional ao range para garantir ~70% de ocupação visual
  if (range < 0.5) {
    padding = range * 0.3;
  } else if (range < 5) {
    padding = range * 0.25;
  } else if (range < 50) {
    padding = range * 0.15;
  } else {
    padding = range * 0.10;
  }

  // Garantir padding mínimo
  padding = Math.max(padding, range * 0.1);

  const yMin = min - padding;
  const yMax = max + padding;

  return [yMin, yMax];
}

/**
 * Configuração padronizada para eixo X de gráficos temporais (anos)
 */
export function getYearAxisConfig(years: number[]): {
  domain: [number, number];
  ticks: number[];
  tickFormatter: (value: number) => string;
} {
  if (!years.length) {
    const currentYear = new Date().getFullYear();
    return {
      domain: [currentYear, currentYear],
      ticks: [currentYear],
      tickFormatter: (v) => String(Math.round(v)),
    };
  }

  const sorted = [...years].sort((a, b) => a - b);
  const minYear = sorted[0];
  const maxYear = sorted[sorted.length - 1];
  const span = maxYear - minYear;

  // Gerar ticks: todos os anos se span <= 10, senão intervalos
  let ticks: number[];
  if (span <= 10) {
    // Mostrar todos os anos
    ticks = [];
    for (let y = minYear; y <= maxYear; y++) {
      ticks.push(y);
    }
  } else {
    // Intervalos de 2 ou 5 anos
    const step = span <= 20 ? 2 : 5;
    const alignedStart = Math.ceil(minYear / step) * step;
    ticks = [minYear];
    for (let y = alignedStart; y <= maxYear; y += step) {
      if (y !== minYear) ticks.push(y);
    }
    if (!ticks.includes(maxYear)) ticks.push(maxYear);
  }

  return {
    domain: [minYear, maxYear],
    ticks,
    tickFormatter: (v) => String(Math.round(v)),
  };
}

/**
 * Calcula domínio Y adaptativo a partir de array de valores numéricos
 */
export function getAdaptiveYAxisDomainFromValues(
  values: number[]
): [number, number] {
  const finiteValues = values.filter((v) => Number.isFinite(v));
  
  if (finiteValues.length === 0) return [0, 1];

  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);

  let range = max - min;
  if (range === 0) {
    range = Math.max(Math.abs(max) * 0.02, 0.1);
  }

  let padding: number;

  if (range < 0.5) {
    padding = range * 0.3;
  } else if (range < 5) {
    padding = range * 0.25;
  } else if (range < 50) {
    padding = range * 0.15;
  } else {
    padding = range * 0.10;
  }

  padding = Math.max(padding, range * 0.1);

  return [min - padding, max + padding];
}
