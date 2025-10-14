/* src/components/nexus/Nexus3Groups.tsx */
import React, { useEffect, useMemo, useState } from "react";
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

/**
 * Componente Vite-friendly (sem Next helpers, sem shadcn, sem aliases).
 * Usa apenas React, Supabase JS e Recharts.
 */

type MotherPoint = { birth_year: number; avg_value: number };
type BullRow = { id: string; code: string; name?: string; trait_value: number; percent?: number };

const useSupabase = (): SupabaseClient => {
  const client = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    if (!url || !key) {
      // Mostra no console para facilitar debug caso falte env
      // (evita crash do app)
      console.warn("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no .env");
    }
    return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  }, []);
  return client;
};

const box = "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const h2 = "text-lg font-semibold";
const btn = "inline-flex items-center gap-2 rounded-md bg-black px-3 py-2 text-white disabled:opacity-60";
const input = "w-full rounded-md border border-gray-300 px-3 py-2";
const select = input;

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
    const sum = chosen.reduce((acc, b) => acc + (b.trait_value ?? 0) * (b.percent ?? 100) / 100, 0);
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

  return (
    <div className="p-6 space-y-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Nexus 3 — Acasalamento em Grupos (Etapa 1)</h1>
        <p className="text-gray-600">
          Compare a média genética das mães por ano com touros selecionados. Predição: <code>((Mãe + MédiaTouros)/2) × 0,93)</code>.
        </p>
        {err && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-700">{err}</div>
        )}
      </header>

      {/* Filtros */}
      <section className={box}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm mb-1">Trait (PTA)</label>
            <select
              className={select}
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
          <div>
            <label className="block text-sm mb-1">Fazenda ativa</label>
            <input className={input} value={farmId ?? ""} readOnly />
          </div>
          <div className="flex items-end">
            <button className={btn} disabled={loading} onClick={() => window.location.reload()}>
              Recarregar página
            </button>
          </div>
        </div>
      </section>

      {/* Busca de Touros */}
      <section className={box}>
        <h2 className={h2}>Buscar touros (code/nome) — tipo PROCV</h2>
        <div className="mt-3 flex gap-2">
          <input
            className={input}
            placeholder="Ex.: 7HO, 007HO, 29HO, HELIX…"
            value={bullQuery}
            onChange={(e) => setBullQuery(e.target.value)}
          />
          <button className={btn} disabled={loading} onClick={() => setBullQuery(bullQuery)}>
            Buscar
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => addBull(r)}
                className="rounded-lg border p-3 text-left hover:bg-gray-50"
                title="Adicionar touro"
              >
                <div className="font-medium">{r.code}</div>
                <div className="text-sm text-gray-600">{r.name || "—"}</div>
                <div className="text-sm">
                  PTA ({trait.toUpperCase()}): <b>{Math.round(r.trait_value ?? 0)}</b>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Touros selecionados */}
      {chosen.length > 0 && (
        <section className={box}>
          <h2 className={h2}>Touros selecionados</h2>
          <div className="mt-3 space-y-2">
            {chosen.map((b, idx) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="font-medium">{b.code}</div>
                  <div className="text-sm text-gray-600">
                    PTA ({trait.toUpperCase()}): {Math.round(b.trait_value ?? 0)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">%</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-20 rounded-md border px-2 py-1 text-right"
                    value={b.percent ?? 100}
                    onChange={(e) => setPercent(idx, parseFloat(e.target.value))}
                  />
                  <button
                    className="rounded-md border px-2 py-1 text-gray-700 hover:bg-gray-50"
                    onClick={() => removeBull(b.id)}
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

      {/* Gráfico */}
      <section className={box}>
        <h2 className={h2}>Mães vs. Filhas — Predição</h2>
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
