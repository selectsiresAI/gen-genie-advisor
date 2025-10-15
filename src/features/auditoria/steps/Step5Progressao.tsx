"use client";

import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import {
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
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";

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

const DEFAULT_TICK_STEP = 0.5;
const TRAIT_TICK_STEPS: Record<string, number> = {
  scs: 0.03,
  ptaf_pct: 0.03,
  ptap_pct: 0.03,
};

const EPSILON = 1e-9;

const SCS_FIXED_TICKS = [
  2.4,
  2.45,
  2.55,
  2.6,
  2.65,
  2.7,
  2.75,
  2.8,
  2.85,
  2.9,
  2.95,
  3.0,
  3.05,
  3.1,
  3.15,
  3.25,
  3.35,
  3.4,
].map((value) => Number(value.toFixed(2)));

const SCS_FIXED_DOMAIN: [number, number] = [
  SCS_FIXED_TICKS[0],
  SCS_FIXED_TICKS[SCS_FIXED_TICKS.length - 1],
];

function resolveTickStep(traitKey: string) {
  const normalized = traitKey.toLowerCase();
  return TRAIT_TICK_STEPS[normalized] ?? DEFAULT_TICK_STEP;
}

function buildAxisDomain(values: number[], step: number) {
  if (!Number.isFinite(step) || step <= 0) {
    return { domain: [-1, 1] as [number, number], ticks: [-1, 0, 1] };
  }

  const finiteValues = values.filter((value) => Number.isFinite(value)) as number[];

  if (finiteValues.length === 0) {
    const baseline = step * 2;
    const safeMin = Number((-baseline).toFixed(4));
    const safeMax = Number(baseline.toFixed(4));
    const safeStep = Number(step.toFixed(4));
    const ticks: number[] = [];
    for (let tick = safeMin; tick <= safeMax + safeStep / 2; tick += safeStep) {
      ticks.push(Number(tick.toFixed(2)));
    }
    return { domain: [safeMin, safeMax] as [number, number], ticks };
  }

  const includeZero = [...finiteValues, 0];
  let minValue = Math.min(...includeZero);
  let maxValue = Math.max(...includeZero);

  if (minValue === maxValue) {
    minValue -= step;
    maxValue += step;
  } else {
    const padding = step * 0.25;
    minValue -= padding;
    maxValue += padding;
  }

  const alignDown = (value: number) => Math.floor((value + EPSILON) / step) * step;
  const alignUp = (value: number) => Math.ceil((value - EPSILON) / step) * step;

  let domainMin = alignDown(minValue);
  let domainMax = alignUp(maxValue);

  if (domainMin === domainMax) {
    domainMin -= step;
    domainMax += step;
  }

  const safeMin = Number(domainMin.toFixed(4));
  const safeMax = Number(domainMax.toFixed(4));
  const safeStep = Number(step.toFixed(4));

  const ticks: number[] = [];
  for (let tick = safeMin; tick <= safeMax + safeStep / 2; tick += safeStep) {
    ticks.push(Number(tick.toFixed(2)));
  }

  return { domain: [safeMin, safeMax] as [number, number], ticks };
}

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
  if (points.length < 2) return { trendLine: [] as Array<{ year: number; trend: number }>, r2: 0 };
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.mean);
  const mx = avg(xs);
  const my = avg(ys);
  const varX = avg(xs.map((x) => (x - mx) ** 2));
  if (!varX) return { trendLine: [], r2: 0 };
  const cov = avg(xs.map((x, i) => (x - mx) * (ys[i] - my)));
  const slope = cov / varX;
  const intercept = my - slope * mx;
  
  // Calcular R²
  const predictions = xs.map(x => intercept + slope * x);
  const ssRes = ys.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0);
  const ssTot = ys.reduce((sum, y) => sum + Math.pow(y - my, 2), 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
  
  const firstYear = xs[0];
  const lastYear = xs[xs.length - 1];
  return {
    trendLine: [
      { year: firstYear, trend: intercept + slope * firstYear },
      { year: lastYear, trend: intercept + slope * lastYear },
    ],
    r2
  };
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
  const farmMean = totals.n ? totals.sum / totals.n : 0;
  const slope = computeSlope(data);
  const chartData = data.map((p, i) => ({
    year: p.year,
    n: p.n,
    mean: p.mean,
    delta: i === 0 ? 0 : p.mean - data[i - 1].mean,
    farmMean,
  }));
  const trendResult = useMemo(
    () => (showTrend ? computeTrend(data) : { trendLine: [], r2: 0 }),
    [data, showTrend]
  );

  const tickStep = useMemo(() => resolveTickStep(traitKey), [traitKey]);

  const axis = useMemo(() => {
    if (traitKey.toLowerCase() === "scs") {
      return {
        domain: [...SCS_FIXED_DOMAIN] as [number, number],
        ticks: [...SCS_FIXED_TICKS],
      };
    }

    const values = [
      ...data.map((point) => point.mean),
      showFarmMean ? farmMean : null,
      ...(showTrend ? trendResult.trendLine.map((point) => point.trend) : []),
    ].filter((value): value is number => Number.isFinite(value));

    return buildAxisDomain(values, tickStep);
  }, [data, farmMean, showFarmMean, showTrend, tickStep, traitKey, trendResult]);

  const cardRef = useRef<HTMLDivElement>(null);
  const displayTitle = `${traitLabel} - Média Anual Por Ano De Nascimento`;
  useRegisterChart(`step5-${traitKey}`, 5, displayTitle, cardRef);

  return (
    <Card ref={cardRef} className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{displayTitle}</CardTitle>
          {showTrend && trendResult.r2 > 0 && (
            <div className="text-xs text-muted-foreground">
              Tendência (R²={trendResult.r2.toFixed(3)}): {slope >= 0 ? "+" : ""}
              {slope}/ano
            </div>
          )}
        </div>
        <SingleExportButton
          targetRef={cardRef}
          step={5}
          title={displayTitle}
          slug={`Progressao_${traitKey}`}
        />
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="h-80 px-4 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="year"
                domain={[domainTicks[0], domainTicks[domainTicks.length - 1]]}
                ticks={domainTicks}
                allowDecimals={false}
              />
              <YAxis
                domain={axis.domain}
                ticks={axis.ticks}
                tickFormatter={(value) => value.toFixed(2)}
                allowDecimals
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "mean")
                    return [typeof value === "number" ? value.toFixed(2) : value, "Média anual " + traitLabel];
                  if (name === "trend")
                    return [
                      typeof value === "number" ? value.toFixed(2) : value,
                      "Tendência (R²=" + trendResult.r2.toFixed(3) + ")",
                    ];
                  if (name === "n") return [value, "N"];
                  return [value, name];
                }}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend />

              <ReferenceLine
                y={0}
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                label={{
                  value: "0",
                  position: "insideLeft",
                  fill: "hsl(var(--foreground))",
                }}
              />

              <Line
                type="monotone"
                dataKey="mean"
                name={"Média anual " + traitLabel}
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const isNegative = payload.mean < 0;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={isNegative ? "#EF4444" : "#3B82F6"}
                      stroke={isNegative ? "#EF4444" : "#3B82F6"}
                      strokeWidth={2}
                    />
                  );
                }}
              />

              {showFarmMean && (
                <ReferenceLine
                  y={farmMean}
                  stroke="#F59E0B"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Média geral (${farmMean.toFixed(2)})`,
                    position: "insideTopRight",
                    fill: "#F59E0B",
                    fontSize: 12,
                  }}
                />
              )}

              {showTrend && trendResult.trendLine.length === 2 && (
                <Line
                  type="linear"
                  dataKey="trend"
                  name={"Tendência (R²=" + trendResult.r2.toFixed(3) + ")"}
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  data={trendResult.trendLine as any}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t px-4 pb-4 pt-4">
          <h4 className="mb-2 text-sm font-semibold">Média Anual {traitLabel} Por Ano</h4>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-2 text-left font-semibold">year</th>
                  <th className="p-2 text-right font-semibold">mean_{traitKey}</th>
                  <th className="p-2 text-right font-semibold">n</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={row.year} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="p-2">{row.year}</td>
                    <td className="p-2 text-right">{row.mean.toFixed(2)}</td>
                    <td className="p-2 text-right">{row.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
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
    const years = new Set<number>();
    for (const f of females as any[]) {
      const y = getYearFromBirth((f as any)?.birth_date);
      if (Number.isFinite(y)) years.add(y as number);
    }
    if (years.size === 0) return [new Date().getFullYear()];
    
    // Criar array com TODOS os anos entre min e max
    const sortedYears = Array.from(years).sort((a, b) => a - b);
    const minYear = sortedYears[0];
    const maxYear = sortedYears[sortedYears.length - 1];
    const allYears: number[] = [];
    for (let y = minYear; y <= maxYear; y++) {
      allYears.push(y);
    }
    return allYears;
  }, [females]);

  const seriesByKey = useMemo(() => {
    const out: Record<string, SeriesPoint[]> = {};

    for (const key of ptasSelecionadas) {
      const byYear = new Map<number, number[]>();
      
      // Agrupar valores por ano
      for (const f of females as any[]) {
        const y = getYearFromBirth((f as any)?.birth_date);
        const v = Number((f as any)?.[key]);
        if (Number.isFinite(y) && Number.isFinite(v)) {
          const arr = byYear.get(y as number) ?? [];
          arr.push(v);
          byYear.set(y as number, arr);
        }
      }

      // Criar série com TODOS os anos do domínio (incluindo anos sem dados)
      out[key] = domainTicks
        .map((y) => {
          const arr = byYear.get(y) ?? [];
          if (arr.length === 0) return null; // Não incluir anos sem dados
          return { year: y, n: arr.length, mean: avg(arr) };
        })
        .filter((p): p is SeriesPoint => p !== null);
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
    <ChartExportProvider>
      <BatchExportBar step={5} />
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
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      active ? "border-emerald-300 bg-emerald-50" : "hover:bg-gray-50"
                    }`}
                    title={pta.group}
                  >
                    {pta.label}
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-black"
                    checked={showFarmMean}
                    onChange={(e) => setShowFarmMean(e.target.checked)}
                  />
                  Mostrar média da fazenda
                </label>
                <label className="flex items-center gap-2 text-sm">
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
            <RefreshCw className="mr-2 h-6 w-6 animate-spin" /> Carregando dados...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
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
    </ChartExportProvider>
  );
}
