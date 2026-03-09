import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { usePlanStore, AVAILABLE_PTAS, getFemalesByFarm, countFromCategoria, calculateMotherAverages, getBullPTAValue, calculatePopulationStructure } from "../hooks/usePlanStore";
import { useHerdStore } from "../hooks/useHerdStore";
import { useFileStore } from "../hooks/useFileStore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EstruturalPopulacional from "./EstruturalPopulacional";
import PTAMothersTable from "./PTAMothersTable";
import { BullSelector, getBullFieldValue } from "@/components/BullSelector";
import { IM5Configurator, type IM5Config } from "@/components/plano-genetico/IM5Configurator";
import { IM5Results, type IM5Row } from "@/components/plano-genetico/IM5Results";
import { usePlanBulls } from "@/hooks/usePlanBulls";
import { formatPtaValue } from "@/utils/ptaFormat";
import {
  PlanObjectiveProvider,
  usePlanObjective,
  type ObjectiveChoice,
} from "@/providers/PlanObjectiveContext";
import { PlanStepper } from "@/components/plano-genetico/PlanStepper";
import { EmptyChartPlaceholder } from "@/components/plano-genetico/EmptyChartPlaceholder";

/**
 * Projeção Genética MVP – Select Sires (Frontend Only, Single File)
 * ---------------------------------------------------------------
 * - Sem backend / sem banco. Todos os dados são inseridos manualmente.
 * - Persistência local automática em localStorage.
 * - Cálculos em tempo real (doses por categoria, premissas por categoria, PTA mães por categoria).
 * - ROI em R$ baseado no índice econômico selecionado ponderado × nº de bezerras − custo de sêmen.
 * - Gráficos com Chart.js carregado dinamicamente via CDN (jsDelivr).
 * - Exportação PDF com html2canvas + jsPDF (CDN), com fallback para window.print().
 * - Identidade visual Select Sires na UI (cores e tipografia Montserrat sugeridas no index.html do projeto Lovable).
 *
 * Como usar no Lovable:
 * 1) Crie um projeto React/TS no Lovable e adicione este arquivo como App.tsx (ou substitua o App existente).
 * 2) Garanta que index.html tenha a fonte Montserrat (opcional). Este arquivo injeta Chart.js/html2canvas/jsPDF automaticamente.
 * 3) Rode e use o botão "Carregar Dados de Teste" no rodapé do sidebar para validar.
 */

// Paleta
const COLORS = {
  red: "#BE1E2D",
  gray: "#D9D9D9",
  black: "#1C1C1C",
  white: "#F2F2F2",
};

const DEFAULT_IM5_FARM_ID = "065c3148-35f5-45a9-b4b9-5923e75a29be";
const DEFAULT_IM5_PLAN_ID = "SEU_PLAN_ID_AQUI"; // ⚠️ Ajuste para usar o plano selecionado

type BuiltinObjectiveKey = Extract<ObjectiveChoice, { kind: "BUILTIN" }>["key"];

const BUILTIN_OBJECTIVES: { key: BuiltinObjectiveKey; label: string; description: string }[] = [
  {
    key: "HHP$",
    label: "HHP$ — Saúde e Longevidade",
    description: "Priorização de genética voltada a fertilidade, resistência a doenças e vida produtiva das vacas.",
  },
  {
    key: "TPI",
    label: "TPI — Total Performance Index",
    description: "Equilíbrio geral entre produção, conformação e saúde para rebanhos com foco em evolução completa.",
  },
  {
    key: "NM$",
    label: "NM$ — Net Merit Dollar",
    description: "Maximiza retorno econômico combinando produção de leite, sólidos e custos de saúde do rebanho.",
  },
  {
    key: "FM$",
    label: "FM$ — Female Merit",
    description: "Direcionado a fertilidade, produção e longevidade em sistemas comerciais de leite focados em fêmeas.",
  },
  {
    key: "CM$",
    label: "CM$ — Cheese Merit",
    description: "Ênfase em sólidos do leite e qualidade para operações voltadas a queijos e derivados.",
  },
];

const BUILTIN_OBJECTIVE_MAP: Record<BuiltinObjectiveKey, typeof BUILTIN_OBJECTIVES[number]> = BUILTIN_OBJECTIVES.reduce(
  (acc, item) => ({
    ...acc,
    [item.key]: item,
  }),
  {} as Record<BuiltinObjectiveKey, typeof BUILTIN_OBJECTIVES[number]>
);

const labelToBuiltin = new Map<BuiltinObjectiveKey | string, BuiltinObjectiveKey>();
BUILTIN_OBJECTIVES.forEach((item) => {
  labelToBuiltin.set(item.label, item.key);
  labelToBuiltin.set(item.key, item.key);
});
labelToBuiltin.set("HHP$®", "HHP$");

function getObjectiveLabel(choice: ObjectiveChoice | null) {
  if (!choice) return "";
  return BUILTIN_OBJECTIVE_MAP[choice.key]?.label ?? choice.key;
}

function objectiveFromLabel(label: string): ObjectiveChoice | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const builtinKey = labelToBuiltin.get(trimmed as BuiltinObjectiveKey | string);
  if (builtinKey) {
    return { kind: "BUILTIN", key: builtinKey };
  }
  return null;
}

const OBJECTIVE_KEY_TO_PTA_LABELS: Record<BuiltinObjectiveKey, string[]> = {
  "HHP$": ["HHP$®", "HHP$"],
  TPI: ["TPI"],
  "NM$": ["NM$"],
  "FM$": ["FM$"],
  "CM$": ["CM$"],
};

const FALLBACK_ROI_LABELS = ["NM$", "HHP$®", "HHP$", "TPI", "FM$", "CM$"];

function pickDefaultRoiLabel(selectedPTAs: string[], preferred?: string | null) {
  if (!selectedPTAs.length) {
    return null;
  }

  const trimmed = selectedPTAs.map((label) => label.trim());
  const normalizedPreferred = preferred?.trim();

  if (normalizedPreferred) {
    const preferredIndex = trimmed.findIndex((label) => label === normalizedPreferred);
    if (preferredIndex >= 0) {
      return selectedPTAs[preferredIndex];
    }
  }

  for (const candidate of FALLBACK_ROI_LABELS) {
    const candidateIndex = trimmed.findIndex((label) => label === candidate);
    if (candidateIndex >= 0) {
      return selectedPTAs[candidateIndex];
    }
  }

  const dollarIndex = trimmed.findIndex((label) => /\$/.test(label));
  if (dollarIndex >= 0) {
    return selectedPTAs[dollarIndex];
  }

  return selectedPTAs[0] ?? null;
}

function resolveRoiIndexLabel(objective: ObjectiveChoice | null, selectedPTAs: string[]) {
  const trimmedSelected = selectedPTAs.map((label) => label.trim());

  if (objective?.kind === "BUILTIN") {
    const candidates = OBJECTIVE_KEY_TO_PTA_LABELS[objective.key] ?? [];
    const matched = candidates.find((candidate) => trimmedSelected.includes(candidate));
    if (matched) {
      return matched;
    }
  }

  for (const candidate of FALLBACK_ROI_LABELS) {
    if (trimmedSelected.includes(candidate)) {
      return candidate;
    }
  }

  return trimmedSelected[0] ?? null;
}

// Tipos
type CategoryKey = "novilhas" | "primiparas" | "secundiparas" | "multiparas";
const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "novilhas", label: "Novilhas" },
  { key: "primiparas", label: "Primíparas" },
  { key: "secundiparas", label: "Secundíparas" },
  { key: "multiparas", label: "Multíparas" },
];

// Lista completa de PTAs disponíveis (exatos como no banco)
const ALL_PTAS = AVAILABLE_PTAS;

type PTAKey = typeof ALL_PTAS[number];

type SemenType = "Sexado" | "Convencional";

interface FarmInfo {
  farmName: string;
  technician: string;
  date: string; // ISO
  objective: string;
}

interface StructurePopulation {
  total: number;
  novilhas: number;
  primiparas: number;
  secundiparas: number;
  multiparas: number;
}

interface ReproParams {
  // Percentuais em 0-100
  service: Record<CategoryKey, number>; // referência (não usada no fluxo principal)
  conception: Record<CategoryKey, number>;
  preex: Record<CategoryKey, number>;
}

interface MothersPTA {
  values: Record<CategoryKey, Record<string, number>>;
}

interface BullPTA {
  [key: string]: number;
}

interface Bull {
  id: string;
  name: string;
  naab: string;
  empresa?: string;
  semen: SemenType;
  pricePerDose: number; // R$
  doses: Record<CategoryKey, number>; // por categoria
  pta: BullPTA;
}

interface AppState {
  farm: FarmInfo;
  structure: StructurePopulation;
  repro: ReproParams;
  mothers: MothersPTA;
  bulls: Bull[];
  selectedPTAs: PTAKey[]; // até 5 PTAs selecionadas
  numberOfBulls: number; // 1-5 touros
  toolssBulls: any[]; // bulls do ToolSSApp
  selectedClient: any; // cliente selecionado do ToolSSApp
  selectedFarm: any; // fazenda selecionada do ToolSSApp
  autoCalculatePopulation: boolean; // se deve calcular automaticamente a população
}

// ---------- Helpers ----------
const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    isFinite(v) ? v : 0
  );

const NUM = (v: number, digits = 0) =>
  new Intl.NumberFormat("pt-BR", { 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  }).format(isFinite(v) ? Math.round(v * Math.pow(10, digits)) / Math.pow(10, digits) : 0);

// PTA_NUM removed — use formatPtaValue(ptaLabel, value) instead

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// Dinamicamente carrega scripts externos
function useCdnScripts() {
  const [ready, setReady] = useState({ chart: false, h2c: false, jspdf: false });

  useEffect(() => {
    const ensure = (src: string, globalKey: string) =>
      new Promise<void>((resolve) => {
        if ((window as any)[globalKey]) return resolve();
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

    Promise.all([
      ensure("https://cdn.jsdelivr.net/npm/chart.js", "Chart").then(() =>
        setReady((r) => ({ ...r, chart: true }))
      ),
      ensure("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", "html2canvas").then(
        () => setReady((r) => ({ ...r, h2c: true }))
      ),
      ensure("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", "jspdf").then(() =>
        setReady((r) => ({ ...r, jspdf: true }))
      ),
    ]).catch(() => {});
  }, []);

  return ready;
}

// Category mapping for backwards compatibility
const CATEGORY_MAP = {
  novilhas: "heifers",
  primiparas: "primiparous", 
  secundiparas: "secundiparous",
  multiparas: "multiparous"
};

// ---------- Estado & Persistência ----------
const LS_KEY = "projGen_MVP_state_v2";

function useAppState() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        // Merge saved data with default state, ensuring we have all required fields
        const today = new Date();
        return {
          farm: {
            farmName: "",
            technician: "",
            date: today.toISOString().slice(0, 10),
            objective: "",
          },
          structure: { total: 0, novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
          repro: {
            service: { novilhas: 65, primiparas: 60, secundiparas: 60, multiparas: 55 },
            conception: { novilhas: 55, primiparas: 37.5, secundiparas: 32.5, multiparas: 30.5 },
            preex: { novilhas: 35, primiparas: 22.5, secundiparas: 20, multiparas: 17.5 },
          },
          mothers: {
            values: {
              novilhas: {},
              primiparas: {},
              secundiparas: {},
              multiparas: {},
            },
          },
          bulls: [],
          selectedPTAs: ["NM$", "TPI", "PL", "SCS", "DPR"],
          numberOfBulls: 3,
          toolssBulls: [], // Never persisted
          selectedClient: null, // Never persisted
          selectedFarm: null, // Never persisted
          autoCalculatePopulation: false,
          ...parsed // Override with saved values
        } as AppState;
      }
    } catch (error) {
      // Failed to load state from localStorage
    }
    
    // Default state if loading fails
    const today = new Date();
    return {
      farm: {
        farmName: "",
        technician: "",
        date: today.toISOString().slice(0, 10),
        objective: "",
      },
      structure: { total: 0, novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
      repro: {
        service: { novilhas: 65, primiparas: 60, secundiparas: 60, multiparas: 55 },
        conception: { novilhas: 55, primiparas: 37.5, secundiparas: 32.5, multiparas: 30.5 },
        preex: { novilhas: 35, primiparas: 22.5, secundiparas: 20, multiparas: 17.5 },
      },
      mothers: {
        values: {
          novilhas: {},
          primiparas: {},
          secundiparas: {},
          multiparas: {},
        },
      },
      bulls: [],
      selectedPTAs: ["NM$", "TPI", "PL", "SCS", "DPR"],
      numberOfBulls: 3,
      toolssBulls: [],
      selectedClient: null,
      selectedFarm: null,
      autoCalculatePopulation: false,
    } as AppState;
  });

  // Cleanup old localStorage data on mount to prevent quota issues
  useEffect(() => {
    const cleanupOldData = () => {
      const keysToRemove = [
        'projGen_MVP_state_v1', 
        'toolss_old_data',
        'old_female_data',
        'old_bull_data'
      ];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      });
    };
    cleanupOldData();
  }, []);

  useEffect(() => {
    try {
      // Only persist essential data, not heavy objects like toolssBulls
      const persistedState = {
        farm: state.farm,
        structure: state.structure,
        repro: state.repro,
        mothers: state.mothers,
        bulls: state.bulls, // Keep user-configured bulls but not the full database
        selectedPTAs: state.selectedPTAs,
        numberOfBulls: state.numberOfBulls,
        autoCalculatePopulation: state.autoCalculatePopulation
        // Exclude: toolssBulls, selectedClient, selectedFarm (too heavy)
      };
      
      localStorage.setItem(LS_KEY, JSON.stringify(persistedState));
    } catch (error) {
      // Clear old data if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear old keys
        const keysToRemove = ['projGen_MVP_state_v1', 'toolss_old_data'];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {}
        });
        
        // Try again with minimal state
        try {
          const minimalState = {
            selectedPTAs: state.selectedPTAs,
            numberOfBulls: state.numberOfBulls
          };
          localStorage.setItem(LS_KEY, JSON.stringify(minimalState));
        } catch (e) {
          // Could not save even minimal state
        }
      }
    }
  }, [state.farm, state.structure, state.repro, state.mothers, state.bulls, state.selectedPTAs, state.numberOfBulls, state.autoCalculatePopulation]);

  // Carrega dados do Supabase (não mais do localStorage)
  useEffect(() => {
    // No longer loading from localStorage since we're using Supabase directly
    // State will be managed by individual components that need bull data
    // Using Supabase directly
  }, []);

  // Auto-load herd data on page load - prioritize useHerdStore (from HerdPage)
  useEffect(() => {
    const loadHerdData = () => {
      try {
        const { selectedHerdId } = useHerdStore.getState();
        const { selectedFarmId } = usePlanStore.getState();
        
        // Priority: 1) useHerdStore (from entering farm), 2) usePlanStore (manual selection)
        const farmId = selectedHerdId || selectedFarmId;
        if (farmId) {
          const populationStructure = calculatePopulationStructure(farmId);
          
          // Get farm data for calculating mother averages
          const females = getFemalesByFarm(farmId);
          const farmData = { females };
          const motherAverages = calculateMotherAverages(farmData, usePlanStore.getState().selectedPTAList);
          
          setState(prev => ({
            ...prev,
            structure: {
              total: populationStructure.total,
              novilhas: populationStructure.heifers || 0,
              primiparas: populationStructure.primiparous || 0,
              secundiparas: populationStructure.secundiparous || 0,
              multiparas: populationStructure.multiparous || 0
            },
            mothers: {
              values: {
                novilhas: motherAverages.heifers || {},
                primiparas: motherAverages.primiparous || {},
                secundiparas: motherAverages.secundiparous || {},
                multiparas: motherAverages.multiparous || {}
              }
            },
            autoCalculatePopulation: true
          }));
          
          toast.success('Rebanho carregado automaticamente');
        } else {
          // No farm selected for auto-loading
        }
      } catch (error) {
        console.error('❌ Erro ao carregar rebanho:', error);
        toast.error('Erro ao carregar rebanho automaticamente');
      }
    };
    
    loadHerdData();
  }, []);

  const loadTestData = () => {
    const today = new Date().toISOString().slice(0, 10);
    const test: AppState = {
      farm: {
        farmName: "Fazenda Floresta",
        technician: "Diego",
        date: today,
        objective: "Maximizar NM$ com custo competitivo por bezerra e foco em longevidade.",
      },
      structure: { total: 600, novilhas: 180, primiparas: 140, secundiparas: 140, multiparas: 140 },
      repro: {
        service: { novilhas: 60, primiparas: 55, secundiparas: 50, multiparas: 45 },
        conception: { novilhas: 45, primiparas: 40, secundiparas: 37, multiparas: 35 },
        preex: { novilhas: 92, primiparas: 90, secundiparas: 88, multiparas: 86 },
      },
      mothers: {
        values: {
          novilhas: { "NM$": 420, "TPI": 2400, "PL": 350, "SCS": -0.15, "DPR": 1.2 },
          primiparas: { "NM$": 380, "TPI": 2200, "PL": 300, "SCS": -0.10, "DPR": 1.0 },
          secundiparas: { "NM$": 340, "TPI": 2000, "PL": 260, "SCS": -0.05, "DPR": 0.8 },
          multiparas: { "NM$": 300, "TPI": 1800, "PL": 220, "SCS": 0.00, "DPR": 0.6 },
        },
      },
      bulls: [
        {
          id: "bull1",
          name: "Bull Alpha",
          naab: "7HO17191",
          empresa: "Select Sires",
          semen: "Sexado",
          pricePerDose: 155,
          doses: { novilhas: 120, primiparas: 60, secundiparas: 20, multiparas: 0 },
          pta: { "NM$": 820, "TPI": 2800, "PL": 900, "SCS": -0.25, "DPR": 1.8 },
        },
        {
          id: "bull2",
          name: "Bull Beta",
          naab: "7HO17192",
          empresa: "Select Sires",
          semen: "Convencional",
          pricePerDose: 75,
          doses: { novilhas: 40, primiparas: 90, secundiparas: 70, multiparas: 60 },
          pta: { "NM$": 650, "TPI": 2500, "PL": 750, "SCS": -0.18, "DPR": 1.2 },
        },
        {
          id: "bull3",
          name: "Bull Core",
          naab: "7HO17193",
          empresa: "Select Sires",
          semen: "Sexado",
          pricePerDose: 135,
          doses: { novilhas: 30, primiparas: 30, secundiparas: 40, multiparas: 60 },
          pta: { "NM$": 720, "TPI": 2600, "PL": 820, "SCS": -0.20, "DPR": 1.4 },
        },
      ],
      selectedPTAs: ["NM$", "TPI", "PL", "SCS", "DPR"],
      numberOfBulls: 3,
      toolssBulls: [],
      selectedClient: null,
      selectedFarm: null,
      autoCalculatePopulation: false,
    };
    setState(test);
  };

  const clearAll = () => {
    localStorage.removeItem(LS_KEY);
    window.location.reload();
  };

  return { state, setState, loadTestData, clearAll };
}

type RoiBasis =
  | { mode: "INDEX"; label: string | null }
  | { mode: "IM5"; config: IM5Config | null; rows: IM5Row[] };

function useCalculations(state: AppState, roiBasis: RoiBasis) {
  const planStore = usePlanStore();

  const result = useMemo(() => {
    const semenFemale = (semen: SemenType) => (semen === "Sexado" ? 0.9 : 0.47);

    const selectedPTAs = planStore.selectedPTAList;
    const isIM5Mode = roiBasis.mode === "IM5" && roiBasis.config;
    const fallbackRoiLabel = isIM5Mode
      ? "IM5$"
      : pickDefaultRoiLabel(selectedPTAs, roiBasis.mode === "INDEX" ? roiBasis.label : null);
    const im5RowsById =
      isIM5Mode
        ? new Map(roiBasis.rows.map((row) => [row.id, row]))
        : new Map<string, IM5Row>();
    const im5FemaleRate = isIM5Mode ? clamp01(roiBasis.config?.femaleRate ?? 0.47) : null;
    const im5Conception = isIM5Mode ? clamp01(roiBasis.config?.conceptionRate ?? 0.35) : null;
    let im5WeightedSum = 0;
    let im5TotalBez = 0;

    const byBull = state.bulls.slice(0, state.numberOfBulls).map((b) => {
      const im5Row = isIM5Mode ? im5RowsById.get(b.id) : null;
      const femaleRate = isIM5Mode ? im5FemaleRate ?? semenFemale(b.semen) : semenFemale(b.semen);
      const dosesTotal = CATEGORIES.reduce((s, c) => s + (b.doses[c.key] || 0), 0);
      const valorTotal = dosesTotal * (b.pricePerDose || 0);

      let bezerrasTotais = 0;
      const bezPorCat: Record<CategoryKey, number> = {
        novilhas: 0,
        primiparas: 0,
        secundiparas: 0,
        multiparas: 0,
      };

      const ptaPondNumerator: Record<string, number> = {};
      selectedPTAs.forEach(ptaLabel => {
        ptaPondNumerator[ptaLabel] = 0;
      });

      CATEGORIES.forEach(({ key }) => {
        const doses = b.doses[key] || 0;
        const conc = isIM5Mode
          ? im5Conception ?? clamp01((state.repro.conception[key] || 0) / 100)
          : clamp01((state.repro.conception[key] || 0) / 100);
        const preex = clamp01((state.repro.preex[key] || 0) / 100);
        const prenhezes = doses * conc;
        const prenhezesConfirm = prenhezes * preex;
        const bez = prenhezesConfirm * femaleRate;
        bezPorCat[key] = bez;
        bezerrasTotais += bez;

        selectedPTAs.forEach((ptaLabel) => {
          const categoryKey = CATEGORY_MAP[key as keyof typeof CATEGORY_MAP];
          const ptaMae = planStore.motherAverages[categoryKey]?.[ptaLabel] || 0;
          const ptaTouro = (b.pta[ptaLabel] === null ? 0 : b.pta[ptaLabel]) || 0;
          const ptaFilha = (ptaMae + ptaTouro) / 2;
          ptaPondNumerator[ptaLabel] += ptaFilha * bez;
        });
      });

      const ptaPond: Record<string, number> = {};
      selectedPTAs.forEach((ptaLabel) => {
        ptaPond[ptaLabel] = bezerrasTotais > 0 ? ptaPondNumerator[ptaLabel] / bezerrasTotais : 0;
      });

      const custoPorBezerra = bezerrasTotais > 0 ? valorTotal / bezerrasTotais : 0;
      const im5Value = isIM5Mode ? im5Row?.im5 ?? 0 : 0;
      if (isIM5Mode && bezerrasTotais > 0) {
        im5WeightedSum += im5Value * bezerrasTotais;
        im5TotalBez += bezerrasTotais;
      }
      const retornoGen =
        isIM5Mode
          ? im5Value * bezerrasTotais
          : fallbackRoiLabel
          ? (ptaPond[fallbackRoiLabel] || 0) * bezerrasTotais
          : 0;
      const roi = retornoGen - valorTotal;

      return {
        bull: b,
        dosesTotal,
        valorTotal,
        femaleRate,
        bezPorCat,
        bezerrasTotais,
        ptaPond,
        im5Value,
        custoPorBezerra,
        retornoGen,
        roi,
      };
    });

    // Totais do plano
    const totalBez = byBull.reduce((s, r) => s + r.bezerrasTotais, 0);
    const totalValor = byBull.reduce((s, r) => s + r.valorTotal, 0);

    const ptaPondGeral: Record<string, number> = {};
    selectedPTAs.forEach(ptaLabel => {
      ptaPondGeral[ptaLabel] = 0;
    });

    if (totalBez > 0) {
      selectedPTAs.forEach((ptaLabel) => {
        const num = byBull.reduce((s, r) => s + (r.ptaPond[ptaLabel] || 0) * r.bezerrasTotais, 0);
        ptaPondGeral[ptaLabel] = num / totalBez;
      });
    }

    const custoMedioBezerra = totalBez > 0 ? totalValor / totalBez : 0;
    const im5AverageValue = im5TotalBez > 0 ? im5WeightedSum / im5TotalBez : 0;

    return {
      byBull,
      totalBez,
      totalValor,
      ptaPondGeral,
      custoMedioBezerra,
      roiIndexLabel: fallbackRoiLabel,
      im5AverageValue,
    };
  }, [state, planStore.selectedPTAList, planStore.motherAverages, roiBasis]);

  return result;
}

// ---------- UI Primitives ----------
function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.gray}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ color: COLORS.black, fontWeight: 700, fontSize: 18 }}>{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, color: COLORS.black, fontWeight: 600 }}>{children}</label>;
}

function Input({ value, onChange, type = "text", placeholder, min, disabled }: { value: any; onChange: (v: any) => void; type?: string; placeholder?: string; min?: number; disabled?: boolean }) {
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      type={type}
      placeholder={placeholder}
      min={min}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${COLORS.gray}`,
        borderRadius: 10,
        outline: "none",
        background: disabled ? "#f5f5f5" : "#fff",
        color: disabled ? "#666" : "inherit",
        cursor: disabled ? "not-allowed" : "inherit",
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: any; onChange: (v: any) => void; options: string[] | { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 12px", border: `1px solid ${COLORS.gray}`, borderRadius: 10, background: "#fff" }}
    >
      {options.map((op) => {
        const optValue = typeof op === 'string' ? op : op.value;
        const optLabel = typeof op === 'string' ? op : op.label;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
}

function Button({
  onClick,
  children,
  variant = "primary" as const,
  ariaLabel,
  disabled,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const styles =
    variant === "primary"
      ? { background: COLORS.red, color: "#fff", border: "none" }
      : { background: "transparent", color: COLORS.black, border: `1px solid ${COLORS.gray}` };
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        minHeight: 36,
        borderRadius: 8,
        fontWeight: 700,
        fontSize: 14,
        lineHeight: "20px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...styles
      }}
    >
      {children}
    </button>
  );
}

// ---------- Pages ----------
function PagePlano({ st, setSt }: { st: AppState; setSt: React.Dispatch<React.SetStateAction<AppState>> }) {
  const planStore = usePlanStore();
  
  // Load ToolSS data 
  const [toolssClients, setToolssClients] = useState<any[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<any>(null);
  
  // Anti-loop hash ref for population calculation
  const prevHashRef = useRef<string>('');
  
  useEffect(() => {
    // No longer loading from localStorage - using Supabase directly
    // Using Supabase directly
  }, [planStore.selectedFarmId]);
  
  // ÚNICO efeito anti-loop para população (Item 4)
  useEffect(() => {
    // Só recalcula em modo auto e com fazenda selecionada
    if (planStore.populationMode !== 'auto' || !planStore.selectedFarmId) return;

    // Ler a lista (Item 1) e calcular next = countFromCategoria(list)
    const females = getFemalesByFarm(planStore.selectedFarmId);
    
    // Hash de estabilidade: muda só quando muda a fonte
    const srcHash = planStore.selectedFarmId + '|' + (Array.isArray(females) ? females.length : 0);
    if (prevHashRef.current === srcHash) return; // Evita recálculo redundante

    const next = countFromCategoria(females || []);
    prevHashRef.current = srcHash;

    // Só aplica setPopulationCounts(next) se houver mudança real (comparação dos 5 números)
    const curr = planStore.populationCounts;
    const changed = !curr || curr.heifers !== next.heifers || curr.primiparous !== next.primiparous ||
                    curr.secundiparous !== next.secundiparous || curr.multiparous !== next.multiparous || curr.total !== next.total;
    if (changed) {
      planStore.setPopulationCounts(next);
    }
  }, [planStore.populationMode, planStore.selectedFarmId]);

  const handleRecalculate = () => {
    if (planStore.selectedFarmId) {
      const females = getFemalesByFarm(planStore.selectedFarmId);
      const next = countFromCategoria(females || []);
      // Force recalculation by updating hash
      prevHashRef.current = planStore.selectedFarmId + '|' + Date.now();
      planStore.setPopulationCounts(next);
    }
  };

  // Update individual population counts in manual mode
  const updatePopulationCount = (field: keyof typeof planStore.populationCounts, value: number) => {
    if (planStore.populationMode === 'manual') {
      const newCounts = { ...planStore.populationCounts, [field]: value };
      // Update total when individual counts change
      if (field !== 'total') {
        newCounts.total = newCounts.heifers + newCounts.primiparous + newCounts.secundiparous + newCounts.multiparous;
      }
      planStore.setPopulationCounts(newCounts);
    }
  };

  const selectedClientData = toolssClients.find(c => 
    selectedFarm && c.farms.some((f: any) => f.id === selectedFarm.id)
  );
  
  // Auto-calculate mother averages when farm or PTAs change
  useEffect(() => {
    if (selectedFarm && planStore.selectedPTAList.length > 0) {
      const averages = calculateMotherAverages(selectedFarm, planStore.selectedPTAList);
      planStore.setMotherAverages(averages);
    }
  }, [selectedFarm, planStore.selectedPTAList]);
  const farms = selectedClientData?.farms || [];
  
  // Backwards compatibility - sync with old state
  const total = planStore.populationCounts.total;
  const overflow = false; // Auto-calculated, no overflow possible

  return (
    <div>
      <Section title="Informações Gerais do Plano">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <Label>Nome da Fazenda</Label>
            <Input value={st.farm.farmName} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, farmName: v } }))} placeholder="Digite o nome da fazenda" />
          </div>
          <div>
            <Label>Nome do Técnico</Label>
            <Input value={st.farm.technician} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, technician: v } }))} placeholder="Digite o nome do técnico" />
          </div>
          <div>
            <Label>Data da Simulação</Label>
            <Input type="date" value={st.farm.date} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, date: v } }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>Objetivo Genético do Rebanho</Label>
            <Input value={st.farm.objective} onChange={(v) => setSt((s) => ({ ...s, farm: { ...s.farm, objective: v } }))} placeholder="Ex.: Maximizar NM$ e longevidade com custo competitivo" />
          </div>
        </div>
      </Section>

          {/* Seleção de Cliente e Fazenda do ToolSSApp */}
      {toolssClients.length > 0 && (
        <Section title="🎯 Dados do Rebanho (ToolSS)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>Cliente/Rebanho</Label>
              <Select 
                value={selectedClientData?.id ? selectedClientData.id.toString() : ""} 
                onChange={(v) => {
                  if (v === "") {
                    setSelectedFarm(null);
                    planStore.setSelectedFarmId(null);
                  } else {
                    const client = toolssClients.find(c => c.id === parseInt(v));
                    if (client && client.farms.length > 0) {
                      // Auto-select first farm if only one
                      if (client.farms.length === 1) {
                        const farm = client.farms[0];
                        setSelectedFarm(farm);
                        planStore.setSelectedFarmId(farm.id.toString());
                      } else {
                        setSelectedFarm(null);
                        planStore.setSelectedFarmId(null);
                      }
                    }
                  }
                }}
                options={[
                  { value: "", label: "Selecione um cliente" },
                  ...toolssClients.map(c => ({ value: c.id.toString(), label: `#${c.id} - ${c.nome}` }))
                ]}
              />
            </div>
            <div>
              <Label>Fazenda</Label>
              <Select 
                value={selectedFarm?.id ? selectedFarm.id.toString() : ""} 
                onChange={(v) => {
                  if (v === "") {
                    setSelectedFarm(null);
                    planStore.setSelectedFarmId(null);
                  } else {
                    const farm = farms.find((f: any) => f.id === parseInt(v));
                    if (farm) {
                      setSelectedFarm(farm);
                      planStore.setSelectedFarmId(farm.id.toString());
                    }
                  }
                }}
                options={[
                  { value: "", label: "Selecione uma fazenda" },
                  ...farms.map((f: any) => ({ value: f.id.toString(), label: `${f.nome} (${f.females?.length || 0} fêmeas)` }))
                ]}
              />
            </div>
          </div>
          {selectedFarm && (
            <div style={{ marginTop: 12, padding: 10, background: "#f0f9ff", borderRadius: 8, fontSize: 12 }}>
              <strong>Rebanho selecionado:</strong> {selectedFarm.nome}<br/>
              <strong>Total de fêmeas:</strong> {selectedFarm.females?.length || 0}<br/>
              <strong>Distribuição automática por categoria será calculada</strong>
            </div>
          )}
        </Section>
      )}

      {/* Seleção de PTAs */}
      <Section title="📊 Seleção de PTAs para Análise">
        <div style={{ marginBottom: 12 }}>
          <Label>Selecione até 5 PTAs para análise (atual: {planStore.selectedPTAList.length}/5)</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginTop: 8 }}>
            {ALL_PTAS.map(pta => {
              const isSelected = planStore.selectedPTAList.includes(pta);
              return (
                <label key={pta} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 4, 
                  fontSize: 11,
                  padding: 4,
                  borderRadius: 4,
                  background: isSelected ? "#e0f2fe" : "transparent",
                  cursor: "pointer"
                }}>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (planStore.selectedPTAList.length < 5) {
                          planStore.setSelectedPTAList([...planStore.selectedPTAList, pta]);
                        } else {
                          toast.error("Máximo de 5 PTAs permitidas.");
                        }
                      } else {
                        planStore.setSelectedPTAList(planStore.selectedPTAList.filter(k => k !== pta));
                      }
                    }}
                    disabled={!isSelected && planStore.selectedPTAList.length >= 5}
                  />
                  {pta}
                </label>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="📋 Premissas Reprodutivas da Fazenda">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Estrutura populacional */}
          <EstruturalPopulacional />

          {/* Parâmetros reprodutivos */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8
              }}
            >
              <h3 style={{ fontWeight: 700 }}>Parâmetros Reprodutivos por Categoria</h3>
              <Button
                variant="primary"
                ariaLabel="Incluir dados de referência"
                onClick={() => {
                  setSt(s => ({
                    ...s,
                    repro: {
                      ...s.repro,
                      service: {
                        novilhas: 65,
                        primiparas: 60,
                        secundiparas: 60,
                        multiparas: 55
                      },
                      conception: {
                        novilhas: 55,
                        primiparas: 37.5,
                        secundiparas: 32.5,
                        multiparas: 30.5
                      },
                      preex: {
                        novilhas: 35,
                        primiparas: 22.5,
                        secundiparas: 20,
                        multiparas: 17.5
                      }
                    }
                  }));
                }}
              >
                📋 Restaurar padrões
              </Button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: COLORS.gray }}>
                  <th style={{ textAlign: "left", padding: 6 }}>Categoria</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Tx. Serviço (%)
                    <span title="Número de IA / número de fêmeas expostas"> ⓘ</span>
                  </th>
                  <th style={{ textAlign: "left", padding: 6 }}>Tx. Concepção (%)
                    <span title="Prenhezes / IA"> ⓘ</span>
                  </th>
                  <th style={{ textAlign: "left", padding: 6 }}>Tx. Pré-ex (%)
                    <span title="Prenhezes confirmadas no pré-exame"> ⓘ</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {CATEGORIES.map(({ key, label }) => (
                  <tr key={key}>
                    <td style={{ padding: 6 }}>{label}</td>
                    <td style={{ padding: 6 }}>
                      <Input
                        type="number"
                        min={0}
                        value={st.repro.service[key]}
                        onChange={(v) => setSt((s) => ({ ...s, repro: { ...s.repro, service: { ...s.repro.service, [key]: v === "" ? 0 : v } } }))}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <Input
                        type="number"
                        min={0}
                        value={st.repro.conception[key]}
                        onChange={(v) => setSt((s) => ({ ...s, repro: { ...s.repro, conception: { ...s.repro.conception, [key]: v === "" ? 0 : v } } }))}
                      />
                    </td>
                    <td style={{ padding: 6 }}>
                      <Input
                        type="number"
                        min={0}
                        value={st.repro.preex[key]}
                        onChange={(v) => setSt((s) => ({ ...s, repro: { ...s.repro, preex: { ...s.repro.preex, [key]: v === "" ? 0 : v } } }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 12, color: COLORS.black }}>
              * No MVP, a Tx. Serviço é informativa (não entra no fluxo principal para evitar dupla contagem).
            </div>
          </div>
        </div>

        {/* PTA das mães */}
        <PTAMothersTable 
          selectedPTAs={planStore.selectedPTAList} 
          className="mt-4"
        />
      </Section>
    </div>
  );
}

function PageBulls({ st, setSt, onGoToResults }: { st: AppState; setSt: React.Dispatch<React.SetStateAction<AppState>>; onGoToResults?: () => void }) {
  const planStore = usePlanStore();

  // Inicializa touros se necessário
  useEffect(() => {
    if (st.bulls.length < st.numberOfBulls) {
      const newBulls = [];
      for (let i = st.bulls.length; i < st.numberOfBulls; i++) {
        const defaultPTA: Record<string, number> = {};
        planStore.selectedPTAList.forEach(ptaLabel => {
          defaultPTA[ptaLabel] = 0;
        });

        newBulls.push({
          id: `bull${i + 1}`,
          name: "",
          naab: "",
          empresa: "",
          semen: "Sexado" as SemenType,
          pricePerDose: 0,
          doses: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
          pta: defaultPTA,
        });
      }
      if (newBulls.length > 0) {
        setSt(s => ({ ...s, bulls: [...s.bulls, ...newBulls] }));
      }
    }
  }, [st.numberOfBulls, st.bulls.length, planStore.selectedPTAList.length]);

  return (
    <div>
      {/* Seleção do número de touros */}
      <Section title="🐂 Configuração de Touros">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <Label>Número de touros para análise (1-5)</Label>
            <Select
              value={st.numberOfBulls}
              onChange={(v) => setSt(s => ({ ...s, numberOfBulls: parseInt(v) }))}
              options={[
                { value: "1", label: "1 touro" },
                { value: "2", label: "2 touros" },
                { value: "3", label: "3 touros" },
                { value: "4", label: "4 touros" },
                { value: "5", label: "5 touros" },
              ]}
            />
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <div style={{ fontSize: 12, color: COLORS.black }}>
              PTAs selecionadas: {planStore.selectedPTAList.join(", ")}
            </div>
          </div>
        </div>
      </Section>

      {/* Configuração de cada touro */}
      {st.bulls.slice(0, st.numberOfBulls).map((b, idx) => (
        <Section key={b.id} title={`Touro ${idx + 1}`}>
          {/* Seleção do touro — campo único com autocomplete */}
          <div style={{ marginBottom: 12 }}>
            <BullSelector
              label={`Selecionar Touro ${idx + 1}`}
              value={b.naab ? {
                id: b.naab,
                code: b.naab,
                name: b.name || "",
                company: b.empresa || ""
              } : null}
              onChange={(bull) => {
                if (!bull) {
                  // Limpar touro
                  setSt(s => ({
                    ...s,
                    bulls: s.bulls.map((bullItem, i) =>
                      i === idx ? {
                        ...bullItem,
                        name: "",
                        naab: "",
                        empresa: "",
                        pta: Object.fromEntries(planStore.selectedPTAList.map(pta => [pta, 0]))
                      } : bullItem
                    )
                  }));
                } else {
                  // Preencher todos os campos automaticamente
                  const updatedPTA: Record<string, number> = {};
                  planStore.selectedPTAList.forEach(ptaLabel => {
                    updatedPTA[ptaLabel] = getBullFieldValue(bull, ptaLabel);
                  });

                  setSt(s => ({
                    ...s,
                    bulls: s.bulls.map((bullItem, i) =>
                      i === idx ? {
                        ...bullItem,
                        name: bull.name || "",
                        naab: bull.code || "",
                        empresa: bull.company || "",
                        pta: updatedPTA
                      } : bullItem
                    )
                  }));
                }
              }}
            />
            {b.naab && Object.values(b.pta).some(v => v !== null && v !== 0) && (
              <div style={{ marginTop: 4, fontSize: 11, color: "#16a34a" }}>
                ✅ PTAs carregadas automaticamente para as {planStore.selectedPTAList.length} características selecionadas
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
            <div>
              <Label>Nome do Touro</Label>
              <Input value={b.name} disabled={!!b.naab} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, name: v } : bb)) }))} placeholder="Preenchido ao selecionar touro" />
            </div>
            <div>
              <Label>NAAB</Label>
              <Input value={b.naab} disabled={!!b.naab} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, naab: v } : bb)) }))} placeholder="NAAB" />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={b.empresa || ""} disabled={!!b.naab} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, empresa: v } : bb)) }))} placeholder="Empresa" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
            <div>
              <Label>Tipo de Sêmen</Label>
              <Select value={b.semen} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, semen: v as SemenType } : bb)) }))} options={["Sexado", "Convencional"]} />
            </div>
            <div>
              <Label>Preço por dose (R$)</Label>
              <Input type="number" min={0} value={b.pricePerDose} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, pricePerDose: v === "" ? 0 : v } : bb)) }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
            {CATEGORIES.map(({ key, label }) => (
              <div key={key}>
                <Label>{label} – Nº Doses</Label>
                <Input
                  type="number"
                  min={0}
                  value={b.doses[key]}
                  onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, doses: { ...bb.doses, [key]: v === "" ? 0 : v } } : bb)) }))}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            <h4 style={{ marginBottom: 6, fontWeight: 700 }}>PTAs do Touro</h4>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(planStore.selectedPTAList.length, 5)}, 1fr)`, gap: 8 }}>
              {planStore.selectedPTAList.map((ptaLabel) => (
                <div key={ptaLabel}>
                  <Label>
                    {ptaLabel}
                    {b.pta[ptaLabel] !== null && b.pta[ptaLabel] !== 0 && (
                      <span style={{ fontSize: "10px", color: "#16a34a", marginLeft: "4px" }}>✓</span>
                    )}
                  </Label>
                  <Input
                    type="text"
                    value={b.pta[ptaLabel] === null ? "—" : (b.pta[ptaLabel] || 0)}
                    onChange={(v) => {
                      if (v === "—") return; // Don't allow editing "—"
                      setSt((s) => ({ 
                        ...s, 
                        bulls: s.bulls.map((bb, i) => (
                          i === idx ? { 
                            ...bb, 
                            pta: { ...bb.pta, [ptaLabel]: v === "" ? 0 : parseFloat(v) || 0 } 
                          } : bb
                        )) 
                      }))
                    }}
                    disabled={b.pta[ptaLabel] === null}
                  />
                </div>
              ))}
            </div>
            {b.naab && Object.values(b.pta).some(v => v !== null && v !== 0) && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#16a34a" }}>
                ✅ PTAs carregadas automaticamente do banco de touros
              </div>
            )}
          </div>
        </Section>
      ))}

      {/* Botão "Ir para Resultados" quando há touro configurado */}
      {onGoToResults && st.bulls.slice(0, st.numberOfBulls).some((b) =>
        CATEGORIES.some(({ key }) => (b.doses[key] || 0) > 0)
      ) && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Button onClick={onGoToResults}>
            Ir para Resultados →
          </Button>
        </div>
      )}
    </div>
  );
}

function ChartCanvas({ id, height = 280 }: { id: string; height?: number }) {
  return <canvas id={id} style={{ width: "100%", height }} />;
}

function useCharts() {
  const ready = useCdnScripts();
  const createChart = (id: string, config: any) => {
    if (!(window as any).Chart) return;
    const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext("2d");
    if (!ctx) return;
    // @ts-ignore
    const ch = new (window as any).Chart(ctx, config);
    return ch;
  };
  return { ready, createChart };
}

function RoiIndexSelector({
  options,
  value,
  onSelect,
}: {
  options: string[];
  value: string | null;
  onSelect: (label: string) => void;
}) {
  if (!options.length) {
    return (
      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #f59e0b",
          borderRadius: 10,
          padding: 12,
          fontSize: 13,
          color: COLORS.black,
        }}
      >
        Adicione até 5 características no plano genético para escolher qual índice será usado na fórmula do ROI.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.black }}>
        Escolha qual característica alimenta a fórmula do ROI:
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((label) => {
          const isActive = value?.trim() === label.trim();
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              aria-pressed={isActive}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: isActive ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.gray}`,
                background: isActive ? "#fde8ec" : "#fff",
                fontWeight: 700,
                fontSize: 13,
                color: COLORS.black,
                cursor: "pointer",
                minWidth: 110,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                boxShadow: isActive ? "0 0 0 2px rgba(190, 30, 45, 0.12)" : "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoiBasisSelector({
  options,
  roiMode,
  onModeChange,
  roiIndexChoice,
  onSelectIndex,
  im5Ready,
  hasIm5Config,
  im5Traits,
}: {
  options: string[];
  roiMode: "INDEX" | "IM5";
  onModeChange: (mode: "INDEX" | "IM5") => void;
  roiIndexChoice: string | null;
  onSelectIndex: (label: string) => void;
  im5Ready: boolean;
  hasIm5Config: boolean;
  im5Traits: string[];
}) {
  const buttonBaseStyle = {
    padding: "10px 14px",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    minWidth: 150,
    display: "flex",
    alignItems: "center",
    justifyContent: "center" as const,
    gap: 6,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onModeChange("INDEX")}
          style={{
            ...buttonBaseStyle,
            border: roiMode === "INDEX" ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.gray}`,
            background: roiMode === "INDEX" ? "#fde8ec" : "#fff",
            color: COLORS.black,
            boxShadow: roiMode === "INDEX" ? "0 0 0 2px rgba(190, 30, 45, 0.12)" : "none",
          }}
        >
          Índices prontos
        </button>
        <button
          type="button"
          onClick={() => hasIm5Config && onModeChange("IM5")}
          disabled={!hasIm5Config}
          style={{
            ...buttonBaseStyle,
            border:
              roiMode === "IM5" ? `2px solid ${COLORS.red}` : `1px solid ${COLORS.gray}`,
            background: roiMode === "IM5" ? "#fde8ec" : "#fff",
            color: hasIm5Config ? COLORS.black : "#9ca3af",
            boxShadow: roiMode === "IM5" ? "0 0 0 2px rgba(190, 30, 45, 0.12)" : "none",
            opacity: hasIm5Config ? 1 : 0.6,
            cursor: hasIm5Config ? "pointer" : "not-allowed",
          }}
        >
          IM5$ personalizado
        </button>
      </div>

      {roiMode === "INDEX" ? (
        <RoiIndexSelector options={options} value={roiIndexChoice} onSelect={onSelectIndex} />
      ) : (
        <div
          style={{
            border: `1px solid ${im5Ready ? COLORS.red : COLORS.gray}`,
            borderRadius: 10,
            padding: 12,
            background: im5Ready ? "#fff5f5" : "#f8fafc",
            color: COLORS.black,
            fontSize: 13,
          }}
        >
          {im5Ready ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>IM5$ ativo na fórmula do ROI</div>
              <div style={{ marginBottom: 4 }}>
                Pesos aplicados para os traços: {im5Traits.join(", ") || "–"}.
              </div>
              <div>Atualize os pesos ou clique em “Calcular” novamente para recalcular o ROI.</div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Configure o IM5$</div>
              <div>
                Defina os traços, pesos e clique em “Calcular” para liberar o IM5$ na fórmula do ROI.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PageResults({ st }: { st: AppState }) {
  const planStore = usePlanStore();
  const farmIdForIM5 = planStore.selectedFarmId ?? DEFAULT_IM5_FARM_ID;
  const { bulls: planBulls, loading: im5Loading, error: im5Error } = usePlanBulls(DEFAULT_IM5_PLAN_ID);
  const [im5Config, setIm5Config] = useState<IM5Config | null>(null);
  const [im5Rows, setIm5Rows] = useState<IM5Row[]>([]);
  const [roiMode, setRoiMode] = useState<"INDEX" | "IM5">("INDEX");
  const selectedPTAs = planStore.selectedPTAList;
  const { objective } = usePlanObjective();
  const preferredRoiIndexLabel = resolveRoiIndexLabel(objective, selectedPTAs);
  const [roiIndexChoice, setRoiIndexChoice] = useState<string | null>(() =>
    pickDefaultRoiLabel(selectedPTAs, preferredRoiIndexLabel)
  );

  const im5Ready = useMemo(() => (im5Config ? im5Rows.length > 0 : false), [im5Config, im5Rows]);

  useEffect(() => {
    setRoiIndexChoice((prev) => {
      const next = pickDefaultRoiLabel(selectedPTAs, prev ?? preferredRoiIndexLabel);
      return next === prev ? prev : next;
    });
  }, [selectedPTAs, preferredRoiIndexLabel]);

  useEffect(() => {
    setIm5Rows([]);
  }, [im5Config]);

  useEffect(() => {
    if (roiMode === "IM5" && !im5Config) {
      setRoiMode("INDEX");
    }
  }, [roiMode, im5Config]);

  const roiBasis = useMemo<RoiBasis>(() => {
    if (roiMode === "IM5") {
      return { mode: "IM5", config: im5Config, rows: im5Rows };
    }
    return { mode: "INDEX", label: roiIndexChoice };
  }, [roiMode, im5Config, im5Rows, roiIndexChoice]);

  const calc = useCalculations(st, roiBasis);
  const { ready, createChart } = useCharts();
  const barRef = useRef<any>(null);
  const pieRef = useRef<any>(null);
  const radarRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const roiLabelUsed = calc.roiIndexLabel;
  const isIm5Selected = roiLabelUsed === "IM5$";
  const roiIndexDisplayName = isIm5Selected
    ? "IM5$ (R$/filha)"
    : roiLabelUsed
    ? `Índice ${roiLabelUsed}`
    : "Índice econômico";
  const roiIndexFormulaLabel = isIm5Selected
    ? "IM5$ ponderado"
    : roiLabelUsed
    ? `${roiLabelUsed} Ponderado`
    : "Índice ponderado";
  const roiIndexExplanation = isIm5Selected
    ? "Retorno econômico médio por filha gerado com base nas PTAs e pesos definidos no IM5$, ponderado pelo número de bezerras geradas por touro."
    : roiLabelUsed
    ? `Valor médio ponderado do ${roiLabelUsed} dos touros selecionados, considerando o número de doses utilizadas de cada touro.`
    : "Valor médio ponderado do índice econômico selecionado dos touros, considerando o número de doses utilizadas de cada touro.";
  const roiIndexAverageValue = isIm5Selected
    ? calc.im5AverageValue
    : roiLabelUsed
    ? calc.ptaPondGeral[roiLabelUsed] || 0
    : 0;
  const roiTotalValue = roiLabelUsed ? roiIndexAverageValue * calc.totalBez - calc.totalValor : 0;
  const roiTotalColor = roiLabelUsed ? (roiTotalValue >= 0 ? "#167C2B" : COLORS.red) : COLORS.black;
  const formatIndexValue = (value: number) => {
    if (!roiLabelUsed) return "–";
    if (isIm5Selected) {
      return BRL(value);
    }
    return formatPtaValue(roiLabelUsed, value);
  };

  const hasChartData = calc.byBull.length > 0 && calc.byBull.some((r) => r.bezerrasTotais > 0 || r.valorTotal > 0);

  const mountCharts = () => {
    // Destroy previous
    [barRef, pieRef, radarRef, lineRef].forEach((r) => {
      if (r.current) {
        try { r.current.destroy(); } catch {}
        r.current = null;
      }
    });

    if (!hasChartData) return;

    const labelsBulls = calc.byBull.map((r) => r.bull.name || `Touro ${r.bull.id}`);

    // 1) Barras: Bezerras por categoria e por touro (stacked)
    const datasetsBar = CATEGORIES.map(({ key, label }) => ({
      label,
      data: calc.byBull.map((r) => r.bezPorCat[key]),
      borderWidth: 1,
    }));
    barRef.current = createChart("chart-bar", {
      type: "bar",
      data: { labels: labelsBulls, datasets: datasetsBar },
      options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { x: { stacked: true }, y: { stacked: true } } },
    });

    // 2) Pizza: participação de bezerras por touro
    const pieData = calc.byBull.map((r) => r.bezerrasTotais);
    pieRef.current = createChart("chart-pie", {
      type: "pie",
      data: { labels: labelsBulls, datasets: [{ data: pieData }] },
      options: { responsive: true },
    });

    // 3) Radar: PTAs médias das filhas — normalized 0-1 scale
    const radarLabels = planStore.selectedPTAList.map((ptaLabel) => `PTA ${ptaLabel}`);
    // Build raw values per PTA across all bulls for min/max normalization
    const rawRadarValues: Record<string, number[]> = {};
    planStore.selectedPTAList.forEach((ptaLabel) => {
      rawRadarValues[ptaLabel] = calc.byBull.map((r) => r.ptaPond[ptaLabel] || 0);
    });
    const radarMin: Record<string, number> = {};
    const radarMax: Record<string, number> = {};
    planStore.selectedPTAList.forEach((ptaLabel) => {
      const vals = rawRadarValues[ptaLabel];
      radarMin[ptaLabel] = Math.min(...vals);
      radarMax[ptaLabel] = Math.max(...vals);
    });
    const normalize = (ptaLabel: string, value: number) => {
      const min = radarMin[ptaLabel];
      const max = radarMax[ptaLabel];
      if (max === min) return 0.5;
      return (value - min) / (max - min);
    };
    const radarDatasets = calc.byBull.map((r) => ({
      label: r.bull.name || `Touro ${r.bull.id}`,
      data: planStore.selectedPTAList.map((ptaLabel) => normalize(ptaLabel, r.ptaPond[ptaLabel] || 0)),
    }));
    radarRef.current = createChart("chart-radar", {
      type: "radar",
      data: { labels: radarLabels, datasets: radarDatasets },
      options: {
        responsive: true,
        elements: { line: { borderWidth: 2 } },
        scales: {
          r: { min: 0, max: 1, ticks: { display: false } },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const ptaLabel = planStore.selectedPTAList[ctx.dataIndex];
                const realValue = calc.byBull[ctx.datasetIndex]?.ptaPond[ptaLabel] || 0;
                return `${ctx.dataset.label}: ${formatPtaValue(ptaLabel, realValue)}`;
              },
            },
          },
        },
      },
    });

    // 4) Barras: ROI por touro with zero baseline
    const roiData = calc.byBull.map((r) => r.roi);
    const roiColors = calc.byBull.map((r) => (r.roi >= 0 ? "#16a34a" : "#dc2626"));
    lineRef.current = createChart("chart-line", {
      type: "bar",
      data: {
        labels: labelsBulls,
        datasets: [
          {
            label: calc.roiIndexLabel ? `ROI (R$) — Índice ${calc.roiIndexLabel}` : "ROI (R$)",
            data: roiData,
            backgroundColor: roiColors,
            borderColor: roiColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          annotation: {
            annotations: {
              zeroLine: { type: "line", yMin: 0, yMax: 0, borderColor: "#1C1C1C", borderWidth: 1, borderDash: [4, 4] },
            },
          },
        },
        scales: {
          y: {
            title: { display: true, text: "ROI (R$)" },
          },
        },
      },
    });
  };

  useEffect(() => {
    if (ready.chart && hasChartData) {
      const timer = setTimeout(mountCharts, 50);
      return () => {
        clearTimeout(timer);
        [barRef, pieRef, radarRef, lineRef].forEach((r) => {
          if (r.current) {
            try { r.current.destroy(); } catch {}
            r.current = null;
          }
        });
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.chart, hasChartData, JSON.stringify(calc)]);

  const missingCrit = calc.byBull.some((r) => r.bezerrasTotais === 0 && r.valorTotal === 0);

  return (
    <div>
      <Section
        title="Resumo da Simulação"
        right={
          <div style={{ display: "flex", gap: 12 }}>
            <div><strong>Total bezerras:</strong> {NUM(calc.totalBez, 0)}</div>
            <div><strong>Custo total:</strong> {BRL(calc.totalValor)}</div>
            <div><strong>Custo médio/bezerra:</strong> {BRL(calc.custoMedioBezerra)}</div>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(planStore.selectedPTAList.length, 5)}, 1fr)`, gap: 12 }}>
          {planStore.selectedPTAList.map((ptaLabel) => (
            <div key={ptaLabel} style={{ background: COLORS.white, border: `1px dashed ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: COLORS.black }}>PTA média geral – {ptaLabel}</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatPtaValue(ptaLabel, calc.ptaPondGeral[ptaLabel] || 0)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="IM5$ — Custo-benefício por Touro">
        <div className="flex flex-col gap-4">
          <IM5Configurator farmId={farmIdForIM5} onApply={setIm5Config} />
          {im5Error && (
            <div style={{ color: COLORS.red, fontSize: 12 }}>{im5Error}</div>
          )}
          {im5Loading && (
            <div style={{ fontSize: 12, color: "#555" }}>Carregando touros…</div>
          )}
          <IM5Results
            farmId={farmIdForIM5}
            bulls={planBulls}
            config={im5Config}
            onComputed={setIm5Rows}
          />
        </div>
      </Section>

      <Section title="Tabela Comparativa Final">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.gray }}>
                <th style={{ textAlign: "left", padding: 6 }}>Touro</th>
                <th style={{ textAlign: "left", padding: 6 }}>Empresa</th>
                <th style={{ textAlign: "left", padding: 6 }}>Tipo</th>
                <th style={{ textAlign: "right", padding: 6 }}>Doses Totais</th>
                <th style={{ textAlign: "right", padding: 6 }}>R$ Total</th>
                <th style={{ textAlign: "right", padding: 6 }}>Bezerras Totais</th>
                {planStore.selectedPTAList.map((ptaLabel) => (
                  <th key={ptaLabel} style={{ textAlign: "right", padding: 6 }}>PTA {ptaLabel}</th>
                ))}
                <th style={{ textAlign: "right", padding: 6 }}>R$/Bezerra</th>
                <th style={{ textAlign: "right", padding: 6 }}>ROI (R$/bezerra)</th>
              </tr>
            </thead>
            <tbody>
              {calc.byBull
                .sort((a, b) => b.roi - a.roi) // Ordenar por maior ROI
                .map((r, index) => {
                  const isHighestROI = index === 0;
                  const isLowestROI = index === calc.byBull.length - 1;
                  const roiPerCalf = r.bezerrasTotais > 0 ? r.roi / r.bezerrasTotais : 0;
                  
                  return (
                    <tr key={r.bull.id} style={{
                      backgroundColor: isHighestROI ? "#d4f4dd" : isLowestROI ? "#fdd4d4" : "transparent"
                    }}>
                      <td style={{ padding: 6, fontWeight: isHighestROI ? 700 : 400 }}>{r.bull.name || `Touro ${r.bull.id}`}</td>
                      <td style={{ padding: 6 }}>{r.bull.empresa || "–"}</td>
                      <td style={{ padding: 6 }}>{r.bull.semen}</td>
                      <td style={{ textAlign: "right", padding: 6 }}>{NUM(r.dosesTotal, 0)}</td>
                      <td style={{ textAlign: "right", padding: 6 }}>{BRL(r.valorTotal)}</td>
                      <td style={{ textAlign: "right", padding: 6 }}>{NUM(r.bezerrasTotais, 0)}</td>
                      {planStore.selectedPTAList.map((ptaLabel) => (
                        <td key={ptaLabel} style={{ textAlign: "right", padding: 6 }}>{formatPtaValue(ptaLabel, r.ptaPond[ptaLabel] || 0)}</td>
                      ))}
                      <td style={{ textAlign: "right", padding: 6 }}>{BRL(r.custoPorBezerra)}</td>
                      <td style={{ 
                        textAlign: "right", 
                        padding: 6, 
                        fontWeight: 800, 
                        color: r.roi >= 0 ? "#167C2B" : COLORS.red,
                        backgroundColor: isHighestROI ? "#d4f4dd" : isLowestROI ? "#fdd4d4" : "transparent"
                      }}>
                        {BRL(roiPerCalf)} ({(roiPerCalf / (r.custoPorBezerra || 1) * 100).toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Gráficos">
        {!ready.chart && <div>Carregando biblioteca de gráficos…</div>}
        {ready.chart && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <h4 style={{ marginBottom: 6 }}>Barras (Bezerras por categoria x Touro)</h4>
              {hasChartData ? <ChartCanvas id="chart-bar" /> : <EmptyChartPlaceholder label="Configure os touros e doses na etapa anterior para visualizar este gráfico" />}
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Pizza (Participação de bezerras por Touro)</h4>
              {hasChartData ? <ChartCanvas id="chart-pie" /> : <EmptyChartPlaceholder label="Configure os touros e doses na etapa anterior para visualizar este gráfico" />}
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Radar (PTAs médias das filhas)</h4>
              {hasChartData ? <ChartCanvas id="chart-radar" /> : <EmptyChartPlaceholder label="Configure os touros e doses na etapa anterior para visualizar este gráfico" />}
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Barras (ROI por touro)</h4>
              {hasChartData ? <ChartCanvas id="chart-line" /> : <EmptyChartPlaceholder label="Configure os touros e doses na etapa anterior para visualizar este gráfico" />}
            </div>
          </div>
        )}
        {missingCrit && (
          <div style={{ marginTop: 12, background: "#fff7ed", border: "1px solid #f59e0b", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: COLORS.red }}>Dados incompletos:</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
              {calc.byBull.map((r, i) => {
                const issues: string[] = [];
                if (r.bezerrasTotais === 0) issues.push("sem bezerras (verifique doses e premissas)");
                if (r.valorTotal === 0) issues.push("sem doses configuradas");
                if (!r.bull.name) issues.push("sem nome");
                return issues.length > 0 ? (
                  <li key={r.bull.id}>Touro {i + 1} ({r.bull.name || r.bull.id}): {issues.join(", ")}</li>
                ) : null;
              })}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Insights">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
          {/* Maior índice econômico */}
          {(() => {
            const roiLabel = calc.roiIndexLabel;
            const isIm5 = roiLabel === "IM5$";
            const bestIndex = roiLabel
              ? [...calc.byBull].sort((a, b) =>
                  isIm5
                    ? (b.im5Value || 0) - (a.im5Value || 0)
                    : (b.ptaPond[roiLabel] || 0) - (a.ptaPond[roiLabel] || 0)
                )[0]
              : null;
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>
                  {roiLabel
                    ? isIm5
                      ? "Maior IM5$ médio"
                      : `Maior ${roiLabel} médio`
                    : "Maior índice médio"}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {bestIndex && roiLabel ? `${bestIndex.bull.name || bestIndex.bull.id}` : "–"}
                </div>
                <div style={{ fontSize: 14, color: "#16a34a" }}>
                  {bestIndex && roiLabel
                    ? isIm5
                      ? formatIndexValue(bestIndex.im5Value || 0)
                      : formatIndexValue(bestIndex.ptaPond[roiLabel] || 0)
                    : "–"}
                </div>
              </div>
            );
          })()}
          
          {/* Menor custo por bezerra */}
          {(() => {
            const bestCost = [...calc.byBull].filter((x) => x.bezerrasTotais > 0).sort((a, b) => a.custoPorBezerra - b.custoPorBezerra)[0];
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Menor custo por bezerra</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {bestCost ? `${bestCost.bull.name || bestCost.bull.id}` : "–"}
                </div>
                <div style={{ fontSize: 14, color: "#16a34a" }}>
                  {bestCost ? `${BRL(bestCost.custoPorBezerra)}` : "–"}
                </div>
              </div>
            );
          })()}
          
          {/* Touro Mais Rentável */}
          {(() => {
            const bestROI = [...calc.byBull].sort((a, b) => b.roi - a.roi)[0];
            return (
              <div style={{ 
                border: `2px solid #16a34a`, 
                borderRadius: 10, 
                padding: 10, 
                backgroundColor: "#d4f4dd" 
              }}>
                <div style={{ fontSize: 12, color: COLORS.black, fontWeight: 600 }}>🏆 Touro Mais Rentável</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {bestROI ? `${bestROI.bull.name || bestROI.bull.id}` : "–"}
                </div>
                <div style={{ fontSize: 14, color: "#16a34a", fontWeight: 600 }}>
                  {bestROI ? `ROI: ${BRL(bestROI.roi)}` : "–"}
                </div>
              </div>
            );
          })()}
          
          {/* Touro Menos Rentável */}
          {(() => {
            const worstROI = [...calc.byBull].sort((a, b) => a.roi - b.roi)[0];
            return (
              <div style={{ 
                border: `2px solid ${COLORS.red}`, 
                borderRadius: 10, 
                padding: 10, 
                backgroundColor: "#fdd4d4" 
              }}>
                <div style={{ fontSize: 12, color: COLORS.black, fontWeight: 600 }}>⚠️ Touro Menos Rentável</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {worstROI ? `${worstROI.bull.name || worstROI.bull.id}` : "–"}
                </div>
                <div style={{ fontSize: 14, color: COLORS.red, fontWeight: 600 }}>
                  {worstROI ? `ROI: ${BRL(worstROI.roi)}` : "–"}
                </div>
              </div>
            );
          })()}
          
          {/* Total de Bezerras */}
          {(() => {
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Total de Bezerras</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {NUM(calc.totalBez, 0)}
                </div>
                <div style={{ fontSize: 12, color: COLORS.black }}>
                  Custo médio: {BRL(calc.custoMedioBezerra)}
                </div>
              </div>
            );
          })()}
        </div>
      </Section>

      {/* Fórmula e Explicação do ROI */}
      <Section title="Fórmula do ROI">
        <div style={{ backgroundColor: COLORS.white, padding: 20, borderRadius: 10, border: `1px solid ${COLORS.gray}` }}>
          <div style={{ marginBottom: 20 }}>
            <RoiBasisSelector
              options={selectedPTAs}
              roiMode={roiMode}
              onModeChange={setRoiMode}
              roiIndexChoice={roiIndexChoice}
              onSelectIndex={setRoiIndexChoice}
              im5Ready={im5Ready}
              hasIm5Config={!!im5Config}
              im5Traits={im5Config?.traits ?? []}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Fórmula:</div>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: 15,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 14,
              border: `1px solid ${COLORS.gray}`,
              textAlign: 'center',
              fontWeight: 600
            }}>
              ROI = ({roiIndexFormulaLabel} × Total de Bezerras) - Custo Total do Sêmen
            </div>
          </div>

          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Explicação:</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.black }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{roiIndexFormulaLabel}:</strong> {roiIndexExplanation}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Total de Bezerras:</strong> Número total estimado de bezerras fêmeas nascidas
                (considerando taxa de natalidade feminina variável por tipo de sêmen: Sexado 90%, Convencional 47%).
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Custo Total do Sêmen:</strong> Somatória do valor gasto com todas as doses de sêmen utilizadas no plano.
              </div>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: 15, 
            borderRadius: 8, 
            border: `1px solid ${COLORS.gray}`,
            marginTop: 15 
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Interpretação do Resultado:</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <div style={{ marginBottom: 5 }}>
                <span style={{ color: "#167C2B", fontWeight: 600 }}>ROI Positivo:</span> O retorno genético supera o investimento em sêmen
              </div>
              <div>
                <span style={{ color: COLORS.red, fontWeight: 600 }}>ROI Negativo:</span> O investimento em sêmen é maior que o retorno genético projetado
              </div>
            </div>
          </div>
          
          {calc.totalBez > 0 && (
            <div style={{
              backgroundColor: '#e3f2fd',
              padding: 15,
              borderRadius: 8,
              border: '1px solid #90caf9',
              marginTop: 15
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Valores do Plano Atual:</div>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <div>
                  {roiIndexDisplayName}: <strong>{roiLabelUsed ? formatIndexValue(roiIndexAverageValue) : "–"}</strong>
                </div>
                <div>Total de Bezerras: <strong>{calc.totalBez.toLocaleString()}</strong></div>
                <div>Custo Total: <strong>{BRL(calc.totalValor)}</strong></div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                  ROI Total: <span style={{ color: roiTotalColor }}>
                    {roiLabelUsed ? BRL(roiTotalValue) : "–"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function PageExport({ st }: { st: AppState }) {
  const ref = useRef<HTMLDivElement>(null);
  const { ready } = useCharts();
  const { addReport } = useFileStore();

  const doExport = async () => {
    const el = ref.current;
    if (!el) return;

    const a = document.createElement("div");
    a.style.padding = "16px";
    a.style.background = "#fff";
    a.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
        <div style="font-weight:800; font-size:18px; color:${COLORS.black}">Projeção Genética MVP – Select Sires</div>
        <div style="font-size:12px; color:${COLORS.black}">${new Date(st.farm.date || new Date().toISOString().slice(0,10)).toLocaleDateString("pt-BR")}</div>
      </div>
      <div style="font-size:12px; margin-bottom:8px; color:${COLORS.black}">
        Fazenda: <strong>${st.farm.farmName || "–"}</strong> · Técnico: <strong>${st.farm.technician || "–"}</strong>
      </div>
    `;
    a.appendChild(el.cloneNode(true));

    if ((window as any).html2canvas && (window as any).jspdf) {
      try {
        // @ts-ignore
        const { jsPDF } = (window as any).jspdf;
        // @ts-ignore
        const canvas = await (window as any).html2canvas(a, { scale: 2, backgroundColor: "#FFFFFF" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "l" : "p", unit: "pt", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
        const w = canvas.width * ratio;
        const h = canvas.height * ratio;
        pdf.addImage(imgData, "PNG", (pageWidth - w) / 2, 24, w, h);
        
        // Convert PDF to blob for saving to Files page
        const pdfBlob = pdf.output('blob');
        
        // Save to Files page
        const reportName = `Projeção Genética ${st.farm.farmName || 'MVP'} - ${new Date().toLocaleDateString('pt-BR')}`;
        addReport({
          name: reportName,
          type: 'genetic_projection',
          sourceId: st.farm.farmName,
          data: st,
          metadata: {
            createdAt: new Date().toISOString(),
            size: pdfBlob.size,
            description: `Projeção genética com ${st.bulls.length} touros e ${st.structure.total} fêmeas`,
            settings: {
              selectedPTAs: st.selectedPTAs,
              numberOfBulls: st.numberOfBulls,
              structure: st.structure,
              repro: st.repro
            }
          },
          fileBlob: pdfBlob
        });
        
        // Also download the file
        pdf.save("Projecao_Genetica_MVP.pdf");
        
        toast.success('PDF salvo na página Arquivos e baixado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        toast.error('Erro ao exportar PDF');
      }
    } else {
      // Fallback
      window.print();
    }
  };

  return (
    <div>
      <Section
        title="Exportação PDF"
        right={<Button onClick={doExport}>{ready.h2c && ready.jspdf ? "Exportar PDF" : "Imprimir/Salvar PDF"}</Button>}
      >
        <div ref={ref}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>O PDF incluirá o conteúdo principal da tela de Resultados & Gráficos.</div>
          <div style={{ fontSize: 12, color: COLORS.black }}>Para melhor qualidade, gere os gráficos em Resultados antes da exportação.</div>
        </div>
      </Section>
    </div>
  );
}

// ---------- App ----------
function Sidebar({ current, onChange, onLoadTest, onClear }: { current: string; onChange: (page: string) => void; onLoadTest: () => void; onClear: () => void }) {
  const item = (key: string, label: string) => (
    <div
      onClick={() => onChange(key)}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: current === key ? 800 : 600,
        background: current === key ? COLORS.red : "transparent",
        color: current === key ? "#fff" : COLORS.black,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
  );

  return (
    <div style={{ width: 280, minWidth: 240, background: COLORS.white, borderRight: `1px solid ${COLORS.gray}`, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontWeight: 900, color: COLORS.black, marginBottom: 8, fontSize: 18 }}>Projeção Genética MVP</div>
      {item("plano", "🧬 Plano Genético")}
      {item("touros", "🐂 Entradas dos Touros")}
      {item("resultados", "📊 Resultados & Gráficos")}
      {item("pdf", "📄 Exportar PDF")}
      <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
        <Button onClick={onLoadTest}>Carregar Dados de Teste</Button>
        <Button variant="ghost" onClick={onClear}>Limpar Todos os Dados</Button>
      </div>
    </div>
  );
}

const PAGE_TO_STEP: Record<string, number> = {
  plano: 0,
  touros: 1,
  resultados: 2,
  pdf: 2,
};

const STEP_TO_PAGE = ["plano", "touros", "resultados"] as const;

export default function ProjecaoGenetica() {
  const { state, setState, loadTestData, clearAll } = useAppState();
  const [page, setPage] = useState<"plano" | "touros" | "resultados" | "pdf">("plano");

  const initialObjectiveChoice = useMemo(() => objectiveFromLabel(state.farm.objective), [state.farm.objective]);

  const handleObjectiveChange = useCallback(
    (next: ObjectiveChoice | null) => {
      setState((prev) => {
        const label = getObjectiveLabel(next);
        if (prev.farm.objective === label) {
          return prev;
        }
        return {
          ...prev,
          farm: { ...prev.farm, objective: label },
        };
      });
    },
    [setState]
  );

  const currentStep = PAGE_TO_STEP[page] ?? -1;

  return (
    <PlanObjectiveProvider initialObjective={initialObjectiveChoice} onObjectiveChange={handleObjectiveChange}>
      <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAFA", color: COLORS.black }}>
        <Sidebar current={page} onChange={(p) => setPage(p as any)} onLoadTest={loadTestData} onClear={clearAll} />
        <main style={{ flex: 1, padding: 16, maxWidth: 1400, margin: "0 auto" }}>
          {currentStep >= 0 && (
            <PlanStepper
              currentStep={currentStep}
              onStepClick={(step) => setPage(STEP_TO_PAGE[step] as any)}
            />
          )}
          {page === "plano" && <PagePlano st={state} setSt={setState} />}
          {page === "touros" && <PageBulls st={state} setSt={setState} onGoToResults={() => setPage("resultados")} />}
{page === "resultados" && <PageResults st={state} />}
          {page === "pdf" && <PageExport st={state} />}
        </main>
      </div>
    </PlanObjectiveProvider>
  );
}
