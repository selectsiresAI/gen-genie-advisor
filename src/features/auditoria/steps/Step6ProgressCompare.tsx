"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAGFilters } from "../store";

const PTA_LABELS: Record<string, string> = {
  hhp_dollar: "HHP$",
  nm_dollar: "NM$",
  tpi: "TPI",
  ptam: "PTAM",
  ptaf: "PTAF",
  ptap: "PTAP",
  fi: "FI",
  ccr: "CCR",
  hcr: "HCR",
  pl: "PL",
  liv: "LIV",
  scs: "SCS",
  ptat: "PTAT",
  udc: "UDC",
  mast: "MAST",
  cfp: "CFP",
};

const PTA_KEYS = Object.keys(PTA_LABELS);

const DEFAULT_TABLE_TRAITS = ["hhp_dollar", "ptam", "cfp", "fi", "pl", "scs", "mast"];
const DEFAULT_CHART_TRAITS = [
  "hhp_dollar",
  "ptam",
  "ptaf",
  "ptap",
  "fi",
  "ccr",
  "hcr",
  "pl",
  "liv",
  "scs",
  "ptat",
  "udc",
];

const KNOWN_CATEGORY_ORDER = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"];
const FARM_COLUMNS = ["farm_id", "id_fazenda"];

const toNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

type MeansByCategory = Record<string, Record<string, number | null>>;

type FetchResult = {
  table: string;
  categoryColumn: string;
  rows: Record<string, unknown>[];
};

const filterRowsWithCategory = (rows: Record<string, unknown>[], categoryColumn: string) =>
  rows.filter((row) => {
    const value = row?.[categoryColumn];
    return typeof value === "string" && value.trim().length > 0;
  });

const uniqueCategories = (rows: Record<string, unknown>[], categoryColumn: string) => {
  const set = new Set<string>();
  rows.forEach((row) => {
    const value = row?.[categoryColumn];
    if (typeof value === "string" && value.trim()) {
      set.add(value.trim());
    }
  });

  const values = Array.from(set);
  const orderedKnown = KNOWN_CATEGORY_ORDER.filter((item) => values.includes(item));
  const rest = values.filter((item) => !KNOWN_CATEGORY_ORDER.includes(item));
  return [...orderedKnown, ...rest];
};

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [sourceTable, setSourceTable] = useState("");
  const [categoryColumn, setCategoryColumn] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [groupA, setGroupA] = useState("Novilha");
  const [groupB, setGroupB] = useState("Primípara");
  const [tableTraits, setTableTraits] = useState(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState(DEFAULT_CHART_TRAITS);

  const fetchTable = useCallback(
    async (table: string, categoryCol: string): Promise<FetchResult | null> => {
      if (!farmId) return null;

      for (const farmColumn of FARM_COLUMNS) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq(farmColumn as any, farmId)
          .limit(100000);

        if (error) {
          if (error.message?.toLowerCase().includes("column") && error.message.includes(farmColumn)) {
            continue;
          }
          return null;
        }

        if (Array.isArray(data) && data.length > 0) {
          const validRows = filterRowsWithCategory(data, categoryCol);
          if (validRows.length > 0) {
            return { table, categoryColumn: categoryCol, rows: validRows };
          }
        }
      }

      const { data, error } = await supabase.from(table).select("*").limit(100000);
      if (error) return null;
      if (!Array.isArray(data) || data.length === 0) return null;

      const validRows = filterRowsWithCategory(data, categoryCol);
      if (validRows.length === 0) return null;

      return { table, categoryColumn: categoryCol, rows: validRows };
    },
    [farmId]
  );

  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      setCategories([]);
      setSourceTable("");
      setCategoryColumn("");
      return;
    }

    setLoading(true);

    const primary = await fetchTable("rebanho", "Categoria");
    const fallback = primary ?? (await fetchTable("females_denorm", "age_group"));

    if (fallback) {
      setRows(fallback.rows);
      setSourceTable(fallback.table);
      setCategoryColumn(fallback.categoryColumn);
      const cats = uniqueCategories(fallback.rows, fallback.categoryColumn);
      setCategories(cats);
      if (!cats.includes(groupA)) {
        setGroupA(cats[0] ?? "Grupo A");
      }
      if (!cats.includes(groupB)) {
        setGroupB(cats[1] ?? cats[0] ?? "Grupo B");
      }
    } else {
      setRows([]);
      setSourceTable("");
      setCategoryColumn("");
      setCategories([]);
    }

    setLoading(false);
  }, [farmId, fetchTable, groupA, groupB]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const meansByCategory: MeansByCategory = useMemo(() => {
    if (!categoryColumn) return {};
    const accumulator: Record<string, Record<string, { sum: number; count: number }>> = {};

    rows.forEach((row) => {
      const category = String(row[categoryColumn]);
      if (!accumulator[category]) accumulator[category] = {};

      PTA_KEYS.forEach((key) => {
        const rawValue = row[key];
        const numericValue = toNumber(rawValue);
        if (numericValue != null) {
          if (!accumulator[category][key]) {
            accumulator[category][key] = { sum: 0, count: 0 };
          }
          accumulator[category][key].sum += numericValue;
          accumulator[category][key].count += 1;
        }
      });
    });

    const result: MeansByCategory = {};
    Object.entries(accumulator).forEach(([category, traits]) => {
      result[category] = {};
      PTA_KEYS.forEach((key) => {
        const entry = traits[key];
        result[category][key] = entry && entry.count > 0 ? entry.sum / entry.count : null;
      });
    });

    return result;
  }, [rows, categoryColumn]);

  const view = useMemo(() => {
    const groupAData = meansByCategory[groupA] ?? {};
    const groupBData = meansByCategory[groupB] ?? {};

    const presentPTAs = PTA_KEYS.filter((key) =>
      Object.values(meansByCategory).some((traitMap) => traitMap?.[key] != null)
    );

    const filteredTableTraits = tableTraits.filter((key) => presentPTAs.includes(key));
    const filteredChartTraits = chartTraits.filter((key) => presentPTAs.includes(key));

    const tableRows = [groupA, groupB, "Change"].map((label, index) => {
      const values: Record<string, number | null> = {};
      filteredTableTraits.forEach((key) => {
        const aValue = groupAData[key] ?? null;
        const bValue = groupBData[key] ?? null;
        if (index === 0) values[key] = aValue;
        if (index === 1) values[key] = bValue;
        if (index === 2) values[key] = aValue != null && bValue != null ? aValue - bValue : null;
      });
      return { label, values };
    });

    const radarData = filteredChartTraits.map((key) => ({
      trait: (PTA_LABELS[key] ?? key).toUpperCase(),
      "Group A": groupAData[key] ?? 0,
      "Group B": groupBData[key] ?? 0,
    }));

    return { presentPTAs, tableRows, filteredTableTraits, radarData, filteredChartTraits };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits]);

  const renderTraitBadges = (
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <div className="flex flex-wrap gap-2">
      {PTA_KEYS.sort((a, b) => (PTA_LABELS[a] ?? a).localeCompare(PTA_LABELS[b] ?? b)).map((key) => {
        const label = PTA_LABELS[key] ?? key.toUpperCase();
        const active = selected.includes(key);
        const enabled = view.presentPTAs.includes(key);
        return (
          <Badge
            key={key}
            variant={active ? "default" : "outline"}
            className={`cursor-pointer ${enabled ? "" : "opacity-40 pointer-events-none"}`}
            onClick={() =>
              enabled &&
              setSelected((prev) =>
                prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
              )
            }
          >
            {label}
          </Badge>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação por Categoria (Step 6)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Fonte: <b>{sourceTable || "—"}</b>
          </span>
          <span>
            Categoria: <b>{categoryColumn || "—"}</b>
          </span>
          <span>
            Registros: <b>{rows.length}</b>
          </span>
          <span>
            PTAs com dados: <b>{view.presentPTAs.length ? view.presentPTAs.map((key) => PTA_LABELS[key] ?? key).join(", ") : "—"}</b>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Atalhos:</span>
          {categories.map((category) => (
            <Badge
              key={`a-${category}`}
              variant={groupA === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroupA(category)}
            >
              {category}
            </Badge>
          ))}
          <span className="mx-2 uppercase tracking-wide text-xs text-muted-foreground">VS</span>
          {categories.map((category) => (
            <Badge
              key={`b-${category}`}
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
          {renderTraitBadges(tableTraits, setTableTraits)}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Gráfico:</div>
          {renderTraitBadges(chartTraits, setChartTraits)}
        </div>

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados…</div>
        )}

        {!loading && (!categoryColumn || rows.length === 0) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados com categoria disponíveis em rebanho ou females_denorm para esta fazenda.
          </div>
        )}

        {!loading && categoryColumn && rows.length > 0 && (
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-semibold">Group</th>
                    {view.filteredTableTraits.map((key) => (
                      <th key={`th-${key}`} className="px-2 py-2 text-left font-semibold">
                        {(PTA_LABELS[key] ?? key).toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.tableRows.map((row, index) => (
                    <tr key={`row-${row.label}`} className={`border-b ${index === 2 ? "bg-muted/30" : ""}`}>
                      <td className="px-2 py-2 font-medium">{row.label}</td>
                      {view.filteredTableTraits.map((key) => {
                        const value = row.values[key];
                        const isChangeRow = index === 2;
                        const positive = (value ?? 0) > 0;
                        return (
                          <td
                            key={`td-${row.label}-${key}`}
                            className={`px-2 py-2 ${
                              isChangeRow ? (positive ? "text-green-600" : "text-red-600") : ""
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

            {view.radarData.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Radar de PTAs</h4>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={view.radarData}>
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
