"use client";

import { useEffect, useState } from "react";
import AuditoriaGeneticaFeature from "@/features/auditoria-genetica/AuditoriaGeneticaPage";
import { clampStep } from "@/features/auditoria-genetica/constants";
import type { FarmLike } from "@/features/auditoria-genetica/types";
import { supabase } from "@/integrations/supabase/client";

type LoadedFarm = FarmLike | null;

type LoadState = "idle" | "loading" | "success" | "error";

const isClient = () => typeof window !== "undefined";

const getQueryParam = (name: string) => {
  if (!isClient()) return null;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFallbackFarm = Boolean(farm);
  const bannerTone = errorMessage ? (loadState === "error" ? "error" : "warning") : undefined;

  useEffect(() => {
    if (!isClient()) return;

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
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setLoadState("loading");
    setErrorMessage(null);

    async function loadFarm() {
      try {
        const { data, error } = await supabase.rpc("my_farms");
        if (!isMounted) return;
        if (error) {
          console.error("Erro ao carregar fazendas", error);
          const fallbackFarm = farmNameParam
            ? { farm_id: farmIdParam, farm_name: farmNameParam }
            : null;
          setFarm(fallbackFarm);
          setLoadState(fallbackFarm ? "success" : "error");
          setErrorMessage(
            fallbackFarm
              ? "Não foi possível carregar as informações da fazenda. Usando dados locais disponíveis."
              : "Não foi possível carregar as informações da fazenda. Tente novamente mais tarde.",
          );
          return;
        }

        const farms = (Array.isArray(data) ? data : []) as FarmLike[];
        const found = farms.find((item) => item.farm_id === farmIdParam);
        if (found) {
          setFarm(found);
          setLoadState("success");
          setErrorMessage(null);
        } else {
          const fallbackFarm = farmNameParam
            ? { farm_id: farmIdParam, farm_name: farmNameParam }
            : null;
          setFarm(fallbackFarm);
          setLoadState(fallbackFarm ? "success" : "error");
          setErrorMessage(
            fallbackFarm
              ? "Não encontramos a fazenda no Supabase. Mostrando os dados fornecidos pela URL."
              : "Não encontramos a fazenda solicitada. Verifique o link e tente novamente.",
          );
        }
      } catch (err) {
        console.error("Erro inesperado ao carregar fazenda", err);
        if (isMounted) {
          const fallbackFarm = farmNameParam
            ? { farm_id: farmIdParam, farm_name: farmNameParam }
            : null;
          setFarm(fallbackFarm);
          setLoadState(fallbackFarm ? "success" : "error");
          setErrorMessage(
            fallbackFarm
              ? "Encontramos um problema ao carregar a fazenda. Mostrando dados fornecidos pela URL."
              : "Encontramos um problema ao carregar a fazenda. Tente novamente mais tarde.",
          );
        }
      }
    }

    loadFarm();

    return () => {
      isMounted = false;
    };
  }, [farmIdParam, farmNameParam]);

  useEffect(() => {
    if (!isClient()) return;
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
    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState(null, "", newUrl);

    if (farmIdParam !== (farm?.farm_id ?? null)) {
      setFarmIdParam(farm?.farm_id ?? null);
    }
    if (farmNameParam !== (farm?.farm_name ?? null)) {
      setFarmNameParam(farm?.farm_name ?? null);
    }
  }, [step, farm?.farm_id, farm?.farm_name, farmIdParam, farmNameParam]);

  const handleBack = () => {
    if (!isClient()) return;
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

  if (loadState === "error" && !hasFallbackFarm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Não foi possível abrir a Auditoria Genética</h1>
          <p className="text-muted-foreground">
            {errorMessage ?? "Ocorreu um erro desconhecido ao carregar as informações da fazenda."}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Voltar
          </button>
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
      statusMessage={errorMessage ?? undefined}
      statusTone={bannerTone}
    />
  );
}
