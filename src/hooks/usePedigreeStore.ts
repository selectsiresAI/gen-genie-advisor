import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Vocabulário oficial de PTAs (rótulo UI → chave interna)
export const PTA_MAPPING: Record<string, string> = {
  "HHP$®": "ihhp_dollar",
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
  "RFI": "rfi"
};

// Rótulos na ordem oficial
export const PTA_LABELS = Object.keys(PTA_MAPPING);

// Chaves internas na ordem oficial  
export const PTA_KEYS = Object.values(PTA_MAPPING);

// Pesos genéticos
export const GENETIC_WEIGHTS = {
  sire: 0.57,    // Pai
  mgs: 0.28,     // Avô Materno 
  mmgs: 0.15     // Bisavô Materno
};

// Interface para dados do touro
export interface Bull {
  naab: string;
  name?: string;
  company?: string;
  ptas: Record<string, number | null>;
}

// Interface para entrada de pedigrê
export interface PedigreeInput {
  sireNaab: string;
  mgsNaab: string;
  mmgsNaab: string;
}

// Interface para resultado de predição
export interface PredictionResult {
  predictedPTAs: Record<string, number | null>;
  sire?: Bull;
  mgs?: Bull;
  mmgs?: Bull;
  errors?: string[];
}

// Interface para entrada em lote
export interface BatchInput {
  idFazenda: string;
  nome: string;
  dataNascimento: string;
  naabPai: string;
  naabAvoMaterno: string;
  naabBisavoMaterno: string;
}

// Interface para resultado em lote
export interface BatchResult extends BatchInput {
  status: 'success' | 'error';
  errors?: string[];
  predictedPTAs?: Record<string, number | null>;
}

// Store interface
interface PedigreeState {
  // Individual prediction
  pedigreeInput: PedigreeInput;
  bullsCache: Record<string, Bull>;
  predictionResult: PredictionResult | null;
  isCalculating: boolean;
  
  // Batch prediction
  batchFile: File | null;
  batchData: BatchInput[];
  batchResults: BatchResult[];
  isBatchProcessing: boolean;
  
  // Actions
  setPedigreeInput: (input: Partial<PedigreeInput>) => void;
  setBullCache: (naab: string, bull: Bull) => void;
  setPredictionResult: (result: PredictionResult | null) => void;
  setIsCalculating: (calculating: boolean) => void;
  setBatchFile: (file: File | null) => void;
  setBatchData: (data: BatchInput[]) => void;
  setBatchResults: (results: BatchResult[]) => void;
  setIsBatchProcessing: (processing: boolean) => void;
  
  // Utilities
  clearPrediction: () => void;
  clearBatch: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  pedigreeInput: {
    sireNaab: '',
    mgsNaab: '',
    mmgsNaab: ''
  },
  bullsCache: {},
  predictionResult: null,
  isCalculating: false,
  batchFile: null,
  batchData: [],
  batchResults: [],
  isBatchProcessing: false
};

// Store with persistence
export const usePedigreeStore = create<PedigreeState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setPedigreeInput: (input) => {
        const current = get().pedigreeInput;
        set({ 
          pedigreeInput: { ...current, ...input },
          predictionResult: null // Clear previous result
        });
      },
      
      setBullCache: (naab, bull) => {
        const current = get().bullsCache;
        set({ 
          bullsCache: { ...current, [naab.toLowerCase().trim()]: bull }
        });
      },
      
      setPredictionResult: (result) => {
        set({ predictionResult: result });
      },
      
      setIsCalculating: (calculating) => {
        set({ isCalculating: calculating });
      },
      
      setBatchFile: (file) => {
        set({ batchFile: file });
      },
      
      setBatchData: (data) => {
        set({ batchData: data });
      },
      
      setBatchResults: (results) => {
        set({ batchResults: results });
      },
      
      setIsBatchProcessing: (processing) => {
        set({ isBatchProcessing: processing });
      },
      
      clearPrediction: () => {
        set({ 
          predictionResult: null,
          isCalculating: false 
        });
      },
      
      clearBatch: () => {
        set({ 
          batchFile: null,
          batchData: [],
          batchResults: [],
          isBatchProcessing: false 
        });
      },
      
      reset: () => set(initialState)
    }),
    {
      name: 'pedigree-storage',
      partialize: (state) => ({
        pedigreeInput: state.pedigreeInput,
        bullsCache: state.bullsCache
      })
    }
  )
);

// Utility functions for calculations
export const formatPTAValue = (key: string, value: number | null): string => {
  if (value === null || value === undefined) return '—';
  
  const label = Object.keys(PTA_MAPPING).find(k => PTA_MAPPING[k] === key);
  
  // Dollar traits (0 decimals)
  if (label && (label.includes('$') || label === 'HHP$®')) {
    return Math.round(value).toString();
  }
  
  // Percentage traits (2 decimals)
  if (label && label.includes('%')) {
    return value.toFixed(2);
  }
  
  // Other traits (2 decimals)
  return value.toFixed(2);
};

export const predictFromPedigree = (sire: Bull | null, mgs: Bull | null, mmgs: Bull | null): Record<string, number | null> => {
  const result: Record<string, number | null> = {};
  
  for (const key of PTA_KEYS) {
    const sireValue = sire?.ptas?.[key];
    const mgsValue = mgs?.ptas?.[key];
    const mmgsValue = mmgs?.ptas?.[key];
    
    // Se qualquer valor estiver ausente, não calcular (modo estrito)
    if (sireValue == null || mgsValue == null || mmgsValue == null) {
      result[key] = null;
      continue;
    }
    
    // Aplicar fórmula de predição
    result[key] = GENETIC_WEIGHTS.sire * sireValue + 
                  GENETIC_WEIGHTS.mgs * mgsValue + 
                  GENETIC_WEIGHTS.mmgs * mmgsValue;
  }
  
  return result;
};

export const getBullFromCache = (naab: string, cache: Record<string, Bull>): Bull | null => {
  const normalizedNaab = naab.toLowerCase().trim();
  return cache[normalizedNaab] || null;
};

export const validateNaabs = (input: PedigreeInput): string[] => {
  const errors: string[] = [];
  
  if (!input.sireNaab.trim()) {
    errors.push('NAAB do Pai é obrigatório');
  }
  
  if (!input.mgsNaab.trim()) {
    errors.push('NAAB do Avô Materno é obrigatório');
  }
  
  if (!input.mmgsNaab.trim()) {
    errors.push('NAAB do Bisavô Materno é obrigatório');
  }
  
  return errors;
};
