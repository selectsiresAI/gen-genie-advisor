"use client";

import { useEffect, useMemo, useRef, memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw } from "lucide-react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PTA_CATALOG } from "@/lib/pta";
import { useFemales } from "../hooks";
import { useAGFilters } from "../store";
import { formatPtaValue } from "@/utils/ptaFormat";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";
import { getAdaptiveYAxisDomainFromValues } from "@/lib/chart-utils";

type SeriesPoint = { year: number; n: number; mean: number };

type TraitCardProps = {
  traitKey: string;
  traitLabel: string;
  data: SeriesPoint[];
  domainTicks: number[];
  showMean: boolean;
  showTrend: boolean;
  farmMean: number;
};

const avg = (values: number[]) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;

// PTAs padrão
const DEFAULT_PTAS = ["hhp_dollar", "tpi", "nm_dollar"];

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
  domainTicks,
  showMean,
  showTrend,
  farmMean,
}: TraitCardProps) {
  const slope = computeSlope(data);
  const chartData = data.map((p, i) => ({
    year: p.year,
    n: p.n,
    mean: p.mean,
    delta: i === 0 ? 0 : p.mean - data[i - 1].mean,
    farmMean,
  }));
  const trendResult = useMemo(() => computeTrend(data), [data]);

  // Domínio adaptativo do eixo Y baseado nos dados reais
  const yDomain = useMemo(() => {
    const allValues = [
      ...data.map((point) => point.mean),
      ...(showTrend && trendResult.trendLine.length ? trendResult.trendLine.map((point) => point.trend) : []),
      ...(showMean ? [farmMean] : []),
    ].filter((value): value is number => Number.isFinite(value));
    
    return getAdaptiveYAxisDomainFromValues(allValues);
  }, [data, showTrend, showMean, farmMean, trendResult]);

  const cardRef = useRef<HTMLDivElement>(null);
  const displayTitle = `${traitLabel} - Média Anual Por Ano De Nascimento`;
  useRegisterChart(`step5-progressao-${traitKey}`, 5, displayTitle, cardRef);

  return (
    <Card ref={cardRef} className="overflow-hidden">
      <CardHeader className="border-b px-4 py-3 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{displayTitle}</CardTitle>
          {showTrend && trendResult.r2 > 0 && (
            <div className="text-xs text-muted-foreground">
              Tendência (R²={trendResult.r2.toFixed(3)}): {slope >= 0 ? "+" : ""}
              {slope}/ano
            </div>
          )}
        </div>
        <SingleExportButton targetRef={cardRef} step={5} title={displayTitle} slug={`PROGRESSAO_${traitKey.toUpperCase()}`} />
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
                domain={yDomain}
                tickFormatter={(value) => formatPtaValue(traitKey, value)}
                allowDecimals
              />
              <RechartsTooltip
                formatter={(value: any, name: string) => {
                  if (name === "mean")
                    return [typeof value === "number" ? formatPtaValue(traitKey, value) : value, "Média anual " + traitLabel];
                  if (name === "trend")
                    return [
                      typeof value === "number" ? formatPtaValue(traitKey, value) : value,
                      "Tendência (R²=" + trendResult.r2.toFixed(3) + ")",
                    ];
                  if (name === "farmMean")
                    return [typeof value === "number" ? formatPtaValue(traitKey, value) : value, "Média geral"];
                  if (name === "n") return [value, "N"];
                  return [value, name];
                }}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend 
                formatter={(value: string) => {
                  if (value.startsWith("band")) return "";
                  return value;
                }}
                wrapperStyle={{ paddingTop: 8 }}
              />

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

              {showMean && (
                <ReferenceLine
                  y={farmMean}
                  stroke="#10B981"
                  strokeWidth={1.5}
                  strokeDasharray="8 8"
                  label={{
                    value: `Média: ${formatPtaValue(traitKey, farmMean)}`,
                    position: "insideTopRight",
                    fill: "#10B981",
                    fontSize: 11,
                  }}
                />
              )}

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
                    <td className="p-2 text-right">{formatPtaValue(traitKey, row.mean)}</td>
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

function Step5ProgressaoContent() {
  const { farmId, ptasSelecionadas = [], setPTAs } = useAGFilters();
  const { data: females = [], isLoading } = useFemales(farmId);
  
  const [showMean, setShowMean] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  useEffect(() => {
    if (!ptasSelecionadas.length) {
      setPTAs(DEFAULT_PTAS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const domainTicks = useMemo(() => {
    const years = new Set<number>();
    for (const f of females as any[]) {
      const y = getYearFromBirth((f as any)?.birth_date);
      if (Number.isFinite(y)) years.add(y as number);
    }
    if (years.size === 0) return [];
    
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
    const out: Record<string, { series: SeriesPoint[]; farmMean: number }> = {};

    for (const key of ptasSelecionadas) {
      const byYear = new Map<number, number[]>();
      const allValues: number[] = [];
      
      for (const f of females as any[]) {
        const y = getYearFromBirth((f as any)?.birth_date);
        const v = Number((f as any)?.[key]);
        if (Number.isFinite(y) && Number.isFinite(v)) {
          const arr = byYear.get(y as number) ?? [];
          arr.push(v);
          byYear.set(y as number, arr);
          allValues.push(v);
        }
      }

      const farmMean = allValues.length ? avg(allValues) : 0;

      out[key] = {
        series: domainTicks
          .map((y) => {
            const arr = byYear.get(y) ?? [];
            if (arr.length === 0) return null;
            return { year: y, n: arr.length, mean: avg(arr) };
          })
          .filter((p): p is SeriesPoint => p !== null),
        farmMean,
      };
    }
    return out;
  }, [ptasSelecionadas, females, domainTicks]);

  // Detectar quais PTAs possuem dados no rebanho
  const availablePtas = useMemo(() => {
    const available = new Set<string>();
    for (const pta of PTA_CATALOG) {
      for (const f of females as any[]) {
        const v = Number((f as any)?.[pta.key]);
        if (Number.isFinite(v) && v !== 0) {
          available.add(pta.key);
          break;
        }
      }
    }
    return available;
  }, [females]);

  const labelOf = (key: string) =>
    PTA_CATALOG.find((i) => i.key === key)?.label ?? key.toUpperCase();

  const togglePta = (key: string) => {
    if (!availablePtas.has(key)) return; // Não permitir toggle de PTAs sem dados
    const newList = ptasSelecionadas.includes(key)
      ? ptasSelecionadas.filter((k) => k !== key)
      : [...ptasSelecionadas, key];
    setPTAs(newList);
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <TooltipProvider delayDuration={200}>
              {PTA_CATALOG.map((pta) => {
                const hasData = availablePtas.has(pta.key);
                const isSelected = ptasSelecionadas.includes(pta.key);
                
                if (!hasData) {
                  return (
                    <Tooltip key={pta.key}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className="opacity-40 cursor-not-allowed"
                        >
                          {pta.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sem dados disponíveis no rebanho</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                
                return (
                  <Badge
                    key={pta.key}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePta(pta.key)}
                  >
                    {pta.label}
                  </Badge>
                );
              })}
            </TooltipProvider>
          </div>
          
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={showMean} onCheckedChange={(v) => setShowMean(!!v)} />
              Mostrar média geral
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={showTrend} onCheckedChange={(v) => setShowTrend(!!v)} />
              Mostrar tendência
            </label>
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
            // Não renderizar gráfico se o trait não possui dados no rebanho
            if (!availablePtas.has(key)) return null;
            
            const item = seriesByKey[key];
            if (!item?.series?.length) return null;
            const label = labelOf(key);
            return (
              <TraitCard
                key={key}
                traitKey={key}
                traitLabel={label}
                data={item.series}
                domainTicks={domainTicks}
                showMean={showMean}
                showTrend={showTrend}
                farmMean={item.farmMean}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Step5Progressao() {
  return (
    <ChartExportProvider>
      <BatchExportBar step={5} />
      <Step5ProgressaoContent />
    </ChartExportProvider>
  );
}
