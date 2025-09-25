import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePlanStore, AVAILABLE_PTAS, getFemalesByFarm, countFromCategoria, calculateMotherAverages, getBullPTAValue, calculatePopulationStructure } from "../hooks/usePlanStore";
import { useHerdStore } from "../hooks/useHerdStore";
import { useFileStore } from "../hooks/useFileStore";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import EstruturalPopulacional from './EstruturalPopulacional';
import PTAMothersTable from './PTAMothersTable';
import { BullSelector } from '@/components/BullSelector';

/**
 * Projeção Genética MVP – Select Sires (Frontend Only, Single File)
 * ---------------------------------------------------------------
 * - Sem backend / sem banco. Todos os dados são inseridos manualmente.
 * - Persistência local automática em localStorage.
 * - Cálculos em tempo real (doses por categoria, premissas por categoria, PTA mães por categoria).
 * - ROI em R$ baseado em NM$ ponderado × nº de bezerras − custo de sêmen.
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

const PTA_NUM = (v: number) => 
  new Intl.NumberFormat("pt-BR", { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }).format(isFinite(v) ? Math.round(v * 10) / 10 : 0);

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
            service: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
            conception: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
            preex: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
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
      console.warn('Failed to load state from localStorage:', error);
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
        service: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
        conception: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
        preex: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparas: 0 },
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
      console.warn('Failed to save state to localStorage:', error);
      // Clear old data if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('Clearing old localStorage data to free space...');
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
          console.warn('Could not save even minimal state');
        }
      }
    }
  }, [state.farm, state.structure, state.repro, state.mothers, state.bulls, state.selectedPTAs, state.numberOfBulls, state.autoCalculatePopulation]);

  // Carrega dados do Supabase (não mais do localStorage)
  useEffect(() => {
    // No longer loading from localStorage since we're using Supabase directly
    // State will be managed by individual components that need bull data
    console.log('🔄 ProjecaoGenetica usando dados direto do Supabase');
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
          console.log('🔄 Carregando rebanho automaticamente:', farmId);
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
          
          console.log('✅ Rebanho carregado automaticamente');
          toast.success('Rebanho carregado automaticamente');
        } else {
          console.log('⚠️ Nenhuma fazenda selecionada para carregar automaticamente');
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

function useCalculations(state: AppState) {
  const planStore = usePlanStore();
  
  const result = useMemo(() => {
    const semenFemale = (semen: SemenType) => (semen === "Sexado" ? 0.9 : 0.47);

    const byBull = state.bulls.slice(0, state.numberOfBulls).map((b) => {
      const femaleRate = semenFemale(b.semen);
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
      planStore.selectedPTAList.forEach(ptaLabel => {
        ptaPondNumerator[ptaLabel] = 0;
      });

      CATEGORIES.forEach(({ key }) => {
        const doses = b.doses[key] || 0;
        const conc = clamp01((state.repro.conception[key] || 0) / 100);
        const preex = clamp01((state.repro.preex[key] || 0) / 100);
        const prenhezes = doses * conc;
        const prenhezesConfirm = prenhezes * preex;
        const bez = prenhezesConfirm * femaleRate;
        bezPorCat[key] = bez;
        bezerrasTotais += bez;

        planStore.selectedPTAList.forEach((ptaLabel) => {
          const categoryKey = CATEGORY_MAP[key as keyof typeof CATEGORY_MAP];
          const ptaMae = planStore.motherAverages[categoryKey]?.[ptaLabel] || 0;
          const ptaTouro = (b.pta[ptaLabel] === null ? 0 : b.pta[ptaLabel]) || 0;
          const ptaFilha = (ptaMae + ptaTouro) / 2;
          ptaPondNumerator[ptaLabel] += ptaFilha * bez;
        });
      });

      const ptaPond: Record<string, number> = {};
      planStore.selectedPTAList.forEach((ptaLabel) => {
        ptaPond[ptaLabel] = bezerrasTotais > 0 ? ptaPondNumerator[ptaLabel] / bezerrasTotais : 0;
      });

      const custoPorBezerra = bezerrasTotais > 0 ? valorTotal / bezerrasTotais : 0;
      const nmDollarLabel = planStore.selectedPTAList.find(l => l === "NM$");
      const retornoGen = nmDollarLabel ? (ptaPond[nmDollarLabel] || 0) * bezerrasTotais : 0;
      const roi = retornoGen - valorTotal;

      return {
        bull: b,
        dosesTotal,
        valorTotal,
        femaleRate,
        bezPorCat,
        bezerrasTotais,
        ptaPond,
        custoPorBezerra,
        retornoGen,
        roi,
      };
    });

    // Totais do plano
    const totalBez = byBull.reduce((s, r) => s + r.bezerrasTotais, 0);
    const totalValor = byBull.reduce((s, r) => s + r.valorTotal, 0);

    const ptaPondGeral: Record<string, number> = {};
    planStore.selectedPTAList.forEach(ptaLabel => {
      ptaPondGeral[ptaLabel] = 0;
    });

    if (totalBez > 0) {
      planStore.selectedPTAList.forEach((ptaLabel) => {
        const num = byBull.reduce((s, r) => s + (r.ptaPond[ptaLabel] || 0) * r.bezerrasTotais, 0);
        ptaPondGeral[ptaLabel] = num / totalBez;
      });
    }

    const custoMedioBezerra = totalBez > 0 ? totalValor / totalBez : 0;

    return { byBull, totalBez, totalValor, ptaPondGeral, custoMedioBezerra };
  }, [state, planStore.selectedPTAList, planStore.motherAverages]);

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
  ariaLabel
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  ariaLabel?: string;
}) {
  const styles =
    variant === "primary"
      ? { background: COLORS.red, color: "#fff", border: "none" }
      : { background: "transparent", color: COLORS.black, border: `1px solid ${COLORS.gray}` };
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
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
        cursor: "pointer",
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
    console.log('🔄 PagePlano usando dados direto do Supabase');
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
      console.log('Population structure updated:', next);
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
                📋 Incluir dados de referência
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

function PageBulls({ st, setSt }: { st: AppState; setSt: React.Dispatch<React.SetStateAction<AppState>> }) {
  const planStore = usePlanStore();
  const [toolssBulls, setToolssBulls] = useState<any[]>([]);
  
  useEffect(() => {
    const loadBullsFromSupabase = async () => {
      try {
        console.log('🔍 Carregando touros do Supabase...');
        
        const { data: bulls, error } = await supabase
          .rpc('get_bulls_denorm')
          .order('tpi', { ascending: false })
          .limit(100); // Limit to avoid too many bulls
        
        if (error) {
          console.error('Erro ao carregar touros:', error);
          return;
        }
        
        if (bulls && bulls.length > 0) {
          // Convert Supabase bulls to ToolSS format for compatibility
          // Filter out bulls without HHP$ as requested by user
          const convertedBulls = bulls
            .filter((bull: any) => bull.hhp_dollar && bull.hhp_dollar !== null)
            .map((bull: any) => ({
              naab: bull.code,
              nome: bull.name,
              empresa: bull.company || 'N/A',
              TPI: bull.tpi || 0,
              "NM$": bull.nm_dollar || 0,
              "HHP$": bull.hhp_dollar, // No fallback to 0 since we filtered
              "FM$": bull.fm_dollar || 0,
              "GM$": bull.gm_dollar || 0,
              "CM$": bull.cm_dollar || 0,
              Milk: bull.ptam || 0,
              Fat: bull.ptaf || 0,
              Protein: bull.ptap || 0,
              "Fat%": bull.ptaf_pct || 0,
              "Protein%": bull.ptap_pct || 0,
              PL: bull.pl || 0,
              DPR: bull.dpr || 0,
              LIV: bull.liv || 0,
              SCS: bull.scs || 0,
              PTAT: bull.ptat || 0,
              // Add other PTAs as needed...
            }));
          
          console.log(`🐂 Loaded ${convertedBulls.length} bulls from Supabase (filtered: only with HHP$)`);
          console.log('📋 Sample bulls with HHP$:', convertedBulls.slice(0, 3).map((b: any) => ({ naab: b.naab, nome: b.nome, empresa: b.empresa, hhp: b["HHP$"] })));
          setToolssBulls(convertedBulls);
        }
      } catch (e) {
        console.warn("Erro ao carregar touros do Supabase:", e);
      }
    };
    
    loadBullsFromSupabase();
  }, []);

  // Inicializa touros se necessário - sem loops
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
          doses: { novilhas: 0, primiparas: 0, secundiparas: 0, multiparous: 0 },
          pta: defaultPTA,
        });
      }
      if (newBulls.length > 0) {
        setSt(s => ({ ...s, bulls: [...s.bulls, ...newBulls] }));
      }
    }
  }, [st.numberOfBulls, st.bulls.length, planStore.selectedPTAList.length]); // Stable dependency

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
          {/* Seleção do touro usando BullSelector */}
          {toolssBulls.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <BullSelector 
                label={`Selecionar Touro ${idx + 1}`}
                placeholder="Digite o código NAAB ou selecione da lista"
                value={b.naab ? {
                  id: b.naab,
                  code: b.naab,
                  name: b.name || "",
                  company: b.empresa || ""
                } : null}
                onChange={(bull) => {
                  console.log(`🔄 Touro ${idx + 1}: selecionado bull =`, bull);
                  
                  if (!bull) {
                    // Limpa o touro
                    console.log(`🧹 Limpando dados do Touro ${idx + 1}`);
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
                    const selectedBull = toolssBulls.find(toolsBull => toolsBull.naab === bull.code);
                    if (selectedBull) {
                      console.log(`✅ Touro encontrado: ${selectedBull.nome} (${selectedBull.empresa})`);
                      
                      const updatedPTA: Record<string, number | null> = {};
                      planStore.selectedPTAList.forEach(ptaLabel => {
                        // Use getBullPTAValue function to get the value with proper mapping
                        const value = getBullPTAValue(selectedBull, ptaLabel);
                        updatedPTA[ptaLabel] = value;
                        console.log(`🔍 Bull ${selectedBull.naab}: ${ptaLabel} = ${value} (from field: ${ptaLabel === "HHP$®" ? "HHP$" : ptaLabel})`);
                      });
                      
                      console.log('📊 PTAs carregadas:', planStore.selectedPTAList.map(k => `${k}:${updatedPTA[k] === null ? '—' : updatedPTA[k]}`));
                      console.log('🐂 Selected Bull raw data:', selectedBull);
                      
                      setSt(s => ({ 
                        ...s, 
                        bulls: s.bulls.map((bullItem, i) => 
                          i === idx ? {
                            ...bullItem,
                            name: selectedBull.nome || "",
                            naab: selectedBull.naab || "",
                            empresa: selectedBull.empresa || "",
                            pta: updatedPTA
                          } : bullItem
                        )
                      }));
                      
                      // Show success toast
                      console.log(`✅ Touro ${idx + 1} configurado: ${selectedBull.nome} - ${selectedBull.naab}`);
                    } else {
                      console.log(`❌ Touro com código ${bull.code} não encontrado na lista`);
                    }
                  }
                }}
                showPTAs={true}
              />
              {b.naab && (
                <div style={{ marginTop: 4, fontSize: 11, color: "#16a34a" }}>
                  ✅ PTAs carregadas automaticamente para as {planStore.selectedPTAList.length} características selecionadas
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, marginBottom: 8 }}>
            <div>
              <Label>Nome do Touro</Label>
              <Input value={b.name} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, name: v } : bb)) }))} placeholder="Digite o nome" />
            </div>
            <div>
              <Label>NAAB</Label>
              <Input value={b.naab} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, naab: v } : bb)) }))} placeholder="NAAB" />
            </div>
            <div>
              <Label>Empresa</Label>
              <Input value={b.empresa || ""} onChange={(v) => setSt((s) => ({ ...s, bulls: s.bulls.map((bb, i) => (i === idx ? { ...bb, empresa: v } : bb)) }))} placeholder="Empresa" />
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

function PageResults({ st, calc }: { st: AppState; calc: ReturnType<typeof useCalculations> }) {
  const planStore = usePlanStore();
  const { ready, createChart } = useCharts();
  const barRef = useRef<any>(null);
  const pieRef = useRef<any>(null);
  const radarRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const mountCharts = () => {
    // Destroy previous
    [barRef, pieRef, radarRef, lineRef].forEach((r) => {
      if (r.current) {
        try { r.current.destroy(); } catch {}
        r.current = null;
      }
    });

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

    // 3) Radar: PTAs médias das filhas (ponderadas) – PTAs selecionadas
    const radarLabels = planStore.selectedPTAList.map((ptaLabel) => `PTA ${ptaLabel}`);
    const radarDatasets = calc.byBull.map((r) => ({ 
      label: r.bull.name || `Touro ${r.bull.id}`, 
      data: planStore.selectedPTAList.map((ptaLabel) => r.ptaPond[ptaLabel] || 0) 
    }));
    radarRef.current = createChart("chart-radar", {
      type: "radar",
      data: { labels: radarLabels, datasets: radarDatasets },
      options: { responsive: true, elements: { line: { borderWidth: 2 } } },
    });

    // 4) Barras: ROI por touro
    const roiData = calc.byBull.map((r) => r.roi);
    const roiColors = calc.byBull.map((r) => r.roi >= 0 ? '#16a34a' : '#dc2626');
    lineRef.current = createChart("chart-line", {
      type: "bar",
      data: {
        labels: labelsBulls,
        datasets: [{
          label: "ROI (R$)",
          data: roiData,
          backgroundColor: roiColors,
          borderColor: roiColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'ROI (R$)'
            }
          }
        }
      },
    });
  };

  useEffect(() => {
    if (ready.chart) {
      // Delay leve para garantir canvas presente
      setTimeout(mountCharts, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready.chart, JSON.stringify(calc)]);

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
              <div style={{ fontSize: 22, fontWeight: 800 }}>{PTA_NUM(calc.ptaPondGeral[ptaLabel] || 0)}</div>
            </div>
          ))}
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
                        <td key={ptaLabel} style={{ textAlign: "right", padding: 6 }}>{PTA_NUM(r.ptaPond[ptaLabel] || 0)}</td>
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
              <ChartCanvas id="chart-bar" />
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Pizza (Participação de bezerras por Touro)</h4>
              <ChartCanvas id="chart-pie" />
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Radar (PTAs médias das filhas)</h4>
              <ChartCanvas id="chart-radar" />
            </div>
            <div>
              <h4 style={{ marginBottom: 6 }}>Barras (ROI por touro)</h4>
              <ChartCanvas id="chart-line" />
            </div>
          </div>
        )}
        {missingCrit && (
          <div style={{ marginTop: 8, color: COLORS.red, fontWeight: 700 }}>
            Preencha todos os campos obrigatórios para visualizar os resultados.
          </div>
        )}
      </Section>

      <Section title="Insights">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12 }}>
          {/* Maior NM$ */}
          {(() => {
            const nmDollarLabel = planStore.selectedPTAList.find(l => l === "NM$");
            const bestNM = nmDollarLabel ? [...calc.byBull].sort((a, b) => (b.ptaPond[nmDollarLabel] || 0) - (a.ptaPond[nmDollarLabel] || 0))[0] : null;
            return (
              <div style={{ border: `1px solid ${COLORS.gray}`, borderRadius: 10, padding: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.black }}>Maior NM$ médio</div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {bestNM && nmDollarLabel ? `${bestNM.bull.name || bestNM.bull.id}` : "–"}
                </div>
                <div style={{ fontSize: 14, color: "#16a34a" }}>
                  {bestNM && nmDollarLabel ? `${PTA_NUM(bestNM.ptaPond[nmDollarLabel] || 0)}` : "–"}
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
              ROI = (NM$ Ponderado × Total de Bezerras) - Custo Total do Sêmen
            </div>
          </div>
          
          <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Explicação:</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.black }}>
              <div style={{ marginBottom: 8 }}>
                <strong>NM$ Ponderado:</strong> Valor médio ponderado do NM$ (Net Merit Dollar) dos touros selecionados, 
                considerando o número de doses utilizadas de cada touro.
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
                <div>NM$ Ponderado: <strong>${(calc.ptaPondGeral["NM$"] || 0).toFixed(2)}</strong></div>
                <div>Total de Bezerras: <strong>{calc.totalBez.toLocaleString()}</strong></div>
                <div>Custo Total: <strong>{BRL(calc.totalValor)}</strong></div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>
                  ROI Total: <span style={{ color: (() => {
                    const totalROI = (calc.ptaPondGeral["NM$"] || 0) * calc.totalBez - calc.totalValor;
                    return totalROI >= 0 ? "#167C2B" : COLORS.red;
                  })() }}>
                    {BRL((() => {
                      return (calc.ptaPondGeral["NM$"] || 0) * calc.totalBez - calc.totalValor;
                    })())}
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

export default function ProjecaoGenetica() {
  const { state, setState, loadTestData, clearAll } = useAppState();
  const calc = useCalculations(state);
  const [page, setPage] = useState<"plano" | "touros" | "resultados" | "pdf">("plano");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAFAFA", color: COLORS.black }}>
      <Sidebar current={page} onChange={(p) => setPage(p as any)} onLoadTest={loadTestData} onClear={clearAll} />
      <main style={{ flex: 1, padding: 16, maxWidth: 1400, margin: "0 auto" }}>
        {page === "plano" && <PagePlano st={state} setSt={setState} />}
        {page === "touros" && <PageBulls st={state} setSt={setState} />}
        {page === "resultados" && <PageResults st={state} calc={calc} />}
        {page === "pdf" && <PageExport st={state} />}
      </main>
    </div>
  );
}