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
  console.log('🔍 getFemalesByFarm called with farmId:', farmId);
  
  // Priority 1: window.Rebanho?.femalesByFarm?.[selectedFarmId]
  const rebanhoCache = (window as any).Rebanho?.femalesByFarm?.[farmId];
  if (Array.isArray(rebanhoCache)) {
    console.log('✅ Found data in window.Rebanho, count:', rebanhoCache.length);
    return rebanhoCache;
  }
  
  // Priority 2: window.ToolSS?.cache?.femalesByFarm?.[selectedFarmId]
  const toolssCache = (window as any).ToolSS?.cache?.femalesByFarm?.[farmId];
  if (Array.isArray(toolssCache)) {
    console.log('✅ Found data in window.ToolSS, count:', toolssCache.length);
    return toolssCache;
  }
  
  // Priority 3: JSON.parse(localStorage.getItem("toolss.femalesByFarm")||"{}")[selectedFarmId]
  try {
    const map = JSON.parse(localStorage.getItem("toolss.femalesByFarm") || "{}");
    if (Array.isArray(map?.[farmId])) {
      console.log('✅ Found data in localStorage toolss.femalesByFarm, count:', map[farmId].length);
      return map[farmId];
    }
  } catch (e) {
    console.warn('Error parsing toolss.femalesByFarm from localStorage:', e);
  }
  
  // Priority 4: Check ToolSSApp data format (toolss_clients_v2_with_500_females)
  try {
    const toolssData = localStorage.getItem("toolss_clients_v2_with_500_females");
    if (toolssData) {
      const clients = JSON.parse(toolssData);
      console.log('🔍 Found ToolSSApp data, clients count:', clients.length);
      
      for (const client of clients) {
        if (client.farms) {
          const farm = client.farms.find((f: any) => f.id === farmId);
          if (farm && Array.isArray(farm.females)) {
            console.log('✅ Found farm data in ToolSSApp, females count:', farm.females.length);
            console.log('📋 Sample female:', farm.females[0]);
            return farm.females;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error parsing ToolSSApp data from localStorage:', e);
  }
  
  console.log('❌ No females found for farmId:', farmId);
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
  
  // Utility function for automatic categorization (same as in ToolSSApp)
  function categorizeAnimal(nascimento: string, ordemParto?: number): string {
    if (!nascimento) return "Novilha"; // Default if no birth date
    
    const birthDate = new Date(nascimento);
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Se não tem ordem de parto definida, assumir 0
    const parity = ordemParto || 0;
    
    // Bezerra: do nascimento até 90 dias
    if (ageInDays <= 90) {
      return "Bezerra";
    }
    
    // Baseado na ordem de parto
    if (parity === 0) {
      return "Novilha"; // Após 90 dias e nunca pariu
    } else if (parity === 1) {
      return "Primípara"; // Pariu uma vez
    } else if (parity === 2) {
      return "Secundípara"; // Pariu duas vezes
    } else if (parity >= 3) {
      return "Multípara"; // Pariu 3 ou mais vezes
    }
    
    return "Novilha"; // Default
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
  
  // Log for debugging
  console.log('🔍 Population count details:', {
    total: list.length,
    heifers,
    primiparous,
    secundiparous,
    multiparous,
    missingCategoriaCount
  });
  
  const total = heifers + primiparous + secundiparous + multiparous;
  return { heifers, primiparous, secundiparous, multiparous, total };
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

// Calculate population structure from farm data using categoria (coluna H)
export const calculatePopulationStructure = (farmId: string): PopulationCounts => {
  console.log('calculatePopulationStructure called for farmId:', farmId);
  
  // Item 1: obter lista de fêmeas das fontes front-end
  const females = getFemalesByFarm(farmId);
  
  if (!Array.isArray(females) || females.length === 0) {
    console.log('No females found in any data source for farm:', farmId);
    return { heifers: 0, primiparous: 0, secundiparous: 0, multiparous: 0, total: 0 };
  }
  
  console.log('Total females found:', females.length);
  
  // Log sample data to verify category format
  console.log('Sample females (first 3):', females.slice(0, 3).map((f: any) => ({
    nome: f.nome || f[0] || 'N/A',
    categoria: f?.Categoria ?? f?.categoria ?? f?.[7] ?? 'N/A',
    rawRow: Array.isArray(f) ? `Array[${f.length}]` : 'Object'
  })));
  
  // Item 3: usar contagem por categoria (coluna H)
  const counts = countFromCategoria(females);
  console.log('Category counts from coluna H:', counts);
  
  return counts;
};

// Calculate mother averages from farm data
const calculateMotherAverages = (farm: any, ptaLabels: string[]): Record<string, Record<string, number>> => {
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
export { getFemalesByFarm, normalizeCategoria, countFromCategoria, calculateMotherAverages };
export const getBullPTAValue = (bull: any, ptaLabel: string): number | null => {
  let fieldName = LABEL_TO_FIELD[ptaLabel] || ptaLabel;
  
  // Special mapping for HHP$® to match Supabase data format
  if (ptaLabel === "HHP$®") {
    fieldName = "HHP$"; // Look for HHP$ in the bull data (from Supabase conversion)
  }
  
  const value = bull[fieldName];
  if (typeof value === 'number' && value !== 0) {
    console.log(`PTA ${ptaLabel}: ${value} (from bull ${bull.nome || bull.naab})`);
    return value;
  }
  console.log(`PTA ${ptaLabel}: — (field: ${fieldName}, value: ${value}, type: ${typeof value})`);
  return null; // Return null instead of 0 to show "—"
};