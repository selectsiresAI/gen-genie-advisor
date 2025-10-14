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
  media_anual: number;
  media_geral: number;
  slope: number | null;
  intercept: number | null;
  r2: number | null;
};

type Props = { farmId: string; tipoPTA: string; title?: string };

const COLORS = {
  serie: "#00539B", // média anual
  media: "#F15A22", // média do rebanho
  trend: "#9CA3AF", // tendência
  axis: "#1C1C1C",
  grid: "#D9D9D9",
} as const;

export default function PTAChartStep4({ farmId, tipoPTA, title }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase.rpc("ag_get_pta_media_anual", {
        p_farm_id: farmId,
        p_tipo_pta: tipoPTA,
      });

      if (!active) return;

      if (error) {
        setErr(error.message);
        setRows([]);
      } else {
        const parsed = Array.isArray(data) ? (data as Partial<Row>[]) : [];
        const normalized = parsed
          .map<Row | null>((item) => {
            if (!item) return null;

            const ano = Number(item.ano);
            const media_anual = Number(item.media_anual);
            const media_geral = Number(item.media_geral);

            if (!Number.isFinite(ano) || !Number.isFinite(media_anual)) return null;

            return {
              ano,
              media_anual,
              media_geral: Number.isFinite(media_geral) ? media_geral : media_anual,
              slope:
                item.slope != null && Number.isFinite(Number(item.slope))
                  ? Number(item.slope)
                  : null,
              intercept:
                item.intercept != null && Number.isFinite(Number(item.intercept))
                  ? Number(item.intercept)
                  : null,
              r2:
                item.r2 != null && Number.isFinite(Number(item.r2))
                  ? Number(item.r2)
                  : null,
            } satisfies Row;
          })
          .filter((row): row is Row => row != null)
          .sort((a, b) => a.ano - b.ano);

        setRows(normalized);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [farmId, tipoPTA]);

  const dec = useMemo(() => decimalsForPTA(tipoPTA), [tipoPTA]);

  const yDomain = useMemo(
    () => computeYDomain(tipoPTA, rows.map((r) => r.media_anual)),
    [rows, tipoPTA]
  );

  const mediaGeral = rows[0]?.media_geral;
  const slope = rows[0]?.slope ?? null;
  const intercept = rows[0]?.intercept ?? null;
  const r2 = rows[0]?.r2 ?? null;

  const tPoints = useMemo(
    () => trendLinePoints(rows, slope ?? undefined, intercept ?? undefined),
    [rows, slope, intercept]
  );

  const showR2 = useMemo(
    () => r2 != null && rows.filter((row) => Number.isFinite(row.media_anual)).length >= 3,
    [r2, rows]
  );

  const slopeText = slope != null ? `${slope.toFixed(dec)} por ano` : "—";
  const eqText =
    slope != null && intercept != null
      ? `y = ${slope.toFixed(dec)}·x ${intercept >= 0 ? "+" : "−"} ${Math.abs(intercept).toFixed(dec)}`
      : null;

  function exportCSV() {
    const header = ["ano", "media_anual", "media_geral", "slope", "intercept", "r2"];
    const lines = rows.map((row) =>
      [
        row.ano,
        row.media_anual,
        mediaGeral ?? "",
        slope ?? "",
        intercept ?? "",
        r2 ?? "",
      ].join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pta_${tipoPTA}_step4.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-sm text-gray-500">Carregando {tipoPTA}…</div>;
  if (err) return <div className="text-sm text-red-600">Erro: {err}</div>;
  if (!rows.length) return <div className="text-sm text-gray-500">Sem dados para {tipoPTA}.</div>;

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">{title ?? `Tendência ${tipoPTA}`}</h3>
          {showR2 && <span className="text-xs text-gray-600">R² = {r2!.toFixed(3)}</span>}
          {slope != null && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              ΔG: {slopeText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {eqText && <span className="text-[11px] text-gray-500">{eqText}</span>}
          <button
            onClick={exportCSV}
            className="rounded border bg-white px-2 py-1 text-xs hover:bg-gray-50"
            title="Exportar série anual + média + regressão"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
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
              formatter={(value: any, name) => {
                const n = Number(value);
                if (!Number.isFinite(n)) return [value, name];
                if (name === "media_anual") return [n.toFixed(dec), "Média anual"];
                if (name === "tendencia") return [n.toFixed(dec), "Tendência"];
                return [value, name];
              }}
              labelFormatter={(label) => `Ano: ${label}`}
            />
            <Legend />

            <Line
              type="monotone"
              dataKey="media_anual"
              name="Média anual"
              stroke={COLORS.serie}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            >
              <LabelList
                dataKey="media_anual"
                position="top"
                formatter={(v: number) =>
                  Number.isFinite(v) ? Number(v).toFixed(dec) : ""
                }
              />
            </Line>

            {tPoints.length === 2 && (
              <Line
                type="linear"
                data={tPoints}
                dataKey="tendencia"
                name="Tendência"
                stroke={COLORS.trend}
                strokeDasharray="6 4"
                dot={false}
                legendType="plainline"
                isAnimationActive={false}
              />
            )}

            {typeof mediaGeral === "number" && Number.isFinite(mediaGeral) && (
              <ReferenceLine
                y={mediaGeral}
                stroke={COLORS.media}
                strokeWidth={2}
                label={{
                  value: `Média do rebanho`,
                  position: "insideTopRight",
                  fill: COLORS.media,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        Eixo Y {isLowScalePTA(tipoPTA) ? "otimizado para baixa grandeza" : "automático com margem superior"}.
      </p>
    </div>
  );
}
