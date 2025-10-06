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

/* ============= Tabelas/colunas candidatas ============= */
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
const ID_CANDIDATES = [
  "id",
  "female_id",
  "animal_id",
  "id_animal",
  "identificacao",
  "identification",
  "ident",
  "brinco",
  "tag",
  "ear_tag",
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

function detectColumn(keys: string[], candidates: string[]): string | null {
  for (const k of keys) {
    const nk = norm(k);
    if (candidates.some((c) => norm(c) === nk)) return k;
  }
  return null;
}

function detectCategoryColumn(rows: any[]): string | null {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0] ?? {});
  // 1) por nome
  const byName = detectColumn(keys, CATEGORY_NAME_CANDIDATES);
  if (byName) return byName;
  // 2) por conteúdo (valores típicos)
  const known = new Set(AGE_VALUES.map(norm));
  for (const key of keys) {
    let hits = 0;
    for (let i = 0; i < Math.min(rows.length, 300); i++) {
      const v = rows[i]?.[key];
      if (typeof v === "string" && known.has(norm(v))) hits++;
    }
    if (hits >= 3) return key;
  }
  return null;
}

function detectIdColumn(rows: any[]): string | null {
  if (!rows.length) return null;
  const keys = Object.keys(rows[0] ?? {});
  const byName = detectColumn(keys, ID_CANDIDATES);
  if (byName) return byName;
  // fallback: coluna "id" case-insensitive
  const idLike = keys.find((k) => norm(k) === "id");
  return idLike || null;
}

/* ================== LocalStorage helpers ================== */
// Estrutura esperada: { [animalId: string]: "Categoria" }
function lsKey(farmId: string | number) {
  return `ag:rebanho:categories:${farmId}`;
}
// Aceita aliases antigos
const ALT_KEYS = (farmId: string | number) => [
  lsKey(farmId),
  `rebanho:categorias:${farmId}`,
  `categories_rebanho_${farmId}`,
  `female_categories_${farmId}`,
];

function readCategoriesFromLS(farmId: string | number): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  for (const key of ALT_KEYS(farmId)) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const json = JSON.parse(raw);
      const map = new Map<string, string>();
      if (Array.isArray(json)) {
        // [{id, categoria}] ou [{animal_id, Categoria}] ...
        for (const item of json) {
          const id =
            item?.id ?? item?.animal_id ?? item?.female_id ?? item?.id_animal ?? item?.identificacao ?? item?.ident;
          const cat = item?.Categoria ?? item?.categoria ?? item?.category ?? item?.age_group ?? item?.grupo;
          if (id != null && typeof cat === "string") map.set(String(id), cat);
        }
      } else if (json && typeof json === "object") {
        for (const [k, v] of Object.entries(json)) {
          if (typeof v === "string") map.set(String(k), v);
        }
      }
      if (map.size) return map;
    } catch {
      /* ignore parse error and try next key */
    }
  }
  return new Map();
}

function writeCategoriesToLS(farmId: string | number, pairs: Array<{ id: string; cat: string }>) {
  if (typeof window === "undefined" || !pairs.length) return;
  const current = readCategoriesFromLS(farmId);
  for (const { id, cat } of pairs) {
    if (cat && id) current.set(id, cat);
  }
  const obj: Record<string, string> = {};
  current.forEach((v, k) => (obj[k] = v));
  window.localStorage.setItem(lsKey(farmId), JSON.stringify(obj));
}

/* ================== Tipos ================== */
type MeansByCategory = Record<string, Record<string, number | null>>;

/* ================== Componente ================== */
export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [sourceTable, setSourceTable] = useState<string>("");
  const [categoryCol, setCategoryCol] = useState<string>("");
  const [idCol, setIdCol] = useState<string>("");
  const [usedLocalStorage, setUsedLocalStorage] = useState(false);
  const [lsAppliedCount, setLsAppliedCount] = useState(0);

  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  /* -------- fetch com fallback rebanho → females_denorm → ... + LS -------- */
  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRows([]); setCategories([]); setSourceTable(""); setCategoryCol(""); setIdCol("");
      setUsedLocalStorage(false); setLsAppliedCount(0);
      return;
    }
    setLoading(true);

    let gotRows: any[] = [];
    let usedTable = "";
    let catKey: string | null = null;
    let idKey: string | null = null;

    // tenta cada tabela
    for (const table of TABLE_CANDIDATES) {
      let res: any = { data: [], error: null };
      for (const fcol of FARM_COLS) {
        res = await supabase.from(table).select("*").eq(fcol as any, farmId).limit(100000);
        if (!res.error && Array.isArray(res.data) && res.data.length > 0) break;
      }
      if ((!res.data || res.data.length === 0) && !res.error) {
        res = await supabase.from(table).select("*").limit(20000);
      }
      if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
        const candidateRows = res.data.filter((r: any) => r && typeof r === "object");
        const candidateCat = detectCategoryColumn(candidateRows);
        const candidateId = detectIdColumn(candidateRows);
        if (candidateCat || candidateId) {
          gotRows = candidateRows;
          usedTable = table;
          catKey = candidateCat;
          idKey = candidateId;
          break;
        }
      }
    }

    // Tenta preencher categoria via LocalStorage se veio nula/ausente
    let appliedFromLS = 0;
    if (!catKey || !gotRows.some((r) => r?.[catKey!])) {
      const map = readCategoriesFromLS(farmId);
      if (map.size && idKey) {
        gotRows = gotRows.map((r) => {
          const idVal = r?.[idKey!];
          const fromLs = idVal != null ? map.get(String(idVal)) : undefined;
          if (fromLs && !r.__category) {
            appliedFromLS++;
            return { ...r, __category: fromLs };
          }
          return r;
        });
        if (appliedFromLS > 0) {
          catKey = "__category";
          setUsedLocalStorage(true);
          setLsAppliedCount(appliedFromLS);
        } else {
          setUsedLocalStorage(false);
          setLsAppliedCount(0);
        }
      } else {
        setUsedLocalStorage(false);
        setLsAppliedCount(0);
      }
    } else {
      setUsedLocalStorage(false);
      setLsAppliedCount(0);
    }

    setSourceTable(usedTable);
    setRows(gotRows);
    setCategoryCol(catKey || "");
    setIdCol(idKey || "");

    // Se conseguimos categoria via banco + temos ID, persistimos no LS
    if (catKey && catKey !== "__category" && idKey) {
      const pairs: Array<{ id: string; cat: string }> = [];
      for (const r of gotRows) {
        const cid = r?.[idKey];
        const ccat = r?.[catKey];
        if (cid != null && typeof ccat === "string" && ccat.trim()) {
          pairs.push({ id: String(cid), cat: ccat });
        }
      }
      if (pairs.length) writeCategoriesToLS(farmId, pairs);
    }

    // categorias distintas
    const cats =
      catKey && gotRows.length
        ? Array.from(
            new Set(
              gotRows
                .map((r) => r?.[catKey!])
                .filter((c: any) => typeof c === "string" && c.trim().length > 0)
            )
          )
        : [];

    const ordered = [
      ...AGE_VALUES.filter((c) => cats.includes(c)),
      ...cats.filter((c) => !AGE_VALUES.includes(c as any)),
    ];
    setCategories(ordered);

    if (!ordered.includes(groupA) || !ordered.includes(groupB)) {
      setGroupA(ordered[0] || "Grupo A");
      setGroupB(ordered[1] || ordered[0] || "Grupo B");
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  /* -------- dados para tabela e radar -------- */
  const view = useMemo(() => {
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const presentPTAs = ALL_PTA_KEYS.filter((k) =>
      Object.values(meansByCategory).some((m) => m && m[k] != null)
    );

    const tTraits = tableTraits.filter((k) => presentPTAs.includes(k));
    const cTraits = chartTraits.filter((k) => presentPTAs.includes(k));

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tTraits.map((k) => [k, A[k] ?? null])) },
        { label: groupB, ...Object.fromEntries(tTraits.map((k) => [k, B[k] ?? null])) },
        {
          label: "Change",
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

    return { table, radar, presentPTAs };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits]);

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
          const enabled = view.presentPTAs.includes(key);
          return (
            <Badge
              key={key}
              variant={on ? "default" : "outline"}
              className={`cursor-pointer ${enabled ? "" : "opacity-40 pointer-events-none"}`}
              onClick={() =>
                enabled &&
                setSource((prev) => (on ? prev.filter((t) => t !== key) : [...prev, key]))
              }
            >
              {label}
            </Badge>
          );
        })}
    </div>
  );

  /* -------- Render -------- */
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação por Categoria (Step 6)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* DEBUG: fonte/coluna/contagem/PTAs detectadas e LS */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Fonte: <b>{sourceTable || "—"}</b></span>
          <span>Categoria: <b>{categoryCol || "—"}</b></span>
          <span>ID: <b>{idCol || "—"}</b></span>
          <span>Registros: <b>{rows.length}</b></span>
          <span>LocalStorage: <b>{usedLocalStorage ? `sim (${lsAppliedCount} aplicados)` : "não"}</b></span>
          <span>
            PTAs com dados:&nbsp;
            <b>
              {view.presentPTAs.length
                ? view.presentPTAs.map((k) => PTA_LABELS[k] ?? k).join(", ")
                : "—"}
            </b>
          </span>
        </div>

        {/* Atalhos: Categoria A vs Categoria B */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Atalhos:</span>
          {categories.map((c) => (
            <Badge
              key={`ga-${c}`}
              variant={groupA === c ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setGroupA(c)}
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
              onClick={() => setGroupB(c)}
            >
              {c}
            </Badge>
          ))}
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
            Sem dados com categoria (nem em LocalStorage) nas tabelas {TABLE_CANDIDATES.join(", ")}.
          </div>
        )}

        {!loading && rows.length > 0 && categoryCol && (
          <div className="space-y-8">
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">Group</th>
                    {tableTraits
                      .filter((k) => view.presentPTAs.includes(k))
                      .map((t) => (
                        <th key={`th-${t}`} className="py-2 px-2 text-left font-semibold">
                          {(PTA_LABELS[t] ?? t).toUpperCase()}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {view.table.rows.map((r: any, idx: number) => (
                    <tr
                      key={`row-${idx}-${r.label}`}
                      className={`border-b ${idx === 2 ? "bg-muted/30" : ""}`}
                    >
                      <td className="py-2 px-2 font-medium">{r.label}</td>
                      {tableTraits
                        .filter((k) => view.presentPTAs.includes(k))
                        .map((t) => {
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
