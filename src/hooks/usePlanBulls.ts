"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export type PlanBull = {
  id: string;
  name: string;
  price_sexed: number | null;
  price_conv: number | null;
  pta_milk?: number | null;
  pta_fat?: number | null;
  pta_prot?: number | null;
  pl?: number | null;
  dpr?: number | null;
  scs?: number | null;
  nm_dollar?: number | null;
  hhp_dollar?: number | null;
  tpi?: number | null;
  cm_dollar?: number | null;
  fm_dollar?: number | null;
};

export function usePlanBulls(planId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const [bulls, setBulls] = useState<PlanBull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("plan_bulls_view")
        .select(
          `
          id, name,
          price_sexed, price_conv,
          pta_milk, pta_fat, pta_prot, pl, dpr, scs,
          nm_dollar, hhp_dollar, tpi, cm_dollar, fm_dollar
        `,
        )
        .eq("plan_id", planId);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name ?? "Touro",
        price_sexed: r.price_sexed ?? null,
        price_conv: r.price_conv ?? null,
        pta_milk: r.pta_milk ?? r.milk_kg ?? r.milk ?? null,
        pta_fat: r.pta_fat ?? r.fat_kg ?? r.fat ?? null,
        pta_prot: r.pta_prot ?? r.protein_kg ?? r.protein ?? null,
        pl: r.pl ?? r.productive_life ?? r.pl_mo ?? null,
        dpr: r.dpr ?? r.daughter_pregnancy_rate ?? null,
        scs: r.scs ?? r.somatic_cell_score ?? null,
        nm_dollar: r.nm_dollar ?? r.nm_index ?? null,
        hhp_dollar: r.hhp_dollar ?? r.hhp_index ?? null,
        tpi: r.tpi ?? r.tpi_index ?? null,
        cm_dollar: r.cm_dollar ?? r.cm_index ?? null,
        fm_dollar: r.fm_dollar ?? r.fm_index ?? null,
      })) as PlanBull[];

      setBulls(mapped);
      setLoading(false);
    })();
  }, [planId, supabase]);

  return { bulls, loading, error };
}
