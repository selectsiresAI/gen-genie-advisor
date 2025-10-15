"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
} from "recharts";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";

const DEFAULT_SELECTED: string[] = ["hhp_dollar"];
const BINS = 20;

function useAllTraits() {
  return useMemo(() => {
    const sorted = [...PTA_CATALOG].sort((a, b) => a.label.localeCompare(b.label));
    const hhpFirst = sorted.sort((a, b) => (a.key === "hhp_dollar" ? -1 : b.key === "hhp_dollar" ? 1 : 0));
    return hhpFirst;
  }, []);
}

function buildHistogram(values: number[], bins: number) {
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
    return {
      bin: `${start.toFixed(2)} – ${end.toFixed(2)}`,
      n,
    };
  });

  return data;
}

type TraitSeries = {
  traitKey: string;
  label: string;
  data: { bin: string; n: number }[];
  total: number;
};

function HistogramCard({ step, series }: { step: number; series: TraitSeries }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const title = `${series.label}`;
  useRegisterChart(`step${step}-distribuicao-${series.traitKey}`, step, `${series.label} (n=${series.total})`, cardRef);

  return (
    <Card ref={cardRef} className="mx-auto flex w-full max-w-3xl flex-col">
      <CardHeader className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          {title} <span className="text-xs text-muted-foreground">(n={series.total})</span>
        </CardTitle>
        <SingleExportButton
          targetRef={cardRef}
          step={step}
          title={`${series.label} (n=${series.total})`}
          slug={`Distribuicao_${series.traitKey}`}
        />
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4">
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" tick={{ fontSize: 10 }} interval={3} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="n" />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
          return {
            traitKey,
            label,
            data: buildHistogram(values, BINS),
            total: values.length,
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
          <CardTitle>Step 7 — Distribuição de PTAs</CardTitle>
          <div className="text-sm text-muted-foreground">
            Selecione as características para visualizar a distribuição (histograma). Inicia em HHP$.
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {series.map((s) => (
              <HistogramCard key={s.traitKey} step={7} series={s} />
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
