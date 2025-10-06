"use client";
import { useEffect, useState } from "react";
import AGLayout from "./AGLayout";
import { AGStepper } from "./Stepper";
import { useAGFilters } from "./store";
import Step1Parentesco from "./steps/Step1Parentesco";
import Step2TopParents from "./steps/Step2TopParents";
import Step3QuartisOverview from "./steps/Step3QuartisOverview";
import Step4MediaLinear from "./steps/Step4MediaLinear";
import Step5Progressao from "./steps/Step5Progressao";
import Step6ProgressCompare from "./steps/Step6ProgressCompare";
import Step7QuartisIndices from "./steps/Step7QuartisIndices";
import Step8Benchmark from "./steps/Step8Benchmark";
import Step9Distribuicao from "./steps/Step9Distribuicao";
import { clampStep } from "./constants";
import type { FarmLike } from "./types";
import { cn } from "@/lib/utils";

interface AuditoriaGeneticaPageProps {
  farm?: FarmLike | null;
  onBack: () => void;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  statusMessage?: string;
  statusTone?: "info" | "warning" | "error";
}

export default function AuditoriaGeneticaPage({
  farm,
  onBack,
  initialStep = 0,
  onStepChange,
  statusMessage,
  statusTone = "info",
}: AuditoriaGeneticaPageProps) {
  const [active, setActive] = useState(() => clampStep(initialStep));
  const { setFarmId } = useAGFilters();

  useEffect(() => {
    setFarmId(farm?.farm_id);
    return () => {
      setFarmId(undefined);
    };
  }, [farm?.farm_id, setFarmId]);

  useEffect(() => {
    setActive(clampStep(initialStep));
  }, [initialStep]);

  const handleStepChange = (step: number) => {
    const normalized = clampStep(step);
    setActive(normalized);
    onStepChange?.(normalized);
  };

  return (
    <AGLayout onBack={onBack} farmName={farm?.farm_name}>
      {statusMessage && (
        <div
          className={cn(
            "mb-4 rounded-md border px-4 py-3 text-sm",
            statusTone === "info" && "border-primary/30 bg-primary/10 text-primary",
            statusTone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
            statusTone === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {statusMessage}
        </div>
      )}
      <AGStepper active={active} onChange={handleStepChange} />
      <div className="space-y-4">
        {active === 0 && <Step1Parentesco />}
        {active === 1 && <Step2TopParents />}
        {active === 2 && <Step3QuartisOverview />}
        {active === 3 && <Step4MediaLinear />}
        {active === 4 && <Step5Progressao />}
        {active === 5 && <Step6ProgressCompare />}
        {active === 6 && <Step7QuartisIndices />}
        {active === 7 && <Step8Benchmark />}
        {active === 8 && <Step9Distribuicao />}
      </div>
    </AGLayout>
  );
}
