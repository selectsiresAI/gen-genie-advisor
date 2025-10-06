"use client";

import { useEffect, useMemo, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PTA_CATALOG } from "@/lib/pta";
import { useFemales } from "../hooks";
import { useAGFilters } from "../store";

type SeriesPoint = { year: number; n: number; mean: number };

type TraitCardProps = {
  traitKey: string;
  traitLabel: string;
  data: SeriesPoint[];
  showFarmMean: boolean;
  showTrend: boolean;
  domainTicks: number[];
};

const avg = (values: number[]) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;

function getYearFromBirth(birth: unknown): number | null {
  if (!birth) return null;
  if (birth instanceof Date) return birth.getFullYear();
  if (typeof birth === "number") {
    const d = new Date(birth);
    return Number.isFinite(d.getTime()) ? d.getFullYear() : null;
  }
  if (typeof birth === "string") {
    const str = birth.trim();
    if (/^\d{8}$/.test(str)) {
      const y = Number(str.slice(0, 4));
      return Number.isFinite(y) ? y : null;
    }
    const d = new Date(str);
    return Number.isFinite(d.getTime()) ? d.getFullYear() : null;
  }
  return null;
}

function computeSlope(points: SeriesPoint[]): number {
  if (points.length < 2) return 0;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.mean);
  const mx = avg(xs);
  const my = avg(ys);
  const varX = avg(xs.map((x) => (x - mx) ** 2));
  if (!varX) return 0;
  const cov = avg(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  return Math.round((cov / varX) * 10) / 10;
}

function computeTrend(points: SeriesPoint[]) {
  if (points.length < 2) return [] as Array<{ year: number; trend: number }>;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.mean);
  const mx = avg(xs);
  const my = avg(ys);
  const varX = avg(xs.map((x) => (x - mx) ** 2));
  if (!varX) return [];
  const cov = avg(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const slope = cov / varX;
  const intercept = my - slope * mx;
  const firstYear = xs[0];
  const lastYear = xs[xs.length - 1];
  return [
    { year: firstYear, trend: Math.round(intercept + slope * firstYear) },
    { year: lastYear, trend: Math.round(intercept + slope * lastYear) },
  ];
}

const TraitCard = memo(function TraitCard({
  traitKey,
  traitLabel,
  data,
  showFarmMean,
  showTrend,
  domainTicks,
}: TraitCardProps) {
  const totals = data.reduce(
    (acc, p) => {
      acc.sum += p.mean * p.n;
      acc.n += p.n;
      return acc;
    },
    { sum: 0, n: 0 }
  );
  const farmMean = totals.n ? Math.round(totals.sum / totals.n) : 0;
  const slope = computeSlope(data);
  const chartData = data.map((p, i) => ({
    year: p.year,
    n: p.n,
    mean: Math.round(p.mean),
    delta: Math.round(i === 0 ? 0 : p.mean - data[i - 1].mean),
    farmMean,
  }));
  const trend = showTrend ? computeTrend(data) : [];

  return (
    <div className="rounded-2xl shadow overflow-hidden bg-white">
      <div className="bg-black text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
        <div className="truncate">{traitLabel}</div>
        <div className="text-xs opacity-90">
          Tendência: {slope >= 0 ? "+" : ""}
          {slope}/ano
        </div>
      </div>
      <div className="p-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="year"
              domain={[domainTicks[0], domainTicks[domainTicks.length - 1]]}
              ticks={domainTicks}
            />
            <YAxis />
            <Tooltip
              formatter={(value: any, name: string) => {
                if (name === "mean") return [value, "Média anual"];
                if (name === "delta") return [value, "Δ vs ano ant."];
                if (name === "trend") return [value, "Tendência"];
                if (name === "n") return [value, "N"];
                return [value, name];
              }}
              labelFormatter={(label) => `Ano ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="mean"
              fill="rgba(0,0,0,0.08)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="mean"
              name="Média anual"
              stroke="#111827"
              dot={{ r: 4, strokeWidth: 2, stroke: "#111827", fill: "#fff" }}
            />
            {showFarmMean && (
              <ReferenceLine
                y={farmMean}
                stroke="#22C3EE"
                strokeDasharray="6 6"
                label={{
                  value: `Média ${farmMean}`,
                  position: "insideTopLeft",
                }}
              />
            )}
            {showTrend && trend.length === 2 && (
              <Line
                type="linear"
                dataKey="trend"
                name="Tendência"
                stroke="#10B981"
                dot={false}
                data={trend as any}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default function Step5Progressao() {
  const { farmId, ptasSelecionadas = [], setPTAs } = useAGFilters();
  const { data: females = [], isLoading } = useFemales(farmId);
  const [showFarmMean, setShowFarmMean] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  useEffect(() => {
    if (!ptasSelecionadas.length) {
      setPTAs(["hhp_dollar", "tpi", "nm_dollar"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const domainTicks = useMemo(() => {
    const years: number[] = [];
    for (const f of females as any[]) {
      const y = getYearFromBirth((f as any)?.birth_date);
      if (Number.isFinite(y)) years.push(y as number);
    }
    if (!years.length) return [new Date().getFullYear()];
    const min = Math.min(...years);
    const max = Math.max(...years);
    const ticks: number[] = [];
    for (let y = min; y <= max; y++) ticks.push(y);
    return ticks;
  }, [females]);

  const seriesByKey = useMemo(() => {
    const years = domainTicks;
    const out: Record<string, SeriesPoint[]> = {};

    for (const key of ptasSelecionadas) {
      const byYear = new Map<number, number[]>();
      for (const f of females as any[]) {
        const y = getYearFromBirth((f as any)?.birth_date);
        const v = Number((f as any)?.[key]);
        if (Number.isFinite(y) && Number.isFinite(v)) {
          const arr = byYear.get(y as number) ?? [];
          arr.push(v);
          byYear.set(y as number, arr);
        }
      }

      out[key] = years
        .map((y) => {
          const arr = byYear.get(y) ?? [];
          return { year: y, n: arr.length, mean: arr.length ? avg(arr) : 0 };
        })
        .filter((p) => p.n > 0);
    }
    return out;
  }, [ptasSelecionadas, females, domainTicks]);

  const options = useMemo(
    () =>
      PTA_CATALOG.slice().sort(
        (a, b) => (a.preferOrder ?? 999) - (b.preferOrder ?? 999)
      ),
    []
  );

  const labelOf = (key: string) =>
    PTA_CATALOG.find((i) => i.key === key)?.label ?? key.toUpperCase();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progressão Genética — Seleção de PTAs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {options.map((pta) => {
              const active = ptasSelecionadas.includes(pta.key);
              return (
                <button
                  key={pta.key}
                  onClick={() =>
                    setPTAs(
                      active
                        ? ptasSelecionadas.filter((k: string) => k !== pta.key)
                        : [...ptasSelecionadas, pta.key]
                    )
                  }
                  className={`px-3 py-2 rounded-xl border text-sm ${
                    active
                      ? "bg-emerald-50 border-emerald-300"
                      : "hover:bg-gray-50"
                  }`}
                  title={pta.group}
                >
                  {pta.label}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-3">
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={showFarmMean}
                  onChange={(e) => setShowFarmMean(e.target.checked)}
                />
                Mostrar média da fazenda
              </label>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={showTrend}
                  onChange={(e) => setShowTrend(e.target.checked)}
                />
                Mostrar tendência
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Carregando dados...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ptasSelecionadas.map((key) => {
            const data = seriesByKey[key];
            if (!data?.length) return null;
            const label = labelOf(key);
            return (
              <TraitCard
                key={key}
                traitKey={key}
                traitLabel={label}
                data={data}
                showFarmMean={showFarmMean}
                showTrend={showTrend}
                domainTicks={domainTicks}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
