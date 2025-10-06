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
  "order_of_calving",
  "ordemparto",
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
  const byName = detectColumn(keys, CATEGORY_NAME_CANDIDATES);
  if (byName) return byName;
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
  const idLike = keys.find((k) => norm(k) === "id");
  return idLike || null;
}

/* ================== LocalStorage helpers ================== */
const prefKey = (farmId: string | number) => `ag:rebanho:categories:${farmId}`;
const knownKeys = (farmId: string | number) => [
  prefKey(farmId),
  `rebanho:categorias:${farmId}`,
  `categories_rebanho_${farmId}`,
  `female_categories_${farmId}`,
  `ag:rebanho:list:${farmId}`,
  `ag:females:list:${farmId}`,
];

type LSScanResult = {
  map: Map<string, string>;
  keysScanned: number;
  pairsFound: number;
};

function scanLocalStorageForCategories(
  farmId: string | number,
  idCols: string[],
  catCols: string[]
): LSScanResult {
  const res: LSScanResult = { map: new Map(), keysScanned: 0, pairsFound: 0 };
  if (typeof window === "undefined") return res;

  const candidates = new Set<string>(knownKeys(farmId));
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k) candidates.add(k);
  }

  const idNorms = idCols.map(norm);
  const catNorms = catCols.map(norm);
  const knownCats = new Set(AGE_VALUES.map(norm));

  for (const key of candidates) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    res.keysScanned++;

    try {
      const data = JSON.parse(raw);

      if (data && typeof data === "object" && !Array.isArray(data)) {
        for (const [k, v] of Object.entries<any>(data)) {
          if (typeof v === "string" && (knownCats.has(norm(v)) || catNorms.includes(norm(v)))) {
            res.map.set(String(k), v);
            res.pairsFound++;
          }
        }
      }

      if (Array.isArray(data)) {
        for (const item of data) {
          if (!item || typeof item !== "object") continue;
          const idKey = Object.keys(item).find((c) => idNorms.includes(norm(c)));
          const catKey = Object.keys(item).find((c) => catNorms.includes(norm(c))) ??
            Object.keys(item).find((c) => knownCats.has(norm(item[c])));
          const idVal = idKey ? item[idKey] : undefined;
          const catVal = catKey ? item[catKey] : undefined;
          if (idVal != null && typeof catVal === "string" && String(catVal).trim()) {
            res.map.set(String(idVal), String(catVal));
            res.pairsFound++;
          }
        }
      }

      if (data && typeof data === "object" && Array.isArray((data as any).rows)) {
        for (const item of (data as any).rows) {
          if (!item || typeof item !== "object") continue;
          const idKey = Object.keys(item).find((c) => idNorms.includes(norm(c)));
          const catKey = Object.keys(item).find((c) => catNorms.includes(norm(c))) ??
            Object.keys(item).find((c) => knownCats.has(norm(item[c])));
          const idVal = idKey ? item[idKey] : undefined;
          const catVal = catKey ? item[catKey] : undefined;
          if (idVal != null && typeof catVal === "string" && String(catVal).trim()) {
            res.map.set(String(idVal), String(catVal));
            res.pairsFound++;
          }
        }
      }
    } catch { /* ignore */ }
  }

  return res;
}

function writeCategoriesToLS(farmId: string | number, pairs: Array<{ id: string; cat: string }>) {
  if (typeof window === "undefined" || !pairs.length) return;
  const current = scanLocalStorageForCategories(farmId, [], []).map;
  for (const { id, cat } of pairs) current.set(id, cat);
  const obj: Record<string, string> = {};
  current.forEach((v, k) => (obj[k] = v));
  window.localStorage.setItem(prefKey(farmId), JSON.stringify(obj));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Tooltip do radar exibindo os valores BRUTOS (não normalizados)
function RadarTooltip(props: any) {
  const { active, payload, label, groupA, groupB } = props;
  if (!active || !payload?.length) return null;
  const p = payload.find((pp: any) => pp.dataKey === "Group A")?.payload;
  return (
    <div className="rounded border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="font-medium mb-1">{label}</div>
      <div>{groupA}: {p?.rawA == null ? "-" : Number(p.rawA).toFixed(2)}</div>
      <div>{groupB}: {p?.rawB == null ? "-" : Number(p.rawB).toFixed(2)}</div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
  const [lsKeysScanned, setLsKeysScanned] = useState(0);
  const [lsPairsApplied, setLsPairsApplied] = useState(0);

  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRows([]); setCategories([]); setSourceTable(""); setCategoryCol(""); setIdCol("");
      setUsedLocalStorage(false); setLsKeysScanned(0); setLsPairsApplied(0);
      return;
    }
    setLoading(true);

    let gotRows: any[] = [];
    let usedTable = "";
    let catKey: string | null = null;
    let idKey: string | null = null;

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
        gotRows = candidateRows;
        usedTable = table;
        catKey = candidateCat;
        idKey = candidateId;
        break;
      }
    }

    let applied = 0, scanned = 0;
    if (!catKey || !gotRows.some((r) => r?.[catKey!])) {
      const { map, keysScanned } = scanLocalStorageForCategories(
        farmId,
        idKey ? [idKey] : ID_CANDIDATES,
        CATEGORY_NAME_CANDIDATES
      );
      scanned = keysScanned;
      if (map.size && (idKey || ID_CANDIDATES.length)) {
        const idCandidates = idKey ? [idKey] : ID_CANDIDATES;
        gotRows = gotRows.map((r) => {
          const foundIdKey = idCandidates.find((c) => norm(c) in Object.fromEntries(Object.keys(r).map(k => [norm(k), k])));
          const realIdKey = foundIdKey
            ? Object.keys(r).find((k) => norm(k) === norm(foundIdKey))!
            : idKey || "id";
          const idVal = r?.[realIdKey];
          const fromLs = idVal != null ? map.get(String(idVal)) : undefined;
          if (fromLs) {
            applied++;
            return { ...r, __category: fromLs };
          }
          return r;
        });
        if (applied > 0) {
          catKey = "__category";
          setUsedLocalStorage(true);
          setLsKeysScanned(scanned);
          setLsPairsApplied(applied);
        } else {
          setUsedLocalStorage(false);
          setLsKeysScanned(scanned);
          setLsPairsApplied(0);
        }
      } else {
        setUsedLocalStorage(false);
        setLsKeysScanned(scanned);
        setLsPairsApplied(0);
      }
    } else {
      setUsedLocalStorage(false);
      setLsKeysScanned(0);
      setLsPairsApplied(0);
    }

    if ((!catKey || !gotRows.some((r) => r?.[catKey!])) && gotRows.length) {
      const keys = Object.keys(gotRows[0]);
      const parityKey =
        detectColumn(keys, ["parity", "paridade", "ordemparto", "order_of_calving"]) ||
        keys.find((k) => norm(k).includes("parit") || norm(k).includes("ordem"));
      if (parityKey) {
        gotRows = gotRows.map((r) => {
          const p = Number(r?.[parityKey]);
          let cat: string | null = null;
          if (Number.isFinite(p)) {
            if (p >= 3) cat = "Multípara";
            else if (p === 2) cat = "Secundípara";
            else if (p === 1) cat = "Primípara";
            else cat = "Novilha";
          }
          return cat ? { ...r, __category: cat } : r;
        });
        if (gotRows.some((r) => r?.__category)) catKey = "__category";
      }
    }

    setSourceTable(usedTable);
    setRows(gotRows);
    setCategoryCol(catKey || "");
    setIdCol(idKey || "");

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
  }, [farmId]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  /* ------------------- Tabela + Radar normalizado ------------------- */
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

    // ---------- Normalização 0–100 por eixo ----------
    const radar = cTraits.map((k) => {
      const a = A[k] ?? 0;
      const b = B[k] ?? 0;
      const maxK = Math.max(1, Math.abs(a), Math.abs(b));
      const toPct = (v: number) => (Math.abs(v) / maxK) * 100;

      return {
        trait: (PTA_LABELS[k] ?? k).toUpperCase(),
        band25: 25,
        band50: 50,
        band75: 75,
        band100: 100,
        "Group A": toPct(a),
        "Group B": toPct(b),
        rawA: A[k] ?? null,
        rawB: B[k] ?? null,
      };
    });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação por Categoria (Step 6)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* DEBUG */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Fonte: <b>{sourceTable || "—"}</b></span>
          <span>Categoria: <b>{categoryCol || "—"}</b></span>
          <span>ID: <b>{idCol || "—"}</b></span>
          <span>Registros: <b>{rows.length}</b></span>
          <span>
            LocalStorage: <b>{usedLocalStorage ? `sim (${lsPairsApplied} / ${lsKeysScanned})` : "não"}</b>
          </span>
          <span>
            PTAs com dados:&nbsp;
            <b>
              {view.presentPTAs.length
                ? view.presentPTAs.map((k) => PTA_LABELS[k] ?? k).join(", ")
                : "—"}
            </b>
          </span>
        </div>

        {/* Atalhos: A vs B */}
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

        {loading && <div className="py-6 text-center text-muted-foreground">Carregando dados…</div>}

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
                    <tr key={`row-${idx}-${r.label}`} className={`border-b ${idx === 2 ? "bg-muted/30" : ""}`}>
                      <td className="py-2 px-2 font-medium">{r.label}</td>
                      {tableTraits
                        .filter((k) => view.presentPTAs.includes(k))
                        .map((t) => {
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

            {/* Radar normalizado */}
            {view.radar.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Rate of Change</h4>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={view.radar} startAngle={90} endAngle={-270}>
                    <PolarGrid gridType="circle" />
                    <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

                    {/* FAIXAS 100/75/50/25 */}
                    <Radar dataKey="band100" stroke={false} fill="hsl(var(--muted-foreground))" fillOpacity={0.16} isAnimationActive={false} />
                    <Radar dataKey="band75"  stroke={false} fill="hsl(var(--muted-foreground))" fillOpacity={0.12} isAnimationActive={false} />
                    <Radar dataKey="band50"  stroke={false} fill="hsl(var(--muted-foreground))" fillOpacity={0.09} isAnimationActive={false} />
                    <Radar dataKey="band25"  stroke={false} fill="hsl(var(--muted-foreground))" fillOpacity={0.06} isAnimationActive={false} />

                    <Radar
                      name={groupA}
                      dataKey="Group A"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.22}
                    />
                    <Radar
                      name={groupB}
                      dataKey="Group B"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={3}
                      strokeDasharray="6 6"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.14}
                    />

                    <Legend />
                    <Tooltip content={(props) => <RadarTooltip {...props} groupA={groupA} groupB={groupB} />} />
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

