import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

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
      // Query females_denorm table to get counts by parity
      const { data, error } = await supabase
        .from('females_denorm')
        .select('parity_order, birth_date')
        .eq('farm_id', targetFarmId);

      if (error) {
        console.error('Error fetching females from Supabase:', error);
        return;
      }

      const counts: DashboardCounts = {
        "Total de Fêmeas": 0,
        "Bezerra": 0,
        "Novilhas": 0,
        "Primíparas": 0,
        "Secundíparas": 0,
        "Multíparas": 0
      };

      // Calculate categories based on parity_order and birth_date
      data?.forEach(female => {
        counts["Total de Fêmeas"]++;
        
        // Apply the same logic as HerdPage's getAutomaticCategory
        const birthDate = female.birth_date;
        const parityOrder = female.parity_order;
        
        if (birthDate) {
          const birth = new Date(birthDate);
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
          
          // Bezerras - até 90 dias pós nascimento e ordem de parto 0 ou null
          if (daysDiff <= 90 && (!parityOrder || parityOrder === 0)) {
            counts["Bezerra"]++;
          }
          // Novilhas - de 91 dias após nascimento até primeiro parto (ordem de parto 0 ou null)
          else if (daysDiff > 90 && (!parityOrder || parityOrder === 0)) {
            counts["Novilhas"]++;
          }
          // Primípara - ordem de parto 1
          else if (parityOrder === 1) {
            counts["Primíparas"]++;
          }
          // Secundípara - ordem de parto 2
          else if (parityOrder === 2) {
            counts["Secundíparas"]++;
          }
          // Multípara - ordem de parto 3 ou maior
          else if (parityOrder && parityOrder >= 3) {
            counts["Multíparas"]++;
          }
        } else {
          // If no birth_date, classify based on parity_order only
          if (!parityOrder || parityOrder === 0) {
            counts["Novilhas"]++;
          } else if (parityOrder === 1) {
            counts["Primíparas"]++;
          } else if (parityOrder === 2) {
            counts["Secundíparas"]++;
          } else if (parityOrder >= 3) {
            counts["Multíparas"]++;
          }
        }
      });

      set({ dashboardCounts: counts });
    } catch (error) {
      console.error('Error in refreshFromSupabase:', error);
    }
  }
}));

export { getInt };