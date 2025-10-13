"use client";

import { useEffect, useMemo, useState } from "react";
import AGLayout from "@/features/auditoria/AGLayout";
import { AGStepper } from "@/features/auditoria/Stepper";
import { useAGFilters } from "@/features/auditoria/store";

// Use o barrel para evitar conflitos entre branches:
// src/features/auditoria/steps/index.ts deve exportar todos os Steps.
import {
  Step1Parentesco,
  Step2TopParents,
  Step3QuartisOverview,
  Step4PTASeries,
  Step5Progressao,
  Step6ProgressCompare,
  Step7QuartisIndices,
  Step7Distribuicao,
} from "@/features/auditoria/steps";

type FarmLike = {
  farm_id?: string | null;
  farm_name?: string | null;
};

interface AuditoriaGeneticaPageProps {
  farm?: FarmLike | null;
  onBack: () => void;
}

export default function AuditoriaGeneticaPage({ farm, onBack }: AuditoriaGeneticaPageProps) {
  const [active, setActive] = useState<number>(0);
  const { setFarmId } = useAGFilters();

  // Array único mantém a ordem/índice dos steps estável entre branches
  const steps = useMemo(
    () => [
      { key: "parentesco", node: <Step1Parentesco /> },
      { key: "top-parents", node: <Step2TopParents /> },
      { key: "quartis-overview", node: <Step3QuartisOverview /> },
      { key: "pta-series", node: <Step4PTASeries /> },
      { key: "progressao", node: <Step5Progressao /> },
      { key: "progress-compare", node: <Step6ProgressCompare /> },
      { key: "quartis-indices", node: <Step7QuartisIndices /> },
      { key: "distribuicao", node: <Step7Distribuicao /> },
    ],
    []
  );

  // Ao trocar a fazenda: atualiza o store e reseta para o primeiro step
  useEffect(() => {
    const id = farm?.farm_id ?? undefined;
    setFarmId(id);
    setActive(0);
    return () => setFarmId(undefined);
  }, [farm?.farm_id, setFarmId]);

  const hasFarm = Boolean(farm?.farm_id);

  return (
    <AGLayout onBack={onBack} farmName={farm?.farm_name ?? undefined}>
      <div className="flex items-center gap-3" data-tour="auditoria:stepper">
        {/* Se o seu AGStepper exigir props extras, descomente uma das linhas abaixo */}
        <AGStepper
          active={active}
          onChange={setActive}
          // total={steps.length}
          // steps={steps.map((s) => s.key)}
        />
      </div>
      <div className="space-y-4" data-tour="auditoria:selectors">
        {!hasFarm ? (
          <div className="text-sm text-muted-foreground border rounded-lg p-4">
            Selecione uma fazenda para iniciar a Auditoria Genética.
          </div>
        ) : (
          <div data-tour="auditoria:resultados" className="space-y-4">
            {steps[Math.min(active, steps.length - 1)].node}
          </div>
        )}
      </div>
    </AGLayout>
  );
}
