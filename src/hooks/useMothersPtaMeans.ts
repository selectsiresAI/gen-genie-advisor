import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export type MothersPtaRow = {
  category: string;
  hhp_dollar: number;
  tpi: number;
  nm_dollar: number;
  cm_dollar: number;
  fm_dollar: number;
};

export function useMothersPtaMeans(farmId?: string) {
  const supabase = createClient();
  const [rows, setRows] = useState<MothersPtaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!farmId) return;
    setLoading(true); setError(null);
    const { data, error } = await supabase.rpc("ag_get_mothers_pta_means", { p_farm_id: farmId });
    if (error) setError(error.message);
    setRows((data as MothersPtaRow[]) ?? []);
    setLoading(false);
  }, [farmId, supabase]);

  useEffect(() => { refetch(); }, [refetch]);

  return { rows, loading, error, refetch };
}
