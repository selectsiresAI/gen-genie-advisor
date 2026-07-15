import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TraitSection, type SharedBull } from "@/components/nexus/Nexus3Groups";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2 } from "lucide-react";

interface Nexus3ReportSectionProps {
  farmId: string;
  farmName: string;
}

interface Nexus3Package {
  mode: "shared" | "separate";
  selected_traits: string[];
  shared_bulls: SharedBull[];
}

/**
 * Renderiza no Relatório Geral os gráficos da Nexus 3 exatamente como
 * o usuário gerou/salvou na página Nexus 3 (persistido em
 * `nexus3_user_packages` por usuário + fazenda).
 */
export default function Nexus3ReportSection({ farmId, farmName }: Nexus3ReportSectionProps) {
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<Nexus3Package | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) {
          if (!cancelled) setPkg(null);
          return;
        }
        const { data, error } = await supabase
          .from("nexus3_user_packages")
          .select("mode, selected_traits, shared_bulls")
          .eq("user_id", uid)
          .eq("client_id", farmId)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        if (!data) {
          setPkg(null);
        } else {
          setPkg({
            mode: (data.mode === "separate" ? "separate" : "shared") as "shared" | "separate",
            selected_traits: Array.isArray(data.selected_traits) ? (data.selected_traits as string[]) : [],
            shared_bulls: Array.isArray(data.shared_bulls) ? (data.shared_bulls as SharedBull[]) : [],
          });
        }
      } catch (e: any) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{isEs ? "Cargando Nexus 3..." : isEn ? "Loading Nexus 3..." : "Carregando Nexus 3..."}</span>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {err}
      </div>
    );
  }

  const hasData = pkg && pkg.selected_traits.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
        {isEs
          ? "Aún no se ha generado un paquete en Nexus 3 para esta finca. Abra la página Nexus 3, elija las características y los toros, y luego reintente."
          : isEn
          ? "No Nexus 3 package has been generated yet for this farm. Open the Nexus 3 page, pick traits and sires, then try again."
          : "Ainda não há pacote Nexus 3 gerado para esta fazenda. Abra a página Nexus 3, selecione as características e os touros, e tente novamente."}
      </div>
    );
  }

  const bullsForSection = pkg.mode === "shared" ? pkg.shared_bulls : [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
        <div className="font-medium text-gray-800">
          {isEs ? "Modo:" : isEn ? "Mode:" : "Modo:"}{" "}
          <span className="font-semibold">
            {pkg.mode === "shared"
              ? isEs ? "Paquete compartido" : isEn ? "Shared package" : "Pacote compartilhado"
              : isEs ? "Paquete por característica" : isEn ? "Per-trait package" : "Pacote por característica"}
          </span>
          {" · "}
          {isEs ? "Toros:" : isEn ? "Sires:" : "Touros:"}{" "}
          <span className="font-semibold">{pkg.shared_bulls.length}</span>
          {" · "}
          {isEs ? "PTAs:" : "PTAs:"}{" "}
          <span className="font-semibold">{pkg.selected_traits.length}</span>
        </div>
      </div>

      {pkg.selected_traits.map((trait) => (
        <TraitSection
          key={trait}
          trait={trait}
          farmId={farmId}
          supabase={supabase}
          isEn={isEn}
          isEs={isEs}
          onRemove={() => {}}
          sharedBulls={bullsForSection}
          hideRemove
          hideExport
        />
      ))}
    </div>
  );
}
