"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAGFilters } from "@/features/auditoria/store";

type Segment =
  | "Bezerra"
  | "Novilha"
  | "Primípara"
  | "Secundípara"
  | "Multípara";

type Counts = Record<Segment | "Total", number>;

const COLORS: Record<Segment, string> = {
  Bezerra: "#8F1B33",
  Novilha: "#A92039",
  Primípara: "#C2263F",
  Secundípara: "#D82C45",
  Multípara: "#ED334A",
};

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 p-5 min-h-[132px] animate-pulse">
      <div className="h-4 w-24 bg-neutral-200 rounded mb-3" />
      <div className="h-8 w-16 bg-neutral-200 rounded" />
    </div>
  );
}

function CounterCard({
  title,
  color,
  value,
  blackNumber,
}: {
  title: string;
  color: string;
  value: number | null;
  blackNumber?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow ring-1 ring-black/5 p-5 min-h-[132px]">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-black">
        <Dot color={color} />
        <span>{title}</span>
      </div>
      <div
        className="mt-3 text-4xl font-extrabold tracking-tight"
        style={{ color: blackNumber ? "#000000" : color }}
      >
        {value ?? "–"}
      </div>
    </div>
  );
}

export default function HerdCounters() {
  const { farmId } = useAGFilters();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCount = async (segment?: Segment) => {
    let q = supabase
      .from("females_denorm")
      .select("*", { count: "exact", head: true })
      .eq("farm_id", farmId);
    if (segment) q = q.eq("age_segment", segment);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  };

  useEffect(() => {
    if (!farmId) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [
          total,
          bezerra,
          novilha,
          primipara,
          secundipara,
          multipara,
        ] = await Promise.all([
          fetchCount(),
          fetchCount("Bezerra"),
          fetchCount("Novilha"),
          fetchCount("Primípara"),
          fetchCount("Secundípara"),
          fetchCount("Multípara"),
        ]);
        if (!active) return;
        setCounts({
          Total: total,
          Bezerra: bezerra,
          Novilha: novilha,
          Primípara: primipara,
          Secundípara: secundipara,
          Multípara: multipara,
        });
      } catch (e) {
        console.error("Erro ao carregar contadores:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [farmId]);

  const cards = useMemo(
    () => [
      {
        key: "Total",
        title: "Total de Fêmeas",
        color: "#ED334A",
        value: counts?.Total ?? null,
        blackNumber: true,
      },
      { key: "Bezerra", title: "Bezerra", color: COLORS.Bezerra, value: counts?.Bezerra ?? null },
      { key: "Novilha", title: "Novilhas", color: COLORS.Novilha, value: counts?.Novilha ?? null },
      { key: "Primípara", title: "Primíparas", color: COLORS.Primípara, value: counts?.Primípara ?? null },
      { key: "Secundípara", title: "Secundíparas", color: COLORS.Secundípara, value: counts?.Secundípara ?? null },
      { key: "Multípara", title: "Multíparas", color: COLORS.Multípara, value: counts?.Multípara ?? null },
    ],
    [counts]
  );

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : cards.map((c) => (
              <CounterCard
                key={c.key}
                title={c.title}
                color={c.color}
                value={c.value}
                blackNumber={c.blackNumber}
              />
            ))}
      </div>
    </section>
  );
}

