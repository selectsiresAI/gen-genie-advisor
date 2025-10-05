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
import { Input } from "@/components/ui/input";
import { useAGFilters } from "../store";

type ParentRole = "sire" | "mgs";
type AgeSegment =
  | "Todas"
  | "Bezerra"
  | "Novilha"
  | "Primípara"
  | "Secundípara"
  | "Multípara";

type Row = {
  parent_label: string;
  daughters_count: number;
  trait_mean: number | null;
};

const DEFAULT_TRAIT = "hhp_dollar";

export default function Step2TopParents() {
  const { farmId } = useAGFilters();
  const [role, setRole] = useState<ParentRole>("sire");
  const [yearFrom, setYearFrom] = useState(() => new Date().getFullYear() - 4);
  const [yearTo, setYearTo] = useState(() => new Date().getFullYear() + 1);
  const [limit, setLimit] = useState(20);
  const [orderTrait, setOrderTrait] = useState(DEFAULT_TRAIT);
  const [ageFilter, setAgeFilter] = useState<AgeSegment>("Todas");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("ag_top_parents", {
      p_farm: farmId,
      p_parent_type: role,
      p_year_from: yearFrom,
      p_year_to: yearTo,
      p_limit: limit,
      p_order_trait: orderTrait,
      p_age_filter: ageFilter,
    });
    if (error) {
      console.error("Failed to load top parents", error);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(Array.isArray(data) ? (data as Row[]) : []);
    setLoading(false);
  }, [farmId, role, yearFrom, yearTo, limit, orderTrait, ageFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const title = useMemo(() => {
    return `Top ${limit} ${role === "sire" ? "Sires" : "MGS"}`;
  }, [limit, role]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={role} onValueChange={(value) => setRole(value as ParentRole)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sire">Sire</SelectItem>
              <SelectItem value="mgs">MGS</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="w-28"
            type="number"
            value={yearFrom}
            onChange={(event) => setYearFrom(Number(event.target.value))}
          />
          <Input
            className="w-28"
            type="number"
            value={yearTo}
            onChange={(event) => setYearTo(Number(event.target.value))}
          />
          <Input
            className="w-28"
            type="number"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          />
          <Input
            className="w-44"
            value={orderTrait}
            onChange={(event) => setOrderTrait(event.target.value)}
            placeholder="Índice p/ ordenar (ex.: hhp_dollar)"
          />
          <Select
            value={ageFilter}
            onValueChange={(value) => setAgeFilter(value as AgeSegment)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Bezerra">Bezerra</SelectItem>
              <SelectItem value="Novilha">Novilha</SelectItem>
              <SelectItem value="Primípara">Primípara</SelectItem>
              <SelectItem value="Secundípara">Secundípara</SelectItem>
              <SelectItem value="Multípara">Multípara</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Pai / Avô</th>
                <th className="py-2">Filhas</th>
                <th className="py-2">Média {orderTrait.toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.parent_label} className="border-b">
                  <td className="py-2">{row.parent_label}</td>
                  <td className="py-2">{row.daughters_count}</td>
                  <td className="py-2">
                    {row.trait_mean == null ? "N/A" : Math.round(row.trait_mean)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {loading ? "Carregando dados..." : "Sem dados para os filtros."}
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
