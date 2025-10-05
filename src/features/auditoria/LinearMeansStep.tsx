"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function LinearMeansStep({
  farmId,
  defaultMode = "coarse",
  defaultTraits = ["ptat", "udc", "flc"],
}: LinearMeansStepProps) {
  const [mode, setMode] = useState<LinearMeansMode>(defaultMode);
  const [normalize, setNormalize] = useState(false);
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(defaultTraits);
  const [rows, setRows] = useState<LinearMeansRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadColumns() {
      const { data, error: rpcError } = await supabase.rpc("ag_list_pta_columns");
      if (!active) return;
      if (rpcError) {
        console.error("Failed to list PTA columns", rpcError);
        setError("Não foi possível carregar as PTAs disponíveis.");
        setPtaOptions([]);
        return;
      }
      const cols = Array.isArray(data)
        ? data.map((item: { column_name?: string }) => String(item.column_name))
        : [];
      setPtaOptions(cols);
    }
    loadColumns();
    return () => {
      active = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!farmId || traits.length === 0) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("ag_linear_means", {
      p_farm: farmId,
      p_traits: traits,
      p_mode: mode,
      p_normalize: normalize,
      p_scope: normalize ? "farm" : null,
      p_scope_id: null,
    });

    if (rpcError) {
      console.error("Failed to load linear means", rpcError);
      setRows([]);
      setError("Não foi possível carregar as médias.");
      setLoading(false);
      return;
    }

    setRows(Array.isArray(data) ? (data as LinearMeansRow[]) : []);
    setLoading(false);
  }, [farmId, traits, mode, normalize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const badges = useMemo(() => {
    return ptaOptions
      .map((key) => ({ key, label: key.toUpperCase() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ptaOptions]);

  const toggleTrait = useCallback((key: string) => {
    setTraits((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  }, []);

  const headerCaption = normalize
    ? "Valores normalizados pela média da fazenda."
    : "Comparação direta das médias por grupo.";

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

        <div className="overflow-x-auto">
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
              {loading && (
                <tr>
                  <td colSpan={4} className="py-6">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row, index) => (
                  <tr
                    key={`${row.trait_key}-${row.group_label}-${index}`}
                    className="border-b"
                  >
                    <td className="py-2 font-medium">{row.trait_key.toUpperCase()}</td>
                    <td className="py-2">{row.group_label}</td>
                    <td className="py-2">
                      {numberFormatter.format(row.mean_value ?? 0)}
                    </td>
                    <td className="py-2">{row.n}</td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    {traits.length === 0
                      ? "Selecione ao menos uma PTA para visualizar as médias."
                      : "Sem dados disponíveis para os filtros atuais."}
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
