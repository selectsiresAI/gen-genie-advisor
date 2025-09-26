'use client';

import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendsChart, type ChartRow, type TraitSeriesMeta } from './TrendsChart';

interface TrendStats {
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  sd: number | null;
  n: number | null;
}

interface RpcYearlyPoint {
  year: number | string | null;
  mean: number | string | null;
  n: number | string | null;
}

interface RpcRow {
  trait: string | null;
  column_name: string | null;
  yearly: RpcYearlyPoint[] | null;
  stats: Record<string, unknown> | null;
}

interface TrendsTabProps {
  farmId?: string | null;
  selectedTraits: string[];
  availableTraits: Array<{ key: string; label: string }>;
  showTrendLine: boolean;
  colors: string[];
}

const MONETARY_TRAITS = new Set(['hhp_dollar', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar']);

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const TRAIT_COLUMN_ALIASES: Record<string, string> = {
  'HHP$': 'hhp_dollar',
  'HHP$®': 'hhp_dollar',
  'NM$': 'nm_dollar',
  TPI: 'tpi',
  PTA_HHPS: 'hhp_dollar',
  PTA_NMS: 'nm_dollar',
  PTA_TPI: 'tpi',
  pta_hhps: 'hhp_dollar',
  pta_nms: 'nm_dollar',
  pta_tpi: 'tpi',
};

const mapTraitKey = (trait: string | null | undefined) => {
  if (!trait) return null;
  const trimmed = trait.trim();
  if (!trimmed) return null;
  const direct = TRAIT_COLUMN_ALIASES[trimmed];
  if (direct) return direct;
  const upper = TRAIT_COLUMN_ALIASES[trimmed.toUpperCase()];
  if (upper) return upper;
  return trimmed;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseStats = (stats: Record<string, unknown> | null): TrendStats | null => {
  if (!stats || typeof stats !== 'object') return null;
  return {
    mean: toFiniteNumber(stats.mean),
    median: toFiniteNumber(stats.median),
    min: toFiniteNumber(stats.min),
    max: toFiniteNumber(stats.max),
    sd: toFiniteNumber(stats.sd),
    n: toFiniteNumber(stats.n),
  };
};

const parseYearly = (yearly: RpcYearlyPoint[] | null): Array<{ year: number; mean: number | null; n: number | null }> => {
  if (!Array.isArray(yearly)) return [];
  return yearly
    .map((entry) => {
      const year = toFiniteNumber(entry?.year);
      if (year === null) return null;
      return {
        year: Math.trunc(year),
        mean: toFiniteNumber(entry?.mean),
        n: toFiniteNumber(entry?.n),
      };
    })
    .filter((item): item is { year: number; mean: number | null; n: number | null } => Boolean(item));
};

const calculateOls = (points: Array<{ x: number; y: number }>) => {
  const valid = points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (valid.length < 2) return null;
  const n = valid.length;
  const sumX = valid.reduce((acc, point) => acc + point.x, 0);
  const sumY = valid.reduce((acc, point) => acc + point.y, 0);
  const sumXY = valid.reduce((acc, point) => acc + point.x * point.y, 0);
  const sumXX = valid.reduce((acc, point) => acc + point.x * point.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-9) return null;
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) return null;
  return { slope, intercept };
};

const formatValue = (traitKey: string, value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  if (MONETARY_TRAITS.has(traitKey)) {
    return currencyFormatter.format(value);
  }
  return numberFormatter.format(value);
};

const TrendsChartLazy = React.lazy(() => import('./TrendsChart').then((module) => ({ default: module.TrendsChart })));

type LoadState = 'idle' | 'loading' | 'empty' | 'error' | 'success';

export const TrendsTab: React.FC<TrendsTabProps> = ({
  farmId,
  selectedTraits,
  availableTraits,
  showTrendLine,
  colors,
}) => {
  const [loadState, setLoadState] = React.useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [rpcData, setRpcData] = React.useState<RpcRow[]>([]);
  const [refreshToken, setRefreshToken] = React.useState(0);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const normalizedTraits = React.useMemo(() => {
    const mapped = selectedTraits
      .map(mapTraitKey)
      .filter((trait): trait is string => Boolean(trait));

    return Array.from(new Set(mapped));
  }, [selectedTraits]);

  const normalizedSignature = React.useMemo(() => normalizedTraits.join('|'), [normalizedTraits]);

  React.useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      if (!farmId) {
        setRpcData([]);
        setLoadState('empty');
        return;
      }

      if (!normalizedTraits.length) {
        setRpcData([]);
        setLoadState('idle');
        return;
      }

      setLoadState('loading');
      setErrorMessage(null);

      try {
        const { data, error } = await supabase.rpc('get_pta_trend_and_stats', {
          farm_id: farmId,
          trait_keys: normalizedTraits,
        });

        if (error) {
          throw error;
        }

        const safeRows = Array.isArray(data) ? data : [];
        const sanitized = safeRows
          .map((row: Record<string, unknown>) => ({
            trait: typeof row?.trait === 'string' ? row.trait : null,
            column_name: typeof row?.column_name === 'string' ? row.column_name : (typeof row?.trait === 'string' ? mapTraitKey(row.trait) : null),
            yearly: Array.isArray(row?.yearly) ? row.yearly : [],
            stats: row?.stats && typeof row.stats === 'object' ? row.stats : null,
          }))
          .filter((row): row is RpcRow => Boolean(row.column_name));

        if (isCancelled) return;

        if (!sanitized.length) {
          setRpcData([]);
          setLoadState('empty');
          return;
        }

        setRpcData(sanitized);
        setLoadState('success');

        if (import.meta.env.DEV) {
          const years = sanitized
            .flatMap((row) => parseYearly(row.yearly).map((point) => point.year))
            .filter((year, index, arr) => arr.indexOf(year) === index)
            .sort((a, b) => a - b);
          const seriesSizes = sanitized.map((row) => ({
            trait: row.column_name,
            points: parseYearly(row.yearly).length,
          }));
          console.log('[TrendsTab] RPC carregado', {
            farmId,
            traits: normalizedTraits,
            years,
            seriesSizes,
          });
        }
      } catch (error) {
        if (isCancelled) return;
        console.error('Erro ao carregar tendências', error);
        setRpcData([]);
        setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
        setLoadState('error');
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [farmId, normalizedSignature, normalizedTraits, refreshToken]);

  const prepared = React.useMemo(() => {
    if (!rpcData.length) {
      return { chartRows: [] as ChartRow[], traitSeries: [] as TraitSeriesMeta[], statsMap: new Map<string, TrendStats | null>() };
    }

    const dataMap = new Map<number, ChartRow>();
    const traitSeries: TraitSeriesMeta[] = [];
    const statsMap = new Map<string, TrendStats | null>();

    rpcData.forEach((row) => {
      const columnKey = row.column_name ?? row.trait;
      if (!columnKey) return;
      const stats = parseStats(row.stats);
      statsMap.set(columnKey, stats);

      const yearlyPoints = parseYearly(row.yearly);
      const validPoints = yearlyPoints.filter((point) => point.mean !== null);
      if (!validPoints.length) {
        traitSeries.push({
          key: columnKey,
          label: findTraitLabel(columnKey, row.trait, availableTraits),
          color: pickColor(columnKey, normalizedTraits, colors, traitSeries.length),
          stats,
          deltaByYear: {},
          meanByYear: {},
          hasTrend: false,
        });
        return;
      }

      const sortedPoints = [...validPoints].sort((a, b) => a.year - b.year);
      const statsMean = stats?.mean ?? 0;
      const statsSd = stats?.sd && Number.isFinite(stats.sd) && stats.sd !== 0 ? stats.sd : null;

      const zPoints = sortedPoints.map((point) => ({
        year: point.year,
        mean: point.mean,
        n: point.n,
        z: statsSd ? (point.mean! - statsMean) / statsSd : 0,
      }));

      const originalOls = calculateOls(sortedPoints.map((point) => ({ x: point.year, y: point.mean! })));
      const zOls = calculateOls(zPoints.map((point) => ({ x: point.year, y: point.z ?? 0 })));

      const deltaByYear: Record<number, number | null> = {};
      const meanByYear: Record<number, number | null> = {};
      const trendZByYear: Record<number, number | null> = {};

      sortedPoints.forEach((point, index) => {
        meanByYear[point.year] = point.mean ?? null;
        if (!originalOls || index === 0) {
          deltaByYear[point.year] = null;
          return;
        }
        const previousYear = sortedPoints[index - 1].year;
        const currentPred = originalOls.intercept + originalOls.slope * point.year;
        const previousPred = originalOls.intercept + originalOls.slope * previousYear;
        deltaByYear[point.year] = currentPred - previousPred;
      });

      if (zOls) {
        sortedPoints.forEach((point) => {
          trendZByYear[point.year] = zOls.intercept + zOls.slope * point.year;
        });
      }

      zPoints.forEach((point) => {
        const entry = dataMap.get(point.year) ?? { year: point.year };
        entry[`${columnKey}_z`] = Number.isFinite(point.z) ? point.z : null;
        entry[`${columnKey}_trend_z`] = trendZByYear[point.year] ?? null;
        entry[`${columnKey}_mean`] = meanByYear[point.year] ?? null;
        entry[`${columnKey}_delta`] = deltaByYear[point.year] ?? null;
        dataMap.set(point.year, entry);
      });

      traitSeries.push({
        key: columnKey,
        label: findTraitLabel(columnKey, row.trait, availableTraits),
        color: pickColor(columnKey, normalizedTraits, colors, traitSeries.length),
        stats,
        deltaByYear,
        meanByYear,
        hasTrend: Boolean(zOls && originalOls && sortedPoints.length >= 2),
      });
    });

    const chartRows = Array.from(dataMap.values()).sort((a, b) => a.year - b.year);

    return { chartRows, traitSeries, statsMap };
  }, [rpcData, availableTraits, normalizedTraits, colors]);

  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (loadState !== 'success') return;
    const years = prepared.chartRows.map((row) => row.year);
    const seriesSizes = prepared.traitSeries.map((series) => ({
      trait: series.key,
      points: Object.values(series.meanByYear).filter((value) => value !== null).length,
    }));
    console.log('[TrendsTab] séries preparadas', {
      farmId,
      traits: normalizedTraits,
      years,
      seriesSizes,
    });
  }, [loadState, prepared, farmId, normalizedTraits]);

  const handleRetry = React.useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const renderContent = () => {
    if (!farmId) {
      return (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Selecione uma fazenda para visualizar as tendências.
        </div>
      );
    }

    if (!normalizedTraits.length) {
      return (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Selecione ao menos uma característica para visualizar as tendências.
        </div>
      );
    }

    if (loadState === 'loading') {
      return (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Carregando tendências…
        </div>
      );
    }

    if (loadState === 'error') {
      return (
        <div className="flex h-[320px] flex-col items-center justify-center space-y-3 text-center text-sm text-muted-foreground">
          <div>Falha ao carregar Tendências — tente novamente.</div>
          {errorMessage && <div className="text-xs">Detalhes: {errorMessage}</div>}
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    if (loadState === 'empty' || !prepared.chartRows.length) {
      return (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Sem dados para a fazenda atual.
        </div>
      );
    }

    if (!isClient) {
      return (
        <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          Preparando gráfico…
        </div>
      );
    }

    return (
      <React.Suspense fallback={<div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">Carregando gráfico…</div>}>
        <TrendsChartLazy
          data={prepared.chartRows}
          traits={prepared.traitSeries}
          showTrendLine={showTrendLine}
          formatValue={formatValue}
        />
      </React.Suspense>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Tendência (Z-score)</CardTitle>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      {prepared.traitSeries.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {prepared.traitSeries.map((series) => {
            const stats = prepared.statsMap.get(series.key);
            const label = series.label;

            return (
              <Card key={series.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Média:</span>
                      <div className="font-medium">{formatValue(series.key, stats?.mean ?? null)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mediana:</span>
                      <div className="font-medium">{formatValue(series.key, stats?.median ?? null)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mín:</span>
                      <div className="font-medium">{formatValue(series.key, stats?.min ?? null)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Máx:</span>
                      <div className="font-medium">{formatValue(series.key, stats?.max ?? null)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Desvio Padrão: {formatValue(series.key, stats?.sd ?? null)} | {stats?.n ?? 0} animais
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

const pickColor = (
  columnKey: string,
  normalizedTraits: string[],
  colors: string[],
  fallbackIndex: number,
) => {
  const index = normalizedTraits.indexOf(columnKey);
  if (index >= 0) {
    return colors[index % colors.length];
  }
  return colors[fallbackIndex % colors.length] ?? '#0f172a';
};

const findTraitLabel = (
  columnKey: string,
  requested: string | null,
  availableTraits: Array<{ key: string; label: string }>,
) => {
  const match = availableTraits.find((trait) => trait.key === columnKey || trait.key === requested);
  if (match) return match.label;
  if (requested) return requested;
  return columnKey.toUpperCase();
};

export default TrendsTab;

