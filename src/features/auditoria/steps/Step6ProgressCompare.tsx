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
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { useAGFilters } from "../store";

type Grouping = "age_group" | "coarse" | "category";

interface Row {
  trait_key: string;
  group_label: string;
  slope_per_year: number;
  n_years: number;
}

interface RpcRow {
  trait_key: string;
  group_a_label: string;
  group_b_label: string;
  group_a_mean: number;
  group_b_mean: number;
  delta: number;
}

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();
  const [groupBy, setGroupBy] = useState<Grouping>("age_group");
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(["tpi", "nm_dollar", "hhp_dollar"]);
  const [rows, setRows] = useState<RpcRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupA, setGroupA] = useState("Heifers");
  const [groupB, setGroupB] = useState("Cows");

  useEffect(() => {
    let active = true;
    async function loadColumns() {
      const { data, error } = await (supabase.rpc as any)("ag_list_pta_columns");
      if (!active) return;
      if (error) {
        console.error("Failed to list PTA columns", error);
        setPtaOptions([]);
        return;
      }
      const cols = Array.isArray(data)
        ? data.map((item: { column_name?: string }) => String(item.column_name))
        : [];
      setPtaOptions(cols);
    }
    loadColumns();
    return () => {
      active = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!farmId || traits.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("ag_progress_compare", {
      p_farm: farmId,
      p_traits: traits,
      p_grouping: groupBy,
    });
    if (error) {
      console.error("Failed to load progress compare", error);
      setRows([]);
      setLoading(false);
      return;
    }
    
    const parsed = Array.isArray(data) ? (data as any[]) : [];
    const transformed: RpcRow[] = parsed.map((item) => ({
      trait_key: item.trait_key || "",
      group_a_label: item.group_label || "Group A",
      group_b_label: "Group B",
      group_a_mean: Number(item.slope_per_year) || 0,
      group_b_mean: 0,
      delta: Number(item.slope_per_year) || 0,
    }));
    
    if (transformed.length > 0) {
      setGroupA(transformed[0].group_a_label);
    }
    
    setRows(transformed);
    setLoading(false);
  }, [farmId, traits, groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const badges = useMemo(() => {
    return ptaOptions
      .map((key) => ({ key, label: key.toUpperCase() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ptaOptions]);

  const radarData = useMemo(() => {
    return rows.map((row) => ({
      trait: row.trait_key.toUpperCase(),
      "Group A": row.group_a_mean,
      "Group B": row.group_b_mean,
    }));
  }, [rows]);

  const tableData = useMemo(() => {
    if (rows.length === 0) return [];
    
    return [
      {
        label: groupA,
        ...rows.reduce((acc, row) => ({ ...acc, [row.trait_key]: row.group_a_mean }), {}),
      },
      {
        label: groupB,
        ...rows.reduce((acc, row) => ({ ...acc, [row.trait_key]: row.group_b_mean }), {}),
      },
      {
        label: "Change",
        ...rows.reduce((acc, row) => ({ ...acc, [row.trait_key]: row.delta }), {}),
      },
    ];
  }, [rows, groupA, groupB]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progresso — Comparação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as Grouping)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="age_group">Grupos de idade</SelectItem>
              <SelectItem value="coarse">Novilhas x Vacas</SelectItem>
              <SelectItem value="category">Categoria (label)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map(({ key, label }) => {
            const on = traits.includes(key);
            return (
              <Badge
                key={key}
                variant={on ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setTraits((prev) =>
                    on ? prev.filter((item) => item !== key) : [...prev, key]
                  )
                }
              >
                {label}
              </Badge>
            );
          })}
          {badges.length === 0 && (
            <span className="text-sm text-muted-foreground">Nenhuma PTA disponível.</span>
          )}
        </div>

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">Sem dados.</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">Group</th>
                    {rows.map((row) => (
                      <th key={row.trait_key} className="py-2 px-2 text-left font-semibold">
                        {row.trait_key.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={row.label} className={`border-b ${idx === 2 ? "bg-muted/30" : ""}`}>
                      <td className="py-2 px-2 font-medium">{row.label}</td>
                      {traits.map((t) => {
                        const val = row[t] as number | undefined;
                        const isChange = row.label === "Change";
                        const isPositive = val && val > 0;
                        return (
                          <td
                            key={t}
                            className={`py-2 px-2 ${
                              isChange && isPositive ? "text-green-600" : ""
                            }`}
                          >
                            {val != null ? Math.round(val) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {radarData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Rate of Change</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="trait" />
                    <PolarRadiusAxis />
                    <Radar
                      name="Group A"
                      dataKey="Group A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Group B"
                      dataKey="Group B"
                      stroke="hsl(var(--muted-foreground))"
                      fill="hsl(var(--muted-foreground))"
                      fillOpacity={0.3}
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
