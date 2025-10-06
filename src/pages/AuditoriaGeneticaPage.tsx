"use client";

import { useEffect, useState } from "react";
import AuditoriaGeneticaFeature from "@/features/auditoria-genetica/AuditoriaGeneticaPage";
import { clampStep } from "@/features/auditoria-genetica/constants";
import type { FarmLike } from "@/features/auditoria-genetica/types";
import { supabase } from "@/integrations/supabase/client";

type LoadedFarm = FarmLike | null;

type LoadState = "idle" | "loading" | "success" | "error";

const getQueryParam = (name: string) => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
};

const readStepFromQuery = () => clampStep(Number(getQueryParam("step") ?? 0));

export default function AuditoriaGeneticaPage() {
  const [farm, setFarm] = useState<LoadedFarm>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [step, setStep] = useState(readStepFromQuery);
  const [farmIdParam, setFarmIdParam] = useState(() => getQueryParam("farmId"));
  const [farmNameParam, setFarmNameParam] = useState(() => getQueryParam("farmName"));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      setStep(readStepFromQuery());
      setFarmIdParam(getQueryParam("farmId"));
      setFarmNameParam(getQueryParam("farmName"));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
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
    } else {
      params.delete("farmId");
    }
    if (farm?.farm_name) {
      params.set("farmName", farm.farm_name);
    } else {
      params.delete("farmName");
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);

    if (farmIdParam !== (farm?.farm_id ?? null)) {
      setFarmIdParam(farm?.farm_id ?? null);
    }
    if (farmNameParam !== (farm?.farm_name ?? null)) {
      setFarmNameParam(farm?.farm_name ?? null);
    }
  }, [step, farm?.farm_id, farm?.farm_name, farmIdParam, farmNameParam]);

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
