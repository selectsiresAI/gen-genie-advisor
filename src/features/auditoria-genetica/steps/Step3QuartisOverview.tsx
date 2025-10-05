"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Customized,
} from "recharts";
import { useAGFilters } from "../store";
import { PTA_CATALOG } from "../ptas";

const INDEX_OPTS = ["hhp_dollar", "nm_dollar", "tpi"] as const;
const DEFAULT_TRAITS = ["ptam", "ptaf", "ptap", "dpr", "pl", "scs"] as const;

type IndexKey = (typeof INDEX_OPTS)[number];

interface QuartileRow {
  group_label: "Top25" | "Bottom25" | "Average";
  trait_key: string;
  mean_value: number | null;
  n: number | null;
}

interface BoxplotStats {
  trait_key: string;
  p0: number;
  p25: number;
  p50: number;
  p75: number;
  p100: number;
}

interface HistogramBin {
  bin_from: number;
  bin_to: number;
  bin_count: number;
}

const TRAIT_LABELS = PTA_CATALOG.reduce<Record<string, string>>((map, item) => {
  map[item.key] = item.label;
  return map;
}, {});

const ensureIndexKey = (value?: string | number): IndexKey => {
  if (typeof value === "string") {
    const match = INDEX_OPTS.find((option) => option === value);
    if (match) {
      return match;
    }
  }
  return "hhp_dollar";
};

export default function Step3QuartisOverview() {
  const { farmId, indiceBase, setIndiceBase, ptasSelecionadas } = useAGFilters();
  const [indexKey, setIndexKey] = useState<IndexKey>(() => ensureIndexKey(indiceBase));
  const [tableRows, setTableRows] = useState<QuartileRow[]>([]);
  const [boxData, setBoxData] = useState<BoxplotStats[]>([]);
  const [histData, setHistData] = useState<HistogramBin[]>([]);
  const [loading, setLoading] = useState(false);

  const traits = useMemo(
    () => (ptasSelecionadas.length ? [...ptasSelecionadas] : [...DEFAULT_TRAITS]),
    [ptasSelecionadas]
  );

  useEffect(() => {
    setIndexKey(ensureIndexKey(indiceBase));
  }, [indiceBase]);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      if (!farmId || !traits.length) {
        if (active) {
          setTableRows([]);
          setBoxData([]);
          setHistData([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const [{ data: quartisData, error: quartisError }] = await Promise.all([
          supabase.rpc("ag_quartis_overview", {
            p_farm: farmId,
            p_index_key: indexKey,
            p_traits: traits,
          }),
        ]);

        if (!active) {
          return;
        }

        if (quartisError) {
          console.error("Failed to load quartile overview", quartisError);
          setTableRows([]);
        } else {
          setTableRows(Array.isArray(quartisData) ? (quartisData as QuartileRow[]) : []);
        }

        const boxResults = await Promise.all(
          traits.map(async (trait) => {
            const { data, error } = await supabase.rpc("ag_boxplot_stats", {
              p_farm: farmId,
              p_trait: trait,
            });

            if (error) {
              console.error(`Failed to load boxplot stats for ${trait}`, error);
              return null;
            }

            const stats = Array.isArray(data) && data[0] ? data[0] : null;
            if (!stats) {
              return null;
            }

            return {
              trait_key: trait,
              p0: Number(stats.p0 ?? 0),
              p25: Number(stats.p25 ?? 0),
              p50: Number(stats.p50 ?? 0),
              p75: Number(stats.p75 ?? 0),
              p100: Number(stats.p100 ?? 0),
            } as BoxplotStats;
          })
        );

        if (!active) {
          return;
        }

        setBoxData(boxResults.filter(Boolean) as BoxplotStats[]);

        const { data: histDataRaw, error: histError } = await supabase.rpc(
          "ag_trait_histogram",
          {
            p_farm: farmId,
            p_trait: indexKey,
            p_bins: 20,
          }
        );

        if (!active) {
          return;
        }

        if (histError) {
          console.error("Failed to load histogram", histError);
          setHistData([]);
        } else {
          setHistData(Array.isArray(histDataRaw) ? (histDataRaw as HistogramBin[]) : []);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [farmId, indexKey, traits]);

  const histogramData = useMemo(
    () =>
      histData.map((bin) => ({
        x: `${bin.bin_from.toFixed(1)}–${bin.bin_to.toFixed(1)}`,
        count: bin.bin_count,
      })),
    [histData]
  );

  const handleIndexChange = (value: string) => {
    const newIndex = ensureIndexKey(value);
    setIndexKey(newIndex);
    setIndiceBase(newIndex);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Select value={indexKey} onValueChange={handleIndexChange}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Índice base" />
          </SelectTrigger>
          <SelectContent>
            {INDEX_OPTS.map((key) => (
              <SelectItem key={key} value={key}>
                {TRAIT_LABELS[key] ?? key.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quartis — Tabela</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Grupo</th>
                {traits.map((trait) => (
                  <th key={trait} className="p-2 text-right">
                    {TRAIT_LABELS[trait] ?? trait.toUpperCase()}
                  </th>
                ))}
                <th className="p-2 text-right">N</th>
              </tr>
            </thead>
            <tbody>
              {["Top25", "Bottom25", "Average"].map((group) => {
                const slice = tableRows.filter((row) => row.group_label === group);
                const byTrait: Record<string, number> = {};
                slice.forEach((row) => {
                  if (typeof row.mean_value === "number") {
                    byTrait[row.trait_key] = row.mean_value;
                  }
                });
                const count = slice[0]?.n ?? null;
                return (
                  <tr key={group} className={group !== "Average" ? "bg-muted/20" : ""}>
                    <td className="p-2 font-medium">{group}</td>
                    {traits.map((trait) => (
                      <td key={trait} className="p-2 text-right">
                        {byTrait[trait] != null ? byTrait[trait].toFixed(2) : "-"}
                      </td>
                    ))}
                    <td className="p-2 text-right">{count ?? "-"}</td>
                  </tr>
                );
              })}
              {!tableRows.length && (
                <tr>
                  <td
                    colSpan={traits.length + 2}
                    className="p-6 text-center text-muted-foreground"
                  >
                    {loading ? "Carregando dados..." : "Sem dados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boxplots — {TRAIT_LABELS[indexKey] ?? indexKey.toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={420}>
            <ComposedChart data={boxData} margin={{ left: 20, right: 20, top: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="trait_key"
                tickFormatter={(key) => TRAIT_LABELS[key as string] ?? String(key).toUpperCase()}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip formatter={(value: unknown) => Number(value ?? 0).toFixed(2)} />
              <Customized
                component={({ xAxisMap, yAxisMap, offset }: any) => {
                  const xKey = Object.keys(xAxisMap)[0];
                  const yKey = Object.keys(yAxisMap)[0];
                  const xMap = xAxisMap[xKey];
                  const yMap = yAxisMap[yKey];

                  return (
                    <g>
                      {boxData.map((entry, index) => {
                        const cx = xMap.scale(index) + xMap.bandwidth / 2 + offset.left;
                        const yMin = yMap.scale(entry.p100) + offset.top;
                        const yMax = yMap.scale(entry.p0) + offset.top;
                        const yQ1 = yMap.scale(entry.p25) + offset.top;
                        const yMed = yMap.scale(entry.p50) + offset.top;
                        const yQ3 = yMap.scale(entry.p75) + offset.top;
                        const boxWidth = Math.max(12, xMap.bandwidth * 0.5);

                        return (
                          <g key={entry.trait_key}>
                            <line x1={cx} x2={cx} y1={yQ3} y2={yMin} stroke="#333" />
                            <line x1={cx} x2={cx} y1={yQ1} y2={yMax} stroke="#333" />
                            <rect
                              x={cx - boxWidth / 2}
                              width={boxWidth}
                              y={Math.min(yQ1, yQ3)}
                              height={Math.abs(yQ3 - yQ1)}
                              fill="#bbb"
                              stroke="#333"
                            />
                            <line
                              x1={cx - boxWidth / 2}
                              x2={cx + boxWidth / 2}
                              y1={yMed}
                              y2={yMed}
                              stroke="#000"
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Distribuição — {TRAIT_LABELS[indexKey] ?? indexKey.toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#e11" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
