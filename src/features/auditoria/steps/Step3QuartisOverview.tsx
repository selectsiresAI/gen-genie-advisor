"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Grupo</th>
                <th className="py-2">PTA</th>
                <th className="py-2">Média</th>
                <th className="py-2">N</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.group_label}-${row.trait_key}-${i}`} className="border-b">
                  <td className="py-2">{row.group_label}</td>
                  <td className="py-2">{row.trait_key.toUpperCase()}</td>
                  <td className="py-2">{Math.round(row.mean_value)}</td>
                  <td className="py-2">{row.n}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    {loading ? "Carregando dados..." : "Sem dados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
