"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GeneticAuditStep4Chart from "@/components/auditoria/GeneticAuditStep4Chart";
import { useAGFilters } from "../store";

const PTAS = ["IPI", "PTAM", "PTAF", "PTAP", "PL", "DPR", "LIV", "SCS", "HHP$", "NM$", "TPI"];

export default function Step4PTASeries() {
  const { farmId } = useAGFilters();
  const [selectedPTA, setSelectedPTA] = useState<string>(PTAS[0]);

  const formattedFarmId = useMemo(() => {
    if (farmId == null || farmId === "") return undefined;
    return String(farmId);
  }, [farmId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência genética por PTA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,220px)_1fr] md:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="step4-pta">PTA</Label>
            <Select value={selectedPTA} onValueChange={(value) => setSelectedPTA(value)}>
              <SelectTrigger id="step4-pta" className="w-full">
                <SelectValue placeholder="Selecione a PTA" />
              </SelectTrigger>
              <SelectContent>
                {PTAS.map((pta) => (
                  <SelectItem key={pta} value={pta}>
                    {pta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            Visualize a série anual da média ponderada, média geral e tendência linear calculadas
            diretamente pela auditoria genética. Utilize os filtros superiores da Auditoria para alterar a
            fazenda analisada.
          </p>
        </div>

        {!formattedFarmId ? (
          <div className="rounded-md border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
            Selecione uma fazenda para carregar o gráfico.
          </div>
        ) : (
          <GeneticAuditStep4Chart farmId={formattedFarmId} tipoPTA={selectedPTA} />
        )}
      </CardContent>
    </Card>
  );
}
