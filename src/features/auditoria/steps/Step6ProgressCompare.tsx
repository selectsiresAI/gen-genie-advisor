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

/** ---- Configuração de PTAs (adicione/ajuste conforme seu schema) ---- */
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

/** Defaults conforme as imagens */
const DEFAULT_TABLE_TRAITS = ["hhp_dollar", "ptam", "cfp", "fi", "pl", "scs", "mast"];
const DEFAULT_CHART_TRAITS = [
  "hhp_dollar", "ptam", "ptaf", "ptap", "fi", "ccr", "hcr", "pl", "liv", "scs", "ptat", "udc",
];
const AGE_SHORTCUTS = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"] as const;

type CatMeans = Record<string, Record<string, number | null>>; // categoria -> trait -> média

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [groupA, setGroupA] = useState<string>("Novilha");
  const [groupB, setGroupB] = useState<string>("Primípara");

  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  /** ------------------- Fetch direto em `rebanho` ------------------- */
  const fetchRebanho = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      return;
    }
    setLoading(true);

    // Tenta por farm_id; se vier vazio, tenta id_fazenda
    const selectCols = ["Categoria", ...ALL_PTA_KEYS].join(",");
    let { data, error } = await supabase
      .from("rebanho")
      .select(selectCols)
      .eq("farm_id", farmId)
      .limit(100000);

    if (!error && Array.isArray(data) && data.length === 0) {
      // fallback para id_fazenda
      const fb = await supabase
        .from("rebanho")
        .select(selectCols)
        .eq("id_fazenda", farmId)
        .limit(100000);
      data = fb.data as any[];
      error = fb.error as any;
    }

    if (error) {
      console.error("Erro ao buscar rebanho:", error);
      setRows([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    const sane = (data || []).filter((r: any) => r && typeof r === "object");
    setRows(sane);

    const cats = Array.from(
      new Set(
        sane
          .map((r: any) => r?.Categoria)
          .filter((c: any) => typeof c === "string" && c.trim().length > 0)
      )
    );

    // Garante ordem útil, mantendo primeiro os atalhos padrões
    const ordered = [
      ...AGE_SHORTCUTS.filter((c) => cats.includes(c)),
      ...cats.filter((c) => !AGE_SHORTCUTS.includes(c as any)),
    ];
    setCategories(ordered);

    // Se os defaults não existirem, escolhe as duas primeiras categorias disponíveis
    if (!ordered.includes(groupA) || !ordered.includes(groupB)) {
      setGroupA(ordered[0] || "Grupo A");
      setGroupB(ordered[1] || ordered[0] || "Grupo B");
    }

    setLoading(false);
  }, [farmId]); // eslint-disable-line

  useEffect(() => {
    fetchRebanho();
  }, [fetchRebanho]);

  /** -------------------- Médias por Categoria -------------------- */
  const meansByCategory: CatMeans = useMemo(() => {
    if (!rows.length) return {};
    const acc: Record<
      string,
      Record<string, { sum: number; n: number }>
    > = {};

    for (const r of rows) {
      const cat = (r?.Categoria as string) || "Sem categoria";
      if (!acc[cat]) acc[cat] = {};
      for (const key of ALL_PTA_KEYS) {
        const raw = r?.[key];
        const val = Number(raw);
        if (Number.isFinite(val)) {
          if (!acc[cat][key]) acc[cat][key] = { sum: 0, n: 0 };
          acc[cat][key].sum += val;
          acc[cat][key].n += 1;
        }
      }
    }

    const out: CatMeans = {};
    for (const [cat, map] of Object.entries(acc)) {
      out[cat] = {};
      for (const k of ALL_PTA_KEYS) {
        const s = map[k];
        out[cat][k] = s && s.n > 0 ? s.sum / s.n : null;
      }
    }
    return out;
  }, [rows]);

  /** --------------- Dados combinados para Tabela / Radar --------------- */
  const pair = useMemo(() => {
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const tableTraitsOrdered = tableTraits.slice();
    const chartTraitsOrdered = chartTraits.slice();

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tableTraitsOrdered.map((t) => [t, A[t] ?? null])) },
        { label: groupB, ...Object.fromEntries(tableTraitsOrdered.map((t) => [t, B[t] ?? null])) },
        {
          label: "Change",
          ...Object.fromEntries(
            tableTraitsOrdered.map((t) => {
              const a = A[t]; const b = B[t];
              const d = a != null && b != null ? a - b : null;
              return [t, d];
            })
          ),
        },
      ],
    };

    const radar = chartTraitsOrdered.map((t) => ({
      trait: (PTA_LABELS[t] ?? t).toUpperCase(),
      "Group A": (A[t] ?? 0) as number,
      "Group B": (B[t] ?? 0) as number,
    }));

    return { table, radar };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits]);

  /** --------------------------- UI helpers --------------------------- */
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
        <CardTitle>Comparação por Categoria (Step 6)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Atalhos de categoria (carregam dados) */}
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
          <div className="py-6 text-center text-muted-foreground">
            Carregando dados...
          </div>
        )}

        {!loading && (!categories.length || !rows.length) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados do rebanho para esta fazenda.
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
                    <tr
                      key={`row-${idx}-${r.label}`}
                      className={`border-b ${idx === 2 ? "bg-muted/30" : ""}`}
                    >
                      <td className="py-2 px-2 font-medium">{r.label}</td>
                      {tableTraits.map((t) => {
                        const val = r[t] as number | null | undefined;
                        const isChange = idx === 2;
                        const isPositive = (val ?? 0) > 0;
                        return (
                          <td
                            key={`td-${t}`}
                            className={`py-2 px-2 ${
                              isChange ? (isPositive ? "text-green-600" : "text-red-600") : ""
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

            {/* Radar “Rate of Change” (comparação direta) */}
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

