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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  // Mantidos: filtros e controles existentes
  const [yearFrom, setYearFrom] = useState(() => new Date().getFullYear() - 4);
  const [yearTo, setYearTo] = useState(() => new Date().getFullYear() + 1);
  const [limit, setLimit] = useState(20);
  const [orderTrait, setOrderTrait] = useState(DEFAULT_TRAIT);
  const [ageFilter, setAgeFilter] = useState<AgeSegment>("Todas");

  // Novo: manteremos os dois rankings em paralelo (Sire e MGS)
  const [rowsSire, setRowsSire] = useState<Row[]>([]);
  const [rowsMgs, setRowsMgs] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTop = useCallback(
    async (role: ParentRole): Promise<Row[]> => {
      if (!farmId) return [];
      const { data, error } = await (supabase.rpc as any)("ag_top_parents", {
        p_farm: farmId,
        p_parent_type: role,    // "sire" ou "mgs"
        p_year_from: yearFrom,
        p_year_to: yearTo,
        p_limit: limit,
        p_order_trait: orderTrait, // mantém para cálculo de trait_mean na RPC
        p_age_filter: ageFilter,
      });
      if (error) {
        console.error("Failed to load top parents", role, error);
        return [];
      }
      const arr: Row[] = Array.isArray(data) ? (data as Row[]) : [];
      // ORDEM EXIGIDA: maior nº de filhas → menor (independente da RPC)
      return [...arr].sort((a, b) => b.daughters_count - a.daughters_count);
    },
    [farmId, yearFrom, yearTo, limit, orderTrait, ageFilter]
  );

  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRowsSire([]);
      setRowsMgs([]);
      return;
    }
    setLoading(true);
    const [sire, mgs] = await Promise.all([fetchTop("sire"), fetchTop("mgs")]);
    setRowsSire(sire);
    setRowsMgs(mgs);
    setLoading(false);
  }, [farmId, fetchTop]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Totais e percentuais
  const totalSire = useMemo(
    () => rowsSire.reduce((acc, r) => acc + (r.daughters_count || 0), 0),
    [rowsSire]
  );
  const totalMgs = useMemo(
    () => rowsMgs.reduce((acc, r) => acc + (r.daughters_count || 0), 0),
    [rowsMgs]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Parents — Ranking por Nº de Filhas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles — mantidos do seu componente original */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ano inicial */}
          <Input
            className="w-28"
            type="number"
            value={yearFrom}
            onChange={(e) => setYearFrom(Number(e.target.value))}
          />
          {/* Ano final */}
          <Input
            className="w-28"
            type="number"
            value={yearTo}
            onChange={(e) => setYearTo(Number(e.target.value))}
          />
            {/* Limite (a RPC já limita; mantemos para consistência) */}
          <Input
            className="w-28"
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
          {/* Trait usado pela RPC para calcular trait_mean. O ranking visual é por nº de filhas. */}
          <Input
            className="w-44"
            value={orderTrait}
            onChange={(e) => setOrderTrait(e.target.value)}
            placeholder="Índice p/ RPC (ex.: hhp_dollar)"
          />
          {/* Segmento etário */}
          <Select value={ageFilter} onValueChange={(v) => setAgeFilter(v as AgeSegment)}>
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

        {loading && (
          <div className="py-6 text-center text-muted-foreground">
            Carregando dados...
          </div>
        )}

        {!loading && rowsSire.length === 0 && rowsMgs.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados para os filtros.
          </div>
        )}

        {!loading && (rowsSire.length > 0 || rowsMgs.length > 0) && (
          <Tabs defaultValue="sire" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="sire">Sire (Pai)</TabsTrigger>
              <TabsTrigger value="mgs">MGS (Avô materno)</TabsTrigger>
            </TabsList>

            <TabsContent value="sire">
              <RankingList
                title={`Top ${rowsSire.length} — Sire`}
                rows={rowsSire}
                total={totalSire}
                barBasis="daughters_count"
              />
            </TabsContent>

            <TabsContent value="mgs">
              <RankingList
                title={`Top ${rowsMgs.length} — MGS`}
                rows={rowsMgs}
                total={totalMgs}
                barBasis="daughters_count"
              />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function RankingList({
  title,
  rows,
  total,
  barBasis,
}: {
  title: string;
  rows: Row[];
  total: number;
  barBasis: "daughters_count";
}) {
  const maxVal = useMemo(
    () => Math.max(0, ...rows.map((r) => (barBasis === "daughters_count" ? r.daughters_count : 0))),
    [rows, barBasis]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="text-xs text-muted-foreground">
          Total de filhas (aba): <span className="font-medium">{total}</span>
        </div>
      </div>

      <div className="space-y-1">
        {rows.map((row, idx) => {
          const value = row.daughters_count;
          const width = maxVal > 0 ? (value / maxVal) * 100 : 0;
          const pct =
            total > 0 ? ((row.daughters_count / total) * 100).toFixed(2) : "0.00";
          return (
            <div
              key={`${row.parent_label}-${idx}`}
              className="flex items-center gap-2 text-sm"
            >
              <div className="w-56 text-right flex-shrink-0">
                {row.parent_label}
              </div>

              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-5 bg-muted transition-all"
                  style={{ width: `${width}%` }}
                />
                <span className="text-xs font-medium min-w-[3.5rem] text-right tabular-nums">
                  {row.daughters_count}
                </span>
                <span className="text-[10px] text-muted-foreground min-w-[3.2rem] text-right tabular-nums">
                  {pct}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {row.trait_mean == null ? "trait: N/A" : `trait: ${Math.round(row.trait_mean)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
