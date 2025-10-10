import { useQuery } from "@tanstack/react-query";
import { fetchFemalesDenormByFarm } from "@/supabase/queries/females";

export function useFemales(farmId?: string | number) {
  return useQuery({
    enabled: !!farmId,
    queryKey: ["females_denorm", farmId],
    queryFn: () => fetchFemalesDenormByFarm(farmId!),
    staleTime: 60_000,
  });
}
