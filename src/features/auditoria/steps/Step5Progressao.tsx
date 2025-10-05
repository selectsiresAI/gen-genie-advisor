"use client";

import { useEffect, useMemo, useState } from "react";
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

const mean = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function computeSlope(points: SeriesPoint[]) {
  if (points.length < 2) return 0;
  const xs = points.map((point) => point.year);
  const ys = points.map((point) => point.mean);
  const mx = mean(xs);
  const my = mean(ys);
  const varianceX = mean(xs.map((x) => (x - mx) ** 2));
  if (!varianceX) return 0;
  const covariance = mean(xs.map((x, index) => (x - mx) * (ys[index] - my)));
  return Math.round(covariance / varianceX);
}

function computeTrend(points: SeriesPoint[]) {
  if (points.length < 2) return [] as Array<{ year: number; trend: number }>;
  const xs = points.map((point) => point.year);
  const ys = points.map((point) => point.mean);
  const mx = mean(xs);
  const my = mean(ys);
  const varianceX = mean(xs.map((x) => (x - mx) ** 2));
  if (!varianceX) return [];
  const covariance = mean(xs.map((x, index) => (x - mx) * (ys[index] - my)));
  const slope = covariance / varianceX;
  const intercept = my - slope * mx;
  const firstYear = xs[0];
  const lastYear = xs[xs.length - 1];
  return [
    { year: firstYear, trend: Math.round(intercept + slope * firstYear) },
    { year: lastYear, trend: Math.round(intercept + slope * lastYear) },
  ];
}

function TraitCard({ traitKey, traitLabel, data, showFarmMean, showTrend, domainTicks }: TraitCardProps) {
  const farmMean = Math.round(mean(data.map((point) => point.mean)));
  const slope = computeSlope(data);
  const chartData = data.map((point, index) => ({
    year: point.year,
    n: point.n,
    mean: Math.round(point.mean),
    delta: Math.round(index === 0 ? 0 : point.mean - data[index - 1].mean),
    farmMean,
  }));
  const trend = showTrend ? computeTrend(data) : [];

  return (
    <div className="rounded-2xl shadow overflow-hidden bg-white">
      <div className="bg-black text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
        <div className="truncate">{traitLabel}</div>
        <div className="text-xs opacity-90">Tendência: {slope >= 0 ? "+" : ""}{slope}/ano</div>
      </div>
      <div className="p-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="year"
              domain={[domainTicks[0], domainTicks[domainTicks.length - 1]]}
              ticks={domainTicks}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="mean" fill="rgba(0,0,0,0.08)" stroke="none" />
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
                label={{ value: `Média ${farmMean}`, position: "insideTopLeft" }}
              />
            )}
            {showTrend && trend.length === 2 && (
              <Line type="linear" dataKey="trend" name="Tendência" stroke="#10B981" dot={false} data={trend} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Step5Progressao() {
  const { farmId, ptasSelecionadas, setPTAs } = useAGFilters();
  const { data: females = [], isLoading } = useFemales(farmId);
  const [showFarmMean, setShowFarmMean] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  useEffect(() => {
    if (!ptasSelecionadas?.length) {
      setPTAs(["hhp_dollar", "tpi", "nm_dollar"]);
    }
  }, [ptasSelecionadas, setPTAs]);

  const domainTicks = useMemo(() => {
    const years = new Set<number>();
    females.forEach((female: any) => {
      const birthDate = female?.birth_date ? new Date(female.birth_date) : undefined;
      const year = birthDate?.getFullYear();
      if (Number.isFinite(year)) {
        years.add(year as number);
      }
    });
    const values = Array.from(years).sort((a, b) => a - b);
    return values.length ? values : [new Date().getFullYear()];
  }, [females]);

  const seriesByKey = useMemo(() => {
    const years = domainTicks;
    const output: Record<string, SeriesPoint[]> = {};

    ptasSelecionadas.forEach((key) => {
      const byYear = new Map<number, number[]>();
      females.forEach((female: any) => {
        const birthDate = female?.birth_date ? new Date(female.birth_date) : undefined;
        const year = birthDate?.getFullYear();
        const value = Number(female?.[key]);
        if (Number.isFinite(year) && Number.isFinite(value)) {
          const bucket = byYear.get(year as number) ?? [];
          bucket.push(value as number);
          byYear.set(year as number, bucket);
        }
      });

      output[key] = years
        .map((year) => {
          const values = byYear.get(year) ?? [];
          return {
            year,
            n: values.length,
            mean: values.length ? mean(values) : 0,
          };
        })
        .filter((point) => point.n > 0);
    });

    return output;
  }, [ptasSelecionadas, females, domainTicks]);

  const options = useMemo(
    () => PTA_CATALOG.slice().sort((a, b) => (a.preferOrder ?? 999) - (b.preferOrder ?? 999)),
    []
  );

  const labelOf = (key: string) => PTA_CATALOG.find((item) => item.key === key)?.label ?? key.toUpperCase();

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
                        ? ptasSelecionadas.filter((key) => key !== pta.key)
                        : [...ptasSelecionadas, pta.key]
                    )
                  }
                  className={`px-3 py-2 rounded-xl border text-sm ${
                    active ? "bg-emerald-50 border-emerald-300" : "hover:bg-gray-50"
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
                  onChange={(event) => setShowFarmMean(event.target.checked)}
                />
                Mostrar média da fazenda
              </label>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={showTrend}
                  onChange={(event) => setShowTrend(event.target.checked)}
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
