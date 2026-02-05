"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";
import { useAGFilters } from "@/features/auditoria/store";
import { PTA_CATALOG } from "@/lib/pta";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";
 import { formatPtaValue } from "@/utils/ptaFormat";

type Row = {
  trait_key: string;
  n_total: number;
  top_n: number;
  bottom_n: number;
  top_mean: number | null;
  bottom_mean: number | null;
};

function mean(v: number[]) {
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function safeCols(keys: string[]) {
  return keys.filter(
    (t) => typeof t === "string" && t.trim().length > 0 && !t.match(/[^a-zA-Z0-9_]/)
  );
}

// PTAs padrão para exibição automática
const DEFAULT_PTAS = ["tpi", "ptam", "fm_dollar", "cm_dollar", "nm_dollar", "gm_dollar", "hhp_dollar"];

function Step3QuartisOverviewContent() {
  const { farmId } = useAGFilters();
  const quartisCardRef = useRef<HTMLDivElement>(null);
  const chartTitle = "Quartis – Top 25% vs Bottom 25%";
  useRegisterChart("step3-quartis-overview", 3, chartTitle, quartisCardRef);

  const traitCatalog = PTA_CATALOG ?? [];
  const labelMap = useMemo(() => {
    const entries: Record<string, string> = {};
    traitCatalog.forEach(({ key, label }) => {
      if (key) entries[key] = label;
    });
    return entries;
  }, [traitCatalog]);
  const labelOf = useCallback(
    (key: string) => labelMap[key] ?? key.toUpperCase(),
    [labelMap]
  );

  const [selectedTraits, setSelectedTraits] = useState<string[]>(DEFAULT_PTAS);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Busca paginada para obter todos os animais
  async function fetchAllAnimals(farmId: string, columns: string[]): Promise<any[]> {
    const PAGE_SIZE = 1000;
    const allRows: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("females_denorm")
        .select(["farm_id", ...columns].join(","))
        .eq("farm_id", farmId)
        .range(from, to);

      if (error) throw new Error(error.message);

      const pageData = Array.isArray(data) ? data : [];
      allRows.push(...pageData);

      hasMore = pageData.length === PAGE_SIZE;
      page += 1;
    }

    return allRows;
  }

  async function loadData() {
    setIsLoading(true);
    setErrorMsg(null);
    setRows([]);

    try {
      if (!farmId) {
        setErrorMsg("Selecione um rebanho para carregar os dados.");
        return;
      }
      
      const sanitized = safeCols(selectedTraits);
      if (sanitized.length === 0) {
        setErrorMsg("Selecione ao menos uma PTA.");
        return;
      }

      const data = await fetchAllAnimals(String(farmId), sanitized);

      const result: Row[] = [];

      for (const trait of sanitized) {
        const values = (data ?? [])
          .map((r: any) => (r?.[trait] == null ? undefined : Number(r?.[trait])))
          .filter((v: number | undefined): v is number => Number.isFinite(v as number));

        const n_total = values.length;
        if (n_total === 0) {
          result.push({
            trait_key: trait,
            n_total,
            top_n: 0,
            bottom_n: 0,
            top_mean: null,
            bottom_mean: null,
          });
          continue;
        }

        const sortedDesc = [...values].sort((a, b) => b - a);
        const sortedAsc = [...values].sort((a, b) => a - b);

        const groupSize = Math.min(n_total, Math.max(1, Math.round(0.25 * n_total)));

        const topSlice = sortedDesc.slice(0, groupSize);
        const bottomSlice = sortedAsc.slice(0, groupSize);

        result.push({
          trait_key: trait,
          n_total,
          top_n: groupSize,
          bottom_n: groupSize,
          top_mean: mean(topSlice),
          bottom_mean: mean(bottomSlice),
        });
      }

      // Ordena por maior média do TOP
      result.sort((a, b) => (b.top_mean ?? -Infinity) - (a.top_mean ?? -Infinity));

      setRows(result);
    } catch (e: any) {
      setErrorMsg(`Erro inesperado: ${e?.message ?? "desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedTraits.length > 0) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  const traitsSorted = useMemo(() => {
    return [...traitCatalog].sort((a, b) => a.label.localeCompare(b.label));
  }, [traitCatalog]);

  const toggleTrait = (key: string) => {
    setSelectedTraits((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedTraits(traitCatalog.map((t) => t.key));
  };

  const clearAll = () => {
    setSelectedTraits([]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Painel de seleção */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Selecionar PTAs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Selecionar todas
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Limpar
            </Button>
          </div>
          
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {traitsSorted.map((trait) => (
                <label key={trait.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedTraits.includes(trait.key)}
                    onCheckedChange={() => toggleTrait(trait.key)}
                  />
                  {trait.label}
                </label>
              ))}
            </div>
          </ScrollArea>

          <Button onClick={loadData} disabled={isLoading || selectedTraits.length === 0} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {/* Tabela de resultados */}
      <Card ref={quartisCardRef}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{chartTitle}</CardTitle>
          <SingleExportButton targetRef={quartisCardRef} step={3} title={chartTitle} slug="QUARTIS" />
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-6 text-muted-foreground">Calculando...</div>
          )}
          
          {errorMsg && <div className="text-sm text-red-600 mb-4">{errorMsg}</div>}
          
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">PTA</th>
                  <th className="py-2 pr-3">N total</th>
                  <th className="py-2 pr-3">Top 25% (N)</th>
                  <th className="py-2 pr-3">Média Top 25%</th>
                  <th className="py-2 pr-3">Bottom 25% (N)</th>
                  <th className="py-2 pr-3">Média Bottom 25%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const label = labelOf(r.trait_key);
                  return (
                    <tr key={r.trait_key} className="border-b last:border-0">
                      <td className="py-2 pr-3">{label}</td>
                      <td className="py-2 pr-3">{r.n_total}</td>
                      <td className="py-2 pr-3">{r.top_n}</td>
                       <td className="py-2 pr-3">{r.top_mean != null ? formatPtaValue(label, r.top_mean) : "—"}</td>
                      <td className="py-2 pr-3">{r.bottom_n}</td>
                       <td className="py-2 pr-3">{r.bottom_mean != null ? formatPtaValue(label, r.bottom_mean) : "—"}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && !errorMsg && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-6 text-muted-foreground">
                      Selecione PTAs e clique em "Atualizar".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Step3QuartisOverview() {
  return (
    <ChartExportProvider>
      <BatchExportBar step={3} />
      <Step3QuartisOverviewContent />
    </ChartExportProvider>
  );
}
