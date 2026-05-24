"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, LabelList
} from "recharts";
import { createClient } from "@supabase/supabase-js";
import { computeYDomain, decimalsForPTA, trendLinePoints, isLowScalePTA } from "./ptautils";

type Row = {
  ano: number;
  media_anual: number;
  media_geral: number;
  slope: number | null;
  intercept: number | null;
  r2: number | null;
};

type Props = { farmId: string; tipoPTA: string; title?: string; };

const COLORS = {
  serie: "#00539B",     // média anual
  media: "#F15A22",     // média do rebanho
  trend: "#9CA3AF",     // tendência
  axis:  "#1C1C1C",
  grid:  "#D9D9D9",
};

export default function PTAChartStep4({ farmId, tipoPTA, title }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const supabase = useMemo(() =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      const { data, error } = await supabase.rpc("ag_get_pta_media_anual", {
        p_farm_id: farmId, p_tipo_pta: tipoPTA
      });
      if (error) setErr(error.message);
      else {
        const normalized = (data ?? []).map((row) => ({
          ...row,
          ano: Number(row.ano),
          media_anual: Number(row.media_anual),
          media_geral: Number(row.media_geral),
          slope: row.slope == null ? null : Number(row.slope),
          intercept: row.intercept == null ? null : Number(row.intercept),
          r2: row.r2 == null ? null : Number(row.r2),
        })) as Row[];
        setRows(normalized);
      }
      setLoading(false);
    })();
  }, [supabase, farmId, tipoPTA]);

  if (loading) return <div className="text-sm text-gray-500">Carregando {tipoPTA}…</div>;
  if (err)      return <div className="text-sm text-red-600">Erro: {err}</div>;
  if (!rows.length) return <div className="text-sm text-gray-500">Sem dados para {tipoPTA}.</div>;

  const dec = decimalsForPTA(tipoPTA);
  const yDomain = computeYDomain(tipoPTA, rows.map(r => r.media_anual));
  const mediaGeral = rows[0].media_geral;

  const slope = rows[0].slope ?? null;
  const intercept = rows[0].intercept ?? null;
  const r2 = rows[0].r2 ?? null;

  const tPoints = trendLinePoints(rows, slope, intercept);
  const showR2 = r2 != null && rows.length >= 3;

  const slopeText = (slope != null) ? `${slope.toFixed(dec)} por ano` : "—";
  const eqText = (slope != null && intercept != null)
    ? `y = ${slope.toFixed(dec)}·x ${intercept >= 0 ? "+" : "−"} ${Math.abs(intercept).toFixed(dec)}`
    : null;
  const trendLegendLabel = showR2 ? `Tendência (R²=${r2!.toFixed(3)})` : "Tendência";

  function exportCSV() {
    const header = ["ano","media_anual","media_geral","slope","intercept","r2"];
    const lines = rows.map(r =>
      [r.ano, r.media_anual, mediaGeral, slope ?? "", intercept ?? "", r2 ?? ""].join(",")
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

  return (
    <div className="w-full">
      {/* Cabeçalho com ΔG/ano, R² e Exportar CSV */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">{title ?? `Tendência ${tipoPTA}`}</h3>
          {showR2 && <span className="text-xs text-gray-600">R² = {r2!.toFixed(3)}</span>}
          {slope != null && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              ΔG: {slopeText}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {eqText && <span className="text-[11px] text-gray-500">{eqText}</span>}
          <button
            onClick={exportCSV}
            className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-50"
            title="Exportar série anual + média + regressão"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis dataKey="ano" stroke={COLORS.axis} tick={{ fill: COLORS.axis }} allowDecimals={false} />
            <YAxis domain={yDomain as [number, number]} stroke={COLORS.axis} tick={{ fill: COLORS.axis }} />
            <Tooltip
              formatter={(v: any, name) => {
                const n = Number(v);
                if (name === "media_anual") return [n.toFixed(dec), "Média anual"];
                if (name === "tendencia")   return [n.toFixed(dec), "Tendência"];
                return [v, name];
              }}
              labelFormatter={(l) => `Ano: ${l}`}
            />
            <Legend />

            {/* Série principal */}
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
                formatter={(v: number) => Number(v).toFixed(dec)}
              />
            </Line>

            {/* Tendência (reta) */}
            {tPoints.length === 2 && (
              <Line
                type="linear"
                data={tPoints}
                dataKey="tendencia"
                name={trendLegendLabel}
                stroke={COLORS.trend}
                strokeDasharray="6 4"
                dot={false}
                legendType="plainline"
                isAnimationActive={false}
              />
            )}

            {/* Média do rebanho */}
            <ReferenceLine
              y={mediaGeral}
              stroke={COLORS.media}
              strokeWidth={2}
              label={{
                value: `Média do rebanho (${mediaGeral.toFixed(dec)})`,
                position: "insideTopRight",
                fill: COLORS.media,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-xs text-gray-600">
        Eixo Y {isLowScalePTA(tipoPTA) ? "otimizado para baixa grandeza" : "automático com margem superior"}.
      </p>
    </div>
  );
}
