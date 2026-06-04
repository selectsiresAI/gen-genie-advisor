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
import { exportSingleChartToPDF, exportMultipleChartsToPDF } from "@/lib/pdf/exportCharts";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";

type MotherPoint = { birth_year: number; avg_value: number };
type BullRow = { id: string; code: string; name?: string; trait_value: number; percent?: number };
type SharedBull = { id: string; code: string; name?: string; percent: number; values: Record<string, number | null> };

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
  sharedBulls?: SharedBull[]; // quando presente: usa pacote único, sem busca/seleção interna
  registerChart?: (trait: string, el: HTMLDivElement | null) => void;
}

function TraitSection({ trait, farmId, supabase, isEn, isEs, onRemove, sharedBulls, registerChart }: TraitSectionProps) {
  const useShared = Array.isArray(sharedBulls);
  const [mothers, setMothers] = useState<MotherPoint[]>([]);
  const [bullQuery, setBullQuery] = useState("");
  const [results, setResults] = useState<BullRow[]>([]);
  const [chosen, setChosen] = useState<BullRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Registra/desregistra o ref do gráfico no parent para exportação múltipla
  useEffect(() => {
    if (!registerChart) return;
    registerChart(trait, chartRef.current);
    return () => registerChart(trait, null);
  }, [trait, registerChart]);

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
        const currentYear = new Date().getFullYear();
        const cleaned = ((data ?? []) as MotherPoint[]).filter(
          (m) => Number(m.birth_year) > 0 && Number(m.birth_year) <= currentYear
        );
        setMothers(cleaned);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [farmId, trait, supabase]);

  // Busca de touros — debounce 300ms (somente no modo separado)
  useEffect(() => {
    if (useShared) return;
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
  }, [bullQuery, trait, supabase, useShared]);

  const bullsAvg = useMemo(() => {
    if (useShared) {
      const list = sharedBulls!.filter((b) => b.values[trait] != null);
      if (!list.length) return 0;
      const sumW = list.reduce((acc, b) => acc + (b.percent ?? 100), 0);
      if (!sumW) return 0;
      const sum = list.reduce((acc, b) => acc + (Number(b.values[trait]) || 0) * (b.percent ?? 100), 0);
      return sum / sumW;
    }
    if (!chosen.length) return 0;
    const sumW = chosen.reduce((acc, b) => acc + (b.percent ?? 100), 0);
    if (!sumW) return 0;
    const sum = chosen.reduce(
      (acc, b) => acc + (b.trait_value ?? 0) * (b.percent ?? 100),
      0
    );
    return sum / sumW;
  }, [chosen, sharedBulls, trait, useShared]);

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

      {!useShared && (
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
      )}

      {!useShared && chosen.length > 0 && (
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

      {useShared && sharedBulls && sharedBulls.length > 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-xs text-gray-500">
          {isEs ? "Usando paquete compartido con " : isEn ? "Using shared package with " : "Usando pacote compartilhado com "}
          <span className="font-semibold text-gray-700">{sharedBulls.length}</span>
          {isEs ? " toro(s). Valor para este PTA: " : isEn ? " sire(s). Value for this PTA: " : " touro(s). Valor para esta PTA: "}
          <span className="font-semibold text-gray-700">{formatPtaValue(trait, bullsAvg)}</span>
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

  // Modo: 'shared' = mesmo pacote de touros para todas; 'separate' = pacote por característica
  const [mode, setMode] = useState<"shared" | "separate">("shared");
  const [sharedBulls, setSharedBulls] = useState<SharedBull[]>([]);
  const [sharedQuery, setSharedQuery] = useState("");
  const [sharedResults, setSharedResults] = useState<BullRow[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);

  // Busca compartilhada: usa primeiro trait selecionado para listagem
  useEffect(() => {
    if (mode !== "shared") return;
    const searchTrait = selectedTraits[0];
    if (!searchTrait) return;
    const t = setTimeout(async () => {
      if (!sharedQuery) return setSharedResults([]);
      try {
        setSharedLoading(true);
        const { data, error } = await supabase.rpc("nx3_bulls_lookup", {
          p_query: sharedQuery,
          p_trait: searchTrait,
          p_limit: 12,
        });
        if (error) throw error;
        setSharedResults((data ?? []) as BullRow[]);
      } catch (e: any) {
        setErr(e.message || String(e));
      } finally {
        setSharedLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [sharedQuery, selectedTraits, mode, supabase]);

  // Lista de colunas de PTA realmente existentes em bulls_denorm.
  // Mantida explícita para evitar que uma coluna inexistente (ex.: 'efc') quebre o SELECT inteiro.
  const VALID_DENORM_PTA_COLS = useMemo(
    () =>
      new Set([
        "hhp_dollar","tpi","nm_dollar","cm_dollar","fm_dollar","gm_dollar","f_sav",
        "ptam","cfp","ptaf","ptaf_pct","ptap","ptap_pct","pl","dpr","liv","scs",
        "mast","met","rp","da","ket","mf","ptat","udc","flc","sce","dce","ssb","dsb",
        "h_liv","ccr","hcr","fi","gl","bwc","sta","str","dfm","rua","rls","rtp","ftl",
        "rw","rlr","fta","fls","fua","ruh","ruw","ucl","udp","ftp","rfi","gfi",
      ]),
    []
  );
  const validSelectedTraits = useMemo(
    () => selectedTraits.filter((t) => VALID_DENORM_PTA_COLS.has(t)),
    [selectedTraits, VALID_DENORM_PTA_COLS]
  );

  // Adiciona touro ao pacote compartilhado buscando valores de TODAS as características selecionadas
  const addSharedBull = async (b: BullRow) => {
    if (sharedBulls.find((x) => x.id === b.id)) return;
    try {
      const cols = ["id", "code", "name", ...validSelectedTraits].filter((v, i, a) => a.indexOf(v) === i);
      const { data, error } = await supabase
        .from("bulls_denorm")
        .select(cols.join(","))
        .eq("id", b.id)
        .maybeSingle();
      if (error) throw error;
      const values: Record<string, number | null> = {};
      selectedTraits.forEach((t) => {
        const v = (data as any)?.[t];
        values[t] = v == null ? null : Number(v);
      });
      setSharedBulls((prev) => [...prev, { id: b.id, code: b.code, name: b.name, percent: 100, values }]);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };

  // Garante que TODOS os touros do pacote tenham valor para TODAS as características selecionadas.
  // Usa uma chave estável dos IDs para evitar loops, e refaz a busca sempre que faltar algum trait.
  const sharedBullIdsKey = useMemo(
    () => sharedBulls.map((b) => b.id).sort().join(","),
    [sharedBulls]
  );
  useEffect(() => {
    if (mode !== "shared") return;
    if (!sharedBullIdsKey) return;
    const ids = sharedBullIdsKey.split(",").filter(Boolean);
    if (!ids.length) return;
    const missingAny = sharedBulls.some((b) => selectedTraits.some((t) => !(t in (b.values || {}))));
    if (!missingAny) return;
    (async () => {
      try {
        const cols = ["id", ...validSelectedTraits].filter((v, i, a) => a.indexOf(v) === i);
        const { data, error } = await supabase
          .from("bulls_denorm")
          .select(cols.join(","))
          .in("id", ids);
        if (error) throw error;
        const byId = new Map((data ?? []).map((r: any) => [r.id, r]));
        setSharedBulls((prev) =>
          prev.map((b) => {
            const row: any = byId.get(b.id);
            const values = { ...(b.values || {}) };
            selectedTraits.forEach((t) => {
              if (!(t in values)) {
                const v = row ? row[t] : null;
                values[t] = v == null ? null : Number(v);
              }
            });
            return { ...b, values };
          })
        );
      } catch (e: any) {
        setErr(e.message || String(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTraits, sharedBullIdsKey, mode, supabase, validSelectedTraits]);

  const setSharedPercent = (id: string, v: number) => {
    setSharedBulls((prev) =>
      prev.map((b) => (b.id === id ? { ...b, percent: isNaN(v) ? 0 : Math.min(100, Math.max(0, v)) } : b))
    );
  };
  const removeSharedBull = (id: string) => setSharedBulls((prev) => prev.filter((b) => b.id !== id));


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

  // ====== Persistência do pacote (por usuário + fazenda) ======
  const packageLoadedRef = useRef(false);
  const packageFarmRef = useRef<string | null>(null);

  // Carrega pacote salvo quando farmId muda
  useEffect(() => {
    if (!farmId) return;
    packageLoadedRef.current = false;
    packageFarmRef.current = farmId;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("nexus3_user_packages")
          .select("mode, selected_traits, shared_bulls")
          .eq("user_id", uid)
          .eq("client_id", farmId)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          if (data.mode === "shared" || data.mode === "separate") setMode(data.mode);
          if (Array.isArray(data.selected_traits) && data.selected_traits.length) {
            setSelectedTraits(data.selected_traits as string[]);
          }
          if (Array.isArray(data.shared_bulls)) {
            setSharedBulls(data.shared_bulls as SharedBull[]);
          }
        }
      } catch (e) {
        // silencioso — não bloqueia a página
        console.warn("Nexus3: falha ao carregar pacote salvo", e);
      } finally {
        packageLoadedRef.current = true;
      }
    })();
  }, [farmId, supabase]);

  // Autosave (debounced) quando muda algo
  useEffect(() => {
    if (!farmId || !packageLoadedRef.current) return;
    if (packageFarmRef.current !== farmId) return;
    const handle = setTimeout(async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        await supabase
          .from("nexus3_user_packages")
          .upsert(
            {
              user_id: uid,
              client_id: farmId,
              mode,
              selected_traits: selectedTraits,
              shared_bulls: sharedBulls as any,
            },
            { onConflict: "user_id,client_id" }
          );
      } catch (e) {
        console.warn("Nexus3: falha ao salvar pacote", e);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [farmId, mode, selectedTraits, sharedBulls, supabase]);

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
    setExportSelection((prev) => {
      const next = new Set(prev);
      next.delete(t);
      return next;
    });
  };

  // Registro de refs dos gráficos por trait (para exportação múltipla)
  const chartRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const registerChart = React.useCallback((trait: string, el: HTMLDivElement | null) => {
    if (el) chartRefsMap.current.set(trait, el);
    else chartRefsMap.current.delete(trait);
  }, []);

  const [exportSelection, setExportSelection] = useState<Set<string>>(new Set());
  const [isExportingAll, setIsExportingAll] = useState(false);

  const toggleExport = (t: string) => {
    setExportSelection((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const selectAllExport = () => setExportSelection(new Set(selectedTraits));
  const clearExport = () => setExportSelection(new Set());

  const exportSelectedCharts = async () => {
    const traitsInOrder = selectedTraits.filter((t) => exportSelection.has(t));
    const els = traitsInOrder
      .map((t) => chartRefsMap.current.get(t))
      .filter((el): el is HTMLDivElement => !!el);
    if (!els.length) return;
    setIsExportingAll(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const traitList = traitsInOrder.map((t) => t.toUpperCase()).join("_");
      await exportMultipleChartsToPDF(els, {
        filename: `Nexus3_Graficos_${traitList}_${today}.pdf`,
        orientation: "l",
        format: "a4",
        pageMarginMm: 8,
      });
    } finally {
      setIsExportingAll(false);
    }
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

      {/* Seletor de modo do pacote de touros */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-medium text-gray-700">
          {isEs ? "Paquete de toros" : isEn ? "Sires package" : "Pacote de touros"}
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("shared")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              mode === "shared"
                ? "border-[#ED1C24] bg-[#ED1C24] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isEs ? "Mismo paquete para todas las PTAs" : isEn ? "Same package for all PTAs" : "Mesmo pacote para todas as PTAs"}
          </button>
          <button
            type="button"
            onClick={() => setMode("separate")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              mode === "separate"
                ? "border-[#ED1C24] bg-[#ED1C24] text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {isEs ? "Paquete separado por PTA" : isEn ? "Separate package per PTA" : "Pacote separado por PTA"}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {mode === "shared"
            ? (isEs ? "Defina UN conjunto de toros y se aplicará a todos los gráficos." : isEn ? "Define ONE set of sires that applies to all charts." : "Defina UM conjunto de touros e ele será aplicado a todos os gráficos.")
            : (isEs ? "Cada característica tendrá su propia búsqueda y selección de toros." : isEn ? "Each trait will have its own search and sires selection." : "Cada característica terá sua própria busca e seleção de touros.")}
        </p>
      </div>

      {/* Painel de touros compartilhados (apenas no modo shared) */}
      {mode === "shared" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              {isEs ? "Buscar y agregar toros (compartido)" : isEn ? "Search and add sires (shared)" : "Buscar e adicionar touros (compartilhado)"}
            </h3>
            {sharedLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
          </div>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none"
              placeholder="Ex.: 7HO, 007HO, 29HO, HELIX…"
              value={sharedQuery}
              onChange={(e) => setSharedQuery(e.target.value)}
            />
          </div>

          {sharedResults.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sharedResults.map((r) => (
                <button key={r.id} type="button" onClick={() => addSharedBull(r)} className="text-left">
                  <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300 hover:bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">{r.code}</p>
                    <p className="text-xs text-gray-500">{r.name || "—"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {sharedBulls.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {isEs ? "Pacote actual" : isEn ? "Current package" : "Pacote atual"}
              </h4>
              {sharedBulls.map((b) => (
                <div key={b.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{b.code}</p>
                    <p className="text-xs text-gray-500">{b.name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">%</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="h-9 w-20 rounded-lg border border-gray-300 px-2 text-right text-sm font-semibold text-gray-900 focus:border-gray-900 focus:outline-none"
                      value={b.percent}
                      onChange={(e) => setSharedPercent(b.id, parseFloat(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => removeSharedBull(b.id)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isEs ? "Ningún toro en el paquete todavía." : isEn ? "No sires in the package yet." : "Nenhum touro no pacote ainda."}
            </p>
          )}
        </div>
      )}

      {/* Painel de exportação múltipla */}
      {selectedTraits.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {isEs ? "Exportar gráficos a PDF" : isEn ? "Export charts to PDF" : "Exportar gráficos para PDF"}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {isEs
                  ? "Seleccione cuáles gráficos incluir en un único PDF."
                  : isEn
                  ? "Choose which charts to include in a single PDF."
                  : "Selecione quais gráficos incluir em um único PDF."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllExport}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {isEs ? "Seleccionar todos" : isEn ? "Select all" : "Selecionar todos"}
              </button>
              <button
                type="button"
                onClick={clearExport}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {isEs ? "Limpiar" : isEn ? "Clear" : "Limpar"}
              </button>
              <button
                type="button"
                disabled={isExportingAll || exportSelection.size === 0}
                onClick={exportSelectedCharts}
                className="inline-flex items-center gap-2 rounded-md bg-[#ED1C24] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#c8161d] disabled:opacity-50"
              >
                {isExportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isEs
                  ? `Exportar (${exportSelection.size})`
                  : isEn
                  ? `Export (${exportSelection.size})`
                  : `Exportar (${exportSelection.size})`}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {selectedTraits.map((t) => {
              const metric = ANIMAL_METRIC_COLUMNS.find((m) => m.key === t);
              const label = metric?.label || t.toUpperCase();
              const checked = exportSelection.has(t);
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
                    onChange={() => toggleExport(t)}
                    className="h-4 w-4 accent-[#ED1C24]"
                  />
                  <span className="font-medium text-gray-800">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

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
            sharedBulls={mode === "shared" ? sharedBulls : undefined}
            registerChart={registerChart}
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
