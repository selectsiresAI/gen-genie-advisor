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

const GRADIENTS: Record<Segment, string> = {
  Bezerra: "linear-gradient(135deg, #8F1B33 0%, #A92039 100%)",
  Novilha: "linear-gradient(135deg, #A92039 0%, #C2263F 100%)",
  Primípara: "linear-gradient(135deg, #C2263F 0%, #D82C45 100%)",
  Secundípara: "linear-gradient(135deg, #D82C45 0%, #ED334A 100%)",
  Multípara: "linear-gradient(135deg, #ED334A 0%, #FF6B7D 100%)",
};

const TOTAL_GRADIENT = "linear-gradient(135deg, #ED334A 0%, #FF8090 100%)";

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
  gradient,
  accentGradient,
}: {
  title: string;
  color: string;
  value: number | null;
  blackNumber?: boolean;
  gradient?: string;
  accentGradient?: string;
}) {
  const displayValue =
    value === null || value === undefined
      ? "–"
      : value.toLocaleString("pt-BR");

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5 transition-shadow hover:shadow-lg">
      <div className="flex items-center gap-2 text-[15px] font-semibold text-black">
        <Dot color={color} />
        <span>{title}</span>
      </div>
      <div className="mt-3">
        <span
          className={`block text-4xl font-extrabold tracking-tight ${
            blackNumber ? "text-black" : "text-transparent"
          }`}
          style={
            blackNumber
              ? undefined
              : {
                  backgroundImage: gradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }
          }
        >
          {displayValue}
        </span>
      </div>
      <span
        className="mt-4 block h-[5px] w-14 rounded-full"
        style={{
          backgroundImage: accentGradient ?? gradient,
          backgroundColor: accentGradient || gradient ? undefined : color,
        }}
      />
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
        gradient: undefined,
        accentGradient: TOTAL_GRADIENT,
      },
      {
        key: "Bezerra",
        title: "Bezerra",
        color: COLORS.Bezerra,
        value: counts?.Bezerra ?? null,
        gradient: GRADIENTS.Bezerra,
      },
      {
        key: "Novilha",
        title: "Novilhas",
        color: COLORS.Novilha,
        value: counts?.Novilha ?? null,
        gradient: GRADIENTS.Novilha,
      },
      {
        key: "Primípara",
        title: "Primíparas",
        color: COLORS.Primípara,
        value: counts?.Primípara ?? null,
        gradient: GRADIENTS.Primípara,
      },
      {
        key: "Secundípara",
        title: "Secundíparas",
        color: COLORS.Secundípara,
        value: counts?.Secundípara ?? null,
        gradient: GRADIENTS.Secundípara,
      },
      {
        key: "Multípara",
        title: "Multíparas",
        color: COLORS.Multípara,
        value: counts?.Multípara ?? null,
        gradient: GRADIENTS.Multípara,
      },
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
                gradient={c.gradient}
                accentGradient={c.accentGradient}
              />
            ))}
      </div>
    </section>
  );
}
