"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
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
  ReferenceLine,
  ReferenceArea,
  Cell,
} from "recharts";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";
import { AlertCircle, TrendingUp, Target } from "lucide-react";

const DEFAULT_SELECTED: string[] = ["hhp_dollar"];
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
  skewness: number;
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
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, q1: 0, q3: 0, cv: 0, skewness: 0 };
  }

  // Média
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;

  // Mediana
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];

  // Desvio padrão
  const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  // Quartis
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];

  // Coeficiente de variação
  const cv = mean !== 0 ? (std / Math.abs(mean)) * 100 : 0;

  // Skewness (assimetria)
  const skewness = n > 2
    ? sorted.reduce((sum, v) => sum + Math.pow((v - mean) / std, 3), 0) / n
    : 0;

  return {
    mean,
    median,
    std,
    min: sorted[0],
    max: sorted[n - 1],
    q1,
    q3,
    cv,
    skewness,
  };
}

function generateCriticalComments(traitKey: string, stats: DescriptiveStats, total: number): string[] {
  const comments: string[] = [];
  const benchmark = IDEAL_BENCHMARKS[traitKey];

  // Análise de média vs benchmark
  if (benchmark) {
    if (stats.mean < benchmark.min) {
      comments.push(`⚠️ Média atual (${stats.mean.toFixed(1)}) está abaixo do mínimo desejável (${benchmark.min}). ${benchmark.description}.`);
    } else if (stats.mean >= benchmark.ideal) {
      comments.push(`✅ Média atual (${stats.mean.toFixed(1)}) atingiu o nível ideal (≥${benchmark.ideal}). Rebanho com excelente mérito genético.`);
    } else {
      comments.push(`📊 Média atual (${stats.mean.toFixed(1)}) está em nível intermediário. Meta ideal: ≥${benchmark.ideal}.`);
    }
  }

  // Análise de variabilidade (CV)
  if (stats.cv < 15) {
    comments.push(`✓ Baixa variabilidade (CV=${stats.cv.toFixed(1)}%). Rebanho homogêneo com seleção consistente.`);
  } else if (stats.cv < 30) {
    comments.push(`→ Variabilidade moderada (CV=${stats.cv.toFixed(1)}%). Há espaço para uniformização genética.`);
  } else {
    comments.push(`⚠️ Alta variabilidade (CV=${stats.cv.toFixed(1)}%). Rebanho heterogêneo - considerar intensificar seleção.`);
  }

  // Análise de assimetria (skewness)
  if (Math.abs(stats.skewness) < 0.5) {
    comments.push(`✓ Distribuição simétrica (normal). Seleção equilibrada sem viés direcional.`);
  } else if (stats.skewness > 0.5) {
    comments.push(`→ Distribuição assimétrica à direita. Concentração de animais com valores abaixo da média - oportunidade de seleção.`);
  } else {
    comments.push(`→ Distribuição assimétrica à esquerda. Concentração de animais com valores acima da média - seleção positiva evidente.`);
  }

  // Análise de outliers
  const iqr = stats.q3 - stats.q1;
  const lowerFence = stats.q1 - 1.5 * iqr;
  const upperFence = stats.q3 + 1.5 * iqr;
  if (stats.min < lowerFence || stats.max > upperFence) {
    comments.push(`📌 Presença de outliers detectada. Avaliar animais extremos para decisões de descarte ou acasalamento estratégico.`);
  }

  // Recomendação final
  if (benchmark && stats.mean < benchmark.ideal) {
    const gap = benchmark.ideal - stats.mean;
    comments.push(`🎯 Recomendação: Para atingir o ideal, aumentar média em ${gap.toFixed(1)} pontos através de acasalamento com touros de alto mérito (>+${(gap * 2).toFixed(0)}).`);
  }

  return comments;
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
    
    // Calcular z-score do midpoint para colorir barras
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
  values: number[];
  stats: DescriptiveStats;
  comments: string[];
};

function EnhancedHistogramCard({ step, series }: { step: number; series: TraitSeries }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const title = `${series.label}`;
  useRegisterChart(`step${step}-distribuicao-${series.traitKey}`, step, `${series.label} (n=${series.total})`, cardRef);

  const { stats } = series;
  const benchmark = IDEAL_BENCHMARKS[series.traitKey];

  // Definir cor das barras baseado no z-score
  const getBarColor = (zScore: number) => {
    if (zScore < 0.5) return "hsl(var(--chart-1))"; // Verde - próximo da média
    if (zScore < 1.5) return "hsl(var(--chart-2))"; // Amarelo - moderado
    return "hsl(var(--chart-3))"; // Vermelho - distante
  };

  return (
    <Card ref={cardRef} className="w-full">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <CardTitle className="text-xl mb-2 flex items-center gap-2">
            {title}
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

        <SingleExportButton
          targetRef={cardRef}
          step={step}
          title={`${series.label} (n=${series.total})`}
          slug={`Distribuicao_${series.traitKey}`}
        />
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        {/* Histograma Grande */}
        <div className="h-96">
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

              {/* Barras com cor dinâmica baseada no z-score */}
              <Bar dataKey="n" radius={[4, 4, 0, 0]}>
                {series.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.zScore)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda de cores */}
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

        {/* Painel de Comentários Críticos */}
        <Alert className="border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4" />
              <strong className="text-sm">Comentários Críticos - Análise Técnica</strong>
            </div>
            <ul className="space-y-1.5 text-sm list-none pl-0">
              {series.comments.map((comment, idx) => (
                <li key={idx} className="leading-relaxed">{comment}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default function Step7Distribuicao() {
  const { farmId } = useAGFilters();
  const allTraits = useAllTraits();

  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState<TraitSeries[]>([]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTraits;
    return allTraits.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q)
    );
  }, [allTraits, search]);

  const toggleTrait = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelected(allTraits.map((t) => t.key));
  const clearAll = () => setSelected([]);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      if (!farmId || selected.length === 0) {
        setSeries([]);
        return;
      }
      setLoading(true);
      try {
        const cols = ["id", ...selected];
        const selectStr = cols.map((c) => `"${c}"`).join(", ");

        const { data, error } = await supabase
          .from("females_denorm")
          .select(selectStr)
          .eq("farm_id", farmId)
          .limit(200000);

        if (error) throw error;

        const out: TraitSeries[] = selected.map((traitKey) => {
          const values = (data ?? [])
            .map((row: any) => {
              const v = row?.[traitKey];
              const num = typeof v === "string" ? Number(v.replace(",", ".")) : v;
              return typeof num === "number" ? num : NaN;
            })
            .filter((v: number) => Number.isFinite(v)) as number[];

          const label = allTraits.find((t) => t.key === traitKey)?.label ?? traitKey;
          
          // Calcular estatísticas descritivas
          const stats = calculateDescriptiveStats(values);
          
          // Gerar comentários críticos
          const comments = generateCriticalComments(traitKey, stats, values.length);
          
          // Construir histograma com as estatísticas
          const histogramData = buildHistogram(values, BINS, stats);
          
          return {
            traitKey,
            label,
            data: histogramData,
            total: values.length,
            values,
            stats,
            comments,
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
  }, [farmId, selected, allTraits]);

  return (
    <ChartExportProvider>
      <BatchExportBar step={7} />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Step 7 — Distribuição de PTAs (Análise Técnica Completa)</CardTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Análise detalhada da distribuição de características genéticas com estatísticas descritivas completas.</p>
            <p className="text-xs">
              Cada histograma apresenta: média, mediana, desvio padrão, quartis, coeficiente de variação e comentários críticos automáticos 
              comparando com metas ideais de seleção.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Escolher PTAs ({selected.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    placeholder="Buscar PTA…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Selecionar todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    Limpar
                  </Button>
                </div>
                <div className="max-h-72 overflow-auto space-y-1 pr-1">
                  {filteredCatalog.map((t) => (
                    <label
                      key={t.key}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1 cursor-pointer hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={selected.includes(t.key)}
                        onCheckedChange={() => toggleTrait(t.key)}
                      />
                      <span className="text-sm">{t.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{t.key}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex gap-2 flex-wrap">
              {selected
                .slice()
                .sort((a, b) =>
                  a === "hhp_dollar" ? -1 : b === "hhp_dollar" ? 1 : 0
                )
                .map((k) => {
                  const label = allTraits.find((t) => t.key === k)?.label ?? k;
                  return (
                    <Badge
                      key={k}
                      variant={k === "hhp_dollar" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleTrait(k)}
                      title="Clique para remover"
                    >
                      {label}
                    </Badge>
                  );
                })}
            </div>
            </div>

            {loading && <div className="text-sm text-muted-foreground">Carregando…</div>}
          </div>

          <div className="space-y-6">
            {series.map((s) => (
              <EnhancedHistogramCard key={s.traitKey} step={7} series={s} />
            ))}
          </div>

          {series.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Selecione ao menos uma PTA para visualizar a distribuição.
            </div>
          )}
        </CardContent>
      </Card>
    </ChartExportProvider>
  );
}
