import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MothersPtaRow = {
  category: string;
  hhp_dollar: number;
  tpi: number;
  nm_dollar: number;
  cm_dollar: number;
  fm_dollar: number;
};

export function useMothersPtaMeans(farmId?: string) {
  const [rows, setRows] = useState<MothersPtaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!farmId) return;
    setLoading(true); setError(null);
    const { data, error } = await supabase.rpc("app.ag_get_mothers_pta_means", {
      p_farm_id: farmId,
    });
    if (error) setError(error.message);
    setRows((data as MothersPtaRow[]) ?? []);
    setLoading(false);
  }, [farmId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { rows, loading, error, refetch };
}
