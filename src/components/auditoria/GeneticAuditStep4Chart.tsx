"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";

import {
  computeYDomain,
  decimalsForPTA,
  isLowScalePTA,
  trendLinePoints,
} from "./ptautils";

type Row = {
  ano: number;
  media_ponderada_ano: number | null;
  n_total_ano: number | null;
  media_geral: number | null;
  slope: number | null;
  intercept: number | null;
  r2: number | null;
};

type Props = {
  farmId: string;
  tipoPTA: string; // e.g. "IPI","PTAM","PTAF","PL","DPR","LIV","SCS","HHP$","NM$","TPI"
  title?: string;
};

const COLORS = {
  series: "#00539B", // azul
  mean: "#F15A22", // laranja
  trend: "#9CA3AF", // cinza
  axis: "#1C1C1C",
  grid: "#D9D9D9",
} as const;

export default function GeneticAuditStep4Chart({ farmId, tipoPTA, title }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase.rpc("ag_get_pta_series", {
        p_farm_id: farmId,
        p_tipo_pta: tipoPTA,
      });

      if (!active) return;

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        const parsed = Array.isArray(data) ? (data as Row[]) : [];
        const normalized = parsed
          .map<Row>((item) => ({
            ano: Number(item.ano),
            media_ponderada_ano:
              item.media_ponderada_ano != null
                ? Number(item.media_ponderada_ano)
                : null,
            n_total_ano:
              item.n_total_ano != null ? Number(item.n_total_ano) : null,
            media_geral:
              item.media_geral != null ? Number(item.media_geral) : null,
            slope: item.slope != null ? Number(item.slope) : null,
            intercept: item.intercept != null ? Number(item.intercept) : null,
            r2: item.r2 != null ? Number(item.r2) : null,
          }))
          .filter((item) => Number.isFinite(item.ano));

        setRows(normalized);
      }

      setLoading(false);
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [farmId, tipoPTA]);

  const decimals = useMemo(() => decimalsForPTA(tipoPTA), [tipoPTA]);

  const data = useMemo(
    () =>
      rows.map((r) => ({
        ano: r.ano,
        media: r.media_ponderada_ano ?? null,
        n: r.n_total_ano ?? null,
      })),
    [rows]
  );

  const mediaGeral = rows[0]?.media_geral ?? null;
  const r2 = rows[0]?.r2 ?? null;
  const tPoints = useMemo(
    () => trendLinePoints(rows, rows[0]?.slope, rows[0]?.intercept),
    [rows]
  );

  const yDomain = useMemo(() => {
    const yValues = [
      ...data.map((d) => (d.media ?? NaN)),
      ...(typeof mediaGeral === "number" ? [mediaGeral] : []),
      ...tPoints.map((p) => p.trend),
    ].filter((value): value is number => Number.isFinite(value));

    return computeYDomain(tipoPTA, yValues);
  }, [data, mediaGeral, tPoints, tipoPTA]);

  const showR2 = useMemo(
    () => r2 != null && data.filter((d) => d.media != null).length >= 3,
    [data, r2]
  );

  if (loading)
    return <div className="text-sm text-gray-500">Carregando {tipoPTA}…</div>;
  if (err) return <div className="text-sm text-red-600">Erro: {err}</div>;
  if (!rows.length)
    return <div className="text-sm text-gray-500">Sem dados para {tipoPTA}.</div>;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {title ?? `Tendência ${tipoPTA}`}
        </h3>
        {showR2 && (
          <span className="text-xs text-gray-600">
            R² = {Number(r2).toFixed(3)}
          </span>
        )}
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="ano"
              stroke={COLORS.axis}
              tick={{ fill: COLORS.axis }}
              allowDecimals={false}
            />
            <YAxis
              domain={yDomain as [number, number]}
              stroke={COLORS.axis}
              tick={{ fill: COLORS.axis }}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "media" || name === "trend" || name === "mean") {
                  const numericValue =
                    typeof value === "number" ? value : Number(value);
                  if (!Number.isFinite(numericValue)) return [value, name];

                  const label =
                    name === "media"
                      ? "Média ponderada"
                      : name === "trend"
                        ? "Tendência"
                        : "Média geral";

                  return [numericValue.toFixed(decimals), label];
                }

                return [value, name];
              }}
              labelFormatter={(label) => `Ano: ${label}`}
            />
            <Legend />

            <Line
              type="monotone"
              dataKey="media"
              name="Média ponderada anual"
              stroke={COLORS.series}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              connectNulls
            >
              <LabelList
                dataKey="media"
                position="top"
                formatter={(value) =>
                  value != null && value !== ""
                    ? Number(value).toFixed(decimals)
                    : ""
                }
              />
            </Line>

            {tPoints.length >= 2 && (
              <Line
                type="linear"
                data={tPoints}
                dataKey="trend"
                name="Tendência (linear)"
                stroke={COLORS.trend}
                strokeDasharray="6 4"
                dot={false}
                legendType="plainline"
                isAnimationActive={false}
              />
            )}

            {typeof mediaGeral === "number" && (
              <ReferenceLine
                y={mediaGeral}
                stroke={COLORS.mean}
                strokeWidth={2}
                label={{
                  value: `Média geral`,
                  position: "insideTopRight",
                  fill: COLORS.mean,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        Eixo Y ajustado automaticamente para {tipoPTA}
        {isLowScalePTA(tipoPTA) ? " (baixa grandeza)" : ""}. Marcadores mostram a
        média ponderada por ano.
      </p>
    </div>
  );
}
