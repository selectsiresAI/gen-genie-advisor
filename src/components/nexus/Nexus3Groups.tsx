import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Nexus3GroupsProps {
  onBack?: () => void;
  initialFarmId?: string;
  fallbackDefaultFarmId?: string;
}

type MotherPoint = {
  birth_year: number;
  avg_value: number;
};

type BullRow = {
  id: string;
  code: string;
  name?: string | null;
  trait_value: number | null;
  percent?: number;
};

const useSupabase = (): SupabaseClient | null => {
  return useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    console.warn("[Nexus3Groups] Supabase env flags", {
      VITE_SUPABASE_URL: Boolean(url),
      VITE_SUPABASE_ANON_KEY: Boolean(anonKey),
    });

    if (!url || !anonKey) {
      return null;
    }

    try {
      return createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (error) {
      console.error("[Nexus3Groups] Falha ao criar cliente Supabase", error);
      return null;
    }
  }, []);
};

const containerClass = "space-y-16 p-6";
const cardClass = "space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const headingClass = "text-lg font-semibold";
const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2";
const buttonClass =
  "inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-white disabled:opacity-60";

const SUPABASE_ENV_MESSAGE = [
  "Supabase client não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e reabra/rebuild o app.",
  "Local dev: defina em um arquivo .env na raiz: ",
  "VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co",
  "VITE_SUPABASE_ANON_KEY=eyJ...",
  "Hosts como Vercel ou Lovable: configure as variáveis VITE_* antes do build e publique novamente.",
  "Após alterar o .env, reinicie o servidor (npm run dev).",
].join("\n");

const rpcFunctionNotFoundMessage = (fn: string) =>
  `Função ${fn} não encontrada no banco. Contate suporte.`;

const normalizePercent = (value: number | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
};

const safeNumber = (value: number | null | undefined): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return value;
};

const mapRpcError = (fnName: string, error: unknown): Error => {
  if (error instanceof Error) {
    const message = error.message ?? "";
    if (/function/i.test(message) && message.includes(fnName)) {
      return new Error(rpcFunctionNotFoundMessage(fnName));
    }
  }
  return error instanceof Error ? error : new Error(String(error));
};

const isRechartsAvailable = typeof LineChart === "function";

const MAX_SELECTED_BULLS = 3;

const formatNumber = (value: number): string => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const computeBullsAverage = (bulls: BullRow[]): number => {
  if (!bulls.length) {
    return 0;
  }
  const weights = bulls.map((bull) => normalizePercent(bull.percent ?? 100));
  const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
  if (!totalWeight) {
    return 0;
  }
  const weightedSum = bulls.reduce((acc, bull, index) => {
    const traitValue = safeNumber(bull.trait_value);
    return acc + traitValue * (weights[index] / 100);
  }, 0);
  return weightedSum / (totalWeight / 100);
};

const buildChartData = (mothers: MotherPoint[], bullsAverage: number) => {
  return mothers.map((mother) => {
    const mothersAvg = safeNumber(mother.avg_value);
    const daughtersPrediction = ((mothersAvg + bullsAverage) / 2) * 0.93;
    return {
      year: mother.birth_year,
      mothers_avg: Number(mothersAvg.toFixed(2)),
      daughters_pred: Number(daughtersPrediction.toFixed(2)),
    };
  });
};

const logFarmId = (source: string, value: string | null) => {
  console.log(`[Nexus3Groups] farmId resolvido (${source}):`, value ?? null);
};

const logRpcResult = (fn: string, details: Record<string, unknown>) => {
  console.log(`[Nexus3Groups] ${fn}`, details);
};

const Nexus3Groups: React.FC<Nexus3GroupsProps> = ({
  onBack,
  initialFarmId,
  fallbackDefaultFarmId,
}) => {
  const supabase = useSupabase();

  const [farmId, setFarmId] = useState<string | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedTrait, setSelectedTrait] = useState<string>("");
  const [mothers, setMothers] = useState<MotherPoint[]>([]);
  const [bullQuery, setBullQuery] = useState<string>("");
  const [bullResults, setBullResults] = useState<BullRow[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<BullRow[]>([]);

  const [farmError, setFarmError] = useState<string | null>(null);
  const [traitsError, setTraitsError] = useState<string | null>(null);
  const [mothersError, setMothersError] = useState<string | null>(null);
  const [bullsError, setBullsError] = useState<string | null>(null);

  const [resolvingFarm, setResolvingFarm] = useState<boolean>(false);
  const [loadingTraits, setLoadingTraits] = useState<boolean>(false);
  const [loadingMothers, setLoadingMothers] = useState<boolean>(false);
  const [loadingBulls, setLoadingBulls] = useState<boolean>(false);

  const supabaseEnvMissing = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  const addBull = (bull: BullRow) => {
    setBullsError(null);
    if (selectedBulls.find((item) => item.id === bull.id)) {
      return;
    }
    if (selectedBulls.length >= MAX_SELECTED_BULLS) {
      setBullsError(`Selecione no máximo ${MAX_SELECTED_BULLS} touros.`);
      return;
    }
    setSelectedBulls((prev) => [...prev, { ...bull, percent: 100 }]);
  };

  const updatePercent = (index: number, value: number) => {
    setSelectedBulls((prev) => {
      const next = [...prev];
      if (!next[index]) {
        return next;
      }
      next[index] = {
        ...next[index],
        percent: normalizePercent(value),
      };
      return next;
    });
  };

  const removeBull = (id: string) => {
    setSelectedBulls((prev) => prev.filter((bull) => bull.id !== id));
  };

  useEffect(() => {
    if (farmId) {
      return;
    }

    const urlFarmId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("farmId")
        : null;

    if (urlFarmId) {
      setFarmId(urlFarmId);
      logFarmId("URL", urlFarmId);
      setFarmError(null);
      return;
    }

    if (initialFarmId) {
      setFarmId(initialFarmId);
      logFarmId("initialFarmId prop", initialFarmId);
      setFarmError(null);
      return;
    }

    if (fallbackDefaultFarmId) {
      setFarmId(fallbackDefaultFarmId);
      logFarmId("fallbackDefaultFarmId prop", fallbackDefaultFarmId);
      setFarmError(null);
      return;
    }

    if (!supabase) {
      return;
    }

    let isMounted = true;
    const resolveFromProfile = async () => {
      try {
        setResolvingFarm(true);
        setFarmError(null);
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          throw authError;
        }
        const userId = authData?.user?.id;
        if (!userId) {
          if (isMounted) {
            setFarmError("Faça login para acessar o Nexus 3.");
          }
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("default_farm_id")
          .eq("id", userId)
          .single();
        if (error) {
          throw error;
        }
        if (!data?.default_farm_id) {
          if (isMounted) {
            setFarmError("Seu perfil não tem uma fazenda padrão configurada.");
          }
          return;
        }
        if (isMounted) {
          setFarmId(data.default_farm_id);
          logFarmId("profiles.default_farm_id", data.default_farm_id);
        }
      } catch (error) {
        const parsed = error instanceof Error ? error : new Error(String(error));
        if (isMounted) {
          setFarmError(parsed.message);
        }
      } finally {
        if (isMounted) {
          setResolvingFarm(false);
        }
      }
    };

    resolveFromProfile();

    return () => {
      isMounted = false;
    };
  }, [farmId, supabase, initialFarmId, fallbackDefaultFarmId]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;
    const fetchTraits = async () => {
      try {
        setLoadingTraits(true);
        setTraitsError(null);
        const { data, error } = await supabase.rpc("nx3_list_pta_traits");
        if (error) {
          throw mapRpcError("nx3_list_pta_traits", error);
        }
        const list = Array.isArray(data)
          ? data
              .map((item) => (item?.trait ? String(item.trait) : ""))
              .filter((value) => value.trim().length > 0)
          : [];
        if (isMounted) {
          setTraits(list);
          if (list.length) {
            if (!list.includes(selectedTrait)) {
              setSelectedTrait(list[0]);
            }
          } else {
            setSelectedTrait("");
          }
          logRpcResult("nx3_list_pta_traits", { count: list.length });
        }
      } catch (error) {
        const parsed = mapRpcError("nx3_list_pta_traits", error);
        if (isMounted) {
          setTraitsError(parsed.message);
          setTraits([]);
          setSelectedTrait("");
        }
      } finally {
        if (isMounted) {
          setLoadingTraits(false);
        }
      }
    };

    fetchTraits();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    if (!farmId || !selectedTrait) {
      return;
    }

    let isMounted = true;
    const fetchMothers = async () => {
      try {
        setLoadingMothers(true);
        setMothersError(null);
        const { data, error } = await supabase.rpc("nx3_mothers_yearly_avg", {
          p_trait: selectedTrait,
          p_farm: farmId,
        });
        if (error) {
          throw mapRpcError("nx3_mothers_yearly_avg", error);
        }
        const rows = Array.isArray(data) ? (data as MotherPoint[]) : [];
        if (isMounted) {
          setMothers(rows);
          logRpcResult("nx3_mothers_yearly_avg", {
            trait: selectedTrait,
            p_farm: farmId,
            count: rows.length,
          });
        }
      } catch (error) {
        const parsed = mapRpcError("nx3_mothers_yearly_avg", error);
        if (isMounted) {
          setMothersError(parsed.message);
          setMothers([]);
        }
      } finally {
        if (isMounted) {
          setLoadingMothers(false);
        }
      }
    };

    fetchMothers();

    return () => {
      isMounted = false;
    };
  }, [supabase, farmId, selectedTrait]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    if (!selectedTrait) {
      return;
    }

    if (!bullQuery) {
      setBullResults([]);
      setBullsError(null);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    let isMounted = true;
    const handle = window.setTimeout(async () => {
      try {
        setLoadingBulls(true);
        setBullsError(null);
        const { data, error } = await supabase.rpc("nx3_bulls_lookup", {
          p_query: bullQuery,
          p_trait: selectedTrait,
          p_limit: 12,
        });
        if (error) {
          throw mapRpcError("nx3_bulls_lookup", error);
        }
        const rows = Array.isArray(data) ? (data as BullRow[]) : [];
        if (isMounted) {
          setBullResults(rows);
          logRpcResult("nx3_bulls_lookup", {
            query: bullQuery,
            trait: selectedTrait,
            count: rows.length,
          });
        }
      } catch (error) {
        const parsed = mapRpcError("nx3_bulls_lookup", error);
        if (isMounted) {
          setBullsError(parsed.message);
          setBullResults([]);
        }
      } finally {
        if (isMounted) {
          setLoadingBulls(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      window.clearTimeout(handle);
    };
  }, [supabase, bullQuery, selectedTrait]);

  const bullsAverage = computeBullsAverage(selectedBulls);
  const chartData = buildChartData(mothers, bullsAverage);
  const anyLoading = resolvingFarm || loadingTraits || loadingMothers || loadingBulls;
  const allErrors = [
    supabaseEnvMissing ? SUPABASE_ENV_MESSAGE : null,
    farmError,
    traitsError,
    mothersError,
    bullsError,
  ].filter((message): message is string => Boolean(message));

  return (
    <div className={containerClass}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">
            Nexus 3 — Acasalamento em Grupos (Etapa 1)
          </h1>
          {onBack && (
            <button type="button" className={buttonClass} onClick={onBack}>
              Voltar
            </button>
          )}
        </div>
        <p className="text-gray-600">
          Compare a média genética das mães por ano com touros selecionados. Predição: ((Mãe +
          MédiaTouros) / 2) × 0,93.
        </p>
        {anyLoading && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Carregando dados do Nexus 3...
          </div>
        )}
        {allErrors.length > 0 && (
          <div className="space-y-2">
            {allErrors.map((message) => (
              <div
                key={message}
                className="whitespace-pre-wrap rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700"
              >
                {message}
              </div>
            ))}
          </div>
        )}
      </header>

      <section className={cardClass}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Trait (PTA)</label>
            <select
              className={inputClass}
              value={selectedTrait}
              disabled={!traits.length || loadingTraits}
              onChange={(event) => setSelectedTrait(event.target.value)}
            >
              {traits.length === 0 ? (
                <option value="">{loadingTraits ? "Carregando..." : "Nenhum trait disponível."}</option>
              ) : (
                traits.map((trait) => (
                  <option key={trait} value={trait}>
                    {trait.toUpperCase()}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fazenda ativa</label>
            <input
              className={inputClass}
              value={farmId ?? ""}
              placeholder="Informe uma fazenda"
              readOnly
            />
          </div>
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => window.location.reload()}
              disabled={anyLoading}
            >
              Recarregar página
            </button>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={headingClass}>Buscar touros (code/nome) — tipo PROCV</h2>
          {selectedBulls.length >= MAX_SELECTED_BULLS && (
            <span className="text-sm text-gray-500">
              Limite de {MAX_SELECTED_BULLS} touros selecionados.
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-2 md:flex-row">
          <input
            className={inputClass}
            placeholder="Ex.: 7HO, 007HO, 29HO, HELIX..."
            value={bullQuery}
            onChange={(event) => setBullQuery(event.target.value)}
          />
          <button
            type="button"
            className={buttonClass}
            disabled={loadingBulls || !bullQuery}
            onClick={() => setBullQuery((previous) => previous)}
          >
            Buscar
          </button>
        </div>
        {loadingBulls && (
          <div className="text-sm text-gray-500">Buscando touros...</div>
        )}
        {!loadingBulls && bullResults.length === 0 && bullQuery && !bullsError && (
          <div className="text-sm text-gray-500">Nenhum touro encontrado para a busca atual.</div>
        )}
        {bullResults.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {bullResults.map((bull) => (
              <button
                key={bull.id}
                type="button"
                onClick={() => addBull(bull)}
                className="rounded-lg border px-3 py-3 text-left transition hover:bg-gray-50"
              >
                <div className="font-medium">{bull.code}</div>
                <div className="text-sm text-gray-600">{bull.name ?? "—"}</div>
                <div className="text-sm">
                  PTA ({selectedTrait ? selectedTrait.toUpperCase() : "PTA"}):{' '}
                  <b>{Math.round(safeNumber(bull.trait_value))}</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedBulls.length > 0 && (
        <section className={cardClass}>
          <h2 className={headingClass}>Touros selecionados</h2>
          <div className="space-y-2">
            {selectedBulls.map((bull, index) => (
              <div
                key={bull.id}
                className="flex flex-col gap-3 rounded-lg border px-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="font-medium">{bull.code}</div>
                  <div className="text-sm text-gray-600">
                    PTA ({selectedTrait ? selectedTrait.toUpperCase() : "PTA"}):{' '}
                    {Math.round(safeNumber(bull.trait_value))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600" htmlFor={`percent-${bull.id}`}>
                    %
                  </label>
                  <input
                    id={`percent-${bull.id}`}
                    type="number"
                    min={0}
                    max={100}
                    className="w-20 rounded-md border px-2 py-1 text-right"
                    value={normalizePercent(bull.percent ?? 100)}
                    onChange={(event) => updatePercent(index, Number(event.target.value))}
                  />
                  <button
                    type="button"
                    className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-50"
                    onClick={() => removeBull(bull.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md bg-gray-50 px-3 py-2 text-sm">
            <b>Média ponderada dos touros:</b> {formatNumber(bullsAverage)}
          </div>
        </section>
      )}

      <section className={cardClass}>
        <h2 className={headingClass}>Mães vs. Filhas — Predição</h2>
        {!isRechartsAvailable ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Instale recharts para visualizar o gráfico (npm install recharts).
          </div>
        ) : (
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mothers_avg" name="Mães (média)" stroke="#ED1C24" dot />
                <Line
                  type="monotone"
                  dataKey="daughters_pred"
                  name="Filhas (predição)"
                  stroke="#111827"
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {chartData.length === 0 && !loadingMothers && (
          <div className="text-sm text-gray-500">
            Nenhum dado de mães encontrado para os filtros atuais.
          </div>
        )}
      </section>
    </div>
  );
};

export default Nexus3Groups;
export { Nexus3Groups };
