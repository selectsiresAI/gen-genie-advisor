// GeneticCalculatorContext.tsx
// Provider centralizado para a Calculadora Genética

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  CalculatorInputs,
  CalculatorOutputs,
  GrowthInputs,
  ConceptionInputs,
  StrategyInputs,
  DEFAULT_CALCULATOR_INPUTS,
  InseminationProjection,
  PregnancyProjection,
  DoseBreakdown,
  RoiOutputs,
} from "@/lib/calculator/types";

// ---------- Estado do Context ----------

type GeneticCalculatorState = {
  inputs: CalculatorInputs;
  outputs: CalculatorOutputs;
  
  // Setters granulares
  setGrowthInputs: (updater: (prev: GrowthInputs) => GrowthInputs) => void;
  setConceptionInputs: (updater: (prev: ConceptionInputs) => ConceptionInputs) => void;
  setStrategyInputs: (updater: (prev: StrategyInputs) => StrategyInputs) => void;
  
  // Setter genérico
  setInputs: (updater: (prev: CalculatorInputs) => CalculatorInputs) => void;
  
  // Reset
  resetInputs: () => void;
};

const GeneticCalculatorContext = createContext<GeneticCalculatorState | null>(null);

// ---------- Provider ----------

export function GeneticCalculatorProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputsState] = useState<CalculatorInputs>(DEFAULT_CALCULATOR_INPUTS);

  // Calcula outputs sempre que inputs mudam
  const outputs = useMemo(() => calculateOutputs(inputs), [inputs]);

  // Setters granulares para cada fase
  const setGrowthInputs = useCallback(
    (updater: (prev: GrowthInputs) => GrowthInputs) => {
      setInputsState((prev) => ({
        ...prev,
        growth: updater(prev.growth),
      }));
    },
    []
  );

  const setConceptionInputs = useCallback(
    (updater: (prev: ConceptionInputs) => ConceptionInputs) => {
      setInputsState((prev) => ({
        ...prev,
        conception: updater(prev.conception),
      }));
    },
    []
  );

  const setStrategyInputs = useCallback(
    (updater: (prev: StrategyInputs) => StrategyInputs) => {
      setInputsState((prev) => ({
        ...prev,
        strategy: updater(prev.strategy),
      }));
    },
    []
  );

  // Setter genérico
  const setInputs = useCallback(
    (updater: (prev: CalculatorInputs) => CalculatorInputs) => {
      setInputsState((prev) => updater(prev));
    },
    []
  );

  // Reset para valores padrão
  const resetInputs = useCallback(() => {
    setInputsState(DEFAULT_CALCULATOR_INPUTS);
  }, []);

  const value: GeneticCalculatorState = {
    inputs,
    outputs,
    setGrowthInputs,
    setConceptionInputs,
    setStrategyInputs,
    setInputs,
    resetInputs,
  };

  return (
    <GeneticCalculatorContext.Provider value={value}>
      {children}
    </GeneticCalculatorContext.Provider>
  );
}

// ---------- Hook de consumo ----------

export function useGeneticCalculator(): GeneticCalculatorState {
  const ctx = useContext(GeneticCalculatorContext);
  if (!ctx) {
    throw new Error(
      "useGeneticCalculator deve ser usado dentro de GeneticCalculatorProvider"
    );
  }
  return ctx;
}

// ---------- Motor de Cálculo ----------

function calculateOutputs(inputs: CalculatorInputs): CalculatorOutputs {
  const { growth, conception, strategy } = inputs;

  // ============================================
  // 1. Mapeamento INPUT PAGE -> variáveis locais
  // ============================================
  const INPUT_PAGE_D5 = strategy.cowsPlan.damGeneticValue;
  const INPUT_PAGE_D6 = growth.calvingIntervalMonths;
  const INPUT_PAGE_D7 = growth.cullingRate;
  const INPUT_PAGE_D10 = growth.totalCowsDryAndLactating;

  const INPUT_PAGE_D17 = conception.cows.conventional;
  const INPUT_PAGE_D18 = conception.cows.beef;
  const INPUT_PAGE_D19 = conception.heifers.sexedSemen;
  const INPUT_PAGE_D20 = conception.heifers.conventional;

  // ============================================
  // 2. CALCULATE STRATEGY - Cálculos intermediários
  // ============================================
  
  // J12 - Impacto genético médio (placeholder - será refinado)
  const CALC_J12 = 0.02; // TODO: Calcular baseado na estratégia genética
  
  // M5 = INPUT_PAGE_D10 * (INPUT_PAGE_D6 / 12)
  const CALC_M5 = INPUT_PAGE_D10 * (INPUT_PAGE_D6 / 12);
  
  // M2 = INPUT_PAGE_D5
  const CALC_M2 = INPUT_PAGE_D5;
  
  // M4 = J12
  const CALC_M4 = CALC_J12;
  
  // M6 = (M5 * M2) + (M5 * M4)
  const CALC_M6 = (CALC_M5 * CALC_M2) + (CALC_M5 * CALC_M4);
  
  // M7 = M6 + (M6 * M4)
  const CALC_M7 = CALC_M6 + (CALC_M6 * CALC_M4);
  
  // L9 = M7
  const CALCULATE_STRATEGY_L9 = CALC_M7;

  // AM24, AM28, AM31 - Parâmetros de prenhez intermediários
  // Derivados das taxas de concepção médias
  const AM24 = (conception.cows.conventional + conception.heifers.conventional) / 2 || 35;
  const AM28 = AM24 * 1.1; // Ajuste baseado em padrões do setor
  const AM31 = (conception.heifers.sexedSemen + conception.heifers.conventional) / 2 || 45;

  // ============================================
  // 3. WWS REPORT - Projeções de inseminação
  // ============================================
  
  // D30, D31 - Bases de cálculo
  const WWS_D30 = (AM28 / INPUT_PAGE_D6) * 12;
  const WWS_D31 = AM24 / (INPUT_PAGE_D7 / 100); // Convertendo % para decimal

  // D23, D24 - Trimestre
  const WWS_D23 = AM24 > 0 ? WWS_D30 / AM24 : 0;
  const WWS_D24 = AM31 > 0 ? WWS_D31 / AM31 : 0;

  // E23, E24 - Mensal (trimestre / 4... aproximação)
  const WWS_E23 = WWS_D23 / 4;
  const WWS_E24 = WWS_D24 / 4;
  const WWS_E30 = WWS_D30 / 4;
  const WWS_E31 = WWS_D31 / 4;

  // F23, F24 - Divisão por 12
  const WWS_F23 = WWS_D23 / 12;
  const WWS_F24 = WWS_D24 / 12;
  const WWS_F30 = WWS_D30 / 12;
  const WWS_F31 = WWS_D31 / 12;

  // G23-G31 - Valores de input diretos
  const WWS_G23 = INPUT_PAGE_D17;
  const WWS_G24 = INPUT_PAGE_D18;
  const WWS_G30 = INPUT_PAGE_D19;
  const WWS_G31 = INPUT_PAGE_D20;

  // H23, H24, H31 - Diferenças
  const WWS_H23 = WWS_G23 - WWS_F23;
  const WWS_H24 = WWS_G24 - WWS_F24;
  const WWS_H31 = WWS_G31 - WWS_F31;

  // ============================================
  // 4. Projeções formatadas para UI
  // ============================================
  
  // Valores "atuais" - derivados dos inputs de Fase 1
  const currentInsemCows = growth.cowsInseminatedPerMonth;
  const currentInsemHeifers = growth.heifersInseminatedPerMonth;
  const currentPregCows = growth.pregnantCowsPerMonth;
  const currentPregHeifers = growth.pregnantHeifersPerMonth;

  // Escalando projeções para valores realistas baseados no rebanho
  const scaleFactor = growth.targetHerdSize / 100;
  
  const cowsInsemTrimester = Math.round(WWS_D23 * scaleFactor);
  const heifersInsemTrimester = Math.round(WWS_D24 * scaleFactor * 0.5);
  
  const cowsInsemMonthly = Math.round(cowsInsemTrimester / 3);
  const heifersInsemMonthly = Math.round(heifersInsemTrimester / 3);

  const inseminations = {
    cows: {
      trimester: cowsInsemTrimester,
      monthly: cowsInsemMonthly,
      current: Math.round(currentInsemCows),
      difference: cowsInsemTrimester - Math.round(currentInsemCows),
    } as InseminationProjection,
    heifers: {
      trimester: heifersInsemTrimester,
      monthly: heifersInsemMonthly,
      current: Math.round(currentInsemHeifers),
      difference: heifersInsemTrimester - Math.round(currentInsemHeifers),
    } as InseminationProjection,
    total: {
      trimester: cowsInsemTrimester + heifersInsemTrimester,
      monthly: cowsInsemMonthly + heifersInsemMonthly,
      current: Math.round(currentInsemCows + currentInsemHeifers),
      difference: (cowsInsemTrimester + heifersInsemTrimester) - 
                  Math.round(currentInsemCows + currentInsemHeifers),
    } as InseminationProjection,
  };

  // Prenhez projetada usando taxas de concepção
  const cowsPregTrimester = Math.round(
    (inseminations.cows.trimester * conception.cows.conventional) / 100
  );
  const heifersPregTrimester = Math.round(
    (inseminations.heifers.trimester * conception.heifers.conventional) / 100
  );

  const pregnancies = {
    cows: {
      trimester: cowsPregTrimester,
      monthly: Math.round(cowsPregTrimester / 3),
      current: Math.round(currentPregCows),
      difference: cowsPregTrimester - Math.round(currentPregCows),
    } as PregnancyProjection,
    heifers: {
      trimester: heifersPregTrimester,
      monthly: Math.round(heifersPregTrimester / 3),
      current: Math.round(currentPregHeifers),
      difference: heifersPregTrimester - Math.round(currentPregHeifers),
    } as PregnancyProjection,
    total: {
      trimester: cowsPregTrimester + heifersPregTrimester,
      monthly: Math.round((cowsPregTrimester + heifersPregTrimester) / 3),
      current: Math.round(currentPregCows + currentPregHeifers),
      difference: (cowsPregTrimester + heifersPregTrimester) - 
                  Math.round(currentPregCows + currentPregHeifers),
    } as PregnancyProjection,
  };

  // ============================================
  // 5. PRODUCT BREAKDOWN - Doses necessárias
  // ============================================
  
  // Calcula doses baseado na estratégia genética
  const totalInseminations = inseminations.total.trimester * 4; // Anual
  
  // Distribuição baseada na estratégia
  const { heifersGroup, cowsGroup, heifersPlan, cowsPlan } = strategy;
  
  // Calcula % de cada tipo de sêmen baseado na estratégia
  const sexedPercentage = calculateSemenTypePercentage('sexed', heifersPlan, cowsPlan, heifersGroup, cowsGroup);
  const conventionalPercentage = calculateSemenTypePercentage('conventional', heifersPlan, cowsPlan, heifersGroup, cowsGroup);
  const beefPercentage = calculateSemenTypePercentage('beef', heifersPlan, cowsPlan, heifersGroup, cowsGroup);
  
  const annualSexed = Math.round(totalInseminations * (sexedPercentage / 100));
  const annualConv = Math.round(totalInseminations * (conventionalPercentage / 100));
  const annualBeef = Math.round(totalInseminations * (beefPercentage / 100));

  const dosesNeeded = {
    sexed: {
      annual: annualSexed,
      monthly: Math.round(annualSexed / 12),
      weekly: Math.round(annualSexed / 52),
    } as DoseBreakdown,
    conventional: {
      annual: annualConv,
      monthly: Math.round(annualConv / 12),
      weekly: Math.round(annualConv / 52),
    } as DoseBreakdown,
    beef: {
      annual: annualBeef,
      monthly: Math.round(annualBeef / 12),
      weekly: Math.round(annualBeef / 52),
    } as DoseBreakdown,
  };

  // ============================================
  // 6. ROI - Cálculos econômicos
  // ============================================
  
  // Novilhas necessárias baseado no descarte e crescimento
  const heifersNeeded = Math.round(
    (growth.targetHerdSize * (growth.cullingRate / 100)) + 
    (growth.targetHerdSize * (growth.firstCalfMortality / 100) * 0.5)
  );
  
  // Novilhas criadas baseado nas prenhezes e taxas de nascimento
  const birthsFromSexed = Math.round(annualSexed * (conception.heifers.sexedSemen / 100) * 0.9); // 90% fêmeas
  const birthsFromConv = Math.round(annualConv * (conception.cows.conventional / 100) * 0.5); // 50% fêmeas
  const totalHeifersBorn = birthsFromSexed + birthsFromConv;
  
  // Aplica mortalidade
  const heifersCreated = Math.round(
    totalHeifersBorn * (1 - growth.stillbornHeifers / 100) * 
    (1 - growth.heiferDeathsPreWeaning / 100)
  );

  // Custos por dose (valores configuráveis)
  const COST_SEXED = 200;
  const COST_CONV = 50;
  const COST_BEEF = 20;

  const sexedGeneticCost = annualSexed * COST_SEXED;
  const conventionalGeneticCost = annualConv * COST_CONV;
  const beefGeneticCost = annualBeef * COST_BEEF;
  const totalGeneticCost = sexedGeneticCost + conventionalGeneticCost + beefGeneticCost;

  // Animais para venda
  const dairyMaleCalves = Math.round(birthsFromConv); // Machos do convencional
  const beefCalves = Math.round(annualBeef * (conception.cows.beef / 100));
  const beefHeifers = Math.round(beefCalves * 0.5);

  // Receitas (valores configuráveis)
  const VALUE_DAIRY_MALE = 1000;
  const VALUE_BEEF_CALF = 5000;
  const VALUE_BEEF_HEIFER = 5000;

  const totalRevenue = 
    (dairyMaleCalves * VALUE_DAIRY_MALE) + 
    (beefCalves * VALUE_BEEF_CALF) + 
    (beefHeifers * VALUE_BEEF_HEIFER);

  const margin = totalRevenue - totalGeneticCost;
  const marginPerHeifer = heifersCreated > 0 ? margin / heifersCreated : 0;

  const roi: RoiOutputs = {
    totalHeifersBorn,
    heifersNeeded,
    heifersCreated,
    sexedGeneticCost,
    conventionalGeneticCost,
    beefGeneticCost,
    totalGeneticCost,
    dairyMaleCalves,
    beefCalves,
    beefHeifers,
    totalRevenue,
    margin,
    marginPerHeifer,
  };

  // ============================================
  // 7. Células Excel mapeadas (para debug)
  // ============================================
  
  const cells: Record<string, number> = {
    CALCULATE_STRATEGY_L9,
    CALCULATE_STRATEGY_M2: CALC_M2,
    CALCULATE_STRATEGY_M4: CALC_M4,
    CALCULATE_STRATEGY_M5: CALC_M5,
    CALCULATE_STRATEGY_M6: CALC_M6,
    CALCULATE_STRATEGY_M7: CALC_M7,
    CALCULATE_STRATEGY_J12: CALC_J12,
    WWS_REPORT_D23: WWS_D23,
    WWS_REPORT_D24: WWS_D24,
    WWS_REPORT_D30: WWS_D30,
    WWS_REPORT_D31: WWS_D31,
    WWS_REPORT_E23: WWS_E23,
    WWS_REPORT_E24: WWS_E24,
    WWS_REPORT_E30: WWS_E30,
    WWS_REPORT_E31: WWS_E31,
    WWS_REPORT_F23: WWS_F23,
    WWS_REPORT_F24: WWS_F24,
    WWS_REPORT_F30: WWS_F30,
    WWS_REPORT_F31: WWS_F31,
    WWS_REPORT_G23: WWS_G23,
    WWS_REPORT_G24: WWS_G24,
    WWS_REPORT_G30: WWS_G30,
    WWS_REPORT_G31: WWS_G31,
    WWS_REPORT_H23: WWS_H23,
    WWS_REPORT_H24: WWS_H24,
    WWS_REPORT_H31: WWS_H31,
    INPUT_PAGE_D5,
    INPUT_PAGE_D6,
    INPUT_PAGE_D7,
    INPUT_PAGE_D10,
    INPUT_PAGE_D17,
    INPUT_PAGE_D18,
    INPUT_PAGE_D19,
    INPUT_PAGE_D20,
  };

  return {
    cells,
    inseminations,
    pregnancies,
    dosesNeeded,
    roi,
  };
}

// ---------- Funções auxiliares ----------

import { ServiceType, ServicePlan, GeneticGroup } from "@/lib/calculator/types";

function calculateSemenTypePercentage(
  semenType: 'sexed' | 'conventional' | 'beef',
  heifersPlan: ServicePlan,
  cowsPlan: ServicePlan,
  heifersGroup: GeneticGroup,
  cowsGroup: GeneticGroup
): number {
  let total = 0;
  const services: ServiceType[] = [
    heifersPlan.firstService,
    heifersPlan.secondService,
    heifersPlan.thirdService,
    cowsPlan.firstService,
    cowsPlan.secondService,
    cowsPlan.thirdService,
  ];
  
  // Peso de cada serviço (1º > 2º > 3º)
  const weights = [0.5, 0.3, 0.2, 0.5, 0.3, 0.2];
  
  const targetType = semenType === 'sexed' ? 'sexed' : 
                     semenType === 'conventional' ? 'conventional' : 'beef';
  
  services.forEach((service, idx) => {
    if (service === targetType || 
        (semenType === 'sexed' && service === 'sexedEmbryo')) {
      total += weights[idx] * 100;
    }
  });
  
  // Normaliza para não passar de 100%
  return Math.min(total / 3, 100);
}
