"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAGFilters } from "@/features/auditoria/store";
import { PTA_CATALOG } from "@/lib/pta";

type Row = {
  trait_key: string;
  n_total: number;
  top_n: number;     // arredondado
  bottom_n: number;  // arredondado
  top_mean: number | null;
  bottom_mean: number | null;
};

function mean(v: number[]) {
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function safeCols(keys: string[]) {
  // remove vazios e caracteres fora de [a-zA-Z0-9_]
  return keys.filter(
    (t) => typeof t === "string" && t.trim().length > 0 && !t.match(/[^a-zA-Z0-9_]/)
  );
}

export default function Step3QuartisOverview() {
  const { farmId } = useAGFilters();

  // Todas as PTAs disponíveis (filtra *_label/_class)
  const allTraits = useMemo(
    () =>
      Object.keys(PTA_CATALOG ?? {}).filter(
        (k) => !k.endsWith("_label") && !k.endsWith("_class")
      ),
    []
  );

  // Seleção inicial: PTAM, HHP$ (mapeado p/ hhp_dollar) se existirem; senão, primeiras 6
  const initial = useMemo(() => {
    const prefs = safeCols(["ptam", "hhp_dollar"]);
    const base = safeCols(allTraits).slice(0, 6);
    const uniq = Array.from(new Set([...prefs, ...base]));
    return uniq;
  }, [allTraits]);

  const [selected, setSelected] = useState<string[]>(initial);
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectCols = useMemo(() => {
    const cols = ["farm_id", ...safeCols(selected)];
    return Array.from(new Set(cols)).join(",");
  }, [selected]);

  const toggleTrait = (k: string, on?: boolean) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (on ?? !s.has(k)) s.add(k);
      else s.delete(k);
      return Array.from(s);
    });
  };

  const selectAll = () => setSelected(safeCols(allTraits));
  const clearAll = () => setSelected([]);

  async function loadData() {
    setIsLoading(true);
    setErrorMsg(null);
    setRows([]);

    try {
      if (!farmId) {
        setErrorMsg("Selecione um rebanho para carregar os dados.");
        return;
      }
      if (selected.length === 0) {
        setErrorMsg("Selecione ao menos uma PTA.");
        return;
      }

      const { data, error } = await supabase
        .from("females_denorm")
        .select(selectCols)
        .eq("farm_id", farmId);

      if (error) {
        setErrorMsg(
          `Falha ao carregar dados do rebanho: ${error.message}. Verifique RLS/Policies e nomes de colunas.`
        );
        return;
      }

      const result: Row[] = [];

      for (const trait of selected) {
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

        // Ordena DESC para Top e ASC para Bottom
        const sortedDesc = [...values].sort((a, b) => b - a);
        const sortedAsc = [...values].sort((a, b) => a - b);

        // 25% arredondado (mínimo 1 e máximo n_total)
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

      // ordena por maior média do TOP
      result.sort((a, b) => (b.top_mean ?? -Infinity) - (a.top_mean ?? -Infinity));

      setRows(result);
    } catch (e: any) {
      setErrorMsg(`Erro inesperado: ${e?.message ?? "desconhecido"}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]); // recarrega ao trocar o rebanho

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      {/* Box de seleção de PTAs */}
      <Card className="xl:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Selecionar características</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>
              Selecionar todas
            </Button>
            <Button size="sm" variant="outline" onClick={clearAll}>
              Limpar
            </Button>
          </div>
          <ScrollArea className="h-64 rounded border p-2">
            <div className="space-y-2">
              {safeCols(allTraits).map((k) => {
                const label = (PTA_CATALOG as any)?.[k]?.label ?? k.toUpperCase();
                const checked = selected.includes(k);
                return (
                  <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggleTrait(k, Boolean(v))}
                    />
                    <span className="truncate" title={k}>{label}</span>
                  </label>
                );
              })}
            </div>
          </ScrollArea>

          <Button onClick={loadData} disabled={isLoading}>
            {isLoading ? "Calculando..." : "Atualizar"}
          </Button>

          {errorMsg && <div className="text-sm text-red-600">{errorMsg}</div>}
        </CardContent>
      </Card>

      {/* Tabela com as médias */}
      <Card className="xl:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quartis – Top 25% vs Bottom 25%</CardTitle>
        </CardHeader>
        <CardContent>
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
                  const label =
                    (PTA_CATALOG as any)?.[r.trait_key]?.label ?? r.trait_key.toUpperCase();
                  return (
                    <tr key={r.trait_key} className="border-b last:border-0">
                      <td className="py-2 pr-3">{label}</td>
                      <td className="py-2 pr-3">{r.n_total}</td>
                      <td className="py-2 pr-3">{r.top_n}</td>
                      <td className="py-2 pr-3">{r.top_mean != null ? r.top_mean.toFixed(2) : "—"}</td>
                      <td className="py-2 pr-3">{r.bottom_n}</td>
                      <td className="py-2 pr-3">{r.bottom_mean != null ? r.bottom_mean.toFixed(2) : "—"}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && !errorMsg && (
                  <tr>
                    <td colSpan={6} className="py-6 text-muted-foreground">
                      Selecione características e clique em “Atualizar”.
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
