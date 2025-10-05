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
