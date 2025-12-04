// useGeneticCalculator.ts
// Re-export do hook para facilitar imports

export { useGeneticCalculator, GeneticCalculatorProvider } from "@/providers/GeneticCalculatorContext";

// Re-export dos tipos para conveniência
export type {
  CalculatorInputs,
  CalculatorOutputs,
  GrowthInputs,
  ConceptionInputs,
  StrategyInputs,
  GeneticGroup,
  ServiceType,
  ServicePlan,
  InseminationProjection,
  PregnancyProjection,
  DoseBreakdown,
  RoiOutputs,
} from "@/lib/calculator/types";

export {
  DEFAULT_CALCULATOR_INPUTS,
  DEFAULT_GROWTH_INPUTS,
  DEFAULT_CONCEPTION_INPUTS,
  DEFAULT_STRATEGY_INPUTS,
} from "@/lib/calculator/types";
