"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PTA_CATALOG } from "@/features/auditoria-genetica/ptas";

type TraitGroupStats = {
  mean: number;
  n: number;
};

interface ChartRow {
  traitKey: string;
  label: string;
  difference: number;
  groups: Record<string, TraitGroupStats>;
  primaryGroup?: string;
  secondaryGroup?: string;
}

const LINEAR_MEANS_DEFAULT_TRAITS = [
  "sta",
  "str",
  "dfm",
  "rua",
  "rls",
  "rtp",
  "ftl",
  "rw",
  "rlr",
  "fta",
  "fls",
  "fua",
  "ruh",
  "ruw",
  "ucl",
  "udp",
  "ftp",
] as const;

export type LinearMeansMode = "coarse" | "full";

export interface LinearMeansRow {
  trait_key: string;
  group_label: string;
  mean_value: number;
  n: number;
}

export interface LinearMeansStepProps {
  farmId?: string | number;
  defaultMode?: LinearMeansMode;
  defaultTraits?: string[];
}

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const labelMap = new Map(PTA_CATALOG.map((item) => [item.key, item.label] as const));
const LINEAR_MEANS_LABEL_OVERRIDES = new Map(
  Array.from(LINEAR_MEANS_DEFAULT_TRAITS, (key) => [key, key.toUpperCase()] as const),
);

const getTraitLabel = (key: string) =>
  LINEAR_MEANS_LABEL_OVERRIDES.get(key) ?? labelMap.get(key) ?? key.toUpperCase();

const NOVILHAS_MATCHERS = ["nov", "nvl"];
const VACAS_MATCHERS = ["vac", "vlh"];

export default function LinearMeansStep({
  farmId,
  defaultMode = "coarse",
  defaultTraits = Array.from(LINEAR_MEANS_DEFAULT_TRAITS),
}: LinearMeansStepProps) {
  const [mode, setMode] = useState<LinearMeansMode>(defaultMode);
  const [normalize, setNormalize] = useState(false);
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [rows, setRows] = useState<LinearMeansRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canonicalOrder = useMemo(() => {
    const base = Array.from(LINEAR_MEANS_DEFAULT_TRAITS);
    defaultTraits.forEach((key) => {
      if (!base.includes(key)) {
        base.push(key);
      }
    });
    return base;
  }, [defaultTraits]);

  const [traits, setTraits] = useState<string[]>(() => {
    const baseSelection = defaultTraits.length ? defaultTraits : canonicalOrder;
    const unique = Array.from(new Set(baseSelection));
    return unique.sort((a, b) => {
      const indexA = canonicalOrder.indexOf(a);
      const indexB = canonicalOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  });

  const orderedKeys = useMemo(() => {
    const union = [...canonicalOrder];
    ptaOptions.forEach((key) => {
      if (!union.includes(key)) {
        union.push(key);
      }
    });
    return union;
  }, [canonicalOrder, ptaOptions]);

  const orderMap = useMemo(() => {
    const map = new Map<string, number>();
    orderedKeys.forEach((key, index) => {
      map.set(key, index);
    });
    return map;
  }, [orderedKeys]);

  const sortKeys = useCallback(
    (keys: string[]) => {
      const unique = Array.from(new Set(keys));
      return unique.sort((a, b) => {
        const orderA = orderMap.get(a);
        const orderB = orderMap.get(b);
        if (orderA === undefined && orderB === undefined) {
          return a.localeCompare(b);
        }
        if (orderA === undefined) return 1;
        if (orderB === undefined) return -1;
        return orderA - orderB;
      });
    },
    [orderMap],
  );

  const buildPtaOptions = useCallback(
    (columns: string[]) => {
      const uniqueKeys = Array.from(new Set([...canonicalOrder, ...columns]));
      return uniqueKeys.sort((a, b) => {
        const indexA = canonicalOrder.indexOf(a);
        const indexB = canonicalOrder.indexOf(b);
        const hasIndexA = indexA !== -1;
        const hasIndexB = indexB !== -1;

        if (hasIndexA && hasIndexB) {
          return indexA - indexB;
        }
        if (hasIndexA) return -1;
        if (hasIndexB) return 1;
        return a.localeCompare(b);
      });
    },
    [canonicalOrder],
  );

  useEffect(() => {
    let active = true;
    async function loadColumns() {
      const { data, error: rpcError } = await supabase.rpc("ag_list_pta_columns");
      if (!active) return;
      if (rpcError) {
        console.error("Failed to list PTA columns", rpcError);
        setError("Não foi possível carregar as PTAs disponíveis.");
        setPtaOptions(canonicalOrder);
        return;
      }
      const cols = Array.isArray(data)
        ? data.map((item: { column_name?: string }) => String(item.column_name))
        : [];
      setPtaOptions(buildPtaOptions(cols));
    }
    loadColumns();
    return () => {
      active = false;
    };
  }, [canonicalOrder, buildPtaOptions]);

  useEffect(() => {
    setTraits((prev) => {
      const sorted = sortKeys(prev);
      if (sorted.length === prev.length && sorted.every((value, index) => value === prev[index])) {
        return prev;
      }
      return sorted;
    });
  }, [sortKeys]);

  const fetchData = useCallback(async () => {
    if (farmId == null || traits.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("ag_linear_means", {
        p_farm: farmId,
        p_traits: traits,
        p_mode: mode,
        p_normalize: normalize,
        p_scope: normalize ? "farm" : null,
        p_scope_id: null,
      });

      if (rpcError) {
        throw rpcError;
      }

      setRows(Array.isArray(data) ? (data as LinearMeansRow[]) : []);
    } catch (rpcError) {
      console.error("Failed to load linear means", rpcError);
      setRows([]);
      setError("Não foi possível carregar as médias.");
    } finally {
      setLoading(false);
    }
  }, [farmId, traits, mode, normalize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const badges = useMemo(
    () =>
      orderedKeys.map((key) => ({
        key,
        label: getTraitLabel(key),
      })),
    [orderedKeys],
  );

  const toggleTrait = useCallback(
    (key: string) => {
      setTraits((prev) => {
        if (prev.includes(key)) {
          return prev.filter((item) => item !== key);
        }
        return sortKeys([...prev, key]);
      });
    },
    [sortKeys],
  );

  const headerCaption = normalize
    ? "Diferença (Novilhas - Vacas) das médias normalizadas pela média da fazenda."
    : "Diferença (Novilhas - Vacas) das médias observadas por grupo.";

  const sortedRows = useMemo(() => {
    if (!rows.length) return [];
    return [...rows].sort((a, b) => {
      const orderA = orderMap.get(a.trait_key) ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderMap.get(b.trait_key) ?? Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return a.group_label.localeCompare(b.group_label, "pt-BR");
      }
      return orderA - orderB;
    });
  }, [rows, orderMap]);

  const chartData = useMemo(() => {
    if (!rows.length || !traits.length) {
      return [] as ChartRow[];
    }

    const traitMap = new Map<string, ChartRow>();

    rows.forEach((row) => {
      if (!traits.includes(row.trait_key)) {
        return;
      }

      const mean = Number(row.mean_value);
      if (!Number.isFinite(mean)) {
        return;
      }

      const existing = traitMap.get(row.trait_key);
      const label = getTraitLabel(row.trait_key);

      if (!existing) {
        traitMap.set(row.trait_key, {
          traitKey: row.trait_key,
          label,
          difference: 0,
          groups: {
            [row.group_label]: { mean, n: row.n },
          },
        });
        return;
      }

      existing.groups[row.group_label] = { mean, n: row.n };
    });

    return sortKeys(traits).reduce<ChartRow[]>((acc, traitKey) => {
      const entry = traitMap.get(traitKey);
      if (!entry) {
        return acc;
      }

      const groupEntries = Object.entries(entry.groups);
      if (!groupEntries.length) {
        return acc;
      }

      const novEntry = groupEntries.find(([label]) =>
        NOVILHAS_MATCHERS.some((matcher) => label.toLowerCase().includes(matcher)),
      );
      const vacEntry = groupEntries.find(([label]) =>
        VACAS_MATCHERS.some((matcher) => label.toLowerCase().includes(matcher)),
      );

      let difference = 0;
      let primaryGroup: string | undefined;
      let secondaryGroup: string | undefined;

      if (novEntry && vacEntry) {
        difference = novEntry[1].mean - vacEntry[1].mean;
        primaryGroup = novEntry[0];
        secondaryGroup = vacEntry[0];
      } else if (groupEntries.length >= 2) {
        const [first, second] = groupEntries;
        difference = first[1].mean - second[1].mean;
        primaryGroup = first[0];
        secondaryGroup = second[0];
      } else {
        difference = groupEntries[0][1].mean;
        primaryGroup = groupEntries[0][0];
      }

      acc.push({
        ...entry,
        difference,
        primaryGroup,
        secondaryGroup,
      });

      return acc;
    }, []);
  }, [rows, traits, sortKeys]);

  const chartHeight = Math.max(400, chartData.length * 48);
  const skeletonHeight = Math.max(320, (traits.length || LINEAR_MEANS_DEFAULT_TRAITS.length) * 32);

  const renderTooltip = useCallback(
    ({ active, payload, label }: TooltipProps<number, string>) => {
      if (!active || !payload || !payload.length) {
        return null;
      }

      const datum = payload[0]?.payload as ChartRow | undefined;
      if (!datum) {
        return null;
      }

      const primary = datum.primaryGroup ?? "Grupo 1";
      const secondary = datum.secondaryGroup ?? null;

      return (
        <div className="rounded-md border bg-background/95 p-3 text-xs shadow-lg">
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-1 space-y-1">
            <div>
              Diferença (
              {primary}
              {secondary ? ` - ${secondary}` : ""}): <strong>{numberFormatter.format(datum.difference)}</strong>
            </div>
            {Object.entries(datum.groups).map(([groupLabel, stats]) => (
              <div key={groupLabel} className="flex items-center justify-between gap-4">
                <span>{groupLabel}</span>
                <span>
                  {numberFormatter.format(stats.mean)}
                  <span className="ml-1 text-muted-foreground">(n={stats.n})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    },
    [],
  );

  const renderLabel = useCallback(
    (props: { x?: number; y?: number; width?: number; height?: number; value?: number }) => {
      if (props.value === undefined || props.x === undefined || props.y === undefined) {
        return null;
      }

      const width = props.width ?? 0;
      const height = props.height ?? 0;
      const isPositive = (props.value as number) >= 0;
      const anchorX = isPositive ? props.x + width + 8 : props.x - 8;

      return (
        <text
          x={anchorX}
          y={props.y + height / 2}
          textAnchor={isPositive ? "start" : "end"}
          dominantBaseline="middle"
          className="fill-foreground text-xs"
        >
          {numberFormatter.format(props.value)}
        </text>
      );
    },
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Média Linear</CardTitle>
        <p className="text-sm text-muted-foreground">{headerCaption}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={mode} onValueChange={(value) => setMode(value as LinearMeansMode)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Agrupamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coarse">Novilhas x Vacas</SelectItem>
              <SelectItem value="full">Grupos detalhados (Bezerra/…)</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-black"
              checked={normalize}
              onChange={(event) => setNormalize(event.target.checked)}
            />
            Normalizar pela média da fazenda
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map(({ key, label }) => {
            const active = traits.includes(key);
            return (
              <Badge
                key={key}
                variant={active ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTrait(key)}
              >
                {label}
              </Badge>
            );
          })}
          {badges.length === 0 && !error && (
            <span className="text-sm text-muted-foreground">Nenhuma PTA disponível.</span>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div>
          {loading ? (
            <Skeleton className="w-full" style={{ height: skeletonHeight }} />
          ) : chartData.length ? (
            <div className="rounded-lg border bg-card p-4">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 16, right: 32, left: 16, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => numberFormatter.format(value as number)}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    width={180}
                    tick={{ fontSize: 12 }}
                  />
                  <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
                  <Tooltip content={renderTooltip} />
                  <Bar dataKey="difference" fill="#4B5563" barSize={24} radius={4}>
                    <LabelList dataKey="difference" content={renderLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              {traits.length === 0
                ? "Selecione ao menos uma PTA para visualizar as médias."
                : "Sem dados disponíveis para os filtros atuais."}
            </div>
          )}
        </div>

        {!loading && sortedRows.length > 0 && (
          <details className="rounded-lg border bg-muted/20 p-4">
            <summary className="cursor-pointer text-sm font-medium">
              Ver dados em tabela
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">PTA</th>
                    <th className="py-2">Grupo</th>
                    <th className="py-2">Média</th>
                    <th className="py-2">N</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, index) => (
                    <tr
                      key={`${row.trait_key}-${row.group_label}-${index}`}
                      className="border-b"
                    >
                      <td className="py-2 font-medium">{row.trait_key.toUpperCase()}</td>
                      <td className="py-2">{row.group_label}</td>
                      <td className="py-2">{numberFormatter.format(row.mean_value ?? 0)}</td>
                      <td className="py-2">{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
