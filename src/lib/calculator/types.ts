// types.ts - Tipagens TypeScript para a Calculadora Genética

// ---------- Inputs da Fase 1 – Variáveis de Crescimento ----------

export type GrowthInputs = {
  cullingRate: number;                    // Taxa de descarte (%)
  calvingIntervalMonths: number;          // Intervalo entre partos (meses)
  firstCalvingAge: number;                // Idade ao primeiro parto (meses)
  firstCalfMortality: number;             // Mortes do primeiro parto (%)
  stillbornHeifers: number;               // Novilhas natimortas (%)
  heiferDeathsPreWeaning: number;         // Novilhas mortas/vendidas após nasc. até o parto (%)
  targetHerdSize: number;                 // Tamanho do rebanho desejado (nº vacas em lactação)
  abortionsCows: number;                  // Aborto em vacas (%)
  heiferInventory: number;                // Inventário de novilhas (nº)
  pregnantHeifersNow: number;             // Novilhas prenhas (nº)
  heifers0to12Months: number;             // Novilhas de 0 a 12 meses (nº)
  heifersInseminatedPerMonth: number;     // Novilhas inseminadas por mês atualmente
  heifersInseminatedUnconfirmed: number;  // Novilhas inseminadas (não confirmadas)
  pregnantHeifersPerMonth: number;        // Novilhas prenhas por mês atualmente
  heifersEligibleNext12M: number;         // Novilhas elegíveis para reprodução nos próximos 12 meses
  totalCowsDryAndLactating: number;       // Número total de vacas (secas e lactantes)
  cowsInseminatedPerMonth: number;        // Vacas inseminadas por mês atualmente
  pregnantCowsPerMonth: number;           // Vacas prenhas por mês atualmente
};

// ---------- Inputs da Fase 2 – Dados de Concepção ----------

export type ConceptionInputs = {
  cows: {
    conventional: number;   // Taxa concepção convencional vacas (%)
    beef: number;           // Taxa concepção corte vacas (%)
    embryos: number;        // Taxa concepção embriões vacas (%)
    sexedEmbryo: number;    // Taxa concepção embrião sexado vacas (%)
  };
  heifers: {
    sexedSemen: number;     // Taxa concepção sêmen sexado novilhas (%)
    conventional: number;   // Taxa concepção convencional novilhas (%)
    beef: number;           // Taxa concepção corte novilhas (%)
    embryos: number;        // Taxa concepção embriões novilhas (%)
    sexedEmbryo: number;    // Taxa concepção embrião sexado novilhas (%)
  };
};

// ---------- Inputs da Fase 3 – Estratégia Genética ----------

export type GeneticGroup = {
  superior: number;       // % do grupo superior
  intermediate: number;   // % do grupo intermediário
  inferior: number;       // % do grupo inferior
};

export type ServiceType =
  | "sexed"
  | "conventional"
  | "beef"
  | "embryo"
  | "sexedEmbryo"
  | "none";

export type ServicePlan = {
  damGeneticValue: number;    // Valor genético da Mãe
  firstService: ServiceType;  // 1º serviço
  secondService: ServiceType; // 2º serviço
  thirdService: ServiceType;  // 3º serviço
};

export type StrategyInputs = {
  heifersGroup: GeneticGroup;   // Distribuição genética novilhas
  cowsGroup: GeneticGroup;      // Distribuição genética vacas
  heifersPlan: ServicePlan;     // Plano de serviços novilhas
  cowsPlan: ServicePlan;        // Plano de serviços vacas
};

// ---------- Outputs - Projeções de Inseminação (Fase 4) ----------

export type InseminationProjection = {
  trimester: number;    // Projeção trimestral
  monthly: number;      // Projeção mensal
  current: number;      // Valor atual (input)
  difference: number;   // Diferença (projetado - atual)
};

export type PregnancyProjection = {
  trimester: number;    // Prenhez trimestral projetada
  monthly: number;      // Prenhez mensal projetada
  current: number;      // Prenhez atual (input)
  difference: number;   // Diferença
};

// ---------- Outputs - Doses Necessárias (Fase 5) ----------

export type DoseBreakdown = {
  annual: number;   // Doses anuais
  monthly: number;  // Doses mensais
  weekly: number;   // Doses semanais
};

// ---------- Outputs - ROI (Fases 6-7) ----------

export type RoiOutputs = {
  // Balanço de novilhas
  totalHeifersBorn: number;     // Total de novilhas nascidas
  heifersNeeded: number;        // Novilhas necessárias
  heifersCreated: number;       // Novilhas criadas

  // Investimento em genética
  sexedGeneticCost: number;         // Custo sêmen sexado
  conventionalGeneticCost: number;  // Custo sêmen convencional
  beefGeneticCost: number;          // Custo sêmen corte
  totalGeneticCost: number;         // Custo total genética

  // Receita de animais vendidos
  dairyMaleCalves: number;    // Bezerros machos leiteiros vendidos
  beefCalves: number;         // Bezerros corte vendidos
  beefHeifers: number;        // Novilhas corte vendidas
  totalRevenue: number;       // Receita total

  // Indicadores-chave
  margin: number;             // Margem (receita - custo)
  marginPerHeifer: number;    // Margem por novilha
};

// ---------- Outputs Consolidados ----------

export type CalculatorOutputs = {
  // Células Excel mapeadas (para debug/validação)
  cells: Partial<Record<string, number>>;

  // Projeções de inseminação
  inseminations: {
    cows: InseminationProjection;
    heifers: InseminationProjection;
    total: InseminationProjection;
  };

  // Projeções de prenhez
  pregnancies: {
    cows: PregnancyProjection;
    heifers: PregnancyProjection;
    total: PregnancyProjection;
  };

  // Doses necessárias por tipo
  dosesNeeded: {
    sexed: DoseBreakdown;
    conventional: DoseBreakdown;
    beef: DoseBreakdown;
  };

  // ROI e métricas econômicas
  roi: RoiOutputs;
};

// ---------- Inputs Consolidados ----------

export type CalculatorInputs = {
  growth: GrowthInputs;
  conception: ConceptionInputs;
  strategy: StrategyInputs;
};

// ---------- Valores Padrão ----------

export const DEFAULT_GROWTH_INPUTS: GrowthInputs = {
  cullingRate: 20,
  calvingIntervalMonths: 12.8,
  firstCalvingAge: 23,
  firstCalfMortality: 23,
  stillbornHeifers: 3,
  heiferDeathsPreWeaning: 40,
  targetHerdSize: 1400,
  abortionsCows: 15,
  heiferInventory: 1310,
  pregnantHeifersNow: 353,
  heifers0to12Months: 725,
  heifersInseminatedPerMonth: 143,
  heifersInseminatedUnconfirmed: 103,
  pregnantHeifersPerMonth: 40,
  heifersEligibleNext12M: 733,
  totalCowsDryAndLactating: 1115,
  cowsInseminatedPerMonth: 330,
  pregnantCowsPerMonth: 143,
};

export const DEFAULT_CONCEPTION_INPUTS: ConceptionInputs = {
  cows: {
    conventional: 39,
    beef: 30,
    embryos: 0,
    sexedEmbryo: 40,
  },
  heifers: {
    sexedSemen: 55,
    conventional: 70,
    beef: 60,
    embryos: 45,
    sexedEmbryo: 45,
  },
};

export const DEFAULT_STRATEGY_INPUTS: StrategyInputs = {
  heifersGroup: { superior: 42, intermediate: 32, inferior: 26 },
  cowsGroup: { superior: 30, intermediate: 50, inferior: 20 },
  heifersPlan: {
    damGeneticValue: 0,
    firstService: "sexed",
    secondService: "sexed",
    thirdService: "conventional",
  },
  cowsPlan: {
    damGeneticValue: 0,
    firstService: "sexed",
    secondService: "conventional",
    thirdService: "conventional",
  },
};

export const DEFAULT_CALCULATOR_INPUTS: CalculatorInputs = {
  growth: DEFAULT_GROWTH_INPUTS,
  conception: DEFAULT_CONCEPTION_INPUTS,
  strategy: DEFAULT_STRATEGY_INPUTS,
};
