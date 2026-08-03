import { useCallback } from "react";
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
  /** Seleção de PTAs do Passo 3, por fazenda (legado, mantido por compatibilidade). */
  step3TraitsByFarm: Record<string, string[]>;
  /** Qualquer outra seleção de passo: settingsByFarm[farmKey][settingKey] */
  settingsByFarm: Record<string, Record<string, unknown>>;
  getStep3Traits: (farmId?: string | number) => string[];
  setStep3Traits: (farmId: string | number | undefined, traits: string[]) => void;
  setSetting: (farmId: string | number | undefined, key: string, value: unknown) => void;
}

export const farmKeyOf = (farmId?: string | number) =>
  farmId != null && String(farmId).length > 0 ? String(farmId) : "__none__";

export const useAGSelections = create<AGSelectionsState>()(
  persist(
    (set, get) => ({
      step3TraitsByFarm: {},
      settingsByFarm: {},
      getStep3Traits: (farmId) =>
        get().step3TraitsByFarm[farmKeyOf(farmId)] ?? AG_STEP3_DEFAULT_PTAS,
      setStep3Traits: (farmId, traits) => {
        const key = farmKeyOf(farmId);
        set((s) => ({
          step3TraitsByFarm: { ...s.step3TraitsByFarm, [key]: traits },
        }));
      },
      setSetting: (farmId, settingKey, value) => {
        const key = farmKeyOf(farmId);
        set((s) => ({
          settingsByFarm: {
            ...s.settingsByFarm,
            [key]: { ...(s.settingsByFarm[key] ?? {}), [settingKey]: value },
          },
        }));
      },
    }),
    { name: "ag-selections-v1" }
  )
);

/**
 * useState persistido por fazenda para as seleções da Auditoria Genética.
 * Mesma assinatura de useState — inclusive updater funcional.
 */
export function useAGSetting<T>(settingKey: string, defaultValue: T) {
  const farmId = useAGFilters((s) => s.farmId);
  const key = farmKeyOf(farmId);
  const stored = useAGSelections((s) => s.settingsByFarm[key]?.[settingKey]) as T | undefined;
  const setSetting = useAGSelections((s) => s.setSetting);

  const value = stored === undefined ? defaultValue : stored;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prevStored = useAGSelections.getState().settingsByFarm[key]?.[settingKey] as
        | T
        | undefined;
      const prev = prevStored === undefined ? defaultValue : prevStored;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      setSetting(farmId, settingKey, resolved);
    },
    // defaultValue intencionalmente fora das deps (pode ser literal recriado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [farmId, key, settingKey, setSetting]
  );

  return [value, setValue] as [T, (next: T | ((prev: T) => T)) => void];
}
