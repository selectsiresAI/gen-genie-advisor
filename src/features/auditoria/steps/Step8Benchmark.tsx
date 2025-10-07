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

function mean(v: number[]) {
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
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

  // Lista de traits numéricas (evita *_label, *_class)
  const traitKeys = useMemo(
    () =>
      Object.keys(PTA_CATALOG ?? {}).filter(
        (k) => !k.endsWith("_label") && !k.endsWith("_class")
      ),
    []
  );

  // Monta o select apenas com colunas que existem
  const selectCols = useMemo(() => {
    const base = ["farm_id"];
    const uniq = [...new Set([...base, ...traitKeys])];
    return uniq.join(",");
  }, [traitKeys]);

  async function loadData() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (!farmId) {
        setRows([]);
        setErrorMsg("Selecione um rebanho para carregar os dados.");
        return;
      }

      // 1) Herd (filtrado)
      const { data: herdData, error: herdErr } = await supabase
        .from("females_denorm")
        .select(selectCols)
        .eq("farm_id", farmId);

      if (herdErr) {
        setRows([]);
        setErrorMsg(
          `Falha ao carregar dados do rebanho (${herdErr.message}). Verifique RLS/Policies e nomes de colunas.`
        );
        return;
      }

      // 2) Global (sem filtro)
      const { data: globalData, error: globErr } = await supabase
        .from("females_denorm")
        .select(selectCols);

      if (globErr) {
        setRows([]);
        setErrorMsg(
          `Falha ao carregar dados globais (${globErr.message}). Verifique RLS/Policies.`
        );
        return;
      }

      // 3) Computa Top% herd vs global por trait
      const result: BenchRow[] = [];
      for (const trait of traitKeys) {
        const hv = (herdData ?? [])
          .map((r: any) => (r?.[trait] == null ? undefined : Number(r?.[trait])))
          .filter((v: number | undefined): v is number => Number.isFinite(v as number));

        const gv = (globalData ?? [])
          .map((r: any) => (r?.[trait] == null ? undefined : Number(r?.[trait])))
          .filter((v: number | undefined): v is number => Number.isFinite(v as number));

        if (!hv.length && !gv.length) continue;

        result.push({
          trait_key: trait,
          herd: topPctStats(hv, topPct),
          global: topPctStats(gv, topPct),
        });
      }

      result.sort(
        (a, b) =>
          (b.herd.mean_top ?? -Infinity) - (a.herd.mean_top ?? -Infinity)
      );

      setRows(result);
    } catch (e: any) {
      setRows([]);
      setErrorMsg(`Erro inesperado: ${e?.message ?? "desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Carrega quando mudar farm ou top%
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, topPct]);

  // Botão de teste (debug rápido)
  async function debugTest() {
    const { data, error } = await supabase
      .from("females_denorm")
      .select("farm_id")
      .eq("farm_id", farmId)
      .limit(1);
    console.log("[DEBUG Step8] farmId=", farmId, { data, error });
    alert(error ? `Erro: ${error.message}` : `OK: retornou ${data?.length ?? 0} linha(s). Veja o console.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-40">
          <Select value={`${topPct}`} onValueChange={(v) => setTopPct(Number(v) as TopPct)}>
            <SelectTrigger><SelectValue placeholder="Top %" /></SelectTrigger>
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

        <Button variant="outline" onClick={debugTest} title="Teste rápido de acesso (log no console)">
          Debug
        </Button>

        {farmId && (
          <Badge variant="secondary" className="ml-2">Rebanho: {farmId}</Badge>
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
                    Top {topPct}% do rebanho
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({r.herd.n_top}/{r.herd.n_total})
                    </span>
                  </span>
                  <strong>{r.herd.mean_top != null ? r.herd.mean_top.toFixed(2) : "—"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Top {topPct}% global
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({r.global.n_top}/{r.global.n_total})
                    </span>
                  </span>
                  <strong>{r.global.mean_top != null ? r.global.mean_top.toFixed(2) : "—"}</strong>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
