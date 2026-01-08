"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAGFilters } from "../store";
import { Info, AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ParentRole = "sire" | "mgs" | "mmgs";
type ParentStatus = "Completo" | "Incompleto" | "Desconhecido";

type Row = {
  role: ParentRole;
  status: ParentStatus;
  n: number;
  pct: number;
};

type GroupedRows = Record<ParentRole, Row[]>;

const STATUS_INFO: Record<ParentStatus, { icon: React.ReactNode; color: string; description: string; action: string }> = {
  Desconhecido: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-destructive",
    description: "Ancestral não registrado no banco de dados. O código NAAB do pai/avô não foi informado na planilha de importação.",
    action: "Atualize a planilha de fêmeas incluindo o código NAAB do ancestral e reimporte os dados.",
  },
  Incompleto: {
    icon: <HelpCircle className="h-4 w-4" />,
    color: "text-amber-500",
    description: "Ancestral identificado (código NAAB informado), porém seus dados genéticos (PTAs) não constam no banco de touros.",
    action: "Importe os dados do touro no módulo de Importação de Touros ou solicite ao administrador.",
  },
  Completo: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-500",
    description: "Ancestral identificado e com dados genéticos completos no banco de touros.",
    action: "Nenhuma ação necessária.",
  },
};

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
      const { data, error } = await (supabase.rpc as any)("ag_parentage_overview", {
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
    
    // Sort items: Desconhecido first, then Incompleto, then Completo
    const sortedItems = [...(items ?? [])].sort((a, b) => {
      const order: Record<ParentStatus, number> = { Desconhecido: 0, Incompleto: 1, Completo: 2 };
      return order[a.status] - order[b.status];
    });

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="text-sm text-muted-foreground">Total: {total} animais</div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedItems.map((item) => {
            const info = STATUS_INFO[item.status];
            return (
              <TooltipProvider key={item.status}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-help transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={info.color}>{info.icon}</span>
                        <span className="text-sm font-medium">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{item.pct.toFixed(2)}%</div>
                        <div className="text-xs text-muted-foreground">{item.n.toLocaleString("pt-BR")} animais</div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-3">
                    <p className="font-medium mb-1">{item.status}</p>
                    <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                    <p className="text-xs font-medium text-primary">💡 {info.action}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {sortedItems.length === 0 && (
            <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
              Sem dados.
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Como interpretar os dados de parentesco?</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><span className="text-destructive font-medium">Desconhecido:</span> O código NAAB do ancestral não foi informado na planilha de importação das fêmeas.</li>
              <li><span className="text-amber-500 font-medium">Incompleto:</span> O código NAAB foi informado, mas os dados genéticos do touro não estão no banco de dados.</li>
              <li><span className="text-emerald-500 font-medium">Completo:</span> Ancestral identificado com todos os dados genéticos disponíveis.</li>
            </ul>
            <p className="mt-2 text-xs text-primary">Passe o mouse sobre cada status para ver instruções de como completar os dados.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Block title="Pai (Sire)" items={byRole.sire} />
        <Block title="Avô Materno (MGS)" items={byRole.mgs} />
        <Block title="Bisavô Materno (MMGS)" items={byRole.mmgs} />
      </div>
    </div>
  );
}
