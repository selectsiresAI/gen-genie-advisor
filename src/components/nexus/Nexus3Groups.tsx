import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type MotherPoint = { birth_year: number; avg_value: number };
type BullRow = { id: string; code: string; name?: string; trait_value: number; percent?: number };

type Nexus3GroupsProps = {
  onBack?: () => void;
  initialFarmId?: string;
  fallbackDefaultFarmId?: string;
};

type SupabaseHookResult = {
  supabase: SupabaseClient | null;
  envError: string | null;
};

const useSupabase = (): SupabaseHookResult => {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const envError = !url || !key ? "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env." : null;

  const supabase = useMemo(() => {
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }, [url, key]);

  if (envError) {
    console.warn("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no .env");
  }

  return { supabase, envError };
};

const box = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const h2 = "text-lg font-semibold";
const btn = "inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-white disabled:opacity-60";
const input = "w-full rounded-md border border-gray-300 px-3 py-2";
const select = input;

function Nexus3Groups({ onBack, initialFarmId, fallbackDefaultFarmId }: Nexus3GroupsProps) {
  const { supabase, envError } = useSupabase();

  const [resolvingFarm, setResolvingFarm] = useState(false);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [traitsLoading, setTraitsLoading] = useState(false);
  const [traits, setTraits] = useState<string[]>([]);
  const [trait, setTrait] = useState<string>("");
  const [mothersLoading, setMothersLoading] = useState(false);
  const [mothers, setMothers] = useState<MotherPoint[]>([]);
  const [bullQuery, setBullQuery] = useState("");
  const [bullsLoading, setBullsLoading] = useState(false);
  const [results, setResults] = useState<BullRow[]>([]);
  const [chosen, setChosen] = useState<BullRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const anyLoading = resolvingFarm || traitsLoading || mothersLoading || bullsLoading;

  useEffect(() => {
    if (!trait) return;
    console.log(`[Nexus3Groups] Trait selecionado: ${trait}`);
  }, [trait]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const resolveFarm = async () => {
      setResolvingFarm(true);
      try {
        setErrorMessage(null);
        let resolved: string | null = null;
        let source = "";

        if (typeof window !== "undefined") {
          try {
            const currentUrl = new URL(window.location.href);
            const urlFarmId = currentUrl.searchParams.get("farmId");
            if (urlFarmId) {
              resolved = urlFarmId;
              source = "URL";
            }
          } catch (urlErr) {
            console.warn("Não foi possível ler a URL atual", urlErr);
          }
        }

        if (!resolved && initialFarmId) {
          resolved = initialFarmId;
          source = "initialFarmId";
        }

        if (!resolved && fallbackDefaultFarmId) {
          resolved = fallbackDefaultFarmId;
          source = "fallbackDefaultFarmId";
        }

        if (!resolved) {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          const uid = authData?.user?.id;
          if (!uid) throw new Error("Faça login para acessar o Nexus 3.");

          const { data, error } = await supabase
            .from("profiles")
            .select("default_farm_id")
            .eq("id", uid)
            .single();
          if (error) throw error;
          if (!data?.default_farm_id) throw new Error("Seu perfil não tem uma fazenda padrão.");
          resolved = data.default_farm_id;
          source = "profiles.default_farm_id";
        }

        if (!resolved) throw new Error("Não foi possível determinar a fazenda ativa.");

        if (active) {
          setFarmId(resolved);
          console.log(`[Nexus3Groups] Farm ID resolvido (${source}): ${resolved}`);
        }
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.message || String(error));
      } finally {
        if (active) setResolvingFarm(false);
      }
    };

    resolveFarm();
    return () => {
      active = false;
    };
  }, [supabase, initialFarmId, fallbackDefaultFarmId]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const loadTraits = async () => {
      setTraitsLoading(true);
      try {
        setErrorMessage(null);
        const { data, error } = await supabase.rpc("nx3_list_pta_traits");
        if (error) throw error;
        const list = (data ?? []).map((item: any) => String(item.trait).toLowerCase());
        if (!active) return;
        setTraits(list);
        setTrait((current) => {
          if (current && list.includes(current)) return current;
          return list[0] ?? current;
        });
        console.log(`[Nexus3Groups] nx3_list_pta_traits retornou ${list.length} traits.`);
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.message || String(error));
      } finally {
        if (active) setTraitsLoading(false);
      }
    };

    loadTraits();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !farmId || !trait) return;
    let active = true;

    const loadMothers = async () => {
      setMothersLoading(true);
      try {
        setErrorMessage(null);
        const { data, error } = await supabase.rpc("nx3_mothers_yearly_avg", {
          p_trait: trait,
          p_farm: farmId,
        });
        if (error) throw error;
        const list = ((data ?? []) as MotherPoint[]).map((item) => ({
          birth_year: item.birth_year,
          avg_value: item.avg_value,
        }));
        if (!active) return;
        setMothers(list);
        console.log(
          `[Nexus3Groups] nx3_mothers_yearly_avg retornou ${list.length} linhas para farm ${farmId} e trait ${trait}.`
        );
      } catch (error: any) {
        if (!active) return;
        setErrorMessage(error?.message || String(error));
      } finally {
        if (active) setMothersLoading(false);
      }
    };

    loadMothers();
    return () => {
      active = false;
    };
  }, [supabase, farmId, trait]);

  const searchBulls = useCallback(
    async (query: string) => {
      if (!supabase) return;
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }

      setBullsLoading(true);
      try {
        setErrorMessage(null);
        const { data, error } = await supabase.rpc("nx3_bulls_lookup", {
          p_query: trimmed,
          p_trait: trait,
          p_limit: 12,
        });
        if (error) throw error;
        const list = (data ?? []) as BullRow[];
        setResults(list);
        console.log(
          `[Nexus3Groups] nx3_bulls_lookup retornou ${list.length} linhas para "${trimmed}" (${trait}).`
        );
      } catch (error: any) {
        setErrorMessage(error?.message || String(error));
      } finally {
        setBullsLoading(false);
      }
    },
    [supabase, trait]
  );

  useEffect(() => {
    if (!supabase) return;
    const trimmed = bullQuery.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchBulls(trimmed);
    }, 300);
    return () => clearTimeout(timeout);
  }, [bullQuery, searchBulls, supabase]);

  useEffect(() => {
    setResults([]);
  }, [trait]);

  const bullsAvg = useMemo(() => {
    if (!chosen.length) return 0;
    const sumWeights = chosen.reduce((acc, bull) => acc + (bull.percent ?? 100), 0);
    if (!sumWeights) return 0;
    const sum = chosen.reduce(
      (acc, bull) => acc + ((bull.trait_value ?? 0) * (bull.percent ?? 100)) / 100,
      0
    );
    return sum / sumWeights;
  }, [chosen]);

  const chartData = useMemo(() => {
    if (!mothers.length) return [];
    return mothers.map((mother) => ({
      year: mother.birth_year,
      mothers_avg: mother.avg_value,
      daughters_pred: ((mother.avg_value + bullsAvg) / 2) * 0.93,
    }));
  }, [mothers, bullsAvg]);

  const addBull = (bull: BullRow) => {
    if (chosen.find((item) => item.id === bull.id)) return;
    setChosen([...chosen, { ...bull, percent: 100 }]);
  };

  const setPercent = (index: number, value: number) => {
    const next = [...chosen];
    next[index].percent = Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
    setChosen(next);
  };

  const removeBull = (id: string) => {
    setChosen(chosen.filter((bull) => bull.id !== id));
  };

  if (envError || !supabase) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Nexus 3 — Acasalamento em Grupos (Etapa 1)</h1>
        {onBack && (
          <button className={btn} onClick={onBack}>
            Voltar
          </button>
        )}
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
          {envError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-16">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Nexus 3 — Acasalamento em Grupos (Etapa 1)</h1>
          {onBack && (
            <button className={btn} onClick={onBack}>
              Voltar
            </button>
          )}
        </div>
        <p className="text-gray-600">
          Compare a média genética das mães por ano com touros selecionados. Predição:
          <code className="ml-1">((Mãe + MédiaTouros)/2) × 0,93</code>.
        </p>
        {anyLoading && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            Carregando dados do Nexus 3…
          </div>
        )}
        {errorMessage && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">{errorMessage}</div>
        )}
      </header>

      <section className={box}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Trait (PTA)</label>
            <select
              className={select}
              value={trait}
              onChange={(event) => setTrait(event.target.value)}
              disabled={traitsLoading}
            >
              {traits.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Fazenda ativa</label>
            <input className={input} value={farmId ?? ""} readOnly />
          </div>
          <div className="flex items-end gap-2">
            <button className={btn} disabled={resolvingFarm} onClick={() => window.location.reload()}>
              Recarregar página
            </button>
          </div>
        </div>
      </section>

      <section className={box}>
        <h2 className={h2}>Buscar touros (code/nome) — tipo PROCV</h2>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            className={input}
            placeholder="Ex.: 7HO, 007HO, 29HO, HELIX…"
            value={bullQuery}
            onChange={(event) => setBullQuery(event.target.value)}
          />
          <button className={btn} disabled={bullsLoading} onClick={() => searchBulls(bullQuery)}>
            {bullsLoading ? "Buscando…" : "Buscar"}
          </button>
        </div>

        {bullsLoading && (
          <p className="mt-2 text-sm text-gray-500">Carregando touros…</p>
        )}

        {results.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => addBull(result)}
                className="rounded-lg border p-3 text-left transition hover:bg-gray-50"
                title="Adicionar touro"
              >
                <div className="font-medium">{result.code}</div>
                <div className="text-sm text-gray-600">{result.name || "—"}</div>
                <div className="text-sm">
                  PTA ({trait.toUpperCase()}): <b>{Math.round(result.trait_value ?? 0)}</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {chosen.length > 0 && (
        <section className={box}>
          <h2 className={h2}>Touros selecionados</h2>
          <div className="mt-3 space-y-2">
            {chosen.map((bull, index) => (
              <div key={bull.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="font-medium">{bull.code}</div>
                  <div className="text-sm text-gray-600">
                    PTA ({trait.toUpperCase()}): {Math.round(bull.trait_value ?? 0)}
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
                    value={bull.percent ?? 100}
                    onChange={(event) => setPercent(index, parseFloat(event.target.value))}
                  />
                  <button
                    className="rounded-md border px-2 py-1 text-gray-700 transition hover:bg-gray-50"
                    onClick={() => removeBull(bull.id)}
                    title="Remover"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-gray-50 p-3 text-sm">
            <b>Média ponderada dos touros:</b> {Math.round(bullsAvg)}
          </div>
        </section>
      )}

      <section className={box}>
        <h2 className={h2}>Mães vs. Filhas — Predição</h2>
        {mothersLoading && <p className="mt-2 text-sm text-gray-500">Carregando médias das mães…</p>}
        <div className="mt-4 h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mothers_avg" name="Mães (média)" stroke="#ED1C24" dot />
              <Line type="monotone" dataKey="daughters_pred" name="Filhas (predição)" stroke="#111827" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default Nexus3Groups;
export { Nexus3Groups };
