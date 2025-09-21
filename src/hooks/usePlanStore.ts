import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// PTA canonical mapping dictionary - fixes PL/DPR/HHP$ loading issues
export const PTA_MAPPING: Record<string, string> = {
  "NM$": "nm_dollar",
  "TPI": "tpi", 
  "PL": "pl",
  "DPR": "dpr",
  "ÍHHP$": "ihhp_dollar",
  "HHP$": "ihhp_dollar", 
  "ÍHHP$®": "ihhp_dollar",
  "CM$": "cm_dollar",
  "FM$": "fm_dollar", 
  "GM$": "gm_dollar",
  "F SAV": "f_sav",
  "PTAM": "ptam",
  "CFP": "cfp",
  "PTAF": "ptaf",
  "PTAF%": "ptaf_percent",
  "PTAP": "ptap", 
  "PTAP%": "ptap_percent",
  "LIV": "liv",
  "SCS": "scs",
  "MAST": "mast",
  "MET": "met",
  "RP": "rp",
  "DA": "da",
  "KET": "ket",
  "MF": "mf",
  "PTAT": "ptat",
  "UDC": "udc",
  "FLC": "flc",
  "SCE": "sce",
  "DCE": "dce",
  "SSB": "ssb",
  "DSB": "dsb",
  "H LIV": "h_liv",
  "CCR": "ccr",
  "HCR": "hcr",
  "FI": "fi",
  "GL": "gl",
  "EFC": "efc",
  "BWC": "bwc",
  "STA": "sta",
  "STR": "str",
  "DFM": "dfm",
  "RUA": "rua",
  "RLS": "rls",
  "RTP": "rtp",
  "FTL": "ftl",
  "RW": "rw",
  "RLR": "rlr",
  "FTA": "fta",
  "FLS": "fls",
  "FUA": "fua",
  "RUH": "ruh",
  "RUW": "ruw",
  "UCL": "ucl",
  "UDP": "udp",
  "FTP": "ftp",
  "RFI": "rfi"
};

// Normalize PTA label to canonical key
export const normalizePTAKey = (label: string): string => {
  return PTA_MAPPING[label] || label.toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Get display label from canonical key
export const getPTADisplayLabel = (canonicalKey: string): string => {
  const entry = Object.entries(PTA_MAPPING).find(([_, value]) => value === canonicalKey);
  return entry ? entry[0] : canonicalKey;
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
  selectedPTAKeys: string[]; // max 5, canonical keys in user order
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
  selectedPTAKeys: ["nm_dollar", "tpi", "pl", "dpr", "ihhp_dollar"], // canonical keys
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
          const ptaHeaders = newKeys.map(key => ({ 
            label: getPTADisplayLabel(key), 
            key 
          }));
          console.log('ptaHeaders=', ptaHeaders);
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
        // Use canonical key to get value from database
        const value = f[ptaKey] || 0;
        return typeof value === 'number' ? value : 0;
      }).filter(v => v !== 0);
      
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      result[categoryKey][ptaKey] = average;
    });
  });
  
  return result;
};

// Get bull PTA value with proper mapping
export const getBullPTAValue = (bull: any, ptaKey: string): number => {
  const value = bull[ptaKey];
  if (typeof value === 'number') {
    console.log(`PTA ${getPTADisplayLabel(ptaKey)}: ${value} (from bull ${bull.nome || bull.naab})`);
    return value;
  }
  console.log(`PTA ${getPTADisplayLabel(ptaKey)}: — (Sem valor para ${ptaKey})`);
  return 0;
};