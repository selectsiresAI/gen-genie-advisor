"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAGFilters } from "../store";
import { PTA_CATALOG } from "../ptas";

const MAX_PTAS = 10;
const GROUP_ORDER = [
  "Índices",
  "Produção",
  "Composição",
  "Saúde",
  "Fertilidade",
  "Tipo",
  "Outros",
];

interface Row {
  index_label: string;
  group_label: string;
  trait_key: string;
  mean_value: number;
  n: number;
  category_label?: string | null;
}

interface GroupedOption {
  group: string;
  items: Array<{ key: string; label: string }>;
}

export default function Step7QuartisIndices() {
  const { farmId } = useAGFilters();
  const [indexA, setIndexA] = useState("hhp_dollar");
  const [indexB, setIndexB] = useState("nm_dollar");
  const [availableTraits, setAvailableTraits] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>(["ptam", "ptaf", "ptap"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [limitWarning, setLimitWarning] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadColumns() {
      const { data, error } = await supabase.rpc("ag_list_pta_columns");
      if (!active) return;
      if (error) {
        console.error("Failed to list PTA columns", error);
        setAvailableTraits([]);
        return;
      }
      const cols = Array.isArray(data)
        ? data.map((item: { column_name?: string }) => String(item.column_name))
        : [];
      setAvailableTraits(cols);
    }
    loadColumns();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!availableTraits.length) return;
    const availableSet = new Set(availableTraits);
    setSelectedTraits((prev) => {
      const filtered = prev.filter((key) => availableSet.has(key));
      if (filtered.length === prev.length && filtered.length) {
        return prev;
      }
      if (filtered.length) {
        return filtered;
      }
      const fallback = PTA_CATALOG.filter((item) => availableSet.has(item.key))
        .slice(0, MAX_PTAS)
        .map((item) => item.key);
      if (fallback.length) {
        return fallback;
      }
      const firstAvailable = Array.from(availableSet).slice(0, MAX_PTAS);
      return firstAvailable.length ? firstAvailable : prev;
    });
  }, [availableTraits]);

  const groupedOptions = useMemo<GroupedOption[]>(() => {
    if (!availableTraits.length) return [];
    const availableSet = new Set(availableTraits);
    const used = new Set<string>();
    const groups = new Map<string, Array<{ key: string; label: string }>>();

    PTA_CATALOG.forEach((pta) => {
      if (!availableSet.has(pta.key)) return;
      const arr = groups.get(pta.group) ?? [];
      arr.push({ key: pta.key, label: pta.label });
      groups.set(pta.group, arr);
      used.add(pta.key);
    });

    availableTraits.forEach((key) => {
      if (used.has(key)) return;
      const arr = groups.get("Outros") ?? [];
      arr.push({ key, label: key.toUpperCase() });
      groups.set("Outros", arr);
    });

    return Array.from(groups.entries())
      .map(([group, items]) => ({
        group,
        items: items.sort((a, b) =>
          a.label.localeCompare(b.label, "pt-BR", { sensitivity: "accent" })
        ),
      }))
      .sort((a, b) => {
        const ai = GROUP_ORDER.indexOf(a.group);
        const bi = GROUP_ORDER.indexOf(b.group);
        if (ai === -1 && bi === -1) {
          return a.group.localeCompare(b.group, "pt-BR", { sensitivity: "accent" });
        }
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
  }, [availableTraits]);

  const toggleTrait = useCallback(
    (key: string) => {
      setSelectedTraits((prev) => {
        const active = prev.includes(key);
        if (active) {
          const next = prev.filter((item) => item !== key);
          if (next.length < MAX_PTAS) {
            setLimitWarning(false);
          }
          return next;
        }
        if (prev.length >= MAX_PTAS) {
          setLimitWarning(true);
          return prev;
        }
        setLimitWarning(false);
        return [...prev, key];
      });
    },
    [setLimitWarning]
  );

  const load = useCallback(async () => {
    if (!farmId || selectedTraits.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("ag_quartis_indices_compare", {
      p_farm: farmId,
      p_index_a: indexA,
      p_index_b: indexB,
      p_traits: selectedTraits,
    });
    if (error) {
      console.error("Failed to load quartis indices", error);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(Array.isArray(data) ? (data as Row[]) : []);
    setLoading(false);
  }, [farmId, indexA, indexB, selectedTraits]);

  useEffect(() => {
    load();
  }, [load]);

  const hasCategoryColumn = useMemo(
    () => rows.some((row) => row.category_label),
    [rows]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-56"
            value={indexA}
            onChange={(event) => setIndexA(event.target.value)}
            placeholder="Índice A (ex.: hhp_dollar)"
          />
          <Input
            className="w-56"
            value={indexB}
            onChange={(event) => setIndexB(event.target.value)}
            placeholder="Índice B (ex.: nm_dollar)"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Selecione até {MAX_PTAS} PTAs para comparar os índices.</span>
            <span className="font-medium text-foreground">
              Selecionadas: {selectedTraits.length}/{MAX_PTAS}
            </span>
          </div>
          {groupedOptions.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              Nenhuma PTA disponível.
            </span>
          ) : (
            groupedOptions.map(({ group, items }) => (
              <div key={group} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{group}</h3>
                <div className="flex flex-wrap gap-2">
                  {items.map(({ key, label }) => {
                    const active = selectedTraits.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleTrait(key)}
                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-input bg-background hover:bg-muted"
                        }`}
                        type="button"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          {limitWarning && (
            <p className="text-sm text-rose-600">
              Você pode selecionar no máximo {MAX_PTAS} PTAs.
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Índice</th>
                {hasCategoryColumn && <th className="py-2">Categoria</th>}
                <th className="py-2">Grupo</th>
                <th className="py-2">PTA</th>
                <th className="py-2">Média</th>
                <th className="py-2">N</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.index_label}-${row.group_label}-${row.trait_key}-${row.category_label ?? "none"}-${index}`}
                  className="border-b"
                >
                  <td className="py-2">{row.index_label}</td>
                  {hasCategoryColumn && (
                    <td className="py-2">{row.category_label ?? "-"}</td>
                  )}
                  <td className="py-2">{row.group_label}</td>
                  <td className="py-2">{row.trait_key.toUpperCase()}</td>
                  <td className="py-2">{Math.round(row.mean_value)}</td>
                  <td className="py-2">{row.n}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={hasCategoryColumn ? 6 : 5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {loading ? "Carregando dados..." : "Sem dados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
