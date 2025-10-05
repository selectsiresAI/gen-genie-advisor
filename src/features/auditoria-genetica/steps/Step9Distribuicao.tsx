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

export default function Step9Distribuicao() {
  const { farmId, ptasSelecionadas } = useAGFilters();
  const [bucketCount, setBucketCount] = useState(20);
  const [traits, setTraits] = useState<string[]>(() => {
    const defaults = ptasSelecionadas.length ? ptasSelecionadas : ["hhp_dollar"];
    return defaults.includes("hhp_dollar") ? defaults : ["hhp_dollar", ...defaults];
  });
  const [series, setSeries] = useState<Record<string, HistogramPoint[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [additionSelectKey, setAdditionSelectKey] = useState(0);

  useEffect(() => {
    const defaults = ptasSelecionadas.length ? ptasSelecionadas : ["hhp_dollar"];
    setTraits((current) => {
      const merged = Array.from(new Set([...(current.length ? current : []), ...defaults]));
      if (!merged.includes("hhp_dollar")) {
        merged.unshift("hhp_dollar");
      }
      return merged;
    });
  }, [ptasSelecionadas]);

  useEffect(() => {
    if (!farmId || !traits.length) {
      setSeries({});
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
    () => ALL_PTA_KEYS.filter((key) => !traits.includes(key)),
    [traits],
  );

  const labelOf = (key: string) => PTA_LABEL_MAP[key] ?? key.toUpperCase();
  const mainTrait = traits[0];

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
              value={mainTrait}
              onValueChange={(value) =>
                setTraits((current) => [value, ...current.filter((item) => item !== value)])
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecione a PTA" />
              </SelectTrigger>
              <SelectContent>
                {ALL_PTA_KEYS.map((key) => (
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
                  setTraits((current) =>
                    current.includes(value) ? current : [...current, value],
                  );
                  setAdditionSelectKey((current) => current + 1);
                }}
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
          return (
            <Card key={key}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle>Distribuição — {labelOf(key)}</CardTitle>
                {traits.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setTraits((current) => current.filter((item) => item !== key))
                    }
                  >
                    Remover
                  </button>
                )}
              </CardHeader>
              <CardContent>
                {isLoading && !data.length ? (
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
