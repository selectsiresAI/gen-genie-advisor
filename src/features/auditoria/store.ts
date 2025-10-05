import { create } from "zustand";

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
