import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFemales(farmId?: string | number) {
  return useQuery({
    enabled: !!farmId,
    queryKey: ["females_denorm", farmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_females_denorm", { target_farm_id: String(farmId) });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });
}
