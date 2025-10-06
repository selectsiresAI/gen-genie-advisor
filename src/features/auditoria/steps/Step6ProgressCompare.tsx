"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAGFilters } from "../store";

type TraitConfig = {
  key: string;
  label: string;
  variants: string[];
};

type CatMeans = Record<string, Record<string, number | null>>;

type DerivedData = {
  categories: string[];
  meansByCategory: CatMeans;
  availableTraits: string[];
  traitLabels: Record<string, string>;
};

const TRAIT_CONFIGS: TraitConfig[] = [
  { key: "HHP$®", label: "HHP$®", variants: ["HHP$®", "HHP$", "hhp_dollar", "HHP_DOLLAR", "hhp"] },
  { key: "TPI", label: "TPI", variants: ["TPI", "tpi"] },
  { key: "NM$", label: "NM$", variants: ["NM$", "nm_dollar", "NM_DOLLAR", "nm"] },
  { key: "PTAM", label: "PTAM", variants: ["PTAM", "ptam"] },
  { key: "PTAF", label: "PTAF", variants: ["PTAF", "ptaf"] },
  { key: "PTAP", label: "PTAP", variants: ["PTAP", "ptap"] },
  { key: "FI", label: "FI", variants: ["FI", "fi"] },
  { key: "CCR", label: "CCR", variants: ["CCR", "ccr"] },
  { key: "HCR", label: "HCR", variants: ["HCR", "hcr"] },
  { key: "PL", label: "PL", variants: ["PL", "pl"] },
  { key: "LIV", label: "LIV", variants: ["LIV", "liv"] },
  { key: "SCS", label: "SCS", variants: ["SCS", "scs"] },
  { key: "PTAT", label: "PTAT", variants: ["PTAT", "ptat"] },
  { key: "UDC", label: "UDC", variants: ["UDC", "udc"] },
  { key: "MAST", label: "MAST", variants: ["MAST", "mast"] },
  { key: "CFP", label: "CFP", variants: ["CFP", "cfp"] },
];

const PTA_LABELS: Record<string, string> = Object.fromEntries(
  TRAIT_CONFIGS.map(({ key, label }) => [key, label])
);

const TRAIT_ORDER = TRAIT_CONFIGS.map(({ key }) => key);

const DEFAULT_TABLE_TRAITS = ["HHP$®", "PTAM", "CFP", "FI", "PL", "SCS", "MAST"];
const DEFAULT_CHART_TRAITS = [
  "HHP$®",
  "PTAM",
  "PTAF",
  "PTAP",
  "FI",
  "CCR",
  "HCR",
  "PL",
  "LIV",
  "SCS",
  "PTAT",
  "UDC",
];

const AGE_SHORTCUTS = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"];

const NORMALIZED_TO_TRAIT = (() => {
  const map = new Map<string, string>();
  for (const trait of TRAIT_CONFIGS) {
    map.set(normalizeKey(trait.key), trait.key);
    for (const variant of trait.variants) {
      map.set(normalizeKey(variant), trait.key);
    }
  }
  return map;
})();

function normalizeKey(value: string): string {
  return value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function humanizeTraitLabel(key: string): string {
  if (!key) return "";

  const trimmed = key.trim();
  if (!trimmed) return "";

  const withoutUnderscore = trimmed.replace(/[_\s]+/g, " ");
  return withoutUnderscore
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toUpperCase()
    .trim();
}

function normalizeCategoryValue(value: string): string {
  return value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveCategory(row: any): string | null {
  if (!row || typeof row !== "object") return null;

  const primaryKeys = [
    "Categoria",
    "categoria",
    "categoria_label",
    "categoria_nome",
    "category",
    "category_label",
    "categoria_texto",
  ];

  for (const key of primaryKeys) {
    const value = row?.[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  const fallbackKey = Object.keys(row).find((key) => {
    const normalized = normalizeKey(key);
    return normalized.startsWith("categoria") || normalized.startsWith("category");
  });

  const fallbackValue = fallbackKey ? row[fallbackKey] : null;
  return typeof fallbackValue === "string" && fallbackValue.trim().length > 0
    ? fallbackValue.trim()
    : null;
}

function orderCategories(list: string[]): string[] {
  if (!list.length) return [];

  const seen = new Set<string>();
  const normalizedPairs = list
    .map((item) => ({
      raw: item,
      normalized: normalizeCategoryValue(item),
    }))
    .filter((pair) => pair.raw.length > 0);

  const result: string[] = [];

  for (const shortcut of AGE_SHORTCUTS) {
    const normalizedShortcut = normalizeCategoryValue(shortcut);
    const match = normalizedPairs.find(
      (pair) => pair.normalized === normalizedShortcut && !seen.has(pair.raw)
    );
    if (match) {
      seen.add(match.raw);
      result.push(match.raw);
    }
  }

  normalizedPairs
    .filter((pair) => !seen.has(pair.raw))
    .sort((a, b) => a.raw.localeCompare(b.raw, "pt-BR", { sensitivity: "base" }))
    .forEach((pair) => {
      if (!seen.has(pair.raw)) {
        seen.add(pair.raw);
        result.push(pair.raw);
      }
    });

  return result;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function adjustSelection(
  current: string[],
  defaults: string[],
  available: string[],
  limit?: number
): string[] {
  if (!available.length) return [];
  const filtered = current.filter((trait) => available.includes(trait));
  if (filtered.length) return filtered;

  const fallback = defaults.filter((trait) => available.includes(trait));
  if (fallback.length) {
    return typeof limit === "number" ? fallback.slice(0, limit) : fallback;
  }

  const sliced = typeof limit === "number" ? available.slice(0, limit) : available;
  return sliced;
}

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  const fetchRebanho = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      return;
    }

    setLoading(true);

    let { data, error } = await supabase
      .from("rebanho")
      .select("*")
      .eq("farm_id", farmId)
      .limit(100000);

    if (!error && Array.isArray(data) && data.length === 0) {
      const fallback = await supabase
        .from("rebanho")
        .select("*")
        .eq("id_fazenda", farmId)
        .limit(100000);
      data = fallback.data as any[];
      error = fallback.error as any;
    }

    if (error) {
      console.error("Erro ao buscar rebanho:", error);
      setRows([]);
      setLoading(false);
      return;
    }

    const sane = (data || []).filter((row: any) => row && typeof row === "object");
    setRows(sane);
    setLoading(false);
  }, [farmId]);

  useEffect(() => {
    fetchRebanho();
  }, [fetchRebanho]);

  const derived: DerivedData = useMemo(() => {
    if (!rows.length) {
      return { categories: [], meansByCategory: {}, availableTraits: [], traitLabels: {} };
    }

    const categorySet: string[] = [];
    const categorySeen = new Set<string>();
    const traitAccumulator: Record<string, Record<string, { sum: number; count: number }>> = {};
    const availableSet = new Set<string>();
    const labelMap: Record<string, string> = {};

    for (const row of rows) {
      const category = resolveCategory(row);
      if (category && !categorySeen.has(category)) {
        categorySeen.add(category);
        categorySet.push(category);
      }

      if (!category) continue;

      const entries = Object.entries(row);
      for (const [rawKey, rawValue] of entries) {
        const normalizedKey = normalizeKey(rawKey);
        const traitKey =
          NORMALIZED_TO_TRAIT.get(normalizedKey) ?? rawKey?.toString()?.trim();

        if (!traitKey) continue;

        if (rawValue === null || rawValue === undefined || rawValue === "") {
          continue;
        }

        let value = Number(rawValue);
        if (!Number.isFinite(value)) {
          if (typeof rawValue === "string") {
            const sanitized = rawValue
              .replace(/\s+/g, "")
              .replace(/\.(?=\d{3}(\D|$))/g, "")
              .replace(/,/g, ".");
            value = Number(sanitized);
          }
        }

        if (!Number.isFinite(value)) continue;

        if (!traitAccumulator[category]) {
          traitAccumulator[category] = {};
        }
        if (!traitAccumulator[category][traitKey]) {
          traitAccumulator[category][traitKey] = { sum: 0, count: 0 };
        }

        traitAccumulator[category][traitKey].sum += value;
        traitAccumulator[category][traitKey].count += 1;
        availableSet.add(traitKey);

        if (!labelMap[traitKey]) {
          const baseLabel = PTA_LABELS[traitKey] ?? PTA_LABELS[rawKey as string];
          labelMap[traitKey] = baseLabel ?? humanizeTraitLabel(traitKey);
        }
      }
    }

    const orderedCategories = orderCategories(categorySet);

    const orderedAvailableTraits = Array.from(availableSet).sort((a, b) => {
      const indexA = TRAIT_ORDER.indexOf(a);
      const indexB = TRAIT_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) {
        const labelA = labelMap[a] ?? humanizeTraitLabel(a);
        const labelB = labelMap[b] ?? humanizeTraitLabel(b);
        return labelA.localeCompare(labelB, "pt-BR", { sensitivity: "base" });
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const means: CatMeans = {};
    for (const category of orderedCategories) {
      const traitMap = traitAccumulator[category] || {};
      means[category] = {};
      for (const trait of orderedAvailableTraits) {
        const stats = traitMap[trait];
        if (stats && stats.count > 0) {
          means[category][trait] = stats.sum / stats.count;
        } else {
          means[category][trait] = null;
        }
      }
    }

    return {
      categories: orderedCategories,
      meansByCategory: means,
      availableTraits: orderedAvailableTraits,
      traitLabels: labelMap,
    };
  }, [rows]);

  const categories = derived.categories;
  const meansByCategory = derived.meansByCategory;
  const availableTraits = derived.availableTraits;
  const traitLabels = derived.traitLabels;

  useEffect(() => {
    if (!categories.length) {
      return;
    }

    setGroupA((prev) => {
      if (prev && categories.includes(prev)) return prev;
      return categories[0] ?? prev;
    });

    setGroupB((prev) => {
      if (prev && categories.includes(prev)) return prev;
      if (categories.length > 1) return categories[1];
      return categories[0] ?? prev;
    });
  }, [categories]);

  useEffect(() => {
    if (!availableTraits.length) {
      setTableTraits((prev) => (prev.length ? [] : prev));
      setChartTraits((prev) => (prev.length ? [] : prev));
      return;
    }

    setTableTraits((prev) => {
      const next = adjustSelection(prev, DEFAULT_TABLE_TRAITS, availableTraits, 7);
      return arraysEqual(prev, next) ? prev : next;
    });

    setChartTraits((prev) => {
      const next = adjustSelection(prev, DEFAULT_CHART_TRAITS, availableTraits, 12);
      return arraysEqual(prev, next) ? prev : next;
    });
  }, [availableTraits]);

  const availableTraitOptions = useMemo(() => {
    return availableTraits.slice().map((trait) => ({
      key: trait,
      label: traitLabels[trait] ?? PTA_LABELS[trait] ?? humanizeTraitLabel(trait),
    }));
  }, [availableTraits, traitLabels]);

  const availableTraitSet = useMemo(() => new Set(availableTraits), [availableTraits]);

  const pair = useMemo(() => {
    const groupAData = meansByCategory[groupA] || {};
    const groupBData = meansByCategory[groupB] || {};

    const tableTraitsFiltered = tableTraits.filter((trait) => availableTraitSet.has(trait));
    const chartTraitsFiltered = chartTraits.filter((trait) => availableTraitSet.has(trait));

    const tableRows = tableTraitsFiltered.length
      ? [
          {
            label: groupA,
            ...Object.fromEntries(
              tableTraitsFiltered.map((trait) => [trait, groupAData[trait] ?? null])
            ),
          },
          {
            label: groupB,
            ...Object.fromEntries(
              tableTraitsFiltered.map((trait) => [trait, groupBData[trait] ?? null])
            ),
          },
          {
            label: "Change",
            ...Object.fromEntries(
              tableTraitsFiltered.map((trait) => {
                const a = groupAData[trait];
                const b = groupBData[trait];
                if (a != null && b != null) {
                  return [trait, a - b];
                }
                return [trait, null];
              })
            ),
          },
        ]
      : [];

    const radarData = chartTraitsFiltered.map((trait) => ({
      trait: traitLabels[trait] ?? PTA_LABELS[trait] ?? humanizeTraitLabel(trait),
      "Group A": (groupAData[trait] ?? 0) as number,
      "Group B": (groupBData[trait] ?? 0) as number,
    }));

    return { tableRows, radarData };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits, availableTraitSet, traitLabels]);

  const traitBadges = (
    source: string[],
    setSource: (updater: (prev: string[]) => string[]) => void
  ) => {
    if (!availableTraitOptions.length) {
      return (
        <div className="text-sm text-muted-foreground">
          Nenhuma PTA disponível para esta fazenda.
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {availableTraitOptions
          .slice()
          .sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }))
          .map(({ key, label }) => {
            const active = source.includes(key);
          return (
            <Badge
              key={key}
              variant={active ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSource((prev) => {
                  if (prev.includes(key)) {
                    return prev.filter((item) => item !== key);
                  }
                  return [...prev, key];
                })
              }
            >
              {label}
            </Badge>
          );
        })}
      </div>
    );
  };

  const hasData = rows.length > 0 && categories.length > 0 && availableTraits.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação por Categoria (Step 6)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Atalhos:</span>
          {categories.map((category) => (
            <Badge
              key={`ga-${category}`}
              variant={groupA === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroupA(category)}
            >
              {category}
            </Badge>
          ))}
          <span className="mx-2 uppercase tracking-wide text-xs text-muted-foreground">vs</span>
          {categories.map((category) => (
            <Badge
              key={`gb-${category}`}
              variant={groupB === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroupB(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Tabela:</div>
          {traitBadges(tableTraits, (updater) => setTableTraits(updater))}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Gráfico:</div>
          {traitBadges(chartTraits, (updater) => setChartTraits(updater))}
        </div>

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>
        )}

        {!loading && !hasData && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados de categoria ou PTAs disponíveis para esta fazenda.
          </div>
        )}

        {!loading && hasData && (
          <div className="space-y-8">
            {pair.tableRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-2 text-left font-semibold">Group</th>
                      {tableTraits
                        .filter((trait) => availableTraitSet.has(trait))
                        .map((trait) => (
                          <th key={`th-${trait}`} className="py-2 px-2 text-left font-semibold">
                            {(traitLabels[trait] ?? PTA_LABELS[trait] ?? humanizeTraitLabel(trait)).toUpperCase()}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pair.tableRows.map((row, index) => (
                      <tr
                        key={`row-${index}-${row.label}`}
                        className={`border-b ${index === 2 ? "bg-muted/30" : ""}`}
                      >
                        <td className="py-2 px-2 font-medium">{row.label}</td>
                        {tableTraits
                          .filter((trait) => availableTraitSet.has(trait))
                          .map((trait) => {
                            const value = row[trait] as number | null | undefined;
                            const isChangeRow = index === 2;
                            const isPositive = (value ?? 0) > 0;
                            return (
                              <td
                                key={`td-${index}-${trait}`}
                                className={`py-2 px-2 ${
                                  isChangeRow
                                    ? isPositive
                                      ? "text-green-600"
                                      : "text-red-600"
                                    : ""
                                }`}
                              >
                                {value == null ? "-" : value.toFixed(2)}
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pair.radarData.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Rate of Change</h4>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={pair.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" />
                    <PolarRadiusAxis />
                    <Radar
                      name={groupA}
                      dataKey="Group A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.28}
                    />
                    <Radar
                      name={groupB}
                      dataKey="Group B"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.22}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
