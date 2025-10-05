"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import AGLayout from "./AGLayout";
import { AGStepper } from "./Stepper";
import { useAGFilters } from "./store";
import Step5Progressao from "./steps/Step5Progressao";
import Step8Benchmark from "./steps/Step8Benchmark";
import Step9Distribuicao from "./steps/Step9Distribuicao";

type FarmLike = {
  farm_id?: string;
  farm_name?: string;
};

interface AuditoriaGeneticaPageProps {
  farm?: FarmLike | null;
  onBack: () => void;
}

export default function AuditoriaGeneticaPage({ farm, onBack }: AuditoriaGeneticaPageProps) {
  const [active, setActive] = useState(0);
  const { setFarmId } = useAGFilters();

  useEffect(() => {
    setFarmId(farm?.farm_id);
    return () => {
      setFarmId(undefined);
    };
  }, [farm?.farm_id, setFarmId]);

  return (
    <AGLayout onBack={onBack} farmName={farm?.farm_name}>
      <AGStepper active={active} onChange={setActive} />
      <div className="space-y-4">
        {active === 0 && (
          <Card className="p-6">Step 1 — Parentesco (donuts + % Completo/Incompleto/Desconhecido) — pendente de view SQL.</Card>
        )}
        {active === 1 && (
          <Card className="p-6">Step 2 — Top Pais/Avós (barras horizontais + filtros) — pendente de view SQL.</Card>
        )}
        {active === 2 && (
          <Card className="p-6">Step 3 — Quartis (Overview) — boxplots + histograma — pendente de view SQL.</Card>
        )}
        {active === 3 && (
          <Card className="p-6">Step 4 — Média Linear (novilhas vs vacas) — pendente de view SQL.</Card>
        )}
        {active === 4 && <Step5Progressao />}
        {active === 5 && (
          <Card className="p-6">Step 6 — Comparação de Progressão (grupos, radar) — pendente de view SQL.</Card>
        )}
        {active === 6 && (
          <Card className="p-6">Step 7 — Quartis – Índices (HHP$ vs outro) — manter modelo EUA — pendente.</Card>
        )}
        {active === 7 && <Step8Benchmark />}
        {active === 8 && <Step9Distribuicao />}
      </div>
    </AGLayout>
  );
}
