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

/* =========================================================
   PTAs suportadas (adicione aqui se quiser mais colunas)
   ========================================================= */
const PTA_LABELS: Record<string, string> = {
  hhp_dollar: "HHP$",
  tpi: "TPI",
  nm_dollar: "NM$",
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
const ALL_PTA_KEYS = Object.keys(PTA_LABELS);

/* =========================================================
   Mapeamento de sinônimos (rebanho vs females_denorm)
   - Comparação é feita em formato "normalizado"
   - Pode adicionar nomes conforme seu schema
   ========================================================= */
const PTA_SYNONYMS: Record<string, string[]> = {
  hhp_dollar: ["hhp_dollar", "hhp$", "hhp"],
  nm_dollar: ["nm_dollar", "nm$", "nm", "netmerit", "meritoliquido"],
  tpi: ["tpi"],
  ptam: ["ptam", "pta_milk", "milk"],
  ptaf: ["ptaf", "pta_fat", "fat"],
  ptap: ["ptap", "pta_protein", "protein"],
  fi: ["fi", "fertilityindex", "fert_index"],
  ccr: ["ccr"],
  hcr: ["hcr"],
  pl: ["pl", "productive_life"],
  liv: ["liv"],
  scs: ["scs"],
  ptat: ["ptat"],
  udc: ["udc"],
  mast: ["mast", "mastitis"],
  cfp: ["cfp"],
};

/* Campos possíveis para categoria e fazenda */
const CATEGORY_CANDIDATES = [
  "Categoria",
  "categoria",
  "category",
  "Category",
  "age_group",
  "agegroup",
  "coarse",
  "coarse_group",
  "grupo",
  "label",
];

const FARM_CANDIDATES = ["farm_id", "id_fazenda", "farmId", "fazenda_id"];

/* Tabelas candidatas (na ordem de prioridade) */
const TABLE_CANDIDATES = ["rebanho", "females_denorm", "female_denorm"];

/* Defaults para UI (como nas imagens) */
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
const AGE_SHORTCUTS = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"] as const;

/* Helpers de normalização */
const norm = (s: any) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const PTA_SYNONYMS_NORM: Record<string, string[]> = Object.fromEntries(
  Object.entries(PTA_SYNONYMS).map(([k, list]) => [k, Array.from(new Set(list.map(norm)))])
);

/* ---------- Tipos ---------- */
type CatMeans = Record<string, Record<string, number | null>>; // categoria -> trait -> média

type TraitColumnMap = Record<string, string>;

type NormalizedRow = Record<string, string | number | null> & { category: string };

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<NormalizedRow[]>([]);
  const [sourceTable, setSourceTable] = useState<string>("");
  const [categoryColumn, setCategoryColumn] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [availableTraits, setAvailableTraits] = useState<string[]>([]);
  const [traitColumnMap, setTraitColumnMap] = useState<TraitColumnMap>({});

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  /* =========================
     Fetch com fallback:
     rebanho -> females_denorm -> female_denorm
     ========================= */
  const fetchAnyTable = useCallback(
    async (farm: string | number) => {
      const tryTable = async (table: string) => {
        let query = supabase.from(table).select("*").limit(100000);

        for (const col of FARM_CANDIDATES) {
          const q = await query.eq(col as any, farm);
          if (!q.error && Array.isArray(q.data) && q.data.length > 0) {
            return { data: q.data, table };
          }
        }

        const q2 = await supabase.from(table).select("*").limit(20000);
        if (!q2.error && Array.isArray(q2.data) && q2.data.length > 0) {
          return { data: q2.data, table };
        }

        return { data: [] as any[], table };
      };

      for (const t of TABLE_CANDIDATES) {
        try {
          const { data, table } = await tryTable(t);
          if (data.length) {
            return { rows: data, table };
          }
        } catch {
          /* tabela pode não existir; segue para próxima */
        }
      }
      return { rows: [] as any[], table: "" };
    },
    []
  );

  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      setCategories([]);
      setSourceTable("");
      setCategoryColumn("");
      setAvailableTraits([]);
      setTraitColumnMap({});
      return;
    }
    setLoading(true);

    try {
      const { rows: data, table } = await fetchAnyTable(farmId);
      setSourceTable(table);

      const sane = (data || []).filter((row) => row && typeof row === "object");
      if (!sane.length) {
        setRows([]);
        setCategories([]);
        setCategoryColumn("");
        setAvailableTraits([]);
        setTraitColumnMap({});
        return;
      }

      const allKeys = Array.from(
        new Set(
          sane.flatMap((row) => Object.keys(row ?? {}))
        )
      );

      let detectedCategory = "";
      for (const key of allKeys) {
        const normalizedKey = norm(key);
        if (CATEGORY_CANDIDATES.some((candidate) => norm(candidate) === normalizedKey)) {
          detectedCategory = key;
          break;
        }
      }
      if (!detectedCategory) {
        detectedCategory =
          allKeys.find((key) => norm(key).includes("categoria")) ||
          allKeys.find((key) => norm(key).includes("category")) ||
          "";
      }

      const traitMap: TraitColumnMap = {};
      for (const key of allKeys) {
        const normalizedKey = norm(key);
        for (const [trait, synonyms] of Object.entries(PTA_SYNONYMS_NORM)) {
          if (synonyms.includes(normalizedKey) && !traitMap[trait]) {
            traitMap[trait] = key;
          }
        }
      }

      const recognizedTraits = ALL_PTA_KEYS.filter((trait) => traitMap[trait]);

      const normalizedRows: NormalizedRow[] = sane.map((row) => {
        const rawCategory = detectedCategory ? row[detectedCategory] : undefined;
        const category = rawCategory != null && String(rawCategory).trim().length > 0
          ? String(rawCategory).trim()
          : "Sem categoria";

        const out: NormalizedRow = { category };
        for (const trait of recognizedTraits) {
          const column = traitMap[trait];
          const raw = column ? row[column] : null;
          const value = Number(raw);
          out[trait] = Number.isFinite(value) ? value : null;
        }
        return out;
      });

      const cats = Array.from(
        new Set(
          normalizedRows
            .map((row) => row.category)
            .filter((category) => typeof category === "string" && category.trim().length > 0)
        )
      );

      const orderedCategories = [
        ...AGE_SHORTCUTS.filter((c) => cats.includes(c)),
        ...cats.filter((c) => !AGE_SHORTCUTS.includes(c as any)),
      ];

      setRows(normalizedRows);
      setCategories(orderedCategories);
      setCategoryColumn(detectedCategory);
      setAvailableTraits(recognizedTraits);
      setTraitColumnMap(traitMap);

      setGroupA((prev) => (orderedCategories.includes(prev) ? prev : orderedCategories[0] || "Grupo A"));
      setGroupB((prev) =>
        orderedCategories.includes(prev)
          ? prev
          : orderedCategories[1] || orderedCategories[0] || "Grupo B"
      );

      setTableTraits((prev) => {
        const filtered = prev.filter((trait) => recognizedTraits.includes(trait));
        if (filtered.length) return filtered;
        const defaults = DEFAULT_TABLE_TRAITS.filter((trait) => recognizedTraits.includes(trait));
        if (defaults.length) return defaults;
        return recognizedTraits.slice(0, Math.min(7, recognizedTraits.length));
      });

      setChartTraits((prev) => {
        const filtered = prev.filter((trait) => recognizedTraits.includes(trait));
        if (filtered.length) return filtered;
        const defaults = DEFAULT_CHART_TRAITS.filter((trait) => recognizedTraits.includes(trait));
        if (defaults.length) return defaults;
        return recognizedTraits.slice(0, Math.min(12, recognizedTraits.length));
      });
    } catch (error) {
      console.error("Erro ao buscar dados de progresso:", error);
      setRows([]);
      setCategories([]);
      setCategoryColumn("");
      setAvailableTraits([]);
      setTraitColumnMap({});
    } finally {
      setLoading(false);
    }
  }, [farmId, fetchAnyTable]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* -------------------- Médias por Categoria -------------------- */
  const meansByCategory: CatMeans = useMemo(() => {
    if (!rows.length) return {};
    const traitKeys = availableTraits.length ? availableTraits : ALL_PTA_KEYS;
    const acc: Record<string, Record<string, { sum: number; n: number }>> = {};

    for (const row of rows) {
      const category = row.category || "Sem categoria";
      if (!acc[category]) acc[category] = {};
      for (const trait of traitKeys) {
        const raw = row[trait];
        const value = Number(raw);
        if (Number.isFinite(value)) {
          if (!acc[category][trait]) acc[category][trait] = { sum: 0, n: 0 };
          acc[category][trait].sum += value;
          acc[category][trait].n += 1;
        }
      }
    }

    const out: CatMeans = {};
    for (const [category, traitMapAcc] of Object.entries(acc)) {
      out[category] = {};
      for (const trait of traitKeys) {
        const bucket = traitMapAcc[trait];
        out[category][trait] = bucket && bucket.n > 0 ? bucket.sum / bucket.n : null;
      }
    }
    return out;
  }, [rows, availableTraits]);

  /* --------------- Dados combinados para Tabela / Radar --------------- */
  const pair = useMemo(() => {
    const traitKeys = availableTraits.length ? availableTraits : ALL_PTA_KEYS;
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const tableTraitsOrdered = tableTraits.filter((trait) => traitKeys.includes(trait));
    const chartTraitsOrdered = chartTraits.filter((trait) => traitKeys.includes(trait));

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tableTraitsOrdered.map((trait) => [trait, A[trait] ?? null])) },
        { label: groupB, ...Object.fromEntries(tableTraitsOrdered.map((trait) => [trait, B[trait] ?? null])) },
        {
          label: "Change",
          ...Object.fromEntries(
            tableTraitsOrdered.map((trait) => {
              const a = A[trait];
              const b = B[trait];
              const diff = a != null && b != null ? a - b : null;
              return [trait, diff];
            })
          ),
        },
      ],
    };

    const radar = chartTraitsOrdered.map((trait) => ({
      trait: (PTA_LABELS[trait] ?? trait).toUpperCase(),
      "Group A": (A[trait] ?? 0) as number,
      "Group B": (B[trait] ?? 0) as number,
    }));

    return { table, radar };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits, availableTraits]);

  /* --------------------------- UI helpers --------------------------- */
  const traitBadges = (
    source: string[],
    setSource: (updater: (prev: string[]) => string[]) => void
  ) => {
    const hasAvailable = availableTraits.length > 0;

    return (
      <div className="flex flex-wrap gap-2">
        {ALL_PTA_KEYS.map((key) => {
          const label = PTA_LABELS[key] || key.toUpperCase();
          const enabled = !hasAvailable || availableTraits.includes(key);
          const active = source.includes(key);
          return (
            <Badge
              key={key}
              variant={active ? "default" : "outline"}
              className={`cursor-pointer ${!enabled ? "opacity-40 pointer-events-none" : ""}`}
              onClick={() =>
                enabled
                  ? setSource((prev) =>
                      active ? prev.filter((trait) => trait !== key) : [...prev, key]
                    )
                  : undefined
              }
            >
              {label}
            </Badge>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação por Categoria (Step 6)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Fonte: {sourceTable || "—"}</span>
          {categoryColumn && <span>Coluna de categoria: {categoryColumn}</span>}
          {Object.keys(traitColumnMap).length > 0 && (
            <span>
              PTAs mapeadas: {Object.entries(traitColumnMap)
                .map(([trait, column]) => `${PTA_LABELS[trait] ?? trait}⇢${column}`)
                .join(", ")}
            </span>
          )}
        </div>

        {/* Atalhos de categoria (carregam dados) */}
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

        {/* Seletor: PTAs para Tabela */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Tabela:</div>
          {traitBadges(tableTraits, (fn) => setTableTraits(fn))}
        </div>

        {/* Seletor: PTAs para Gráfico */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Gráfico:</div>
          {traitBadges(chartTraits, (fn) => setChartTraits(fn))}
        </div>

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>
        )}

        {!loading && (!categories.length || !rows.length) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados de rebanho para esta fazenda.
          </div>
        )}

        {!loading && categories.length > 0 && rows.length > 0 && (
          <div className="space-y-8">
            {/* Tabela comparativa */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left font-semibold">Group</th>
                    {tableTraits.map((trait) => (
                      <th key={`th-${trait}`} className="px-2 py-2 text-left font-semibold">
                        {(PTA_LABELS[trait] ?? trait).toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pair.table.rows.map((row, index) => (
                    <tr
                      key={`row-${index}-${row.label}`}
                      className={`border-b ${index === 2 ? "bg-muted/30" : ""}`}
                    >
                      <td className="px-2 py-2 font-medium">{row.label}</td>
                      {tableTraits.map((trait) => {
                        const value = row[trait] as number | null | undefined;
                        const isChangeRow = index === 2;
                        const isPositive = (value ?? 0) > 0;
                        return (
                          <td
                            key={`td-${trait}`}
                            className={`px-2 py-2 ${
                              isChangeRow
                                ? isPositive
                                  ? "text-green-600"
                                  : value == null
                                  ? ""
                                  : "text-red-600"
                                : ""
                            }`}
                          >
                            {value == null ? "-" : Number(value).toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Radar “Rate of Change” (comparação direta) */}
            {pair.radar.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Rate of Change</h4>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={pair.radar}>
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

