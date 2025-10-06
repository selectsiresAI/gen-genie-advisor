"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { useAGFilters } from "../store";
import { PTA_CATALOG } from "@/lib/pta";

type BenchmarkRow = {
  trait_key: string;
  farm_value: number | null;
  benchmark_top: number | null;
  benchmark_avg: number | null;
};

type Region = "BR" | "EUA";
/** Mantemos como string para não conflitar com <Select> do shadcn */
type TopPercent = "1" | "5" | "10";

const DEFAULT_TRAITS: string[] = ["tpi", "nm_dollar", "hhp_dollar"];

export default function Step8Benchmark() {
  const { farmId } = useAGFilters();
  const [region, setRegion] = useState<Region>("BR");
  const [topPct, setTopPct] = useState<TopPercent>("5");
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(DEFAULT_TRAITS);
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Carrega colunas PTA disponíveis
  useEffect(() => {
    let active = true;
    (async () => {
      setErr(null);
      const { data, error } = await (supabase.rpc as any)("ag_list_pta_columns");
      if (!active) return;
      if (error) {
        console.error("ag_list_pta_columns error:", error);
        setErr("Falha ao carregar a lista de PTAs.");
        setPtaOptions([]);
        setTraits([]);
        return;
      }
      const columns: string[] = Array.isArray(data)
        ? data
            .map((item: { column_name?: unknown }) =>
              item && typeof (item as any).column_name === "string"
                ? String((item as any).column_name)
                : null
            )
            .filter((v): v is string => !!v)
        : [];

      setPtaOptions(columns);

      const defaults = DEFAULT_TRAITS.filter((k) => columns.includes(k));
      if (defaults.length > 0) {
        setTraits(defaults);
      } else if (columns.length > 0) {
        setTraits(columns.slice(0, Math.min(3, columns.length)));
      } else {
        setTraits([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const catalogLabels = useMemo(
    () => new Map(PTA_CATALOG.map((i) => [i.key, i.label] as const)),
    []
  );

  const availableBadges = useMemo(() => {
    return ptaOptions
      .map((key) => ({
        key,
        label: catalogLabels.get(key) ?? key.toUpperCase(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [catalogLabels, ptaOptions]);

  const fetchData = useCallback(async () => {
    if (!farmId || traits.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    setErr(null);

    const { data, error } = await (supabase.rpc as any)("ag_genetic_benchmark", {
      p_farm: farmId,
      p_traits: traits,
      p_region: region,
      p_top: Number(topPct),
    });

    if (error) {
      console.error("ag_genetic_benchmark error:", error);
      setErr("Falha ao carregar o benchmark genético.");
      setRows([]);
      setLoading(false);
      return;
    }

    const parsed: BenchmarkRow[] = Array.isArray(data)
      ? data.map((entry: Record<string, unknown>) => ({
          trait_key: String(entry.trait_key ?? ""),
          farm_value:
            entry.farm_value == null ? null : Number(entry.farm_value),
          benchmark_top:
            entry.benchmark_top == null ? null : Number(entry.benchmark_top),
          benchmark_avg:
            entry.benchmark_avg == null ? null : Number(entry.benchmark_avg),
        }))
      : [];

    setRows(parsed);
    setLoading(false);
  }, [farmId, traits, region, topPct]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatNumber = (v: number | null) =>
    v == null ? "—" : Math.round(v).toLocaleString("pt-BR");

  const chartDataByTrait = useMemo(() => {
    return rows.map((row) => ({
      trait: catalogLabels.get(row.trait_key) ?? row.trait_key.toUpperCase(),
      "Example Dairy": row.farm_value || 0,
      [`${region} Top ${topPct}%`]: row.benchmark_top || 0,
      [`${region} Breed Average`]: row.benchmark_avg || 0,
    }));
  }, [rows, catalogLabels, region, topPct]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genetic Benchmark</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Região:</span>
            <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BR">Brasil</SelectItem>
                <SelectItem value="EUA">EUA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Top %:</span>
            <Select value={topPct} onValueChange={(v) => setTopPct(v as TopPercent)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Top %" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">Top 10%</SelectItem>
                <SelectItem value="5">Top 5%</SelectItem>
                <SelectItem value="1">Top 1%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableBadges.length > 0 ? (
            availableBadges.map(({ key, label }) => {
              const active = traits.includes(key);
              return (
                <Badge
                  key={key}
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() =>
                    setTraits((prev) =>
                      active ? prev.filter((t) => t !== key) : [...prev, key]
                    )
                  }
                >
                  {label}
                </Badge>
              );
            })
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhuma PTA disponível.
            </span>
          )}
        </div>

        {err && (
          <div className="text-sm text-red-600">
            {err} Tente "Atualizar" ou revise permissões do Supabase.
          </div>
        )}

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>
        )}

        {!loading && rows.length === 0 && !err && (
          <div className="py-6 text-center text-muted-foreground">Nenhum resultado.</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="grid gap-6">
            {chartDataByTrait.map((data, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-semibold mb-2">{data.trait}</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[data]} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="trait" hide />
                    <YAxis type="number" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Example Dairy" fill="hsl(var(--muted))" />
                    <Bar dataKey={`${region} Top ${topPct}%`} fill="hsl(var(--muted-foreground))" />
                    <Bar dataKey={`${region} Breed Average`} fill="hsl(var(--foreground))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
