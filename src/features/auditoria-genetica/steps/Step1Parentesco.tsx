"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAGFilters } from "../store";

type ParentRole = "sire" | "mgs" | "mmgs";
type ParentStatus = "Completo" | "Incompleto" | "Desconhecido";

type Row = {
  role: ParentRole;
  status: ParentStatus;
  n: number;
  pct: number;
};

type GroupedRows = Record<ParentRole, Row[]>;

export default function Step1Parentesco() {
  const { farmId } = useAGFilters();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!farmId) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase.rpc("ag_parentage_overview", {
        p_farm: farmId,
      });
      if (!active) return;
      if (error) {
        console.error("Failed to load parentage overview", error);
        setRows([]);
        return;
      }
      setRows(Array.isArray(data) ? (data as Row[]) : []);
    }
    load();
    return () => {
      active = false;
    };
  }, [farmId]);

  const byRole = useMemo(() => {
    const map: GroupedRows = {
      sire: [],
      mgs: [],
      mmgs: [],
    };
    rows.forEach((row) => {
      map[row.role]?.push(row);
    });
    return map;
  }, [rows]);

  const Block = ({ title, items }: { title: string; items?: Row[] }) => {
    const total = (items ?? []).reduce((sum, row) => sum + (row.n || 0), 0);
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 text-sm text-muted-foreground">Total: {total}</div>
          <div className="grid grid-cols-3 gap-3">
            {(items ?? []).map((item) => (
              <div key={item.status} className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">{item.status}</div>
                <div className="text-lg font-semibold">{Math.round(item.pct)}%</div>
                <div className="text-xs">{item.n} animais</div>
              </div>
            ))}
            {(!items || items.length === 0) && (
              <div className="col-span-3 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                Sem dados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Block title="Pai (Sire)" items={byRole.sire} />
      <Block title="Avô Materno (MGS)" items={byRole.mgs} />
      <Block title="Bisavô Materno (MMGS)" items={byRole.mmgs} />
    </div>
  );
}
