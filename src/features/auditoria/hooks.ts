import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFemales(farmId?: string | number) {
  return useQuery({
    enabled: !!farmId,
    queryKey: ["females_denorm", farmId],
    queryFn: async () => {
      // Fetch ALL records by making paginated requests
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: pageData, error: pageError } = await supabase
          .rpc("get_females_denorm", { target_farm_id: String(farmId) })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (pageError) throw pageError;
        
        if (pageData && pageData.length > 0) {
          allData = [...allData, ...pageData];
          hasMore = pageData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      return allData;
    },
    staleTime: 60_000,
  });
}
