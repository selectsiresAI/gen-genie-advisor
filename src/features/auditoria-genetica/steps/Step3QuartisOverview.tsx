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
  LabelList,
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

interface HistogramBin {
  bin_from: number;
  bin_to: number;
  bin_count: number;
}

interface BoxPlotPoint {
  trait_key: string;
  p0: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p100: number | null;
}

const TRAIT_LABELS = PTA_CATALOG.reduce<Record<string, string>>((map, item) => {
  map[item.key] = item.label;
  return map;
}, {});

const traitLabel = (key: string) => TRAIT_LABELS[key] ?? key.toUpperCase();

const CATEGORIA_LABELS: Record<string, string> = {
  bezerra: "Bezerra",
  novilha: "Novilha",
  primipara: "Primípara",
  secundipara: "Secundípara",
  multipara: "Multípara",
  todas: "Todas as fêmeas",
};

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
  const { farmId, indiceBase, setIndiceBase, ptasSelecionadas, categoria } = useAGFilters();
  const [indexKey, setIndexKey] = useState<IndexKey>(() => ensureIndexKey(indiceBase));
  const [tableRows, setTableRows] = useState<QuartileRow[]>([]);
  const [histData, setHistData] = useState<HistogramBin[]>([]);
  const [boxData, setBoxData] = useState<BoxPlotPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedTraits = useMemo(
    () => (ptasSelecionadas.length ? [...ptasSelecionadas] : [...DEFAULT_TRAITS]),
    [ptasSelecionadas]
  );

  const displayTraits = useMemo(() => {
    const traitsWithIndex = [indexKey, ...selectedTraits];
    return traitsWithIndex.filter((trait, position) => traitsWithIndex.indexOf(trait) === position);
  }, [indexKey, selectedTraits]);

  useEffect(() => {
    setIndexKey(ensureIndexKey(indiceBase));
  }, [indiceBase]);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      if (!farmId || !displayTraits.length) {
        if (active) {
          setTableRows([]);
          setHistData([]);
          setBoxData([]);
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
            p_traits: displayTraits,
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

        const boxResponses = await Promise.all(
          displayTraits.map(async (trait) => {
            const { data, error } = await supabase.rpc("ag_boxplot_stats", {
              p_farm: farmId,
              p_trait: trait,
            });

            if (error) {
              console.error(`Failed to load boxplot for ${trait}`, error);
              return null;
            }

            const point = Array.isArray(data) ? (data[0] as Partial<BoxPlotPoint> | undefined) : undefined;
            if (!point) {
              return null;
            }

            return {
              trait_key: trait,
              p0: point.p0 ?? null,
              p25: point.p25 ?? null,
              p50: point.p50 ?? null,
              p75: point.p75 ?? null,
              p100: point.p100 ?? null,
            } satisfies BoxPlotPoint;
          })
        );

        if (!active) {
          return;
        }

        setBoxData(boxResponses.filter(Boolean) as BoxPlotPoint[]);

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
  }, [farmId, indexKey, displayTraits]);

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
                {traitLabel(key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-semibold">
            Índice: {traitLabel(indexKey)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6 md:flex-row">
          <div className="md:w-3/4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium uppercase tracking-wide text-muted-foreground">
                      Quartil
                    </th>
                    <th className="p-3 text-right font-medium uppercase tracking-wide text-muted-foreground">
                      Contagem
                    </th>
                    {displayTraits.map((trait) => (
                      <th
                        key={trait}
                        className="p-3 text-right font-medium uppercase tracking-wide text-muted-foreground"
                      >
                        {traitLabel(trait)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {["Top25", "Bottom25", "Average"].map((group) => {
                    const slice = tableRows.filter((row) => row.group_label === group);
                    const byTrait: Record<string, number> = {};
                    slice.forEach((row) => {
                      if (typeof row.mean_value === "number") {
                        byTrait[row.trait_key] = row.mean_value;
                      }
                    });
                    const count = slice[0]?.n ?? null;

                    const rowBg =
                      group === "Top25"
                        ? "bg-emerald-50"
                        : group === "Bottom25"
                        ? "bg-rose-50"
                        : "bg-white";

                    return (
                      <tr key={group} className={rowBg}>
                        <td className="p-3 font-semibold text-foreground">
                          {group === "Top25"
                            ? "Top 25%"
                            : group === "Bottom25"
                            ? "Bottom 25%"
                            : "Average"}
                        </td>
                        <td className="p-3 text-right font-medium">{count ?? "-"}</td>
                        {displayTraits.map((trait) => (
                          <td key={trait} className="p-3 text-right">
                            {byTrait[trait] != null ? byTrait[trait].toFixed(2) : "-"}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {!tableRows.length && (
                    <tr>
                      <td
                        colSpan={displayTraits.length + 2}
                        className="p-6 text-center text-muted-foreground"
                      >
                        {loading ? "Carregando dados..." : "Sem dados."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:w-1/4">
            <div className="grid gap-4 rounded-lg border bg-muted/40 p-4 text-sm">
              <div>
                <span className="block text-xs font-medium uppercase text-muted-foreground">
                  Tabela
                </span>
                <span className="text-base font-semibold">{traitLabel(indexKey)}</span>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase text-muted-foreground">
                  População
                </span>
                <span className="text-base font-semibold">
                  {CATEGORIA_LABELS[categoria] ?? categoria}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase text-muted-foreground">
                  Quartis
                </span>
                <ul className="mt-1 space-y-1 text-sm">
                  <li>Top 25%</li>
                  <li>Bottom 25%</li>
                  <li>Average</li>
                </ul>
              </div>
              <div>
                <span className="block text-xs font-medium uppercase text-muted-foreground">
                  Traits
                </span>
                <ul className="mt-1 space-y-1 text-sm">
                  {selectedTraits.map((trait) => (
                    <li key={trait}>{traitLabel(trait)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-semibold">
            Boxplots — {traitLabel(indexKey)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {boxData.length ? (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={boxData} margin={{ left: 20, right: 20, top: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="trait_key"
                  tickFormatter={traitLabel}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis tickFormatter={(value) => value.toFixed(0)} />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, payload: { trait_key: string }) => [
                    Number(value ?? 0).toFixed(2),
                    traitLabel(payload?.trait_key ?? ""),
                  ]}
                />
                <Customized
                  component={({ xAxisMap, yAxisMap, offset }: any) => {
                    const xMap = xAxisMap[Object.keys(xAxisMap)[0]];
                    const yMap = yAxisMap[Object.keys(yAxisMap)[0]];

                    const boxes = boxData
                      .filter(
                        (point) =>
                          point.p0 != null &&
                          point.p25 != null &&
                          point.p50 != null &&
                          point.p75 != null &&
                          point.p100 != null
                      )
                      .map((point) => {
                        const cx = xMap.scale(point.trait_key) + xMap.bandwidth / 2 + offset.left;
                        const bandwidth = Math.max(12, xMap.bandwidth * 0.5);
                        const y0 = yMap.scale(point.p0 as number) + offset.top;
                        const y25 = yMap.scale(point.p25 as number) + offset.top;
                        const y50 = yMap.scale(point.p50 as number) + offset.top;
                        const y75 = yMap.scale(point.p75 as number) + offset.top;
                        const y100 = yMap.scale(point.p100 as number) + offset.top;

                        return (
                          <g key={point.trait_key}>
                            <line x1={cx} x2={cx} y1={y75} y2={y100} stroke="#4B5563" />
                            <line x1={cx} x2={cx} y1={y25} y2={y0} stroke="#4B5563" />
                            <rect
                              x={cx - bandwidth / 2}
                              y={Math.min(y25, y75)}
                              width={bandwidth}
                              height={Math.abs(y75 - y25)}
                              fill="#D1D5DB"
                              stroke="#4B5563"
                            />
                            <line x1={cx - bandwidth / 2} x2={cx + bandwidth / 2} y1={y50} y2={y50} stroke="#111827" />
                          </g>
                        );
                      });

                    return <g>{boxes}</g>;
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {loading ? "Carregando boxplots..." : "Sem dados para exibir boxplots."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-semibold">
            Distribuição — {traitLabel(indexKey)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={histogramData} barCategoryGap="8%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" angle={-45} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value: unknown) => Number(value ?? 0).toFixed(0)} />
              <Bar dataKey="count" fill="#6B7280" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" fill="#374151" fontSize={12} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
