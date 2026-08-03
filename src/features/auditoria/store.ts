import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Categoria = "bezerra" | "novilha" | "primipara" | "secundipara" | "multipara" | "todas";
export type Segmentacao = "superior" | "intermediario" | "inferior" | "todas";

export interface AGFiltersState {
  farmId?: string | number;
  anos: number[];
  indiceBase: string;
  benchmark: {
    origem: "EUA" | "BR";
    percentil: "top10" | "top5" | "top1" | "media";
  };
  categoria: Categoria;
  segmentacao: Segmentacao;
  ptasSelecionadas: string[];

  setFarmId: (id?: string | number) => void;
  setAnos: (anos: number[]) => void;
  setIndiceBase: (k: string) => void;
  setBenchmark: (b: AGFiltersState["benchmark"]) => void;
  setCategoria: (c: Categoria) => void;
  setSegmentacao: (s: Segmentacao) => void;
  setPTAs: (keys: string[]) => void;
}

export const useAGFilters = create<AGFiltersState>((set) => ({
  farmId: undefined,
  anos: [],
  indiceBase: "hhp_dollar",
  benchmark: { origem: "EUA", percentil: "top5" },
  categoria: "todas",
  segmentacao: "todas",
  ptasSelecionadas: ["tpi", "hhp_dollar", "nm_dollar"],

  setFarmId: (farmId) => set({ farmId }),
  setAnos: (anos) => set({ anos }),
  setIndiceBase: (indiceBase) => set({ indiceBase }),
  setBenchmark: (benchmark) => set({ benchmark }),
  setCategoria: (categoria) => set({ categoria }),
  setSegmentacao: (segmentacao) => set({ segmentacao }),
  setPTAs: (ptasSelecionadas) => set({ ptasSelecionadas }),
}));

/**
 * Seleções do usuário na Auditoria Genética (persistidas por fazenda).
 * Mantém as escolhas ao navegar entre passos, recarregar a página
 * e ao gerar o Relatório Geral.
 */
export const AG_STEP3_DEFAULT_PTAS = [
  "tpi",
  "ptam",
  "fm_dollar",
  "cm_dollar",
  "nm_dollar",
  "gm_dollar",
  "hhp_dollar",
];

interface AGSelectionsState {
  step3TraitsByFarm: Record<string, string[]>;
  getStep3Traits: (farmId?: string | number) => string[];
  setStep3Traits: (farmId: string | number | undefined, traits: string[]) => void;
}

export const useAGSelections = create<AGSelectionsState>()(
  persist(
    (set, get) => ({
      step3TraitsByFarm: {},
      getStep3Traits: (farmId) => {
        const key = farmId != null ? String(farmId) : "__none__";
        return get().step3TraitsByFarm[key] ?? AG_STEP3_DEFAULT_PTAS;
      },
      setStep3Traits: (farmId, traits) => {
        const key = farmId != null ? String(farmId) : "__none__";
        set((s) => ({
          step3TraitsByFarm: { ...s.step3TraitsByFarm, [key]: traits },
        }));
      },
    }),
    { name: "ag-selections-v1" }
  )
);
