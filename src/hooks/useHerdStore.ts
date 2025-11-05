import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { calculateCategoryCounts } from '@/utils/femaleCategories';

// Helper function for defensive number parsing
function getInt(map: Record<string, number | undefined | null>, key: string): number {
  const n = Number(map?.[key]);
  return Number.isFinite(n) ? n : 0;
}

interface DashboardCounts {
  "Total de Fêmeas": number;
  "Bezerra": number;
  "Novilhas": number;
  "Primíparas": number;
  "Secundíparas": number;
  "Multíparas": number;
  [key: string]: number; // Add index signature
}

interface HerdStore {
  selectedHerdId: string | null;
  dashboardCounts: DashboardCounts | null;
  setSelectedHerdId: (id: string | null) => void;
  setDashboardCounts: (counts: DashboardCounts) => void;
  refreshFromSupabase: (farmId?: string | null) => Promise<void>;
}

export const useHerdStore = create<HerdStore>((set, get) => ({
  selectedHerdId: null,
  dashboardCounts: null,

  setSelectedHerdId: (id: string | null) => {
    set({ selectedHerdId: id });
  },

  setDashboardCounts: (counts: DashboardCounts) => {
    set({ dashboardCounts: counts });
  },

  refreshFromSupabase: async (farmId?: string | null) => {
    const targetFarmId = farmId || get().selectedHerdId;
    if (!targetFarmId) return;

    try {
      // Query females_denorm table
      const { data, error } = await supabase
        .from('females_denorm')
        .select('birth_date')
        .eq('farm_id', targetFarmId);

      if (error) {
        console.error('Error fetching females from Supabase:', error);
        return;
      }

      // Use a função centralizada para calcular as contagens
      const categoryCounts = calculateCategoryCounts(data || []);

      set({ 
        dashboardCounts: {
          "Total de Fêmeas": categoryCounts.total,
          "Bezerra": categoryCounts.bezerras,
          "Novilhas": categoryCounts.novilhas,
          "Primíparas": categoryCounts.primiparas,
          "Secundíparas": categoryCounts.secundiparas,
          "Multíparas": categoryCounts.multiparas
        }
      });
    } catch (error) {
      console.error('Error in refreshFromSupabase:', error);
    }
  }
}));

export { getInt };