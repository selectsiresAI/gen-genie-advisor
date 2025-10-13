"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  buildTrendLine,
  computeWeightedMean,
  computeWeightedRegression,
  type WeightedPoint,
} from "@/lib/statistics";

export type GeneticAuditSeriesRow = {
  ano: number;
  media_ponderada_ano: number | null;
  n_total_ano: number | null;
  media_geral: number | null;
  slope: number | null;
  intercept: number | null;
  r2: number | null;
};

export type GeneticAuditStep4ChartProps = {
  farmId: string;
  tipoPTA: string;
  title?: string;
};

const COLORS = {
  series: "#00539B",
  mean: "#F15A22",
  trend: "#D9D9D9",
  axis: "#1C1C1C",
  grid: "#D9D9D9",
};

const LOW_SCALE_PTA = new Set(["DPR", "LIV", "SCS"]);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (!isFiniteNumber(value)) return "-";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

function computeYDomain(pta: string, data: GeneticAuditSeriesRow[]) {
  const values = data
    .map((row) => row.media_ponderada_ano ?? null)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (!values.length) {
    return [0, 1] as [number, number];
  }

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (LOW_SCALE_PTA.has(pta.toUpperCase())) {
    min = Math.min(min, -1);
    max = Math.max(max, 3);
  } else {
    min = Math.min(min, 0);
    max = max * 1.1;
  }

  if (min === max) {
    const pad = Math.abs(max) * 0.1 || 1;
    min -= pad;
    max += pad;
  }

  return [Number(min.toFixed(2)), Number(max.toFixed(2))] as [number, number];
}

type ChartPoint = {
  ano: number;
  media: number | null;
  n?: number | null;
};

type TrendPoint = {
  ano: number;
  trend: number;
};

function GeneticAuditTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const basePoint = payload[0]?.payload as ChartPoint | undefined;
  const trendPoint = payload.find((item) => item.dataKey === "trend");

  const trendValue = typeof trendPoint?.value === "number" ? trendPoint.value : null;

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 text-xs shadow-sm">
      <div className="font-semibold text-gray-800">Ano: {label}</div>
      <div className="mt-1 text-gray-700">
        Média ponderada: {formatNumber(
          isFiniteNumber(basePoint?.media)
            ? basePoint?.media ?? null
            : null,
          Math.abs(basePoint?.media ?? 0) >= 100 ? 0 : 2
        )}
      </div>
      {typeof basePoint?.n === "number" && (
        <div className="text-gray-700">N total: {basePoint?.n}</div>
      )}
      {trendValue != null && (
        <div className="text-gray-700">
          Tendência: {formatNumber(trendValue, Math.abs(trendValue) >= 100 ? 0 : 2)}
        </div>
      )}
    </div>
  );
}

export default function GeneticAuditStep4Chart({
  farmId,
  tipoPTA,
  title,
}: GeneticAuditStep4ChartProps) {
  const [rows, setRows] = useState<GeneticAuditSeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await (supabase.rpc as any)("ag_get_pta_series", {
        p_farm_id: farmId,
        p_tipo_pta: tipoPTA,
      });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load PTA series", error);
        setErr(error.message ?? "Erro ao carregar série da PTA");
        setRows([]);
      } else {
        const list = Array.isArray(data) ? (data as GeneticAuditSeriesRow[]) : [];
        setRows(list);
      }

      setLoading(false);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [farmId, tipoPTA]);

  const yDomain = useMemo(() => computeYDomain(tipoPTA, rows), [tipoPTA, rows]);
  const weightedPoints = useMemo<WeightedPoint[]>(
    () =>
      rows.map((row) => ({
        x: row.ano,
        y: row.media_ponderada_ano,
        weight: row.n_total_ano,
      })),
    [rows]
  );

  const overallMean = useMemo(
    () => computeWeightedMean(weightedPoints),
    [weightedPoints]
  );

  const regression = useMemo(
    () => computeWeightedRegression(weightedPoints),
    [weightedPoints]
  );

  const trendData = useMemo(
    () =>
      buildTrendLine(weightedPoints, regression.slope, regression.intercept).map(
        (point) => ({ ano: point.x, trend: point.y })
      ),
    [weightedPoints, regression.slope, regression.intercept]
  );

  const validPointCount = useMemo(
    () =>
      weightedPoints.filter(
        (point) =>
          Number.isFinite(point.x) &&
          isFiniteNumber(point.y)
      ).length,
    [weightedPoints]
  );

  const chartData: ChartPoint[] = useMemo(
    () =>
      rows
        .slice()
        .sort((a, b) => a.ano - b.ano)
        .map((row) => ({
          ano: row.ano,
          media: row.media_ponderada_ano,
          n: row.n_total_ano,
        })),
    [rows]
  );

  const showR2 =
    regression.r2 != null && validPointCount >= 3;

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Carregando gráfico {tipoPTA.toUpperCase()}…
      </div>
    );
  }

  if (err) {
    return <div className="text-sm text-destructive">Erro: {err}</div>;
  }

  if (!rows.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Sem dados disponíveis para {tipoPTA.toUpperCase()}.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          {title ?? `Tendência ${tipoPTA.toUpperCase()}`}
        </h3>
        {showR2 && (
          <span className="text-xs text-muted-foreground">
            R² = {formatNumber(regression.r2, 3)}
          </span>
        )}
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 20, bottom: 12, left: 4 }}>
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="ano"
              tick={{ fill: COLORS.axis }}
              stroke={COLORS.axis}
              allowDecimals={false}
            />
            <YAxis
              domain={yDomain}
              tick={{ fill: COLORS.axis }}
              stroke={COLORS.axis}
              width={80}
            />
            <Tooltip content={<GeneticAuditTooltip />} />
            <Legend />

            <Line
              type="monotone"
              dataKey="media"
              name="Média ponderada anual"
              stroke={COLORS.series}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            >
              <LabelList
                dataKey="media"
                position="top"
                className="fill-current text-xs"
              formatter={(value: number | null) =>
                  isFiniteNumber(value)
                    ? formatNumber(
                        value,
                        Math.abs(value) >= 100 ? 0 : 2
                      )
                    : ""
                }
              />
            </Line>

            {trendData.length >= 2 && (
              <Line
                type="linear"
                data={trendData}
                dataKey="trend"
                name="Tendência (linear)"
                stroke={COLORS.trend}
                strokeDasharray="6 4"
                dot={false}
                legendType="plainline"
              />
            )}

            {isFiniteNumber(overallMean) && (
              <ReferenceLine
                y={overallMean}
                stroke={COLORS.mean}
                strokeWidth={2}
                ifOverflow="extendDomain"
                label={{
                  value: `Média geral (${formatNumber(overallMean, 2)})`,
                  position: "insideTopRight",
                  fill: COLORS.mean,
                  fontSize: 12,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        O eixo Y é ajustado automaticamente conforme a grandeza de {tipoPTA.toUpperCase()}. Os marcadores
        exibem o valor médio ponderado por ano.
      </p>
    </div>
  );
}
