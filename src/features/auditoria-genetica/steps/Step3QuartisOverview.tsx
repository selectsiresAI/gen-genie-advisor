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

const formatValue = (value: number | null | undefined, fractionDigits = 2) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }

  return value.toFixed(fractionDigits);
};

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

  const displayTraits = useMemo(
    () => [indexKey, ...selectedTraits].filter((trait, position, array) => array.indexOf(trait) === position),
    [indexKey, selectedTraits]
  );

  useEffect(() => {
    setIndexKey(ensureIndexKey(indiceBase));
  }, [indiceBase]);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (!farmId || !displayTraits.length) {
        if (isActive) {
          setTableRows([]);
          setHistData([]);
          setBoxData([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setTableRows([]);
      setHistData([]);
      setBoxData([]);

      try {
        const [quartisResponse, histogramResponse, boxResponses] = await Promise.all([
          supabase.rpc("ag_quartis_overview", {
            p_farm: farmId,
            p_index_key: indexKey,
            p_traits: displayTraits,
          }),
          supabase.rpc("ag_trait_histogram", {
            p_farm: farmId,
            p_trait: indexKey,
            p_bins: 20,
          }),
          Promise.all(
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
          ),
        ]);

        if (!isActive) {
          return;
        }

        if (quartisResponse.error) {
          console.error("Failed to load quartile overview", quartisResponse.error);
          setTableRows([]);
        } else {
          setTableRows(Array.isArray(quartisResponse.data) ? (quartisResponse.data as QuartileRow[]) : []);
        }

        if (histogramResponse.error) {
          console.error("Failed to load histogram", histogramResponse.error);
          setHistData([]);
        } else {
          setHistData(
            Array.isArray(histogramResponse.data) ? (histogramResponse.data as HistogramBin[]) : []
          );
        }

        setBoxData(boxResponses.filter(Boolean) as BoxPlotPoint[]);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [farmId, indexKey, displayTraits]);

  const histogramData = useMemo(
    () =>
      histData.map((bin, index) => {
        const binFrom = typeof bin.bin_from === "number" ? bin.bin_from : 0;
        const binTo = typeof bin.bin_to === "number" ? bin.bin_to : binFrom;
        const binCount = typeof bin.bin_count === "number" ? bin.bin_count : 0;

        return {
          key: `${binFrom}-${binTo}-${index}`,
          x: `${binFrom.toFixed(1)}–${binTo.toFixed(1)}`,
          count: binCount,
        };
      }),
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
                            {formatValue(byTrait[trait])}
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
                <YAxis tickFormatter={(value) => (typeof value === "number" ? value.toFixed(0) : String(value))} />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, payload: { trait_key: string }) => [
                    Number(value ?? 0).toFixed(2),
                    traitLabel(payload?.trait_key ?? ""),
                  ]}
                />
                <Customized
                  component={({ xAxisMap, yAxisMap, offset }: any) => {
                    const xAxisKey = Object.keys(xAxisMap)[0];
                    const yAxisKey = Object.keys(yAxisMap)[0];
                    const xMap = xAxisMap[xAxisKey];
                    const yMap = yAxisMap[yAxisKey];

                    if (!xMap || !yMap || typeof xMap.bandwidth !== "number") {
                      return null;
                    }

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
                        const xValue = xMap.scale(point.trait_key);
                        if (typeof xValue !== "number") {
                          return null;
                        }

                        const bandwidth = Math.max(12, xMap.bandwidth * 0.5);
                        const cx = xValue + xMap.bandwidth / 2 + offset.left;
                        const toY = (raw: number | null) => {
                          if (typeof raw !== "number") {
                            return null;
                          }

                          const value = yMap.scale(raw);
                          return typeof value === "number" ? value + offset.top : null;
                        };

                        const y0 = toY(point.p0);
                        const y25 = toY(point.p25);
                        const y50 = toY(point.p50);
                        const y75 = toY(point.p75);
                        const y100 = toY(point.p100);

                        if ([y0, y25, y50, y75, y100].some((v) => typeof v !== "number")) {
                          return null;
                        }

                        return (
                          <g key={point.trait_key}>
                            <line x1={cx} x2={cx} y1={y75 as number} y2={y100 as number} stroke="#4B5563" />
                            <line x1={cx} x2={cx} y1={y25 as number} y2={y0 as number} stroke="#4B5563" />
                            <rect
                              x={cx - bandwidth / 2}
                              y={Math.min(y25 as number, y75 as number)}
                              width={bandwidth}
                              height={Math.abs((y75 as number) - (y25 as number))}
                              fill="#D1D5DB"
                              stroke="#4B5563"
                            />
                            <line
                              x1={cx - bandwidth / 2}
                              x2={cx + bandwidth / 2}
                              y1={y50 as number}
                              y2={y50 as number}
                              stroke="#111827"
                            />
                          </g>
                        );
                      })
                      .filter(Boolean);

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
