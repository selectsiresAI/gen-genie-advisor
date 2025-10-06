"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
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

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#ca8a04",
  "#9333ea",
  "#0f172a",
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
  const { farmId, categoria } = useAGFilters();
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
        groups: Map<
          string,
          {
            label: string;
            count: number | null;
            values: Map<string, number>;
            categories: Map<string, string | null>;
          }
        >;
      }
    >();

    rows.forEach((row) => {
      const indexEntry = indices.get(row.index_label) ?? {
        label: row.index_label,
        groups: new Map(),
      };
      indices.set(row.index_label, indexEntry);

      const groupLabel = GROUP_LABEL_MAP[row.group_label] ?? row.group_label;
      const groupEntry = indexEntry.groups.get(groupLabel) ?? {
        label: groupLabel,
        count: row.n ?? null,
        values: new Map<string, number>(),
        categories: new Map<string, string | null>(),
      };
      groupEntry.count = row.n ?? groupEntry.count ?? null;
      groupEntry.values.set(row.trait_key, row.mean_value);
      groupEntry.categories.set(row.trait_key, row.category_label ?? null);
      indexEntry.groups.set(groupLabel, groupEntry);
    });

    const toRow = (groupEntry?: {
      label: string;
      count: number | null;
      values: Map<string, number>;
    }) => {
      const record: Record<string, number | null> = {};
      traitHeaders.forEach(({ key }) => {
        record[key] = groupEntry?.values.get(key) ?? null;
      });
      return record;
    };

    return Array.from(indices.values()).map((indexEntry) => {
      const top = indexEntry.groups.get("Top 25%");
      const bottom = indexEntry.groups.get("Bottom 25%");

      const tableRows: Array<{
        key: string;
        label: string;
        count: number | null;
        values: Record<string, number | null>;
      }> = [];

      const orderedGroups = Array.from(indexEntry.groups.values()).sort((a, b) => {
        const order: Record<string, number> = {
          "Top 25%": 0,
          "Bottom 25%": 1,
        };
        const ai = order[a.label] ?? 2;
        const bi = order[b.label] ?? 2;
        if (ai !== bi) return ai - bi;
        return a.label.localeCompare(b.label, "pt-BR", { sensitivity: "accent" });
      });

      orderedGroups.forEach((groupEntry) => {
        tableRows.push({
          key: groupEntry.label,
          label: groupEntry.label,
          count: groupEntry.count ?? null,
          values: toRow(groupEntry),
        });
      });

      if (top && bottom) {
        const difference: Record<string, number | null> = {};
        traitHeaders.forEach(({ key }) => {
          const topValue = top.values.get(key);
          const bottomValue = bottom.values.get(key);
          if (topValue === undefined && bottomValue === undefined) {
            difference[key] = null;
            return;
          }
          difference[key] =
            (topValue ?? 0) - (bottomValue ?? 0);
        });

        tableRows.push({
          key: "difference",
          label: "Diferença",
          count:
            top.count !== null && bottom.count !== null
              ? top.count - bottom.count
              : null,
          values: difference,
        });
      }

      const categoryTotals = new Map<string, number>();
      if (top && bottom) {
        traitHeaders.forEach(({ key }) => {
          const category =
            top.categories.get(key) ??
            bottom.categories.get(key) ??
            traitDefinitions.get(key)?.group ??
            "Outros";
          const diff =
            (top.values.get(key) ?? 0) - (bottom.values.get(key) ?? 0);
          categoryTotals.set(
            category,
            (categoryTotals.get(category) ?? 0) + Math.abs(diff)
          );
        });
      }

      const pieData = Array.from(categoryTotals.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        label: indexEntry.label,
        rows: tableRows,
        pieData,
      };
    });
  }, [rows, traitHeaders, traitDefinitions]);

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

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {indexTables.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                {loading ? "Carregando dados..." : "Selecione PTAs e atualize para ver os índices."}
              </div>
            ) : (
              indexTables.map((indexTable, tableIndex) => (
                <div key={indexTable.label} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Índice: {indexTable.label}
                    </h3>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {`Tabela ${tableIndex + 1}`}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-muted/60 text-left">
                        <tr>
                          <th className="px-4 py-2">Grupo</th>
                          <th className="px-4 py-2">N</th>
                          {traitHeaders.map(({ key, label }) => (
                            <th key={key} className="px-4 py-2 text-right">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {indexTable.rows.map((row) => (
                          <tr key={row.key} className="border-t">
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
                                <td key={key} className={`px-4 py-2 text-right ${highlight}`}>
                                  {formatMean(value)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {indexTable.pieData.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border p-4">
                        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Composição por categoria
                        </h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={indexTable.pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={4}
                              >
                                {indexTable.pieData.map((entry, pieIndex) => (
                                  <Cell
                                    key={entry.name}
                                    fill={PIE_COLORS[pieIndex % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Legend
                                formatter={(value: string) => (
                                  <span className="text-xs text-muted-foreground">{value}</span>
                                )}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Escolha de índices
              </h3>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium text-foreground">Tabela 1</td>
                    <td className="py-2 text-right text-muted-foreground">{indexALabel}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-foreground">Tabela 2</td>
                    <td className="py-2 text-right text-muted-foreground">{indexBLabel}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                População
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">{categoriaLabel}</p>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                PTAs selecionadas
              </h3>
              {traitHeaders.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhuma PTA selecionada.
                </p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {traitHeaders.map(({ key, label, group }) => (
                    <li key={key} className="flex items-center justify-between">
                      <span>{label}</span>
                      <span className="text-xs uppercase tracking-wide">{group}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
