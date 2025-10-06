"use client";

import { useEffect, useMemo, useState } from "react";
import AuditoriaGeneticaFeature from "@/features/auditoria-genetica/AuditoriaGeneticaPage";
import { clampStep } from "@/features/auditoria-genetica/constants";
import type { FarmLike } from "@/features/auditoria-genetica/types";
import { supabase } from "@/integrations/supabase/client";

type LoadedFarm = FarmLike | null;

type LoadState = "idle" | "loading" | "success" | "error";

function getQueryParam(name: string) {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export default function AuditoriaGeneticaPage() {
  const [farm, setFarm] = useState<LoadedFarm>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [step, setStep] = useState(() => clampStep(Number(getQueryParam("step") ?? 0)));
  const farmIdParam = useMemo(() => getQueryParam("farmId"), []);
  const farmNameParam = useMemo(() => getQueryParam("farmName"), []);

  useEffect(() => {
    setStep(clampStep(Number(getQueryParam("step") ?? 0)));
  }, []);

  useEffect(() => {
    if (!farmIdParam) {
      setFarm(farmNameParam ? { farm_name: farmNameParam } : null);
      setLoadState("success");
      return;
    }

    let isMounted = true;
    setLoadState("loading");

    async function loadFarm() {
      try {
        const { data, error } = await supabase.rpc("my_farms");
        if (!isMounted) return;
        if (error) {
          console.error("Erro ao carregar fazendas", error);
          setFarm(farmNameParam ? { farm_id: farmIdParam, farm_name: farmNameParam } : null);
          setLoadState("error");
          return;
        }

        const farms = (Array.isArray(data) ? data : []) as FarmLike[];
        const found = farms.find((item) => item.farm_id === farmIdParam);
        if (found) {
          setFarm(found);
        } else {
          setFarm(farmNameParam ? { farm_id: farmIdParam, farm_name: farmNameParam } : null);
        }
        setLoadState("success");
      } catch (err) {
        console.error("Erro inesperado ao carregar fazenda", err);
        if (isMounted) {
          setFarm(farmNameParam ? { farm_id: farmIdParam, farm_name: farmNameParam } : null);
          setLoadState("error");
        }
      }
    }

    loadFarm();

    return () => {
      isMounted = false;
    };
  }, [farmIdParam, farmNameParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("step", String(step));
    if (farm?.farm_id) {
      params.set("farmId", farm.farm_id);
    }
    if (farm?.farm_name) {
      params.set("farmName", farm.farm_name);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [step, farm?.farm_id, farm?.farm_name]);

  const handleBack = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  if (loadState === "loading" && !farm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando fazenda...</p>
        </div>
      </div>
    );
  }

  return (
    <AuditoriaGeneticaFeature
      farm={farm ?? undefined}
      onBack={handleBack}
      initialStep={step}
      onStepChange={setStep}
    />
  );
}
