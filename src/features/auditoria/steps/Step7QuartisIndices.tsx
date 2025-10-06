"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAGFilters } from "../store";

const DEFAULT_TRAITS = ["ptam", "ptaf", "ptap"] as const;

interface Row {
  index_label: "IndexA" | "IndexB";
  group_label: "Top25" | "Bottom25";
  trait_key: string;
  mean_value: number;
  n: number;
}

export default function Step7QuartisIndices() {
  const { farmId } = useAGFilters();
  const [indexA, setIndexA] = useState("hhp_dollar");
  const [indexB, setIndexB] = useState("nm_dollar");
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([...DEFAULT_TRAITS]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

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
      setTraits((current) => {
        const sanitized = current.filter((trait) => cols.includes(trait));
        if (sanitized.length) {
          const unchanged =
            sanitized.length === current.length &&
            sanitized.every((trait, index) => trait === current[index]);
          return unchanged ? current : sanitized;
        }
        const defaults = DEFAULT_TRAITS.filter((trait) => cols.includes(trait));
        if (defaults.length) {
          return defaults;
        }
        if (cols.length === 0) {
          return [];
        }
        const fallbackSize = Math.min(DEFAULT_TRAITS.length, cols.length);
        return cols.slice(0, fallbackSize);
      });
    }
    loadColumns();
    return () => {
      active = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!farmId || traits.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("ag_quartis_indices_compare", {
      p_farm: farmId,
      p_index_a: indexA,
      p_index_b: indexB,
      p_traits: traits,
    });
    if (error) {
      console.error("Failed to load quartis indices", error);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(Array.isArray(data) ? (data as Row[]) : []);
    setLoading(false);
  }, [farmId, indexA, indexB, traits]);

  useEffect(() => {
    load();
  }, [load]);

  const badges = useMemo(() => {
    return ptaOptions
      .map((key) => ({ key, label: key.toUpperCase() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ptaOptions]);

  const COLORS = ["#666", "#888", "#aaa", "#ccc", "#ddd", "#eee"];

  const pieDataA = useMemo(() => {
    const topRows = rows.filter((r) => r.index_label === "IndexA" && r.group_label === "Top25");
    const total = topRows.reduce((sum, r) => sum + Math.abs(r.mean_value), 0);
    return topRows.map((r) => ({
      name: r.trait_key.toUpperCase(),
      value: Math.abs(r.mean_value),
      percentage: total > 0 ? (Math.abs(r.mean_value) / total) * 100 : 0,
    }));
  }, [rows]);

  const pieDataB = useMemo(() => {
    const topRows = rows.filter((r) => r.index_label === "IndexB" && r.group_label === "Top25");
    const total = topRows.reduce((sum, r) => sum + Math.abs(r.mean_value), 0);
    return topRows.map((r) => ({
      name: r.trait_key.toUpperCase(),
      value: Math.abs(r.mean_value),
      percentage: total > 0 ? (Math.abs(r.mean_value) / total) * 100 : 0,
    }));
  }, [rows]);

  const tableDataByIndex = useMemo(() => {
    const groups = ["Top25", "Bottom25", "Difference"] as const;
    const indexMap = new Map<string, any>();

    ["IndexA", "IndexB"].forEach((idx) => {
      const indexRows = rows.filter((r) => r.index_label === idx);
      const groupData = groups.map((group) => {
        const groupRows = indexRows.filter((r) => r.group_label === group);
        const result: any = { index: idx, group };
        groupRows.forEach((r) => {
          result[r.trait_key] = r.mean_value;
        });
        return result;
      });
      indexMap.set(idx, groupData);
    });

    const diffData: any = { index: "Difference", group: "Difference" };
    const top25A = rows.filter((r) => r.index_label === "IndexA" && r.group_label === "Top25");
    const top25B = rows.filter((r) => r.index_label === "IndexB" && r.group_label === "Top25");
    
    traits.forEach((t) => {
      const valA = top25A.find((r) => r.trait_key === t)?.mean_value || 0;
      const valB = top25B.find((r) => r.trait_key === t)?.mean_value || 0;
      diffData[t] = valA - valB;
    });

    return [...(indexMap.get("IndexA") || []), ...(indexMap.get("IndexB") || []), diffData];
  }, [rows, traits]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-56"
            value={indexA}
            onChange={(event) => setIndexA(event.target.value)}
            placeholder="Índice A (ex.: hhp_dollar)"
          />
          <Input
            className="w-56"
            value={indexB}
            onChange={(event) => setIndexB(event.target.value)}
            placeholder="Índice B (ex.: nm_dollar)"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
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
                    <th className="py-2 px-2 text-left font-semibold">Index</th>
                    <th className="py-2 px-2 text-left font-semibold">Group</th>
                    {traits.map((t) => (
                      <th key={t} className="py-2 px-2 text-left font-semibold">
                        {t.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableDataByIndex.map((row, idx) => (
                    <tr
                      key={`${row.index}-${row.group}-${idx}`}
                      className={`border-b ${
                        row.index === "Difference" ? "bg-muted/30 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2 px-2">{row.index === "IndexA" ? indexA.toUpperCase() : row.index === "IndexB" ? indexB.toUpperCase() : row.index}</td>
                      <td className="py-2 px-2">{row.group}</td>
                      {traits.map((t) => {
                        const val = row[t] as number | undefined;
                        const isPositive = val && val > 0;
                        const isDiff = row.index === "Difference";
                        return (
                          <td
                            key={t}
                            className={`py-2 px-2 ${
                              isDiff && isPositive ? "text-green-600" : ""
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

            <div className="grid md:grid-cols-2 gap-6">
              {pieDataA.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-center">{indexA.toUpperCase()}</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieDataA}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${Number(entry.percentage).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieDataA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {pieDataB.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-center">{indexB.toUpperCase()}</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieDataB}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${Number(entry.percentage).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieDataB.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
