"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAGFilters } from "@/features/auditoria/store";
import { PTA_CATALOG } from "@/lib/pta";

type TopPct = 10 | 5 | 1;

type ResultRow = {
  trait_key: string;
  n_total: number;
  n_top: number;
  herd_mean: number | null;
  top_mean: number | null;
};

const TOP_PCT_OPTS: TopPct[] = [10, 5, 1];

export default function Step8GeneticBenchmark() {
  const { farmId } = useAGFilters();
  const [region, setRegion] = useState<"Brasil" | "USA" | "EU">("Brasil");
  const [topPct, setTopPct] = useState<TopPct>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<ResultRow[]>([]);

  // PTAs que vamos considerar (ajuste aqui se quiser limitar)
  const traitKeys = useMemo(
    () =>
      Object.keys(PTA_CATALOG ?? {}).filter(
        // mantém apenas traits numéricas usuais no females_denorm
        (k) => !k.endsWith("_label") && !k.endsWith("_class")
      ),
    []
  );

  async function loadData() {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (!farmId) {
        setRows([]);
        setErrorMsg("Selecione um rebanho para carregar os dados.");
        setIsLoading(false);
        return;
      }

      // Monta select com as colunas de interesse
      const selectCols = ["id", ...traitKeys].join(",");

      const { data, error } = await supabase
        .from("females_denorm")
        .select(selectCols)
        .eq("farm_id", farmId);

      if (error) {
        // Mensagem amigável p/ erro de permissão ou RLS
        setErrorMsg(
          "Falha ao carregar a lista de PTAs. Tente “Atualizar”. Se persistir, verifique as permissões do Supabase (RLS/Policy)."
        );
        setRows([]);
        setIsLoading(false);
        return;
      }

      // Calcula médias do rebanho e do Top%
      const newRows: ResultRow[] = [];

      traitKeys.forEach((trait_key) => {
        const vals = (data || [])
          .map((r: any) => (r?.[trait_key] === null ? undefined : Number(r?.[trait_key])))
          .filter((v: number | undefined): v is number => Number.isFinite(v as number));

        if (vals.length === 0) {
          return; // sem dados para este trait
        }

        const n_total = vals.length;
        const herd_mean =
          n_total > 0 ? vals.reduce((a, b) => a + b, 0) / n_total : null;

        // Top% -> ordenar desc e pegar “ceil(n * pct)”
        const sortedDesc = [...vals].sort((a, b) => b - a);
        const k = Math.max(1, Math.ceil((topPct / 100) * n_total));
        const topSlice = sortedDesc.slice(0, k);
        const top_mean =
          topSlice.length > 0
            ? topSlice.reduce((a, b) => a + b, 0) / topSlice.length
            : null;

        newRows.push({
          trait_key,
          n_total,
          n_top: topSlice.length,
          herd_mean,
          top_mean,
        });
      });

      // Remove traits sem dados e ordena por maior top_mean
      const filtered = newRows
        .filter((r) => r.herd_mean !== null && r.top_mean !== null)
        .sort((a, b) => (b.top_mean as number) - (a.top_mean as number));

      setRows(filtered);
    } catch (e: any) {
      setErrorMsg("Erro inesperado ao processar os dados.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Recarrega ao mudar rebanho, região (se desejar usar futuramente) ou Top%
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, region, topPct]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={region}
            onValueChange={(v) => setRegion(v as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Brasil">Brasil</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="EU">EU</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={`${topPct}`}
            onValueChange={(v) => setTopPct(Number(v) as TopPct)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Top %" />
            </SelectTrigger>
            <SelectContent>
              {TOP_PCT_OPTS.map((p) => (
                <SelectItem key={p} value={`${p}`}>{`Top ${p}%`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={loadData} disabled={isLoading}>
          {isLoading ? "Carregando..." : "Atualizar"}
        </Button>

        {farmId && (
          <Badge variant="secondary" className="ml-2">
            Rebanho: {farmId}
          </Badge>
        )}
      </div>

      {errorMsg && (
        <div className="text-sm text-red-600">{errorMsg}</div>
      )}

      {!errorMsg && !isLoading && rows.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Nenhuma PTA disponível.
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((r) => {
          const label =
            (PTA_CATALOG as any)?.[r.trait_key]?.label ?? r.trait_key.toUpperCase();
          return (
            <Card key={r.trait_key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex items-center justify-between">
                  <span>Média do rebanho</span>
                  <strong>
                    {r.herd_mean !== null ? r.herd_mean.toFixed(2) : "—"}
                  </strong>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>{`Média Top ${topPct}% (${r.n_top}/${r.n_total})`}</span>
                  <strong>
                    {r.top_mean !== null ? r.top_mean.toFixed(2) : "—"}
                  </strong>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
