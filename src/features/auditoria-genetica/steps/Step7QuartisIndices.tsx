"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const GROUP_LABEL_MAP: Record<string, string> = {
  Top25: "Top 25%",
  Top_25: "Top 25%",
  top25: "Top 25%",
  Top: "Top 25%",
  "Top 25%": "Top 25%",
  Bottom25: "Bottom 25%",
  Bottom_25: "Bottom 25%",
  bottom25: "Bottom 25%",
  Bottom: "Bottom 25%",
  "Bottom 25%": "Bottom 25%",
};

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
  const { farmId, categoria } = useAGFilters();
  const indexOptions = useMemo(
    () =>
      PTA_CATALOG.filter((item) => item.group === "Índices").map((item) => ({
        key: item.key,
        label: item.label,
      })),
    []
  );
  const [indexA, setIndexA] = useState(
    () => indexOptions[0]?.key ?? "hhp_dollar"
  );
  const [indexB, setIndexB] = useState(
    () => indexOptions[1]?.key ?? "nm_dollar"
  );
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

    const validIndexA =
      indexOptions.find((option) => option.key === indexA && availableSet.has(option.key))?.key ??
      indexOptions.find((option) => availableSet.has(option.key))?.key ??
      indexA;
    const validIndexB =
      indexOptions.find((option) => option.key === indexB && availableSet.has(option.key))?.key ??
      indexOptions.find(
        (option) => option.key !== validIndexA && availableSet.has(option.key)
      )?.key ??
      indexB;

    if (validIndexA !== indexA) {
      setIndexA(validIndexA);
    }
    if (validIndexB !== indexB) {
      setIndexB(validIndexB);
    }
  }, [availableTraits, indexA, indexB, indexOptions]);

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

  const traitDefinitions = useMemo(() => {
    const availableSet = new Set(availableTraits);
    const map = new Map<
      string,
      { label: string; group: string; preferOrder?: number | undefined }
    >();
    PTA_CATALOG.forEach((item) => {
      if (!availableSet.has(item.key)) return;
      map.set(item.key, {
        label: item.label,
        group: item.group,
        preferOrder: item.preferOrder,
      });
    });
    availableTraits.forEach((key) => {
      if (map.has(key)) return;
      map.set(key, { label: key.toUpperCase(), group: "Outros" });
    });
    return map;
  }, [availableTraits]);

  const traitHeaders = useMemo(() => {
    return [...selectedTraits].map((key) => {
      const def = traitDefinitions.get(key);
      return {
        key,
        label: def?.label ?? key.toUpperCase(),
        group: def?.group ?? "Outros",
      };
    });
  }, [selectedTraits, traitDefinitions]);

  const indexTables = useMemo(() => {
    if (!rows.length) return [];

    const indices = new Map<
      string,
      {
        label: string;
        order: number;
        groups: Map<
          string,
          {
            label: string;
            count: number | null;
            values: Map<string, number>;
          }
        >;
      }
    >();

    rows.forEach((row) => {
      if (!indices.has(row.index_label)) {
        indices.set(row.index_label, {
          label: row.index_label,
          order: indices.size,
          groups: new Map(),
        });
      }
      const indexEntry = indices.get(row.index_label)!;

      const groupLabel = GROUP_LABEL_MAP[row.group_label] ?? row.group_label;
      const groupEntry = indexEntry.groups.get(groupLabel) ?? {
        label: groupLabel,
        count: row.n ?? null,
        values: new Map<string, number>(),
      };

      groupEntry.count = row.n ?? groupEntry.count ?? null;
      groupEntry.values.set(row.trait_key, row.mean_value);
      indexEntry.groups.set(groupLabel, groupEntry);
    });

    return Array.from(indices.values())
      .sort((a, b) => a.order - b.order)
      .map((indexEntry) => {
        const top = indexEntry.groups.get("Top 25%");
        const bottom = indexEntry.groups.get("Bottom 25%");

        const rowsForTable: Array<{
          key: string;
          label: string;
          count: number | null;
          values: Record<string, number | null>;
        }> = [];

        const fillRow = (entry?: {
          label: string;
          count: number | null;
          values: Map<string, number>;
        }) => {
          const record: Record<string, number | null> = {};
          traitHeaders.forEach(({ key: traitKey }) => {
            record[traitKey] = entry?.values.get(traitKey) ?? null;
          });
          return record;
        };

        const orderedGroups = Array.from(indexEntry.groups.values()).sort((a, b) => {
          const orderMap: Record<string, number> = {
            "Top 25%": 0,
            "Bottom 25%": 1,
          };
          const ai = orderMap[a.label] ?? 2;
          const bi = orderMap[b.label] ?? 2;
          if (ai !== bi) return ai - bi;
          return a.label.localeCompare(b.label, "pt-BR", { sensitivity: "accent" });
        });

        orderedGroups.forEach((group) => {
          rowsForTable.push({
            key: group.label,
            label: group.label,
            count: group.count ?? null,
            values: fillRow(group),
          });
        });

        if (top && bottom) {
          const diff: Record<string, number | null> = {};
          traitHeaders.forEach(({ key: traitKey }) => {
            const topValue = top.values.get(traitKey);
            const bottomValue = bottom.values.get(traitKey);
            if (topValue === undefined && bottomValue === undefined) {
              diff[traitKey] = null;
              return;
            }
            diff[traitKey] = (topValue ?? 0) - (bottomValue ?? 0);
          });

          rowsForTable.push({
            key: "difference",
            label: "Diferença",
            count:
              top.count !== null && bottom.count !== null
                ? top.count - bottom.count
                : null,
            values: diff,
          });
        }

        return {
          label: indexEntry.label,
          rows: rowsForTable,
        };
      });
  }, [rows, traitHeaders]);

  const categoriaLabel = useMemo(() => {
    switch (categoria) {
      case "bezerra":
        return "Bezerra";
      case "novilha":
        return "Novilhas";
      case "primipara":
        return "Primíparas";
      case "secundipara":
        return "Secundíparas";
      case "multipara":
        return "Multíparas";
      default:
        return "Todas as fêmeas";
    }
  }, [categoria]);

  const formatMean = useCallback((value: number | null) => {
    if (value === null || Number.isNaN(value)) return "-";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: Math.abs(value) < 1 ? 2 : 1,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const formatCount = useCallback((value: number | null) => {
    if (value === null || Number.isNaN(value)) return "-";
    return new Intl.NumberFormat("pt-BR").format(Math.round(value));
  }, []);

  const indexALabel = useMemo(() => {
    return (
      PTA_CATALOG.find((item) => item.key === indexA)?.label ??
      indexA.toUpperCase()
    );
  }, [indexA]);

  const indexBLabel = useMemo(() => {
    return (
      PTA_CATALOG.find((item) => item.key === indexB)?.label ??
      indexB.toUpperCase()
    );
  }, [indexB]);

  const groupedSelectedTraits = useMemo(() => {
    const groups = new Map<string, Array<{ key: string; label: string }>>();
    traitHeaders.forEach(({ key, label, group }) => {
      const arr = groups.get(group) ?? [];
      arr.push({ key, label });
      groups.set(group, arr);
    });
    return Array.from(groups.entries()).map(([group, items]) => ({
      group,
      items,
    }));
  }, [traitHeaders]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 lg:space-y-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Índice A
                  </span>
                  <Select
                    value={indexA}
                    onValueChange={(value) => {
                      setIndexA(value);
                      if (value === indexB) {
                        const alternative = indexOptions.find(
                          (option) => option.key !== value
                        );
                        if (alternative) {
                          setIndexB(alternative.key);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o índice A" />
                    </SelectTrigger>
                    <SelectContent>
                      {indexOptions.map(({ key, label }) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Índice B
                  </span>
                  <Select
                    value={indexB}
                    onValueChange={(value) => {
                      setIndexB(value);
                      if (value === indexA) {
                        const alternative = indexOptions.find(
                          (option) => option.key !== value
                        );
                        if (alternative) {
                          setIndexA(alternative.key);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o índice B" />
                    </SelectTrigger>
                    <SelectContent>
                      {indexOptions.map(({ key, label }) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  População analisada: <strong>{categoriaLabel}</strong>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={load}
                  disabled={loading}
                  className="ml-auto"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>

              {indexTables.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {loading
                    ? "Carregando dados..."
                    : "Selecione PTAs e atualize para ver os índices."}
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {indexTables.map((table, tableIndex) => (
                    <div
                      key={`${table.label}-${tableIndex}`}
                      className="space-y-4 rounded-xl border bg-background p-4 shadow-sm"
                    >
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {table.label}
                        </h3>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          Comparação Top 25% vs Bottom 25%
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-sm">
                          <thead className="bg-muted/60">
                            <tr className="text-left">
                              <th className="px-4 py-2">Grupo</th>
                              <th className="px-4 py-2 text-right">N</th>
                              {traitHeaders.map(({ key, label }) => (
                                <th key={key} className="px-4 py-2 text-right">
                                  {label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row) => (
                              <tr
                                key={row.key}
                                className={`border-t ${
                                  row.key === "difference"
                                    ? "bg-amber-50/60 dark:bg-amber-950/30"
                                    : ""
                                }`}
                              >
                                <td className="px-4 py-2 font-medium text-foreground">
                                  {row.label}
                                </td>
                                <td
                                  className={`px-4 py-2 text-right ${
                                    row.key === "difference" &&
                                    row.count !== null &&
                                    row.count !== 0
                                      ? row.count > 0
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                      : ""
                                  }`}
                                >
                                  {formatCount(row.count)}
                                </td>
                                {traitHeaders.map(({ key }) => {
                                  const value = row.values[key] ?? null;
                                  const highlight =
                                    row.key === "difference" && value !== null
                                      ? value > 0
                                        ? "text-emerald-600 font-semibold"
                                        : value < 0
                                        ? "text-rose-600 font-semibold"
                                        : "font-semibold"
                                      : "";
                                  return (
                                    <td
                                      key={key}
                                      className={`px-4 py-2 text-right ${highlight}`}
                                    >
                                      {formatMean(value)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                        Índice selecionado: {tableIndex === 0 ? indexALabel : indexBLabel}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-6 rounded-xl border bg-muted/20 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  PTAs comparadas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escolha até {MAX_PTAS} PTAs para compor a análise entre os índices.
                </p>
                <p className="text-xs font-medium text-foreground">
                  Selecionadas: {selectedTraits.length}/{MAX_PTAS}
                </p>
              </div>

              {groupedOptions.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Nenhuma PTA disponível.
                </span>
              ) : (
                <div className="space-y-4">
                  {groupedOptions.map(({ group, items }) => (
                    <div key={group} className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {items.map(({ key, label }) => {
                          const active = selectedTraits.includes(key);
                          return (
                            <button
                              key={key}
                              onClick={() => toggleTrait(key)}
                              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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
                  ))}
                </div>
              )}
              {limitWarning && (
                <p className="text-xs font-medium text-rose-600">
                  Você pode selecionar no máximo {MAX_PTAS} PTAs.
                </p>
              )}

              <div className="rounded-lg border bg-background p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Selecionadas por categoria
                </h4>
                {groupedSelectedTraits.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Nenhuma PTA selecionada.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {groupedSelectedTraits.map(({ group, items }) => (
                      <div key={group} className="space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {group}
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {items.map(({ key, label }) => (
                            <li key={key}>{label}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
