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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">PTA</th>
                <th className="py-2">Grupo</th>
                <th className="py-2">Média</th>
                <th className="py-2">N</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.trait_key}-${row.group_label}`}
                  className="border-b"
                >
                  <td className="py-2">{row.trait_key.toUpperCase()}</td>
                  <td className="py-2">{row.group_label}</td>
                  <td className="py-2">{Math.round(Number(row.mean_value))}</td>
                  <td className="py-2">{row.n}</td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Carregando…
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && !err && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    Sem dados.
                  </td>
                </tr>
              )}

              {err && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-destructive">
                    {err}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
