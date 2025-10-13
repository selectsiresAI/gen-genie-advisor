"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BuiltInIndexKey = "NM$" | "HHP$" | "TPI" | "CM$" | "FM$" | "CUSTOM";

type DoseBreakdown = {
  sexed_doses: number;
  conv_doses: number;
  price_sexed: number;
  price_conv: number;
};

export type BullPlan = {
  bull_id: string;
  bull_name?: string;
  doses: DoseBreakdown;
  indices: Partial<Record<Exclude<BuiltInIndexKey, "CUSTOM">, number>>;
};

type ROIWidgetProps = {
  data: BullPlan[];
  customIndexResolver?: (bullId: string) => Promise<number | null>;
  customIndexLabel?: string;
  femaleRateSexed?: number;
  femaleRateConventional?: number;
};

export default function ROIWidget({
  data,
  customIndexResolver,
  customIndexLabel = "Índice Customizado",
  femaleRateSexed = 0.90,
  femaleRateConventional = 0.47,
}: ROIWidgetProps) {
  const [selectedIndex, setSelectedIndex] = useState<BuiltInIndexKey>("NM$");
  const [customIndexMap, setCustomIndexMap] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      if (selectedIndex !== "CUSTOM" || !customIndexResolver) return;
      const pairs = await Promise.all(
        data.map(async (b) => {
          try { return [b.bull_id, await customIndexResolver(b.bull_id)] as const; }
          catch { return [b.bull_id, null] as const; }
        })
      );
      if (!active) return;
      const m: Record<string, number | null> = {};
      pairs.forEach(([k, v]) => (m[k] = v ?? null));
      setCustomIndexMap(m);
    })();
    return () => { active = false; };
  }, [selectedIndex, customIndexResolver, data]);

  const totals = useMemo(() => {
    const totalSexed = data.reduce((a, b) => a + (b.doses.sexed_doses || 0), 0);
    const totalConv  = data.reduce((a, b) => a + (b.doses.conv_doses || 0), 0);
    const totalDoses = totalSexed + totalConv;
    const totalCost =
      data.reduce((a, b) => a + b.doses.sexed_doses * b.doses.price_sexed, 0) +
      data.reduce((a, b) => a + b.doses.conv_doses  * b.doses.price_conv, 0);
    const totalHeifers = totalSexed * femaleRateSexed + totalConv * femaleRateConventional;
    return { totalSexed, totalConv, totalDoses, totalCost, totalHeifers };
  }, [data, femaleRateSexed, femaleRateConventional]);

  const getBullIndex = (b: BullPlan): number | null => {
    if (selectedIndex === "CUSTOM") return customIndexMap[b.bull_id] ?? null;
    const v = b.indices[selectedIndex];
    return typeof v === "number" ? v : null;
  };

  const weightedIndex = useMemo(() => {
    let num = 0, den = 0;
    data.forEach((b) => {
      const idx = getBullIndex(b);
      if (idx === null || isNaN(idx)) return;
      const w = (b.doses.sexed_doses || 0) + (b.doses.conv_doses || 0);
      if (w <= 0) return;
      num += idx * w; den += w;
    });
    return den === 0 ? 0 : num / den;
  }, [data, customIndexMap, selectedIndex]);

  const ROI = useMemo(() => weightedIndex * totals.totalHeifers - totals.totalCost, [weightedIndex, totals]);

  const roiColor =
    ROI > 0 ? "text-green-600 bg-green-50 border-green-200" :
    ROI < 0 ? "text-red-600 bg-red-50 border-red-200" :
              "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <Card className="w-full" data-tutorial-anchor="pg-projecao-mvp-resultados-roi-formula">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">ROI Genético</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Índice:</span>
            <Select value={selectedIndex} onValueChange={(v) => setSelectedIndex(v as BuiltInIndexKey)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Escolha o índice" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NM$">NM$ (Net Merit)</SelectItem>
                <SelectItem value="HHP$">HHP$</SelectItem>
                <SelectItem value="TPI">TPI</SelectItem>
                <SelectItem value="CM$">CM$</SelectItem>
                <SelectItem value="FM$">FM$</SelectItem>
                <SelectItem value="CUSTOM">{customIndexLabel}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className={cn("border rounded-md px-3 py-2 text-sm", roiColor)}>
          <div className="font-medium">
            ROI = (Índice Ponderado × Total de Bezerras) − Custo Total do Sêmen
          </div>
          <div className="mt-1 text-xs">
            Índice Ponderado: <b>{weightedIndex.toFixed(2)}</b> •
            Total de Bezerras: <b>{totals.totalHeifers.toFixed(1)}</b> •
            Custo Total: <b>R$ {totals.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-semibold">
            R$ {ROI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              ROI > 0 ? "border-green-300 text-green-700" :
              ROI < 0 ? "border-red-300 text-red-700" : "border-gray-300 text-gray-700"
            )}
          >
            {ROI > 0 ? "Positivo" : ROI < 0 ? "Negativo" : "Neutro"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <Stat label="Doses Sexadas" value={totals.totalSexed} />
          <Stat label="Doses Convencionais" value={totals.totalConv} />
          <Stat label="Total de Doses" value={totals.totalDoses} />
          <Stat label="Taxa Fêmeas (Sexado)" value={`${(femaleRateSexed * 100).toFixed(0)}%`} />
          <Stat label="Taxa Fêmeas (Conv.)" value={`${(femaleRateConventional * 100).toFixed(0)}%`} />
          <Stat label="Índice Ponderado" value={weightedIndex.toFixed(2)} />
        </div>

        {selectedIndex === "CUSTOM" && !customIndexResolver && (
          <div className="rounded-md border p-3 text-xs text-amber-700">
            Para usar o índice customizado, forneça <code>customIndexResolver(bullId)</code>.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-medium">{value}</div>
    </div>
  );
}
