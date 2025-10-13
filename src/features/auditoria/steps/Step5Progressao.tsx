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
import {
  buildTrendLine,
  computeWeightedMean,
  computeWeightedRegression,
  type WeightedPoint,
} from "@/lib/statistics";
import { useFemales } from "../hooks";
import { useAGFilters } from "../store";

type SeriesPoint = { year: number; n: number; mean: number | null };

type TraitCardProps = {
  traitKey: string;
  traitLabel: string;
  data: SeriesPoint[];
  showFarmMean: boolean;
  showTrend: boolean;
  domainTicks: number[];
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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

const TraitCard = memo(function TraitCard({
  traitKey,
  traitLabel,
  data,
  showFarmMean,
  showTrend,
  domainTicks,
}: TraitCardProps) {
  const weightedPoints = useMemo<WeightedPoint[]>(
    () =>
      data
        .filter((point) => isFiniteNumber(point.mean) && point.n > 0)
        .map((point) => ({
          x: point.year,
          y: point.mean,
          weight: point.n,
        })),
    [data]
  );

  const farmMean = useMemo(
    () => computeWeightedMean(weightedPoints),
    [weightedPoints]
  );

  const regression = useMemo(
    () => computeWeightedRegression(weightedPoints),
    [weightedPoints]
  );

  const trend = useMemo(
    () =>
      showTrend
        ? buildTrendLine(weightedPoints, regression.slope, regression.intercept).map(
            (point) => ({ year: point.x, trend: point.y })
          )
        : [],
    [showTrend, weightedPoints, regression.slope, regression.intercept]
  );

  const chartData = useMemo(
    () =>
      data.map((point, index) => {
        const prevMean = index > 0 ? data[index - 1]?.mean : null;
        const delta =
          isFiniteNumber(point.mean) && isFiniteNumber(prevMean)
            ? point.mean! - (prevMean ?? 0)
            : null;

        return {
          year: point.year,
          n: point.n,
          mean: point.mean,
          delta,
          farmMean,
        };
      }),
    [data, farmMean]
  );

  const slopeDigits = Math.abs(regression.slope) >= 10 ? 0 : 2;
  const slopeText = isFiniteNumber(regression.slope)
    ? `${regression.slope > 0 ? "+" : regression.slope < 0 ? "-" : ""}${Math.abs(
        regression.slope
      ).toLocaleString("pt-BR", {
        minimumFractionDigits: slopeDigits,
        maximumFractionDigits: slopeDigits,
      })}`
    : "0";

  return (
    <div className="rounded-2xl shadow overflow-hidden bg-white">
      <div className="bg-black text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
        <div className="truncate">{traitLabel}</div>
        <div className="text-xs opacity-90">
          Tendência: {slopeText}/ano
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
                if (name === "mean")
                  return [
                    isFiniteNumber(value)
                      ? value.toLocaleString("pt-BR", {
                          minimumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
                          maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
                        })
                      : value,
                    "Média anual",
                  ];
                if (name === "delta")
                  return [
                    isFiniteNumber(value)
                      ? value.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : value,
                    "Δ vs ano ant.",
                  ];
                if (name === "trend")
                  return [
                    isFiniteNumber(value)
                      ? value.toLocaleString("pt-BR", {
                          minimumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
                          maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
                        })
                      : value,
                    "Tendência",
                  ];
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
              connectNulls
            />
            {showFarmMean && isFiniteNumber(farmMean) && (
              <ReferenceLine
                y={farmMean}
                stroke="#22C3EE"
                strokeDasharray="6 6"
                label={{
                  value: `Média ${farmMean.toLocaleString("pt-BR", {
                    minimumFractionDigits: Math.abs(farmMean) >= 100 ? 0 : 2,
                    maximumFractionDigits: Math.abs(farmMean) >= 100 ? 0 : 2,
                  })}`,
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
    const out: Record<string, SeriesPoint[]> = {};

    for (const key of ptasSelecionadas) {
      const byYear = new Map<number, { sum: number; count: number }>();

      for (const f of females as any[]) {
        const y = getYearFromBirth((f as any)?.birth_date);
        const rawValue = (f as any)?.[key];
        const value =
          typeof rawValue === "number"
            ? rawValue
            : rawValue != null
            ? Number(rawValue)
            : null;

        if (Number.isFinite(y) && Number.isFinite(value)) {
          const current = byYear.get(y as number) ?? { sum: 0, count: 0 };
          current.sum += value as number;
          current.count += 1;
          byYear.set(y as number, current);
        }
      }

      const points: SeriesPoint[] = Array.from(byYear.entries())
        .map(([year, bucket]) => ({
          year,
          n: bucket.count,
          mean: bucket.count ? bucket.sum / bucket.count : null,
        }))
        .filter((point) => point.n > 0 && isFiniteNumber(point.mean))
        .sort((a, b) => a.year - b.year);

      out[key] = points;
    }

    return out;
  }, [ptasSelecionadas, females]);

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
