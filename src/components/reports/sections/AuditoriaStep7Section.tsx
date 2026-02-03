"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PTA_CATALOG } from "@/lib/pta";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Target } from "lucide-react";

const DEFAULT_SELECTED: string[] = ["hhp_dollar", "tpi", "nm_dollar", "dpr", "pl", "scs"];
const BINS = 30;

interface DescriptiveStats {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  cv: number;
}

interface IdealBenchmark {
  min: number;
  ideal: number;
  description: string;
}

const IDEAL_BENCHMARKS: Record<string, IdealBenchmark> = {
  hhp_dollar: { min: 400, ideal: 600, description: "Valor econômico para alta lucratividade" },
  tpi: { min: 2400, ideal: 2800, description: "Índice de mérito genético superior" },
  nm_dollar: { min: 500, ideal: 700, description: "Valor líquido de mérito elevado" },
  dpr: { min: 1.0, ideal: 2.5, description: "Taxa de prenhez elevada" },
  pl: { min: 3.0, ideal: 6.0, description: "Longevidade produtiva superior" },
  scs: { min: 2.5, ideal: 2.7, description: "Contagem de células somáticas baixa (menor é melhor)" },
};

function calculateDescriptiveStats(values: number[]): DescriptiveStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  if (n === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, q1: 0, q3: 0, cv: 0 };
  }

  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];

  const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];

  const cv = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;

  return { mean, median, std, min: sorted[0], max: sorted[n - 1], q1, q3, cv };
}

function buildHistogram(values: number[], bins: number, stats: DescriptiveStats) {
  const clean = values.filter((v) => typeof v === "number" && !Number.isNaN(v) && Number.isFinite(v));
  if (clean.length === 0) return [];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const width = (max - min) / bins || 1;

  const counts = new Array(bins).fill(0);
  for (const v of clean) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  const data = counts.map((n, i) => {
    const start = min + i * width;
    const end = start + width;
    const midpoint = (start + end) / 2;
    const zScore = stats.std !== 0 ? Math.abs((midpoint - stats.mean) / stats.std) : 0;
    
    return {
      bin: `${start.toFixed(1)} – ${end.toFixed(1)}`,
      binStart: start,
      binEnd: end,
      midpoint,
      n,
      zScore,
    };
  });

  return data;
}

type TraitSeries = {
  traitKey: string;
  label: string;
  data: { bin: string; binStart: number; binEnd: number; midpoint: number; n: number; zScore: number }[];
  total: number;
  stats: DescriptiveStats;
};

function HistogramCard({ series }: { series: TraitSeries }) {
  const { stats } = series;
  const benchmark = IDEAL_BENCHMARKS[series.traitKey];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex-1">
          <CardTitle className="text-xl mb-2 flex items-center gap-2">
            {series.label}
            <Badge variant="outline" className="text-xs">
              n={series.total}
            </Badge>
          </CardTitle>
          
          {/* Estatísticas Resumidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
            <div className="bg-muted/50 px-2 py-1 rounded">
              <div className="text-xs text-muted-foreground">Média</div>
              <div className="font-semibold">{stats.mean.toFixed(2)}</div>
            </div>
            <div className="bg-muted/50 px-2 py-1 rounded">
              <div className="text-xs text-muted-foreground">Mediana</div>
              <div className="font-semibold">{stats.median.toFixed(2)}</div>
            </div>
            <div className="bg-muted/50 px-2 py-1 rounded">
              <div className="text-xs text-muted-foreground">Desvio Padrão</div>
              <div className="font-semibold">{stats.std.toFixed(2)}</div>
            </div>
            <div className="bg-muted/50 px-2 py-1 rounded">
              <div className="text-xs text-muted-foreground">CV%</div>
              <div className="font-semibold">{stats.cv.toFixed(1)}%</div>
            </div>
            <div className="bg-muted/50 px-2 py-1 rounded">
              <div className="text-xs text-muted-foreground">Mín - Máx</div>
              <div className="font-semibold text-xs">{stats.min.toFixed(1)} – {stats.max.toFixed(1)}</div>
            </div>
            <div className="bg-muted/50 px-2 py-1 rounded">
              <div className="text-xs text-muted-foreground">Q1 - Q3</div>
              <div className="font-semibold text-xs">{stats.q1.toFixed(1)} – {stats.q3.toFixed(1)}</div>
            </div>
          </div>

          {/* Meta Ideal */}
          {benchmark && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Target className="h-3 w-3" />
              <span className="text-muted-foreground">
                Meta ideal: <strong>≥{benchmark.ideal}</strong> ({benchmark.description})
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {/* Histograma com barras pretas */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="bin" 
                tick={{ fontSize: 10 }} 
                interval={Math.floor(series.data.length / 10)}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                allowDecimals={false}
                label={{ value: 'Frequência', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const pct = ((data.n / series.total) * 100).toFixed(1);
                    return (
                      <div className="bg-popover border border-border p-3 rounded-md shadow-lg text-sm">
                        <p className="font-semibold mb-1">{data.bin}</p>
                        <p>Frequência: <strong className="text-primary">{data.n}</strong> ({pct}%)</p>
                        <p className="text-xs text-muted-foreground mt-1">Centro: {data.midpoint.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Barras pretas sólidas para o relatório */}
              <Bar dataKey="n" radius={[4, 4, 0, 0]} fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda de categorias */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-foreground" />
            <span>Próximo da média (±0.5σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted-foreground" />
            <span>Moderado (0.5σ - 1.5σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span>Distante (&gt;1.5σ)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AuditoriaStep7SectionProps {
  farmId: string;
  farmName: string;
}

export default function AuditoriaStep7Section({ farmId }: AuditoriaStep7SectionProps) {
  const allTraits = useMemo(() => {
    const sorted = [...PTA_CATALOG].sort((a, b) => a.label.localeCompare(b.label));
    return sorted.sort((a, b) => (a.key === "hhp_dollar" ? -1 : b.key === "hhp_dollar" ? 1 : 0));
  }, []);

  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<TraitSeries[]>([]);

  useEffect(() => {
    async function run() {
      if (!farmId) {
        setSeries([]);
        setLoading(false);
        return;
      }

      try {
        const PAGE_SIZE = 1000;
        const allRows: any[] = [];
        let page = 0;
        let hasMore = true;

        const cols = ["id", ...DEFAULT_SELECTED];
        const selectStr = cols.map((c) => `"${c}"`).join(", ");

        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;

          const { data, error } = await supabase
            .from("females_denorm")
            .select(selectStr)
            .eq("farm_id", farmId)
            .range(from, to);

          if (error) break;

          const pageData = Array.isArray(data) ? data : [];
          allRows.push(...pageData);

          hasMore = pageData.length === PAGE_SIZE;
          page += 1;
        }

        const out: TraitSeries[] = DEFAULT_SELECTED.map((traitKey) => {
          const values = (allRows ?? [])
            .map((row: any) => {
              const v = row?.[traitKey];
              const num = typeof v === "string" ? Number(v.replace(",", ".")) : v;
              return typeof num === "number" ? num : NaN;
            })
            .filter((v: number) => Number.isFinite(v)) as number[];

          const label = allTraits.find((t) => t.key === traitKey)?.label ?? traitKey;
          const stats = calculateDescriptiveStats(values);
          const histogramData = buildHistogram(values, BINS, stats);
          
          return {
            traitKey,
            label,
            data: histogramData,
            total: values.length,
            stats,
          };
        });

        setSeries(out);
      } catch (e) {
        console.error("AuditoriaStep7Section load error:", e);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [farmId, allTraits]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando…</div>;
  }

  if (series.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum dado disponível.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-report-charts="histogram-container">
      {series.map((s) => (
        <div 
          key={s.traitKey} 
          data-chart-page="histogram" 
          data-chart-label={s.label}
          data-chart-key={s.traitKey}
        >
          <HistogramCard series={s} />
        </div>
      ))}
    </div>
  );
}
