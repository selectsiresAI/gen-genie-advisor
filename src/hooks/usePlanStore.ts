import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Lista completa de PTAs disponíveis (fonte de verdade única)
// Exatamente como aparecem no banco de fêmeas, na ordem especificada
export const AVAILABLE_PTAS = [
  "HHP$®", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", "CFP", "PTAF", 
  "PTAF%", "PTAP", "PTAP%", "PL", "DPR", "LIV", "SCS", "MAST", "MET", "RP", 
  "DA", "KET", "MF", "PTAT", "UDC", "FLC", "SCE", "DCE", "SSB", "DSB", 
  "H LIV", "CCR", "HCR", "FI", "GL", "EFC", "BWC", "STA", "STR", "DFM", 
  "RUA", "RLS", "RTP", "FTL", "RW", "RLR", "FTA", "FLS", "FUA", "RUH", 
  "RUW", "UCL", "UDP", "FTP", "RFI"
] as const;

// Mapeamento rótulo ↔ campo do banco (uso interno, preservando rótulo na UI)
export const LABEL_TO_FIELD: Record<string, string> = {
  "HHP$®": "HHP$®", // Usar exatamente como está no banco
  "TPI": "TPI",
  "NM$": "NM$",
  "CM$": "CM$",
  "FM$": "FM$",
  "GM$": "GM$",
  "F SAV": "F SAV",
  "PTAM": "PTAM",
  "CFP": "CFP",
  "PTAF": "PTAF",
  "PTAF%": "PTAF%",
  "PTAP": "PTAP",
  "PTAP%": "PTAP%",
  "PL": "PL",
  "DPR": "DPR",
  "LIV": "LIV",
  "SCS": "SCS",
  "MAST": "MAST",
  "MET": "MET",
  "RP": "RP",
  "DA": "DA",
  "KET": "KET",
  "MF": "MF",
  "PTAT": "PTAT",
  "UDC": "UDC",
  "FLC": "FLC",
  "SCE": "SCE",
  "DCE": "DCE",
  "SSB": "SSB",
  "DSB": "DSB",
  "H LIV": "H LIV",
  "CCR": "CCR",
  "HCR": "HCR",
  "FI": "FI",
  "GL": "GL",
  "EFC": "EFC",
  "BWC": "BWC",
  "STA": "STA",
  "STR": "STR",
  "DFM": "DFM",
  "RUA": "RUA",
  "RLS": "RLS",
  "RTP": "RTP",
  "FTL": "FTL",
  "RW": "RW",
  "RLR": "RLR",
  "FTA": "FTA",
  "FLS": "FLS",
  "FUA": "FUA",
  "RUH": "RUH",
  "RUW": "RUW",
  "UCL": "UCL",
  "UDP": "UDP",
  "FTP": "FTP",
  "RFI": "RFI"
};

// Population structure interface
interface PopulationCounts {
  heifers: number;
  primiparous: number;
  secundiparous: number;
  multiparous: number;
  total: number;
}

// Store interface
interface PlanState {
  // Core state
  selectedFarmId: string | null;
  selectedPTAList: string[]; // max 5, rótulos exibidos na ordem do usuário
  populationMode: 'auto' | 'manual';
  populationCounts: PopulationCounts;
  motherAverages: Record<string, Record<string, number>>; // category -> pta -> value
  
  // Actions
  setSelectedFarmId: (farmId: string | null) => void;
  setSelectedPTAList: (labels: string[]) => void;
  setPopulationMode: (mode: 'auto' | 'manual') => void;
  setPopulationCounts: (counts: PopulationCounts) => void;
  setMotherAverages: (averages: Record<string, Record<string, number>>) => void;
  
  // Utilities
  reset: () => void;
}

// Initial state
const initialState = {
  selectedFarmId: null,
  selectedPTAList: ["HHP$®", "TPI", "NM$", "PL", "DPR"], // rótulos exibidos
  populationMode: 'auto' as const,
  populationCounts: {
    heifers: 0,
    primiparous: 0, 
    secundiparous: 0,
    multiparous: 0,
    total: 0
  },
  motherAverages: {}
};

// Store with persistence
export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setSelectedFarmId: (farmId) => {
        const current = get().selectedFarmId;
        if (current !== farmId) {
          console.log('selectedFarmId=', farmId, '(from UI)');
          set({ selectedFarmId: farmId });
        }
      },
      
      setSelectedPTAList: (labels) => {
        const current = get().selectedPTAList;
        const newLabels = labels.slice(0, 5); // max 5
        if (JSON.stringify(current) !== JSON.stringify(newLabels)) {
          console.log('selectedPTAList=', newLabels);
          console.log('ptaHeaders=', newLabels.map(label => ({ label, key: LABEL_TO_FIELD[label] || label })));
          set({ selectedPTAList: newLabels });
        }
      },
      
      setPopulationMode: (mode) => {
        const current = get().populationMode;
        if (current !== mode) {
          console.log('populationMode=', mode);
          set({ populationMode: mode });
        }
      },
      
      setPopulationCounts: (counts) => {
        const current = get().populationCounts;
        if (JSON.stringify(current) !== JSON.stringify(counts)) {
          console.log('populationCounts=', counts, '(auto-calculated)');
          set({ populationCounts: counts });
        }
      },
      
      setMotherAverages: (averages) => {
        const current = get().motherAverages;
        if (JSON.stringify(current) !== JSON.stringify(averages)) {
          set({ motherAverages: averages });
        }
      },
      
      reset: () => set(initialState)
    }),
    {
      name: 'plan-storage',
      partialize: (state) => ({
        selectedFarmId: state.selectedFarmId,
        selectedPTAList: state.selectedPTAList,
        populationMode: state.populationMode,
        populationCounts: state.populationCounts
      })
    }
  )
);

// Front-end data source functions (ordered by priority)
function getFemalesByFarm(farmId: string): any[] {
  // Priority 1: Rebanho cache
  const rebanhoCache = (window as any).Rebanho?.femalesByFarm?.[farmId];
  if (Array.isArray(rebanhoCache)) return rebanhoCache;
  
  // Priority 2: ToolSS cache
  const toolssCache = (window as any).ToolSS?.cache?.femalesByFarm?.[farmId];
  if (Array.isArray(toolssCache)) return toolssCache;
  
  // Priority 3: localStorage
  try {
    const map = JSON.parse(localStorage.getItem("toolss.femalesByFarm") || "{}");
    if (Array.isArray(map?.[farmId])) return map[farmId];
  } catch (e) {
    console.warn('Error parsing toolss.femalesByFarm from localStorage:', e);
  }
  
  // Priority 4: AppCache fallback
  const appCache = (window as any).AppCache?.females?.[farmId];
  return Array.isArray(appCache) ? appCache : [];
}

function deriveParity(f: any): number | null {
  // Handle complex paridade structure: { _type: "undefined", value: "undefined" }
  let rawValue;
  
  if (f?.paridade && typeof f.paridade === 'object') {
    rawValue = f.paridade.value;
  } else {
    rawValue = f?.paridade ?? f?.parity ?? f?.num_partos ?? f?.ordem_parto;
  }
  
  const parsed = Number(rawValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function normCategoria(raw: any): string | null {
  if (!raw) return null;
  const s = String(raw)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toUpperCase().replace(/\s+/g, '');
  if (s === 'NOVILHA' || s === 'NOVILHAS') return 'NOVILHA';
  if (s === 'PRIMIPARA' || s === 'PRIMIPARAS') return 'PRIMIPARA';
  if (s === 'SECUNDIPARA' || s === 'SECUNDIPARAS') return 'SECUNDIPARA';
  if (s === 'MULTIPARA' || s === 'MULTIPARAS') return 'MULTIPARA';
  return null;
}

function parityFallback(f: any): number | null {
  const v = Number(f?.parity ?? f?.num_partos ?? f?.ordem_parto);
  return Number.isFinite(v) ? v : null;
}

function countFromFemales(list: any[]) {
  let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
  
  for (const f of list) {
    // First try categoria field
    const c = normCategoria(f?.categoria);
    if (c) {
      if (c === 'NOVILHA') n0++;
      else if (c === 'PRIMIPARA') n1++;
      else if (c === 'SECUNDIPARA') n2++;
      else if (c === 'MULTIPARA') n3++;
      continue;
    }
    
    // Fallback to parity only if categoria is empty
    const p = parityFallback(f);
    if (p === null) continue;
    if (p <= 0) n0++;
    else if (p === 1) n1++;
    else if (p === 2) n2++;
    else n3++;
  }
  
  return { 
    heifers: n0, 
    primiparous: n1, 
    secundiparous: n2, 
    multiparous: n3, 
    total: n0 + n1 + n2 + n3 
  };
}

// Category definitions for automatic counting (improved)
export const CATEGORY_DEFINITIONS = {
  heifers: (female: any) => {
    const parity = deriveParity(female);
    return parity === 0 || female.categoria === "Novilha" || female.categoria === "Calf" || female.categoria === "Heifer";
  },
  primiparous: (female: any) => {
    const parity = deriveParity(female);
    return parity === 1 || female.categoria === "Primípara" || female.categoria === "Primiparous";
  }, 
  secundiparous: (female: any) => {
    const parity = deriveParity(female);
    return parity === 2 || female.categoria === "Secundípara" || female.categoria === "Secondiparous";
  },
  multiparous: (female: any) => {
    const parity = deriveParity(female);
    return (parity >= 3) || female.categoria === "Multípara" || female.categoria === "Multiparous";
  }
};

// Calculate population structure from farm data (improved with front-end sources)
export const calculatePopulationStructure = (farm: any): PopulationCounts => {
  console.log('calculatePopulationStructure called for farm:', farm?.nome);
  
  // Try multiple data sources
  let females = farm?.females;
  if (!Array.isArray(females) && farm?.id) {
    console.log('No females in farm object, trying front-end sources...');
    females = getFemalesByFarm(farm.id.toString());
    console.log('Found females from front-end sources:', females.length);
  }
  
  if (!Array.isArray(females) || females.length === 0) {
    console.log('No females found in any data source');
    return { heifers: 0, primiparous: 0, secundiparous: 0, multiparous: 0, total: 0 };
  }
  
  console.log('Total females found:', females.length);
  
  // Log some sample females to check data format
  console.log('Sample females (first 3):', females.slice(0, 3).map((f: any) => ({
    nome: f.nome,
    paridade: f.paridade,
    categoria: f.categoria,
    derivedParity: deriveParity(f)
  })));
  
  // Use pure counting function
  const counts = countFromFemales(females);
  console.log('Category counts:', counts);
  
  return { 
    heifers: counts.heifers, 
    primiparous: counts.primiparous, 
    secundiparous: counts.secundiparous, 
    multiparous: counts.multiparous,
    total: counts.total
  };
};

// Calculate mother averages from farm data
export const calculateMotherAverages = (farm: any, ptaLabels: string[]): Record<string, Record<string, number>> => {
  if (!farm?.females || ptaLabels.length === 0) {
    return {};
  }
  
  const categories = {
    heifers: farm.females.filter(CATEGORY_DEFINITIONS.heifers),
    primiparous: farm.females.filter(CATEGORY_DEFINITIONS.primiparous),
    secundiparous: farm.females.filter(CATEGORY_DEFINITIONS.secundiparous),
    multiparous: farm.females.filter(CATEGORY_DEFINITIONS.multiparous)
  };
  
  const result: Record<string, Record<string, number>> = {};
  
  Object.entries(categories).forEach(([categoryKey, females]) => {
    result[categoryKey] = {};
    
    ptaLabels.forEach(ptaLabel => {
      const fieldName = LABEL_TO_FIELD[ptaLabel] || ptaLabel;
      const values = females.map((f: any) => {
        // Use mapped field name to get value from database
        const value = f[fieldName] || 0;
        return typeof value === 'number' ? value : 0;
      }).filter(v => v !== 0);
        
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        result[categoryKey][ptaLabel] = average; // Store with label as key
      });
  });
  
  return result;
};

// Export utility functions
export { getFemalesByFarm, normCategoria, parityFallback, countFromFemales };
export const getBullPTAValue = (bull: any, ptaLabel: string): number | null => {
  const fieldName = LABEL_TO_FIELD[ptaLabel] || ptaLabel;
  const value = bull[fieldName];
  if (typeof value === 'number') {
    console.log(`PTA ${ptaLabel}: ${value} (from bull ${bull.nome || bull.naab})`);
    return value;
  }
  console.log(`PTA ${ptaLabel}: — (Sem valor para ${ptaLabel})`);
  return null; // Return null instead of 0 to show "—"
};