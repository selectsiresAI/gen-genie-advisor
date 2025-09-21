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
  populationMode: 'manual' as const,
  populationCounts: {
    heifers: 0,
    primiparous: 0, 
    secundiparous: 0,
    multiparous: 0
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
          console.log('populationCounts=', counts, get().populationMode === 'auto' ? '(auto)' : '(manual)');
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

// Category definitions for automatic counting
export const CATEGORY_DEFINITIONS = {
  heifers: (female: any) => female.paridade === 0 || female.categoria === "Calf" || female.categoria === "Heifer",
  primiparous: (female: any) => female.paridade === 1 || female.categoria === "Primiparous", 
  secundiparous: (female: any) => female.paridade === 2 || female.categoria === "Secondiparous",
  multiparous: (female: any) => (female.paridade && female.paridade >= 3) || female.categoria === "Multiparous"
};

// Calculate population structure from farm data
export const calculatePopulationStructure = (farm: any): PopulationCounts => {
  if (!farm?.females) {
    return { heifers: 0, primiparous: 0, secundiparous: 0, multiparous: 0 };
  }
  
  const heifers = farm.females.filter(CATEGORY_DEFINITIONS.heifers).length;
  const primiparous = farm.females.filter(CATEGORY_DEFINITIONS.primiparous).length;
  const secundiparous = farm.females.filter(CATEGORY_DEFINITIONS.secundiparous).length;
  const multiparous = farm.females.filter(CATEGORY_DEFINITIONS.multiparous).length;
  
  return { heifers, primiparous, secundiparous, multiparous };
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

// Get bull PTA value using label to field mapping
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