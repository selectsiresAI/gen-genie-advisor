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

type BenchRow = {
  trait_key: string;
  herd: { n_total: number; n_top: number; mean_top: number | null };
  global: { n_total: number; n_top: number; mean_top: number | null };
};

const TOP_PCT_OPTS: TopPct[] = [10, 5, 1];

/**
 * Util: média segura
 */
function mean(v: number[]) {
  if (!v.length) return null;
  const s = v.reduce((a, b) => a + b, 0);
  return s / v.length;
}

/**
 * Calcula Top% (desc) e média do Top
 */
function topPctStats(values: number[], pct: TopPct) {
  if (!values.length) return { n_total: 0, n_top: 0, mean_top: null as number | null };
  const sorted = [...values].sort((a, b) => b - a);
  const k = Math.max(1, Math.ceil((pct / 100) * sorted.length));
  const slice = sorted.slice(0, k);
  return { n_total: sorted.length, n_top: slice.length, mean_top: mean(slice) };
}

export default function Step8GeneticBenchmark() {
  const { farmId } = useAGFilters();
  const [topPct, setTopPct] = useState<TopPct>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rows, setRows] = useState<BenchRow[]>([]);

  // Escolha das PTAs (você pode limitar aqui se quiser)
  const traitKeys = useMemo(
    () =>
      Object.keys(PTA_CATALOG ?? {}).filter(
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

      // Monta lista de colunas numéricas necessárias
      const selectCols = ["id", ...traitKeys].join(",");

      // 1) Dados do rebanho (subset por farm_id)
      const { data: herdData, error: herdErr } = await supabase
        .from("females_denorm")
        .select(selectCols)
        .eq("farm_id", farmId);

      if (herdErr) {
        setErrorMsg(
          "Falha ao carregar dados do rebanho. Verifique RLS/Policies do Supabase."
        );
        setRows([]);
        setIsLoading(false);
        return;
      }

      // 2) Dados globais (todo o banco sem filtro)
      const { data: globalData, error: globErr } = await supabase
        .from("females_denorm")
        .select(selectCols);

      if (globErr) {
        setErrorMsg(
          "Falha ao carregar dados globais. Verifique RLS/Policies do Supabase."
        );
        setRows([]);
        setIsLoading(false);
        return;
      }

      // 3) Para cada trait, calcula Top% do rebanho e Top% global
      const result: BenchRow[] = [];

      for (const trait of traitKeys) {
        const herdVals = (herdData ?? [])
          .map((r: any) => (r?.[trait] === null ? undefined : Number(r?.[trait])))
          .filter((v: number | undefined): v is number => Number.isFinite(v as number));

        const globalVals = (globalData ?? [])
          .map((r: any) => (r?.[trait] === null ? undefined : Number(r?.[trait])))
          .filter((v: number | undefined): v is number => Number.isFinite(v as number));

        // ignora trait sem valores em ambos os conjuntos
        if (!herdVals.length && !globalVals.length) continue;

        const herdStats = topPctStats(herdVals, topPct);
        const globalStats = topPctStats(globalVals, topPct);

        result.push({
          trait_key: trait,
          herd: herdStats,
          global: globalStats,
        });
      }

      // Ordena por diferença entre Top% rebanho e Top% global (opcional)
      result.sort(
        (a, b) =>
          (b.herd.mean_top ?? -Infinity) - (b.global.mean_top ?? -Infinity) -
          ((a.herd.mean_top ?? -Infinity) - (a.global.mean_top ?? -Infinity))
      );

      setRows(result);
    } catch (_e) {
      setErrorMsg("Erro inesperado ao processar os dados.");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, topPct]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <Select value={`${topPct}`} onValueChange={(v) => setTopPct(Number(v) as TopPct)}>
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

      {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}

      {!errorMsg && !isLoading && rows.length === 0 && (
        <div className="text-sm text-muted-foreground">Nenhuma PTA disponível.</div>
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
              <CardContent className="text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>
                    {`Top ${topPct}% do rebanho`}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({r.herd.n_top}/{r.herd.n_total})
                    </span>
                  </span>
                  <strong>
                    {r.herd.mean_top !== null ? r.herd.mean_top.toFixed(2) : "—"}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>
                    {`Top ${topPct}% global (todos os rebanhos)`}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({r.global.n_top}/{r.global.n_total})
                    </span>
                  </span>
                  <strong>
                    {r.global.mean_top !== null ? r.global.mean_top.toFixed(2) : "—"}
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
