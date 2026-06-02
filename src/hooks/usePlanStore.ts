import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAutomaticCategory } from '@/utils/femaleCategories';

// Lista completa de PTAs disponíveis (fonte de verdade única)
// Exatamente como aparecem no banco de fêmeas, na ordem especificada
export const AVAILABLE_PTAS = [
  "HHP$®", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", "CFP", "PTAF", 
  "PTAF%", "PTAP", "PTAP%", "PL", "DPR", "LIV", "SCS", "MAST", "MET", "RP", 
  "DA", "KET", "MF", "PTAT", "UDC", "FLC", "SCE", "DCE", "SSB", "DSB", 
  "H LIV", "CCR", "HCR", "FI", "GL", "EFC", "BWC", "STA", "STR", "DFM", 
  "RUA", "RLS", "RTP", "FTL", "RW", "RLR", "FTA", "FLS", "FUA", "RUH", 
  "RUW", "UCL", "UDP", "FTP", "RFI", "GFI"
] as const;


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
          set({ selectedFarmId: farmId });
        }
      },
      
      setSelectedPTAList: (labels) => {
        const current = get().selectedPTAList;
        const newLabels = labels.slice(0, 5); // max 5
        if (JSON.stringify(current) !== JSON.stringify(newLabels)) {
          set({ selectedPTAList: newLabels });
        }
      },
      
      setPopulationMode: (mode) => {
        const current = get().populationMode;
        if (current !== mode) {
          set({ populationMode: mode });
        }
      },
      
      setPopulationCounts: (counts) => {
        const current = get().populationCounts;
        if (JSON.stringify(current) !== JSON.stringify(counts)) {
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
  // Priority 1: window.Rebanho?.femalesByFarm?.[selectedFarmId]
  const rebanhoCache = (window as any).Rebanho?.femalesByFarm?.[farmId];
  if (Array.isArray(rebanhoCache)) {
    return rebanhoCache;
  }

  // Priority 2: window.ToolSS?.cache?.femalesByFarm?.[selectedFarmId]
  const toolssCache = (window as any).ToolSS?.cache?.femalesByFarm?.[farmId];
  if (Array.isArray(toolssCache)) {
    return toolssCache;
  }

  // Priority 3: JSON.parse(localStorage.getItem("toolss.femalesByFarm")||"{}")[selectedFarmId]
  try {
    const map = JSON.parse(localStorage.getItem("toolss.femalesByFarm") || "{}");
    if (Array.isArray(map?.[farmId])) {
      return map[farmId];
    }
  } catch (e) {
    // Error parsing toolss.femalesByFarm from localStorage
  }

  // Priority 4: Check ToolSSApp data format (toolss_clients_v2_with_500_females)
  try {
    const toolssData = localStorage.getItem("toolss_clients_v2_with_500_females");
    if (toolssData) {
      const clients = JSON.parse(toolssData);
      for (const client of clients) {
        if (client.farms) {
          const farm = client.farms.find((f: any) => f.id === farmId);
          if (farm && Array.isArray(farm.females)) {
            return farm.females;
          }
        }
      }
    }
  } catch (e) {
    // Error parsing ToolSSApp data from localStorage
  }

  return [];
}

// Normalização robusta para mojibake (Item 2)
function normalizeCategoria(raw: any): string | null {
  if (!raw) return null;
  
  // Converte para string, normaliza NFD e remove diacríticos
  const s = String(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^\p{L}]/gu, '') // Remove separadores/dígitos/sinais
    .toUpperCase();
  
  // Classificação por padrões inclusivos (singular/plural e mojibake)
  if (s.includes('NOVILH')) return 'NOVILHA';
  if (s.includes('SECUND') && s.includes('PARA')) return 'SECUNDIPARA';
  if (s.includes('MULT') && s.includes('PARA')) return 'MULTIPARA';
  if (s.includes('PRIM') && s.includes('PARA') && !s.includes('SECUND') && !s.includes('MULT')) return 'PRIMIPARA';
  
  return null;
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

// Contagem por categoria (coluna H) - Item 3
function countFromCategoria(list: any[]): PopulationCounts {
  let heifers = 0, primiparous = 0, secundiparous = 0, multiparous = 0;
  let missingCategoriaCount = 0;
  
  // Utility function using centralized category logic
  function categorizeAnimal(nascimento: string, ordemParto?: number): string {
    if (!nascimento) return "Novilha"; // Default if no birth date
    
    return getAutomaticCategory(nascimento, null);
  }
  
  for (const row of list) {
    // Use existing category or calculate from birth date and parity
    let category = row?.categoria || row?.Categoria || row?.[7];
    
    // If no category, calculate it from birth date and parity
    if (!category) {
      category = categorizeAnimal(row?.nascimento, row?.ordemParto);
      missingCategoriaCount++;
    }
    
    // Normalize and count
    const normalizedCat = normalizeCategoria(category);
    
    switch (normalizedCat) {
      case 'NOVILHA':
        heifers++;
        break;
      case 'PRIMIPARA':
        primiparous++;
        break;
      case 'SECUNDIPARA':
        secundiparous++;
        break;
      case 'MULTIPARA':
        multiparous++;
        break;
      default:
        // Try direct matching for calculated categories
        const directCat = String(category).toLowerCase();
        if (directCat.includes('novilha')) heifers++;
        else if (directCat.includes('primípara')) primiparous++;
        else if (directCat.includes('secundípara')) secundiparous++;
        else if (directCat.includes('multípara')) multiparous++;
        break;
    }
  }
  
  const total = heifers + primiparous + secundiparous + multiparous;
  return { heifers, primiparous, secundiparous, multiparous, total };
}

// Category definitions using centralized function
export const CATEGORY_DEFINITIONS = {
  heifers: (female: any) => {
    const category = getAutomaticCategory(female.birth_date || female.nascimento, null);
    return category === 'Novilha' || category === 'Bezerra' || 
           female.categoria === "Novilha" || female.categoria === "Calf" || female.categoria === "Heifer";
  },
  primiparous: (female: any) => {
    const category = getAutomaticCategory(female.birth_date || female.nascimento, null);
    return category === 'Primípara' || 
           female.categoria === "Primípara" || female.categoria === "Primiparous";
  }, 
  secundiparous: (female: any) => {
    const category = getAutomaticCategory(female.birth_date || female.nascimento, null);
    return category === 'Secundípara' || 
           female.categoria === "Secundípara" || female.categoria === "Secondiparous";
  },
  multiparous: (female: any) => {
    const category = getAutomaticCategory(female.birth_date || female.nascimento, null);
    return category === 'Multípara' || 
           female.categoria === "Multípara" || female.categoria === "Multiparous";
  }
};

// Calculate population structure from farm data using categoria (coluna H)
export const calculatePopulationStructure = (farmId: string): PopulationCounts => {
  // Item 1: obter lista de fêmeas das fontes front-end
  const females = getFemalesByFarm(farmId);

  if (!Array.isArray(females) || females.length === 0) {
    return { heifers: 0, primiparous: 0, secundiparous: 0, multiparous: 0, total: 0 };
  }

  // Item 3: usar contagem por categoria (coluna H)
  const counts = countFromCategoria(females);
  return counts;
};


// Export utility functions
export { getFemalesByFarm, normalizeCategoria, countFromCategoria };

/**
 * Obtém o valor de uma PTA de um touro, com mapeamento robusto de nomes de campo.
 * Suporta múltiplos aliases para cada PTA (ex: "HHP$®" → "HHP$" → "hhp_dollar").
 */
export const getBullPTAValue = (bull: any, ptaLabel: string): number | null => {
  if (!bull) return null;

  // Lista de possíveis nomes de campo para cada PTA (ordem de prioridade)
  const fieldAliases: Record<string, string[]> = {
    "HHP$®": ["HHP$®", "HHP$", "hhp_dollar"],
    "HHP$": ["HHP$", "HHP$®", "hhp_dollar"],
    "NM$": ["NM$", "nm_dollar"],
    "TPI": ["TPI", "tpi"],
    "CM$": ["CM$", "cm_dollar"],
    "FM$": ["FM$", "fm_dollar"],
    "GM$": ["GM$", "gm_dollar"],
    "PTAM": ["PTAM", "Milk", "ptam"],
    "PTAF": ["PTAF", "Fat", "ptaf"],
    "PTAP": ["PTAP", "Protein", "ptap"],
    "PTAF%": ["PTAF%", "Fat%", "ptaf_pct"],
    "PTAP%": ["PTAP%", "Protein%", "ptap_pct"],
    "CFP": ["CFP", "cfp"],
    "PL": ["PL", "pl"],
    "DPR": ["DPR", "dpr"],
    "LIV": ["LIV", "liv"],
    "H LIV": ["H LIV", "h_liv"],
    "SCS": ["SCS", "scs"],
    "MAST": ["MAST", "mast"],
    "MET": ["MET", "met"],
    "RP": ["RP", "rp"],
    "DA": ["DA", "da"],
    "KET": ["KET", "ket"],
    "MF": ["MF", "mf"],
    "PTAT": ["PTAT", "ptat"],
    "UDC": ["UDC", "udc"],
    "FLC": ["FLC", "flc"],
    "SCE": ["SCE", "sce"],
    "DCE": ["DCE", "dce"],
    "SSB": ["SSB", "ssb"],
    "DSB": ["DSB", "dsb"],
    "CCR": ["CCR", "ccr"],
    "HCR": ["HCR", "hcr"],
    "FI": ["FI", "fi"],
    "GL": ["GL", "gl"],
    "EFC": ["EFC", "efc"],
    "BWC": ["BWC", "bwc"],
    "STA": ["STA", "sta"],
    "STR": ["STR", "str"],
    "DFM": ["DFM", "dfm"],
    "RUA": ["RUA", "rua"],
    "RLS": ["RLS", "rls"],
    "RTP": ["RTP", "rtp"],
    "FTL": ["FTL", "ftl"],
    "RW": ["RW", "rw"],
    "RLR": ["RLR", "rlr"],
    "FTA": ["FTA", "fta"],
    "FLS": ["FLS", "fls"],
    "FUA": ["FUA", "fua"],
    "RUH": ["RUH", "ruh"],
    "RUW": ["RUW", "ruw"],
    "UCL": ["UCL", "ucl"],
    "UDP": ["UDP", "udp"],
    "FTP": ["FTP", "ftp"],
    "F SAV": ["F SAV", "f_sav"],
    "GFI": ["GFI", "gfi"],
    "RFI": ["RFI", "rfi"],
  };

  // Obter aliases para este label (ou usar o próprio label como fallback)
  const aliases = fieldAliases[ptaLabel] || [ptaLabel];

  // Tentar cada alias em ordem
  for (const alias of aliases) {
    const value = bull[alias];
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
  }

  return null;
};