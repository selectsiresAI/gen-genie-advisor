"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

type Grouping = "age_group" | "coarse" | "category";

type RpcRow = {
  trait_key: string;
  group_label: string;      // <-- ajuste aqui se o RPC usa outro campo
  slope_per_year: number;   // <-- ajuste aqui se o RPC usa outro campo
  n_years: number;
};

type PairRow = {
  trait_key: string;
  group_a_label: string;
  group_b_label: string;
  group_a_mean: number | null;
  group_b_mean: number | null;
  delta: number | null;
};

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

const DEFAULT_TABLE_TRAITS = ["hhp_dollar", "ptam", "cfp", "fi", "pl", "scs", "mast"];
const DEFAULT_CHART_TRAITS = [
  "hhp_dollar","ptam","ptaf","ptap","fi","ccr","hcr","pl","liv","scs","ptat","udc",
];
const AGE_OPTIONS = ["Bezerra","Novilha","Primípara","Secundípara","Multípara"];

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();
  const [groupBy, setGroupBy] = useState<Grouping>("age_group");
  const [groupA, setGroupA] = useState<string>("Heifers");
  const [groupB, setGroupB] = useState<string>("Cows");

  const [availableTraits, setAvailableTraits] = useState<string[]>([]);
  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  const [rawRows, setRawRows] = useState<RpcRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Carrega colunas PTA (de female_denorm/female) via RPC
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await (supabase.rpc as any)("ag_list_pta_columns");
      if (!active) return;
      if (error) {
        console.error("Failed to list PTA columns", error);
        setAvailableTraits([]);
        return;
      }
      const cols = (Array.isArray(data) ? data : [])
        .map((d: any) => String(d.column_name))
        .filter((k) => PTA_LABELS[k as keyof typeof PTA_LABELS]);
      setAvailableTraits(cols);
    })();
    return () => { active = false; };
  }, []);

  // Busca slopes por trait/grupo
  const fetchData = useCallback(async () => {
    if (!farmId) { setRawRows([]); return; }
    setLoading(true);
    const traitsUnion = Array.from(new Set([...tableTraits, ...chartTraits]));
    const { data, error } = await (supabase.rpc as any)("ag_progress_compare", {
      p_farm: farmId,
      p_traits: traitsUnion,
      p_grouping: groupBy,
    });
    if (error) {
      console.error("Failed to load ag_progress_compare", error);
      setRawRows([]); setLoading(false); return;
    }
    const rows: RpcRow[] = (Array.isArray(data) ? data : []).map((r: any) => ({
      trait_key: String(r.trait_key),
      group_label: String(r.group_label), // <-- ajuste aqui se necessário
      slope_per_year: Number(r.slope_per_year ?? 0),
      n_years: Number(r.n_years ?? 0),
    }));
    setRawRows(rows);
    setLoading(false);
  }, [farmId, tableTraits, chartTraits, groupBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (groupBy === "coarse") { setGroupA("Heifers"); setGroupB("Cows"); }
    else if (groupBy === "age_group") { setGroupA("Novilha"); setGroupB("Multípara"); }
  }, [groupBy]);

  // Une Group A x Group B por trait
  const pairedRows: PairRow[] = useMemo(() => {
    if (!rawRows.length) return [];
    const groupCounts = rawRows.reduce<Record<string, number>>((acc, r) => {
      acc[r.group_label] = (acc[r.group_label] ?? 0) + 1; return acc;
    }, {});
    const sortedGroups = Object.keys(groupCounts).sort((a,b)=>(groupCounts[b]??0)-(groupCounts[a]??0));
    const aLabel = groupBy === "coarse" ? "Heifers" : groupA || sortedGroups[0] || "Grupo A";
    const bLabel = groupBy === "coarse" ? "Cows"    : groupB || sortedGroups[1] || "Grupo B";

    const byTrait = rawRows.reduce<Record<string, Record<string, number>>>((acc, r) => {
      if (!acc[r.trait_key]) acc[r.trait_key] = {};
      acc[r.trait_key][r.group_label] = r.slope_per_year;
      return acc;
    }, {});

    const order = Array.from(new Set([...tableTraits, ...chartTraits]));
    const pairs = Object.entries(byTrait).map(([trait_key, map]) => {
      const a = map[aLabel] ?? null;
      const b = map[bLabel] ?? null;
      const delta = a!=null && b!=null ? Number((a - b).toFixed(6)) : a ?? b ?? null;
      return { trait_key, group_a_label: aLabel, group_b_label: bLabel, group_a_mean: a, group_b_mean: b, delta };
    });
    pairs.sort((x,y)=>order.indexOf(x.trait_key)-order.indexOf(y.trait_key));
    return pairs;
  }, [rawRows, groupA, groupB, groupBy, tableTraits, chartTraits]);

  // Tabela
  const tableData = useMemo(() => {
    const filtered = pairedRows.filter((r) => tableTraits.includes(r.trait_key));
    if (!filtered.length) return null;
    const rowA: Record<string, any> = { label: filtered[0].group_a_label };
    const rowB: Record<string, any> = { label: filtered[0].group_b_label };
    const rowC: Record<string, any> = { label: "Change" };
    filtered.forEach((r) => { rowA[r.trait_key]=r.group_a_mean; rowB[r.trait_key]=r.group_b_mean; rowC[r.trait_key]=r.delta; });
    return { rows: [rowA, rowB, rowC] };
  }, [pairedRows, tableTraits]);

  // Radar
  const radarData = useMemo(() => {
    const filtered = pairedRows.filter((r) => chartTraits.includes(r.trait_key));
    if (!filtered.length) return [];
    return filtered.map((r) => ({
      trait: (PTA_LABELS[r.trait_key] ?? r.trait_key).toUpperCase(),
      "Group A": r.group_a_mean ?? 0,
      "Group B": r.group_b_mean ?? 0,
    }));
  }, [pairedRows, chartTraits]);

  const traitBadgesFor = (source: string[], setSource: (fn: any) => void) => {
    const opts = (availableTraits.length ? availableTraits : Object.keys(PTA_LABELS))
      .filter((k) => PTA_LABELS[k]);
    return (
      <div className="flex flex-wrap gap-2">
        {opts
          .map((key) => ({ key, label: PTA_LABELS[key] || key.toUpperCase() }))
          .sort((a,b)=>a.label.localeCompare(b.label))
          .map(({ key, label }) => {
            const on = source.includes(key);
            return (
              <Badge
                key={key}
                variant={on ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setSource((prev: string[]) => on ? prev.filter((t)=>t!==key) : [...prev, key])
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
        <CardTitle>Progresso — Comparação (Step 6)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros principais */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Agrupar por:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as Grouping)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="age_group">Grupos de idade</SelectItem>
                <SelectItem value="coarse">Novilhas x Vacas</SelectItem>
                <SelectItem value="category">Categoria (label)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grupo 1 e Grupo 2 (exceto coarse) */}
          {groupBy !== "coarse" && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Grupo 1:</span>
              <Input className="w-[180px]" value={groupA} onChange={(e) => setGroupA(e.target.value)} placeholder="Ex.: Novilha" />
              <span className="text-sm font-medium">Grupo 2:</span>
              <Input className="w-[180px]" value={groupB} onChange={(e) => setGroupB(e.target.value)} placeholder="Ex.: Multípara" />
            </div>
          )}
        </div>

        {/* Atalhos de idade */}
        {groupBy === "age_group" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Atalhos:</span>
            {AGE_OPTIONS.map((g) => (
              <Badge key={`ga-${g}`} variant={groupA===g?"default":"outline"} className="cursor-pointer" onClick={() => setGroupA(g)}>{g}</Badge>
            ))}
            <span className="mx-2">vs</span>
            {AGE_OPTIONS.map((g) => (
              <Badge key={`gb-${g}`} variant={groupB===g?"default":"outline"} className="cursor-pointer" onClick={() => setGroupB(g)}>{g}</Badge>
            ))}
          </div>
        )}

        {/* PTAs da Tabela */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Tabela:</div>
          {traitBadgesFor(tableTraits, setTableTraits)}
        </div>

        {/* PTAs do Gráfico */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">PTAs para Gráfico:</div>
          {traitBadgesFor(chartTraits, setChartTraits)}
        </div>

        {loading && <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>}
        {!loading && !pairedRows.length && <div className="py-6 text-center text-muted-foreground">Sem dados.</div>}

        {!loading && pairedRows.length > 0 && (
          <div className="space-y-8">
            {/* Tabela comparativa */}
            {tableData && tableData.rows?.length > 0 && (
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
                    {tableData.rows.map((r: any, idx: number) => (
                      <tr key={`row-${idx}-${r.label}`} className={`border-b ${idx===2?"bg-muted/30":""}`}>
                        <td className="py-2 px-2 font-medium">{r.label}</td>
                        {tableTraits.map((t) => {
                          const val = r[t] as number | null | undefined;
                          const isChange = idx === 2;
                          const isPositive = (val ?? 0) > 0;
                          return (
                            <td key={`td-${t}`} className={`py-2 px-2 ${isChange ? (isPositive ? "text-green-600" : "text-red-600") : ""}`}>
                              {val == null ? "-" : Number(val).toFixed(1)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Radar */}
            {radarData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Rate of Change</h4>
                <ResponsiveContainer width="100%" height={420}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" />
                    <PolarRadiusAxis />
                    <Radar
                      name={pairedRows[0].group_a_label}
                      dataKey="Group A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.28}
                    />
                    <Radar
                      name={pairedRows[0].group_b_label}
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
