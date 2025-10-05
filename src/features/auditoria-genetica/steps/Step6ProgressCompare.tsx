"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAGFilters } from "../store";

type Grouping = "age_group" | "coarse" | "category";

interface Row {
  trait_key: string;
  group_label: string;
  slope_per_year: number;
  n_years: number;
}

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();
  const [groupBy, setGroupBy] = useState<Grouping>("age_group");
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(["tpi", "nm_dollar", "hhp_dollar"]);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    async function loadColumns() {
      const { data, error } = await supabase.rpc("ag_list_pta_columns");
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
    const { data, error } = await supabase.rpc("ag_progress_compare", {
      p_farm: farmId,
      p_traits: traits,
      p_grouping: groupBy,
    });
    if (error) {
      console.error("Failed to load progress compare", error);
      setRows([]);
      return;
    }
    setRows(Array.isArray(data) ? (data as Row[]) : []);
  }, [farmId, traits, groupBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const badges = useMemo(() => {
    return ptaOptions
      .map((key) => ({ key, label: key.toUpperCase() }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ptaOptions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Progressão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as Grouping)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="age_group">Grupos de idade</SelectItem>
              <SelectItem value="coarse">Novilhas x Vacas</SelectItem>
              <SelectItem value="category">Categoria (label)</SelectItem>
            </SelectContent>
          </Select>
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
                <th className="py-2">PTA</th>
                <th className="py-2">Grupo</th>
                <th className="py-2">Slope/ano</th>
                <th className="py-2">Anos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.trait_key}-${row.group_label}-${index}`}
                  className="border-b"
                >
                  <td className="py-2">{row.trait_key.toUpperCase()}</td>
                  <td className="py-2">{row.group_label}</td>
                  <td className="py-2">{Math.round(row.slope_per_year)}</td>
                  <td className="py-2">{row.n_years}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Sem dados.
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
