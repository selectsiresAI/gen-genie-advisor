"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { PTA_CATALOG } from "@/lib/pta";
import { supabase } from "@/integrations/supabase/client";
import { formatPtaValue } from "@/utils/ptaFormat";
import { getAdaptiveYAxisDomainFromValues } from "@/lib/chart-utils";

type SeriesPoint = { year: number; n: number; mean: number };

const avg = (values: number[]) =>
  values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;

// PTAs padrão para o relatório
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

function computeTrend(points: SeriesPoint[]) {
  if (points.length < 2) return { trendLine: [] as Array<{ year: number; trend: number }>, r2: 0, slope: 0 };
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.mean);
  const mx = avg(xs);
  const my = avg(ys);
  const varX = avg(xs.map((x) => (x - mx) ** 2));
  if (!varX) return { trendLine: [], r2: 0, slope: 0 };
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
    r2,
    slope: Math.round(slope * 10) / 10
  };
}

interface AuditoriaStep5SectionProps {
  farmId: string;
  farmName: string;
}

export default function AuditoriaStep5Section({ farmId }: AuditoriaStep5SectionProps) {
  const [females, setFemales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const PAGE_SIZE = 1000;
      const allRows: any[] = [];
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from("females_denorm")
          .select("birth_date, hhp_dollar, tpi, nm_dollar")
          .eq("farm_id", farmId)
          .range(from, to);

        if (error) break;

        const pageData = Array.isArray(data) ? data : [];
        allRows.push(...pageData);

        hasMore = pageData.length === PAGE_SIZE;
        page += 1;
      }

      setFemales(allRows);
      setLoading(false);
    }

    fetchData();
  }, [farmId]);

  const domainTicks = useMemo(() => {
    const years = new Set<number>();
    for (const f of females) {
      const y = getYearFromBirth(f?.birth_date);
      if (Number.isFinite(y)) years.add(y as number);
    }
    if (years.size === 0) return [new Date().getFullYear()];
    
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

    for (const key of DEFAULT_PTAS) {
      const byYear = new Map<number, number[]>();
      
      for (const f of females) {
        const y = getYearFromBirth(f?.birth_date);
        const v = Number(f?.[key]);
        if (Number.isFinite(y) && Number.isFinite(v)) {
          const arr = byYear.get(y as number) ?? [];
          arr.push(v);
          byYear.set(y as number, arr);
        }
      }

      out[key] = domainTicks
        .map((y) => {
          const arr = byYear.get(y) ?? [];
          if (arr.length === 0) return null;
          return { year: y, n: arr.length, mean: avg(arr) };
        })
        .filter((p): p is SeriesPoint => p !== null);
    }
    return out;
  }, [females, domainTicks]);

  const labelOf = (key: string) =>
    PTA_CATALOG.find((i) => i.key === key)?.label ?? key.toUpperCase();

  if (loading) {
    return <div className="py-6 text-muted-foreground">Carregando dados...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DEFAULT_PTAS.map((key) => {
        const data = seriesByKey[key];
        if (!data?.length) return null;
        const label = labelOf(key);
        const trendResult = computeTrend(data);
        
        const chartData = data.map((p) => ({
          year: p.year,
          n: p.n,
          mean: p.mean,
        }));

        return (
          <Card key={key}>
            <CardHeader className="border-b px-4 py-3">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  {label} - Média Anual Por Ano De Nascimento
                </CardTitle>
                {trendResult.r2 > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Tendência (R²={trendResult.r2.toFixed(3)}): {trendResult.slope >= 0 ? "+" : ""}
                    {trendResult.slope}/ano
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="h-64 px-4 pt-4">
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
                      domain={getAdaptiveYAxisDomainFromValues(data.map(d => d.mean))}
                      tickFormatter={(value) => formatPtaValue(key, value)}
                      allowDecimals
                    />
                    <Legend 
                      formatter={(value: string) => {
                        if (value.startsWith("band")) return "";
                        return value;
                      }}
                    />

                    <ReferenceLine
                      y={0}
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2}
                    />

                    <Line
                      type="monotone"
                      dataKey="mean"
                      name={"Média anual " + label}
                      stroke="hsl(var(--foreground))"
                      strokeWidth={2}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const isNegative = payload.mean < 0;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill={isNegative ? "#EF4444" : "#3B82F6"}
                            stroke={isNegative ? "#EF4444" : "#3B82F6"}
                            strokeWidth={2}
                          />
                        );
                      }}
                    />

                    {trendResult.trendLine.length === 2 && (
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
                <h4 className="mb-2 text-sm font-semibold">Média Anual {label} Por Ano</h4>
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="p-2 text-left font-semibold">Ano</th>
                        <th className="p-2 text-right font-semibold">Média</th>
                        <th className="p-2 text-right font-semibold">N</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={row.year} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <td className="p-2">{row.year}</td>
                          <td className="p-2 text-right">{formatPtaValue(key, row.mean)}</td>
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
      })}
    </div>
  );
}
