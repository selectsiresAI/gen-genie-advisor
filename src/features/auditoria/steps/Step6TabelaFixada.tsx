// Auditoria Genética — Step6TabelaFixada.tsx
// Tabela com 2 colunas fixas (Index, Group) + PTAs roláveis horizontalmente
// Stack: React + TS + Tailwind + shadcn/ui

"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAGFilters } from "@/features/auditoria/store";
import { PTA_CATALOG } from "@/lib/pta"; // [{key, label}...]

type Row = {
  index_label: string; // ex.: "HHP$", "NM$"...
  group_label: "Top25" | "Bottom25" | "Difference" | string;
  // Demais chaves: cada PTA -> number | null
  [trait: string]: any;
};

const FROZEN_INDEX_W = 140; // px (Index)
const FROZEN_GROUP_W = 140; // px (Group)

export default function Step6TabelaFixada() {
  const { farmId } = useAGFilters();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  // Ordena PTAs com HHP$ primeiro
  const traitCols = useMemo(() => {
    const withHhpFirst = [...PTA_CATALOG].sort((a, b) =>
      a.key === "hhp_dollar" ? -1 : b.key === "hhp_dollar" ? 1 : a.label.localeCompare(b.label)
    );
    return withHhpFirst;
  }, []);

  useEffect(() => {
    if (!farmId) return;
    (async () => {
      setLoading(true);
      try {
        // 🔧 Ajuste para sua fonte de dados do Step6:
        // Espera-se uma linha por (index_label, group_label) com colunas de PTAs.
        const { data, error } = await supabase
          .from("ag_step6_table_view") // <-- troque pelo seu nome de tabela/view
          .select("*")
          .eq("farm_id", farmId);
        if (error) throw error;

        const mapped = (data ?? []).map((d: any) => {
          const row: Row = {
            index_label: d.index_label,
            group_label: d.group_label,
          };
          // copia os valores de cada PTA se existirem na view
          traitCols.forEach(({ key }) => {
            const v = d[key];
            const num =
              typeof v === "string" ? Number(v.replace(",", ".")) : typeof v === "number" ? v : null;
            row[key] = Number.isFinite(num as number) ? Number(num) : null;
          });
          return row;
        });
        setRows(mapped);
      } catch (e) {
        console.error("Step6TabelaFixada:", e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [farmId, traitCols]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Step 6 — Comparativo (tabela com colunas fixas)</CardTitle>
        {loading && <div className="text-sm text-muted-foreground">Carregando…</div>}
      </CardHeader>

      <CardContent className="p-0">
        {/* Wrapper com rolagem horizontal */}
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-background">
                {/* Coluna fixa: Index */}
                <th
                  className="text-left font-semibold sticky left-0 z-30 bg-background"
                  style={{ minWidth: FROZEN_INDEX_W, width: FROZEN_INDEX_W }}
                >
                  <div className="px-3 py-2">Index</div>
                </th>
                {/* Coluna fixa: Group */}
                <th
                  className="text-left font-semibold sticky z-30 bg-background"
                  style={{
                    left: FROZEN_INDEX_W,
                    minWidth: FROZEN_GROUP_W,
                    width: FROZEN_GROUP_W,
                  }}
                >
                  <div className="px-3 py-2">Group</div>
                </th>

                {/* Demais PTAs (roláveis) */}
                {traitCols.map((t) => (
                  <th key={t.key} className="text-left font-semibold">
                    <div className="px-3 py-2 whitespace-nowrap">{t.label}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.index_label}-${r.group_label}-${idx}`} className="border-b">
                  {/* FROZEN: Index */}
                  <td
                    className="sticky left-0 z-20 bg-background"
                    style={{ minWidth: FROZEN_INDEX_W, width: FROZEN_INDEX_W }}
                  >
                    <div className="px-3 py-2 font-medium">{r.index_label}</div>
                  </td>
                  {/* FROZEN: Group */}
                  <td
                    className="sticky z-20 bg-background"
                    style={{
                      left: FROZEN_INDEX_W,
                      minWidth: FROZEN_GROUP_W,
                      width: FROZEN_GROUP_W,
                    }}
                  >
                    <div className="px-3 py-2">{r.group_label}</div>
                  </td>

                  {/* Valores das PTAs */}
                  {traitCols.map((t) => (
                    <td key={t.key}>
                      <div className="px-3 py-2 tabular-nums">
                        {r[t.key] ?? r[t.key] === 0 ? Number(r[t.key]).toFixed(2) : "—"}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}

              {rows.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={2 + traitCols.length}
                    className="px-3 py-6 text-sm text-muted-foreground"
                  >
                    Sem dados para exibir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de rolagem aparece automaticamente pelo overflow-x-auto do wrapper */}
      </CardContent>
    </Card>
  );
}
