"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useAGFilters } from "../store";

type GroupLabel = "Top25" | "Bottom25" | "TOP25" | "BOTTOM25" | "top25" | "bottom25";

interface RpcRow {
  group_label: GroupLabel | string;
  trait_key: string;
  mean_value: number | string | null;
  n: number | string | null;
}

interface Row {
  group_label: "Top25" | "Bottom25";
  trait_key: string;
  mean_value: number;
  n: number;
}

export default function Step3QuartisOverview() {
  const { farmId } = useAGFilters();
  const [baseIndex, setBaseIndex] = useState("hhp_dollar");
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(["ptam", "ptaf", "ptap", "dpr", "pl", "scs"]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase.rpc as any)("ag_list_pta_columns");
      if (!alive.current) return;
      if (error) {
        console.error("Failed to list PTA columns", error);
        setPtaOptions([]);
        return;
      }
      const cols: string[] = Array.isArray(data)
        ? data
            .map((item: any) => (item?.column_name ? String(item.column_name) : null))
            .filter(Boolean)
        : [];
      setPtaOptions(cols);
    })();
  }, []);

  const normalizeGroup = (g: RpcRow["group_label"]): Row["group_label"] => {
    const s = String(g || "").toLowerCase();
    return s.includes("top") ? "Top25" : "Bottom25";
  };

  const parseNum = (v: number | string | null | undefined, fallback = 0): number => {
    if (v === null || v === undefined) return fallback;
    if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  };

  const load = useCallback(async () => {
    if (!farmId || traits.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    setErrMsg(null);

    const { data, error } = await (supabase.rpc as any)("ag_quartis_overview", {
      p_farm: farmId,
      p_index: baseIndex,
      p_traits: traits,
    });

    if (!alive.current) return;

    if (error) {
      console.error("Failed to load quartiles overview", error);
      setRows([]);
      setErrMsg("Não foi possível carregar os dados (RPC ag_quartis_overview).");
      setLoading(false);
      return;
    }

    const parsed: Row[] = (Array.isArray(data) ? (data as RpcRow[]) : []).map((r, i) => ({
      group_label: normalizeGroup(r.group_label),
      trait_key: String(r.trait_key || `trait_${i}`),
      mean_value: parseNum(r.mean_value, 0),
      n: Math.max(0, Math.floor(parseNum(r.n, 0))),
    }));

    setRows(parsed);
    setLoading(false);
  }, [farmId, baseIndex, traits]);

  useEffect(() => {
    load();
  }, [load]);

  const badges = useMemo(() => {
    return ptaOptions
      .map((key) => ({ key, label: key.toUpperCase() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ptaOptions]);

  const tableData = useMemo(() => {
    const groups = ["Top25", "Bottom25", "Average"] as const;
    return groups.map((group) => {
      const groupRows = rows.filter((r) => r.group_label === group);
      const result: any = { group };
      groupRows.forEach((r) => {
        result[r.trait_key] = r.mean_value;
        result[`${r.trait_key}_n`] = r.n;
      });
      const counts = groupRows.map((r) => r.n);
      result.count = counts.length > 0 ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
      return result;
    });
  }, [rows]);

  const histogramData = useMemo(() => {
    const top25Rows = rows.filter((r) => r.group_label === "Top25");
    const bottom25Rows = rows.filter((r) => r.group_label === "Bottom25");
    
    if (top25Rows.length === 0 && bottom25Rows.length === 0) return [];

    const allValues = [...top25Rows, ...bottom25Rows].map((r) => r.mean_value);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const binCount = 20;
    const binSize = (max - min) / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: Math.round(min + i * binSize),
      count: 0,
    }));

    allValues.forEach((val) => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), binCount - 1);
      if (binIndex >= 0 && binIndex < bins.length) {
        bins[binIndex].count++;
      }
    });

    return bins;
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quartis — Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            className="w-56"
            value={baseIndex}
            onChange={(e) => setBaseIndex(e.target.value)}
            placeholder="Índice base (ex.: hhp_dollar)"
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
                className="cursor-pointer select-none"
                onClick={() =>
                  setTraits((prev) => (on ? prev.filter((t) => t !== key) : [...prev, key]))
                }
                title={on ? "Remover da análise" : "Adicionar à análise"}
              >
                {label}
              </Badge>
            );
          })}
          {badges.length === 0 && (
            <span className="text-sm text-muted-foreground">Nenhuma PTA disponível.</span>
          )}
        </div>

        {errMsg && <div className="text-sm text-destructive">{errMsg}</div>}

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-2 text-left font-semibold">Quartile</th>
                    <th className="py-2 px-2 text-left font-semibold">Count</th>
                    <th className="py-2 px-2 text-left font-semibold">{baseIndex.toUpperCase()}</th>
                    {traits.map((t) => (
                      <th key={t} className="py-2 px-2 text-left font-semibold">
                        {t.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr key={row.group} className="border-b">
                      <td className="py-2 px-2">{row.group}</td>
                      <td className="py-2 px-2">{row.count}</td>
                      <td className="py-2 px-2">{row[baseIndex] ? Math.round(row[baseIndex]) : "-"}</td>
                      {traits.map((t) => (
                        <td key={t} className="py-2 px-2">
                          {row[t] != null ? Math.round(row[t]) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {histogramData.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">{baseIndex.toUpperCase()} Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={histogramData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="range"
                      label={{ value: baseIndex.toUpperCase(), position: "insideBottom", offset: -5 }}
                    />
                    <YAxis label={{ value: "Count of Females", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--muted))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {!loading && rows.length === 0 && !errMsg && (
          <div className="py-6 text-center text-muted-foreground">Sem dados.</div>
        )}
      </CardContent>
    </Card>
  );
}
