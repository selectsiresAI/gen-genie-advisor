"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useFemales } from "../hooks";

/* ================== PTAs suportadas ================== */
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

/* ============= Sinônimos comuns (nome de coluna pode variar) ============= */
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

const CATEGORY_NAME_CANDIDATES = [
  "Categoria",
  "categoria",
  "category",
  "age_group",
  "agegroup",
  "coarse",
  "grupo",
  "paridade",
  "parity",
];

const DEFAULT_TABLE_TRAITS = ["hhp_dollar", "ptam", "cfp", "fi", "pl", "scs", "mast"];
const DEFAULT_CHART_TRAITS = [
  "hhp_dollar", "ptam", "ptaf", "ptap", "fi", "ccr", "hcr", "pl", "liv", "scs", "ptat", "udc",
];

const CATEGORY_ORDER = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"] as const;
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  Bezerra: ["bezerra", "bezerras", "calf", "calves"],
  Novilha: ["novilha", "novilhas", "heifer", "heifers"],
  "Primípara": ["primipara", "primiparas", "primiparous", "primipara1"],
  "Secundípara": ["secundipara", "secundiparas", "secondipara", "segundipara"],
  "Multípara": ["multipara", "multiparas", "multípara", "multíparas", "cow", "cows", "vaca", "vacas"],
};
const AUTO_CATEGORY_COLUMN = "__auto__";
const CATEGORY_COLUMN_LABELS: Record<string, string> = {
  [AUTO_CATEGORY_COLUMN]: "Classificação automática (Bezerra → Multípara)",
};

function sortCategories(input: string[]): string[] {
  const orderMap = new Map(CATEGORY_ORDER.map((label, index) => [label, index]));
  return [...new Set(input)].sort((a, b) => {
    const idxA = orderMap.has(a) ? orderMap.get(a)! : CATEGORY_ORDER.length;
    const idxB = orderMap.has(b) ? orderMap.get(b)! : CATEGORY_ORDER.length;
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b);
  });
}

/* ================== Helpers ================== */
const norm = (s: any) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");

const PTA_SYNONYMS_NORM: Record<string, string[]> = Object.fromEntries(
  Object.entries(PTA_SYNONYMS).map(([k, list]) => [k, Array.from(new Set(list.map(norm)))])
);

const CATEGORY_NORMALIZATION: Record<string, string> = (() => {
  const entries: [string, string][] = [];
  for (const label of CATEGORY_ORDER) {
    entries.push([norm(label), label]);
  }
  Object.entries(CATEGORY_SYNONYMS).forEach(([label, variants]) => {
    const canonical = (label as typeof CATEGORY_ORDER[number]) || label;
    entries.push([norm(label), canonical]);
    variants.forEach((variant) => {
      entries.push([norm(variant), canonical]);
    });
  });
  const map: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (!map[key]) map[key] = value;
  }
  return map;
})();

function canonicalCategoryLabel(value: any): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = norm(trimmed);
  if (CATEGORY_NORMALIZATION[normalized]) {
    return CATEGORY_NORMALIZATION[normalized];
  }
  for (const [canonical, variants] of Object.entries(CATEGORY_SYNONYMS)) {
    const canonicalNorm = norm(canonical);
    if (normalized.includes(canonicalNorm)) return canonical as typeof CATEGORY_ORDER[number];
    if (variants.some((variant) => normalized.includes(norm(variant)))) {
      return canonical as typeof CATEGORY_ORDER[number];
    }
  }
  return trimmed;
}

function autoCategoryFromRow(row: any): string | null {
  const parity = Number.isFinite(Number(row?.parity_order)) ? Number(row.parity_order) : null;
  const birthDateRaw = row?.birth_date;
  if (birthDateRaw) {
    const birthDate = new Date(birthDateRaw);
    if (!Number.isNaN(birthDate.getTime())) {
      const today = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.floor((today.getTime() - birthDate.getTime()) / msPerDay);
      if (daysDiff <= 90 && (parity == null || parity === 0)) return "Bezerra";
      if (daysDiff > 90 && (parity == null || parity === 0)) return "Novilha";
    }
  }
  if (parity === 0) return "Novilha";
  if (parity === 1) return "Primípara";
  if (parity === 2) return "Secundípara";
  if (parity != null && parity >= 3) return "Multípara";
  return null;
}

function resolveCategoryForRow(row: any, column: string | null | undefined): string | null {
  const candidates: Array<string | null> = [];
  if (column) {
    if (column === AUTO_CATEGORY_COLUMN) {
      candidates.push(autoCategoryFromRow(row));
    } else {
      candidates.push(canonicalCategoryLabel(row?.[column]));
    }
  }
  candidates.push(canonicalCategoryLabel(row?.category));
  candidates.push(canonicalCategoryLabel(row?.Categoria));
  candidates.push(canonicalCategoryLabel(row?.categoria));
  candidates.push(canonicalCategoryLabel(row?.Category));
  candidates.push(canonicalCategoryLabel(row?.age_group));
  candidates.push(canonicalCategoryLabel(row?.grupo));
  candidates.push(canonicalCategoryLabel(row?.paridade));
  candidates.push(autoCategoryFromRow(row));

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

function toNumber(x: any): number | null {
  if (x == null) return null;
  const v = Number(String(x).replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

function resolveTraitValue(row: any, canonical: string): number | null {
  const nm: Record<string, any> = {};
  for (const k of Object.keys(row)) nm[norm(k)] = row[k];

  const cands = PTA_SYNONYMS_NORM[canonical] || [norm(canonical)];
  for (const k of cands) {
    if (k in nm) {
      const v = toNumber(nm[k]);
      if (v != null) return v;
    }
    if (k.endsWith("dollar")) {
      const alt = k.replace("dollar", "");
      if (alt in nm) {
        const v2 = toNumber(nm[alt]);
        if (v2 != null) return v2;
      }
    } else {
      const alt = k + "dollar";
      if (alt in nm) {
        const v3 = toNumber(nm[alt]);
        if (v3 != null) return v3;
      }
    }
  }
  return null;
}

function detectCategoryColumn(rows: any[]): string | null {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0] ?? {});
  // 1) por nome
  for (const key of keys) {
    const nk = norm(key);
    if (CATEGORY_NAME_CANDIDATES.some((c) => norm(c) === nk)) return key;
  }
  // 2) por conteúdo (procura coluna com valores entre as categorias conhecidas)
  const known = new Set(CATEGORY_ORDER.map((label) => norm(label)));
  for (const key of keys) {
    let hits = 0;
    for (let i = 0; i < Math.min(rows.length, 300); i++) {
      const v = rows[i]?.[key];
      if (typeof v === "string" && known.has(norm(v))) hits++;
    }
    if (hits >= 3) return key; // achou ao menos 3 registros categorizados
  }
  return null;
}

function listCategoryColumns(rows: any[]): string[] {
  if (!rows.length) return [];
  const seenKeys = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    for (const key of Object.keys(row)) {
      seenKeys.add(key);
    }
  }

  const asArray = Array.from(seenKeys);
  const hasStrings = (key: string) =>
    rows.some((row) => {
      const value = row?.[key];
      return typeof value === "string" && value.trim().length > 0;
    });

  const stringCols = asArray.filter(hasStrings);
  const looksLikeCategory = (key: string) => {
    if (CATEGORY_NAME_CANDIDATES.some((c) => norm(c) === norm(key))) return true;
    let recognized = 0;
    for (let i = 0; i < Math.min(rows.length, 300); i++) {
      const raw = rows[i]?.[key];
      if (typeof raw !== "string") continue;
      if (canonicalCategoryLabel(raw)) {
        recognized++;
        if (recognized >= 3) return true;
      }
    }
    return recognized >= 3;
  };

  const prioritized = [
    ...stringCols.filter((key) => looksLikeCategory(key)),
    ...stringCols.filter((key) => !looksLikeCategory(key)),
  ];

  return Array.from(new Set(prioritized));
}

/* ================== Tipos ================== */
type MeansByCategory = Record<string, Record<string, number | null>>;

/* ================== Componente ================== */
export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const {
    data: femaleData = [],
    isLoading,
    error,
  } = useFemales(farmId ? String(farmId) : undefined);

  const rows = useMemo(() => {
    if (!Array.isArray(femaleData)) return [];
    return femaleData.filter((item) => item && typeof item === "object");
  }, [femaleData]);

  const categoryColumns = useMemo(() => {
    const detected = listCategoryColumns(rows);
    const unique = new Set<string>([AUTO_CATEGORY_COLUMN, ...detected]);
    return Array.from(unique);
  }, [rows]);

  const detectedCategoryColumn = useMemo(() => detectCategoryColumn(rows), [rows]);

  const [categoryCol, setCategoryCol] = useState<string>(AUTO_CATEGORY_COLUMN);
  const [categoryColUserSet, setCategoryColUserSet] = useState(false);

  useEffect(() => {
    if (!categoryColumns.length) {
      if (categoryCol !== AUTO_CATEGORY_COLUMN) {
        setCategoryCol(AUTO_CATEGORY_COLUMN);
      }
      return;
    }

    const preferred =
      (!categoryColUserSet && detectedCategoryColumn && categoryColumns.includes(detectedCategoryColumn)
        ? detectedCategoryColumn
        : null) || categoryCol;

    if (preferred && categoryColumns.includes(preferred)) {
      if (categoryCol !== preferred) {
        setCategoryCol(preferred);
      }
      return;
    }

    const fallback = categoryColumns.find((column) => column !== undefined) || AUTO_CATEGORY_COLUMN;
    if (categoryCol !== fallback) {
      setCategoryCol(fallback);
    }
  }, [categoryColumns, categoryCol, detectedCategoryColumn, categoryColUserSet]);

  useEffect(() => {
    setCategoryColUserSet(false);
  }, [farmId]);

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  const categorizedRows = useMemo(() => {
    if (!rows.length) return [];
    return rows
      .map((row) => {
        const category = resolveCategoryForRow(row, categoryCol);
        return category ? { category, row } : null;
      })
      .filter((item): item is { category: string; row: any } => Boolean(item));
  }, [rows, categoryCol]);

  const availableCategories = useMemo(
    () => sortCategories(categorizedRows.map((item) => item.category)),
    [categorizedRows]
  );

  const selectableCategories = useMemo(() => {
    const extras = availableCategories.filter((cat) => !CATEGORY_ORDER.includes(cat as any));
    return [...CATEGORY_ORDER, ...extras];
  }, [availableCategories]);

  const [enabledCategories, setEnabledCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!availableCategories.length) {
      setEnabledCategories((prev) => (prev.length ? [] : prev));
      return;
    }

    setEnabledCategories((prev) => {
      const validPrev = prev.filter((cat) => availableCategories.includes(cat));
      if (validPrev.length === prev.length && validPrev.length > 0) {
        return prev;
      }
      if (validPrev.length > 0) {
        return validPrev;
      }
      return [...availableCategories];
    });
  }, [availableCategories]);

  const filteredRows = useMemo(() => {
    if (!categorizedRows.length) return [];
    if (!enabledCategories.length) return categorizedRows;
    const active = new Set(enabledCategories);
    return categorizedRows.filter(({ category }) => active.has(category));
  }, [categorizedRows, enabledCategories]);

  const meansByCategory: MeansByCategory = useMemo(() => {
    if (!filteredRows.length) return {};
    const acc: Record<string, Record<string, { sum: number; n: number }>> = {};

    for (const { category, row } of filteredRows) {
      if (!acc[category]) acc[category] = {};
      for (const key of ALL_PTA_KEYS) {
        const v = resolveTraitValue(row, key);
        if (v != null) {
          if (!acc[category][key]) acc[category][key] = { sum: 0, n: 0 };
          acc[category][key].sum += v;
          acc[category][key].n += 1;
        }
      }
    }

    const out: MeansByCategory = {};
    for (const [category, map] of Object.entries(acc)) {
      out[category] = {};
      for (const key of ALL_PTA_KEYS) {
        const bucket = map[key];
        out[category][key] = bucket && bucket.n > 0 ? bucket.sum / bucket.n : null;
      }
    }
    return out;
  }, [filteredRows]);

  const traitsWithData = useMemo(() => {
    const set = new Set<string>();
    Object.values(meansByCategory).forEach((map) => {
      if (!map) return;
      Object.entries(map).forEach(([key, value]) => {
        if (value != null) {
          set.add(key);
        }
      });
    });
    return set;
  }, [meansByCategory]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");
  const [groupAUserSet, setGroupAUserSet] = useState(false);
  const [groupBUserSet, setGroupBUserSet] = useState(false);

  useEffect(() => {
    setGroupAUserSet(false);
    setGroupBUserSet(false);
  }, [categoryCol, farmId]);

  const activeCategories = useMemo(
    () => sortCategories(enabledCategories.length ? enabledCategories : availableCategories),
    [enabledCategories, availableCategories]
  );

  useEffect(() => {
    if (!activeCategories.length) return;

    setGroupA((prev) => {
      const hasPrev = prev && activeCategories.includes(prev);
      if (hasPrev && groupAUserSet) return prev;
      if (hasPrev) return prev;
      return activeCategories[0];
    });

    setGroupB((prev) => {
      const hasPrev = prev && activeCategories.includes(prev);
      if (hasPrev && groupBUserSet) return prev;
      if (hasPrev) return prev;
      return activeCategories[1] || activeCategories[0];
    });
  }, [activeCategories, groupAUserSet, groupBUserSet]);

  const availableTableTraits = useMemo(
    () => tableTraits.filter((trait) => traitsWithData.has(trait)),
    [tableTraits, traitsWithData]
  );

  const availableChartTraits = useMemo(
    () => chartTraits.filter((trait) => traitsWithData.has(trait)),
    [chartTraits, traitsWithData]
  );

  const view = useMemo(() => {
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const tTraits = availableTableTraits;
    const cTraits = availableChartTraits;

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tTraits.map((k) => [k, A[k] ?? null])) },
        { label: groupB, ...Object.fromEntries(tTraits.map((k) => [k, B[k] ?? null])) },
        {
          label: "Diferença (A - B)",
          ...Object.fromEntries(
            tTraits.map((k) => [k, A[k] != null && B[k] != null ? (A[k]! - B[k]!) : null])
          ),
        },
      ],
    };

    const radar = cTraits.map((k) => ({
      trait: (PTA_LABELS[k] ?? k).toUpperCase(),
      "Group A": (A[k] ?? 0) as number,
      "Group B": (B[k] ?? 0) as number,
    }));

    return { table, radar, tTraits, cTraits };
  }, [meansByCategory, groupA, groupB, availableTableTraits, availableChartTraits]);

  const traitBadges = (
    source: string[],
    setSource: (updater: (prev: string[]) => string[]) => void
  ) => (
    <div className="flex flex-wrap gap-2">
      {ALL_PTA_KEYS
        .map((key) => ({ key, label: PTA_LABELS[key] || key.toUpperCase() }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(({ key, label }) => {
          const on = source.includes(key);
          const hasData = traitsWithData.has(key);
          const disabled = !hasData && !on;
          return (
            <Badge
              key={key}
              variant={on ? "default" : "outline"}
              className={`cursor-pointer ${disabled ? "opacity-40 pointer-events-none" : ""}`}
              onClick={() => {
                if (disabled) return;
                setSource((prev) =>
                  on ? prev.filter((t) => t !== key) : [...prev, key]
                );
              }}
            >
              {label}
            </Badge>
          );
        })}
    </div>
  );

  const updateGroupA = useCallback((value: string) => {
    setGroupA(value);
    setGroupAUserSet(true);
  }, []);

  const updateGroupB = useCallback((value: string) => {
    setGroupB(value);
    setGroupBUserSet(true);
  }, []);

  const sourceTable = "females_denorm";
  const categoryColumnLabel = categoryCol
    ? CATEGORY_COLUMN_LABELS[categoryCol] ?? categoryCol
    : "";

  const quickCategories = activeCategories;

  const toggleCategory = (category: string, hasData: boolean) => {
    if (!hasData) return;
    setEnabledCategories((prev) => {
      const exists = prev.includes(category);
      if (exists) {
        if (prev.length <= 1) return prev;
        return prev.filter((cat) => cat !== category);
      }
      return sortCategories([...prev, category]);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Comparação por Categoria (Step 6)
          {rows.length > 0
            ? ` — fonte: ${sourceTable}${categoryCol ? `.${categoryCol}` : ""}`
            : ""}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seletores principais */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Coluna de categoria</div>
            <Select
              value={categoryCol}
              onValueChange={(value) => {
                setCategoryCol(value);
                setCategoryColUserSet(true);
              }}
              disabled={categoryColumns.length <= 1 && categoryColumns[0] === AUTO_CATEGORY_COLUMN}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a coluna" />
              </SelectTrigger>
              <SelectContent>
                {categoryColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {CATEGORY_COLUMN_LABELS[column] ?? column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Grupo A</div>
            <Select
              value={groupA || ""}
              onValueChange={updateGroupA}
              disabled={activeCategories.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem
                    key={`ga-select-${category}`}
                    value={category}
                    disabled={!enabledCategories.includes(category)}
                  >
                    {category}
                    {!enabledCategories.includes(category) ? " (filtro desligado)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Grupo B</div>
            <Select
              value={groupB || ""}
              onValueChange={updateGroupB}
              disabled={activeCategories.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem
                    key={`gb-select-${category}`}
                    value={category}
                    disabled={!enabledCategories.includes(category)}
                  >
                    {category}
                    {!enabledCategories.includes(category) ? " (filtro desligado)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtro de categorias */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">Categorias consideradas</div>
          <div className="flex flex-wrap gap-2">
            {selectableCategories.map((category) => {
              const hasData = availableCategories.includes(category);
              const active = enabledCategories.includes(category);
              return (
                <Badge
                  key={`filter-${category}`}
                  variant={active ? "default" : "outline"}
                  className={`cursor-pointer ${hasData ? "" : "opacity-40 pointer-events-none"}`}
                  onClick={() => toggleCategory(category, hasData)}
                >
                  {category}
                  {!hasData ? " (sem dados)" : ""}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Ative as categorias com dados disponíveis para habilitar a comparação.
          </p>
        </div>

        {/* Atalhos: Categoria A vs Categoria B */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Atalhos:</span>
          {quickCategories.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              Nenhuma categoria disponível com dados.
            </span>
          ) : (
            <>
              {quickCategories.map((category) => (
                <Badge
                  key={`ga-${category}`}
                  variant={groupA === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateGroupA(category)}
                >
                  {category}
                </Badge>
              ))}
              <span className="mx-2 uppercase tracking-wide text-xs text-muted-foreground">VS</span>
              {quickCategories.map((category) => (
                <Badge
                  key={`gb-${category}`}
                  variant={groupB === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateGroupB(category)}
                >
                  {category}
                </Badge>
              ))}
            </>
          )}
        </div>

        {/* Seletores de PTAs */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Tabela:</div>
          {traitBadges(tableTraits, (fn) => setTableTraits(fn))}
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Gráfico:</div>
          {traitBadges(chartTraits, (fn) => setChartTraits(fn))}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Erro ao carregar dados do rebanho. Tente novamente mais tarde.
          </div>
        )}

        {isLoading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados…</div>
        )}

        {!isLoading && (!rows.length || !filteredRows.length) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados categorizados disponíveis em {sourceTable} para esta fazenda.
          </div>
        )}

        {!isLoading && filteredRows.length > 0 && (
          <div className="space-y-8">
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">
                      Categoria {categoryColumnLabel ? `(${categoryColumnLabel})` : ""}
                    </th>
                    {view.tTraits.map((t) => (
                      <th key={`th-${t}`} className="py-2 px-2 text-left font-semibold">
                        {(PTA_LABELS[t] ?? t).toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.table.rows.map((r: any, idx: number) => (
                    <tr key={`row-${idx}-${r.label}`} className={`border-b ${idx === 2 ? "bg-muted/30" : ""}`}>
                      <td className="py-2 px-2 font-medium">{r.label}</td>
                      {view.tTraits.map((t) => {
                        const val = r[t] as number | null | undefined;
                        const isChange = idx === 2;
                        const isPos = (val ?? 0) > 0;
                        return (
                          <td
                            key={`td-${t}`}
                            className={`py-2 px-2 ${
                              isChange ? (isPos ? "text-green-600" : "text-red-600") : ""
                            }`}
                          >
                            {val == null ? "-" : Number(val).toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Radar */}
            {view.radar.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Rate of Change</h4>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={view.radar}>
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
