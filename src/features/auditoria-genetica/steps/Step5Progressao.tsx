"use client";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area, Line, ReferenceLine } from "recharts";
import { useAGFilters } from "../store";
import { useFemales } from "../hooks";
import { mean } from "@/lib/number";

type SeriesPoint = { year: number; n: number; mean: number };

type TraitCardProps = {
  traitKey: string;
  traitLabel: string;
  data: SeriesPoint[];
  showFarmMean: boolean;
  showTrend: boolean;
  domainTicks: number[];
};

function computeSlope(points: SeriesPoint[]) {
  if (points.length < 2) return 0;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.mean);
  const mx = mean(xs);
  const my = mean(ys);
  const varianceX = mean(xs.map((x) => (x - mx) ** 2));
  if (!varianceX) return 0;
  const covariance = mean(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  return Math.round(covariance / varianceX);
}

function computeTrend(points: SeriesPoint[]) {
  if (points.length < 2) return [] as Array<{ year: number; trend: number }>;
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.mean);
  const mx = mean(xs);
  const my = mean(ys);
  const varianceX = mean(xs.map((x) => (x - mx) ** 2));
  if (!varianceX) return [];
  const covariance = mean(xs.map((x, i) => (x - mx) * (ys[i] - my)));
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
  const farmMean = Math.round(mean(data.map((d) => d.mean)));
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
            <XAxis type="number" dataKey="year" domain={[domainTicks[0], domainTicks[domainTicks.length - 1]]} ticks={domainTicks} />
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

const PTA_OPTIONS = [
  { key: "tpi", label: "TPI" },
  { key: "nm_dollar", label: "NM$" },
  { key: "hhp_dollar", label: "HHP$®" },
  { key: "ptam", label: "PTAM" },
  { key: "ptaf", label: "PTAF" },
  { key: "ptap", label: "PTAP" },
];

export default function Step5Progressao() {
  const { farmId, ptasSelecionadas, setPTAs } = useAGFilters();
  const { data: females = [], isLoading } = useFemales(farmId);
  const [showFarmMean, setShowFarmMean] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  const domainTicks = useMemo(() => {
    const set = new Set<number>();
    females.forEach((female: any) => {
      const birthDate = female?.birth_date ? new Date(female.birth_date) : undefined;
      const year = birthDate?.getFullYear();
      if (Number.isFinite(year)) {
        set.add(year as number);
      }
    });
    const values = Array.from(set).sort((a, b) => a - b);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Progressão Genética — Seleção de PTAs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {PTA_OPTIONS.map((pta) => {
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
            const label = PTA_OPTIONS.find((pta) => pta.key === key)?.label ?? key.toUpperCase();
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
