"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Índice</th>
                <th className="py-2">Grupo</th>
                <th className="py-2">PTA</th>
                <th className="py-2">Média</th>
                <th className="py-2">N</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.index_label}-${row.group_label}-${row.trait_key}-${index}`}
                  className="border-b"
                >
                  <td className="py-2">{row.index_label}</td>
                  <td className="py-2">{row.group_label}</td>
                  <td className="py-2">{row.trait_key.toUpperCase()}</td>
                  <td className="py-2">{Math.round(row.mean_value)}</td>
                  <td className="py-2">{row.n}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
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
