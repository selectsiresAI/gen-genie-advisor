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
import { useAGFilters } from "../store";
import { PTA_CATALOG } from "../ptas";
import { PTAMultiSelect } from "../components/PTAMultiSelect";

type BenchmarkRow = {
  trait_key: string;
  farm_value: number | null;
  benchmark_top: number | null;
  benchmark_avg: number | null;
};

type Region = "BR" | "EUA";

type TopPercent = 1 | 5 | 10;

const DEFAULT_TRAITS: string[] = ["tpi", "nm_dollar", "hhp_dollar"];

export default function Step8Benchmark() {
  const { farmId } = useAGFilters();
  const [region, setRegion] = useState<Region>("BR");
  const [topPct, setTopPct] = useState<TopPercent>(5);
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(DEFAULT_TRAITS);
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadColumns() {
      const { data, error } = await supabase.rpc("ag_list_pta_columns");
      if (!active) return;
      if (error) {
        console.error("Failed to load PTA catalog", error);
        setPtaOptions([]);
        return;
      }
      const columns = Array.isArray(data)
        ? data.map((item: { column_name?: string }) => String(item.column_name))
        : [];
      setPtaOptions(columns);
      const defaults = DEFAULT_TRAITS.filter((key) => columns.includes(key));
      if (defaults.length) {
        setTraits(defaults);
      } else if (columns.length) {
        setTraits(columns.slice(0, Math.min(3, columns.length)));
      } else {
        setTraits([]);
      }
    }
    loadColumns();
    return () => {
      active = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!farmId || !traits.length) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("ag_genetic_benchmark", {
      p_farm: farmId,
      p_traits: traits,
      p_region: region,
      p_top: topPct,
    });
    if (error) {
      console.error("Failed to load benchmark data", error);
      setRows([]);
      setLoading(false);
      return;
    }
    const parsed: BenchmarkRow[] = Array.isArray(data)
      ? data.map((entry: Record<string, unknown>) => ({
          trait_key: String(entry.trait_key),
          farm_value:
            entry.farm_value === null || entry.farm_value === undefined
              ? null
              : Number(entry.farm_value),
          benchmark_top:
            entry.benchmark_top === null || entry.benchmark_top === undefined
              ? null
              : Number(entry.benchmark_top),
          benchmark_avg:
            entry.benchmark_avg === null || entry.benchmark_avg === undefined
              ? null
              : Number(entry.benchmark_avg),
        }))
      : [];
    setRows(parsed);
    setLoading(false);
  }, [farmId, traits, region, topPct]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const catalogLabels = useMemo(
    () => new Map(PTA_CATALOG.map((item) => [item.key, item.label])),
    []
  );

  const traitOptions = useMemo(() => {
    return ptaOptions
      .map((key) => ({
        value: key,
        label: catalogLabels.get(key) ?? key.toUpperCase(),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogLabels, ptaOptions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genetic Benchmark</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Região:</span>
            <Select
              value={region}
              onValueChange={(value) => setRegion(value as Region)}
            >
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
            <Select
              value={String(topPct)}
              onValueChange={(value) =>
                setTopPct(Number(value) as TopPercent)
              }
            >
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

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>

        <PTAMultiSelect
          options={traitOptions}
          value={traits}
          onChange={setTraits}
          placeholder={
            traitOptions.length
              ? "Selecione PTAs para o benchmark"
              : "Nenhuma PTA disponível"
          }
          disabled={traitOptions.length === 0}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">PTA / Índice</th>
                <th className="py-2">Fazenda</th>
                <th className="py-2">Top {topPct}% ({region})</th>
                <th className="py-2">Média ({region})</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.trait_key} className="border-b">
                  <td className="py-2 font-medium">
                    {catalogLabels.get(row.trait_key) ?? row.trait_key.toUpperCase()}
                  </td>
                  <td className="py-2">
                    {row.farm_value === null
                      ? "N/A"
                      : Math.round(row.farm_value)}
                  </td>
                  <td className="py-2">
                    {row.benchmark_top === null
                      ? "—"
                      : Math.round(row.benchmark_top)}
                  </td>
                  <td className="py-2">
                    {row.benchmark_avg === null
                      ? "—"
                      : Math.round(row.benchmark_avg)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {loading ? "Carregando dados..." : "Nenhum resultado."}
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
