/* src/components/nexus/Nexus3Groups.tsx */
// Apenas apresentação alterada — lógica preservada
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import type { LabelProps } from "recharts";
import { ChevronLeft, Download, Loader2, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { ANIMAL_METRIC_COLUMNS } from "../../constants/animalMetrics";
import { getAdaptiveYAxisDomainMultiple } from "../../lib/chart-utils";
import { formatPtaValue } from "@/utils/ptaFormat";
import { exportSingleChartToPDF } from "@/lib/pdf/exportCharts";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

type MotherPoint = { birth_year: number; avg_value: number };
type BullRow = { id: string; code: string; name?: string; trait_value: number; percent?: number };

const useSupabase = (): SupabaseClient => {
  const client = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !key) return sharedSupabaseClient;
    return createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }, []);
  return client;
};

interface Nexus3GroupsProps {
  onBack?: () => void;
  selectedFarmId?: string | null;
}

// ---------- Subcomponente: uma seção por característica ----------
interface TraitSectionProps {
  trait: string;
  farmId: string;
  supabase: SupabaseClient;
  isEn: boolean;
  isEs: boolean;
  onRemove: () => void;
}

function TraitSection({ trait, farmId, supabase, isEn, isEs, onRemove }: TraitSectionProps) {
  const [mothers, setMothers] = useState<MotherPoint[]>([]);
  const [bullQuery, setBullQuery] = useState("");
  const [results, setResults] = useState<BullRow[]>([]);
  const [chosen, setChosen] = useState<BullRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const metric = ANIMAL_METRIC_COLUMNS.find((m) => m.key === trait);
  const traitLabel = metric?.label || trait.toUpperCase();

  // Carregar médias das mães por ano
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

  // Busca de touros — debounce 300ms
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

  const [yMin, yMax] = useMemo(
    () => getAdaptiveYAxisDomainMultiple(chartData, ["mothers_avg", "daughters_pred"]),
    [chartData]
  );

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

  const renderChartTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;
    const mom = payload.find((item: any) => item.dataKey === "mothers_avg")?.value;
    const dau = payload.find((item: any) => item.dataKey === "daughters_pred")?.value;
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
        <div className="font-medium text-gray-900">{isEs ? "Año" : isEn ? "Year" : "Ano"}: {label}</div>
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[#ED1C24]">
            <span>{isEs ? "Madres (prom.)" : isEn ? "Dams (avg)" : "Mães (média)"}</span>
            <span className="font-semibold">{formatPtaValue(trait, mom)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-900">
            <span>{isEs ? "Hijas (predicción)" : isEn ? "Daughters (prediction)" : "Filhas (predição)"}</span>
            <span className="font-semibold">{formatPtaValue(trait, dau)}</span>
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
        {formatPtaValue(trait, value as number)}
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
        {formatPtaValue(trait, value as number)}
      </text>
    );
  };

  return (
    <section className="space-y-6 rounded-2xl border-2 border-gray-200 bg-gray-50/50 p-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#ED1C24]/10 px-4 py-1.5 text-sm font-bold text-[#ED1C24]">
            {traitLabel}
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
          {isEs ? "Quitar" : isEn ? "Remove" : "Remover"}
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{isEs ? "Promedio de Toros" : isEn ? "Sires Average" : "Média dos Touros"}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{formatPtaValue(trait, bullsAvg)}</p>
            </div>
            <div className="rounded-full bg-gray-50 p-3 text-[#ED1C24]">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            {mothers.length ? (
              mothers.map((m) => (
                <div
                  key={m.birth_year}
                  className="flex min-w-[140px] flex-col gap-1 rounded-xl border border-[#ED1C24]/40 bg-white px-4 py-3 text-gray-900 shadow-sm"
                >
                  <span className="text-sm font-semibold">{m.birth_year}</span>
                  <span className="text-xs uppercase text-gray-500">{isEs ? "prom." : isEn ? "avg" : "média"}</span>
                  <span className="text-lg font-semibold">{formatPtaValue(trait, m.avg_value)}</span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                {isEs ? "Sin datos de madres." : isEn ? "No dam data." : "Sem dados de mães."}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {isEs ? "Buscar toros" : isEn ? "Search sires" : "Buscar touros"}
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none"
              placeholder="Ex.: 7HO, 007HO, 29HO, HELIX…"
              value={bullQuery}
              onChange={(e) => setBullQuery(e.target.value)}
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((r) => (
              <button key={r.id} type="button" onClick={() => addBull(r)} className="text-left">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:bg-gray-50">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{r.code}</p>
                    <p className="text-sm text-gray-500">{r.name || "—"}</p>
                  </div>
                  <p className="mt-4 text-sm font-medium text-gray-700">
                    PTA ({traitLabel}): {formatPtaValue(trait, r.trait_value ?? 0)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {chosen.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">{isEs ? "Toros seleccionados" : isEn ? "Selected sires" : "Touros selecionados"}</h3>
          <div className="mt-4 space-y-3">
            {chosen.map((b, idx) => (
              <div key={b.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-900">{b.code}</p>
                  <p className="text-sm text-gray-500">PTA ({traitLabel}): {formatPtaValue(trait, b.trait_value ?? 0)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-600">%</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="h-10 w-20 rounded-lg border border-gray-300 px-2 text-right text-sm font-semibold text-gray-900 focus:border-gray-900 focus:outline-none"
                    value={b.percent ?? 100}
                    onChange={(e) => setPercent(idx, parseFloat(e.target.value))}
                  />
                  <button type="button" onClick={() => removeBull(b.id)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                    {isEs ? "Eliminar" : isEn ? "Remove" : "Remover"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={chartRef} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEs ? "Madres vs. Hijas — " : isEn ? "Dams vs. Daughters — " : "Mães vs. Filhas — "}{traitLabel}
            </h3>
          </div>
          <button
            type="button"
            disabled={isExporting || !chartData.length}
            onClick={async () => {
              if (!chartRef.current) return;
              setIsExporting(true);
              try {
                const today = format(new Date(), "yyyy-MM-dd");
                await exportSingleChartToPDF(chartRef.current, {
                  filename: `Nexus3_MaesVsFilhas_${trait.toUpperCase()}_${today}.pdf`,
                  orientation: "l",
                  format: "a4",
                  pageMarginMm: 8,
                });
              } finally {
                setIsExporting(false);
              }
            }}
            className="pdf-ignore inline-flex items-center gap-2 rounded-lg border border-[#ED1C24] bg-white px-4 py-2 text-sm font-medium text-[#ED1C24] shadow-sm transition hover:bg-[#ED1C24]/10 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {isEs ? "Exportar PDF" : isEn ? "Export PDF" : "Exportar PDF"}
          </button>
        </div>
        <div className="mt-6 h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="year" stroke="#6B7280" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#6B7280"
                tickLine={false}
                axisLine={false}
                domain={[yMin, yMax]}
                tickFormatter={(value) => Math.round(value).toString()}
              />
              <Tooltip content={renderChartTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 16 }}
                formatter={(value) => (
                  <span className="text-sm text-gray-600">
                    {value === "mothers_avg"
                      ? (isEs ? "Madres (prom.)" : isEn ? "Dams (avg)" : "Mães (média)")
                      : (isEs ? "Hijas (predicción)" : isEn ? "Daughters (prediction)" : "Filhas (predição)")}
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
  );
}

// ---------- Componente principal ----------
export default function Nexus3Groups({ onBack, selectedFarmId }: Nexus3GroupsProps = {}) {
  const supabase = useSupabase();
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";

  const [farmId, setFarmId] = useState<string | null>(null);
  const [traits, setTraits] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>(["ptam"]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Resolver farmId
  useEffect(() => {
    (async () => {
      try {
        if (selectedFarmId) {
          setFarmId(selectedFarmId);
          return;
        }
        const url = new URL(window.location.href);
        const qFarm = url.searchParams.get("farmId");
        if (qFarm) return setFarmId(qFarm);

        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) throw new Error(isEs ? "Inicie sesión para acceder a Nexus 3." : isEn ? "Log in to access Nexus 3." : "Faça login para acessar o Nexus 3.");

        const { data, error } = await supabase
          .from("profiles")
          .select("default_farm_id")
          .eq("id", uid)
          .single();
        if (error) throw error;
        if (!data?.default_farm_id) throw new Error(isEs ? "Su perfil no tiene una finca predeterminada." : isEn ? "Your profile has no default farm." : "Seu perfil não tem uma fazenda padrão.");
        setFarmId(data.default_farm_id);
      } catch (e: any) {
        setErr(e.message || String(e));
      }
    })();
  }, [supabase, selectedFarmId, isEn, isEs]);

  // Carregar lista de traits
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("nx3_list_pta_traits");
        if (error) throw error;
        const list = (data ?? []).map((d: any) => String(d.trait).toLowerCase());
        setTraits(list);
        setSelectedTraits((prev) => {
          const filtered = prev.filter((t) => list.includes(t));
          if (filtered.length) return filtered;
          return list.length ? [list[0]] : [];
        });
      } catch (e: any) {
        setErr(e.message || String(e));
      }
    })();
  }, [supabase]);

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
  };

  const toggleTrait = (t: string) => {
    setSelectedTraits((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const removeTraitSection = (t: string) => {
    setSelectedTraits((prev) => prev.filter((x) => x !== t));
  };

  return (
    <div className="space-y-10 p-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEs ? "Nexus 3 — Apareamiento por Grupos (Etapa 1)" : isEn ? "Nexus 3 — Group Mating (Step 1)" : "Nexus 3 — Acasalamento em Grupos (Etapa 1)"}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {isEs
                ? "Seleccione una o varias características para comparar. Predicción: ((Madre + PromedioToros)/2) × 0,93"
                : isEn
                ? "Select one or more traits to compare. Prediction: ((Dam + SiresAvg)/2) × 0.93"
                : "Selecione uma ou várias características para comparar. Predição: ((Mãe + MédiaTouros)/2) × 0,93"}
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={handleBack}
              className="ml-auto inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {isEs ? "Volver" : isEn ? "Back" : "Voltar"}
            </button>
          )}
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
        )}
      </header>

      {/* Seletor multi-traits */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {isEs ? "Características (PTA)" : isEn ? "Traits (PTA)" : "Características (PTA)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedTraits.map((t) => {
                const metric = ANIMAL_METRIC_COLUMNS.find((m) => m.key === t);
                const label = metric?.label || t.toUpperCase();
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#ED1C24] px-3 py-1 text-xs font-semibold text-white"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => toggleTrait(t)}
                      className="rounded-full hover:bg-white/20 p-0.5"
                      aria-label="remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              {selectedTraits.length === 0 && (
                <span className="text-sm text-gray-500">
                  {isEs ? "Ninguna seleccionada." : isEn ? "None selected." : "Nenhuma selecionada."}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            {pickerOpen
              ? (isEs ? "Cerrar" : isEn ? "Close" : "Fechar")
              : (isEs ? "Agregar/Quitar PTA" : isEn ? "Add/Remove PTA" : "Adicionar/Remover PTA")}
          </button>
        </div>

        {pickerOpen && (
          <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {traits.map((t) => {
                const metric = ANIMAL_METRIC_COLUMNS.find((m) => m.key === t);
                const label = metric?.label || t.toUpperCase();
                const checked = selectedTraits.includes(t);
                return (
                  <label
                    key={t}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                      checked ? "border-[#ED1C24] bg-[#ED1C24]/5" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTrait(t)}
                      className="h-4 w-4 accent-[#ED1C24]"
                    />
                    <span className="font-medium text-gray-800">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500">
          {isEs ? "Finca activa: " : isEn ? "Active farm: " : "Fazenda ativa: "}
          <span className="font-mono">{farmId ?? "—"}</span>
        </div>
      </div>

      {/* Seções por trait (empilhadas, roláveis) */}
      <div className="space-y-8">
        {farmId && selectedTraits.map((t) => (
          <TraitSection
            key={t}
            trait={t}
            farmId={farmId}
            supabase={supabase}
            isEn={isEn}
            isEs={isEs}
            onRemove={() => removeTraitSection(t)}
          />
        ))}
        {selectedTraits.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
            {isEs
              ? "Seleccione al menos una característica arriba para empezar."
              : isEn
              ? "Select at least one trait above to start."
              : "Selecione ao menos uma característica acima para começar."}
          </div>
        )}
      </div>
    </div>
  );
}

export { Nexus3Groups };
