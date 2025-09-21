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
  selectedPTAKeys: string[]; // max 5, exact database column names in user order
  populationMode: 'auto' | 'manual';
  populationCounts: PopulationCounts;
  motherAverages: Record<string, Record<string, number>>; // category -> pta -> value
  
  // Actions
  setSelectedFarmId: (farmId: string | null) => void;
  setSelectedPTAKeys: (keys: string[]) => void;
  setPopulationMode: (mode: 'auto' | 'manual') => void;
  setPopulationCounts: (counts: PopulationCounts) => void;
  setMotherAverages: (averages: Record<string, Record<string, number>>) => void;
  
  // Utilities
  reset: () => void;
}

// Initial state
const initialState = {
  selectedFarmId: null,
  selectedPTAKeys: ["HHP$®", "TPI", "NM$", "PL", "DPR"], // exact database column names
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
      
      setSelectedPTAKeys: (keys) => {
        const current = get().selectedPTAKeys;
        const newKeys = keys.slice(0, 5); // max 5
        if (JSON.stringify(current) !== JSON.stringify(newKeys)) {
          console.log('selectedPTAKeys=', newKeys);
          console.log('ptaHeaders=', newKeys.map(key => ({ label: key, key })));
          set({ selectedPTAKeys: newKeys });
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
        selectedPTAKeys: state.selectedPTAKeys,
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
export const calculateMotherAverages = (farm: any, ptaKeys: string[]): Record<string, Record<string, number>> => {
  if (!farm?.females || ptaKeys.length === 0) {
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
    
  ptaKeys.forEach(ptaKey => {
    const values = females.map((f: any) => {
      // Use exact database column name to get value
      const value = f[ptaKey] || 0;
      return typeof value === 'number' ? value : 0;
    }).filter(v => v !== 0);
      
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      result[categoryKey][ptaKey] = average;
    });
  });
  
  return result;
};

// Get bull PTA value using exact database column names
export const getBullPTAValue = (bull: any, ptaKey: string): number => {
  const value = bull[ptaKey];
  if (typeof value === 'number') {
    console.log(`PTA ${ptaKey}: ${value} (from bull ${bull.nome || bull.naab})`);
    return value;
  }
  console.log(`PTA ${ptaKey}: — (Sem valor para ${ptaKey})`);
  return 0;
};