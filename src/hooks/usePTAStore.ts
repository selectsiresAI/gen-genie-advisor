import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

// PTA Label to Database Column Mapping
export const PTA_COLUMN_MAP: Record<string, string> = {
  "HHP$®": "hhp_dollar",
  "HHP$": "hhp_dollar", 
  "TPI": "tpi",
  "NM$": "nm_dollar",
  "CM$": "cm_dollar",
  "FM$": "fm_dollar",
  "GM$": "gm_dollar",
  "F SAV": "f_sav",
  "PTAM": "ptam",
  "CFP": "cfp",
  "PTAF": "ptaf",
  "PTAF%": "ptaf_pct",
  "PTAP": "ptap",
  "PTAP%": "ptap_pct",
  "PL": "pl",
  "DPR": "dpr",
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
  "RFI": "rfi",
  "GFI": "gfi",
  "Beta-Casein": "beta_casein",
  "Kappa-Casein": "kappa_casein"
};

// Category mapping: parity values to category names
const PARITY_TO_CATEGORY = {
  0: 'novilha',
  1: 'primipara', 
  2: 'secundipara',
  '>=3': 'multipara'
} as const;

export type CategoryKey = 'novilha' | 'primipara' | 'secundipara' | 'multipara';

interface PTAMeansByCategory {
  [ptaKey: string]: {
    novilha: number;
    primipara: number;
    secundipara: number;
    multipara: number;
  };
}

interface PTAStoreState {
  selectedHerdId: string | null;
  ptaMeansByCategory: PTAMeansByCategory;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSelectedHerdId: (herdId: string | null) => void;
  loadPtaMeansForHerd: (herdId: string, ptaLabels: string[]) => Promise<void>;
  clearPtaMeans: () => void;
}

// Helper function to get database column name from PTA label
function getPTAColumn(ptaLabel: string): string {
  return PTA_COLUMN_MAP[ptaLabel] || ptaLabel.toLowerCase().replace(/[^\w]/g, '_');
}

// Helper function to validate numeric value and weight
function validateValue(value: any): number | null {
  const num = Number(value);
  return isFinite(num) ? num : null;
}

function validateWeight(weight: any): number {
  const num = Number(weight);
  return isFinite(num) && num > 0 ? num : 1;
}

// Calculate weighted mean for a list of values and weights
function calculateWeightedMean(values: Array<{value: number, weight: number}>): number {
  if (!values.length) return 0;
  
  const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return 0;
  
  const weightedSum = values.reduce((sum, item) => sum + (item.value * item.weight), 0);
  return Math.round(weightedSum / totalWeight);
}

export const usePTAStore = create<PTAStoreState>((set, get) => ({
  selectedHerdId: null,
  ptaMeansByCategory: {},
  loading: false,
  error: null,

  setSelectedHerdId: (herdId) => {
    set({ selectedHerdId: herdId });
  },

  loadPtaMeansForHerd: async (herdId: string, ptaLabels: string[]) => {
    if (!herdId || !ptaLabels.length) {
      set({ ptaMeansByCategory: {}, error: null });
      return;
    }

    set({ loading: true, error: null });

    try {
      // Get all data for the herd using range to fetch up to 10000 records
      const { data, error } = await supabase
        .rpc('get_females_denorm', { target_farm_id: herdId })
        .range(0, 9999); // Fetch up to 10000 records

      if (error) throw error;

      if (!data || data.length === 0) {
        set({ ptaMeansByCategory: {}, loading: false });
        return;
      }

      const newPtaMeans: PTAMeansByCategory = {};

      // Process each PTA label
      ptaLabels.forEach(ptaLabel => {
        const columnName = getPTAColumn(ptaLabel);
        
        // Group data by parity categories
        const categoryData: Record<CategoryKey, Array<{value: number, weight: number}>> = {
          novilha: [],
          primipara: [],
          secundipara: [],
          multipara: []
        };

        data.forEach((row: any) => {
          const parityOrder = row.parity_order;
          const ptaValue = validateValue(row[columnName]);
          
          if (ptaValue === null) return; // Skip null/invalid values
          
          // Determine weight (try rel, then reliability, then weight_pta, fallback to 1)
          const weight = validateWeight(row.rel || row.reliability || row.weight_pta);
          
          // Categorize by parity_order
          let category: CategoryKey;
          if (parityOrder === 0) category = 'novilha';
          else if (parityOrder === 1) category = 'primipara';
          else if (parityOrder === 2) category = 'secundipara';
          else if (parityOrder >= 3) category = 'multipara';
          else return; // Skip invalid parity values
          
          categoryData[category].push({ value: ptaValue, weight });
        });

        // Calculate weighted means for each category
        newPtaMeans[ptaLabel] = {
          novilha: calculateWeightedMean(categoryData.novilha),
          primipara: calculateWeightedMean(categoryData.primipara),
          secundipara: calculateWeightedMean(categoryData.secundipara),
          multipara: calculateWeightedMean(categoryData.multipara)
        };
      });

      set({ 
        ptaMeansByCategory: newPtaMeans, 
        loading: false,
        selectedHerdId: herdId
      });

    } catch (error: any) {
      console.error('Error loading PTA means:', error);
      set({ 
        error: error.message || 'Erro ao carregar PTAs médias',
        loading: false
      });
    }
  },

  clearPtaMeans: () => {
    set({ ptaMeansByCategory: {}, error: null });
  }
}));