"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

/* ============= Tabelas e colunas candidatas ============= */
const TABLE_CANDIDATES = ["rebanho", "females_denorm", "female_denorm", "females", "female"];
const FARM_COLS = ["farm_id", "id_fazenda", "fazenda_id", "farmId"];
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

const AGE_VALUES = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"] as const;

/* ================== Helpers ================== */
const norm = (s: any) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");

const PTA_SYNONYMS_NORM: Record<string, string[]> = Object.fromEntries(
  Object.entries(PTA_SYNONYMS).map(([k, list]) => [k, Array.from(new Set(list.map(norm)))])
);

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
  const known = new Set(AGE_VALUES.map(norm));
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
  const prioritized = [
    ...stringCols.filter((key) => CATEGORY_NAME_CANDIDATES.some((c) => norm(c) === norm(key))),
    ...stringCols.filter((key) => !CATEGORY_NAME_CANDIDATES.some((c) => norm(c) === norm(key))),
  ];

  return Array.from(new Set(prioritized));
}

/* ================== Tipos ================== */
type MeansByCategory = Record<string, Record<string, number | null>>;

/* ================== Componente ================== */
export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [sourceTable, setSourceTable] = useState<string>("");
  const [categoryCol, setCategoryCol] = useState<string>("");

  const [rows, setRows] = useState<any[]>([]);
  const [categoryColumns, setCategoryColumns] = useState<string[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");
  const [groupAUserSet, setGroupAUserSet] = useState(false);
  const [groupBUserSet, setGroupBUserSet] = useState(false);

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  /* -------- fetch com fallback rebanho → females_denorm → ... -------- */
  const fetchData = useCallback(async () => {
    if (!farmId) { setRows([]); setCategoryColumns([]); setSourceTable(""); setCategoryCol(""); return; }
    setLoading(true);

    let gotRows: any[] = [];
    let usedTable = "";
    // tenta cada tabela
    for (const table of TABLE_CANDIDATES) {
      // tenta cada coluna de fazenda
      let res: any = { data: [], error: null };
      for (const fcol of FARM_COLS) {
        res = await supabase.from(table).select("*").eq(fcol as any, farmId).limit(100000);
        if (!res.error && Array.isArray(res.data) && res.data.length > 0) break;
      }
      // se nada com filtro, tenta sem (caso RLS permita)
      if ((!res.data || res.data.length === 0) && !res.error) {
        res = await supabase.from(table).select("*").limit(20000);
      }
      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        gotRows = res.data.filter((r: any) => r && typeof r === "object");
        usedTable = table;
        // precisamos garantir que existe coluna de categoria com valores
        const catKey = detectCategoryColumn(gotRows);
        if (catKey) break; // ok, tabela válida
        // caso não tenha categoria válida, continua tentando as demais tabelas
      }
    }

    setSourceTable(usedTable);
    setRows(gotRows);
    setCategoryColumns(listCategoryColumns(gotRows));

    // categoria
    const catKey = detectCategoryColumn(gotRows);
    setCategoryCol(catKey || "");

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!categoryColumns.length) {
      if (categoryCol) setCategoryCol("");
      return;
    }
    if (!categoryCol || !categoryColumns.includes(categoryCol)) {
      setCategoryCol(categoryColumns[0]);
    }
  }, [categoryColumns, categoryCol]);

  useEffect(() => {
    setGroupAUserSet(false);
    setGroupBUserSet(false);
  }, [categoryCol, sourceTable, farmId]);

  const categories = useMemo(() => {
    if (!rows.length || !categoryCol) return [];
    const raw = Array.from(
      new Set(
        rows
          .map((r) => r?.[categoryCol])
          .filter((c: any) => typeof c === "string" && c.trim().length > 0)
      )
    );
    const ordered = [
      ...AGE_VALUES.filter((c) => raw.includes(c)),
      ...raw.filter((c) => !AGE_VALUES.includes(c as any)),
    ];
    return ordered;
  }, [rows, categoryCol]);

  const displayCategories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const push = (value: string) => {
      if (!seen.has(value)) {
        seen.add(value);
        ordered.push(value);
      }
    };
    AGE_VALUES.forEach((value) => push(value));
    categories.forEach((value) => push(value));
    return ordered;
  }, [categories]);

  useEffect(() => {
    if (!categories.length) return;
    setGroupA((prev) => {
      if (groupAUserSet && prev) {
        return prev;
      }
      if (prev && categories.includes(prev)) {
        return prev;
      }
      return categories[0];
    });
    setGroupB((prev) => {
      if (groupBUserSet && prev) {
        return prev;
      }
      if (prev && categories.includes(prev)) {
        return prev;
      }
      return categories[1] || categories[0];
    });
  }, [categories, groupAUserSet, groupBUserSet]);

  /* -------- médias por categoria -------- */
  const meansByCategory: MeansByCategory = useMemo(() => {
    if (!rows.length || !categoryCol) return {};
    const acc: Record<string, Record<string, { sum: number; n: number }>> = {};

    for (const r of rows) {
      const cat = (r?.[categoryCol] as string) || "Sem categoria";
      if (!acc[cat]) acc[cat] = {};
      for (const key of ALL_PTA_KEYS) {
        const v = resolveTraitValue(r, key);
        if (v != null) {
          if (!acc[cat][key]) acc[cat][key] = { sum: 0, n: 0 };
          acc[cat][key].sum += v;
          acc[cat][key].n += 1;
        }
      }
    }

    const out: MeansByCategory = {};
    for (const [cat, map] of Object.entries(acc)) {
      out[cat] = {};
      for (const key of ALL_PTA_KEYS) {
        const b = map[key];
        out[cat][key] = b && b.n > 0 ? b.sum / b.n : null;
      }
    }
    return out;
  }, [rows, categoryCol]);

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

  /* -------- dados para tabela e radar -------- */
  const view = useMemo(() => {
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const presentTrait = (k: string) => traitsWithData.has(k);

    const tTraits = tableTraits.filter(presentTrait);
    const cTraits = chartTraits.filter(presentTrait);

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tTraits.map((k) => [k, A[k] ?? null])) },
        { label: groupB, ...Object.fromEntries(tTraits.map((k) => [k, B[k] ?? null])) },
        {
          label: "Diferença (A - B)",
          ...Object.fromEntries(tTraits.map((k) => [k, A[k] != null && B[k] != null ? (A[k]! - B[k]!) : null])),
        },
      ],
    };

    const radar = cTraits.map((k) => ({
      trait: (PTA_LABELS[k] ?? k).toUpperCase(),
      "Group A": (A[k] ?? 0) as number,
      "Group B": (B[k] ?? 0) as number,
    }));

    return { table, radar, tTraits, cTraits };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits, traitsWithData]);

  /* -------- UI helpers -------- */
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

  /* -------- Render -------- */
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Comparação por Categoria (Step 6)
          {sourceTable ? ` — fonte: ${sourceTable}${categoryCol ? "." + categoryCol : ""}` : ""}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seletores principais */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Coluna de categoria</div>
            <Select
              value={categoryCol || (categoryColumns[0] ?? "")}
              onValueChange={(value) => setCategoryCol(value)}
              disabled={categoryColumns.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    categoryColumns.length === 0
                      ? "Nenhuma coluna identificada"
                      : "Selecione a coluna"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categoryColumns.length === 0 && (
                  <SelectItem value="" disabled>
                    Sem colunas disponíveis
                  </SelectItem>
                )}
                {categoryColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Grupo A</div>
            <Select
              value={groupA || ""}
              onValueChange={(value) => updateGroupA(value)}
              disabled={displayCategories.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {displayCategories.map((category) => (
                  <SelectItem key={`ga-select-${category}`} value={category}>
                    {category}
                    {!categories.includes(category) ? " (sem dados)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Grupo B</div>
            <Select
              value={groupB || ""}
              onValueChange={(value) => updateGroupB(value)}
              disabled={displayCategories.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {displayCategories.map((category) => (
                  <SelectItem key={`gb-select-${category}`} value={category}>
                    {category}
                    {!categories.includes(category) ? " (sem dados)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Atalhos: Categoria A vs Categoria B */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Atalhos:</span>
          {categories.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              Nenhuma categoria disponível para a coluna selecionada.
            </span>
          ) : (
            <>
              {categories.map((c) => (
                <Badge
                  key={`ga-${c}`}
                  variant={groupA === c ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateGroupA(c)}
                >
                  {c}
                </Badge>
              ))}
              <span className="mx-2 uppercase tracking-wide text-xs text-muted-foreground">VS</span>
              {categories.map((c) => (
                <Badge
                  key={`gb-${c}`}
                  variant={groupB === c ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => updateGroupB(c)}
                >
                  {c}
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

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados…</div>
        )}

        {!loading && (!rows.length || !categoryCol) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados com categoria em {TABLE_CANDIDATES.join(", ")} para esta fazenda.
          </div>
        )}

        {!loading && rows.length > 0 && categoryCol && (
          <div className="space-y-8">
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">Categoria</th>
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
                          <td key={`td-${t}`} className={`py-2 px-2 ${isChange ? (isPos ? "text-green-600" : "text-red-600") : ""}`}>
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
                <h4 className="text-sm font-semibold mb-2">Rate of Change</h4>
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
