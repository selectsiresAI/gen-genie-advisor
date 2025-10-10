"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAGFilters } from "@/features/auditoria/store";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ⛔️ IMPORTANTE: nenhum import de PieChart/Pie/Cell aqui.

type CompareRow = {
  label: string; // ex.: "Top25", "Bottom25", "Média", etc.
  value: number; // valor/percentual para comparar
};

export default function Step6ProgressCompare() {
  const { farmId } = useAGFilters();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [showBars, setShowBars] = useState(true); // troca entre tabela e barras

  // 🔧 Ajuste esta função ao seu SQL/endpoint atual do Step6.
  async function fetchCompare() {
    setLoading(true);
    try {
      // Exemplo genérico: buscar visão agregada já existente para o Step6
      const { data, error } = await supabase
        .from("ag_step6_compare_view") // troque para sua view/tabela do Step6
        .select("label,value")
        .eq("farm_id", farmId);

      if (error) throw error;

      const mapped: CompareRow[] = (data ?? []).map((d: any) => ({
        label: d.label,
        value: Number(d.value),
      }));

      setRows(mapped);
    } catch (e) {
      console.error("Step6ProgressCompare:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!farmId) return;
    fetchCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  const chartData = useMemo(
    () => rows.map((r) => ({ name: r.label, value: r.value })),
    [rows]
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>Step 6 — Comparativo (sem gráficos de pizza)</CardTitle>
        <div className="flex items-center gap-3">
          <Switch id="switch-bars" checked={showBars} onCheckedChange={setShowBars} />
          <Label htmlFor="switch-bars" className="text-sm text-muted-foreground">
            {showBars ? "Visualizando Barras" : "Visualizando Tabela"}
          </Label>
          {loading && <span className="text-sm text-muted-foreground">Carregando…</span>}
          <Button variant="outline" size="sm" onClick={fetchCompare}>
            Atualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!loading && rows.length === 0 && (
          <div className="text-sm text-muted-foreground">Sem dados para exibir.</div>
        )}

        {/* ======= BARRAS (substituto dos PieCharts) ======= */}
        {showBars && rows.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ======= TABELA SIMPLES ======= */}
        {!showBars && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b">
                  <th className="py-2 pr-4">Grupo</th>
                  <th className="py-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.label}</td>
                    <td className="py-2">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
