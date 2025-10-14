/* src/components/nexus/Nexus3Groups.tsx */
// Apenas apresentação alterada — lógica preservada
import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabase as sharedSupabaseClient } from "../../integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import type { LabelProps, TooltipProps } from "recharts";
import { ChevronLeft, Loader2, Search as SearchIcon, Sparkles } from "lucide-react";

/**
 * Componente Vite-friendly (sem Next helpers, sem shadcn, sem aliases).
 * Usa apenas React, Supabase JS e Recharts.
 */

type MotherPoint = { birth_year: number; avg_value: number };
type BullRow = { id: string; code: string; name?: string; trait_value: number; percent?: number };

const useSupabase = (): SupabaseClient => {
  const client = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    if (!url || !key) {
      // Mostra no console para facilitar debug caso falte env
      // e reusa o client compartilhado configurado em @/integrations.
      console.warn(
        "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no .env; reutilizando o client padrão"
      );
      return sharedSupabaseClient;
    }

    return createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }, []);
  return client;
};

export default function Nexus3Groups() {
  const supabase = useSupabase();

  const [farmId, setFarmId] = useState<string | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [trait, setTrait] = useState<string>("ptam");

  const [mothers, setMothers] = useState<MotherPoint[]>([]);
  const [bullQuery, setBullQuery] = useState("");
  const [results, setResults] = useState<BullRow[]>([]);
  const [chosen, setChosen] = useState<BullRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 1) Resolver farmId: URL ?farmId=... -> profiles.default_farm_id
  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const qFarm = url.searchParams.get("farmId");
        if (qFarm) return setFarmId(qFarm);

        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) throw new Error("Faça login para acessar o Nexus 3.");

        const { data, error } = await supabase
          .from("profiles")
          .select("default_farm_id")
          .eq("id", uid)
          .single();
        if (error) throw error;
        if (!data?.default_farm_id) throw new Error("Seu perfil não tem uma fazenda padrão.");
        setFarmId(data.default_farm_id);
      } catch (e: any) {
        setErr(e.message || String(e));
      }
    })();
  }, [supabase]);

  // 2) Carregar lista de traits
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("nx3_list_pta_traits");
        if (error) throw error;
        const list = (data ?? []).map((d: any) => String(d.trait).toLowerCase());
        setTraits(list);
        if (list.length && !list.includes(trait)) setTrait(list[0]);
      } catch (e: any) {
        setErr(e.message || String(e));
      }
    })();
  }, [supabase]);

  // 3) Carregar médias das mães por ano (quando trait ou farmId mudarem)
  useEffect(() => {
    if (!farmId || !trait) return;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("nx3_mothers_yearly_avg", {
          p_trait: trait,
          p_farm: farmId,
        });
        if (error) throw error;
        setMothers((data ?? []) as MotherPoint[]);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [farmId, trait, supabase]);

  // 4) Busca de touros com "PROCV" (7HO/007HO/partes do nome) — debounce 300ms
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!bullQuery) return setResults([]);
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("nx3_bulls_lookup", {
          p_query: bullQuery,
          p_trait: trait,
          p_limit: 12,
        });
        if (error) throw error;
        setResults((data ?? []) as BullRow[]);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [bullQuery, trait, supabase]);

  // 5) Cálculo das filhas (média ponderada dos touros)
  const bullsAvg = useMemo(() => {
    if (!chosen.length) return 0;
    const sumW = chosen.reduce((acc, b) => acc + (b.percent ?? 100), 0);
    if (!sumW) return 0;
    const sum = chosen.reduce(
      (acc, b) => acc + (b.trait_value ?? 0) * (b.percent ?? 100),
      0
    );
    return sum / sumW;
  }, [chosen]);

  const chartData = useMemo(() => {
    if (!mothers.length) return [];
    return mothers.map((m) => ({
      year: m.birth_year,
      mothers_avg: m.avg_value,
      daughters_pred: ((m.avg_value + bullsAvg) / 2) * 0.93,
    }));
  }, [mothers, bullsAvg]);

  // 6) Helpers UI
  const addBull = (b: BullRow) => {
    if (chosen.find((x) => x.id === b.id)) return;
    setChosen([...chosen, { ...b, percent: 100 }]);
  };
  const setPercent = (idx: number, v: number) => {
    const next = [...chosen];
    next[idx].percent = isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
    setChosen(next);
  };
  const removeBull = (id: string) => setChosen(chosen.filter((b) => b.id !== id));

  // eslint-disable-next-line prefer-rest-params
  const maybeProps = (arguments as unknown as IArguments)[0] as
    | { onBack?: () => void }
    | undefined;
  const onBack = maybeProps?.onBack;
  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    }
  };

  const renderChartTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;
    const mom = payload.find((item) => item.dataKey === "mothers_avg")?.value;
    const dau = payload.find((item) => item.dataKey === "daughters_pred")?.value;
    const formatTooltipValue = (val: unknown) => {
      if (typeof val === "number") return Math.round(val);
      const parsed = Number(val ?? 0);
      return Number.isFinite(parsed) ? Math.round(parsed) : 0;
    };
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
        <div className="font-medium text-gray-900">Ano: {label}</div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[#ED1C24]">
            <span>Mães (média)</span>
            <span className="font-semibold">{formatTooltipValue(mom)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-900">
            <span>Filhas (predição)</span>
            <span className="font-semibold">{formatTooltipValue(dau)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMotherLabel = ({ x, y, value }: LabelProps) => {
    if (value === undefined || value === null || x === undefined || y === undefined) return null;
    const xPos = typeof x === "number" ? x : Number(x);
    const yPos = typeof y === "number" ? y : Number(y);
    if (Number.isNaN(xPos) || Number.isNaN(yPos)) return null;
    return (
      <text x={xPos} y={yPos - 8} fill="#ED1C24" fontSize={12} fontWeight={600} textAnchor="middle">
        {Math.round(Number(value))}
      </text>
    );
  };

  const renderDaughterLabel = ({ x, y, value }: LabelProps) => {
    if (value === undefined || value === null || x === undefined || y === undefined) return null;
    const xPos = typeof x === "number" ? x : Number(x);
    const yPos = typeof y === "number" ? y : Number(y);
    if (Number.isNaN(xPos) || Number.isNaN(yPos)) return null;
    return (
      <text x={xPos} y={yPos - 8} fill="#111827" fontSize={12} fontWeight={600} textAnchor="middle">
        {Math.round(Number(value))}
      </text>
    );
  };

  return (
    <div className="space-y-10 p-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Nexus 3 — Acasalamento em Grupos (Etapa 1)
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Compare a média genética das mães por ano com touros selecionados. Predição: ((Mãe + MédiaTouros)/2) × 0,93
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={handleBack}
              className="ml-auto inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          )}
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </header>

      <section className="space-y-6">
        <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Trait (PTA)</label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium uppercase text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none"
              value={trait}
              onChange={(e) => setTrait(e.target.value)}
            >
              {traits.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Fazenda ativa</label>
            <input
              className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700"
              value={farmId ?? ""}
              readOnly
            />
          </div>
          <div className="flex w-full items-center justify-end md:w-auto">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 md:w-auto"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média dos Touros</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{Math.round(bullsAvg)}</p>
              </div>
              <div className="rounded-full bg-gray-50 p-3 text-[#ED1C24]">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Etapa 1: média aritmética ponderada dos touros informados.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-3">
              {mothers.length ? (
                mothers.map((m) => (
                  <div
                    key={m.birth_year}
                    className="flex min-w-[160px] flex-col gap-1 rounded-xl border border-[#ED1C24]/40 bg-white px-4 py-3 text-gray-900 shadow-sm transition hover:shadow-md"
                  >
                    <span className="text-sm font-semibold">{m.birth_year}</span>
                    <span className="text-xs uppercase text-gray-500">média {trait.toUpperCase()}</span>
                    <span className="text-xl font-semibold">{Math.round(m.avg_value)}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                  Sem dados de mães para o PTA selecionado.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="bull-search">
                Buscar touros
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="bull-search"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none"
                  placeholder="Ex.: 7HO, 007HO, 29HO, HELIX…"
                  value={bullQuery}
                  onChange={(e) => setBullQuery(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBullQuery(bullQuery)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800"
            >
              <SearchIcon className="h-4 w-4" />
              Buscar
            </button>
          </div>

          {results.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addBull(r)}
                  className="text-left"
                >
                  <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{r.code}</p>
                      <p className="text-sm text-gray-500">{r.name || "—"}</p>
                    </div>
                    <p className="mt-4 text-sm font-medium text-gray-700">
                      PTA ({trait.toUpperCase()}): {Math.round(r.trait_value ?? 0)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500">
              {bullQuery
                ? "Nenhum touro encontrado para a busca atual."
                : "Digite um termo de código ou nome para iniciar a busca."}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">Touros selecionados</h3>
          {chosen.length ? (
            <div className="mt-4 space-y-3">
              {chosen.map((b, idx) => (
                <div
                  key={b.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-base font-semibold text-gray-900">{b.code}</p>
                    <p className="text-sm text-gray-500">
                      PTA ({trait.toUpperCase()}): {Math.round(b.trait_value ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-600" htmlFor={`percent-${b.id}`}>
                      %
                    </label>
                    <input
                      id={`percent-${b.id}`}
                      type="number"
                      min={0}
                      max={100}
                      className="h-10 w-20 rounded-lg border border-gray-300 px-2 text-right text-sm font-semibold text-gray-900 focus:border-gray-900 focus:outline-none"
                      value={b.percent ?? 100}
                      onChange={(e) => setPercent(idx, parseFloat(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => removeBull(b.id)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm text-gray-700">
                Média ponderada dos touros: <span className="font-semibold">{Math.round(bullsAvg)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Nenhum touro selecionado.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold text-gray-900">Mães vs. Filhas — Predição</h3>
            <p className="text-sm text-gray-500">
              Comparação anual entre as médias das mães e a predição das filhas considerando os touros escolhidos.
            </p>
          </div>
          <div className="mt-6 h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="year" stroke="#6B7280" tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" tickLine={false} axisLine={false} />
                <Tooltip content={renderChartTooltip} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 16 }}
                  formatter={(value) => (
                    <span className="text-sm text-gray-600">
                      {value === "mothers_avg" ? "Mães (média)" : "Filhas (predição)"}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="mothers_avg"
                  stroke="#ED1C24"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 0, fill: "#ED1C24" }}
                  name="mothers_avg"
                  isAnimationActive={false}
                >
                  <LabelList dataKey="mothers_avg" content={renderMotherLabel} />
                </Line>
                <Line
                  type="monotone"
                  dataKey="daughters_pred"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 0, fill: "#111827" }}
                  name="daughters_pred"
                  isAnimationActive={false}
                >
                  <LabelList dataKey="daughters_pred" content={renderDaughterLabel} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export { Nexus3Groups };
