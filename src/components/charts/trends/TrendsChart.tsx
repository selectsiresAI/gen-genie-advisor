'use client';

import * as React from 'react';
import type { TooltipProps } from 'recharts';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TrendStats {
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  sd: number | null;
  n: number | null;
}

export interface ChartRow {
  year: number;
  [key: string]: number | null | undefined;
}

export interface TraitSeriesMeta {
  key: string;
  label: string;
  color: string;
  stats: TrendStats | null;
  deltaByYear: Record<number, number | null>;
  meanByYear: Record<number, number | null>;
  trendByYear: Record<number, number | null>;
  hasTrend: boolean;
}

interface TrendsChartProps {
  data: ChartRow[];
  traits: TraitSeriesMeta[];
  showTrendLine: boolean;
  formatValue: (traitKey: string, value: number | null | undefined) => string;
}

const buildTooltipContent = (
  props: TooltipProps<number, string>,
  traits: TraitSeriesMeta[],
  showTrendLine: boolean,
  formatValue: TrendsChartProps['formatValue'],
) => {
  const { active, payload, label } = props as any;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const yearLabel = typeof label === 'number' ? label : Number(label);
  const year = Number.isFinite(yearLabel) ? Number(yearLabel) : null;

  if (!showTrendLine) {
    return (
      <div className="rounded-md border bg-background/95 p-3 text-xs shadow">
        <div className="text-sm font-semibold">Ano: {label ?? '—'}</div>
        <div className="mt-1 text-muted-foreground">Tendência desativada</div>
      </div>
    );
  }

  const traitEntries = payload
    .filter((item) => typeof item?.dataKey === 'string' && !item.dataKey.endsWith('_trend'))
    .map((item) => {
      const dataKey = String(item.dataKey);
      const traitKey = dataKey;
      const trait = traits.find((meta) => meta.key === traitKey);
      if (!trait) {
        return null;
      }

      const delta = year !== null ? trait.deltaByYear[year] ?? null : null;
      const trend = year !== null ? trait.trendByYear[year] ?? null : null;
      const hasTrend = trait.hasTrend && trend !== null;

      return {
        trait,
        observed: typeof item.value === 'number' && Number.isFinite(item.value) ? item.value : null,
        delta,
        trend,
        hasTrend: trait.hasTrend,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (!traitEntries.length) {
    return null;
  }

  return (
    <div className="min-w-[220px] rounded-md border bg-background/95 p-3 text-xs shadow">
      <div className="text-sm font-semibold">Ano: {label ?? '—'}</div>
      <div className="mt-2 space-y-2">
        {traitEntries.map(({ trait, observed, delta, trend, hasTrend }) => (
          <div key={trait.key} className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: trait.color }}
              />
              <span className="font-medium text-foreground">{trait.label}</span>
            </div>
            <div className="pl-4 text-[11px] text-muted-foreground">
              <div>
                Observado: <span className="font-medium text-foreground">{formatValue(trait.key, observed)}</span>
              </div>
              {hasTrend ? (
                <div>
                  ŷ(ano): <span className="font-medium text-foreground">{formatValue(trait.key, trend)}</span>
                </div>
              ) : (
                <div>Tendência indisponível (dados insuficientes)</div>
              )}
              {delta !== null && (
                <div>
                  ΔGₜ: <span className="font-medium text-foreground">{formatValue(trait.key, delta)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TrendsChart: React.FC<TrendsChartProps> = ({ data, traits, showTrendLine, formatValue }) => {
  const tooltipRenderer = React.useMemo(
    () => (props: TooltipProps<number, string>) => buildTooltipContent(props, traits, showTrendLine, formatValue),
    [traits, showTrendLine, formatValue],
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="year" stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} label={{ value: 'Valor', angle: -90, position: 'insideLeft' }} />
        <Tooltip content={tooltipRenderer} />
        <Legend />
        {traits.map((trait) => (
          <Line
            key={trait.key}
            type="monotone"
            dataKey={trait.key}
            stroke={trait.color}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2, stroke: trait.color, fill: '#fff' }}
            isAnimationActive={false}
            name={trait.label}
            connectNulls
          />
        ))}
        {showTrendLine && traits.map((trait) => (
          <Line
            key={`${trait.key}-trend`}
            type="monotone"
            dataKey={`${trait.key}_trend`}
            stroke={trait.color}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
            name={`${trait.label} (tendência)`}
            hide={!trait.hasTrend}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

