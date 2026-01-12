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
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAGFilters } from "../store";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";

// Traits otimizados para carregamento rápido - apenas os mais relevantes
const CORE_PTA_COLUMNS = [
  "hhp_dollar", "tpi", "nm_dollar", "cm_dollar", "fm_dollar", "gm_dollar",
  "ptam", "ptaf", "ptap", "pl", "dpr", "liv", "scs", "ptat", "udc"
];

// Todos os traits (para exportação completa)
const ALL_PTA_COLUMNS = [
  "hhp_dollar", "tpi", "nm_dollar", "cm_dollar", "fm_dollar", "gm_dollar",
  "f_sav", "ptam", "cfp", "ptaf", "ptaf_pct", "ptap", "ptap_pct",
  "pl", "dpr", "liv", "scs", "mast", "met", "rp", "da", "ket", "mf",
  "ptat", "udc", "flc", "sce", "dce", "ssb", "dsb", "h_liv",
  "ccr", "hcr", "fi", "gl", "efc", "bwc", "sta", "str", "dfm",
  "rua", "rls", "rtp", "ftl", "rw", "rlr", "fta", "fls", "fua",
  "ruh", "ruw", "ucl", "udp", "ftp", "rfi", "gfi"
];

const INDEX_OPTIONS = [
  { label: "HHP$", value: "hhp_dollar" },
  { label: "TPI", value: "tpi" },
  { label: "NM$", value: "nm_dollar" },
  { label: "FM$", value: "fm_dollar" },
  { label: "CM$", value: "cm_dollar" },
];

interface Row {
  index_label: "IndexA" | "IndexB";
  group_label: "Top25" | "Bottom25";
  trait_key: string;
  mean_value: number;
  n: number;
}

const getIndexDisplayLabel = (value: string) => {
  const option = INDEX_OPTIONS.find((opt) => opt.value === value);
  return option?.label ?? value.toUpperCase();
};

function Step7QuartisIndicesContent() {
  const { farmId } = useAGFilters();
  const [indexA, setIndexA] = useState("hhp_dollar");
  const [indexB, setIndexB] = useState("nm_dollar");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [showAllTraits, setShowAllTraits] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const chartTitle = "Quartis — Índices (A vs B)";
  useRegisterChart("step7-quartis-indices", 7, chartTitle, cardRef);

  useEffect(() => {
    if (farmId) {
      console.log(`Índices A vs B carregados para farmId: ${farmId}`);
    }
  }, [farmId]);

  // Determina quais traits usar baseado no modo
  const activeTraits = showAllTraits ? ALL_PTA_COLUMNS : CORE_PTA_COLUMNS;

  const load = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      return;
    }
    
    // Cancelar requisição anterior se existir
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();
    
    setLoading(true);
    setErrorMsg(null);
    setLoadingProgress("Calculando percentis...");
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await (supabase.rpc as any)("ag_quartis_indices_compare", {
        p_farm: farmId,
        p_index_a: indexA,
        p_index_b: indexB,
        p_traits: activeTraits,
      });
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Quartis indices loaded in ${elapsed}s`);
      
      if (error) {
        console.error("Failed to load quartis indices", error);
        setErrorMsg(error.message?.includes("timeout") 
          ? "Consulta demorou demais. Tente com menos traits." 
          : `Erro: ${error.message}`);
        setRows([]);
        setLoading(false);
        return;
      }
      
      setRows(Array.isArray(data) ? (data as Row[]) : []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error loading quartis indices", err);
        setErrorMsg("Erro ao carregar dados. Tente novamente.");
      }
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  }, [farmId, indexA, indexB, activeTraits]);

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  const tableDataByIndex = useMemo(() => {
    const groups = ["Top25", "Bottom25", "Difference"] as const;
    const indexMap = new Map<string, any>();

    ["IndexA", "IndexB"].forEach((idx) => {
      const indexRows = rows.filter((r) => r.index_label === idx);
      const groupData = groups.map((group) => {
        const groupRows = indexRows.filter((r) => r.group_label === group);
        const result: any = { index: idx, group };
        groupRows.forEach((r) => {
          result[r.trait_key] = r.mean_value;
        });
        return result;
      });
      indexMap.set(idx, groupData);
    });

    const diffData: any = { index: "Difference", group: "Diferença" };
    const top25A = rows.filter((r) => r.index_label === "IndexA" && r.group_label === "Top25");
    const top25B = rows.filter((r) => r.index_label === "IndexB" && r.group_label === "Top25");

    activeTraits.forEach((t) => {
      const valA = top25A.find((r) => r.trait_key === t)?.mean_value || 0;
      const valB = top25B.find((r) => r.trait_key === t)?.mean_value || 0;
      diffData[t] = valA - valB;
    });

    return [...(indexMap.get("IndexA") || []), ...(indexMap.get("IndexB") || []), diffData];
  }, [rows, activeTraits]);

  return (
    <Card ref={cardRef}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
        <SingleExportButton targetRef={cardRef} step={7} title={chartTitle} slug="Quartis_Indices" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={indexA} onValueChange={setIndexA}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Índice A" />
            </SelectTrigger>
            <SelectContent>
              {INDEX_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={indexB} onValueChange={setIndexB}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Índice B" />
            </SelectTrigger>
            <SelectContent>
              {INDEX_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            variant={showAllTraits ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowAllTraits((v) => !v)}
            disabled={loading}
          >
            {showAllTraits ? "Todos os Traits (lento)" : "Traits Principais"}
          </Button>
        </div>

        {loading && (
          <div className="py-6 text-center">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
            <p className="text-muted-foreground">{loadingProgress || "Carregando dados..."}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Isso pode levar alguns segundos para rebanhos grandes.
            </p>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="py-6 text-center text-destructive">{errorMsg}</div>
        )}

        {!loading && !errorMsg && rows.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">Sem dados.</div>
        )}

        {!loading && !errorMsg && rows.length > 0 && (
          <div className="space-y-6">
            <div className="relative overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 border-r bg-background py-2 px-2 text-left font-semibold">Índice</th>
                    <th className="sticky left-[80px] z-10 border-r bg-background py-2 px-2 text-left font-semibold">Grupo</th>
                    {activeTraits.map((t) => (
                      <th key={t} className="py-2 px-2 whitespace-nowrap text-left font-semibold">
                        {t.replace("_dollar", "$").toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableDataByIndex.map((row, idx) => (
                    <tr
                      key={`${row.index}-${row.group}-${idx}`}
                      className={`border-b ${row.index === "Difference" ? "bg-muted/30 font-semibold" : ""}`}
                    >
                      <td className="sticky left-0 z-10 border-r bg-background py-2 px-2">
                        {row.index === "IndexA"
                          ? getIndexDisplayLabel(indexA)
                          : row.index === "IndexB"
                          ? getIndexDisplayLabel(indexB)
                          : "Diferença"}
                      </td>
                      <td className="sticky left-[80px] z-10 border-r bg-background py-2 px-2">
                        {row.group === "Top25" ? "Top 25%" : row.group === "Bottom25" ? "Bottom 25%" : row.group}
                      </td>
                      {activeTraits.map((t) => {
                        const val = row[t] as number | undefined;
                        const isPositive = val && val > 0;
                        const isDiff = row.index === "Difference";
                        return (
                          <td
                            key={t}
                            className={`whitespace-nowrap py-2 px-2 ${
                              isDiff && isPositive ? "text-green-600" : isDiff && val && val < 0 ? "text-red-600" : ""
                            }`}
                          >
                            {val != null ? Math.round(val) : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Step7QuartisIndices() {
  return (
    <ChartExportProvider>
      <BatchExportBar step={7} />
      <Step7QuartisIndicesContent />
    </ChartExportProvider>
  );
}
