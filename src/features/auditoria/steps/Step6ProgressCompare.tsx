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

/* ========= PTAs suportadas (adicione/ajuste aqui) ========= */
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

/* ========= Sinônimos (para quando colunas vierem com nomes diferentes) ========= */
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

/* ========= Constantes da UI ========= */
const DEFAULT_TABLE_TRAITS = ["hhp_dollar", "ptam", "cfp", "fi", "pl", "scs", "mast"];
const DEFAULT_CHART_TRAITS = [
  "hhp_dollar", "ptam", "ptaf", "ptap", "fi", "ccr", "hcr", "pl", "liv", "scs", "ptat", "udc",
];

const AGE_SHORTCUTS = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"] as const;

/* ========= Helpers ========= */
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
  const normMap: Record<string, any> = {};
  for (const k of Object.keys(row)) normMap[norm(k)] = row[k];
  const cands = PTA_SYNONYMS_NORM[canonical] || [norm(canonical)];
  for (const nk of cands) {
    if (nk in normMap) {
      const v = toNumber(normMap[nk]);
      if (v != null) return v;
    }
    if (nk.endsWith("dollar")) {
      const alt = nk.replace("dollar", "");
      if (alt in normMap) {
        const v2 = toNumber(normMap[alt]);
        if (v2 != null) return v2;
      }
    } else {
      const alt = nk + "dollar";
      if (alt in normMap) {
        const v3 = toNumber(normMap[alt]);
        if (v3 != null) return v3;
      }
    }
  }
  return null;
}

/* ========= Tipagem ========= */
type MeansByCategory = Record<string, Record<string, number | null>>;

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  /* =========================================================
     1) FETCH: exclusivamente da tabela REBANHO e coluna Categoria
     ========================================================= */
  const fetchRebanho = useCallback(async () => {
    if (!farmId) {
      setRows([]); setCategories([]); return;
    }
    setLoading(true);

    // Buscar tudo (evita erro quando schema varia)
    // Filtra por farm_id; fallback para id_fazenda.
    let q = await supabase.from("rebanho").select("*").eq("farm_id", farmId).limit(100000);
    if (!q.error && Array.isArray(q.data) && q.data.length === 0) {
      q = await supabase.from("rebanho").select("*").eq("id_fazenda", farmId).limit(100000);
    }

    if (q.error) {
      console.error("Erro ao buscar rebanho:", q.error);
      setRows([]); setCategories([]); setLoading(false);
      return;
    }

    const data = (q.data || []).filter((r: any) => r && typeof r === "object");

    // *** PONTO-CHAVE: usar exatamente a coluna "Categoria" ***
    const cats = Array.from(
      new Set(
        data
          .map((r: any) => r?.Categoria)
          .filter((c: any) => typeof c === "string" && c.trim().length > 0)
      )
    );

    // Ordena: atalhos primeiro, depois demais categorias
    const ordered = [
      ...AGE_SHORTCUTS.filter((c) => cats.includes(c)),
      ...cats.filter((c) => !AGE_SHORTCUTS.includes(c as any)),
    ];

    setRows(data);
    setCategories(ordered);

    // Ajusta grupos se defaults não existirem
    if (!ordered.includes(groupA) || !ordered.includes(groupB)) {
      setGroupA(ordered[0] || "Grupo A");
      setGroupB(ordered[1] || ordered[0] || "Grupo B");
    }

    setLoading(false);
  }, [farmId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRebanho(); }, [fetchRebanho]);

  /* =========================================================
     2) MÉDIAS por Categoria (usando rebanho.Categoria)
     ========================================================= */
  const meansByCategory: MeansByCategory = useMemo(() => {
    if (!rows.length) return {};
    const acc: Record<string, Record<string, { sum: number; n: number }>> = {};

    for (const r of rows) {
      const cat = (r?.Categoria as string) || "Sem categoria";
      if (!acc[cat]) acc[cat] = {};
      for (const key of ALL_PTA_KEYS) {
        const val = resolveTraitValue(r, key);
        if (val != null) {
          if (!acc[cat][key]) acc[cat][key] = { sum: 0, n: 0 };
          acc[cat][key].sum += val;
          acc[cat][key].n += 1;
        }
      }
    }

    const out: MeansByCategory = {};
    for (const [cat, map] of Object.entries(acc)) {
      out[cat] = {};
      for (const k of ALL_PTA_KEYS) {
        const s = map[k];
        out[cat][k] = s && s.n > 0 ? s.sum / s.n : null;
      }
    }
    return out;
  }, [rows]);

  /* =========================================================
     3) Dados para Tabela e Radar (Categoria A vs Categoria B)
     ========================================================= */
  const pair = useMemo(() => {
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const tTraits = tableTraits.slice();
    const cTraits = chartTraits.slice();

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tTraits.map((k) => [k, A[k] ?? null])) },
        { label: groupB, ...Object.fromEntries(tTraits.map((k) => [k, B[k] ?? null])) },
        {
          label: "Change",
          ...Object.fromEntries(
            tTraits.map((k) => {
              const a = A[k]; const b = B[k];
              return [k, a != null && b != null ? a - b : null];
            })
          ),
        },
      ],
    };

    const radar = cTraits.map((k) => ({
      trait: (PTA_LABELS[k] ?? k).toUpperCase(),
      "Group A": (A[k] ?? 0) as number,
      "Group B": (B[k] ?? 0) as number,
    }));

    return { table, radar };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits]);

  /* =========================================================
     4) UI
     ========================================================= */
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
          return (
            <Badge
              key={key}
              variant={on ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSource((prev) =>
                  on ? prev.filter((t) => t !== key) : [...prev, key]
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
        <CardTitle>Comparação por Categoria (Step 6) — fonte: rebanho.Categoria</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
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
          <span className="mx-2 uppercase tracking-wide text-xs text-muted-foreground">vs</span>
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

        {!loading && (!categories.length || !rows.length) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados em <span className="font-semibold">rebanho</span> para esta fazenda
            ou a coluna <span className="font-semibold">Categoria</span> não contém valores.
          </div>
        )}

        {!loading && categories.length > 0 && rows.length > 0 && (
          <div className="space-y-8">
            {/* Tabela comparativa */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">Group</th>
                    {tableTraits.map((t) => (
                      <th key={`th-${t}`} className="py-2 px-2 text-left font-semibold">
                        {(PTA_LABELS[t] ?? t).toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pair.table.rows.map((r: any, idx: number) => (
                    <tr key={`row-${idx}-${r.label}`} className={`border-b ${idx === 2 ? "bg-muted/30" : ""}`}>
                      <td className="py-2 px-2 font-medium">{r.label}</td>
                      {tableTraits.map((t) => {
                        const val = r[t] as number | null | undefined;
                        const isChange = idx === 2;
                        const isPositive = (val ?? 0) > 0;
                        return (
                          <td
                            key={`td-${t}`}
                            className={`py-2 px-2 ${isChange ? (isPositive ? "text-green-600" : "text-red-600") : ""}`}
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
            {pair.radar.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Rate of Change</h4>
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
