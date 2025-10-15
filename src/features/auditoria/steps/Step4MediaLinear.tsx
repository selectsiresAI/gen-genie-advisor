"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useAGFilters } from "../store";

type Mode = "coarse" | "full";

interface Row {
  trait_key: string;
  group_label: string;
  mean_value: number;
  n: number;
}

// PTAs padrão do Passo 4 (use minúsculas se as colunas do banco estiverem assim)
const DEFAULT_TRAITS = [
  "sta","str","dfm","rua","rls","rtp","ftl","rw","rlr","fta","fls","fua","ruh","ruw","ucl","udp","ftp"
];

const DEFAULT_TICK_STEP = 0.5;
const TRAIT_TICK_STEPS: Record<string, number> = {
  scs: 0.03,
  ptaf_pct: 0.03,
  ptap_pct: 0.03,
};

export default function Step4MediaLinear() {
  const { farmId } = useAGFilters();
  const [mode, setMode] = useState<Mode>("coarse");
  const [normalize, setNormalize] = useState(false);
  const [ptaOptions, setPtaOptions] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>(DEFAULT_TRAITS);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Carrega lista de PTAs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      const { data, error } = await (supabase.rpc as any)("ag_list_pta_columns");
      if (cancelled || !aliveRef.current) return;

      if (error) {
        console.error("Failed to list PTA columns", error);
        setPtaOptions([]);
        setErr("Falha ao carregar colunas de PTA.");
        return;
      }

      const cols = Array.isArray(data)
        ? (data
            .map((item: any) => (item?.column_name ? String(item.column_name) : null))
            .filter(Boolean) as string[])
        : [];
      setPtaOptions(cols);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Busca dados (com debounce)
  const fetchData = useCallback(() => {
    let cancelled = false;
    const run = async () => {
      if (!farmId || traits.length === 0) {
        setRows([]);
        return;
      }
      setLoading(true);
      setErr(null);

      const args: Record<string, any> = {
        p_farm: farmId,
        p_traits: traits,
        p_mode: mode,
        p_normalize: normalize,
      };
      if (normalize) args.p_scope = "farm";

      const { data, error } = await (supabase.rpc as any)("ag_linear_means", args);

      if (cancelled || !aliveRef.current) return;
      setLoading(false);

      if (error) {
        console.error("Failed to load linear means", error);
        setRows([]);
        setErr("Falha ao carregar as médias.");
        return;
      }

      const list = Array.isArray(data) ? data : [];
      const parsed = list
        .map((r: any) => ({
          trait_key: String(r.trait_key),
          group_label: String(r.group_label),
          mean_value: Number(r.mean_value),
          n: Number(r.n),
        }))
        .filter(
          (r) =>
            r.trait_key &&
            r.group_label &&
            Number.isFinite(r.mean_value) &&
            Number.isFinite(r.n)
        ) as Row[];

      setRows(parsed);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [farmId, traits, mode, normalize]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  const badges = useMemo(
    () =>
      ptaOptions
        .map((key) => ({ key, label: key.toUpperCase() }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [ptaOptions]
  );

  const chartData = useMemo(() => {
    const traitMap = new Map<string, { [group: string]: number }>();

    rows.forEach((row) => {
      if (!traitMap.has(row.trait_key)) {
        traitMap.set(row.trait_key, {});
      }
      traitMap.get(row.trait_key)![row.group_label] = row.mean_value;
    });

    return Array.from(traitMap.entries()).map(([trait, groups]) => ({
      trait: trait.toUpperCase(),
      ...groups,
      avgValue: Object.values(groups).reduce((a, b) => a + b, 0) / Object.values(groups).length,
    }));
  }, [rows]);

  const axisConfig = useMemo(() => {
    const defaultConfig = {
      domain: ["auto", "auto"] as [number | "auto", number | "auto"],
      ticks: undefined as number[] | undefined,
    };

    if (rows.length === 0) {
      return defaultConfig;
    }

    const getStepForTrait = (traitKey: string) => {
      const normalized = traitKey.toLowerCase();
      return TRAIT_TICK_STEPS[normalized] ?? DEFAULT_TICK_STEP;
    };

    const stepCandidates = rows.reduce((acc, row) => {
      if (row.trait_key) {
        acc.add(getStepForTrait(row.trait_key));
      }
      return acc;
    }, new Set<number>());

    let step = DEFAULT_TICK_STEP;
    if (stepCandidates.size === 1) {
      step = stepCandidates.values().next().value;
    } else if (stepCandidates.size > 1) {
      step = Math.max(...Array.from(stepCandidates));
    }

    if (!Number.isFinite(step) || step <= 0) {
      step = DEFAULT_TICK_STEP;
    }

    const values = rows
      .map((row) => row.mean_value)
      .filter((value): value is number => Number.isFinite(value));

    if (values.length === 0) {
      return defaultConfig;
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      return defaultConfig;
    }

    let paddedMin = minValue;
    let paddedMax = maxValue;

    if (minValue === maxValue) {
      paddedMin = minValue - step * 2;
      paddedMax = maxValue + step * 2;
    } else {
      paddedMin = minValue - step;
      paddedMax = maxValue + step;
    }

    const alignedMin = Math.floor(paddedMin / step) * step;
    const alignedMax = Math.ceil(paddedMax / step) * step;

    if (!Number.isFinite(alignedMin) || !Number.isFinite(alignedMax)) {
      return defaultConfig;
    }

    const safeStep = Number(step.toFixed(6));
    const safeMin = Number(alignedMin.toFixed(6));
    const safeMax = Number(alignedMax.toFixed(6));

    if (safeStep <= 0 || safeMin === Infinity || safeMax === -Infinity) {
      return defaultConfig;
    }

    const ticks: number[] = [];
    const estimatedTickCount = Math.max(Math.round((safeMax - safeMin) / safeStep) + 1, 2);
    const maxTicks = Math.min(estimatedTickCount + 2, 200);
    for (
      let tick = safeMin, count = 0;
      tick <= safeMax + safeStep / 2 && count < maxTicks;
      tick += safeStep, count += 1
    ) {
      ticks.push(Number(tick.toFixed(6)));
    }

    if (ticks.length === 0) {
      return defaultConfig;
    }

    return {
      domain: [safeMin, safeMax] as [number, number],
      ticks,
    };
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Média Linear</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Agrupamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coarse">Novilhas x Vacas</SelectItem>
              <SelectItem value="full">Grupos (Bezerra/…)</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-black"
              checked={normalize}
              onChange={(e) => setNormalize(e.target.checked)}
            />
            Normalizar pela média da fazenda
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map(({ key, label }) => {
            const on = traits.includes(key);
            return (
              <Badge
                key={key}
                variant={on ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setTraits((prev) =>
                    on ? prev.filter((i) => i !== key) : [...prev, key]
                  )
                }
              >
                {label}
              </Badge>
            );
          })}
          {badges.length === 0 && (
            <span className="text-sm text-muted-foreground">
              Nenhuma PTA disponível.
            </span>
          )}
        </div>

        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando…</div>
        )}

        {err && (
          <div className="py-6 text-center text-destructive">{err}</div>
        )}

        {!loading && !err && rows.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">Sem dados.</div>
        )}

        {!loading && !err && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 25)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={axisConfig.domain}
                ticks={axisConfig.ticks}
                tickFormatter={(value) => Number(value).toFixed(2)}
                allowDecimals
              />
              <YAxis dataKey="trait" type="category" width={90} />
              <Tooltip />
              <Bar dataKey="avgValue" fill="hsl(var(--muted))">
                <LabelList dataKey="avgValue" position="right" formatter={(val: number) => val.toFixed(2)} />
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.avgValue >= 0 ? "hsl(var(--muted))" : "hsl(var(--muted-foreground))"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
