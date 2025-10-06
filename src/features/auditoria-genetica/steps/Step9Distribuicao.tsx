"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { PTA_CATALOG } from "../ptas";
import { useAGFilters } from "../store";

type HistogramRow = {
  bin_from: number;
  bin_to: number;
  bin_count: number;
};

type HistogramPoint = {
  range: string;
  count: number;
};

const PTA_LABEL_MAP: Record<string, string> = PTA_CATALOG.reduce(
  (acc, { key, label }) => ({ ...acc, [key]: label }),
  {} as Record<string, string>,
);

const ALL_PTA_KEYS = PTA_CATALOG.map((item) => item.key);

const ensureValidTraits = (candidate: string[], available: string[]): string[] => {
  if (!available.length) {
    return [];
  }

  const orderedUnique: string[] = [];
  for (const key of candidate) {
    if (available.includes(key) && !orderedUnique.includes(key)) {
      orderedUnique.push(key);
    }
  }

  if (!orderedUnique.length) {
    const fallback = available.find((item) => item === "hhp_dollar") ?? available[0];
    return fallback ? [fallback] : [];
  }

  const withoutHhp = orderedUnique.filter((key) => key !== "hhp_dollar");
  if (orderedUnique.includes("hhp_dollar")) {
    return ["hhp_dollar", ...withoutHhp];
  }

  const fallback = available.find((item) => item === "hhp_dollar");
  return fallback ? [fallback, ...withoutHhp] : orderedUnique;
};

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export default function Step9Distribuicao() {
  const { farmId, ptasSelecionadas, setPTAs } = useAGFilters();

  const traitOptions = ALL_PTA_KEYS;

  const [bucketCount, setBucketCount] = useState(20);
  const [traits, setTraits] = useState<string[]>(() =>
    ensureValidTraits(ptasSelecionadas.length ? ptasSelecionadas : ["hhp_dollar"], traitOptions),
  );
  const [series, setSeries] = useState<Record<string, HistogramPoint[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [additionSelectKey, setAdditionSelectKey] = useState(0);

  useEffect(() => {
    setTraits((current) => {
      const fromStore = ensureValidTraits(
        ptasSelecionadas.length ? ptasSelecionadas : ["hhp_dollar"],
        traitOptions,
      );
      return arraysEqual(current, fromStore) ? current : fromStore;
    });
  }, [ptasSelecionadas, traitOptions]);

  useEffect(() => {
    if (!arraysEqual(ptasSelecionadas, traits)) {
      setPTAs(traits);
    }
  }, [traits, ptasSelecionadas, setPTAs]);

  useEffect(() => {
    if (!farmId || !traits.length) {
      setSeries({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const entries = await Promise.all(
          traits.map(async (trait) => {
            const { data, error } = await supabase.rpc<HistogramRow[]>("ag_trait_histogram", {
              p_farm: farmId,
              p_trait: trait,
              p_bins: bucketCount,
            });

            if (error) {
              console.error("Erro ao carregar histograma", trait, error);
              return [trait, []] as const;
            }

            const rows = Array.isArray(data) ? data : [];
            const points = rows.map<HistogramPoint>((row) => ({
              range: `${row.bin_from.toFixed(1)} – ${row.bin_to.toFixed(1)}`,
              count: row.bin_count,
            }));

            return [trait, points] as const;
          }),
        );

        if (cancelled) return;

        setSeries(Object.fromEntries(entries));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [farmId, traits, bucketCount]);

  const availableForAddition = useMemo(
    () => traitOptions.filter((key) => !traits.includes(key)),
    [traitOptions, traits],
  );

  const labelOf = (key: string) => PTA_LABEL_MAP[key] ?? key.toUpperCase();
  const mainTrait = traits[0];

  if (!traits.length) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">Nenhuma PTA disponível.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição — múltiplas PTAs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">PTA principal</label>
            <Select
              value={mainTrait ?? undefined}
              onValueChange={(value) =>
                setTraits((current) => {
                  const filtered = current.filter((item) => item !== value);
                  const next = ensureValidTraits([value, ...filtered], traitOptions);
                  return arraysEqual(current, next) ? current : next;
                })
              }
              disabled={!traitOptions.length}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione a PTA" />
              </SelectTrigger>
              <SelectContent>
                {traitOptions.map((key) => (
                  <SelectItem key={key} value={key}>
                    {labelOf(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableForAddition.length > 0 && (
              <Select
                key={additionSelectKey}
                onValueChange={(value) => {
                  setTraits((current) => {
                    if (current.includes(value)) {
                      return current;
                    }
                    const next = ensureValidTraits([...current, value], traitOptions);
                    return arraysEqual(current, next) ? current : next;
                  });
                  setAdditionSelectKey((current) => current + 1);
                }}
                disabled={!traitOptions.length}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Adicionar PTA" />
                </SelectTrigger>
                <SelectContent>
                  {availableForAddition.map((key) => (
                    <SelectItem key={key} value={key}>
                      {labelOf(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm">Número de classes</label>
            <input
              type="range"
              min={5}
              max={30}
              value={bucketCount}
              onChange={(event) => setBucketCount(parseInt(event.target.value, 10))}
            />
            <span className="text-sm">{bucketCount}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {traits.map((key) => {
          const data = series[key] ?? [];
          const isTraitLoading = isLoading && !data.length;

          return (
            <Card key={key}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle>Distribuição — {labelOf(key)}</CardTitle>
                {traits.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setTraits((current) => {
                        const next = ensureValidTraits(
                          current.filter((item) => item !== key),
                          traitOptions,
                        );
                        return arraysEqual(current, next) ? current : next;
                      })
                    }
                  >
                    Remover
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {isTraitLoading ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : data.length ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ED1C24" opacity={0.85} name="Qtd de Animais" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    Sem dados.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
