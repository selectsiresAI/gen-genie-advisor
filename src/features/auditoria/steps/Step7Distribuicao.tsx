"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PTA_CATALOG } from "@/lib/pta";
import { useAGFilters } from "@/features/auditoria/store";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Target, ChevronDown, X } from "lucide-react";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";

const DEFAULT_SELECTED: string[] = ["hhp_dollar", "tpi", "nm_dollar", "dpr", "pl", "scs"];
const BINS = 30;

// ========== Interfaces ==========
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

// ========== Benchmarks Ideais ==========
const IDEAL_BENCHMARKS: Record<string, IdealBenchmark> = {
  hhp_dollar: { min: 400, ideal: 600, description: "Valor econômico para alta lucratividade" },
  tpi: { min: 2400, ideal: 2800, description: "Índice de mérito genético superior" },
  nm_dollar: { min: 500, ideal: 700, description: "Valor líquido de mérito elevado" },
  cm_dollar: { min: 400, ideal: 600, description: "Índice de queijo ideal" },
  fm_dollar: { min: 400, ideal: 600, description: "Índice de fluidos elevado" },
  gm_dollar: { min: 400, ideal: 600, description: "Índice de graxa de alto valor" },
  ptam: { min: 800, ideal: 1200, description: "Produção de leite elevada" },
  ptaf: { min: 50, ideal: 80, description: "Produção de gordura superior" },
  ptaf_pct: { min: 0.05, ideal: 0.10, description: "Percentual de gordura ideal" },
  ptap: { min: 40, ideal: 60, description: "Produção de proteína elevada" },
  ptap_pct: { min: 0.04, ideal: 0.08, description: "Percentual de proteína ideal" },
  dpr: { min: 1.0, ideal: 2.5, description: "Taxa de prenhez elevada" },
  pl: { min: 3.0, ideal: 6.0, description: "Longevidade produtiva superior" },
  liv: { min: 3.0, ideal: 6.0, description: "Longevidade funcional ideal" },
  scs: { min: 2.5, ideal: 2.7, description: "Contagem de células somáticas baixa (menor é melhor)" },
  ccr: { min: 1.0, ideal: 2.5, description: "Taxa de concepção de vacas elevada" },
  hcr: { min: 1.0, ideal: 2.5, description: "Taxa de concepção de novilhas elevada" },
  ptat: { min: 1.5, ideal: 2.5, description: "Tipo funcional superior" },
};

// ========== Funções Auxiliares ==========
function useAllTraits() {
  return useMemo(() => {
    const sorted = [...PTA_CATALOG].sort((a, b) => a.label.localeCompare(b.label));
    const hhpFirst = sorted.sort((a, b) => (a.key === "hhp_dollar" ? -1 : b.key === "hhp_dollar" ? 1 : 0));
    return hhpFirst;
  }, []);
}

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

// Cores por z-score
function getBarColor(zScore: number): string {
  if (zScore < 0.5) return "hsl(var(--chart-1))";
  if (zScore < 1.5) return "hsl(var(--chart-2))";
  return "hsl(var(--chart-3))";
}

type TraitSeries = {
  traitKey: string;
  label: string;
  data: { bin: string; binStart: number; binEnd: number; midpoint: number; n: number; zScore: number }[];
  total: number;
  values: number[];
  stats: DescriptiveStats;
};

function HistogramCard({ series, step }: { series: TraitSeries; step: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { stats } = series;
  const benchmark = IDEAL_BENCHMARKS[series.traitKey];
  const chartTitle = `Distribuição — ${series.label}`;
  useRegisterChart(`step7-dist-${series.traitKey}`, step, chartTitle, cardRef);

  return (
    <Card ref={cardRef} className="w-full">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
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
        <SingleExportButton targetRef={cardRef} step={step} title={chartTitle} slug={`DIST_${series.traitKey.toUpperCase()}`} />
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {/* Histograma com cores por z-score */}
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
                        <p className="text-xs text-muted-foreground">
                          {data.zScore < 0.5 ? '✓ Próximo da média' : data.zScore < 1.5 ? '→ Moderado' : '⚠️ Distante da média'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {series.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.zScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda de categorias */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
            <span>Próximo da média (±0.5σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
            <span>Moderado (0.5σ - 1.5σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--chart-3))" }} />
            <span>Distante (&gt;1.5σ)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Step7DistribuicaoContent() {
  const { farmId, ptasSelecionadas = [], setPTAs } = useAGFilters();
  const allTraits = useAllTraits();

  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<TraitSeries[]>([]);
  const [search, setSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Inicializa com PTAs padrão
  useEffect(() => {
    if (!ptasSelecionadas.length) {
      setPTAs(DEFAULT_SELECTED);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Busca paginada para obter todos os registros
  async function fetchAllPaginated(
    selectStr: string, 
    farmIdVal: string
  ): Promise<any[]> {
    const PAGE_SIZE = 1000;
    const allRows: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("females_denorm")
        .select(selectStr)
        .eq("farm_id", farmIdVal)
        .range(from, to);

      if (error) break;

      const pageData = Array.isArray(data) ? data : [];
      allRows.push(...pageData);

      hasMore = pageData.length === PAGE_SIZE;
      page += 1;
    }

    return allRows;
  }

  useEffect(() => {
    let isMounted = true;
    async function run() {
      if (!farmId || !ptasSelecionadas.length) {
        setSeries([]);
        return;
      }
      setLoading(true);
      try {
        const cols = ["id", ...ptasSelecionadas];
        const selectStr = cols.map((c) => `"${c}"`).join(", ");

        const data = await fetchAllPaginated(selectStr, String(farmId));

        const out: TraitSeries[] = ptasSelecionadas.map((traitKey) => {
          const values = (data ?? [])
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
            values,
            stats,
          };
        });

        if (isMounted) setSeries(out);
      } catch (e) {
        console.error("Step7Distribuicao load error:", e);
        if (isMounted) setSeries([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [farmId, ptasSelecionadas, allTraits]);

  const filteredTraits = useMemo(() => {
    if (!search.trim()) return allTraits;
    const s = search.toLowerCase();
    return allTraits.filter(t => 
      t.label.toLowerCase().includes(s) || t.key.toLowerCase().includes(s)
    );
  }, [allTraits, search]);

  const toggleTrait = (key: string) => {
    const newList = ptasSelecionadas.includes(key)
      ? ptasSelecionadas.filter((k) => k !== key)
      : [...ptasSelecionadas, key];
    setPTAs(newList);
  };

  const selectAll = () => {
    setPTAs(allTraits.map(t => t.key));
    setPopoverOpen(false);
  };

  const clearAll = () => {
    setPTAs([]);
  };

  return (
    <div className="space-y-6">
      {/* Seletor de PTAs */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Selecionar PTAs <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <Input
                    placeholder="Buscar PTA..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="p-2 border-b flex gap-2">
                  <Button size="sm" variant="ghost" onClick={selectAll}>Todas</Button>
                  <Button size="sm" variant="ghost" onClick={clearAll}>Limpar</Button>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-2 space-y-1">
                    {filteredTraits.map((trait) => (
                      <label
                        key={trait.key}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={ptasSelecionadas.includes(trait.key)}
                          onCheckedChange={() => toggleTrait(trait.key)}
                        />
                        {trait.label}
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <span className="text-sm text-muted-foreground">
              {ptasSelecionadas.length} selecionadas
            </span>
          </div>

          {/* Badges das PTAs selecionadas */}
          <div className="flex gap-2 flex-wrap">
            {ptasSelecionadas.map((key) => {
              const label = allTraits.find(t => t.key === key)?.label ?? key;
              return (
                <Badge key={key} variant="secondary" className="gap-1">
                  {label}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => toggleTrait(key)}
                  />
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-sm text-muted-foreground">Carregando…</div>}

      {series.map((s) => (
        <HistogramCard key={s.traitKey} series={s} step={7} />
      ))}

      {series.length === 0 && !loading && (
        <div className="text-sm text-muted-foreground">
          Selecione PTAs para visualizar a distribuição.
        </div>
      )}
    </div>
  );
}

export default function Step7Distribuicao() {
  return (
    <ChartExportProvider>
      <BatchExportBar step={7} />
      <Step7DistribuicaoContent />
    </ChartExportProvider>
  );
}
