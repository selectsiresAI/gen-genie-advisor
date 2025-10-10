"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function Step7QuartisIndices() {
  const { farmId } = useAGFilters();
  const [indexA, setIndexA] = useState("hhp_dollar");
  const [indexB, setIndexB] = useState("nm_dollar");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (farmId) {
      console.log(`Índices A vs B carregados para farmId: ${farmId}`);
    }
  }, [farmId]);

  const load = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("ag_quartis_indices_compare", {
      p_farm: farmId,
      p_index_a: indexA,
      p_index_b: indexB,
      p_traits: ALL_PTA_COLUMNS,
    });
    if (error) {
      console.error("Failed to load quartis indices", error);
      setRows([]);
      setLoading(false);
      return;
    }
    setRows(Array.isArray(data) ? (data as Row[]) : []);
    setLoading(false);
  }, [farmId, indexA, indexB]);

  useEffect(() => {
    load();
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

    const diffData: any = { index: "Difference", group: "Difference" };
    const top25A = rows.filter((r) => r.index_label === "IndexA" && r.group_label === "Top25");
    const top25B = rows.filter((r) => r.index_label === "IndexB" && r.group_label === "Top25");

    ALL_PTA_COLUMNS.forEach((t) => {
      const valA = top25A.find((r) => r.trait_key === t)?.mean_value || 0;
      const valB = top25B.find((r) => r.trait_key === t)?.mean_value || 0;
      diffData[t] = valA - valB;
    });

    return [...(indexMap.get("IndexA") || []), ...(indexMap.get("IndexB") || []), diffData];
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quartis — Índices (A vs B)</CardTitle>
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
        </div>


        {loading && (
          <div className="py-6 text-center text-muted-foreground">Carregando dados...</div>
        )}

        {!loading && rows.length === 0 && (
          <div className="py-6 text-center text-muted-foreground">Sem dados.</div>
        )}

        {!loading && rows.length > 0 && (
          <div className="space-y-6">
            <div className="overflow-x-auto relative">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="sticky left-0 z-10 bg-background py-2 px-2 text-left font-semibold border-r">Index</th>
                    <th className="sticky left-[80px] z-10 bg-background py-2 px-2 text-left font-semibold border-r">Group</th>
                    {ALL_PTA_COLUMNS.map((t) => (
                      <th key={t} className="py-2 px-2 text-left font-semibold whitespace-nowrap">
                        {t.toUpperCase()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableDataByIndex.map((row, idx) => (
                    <tr
                      key={`${row.index}-${row.group}-${idx}`}
                      className={`border-b ${
                        row.index === "Difference" ? "bg-muted/30 font-semibold" : ""
                      }`}
                    >
                      <td className="sticky left-0 z-10 bg-background py-2 px-2 border-r">
                        {row.index === "IndexA"
                          ? getIndexDisplayLabel(indexA)
                          : row.index === "IndexB"
                          ? getIndexDisplayLabel(indexB)
                          : row.index}
                      </td>
                      <td className="sticky left-[80px] z-10 bg-background py-2 px-2 border-r">
                        {row.group}
                      </td>
                      {ALL_PTA_COLUMNS.map((t) => {
                        const val = row[t] as number | undefined;
                        const isPositive = val && val > 0;
                        const isDiff = row.index === "Difference";
                        return (
                          <td
                            key={t}
                            className={`py-2 px-2 whitespace-nowrap ${
                              isDiff && isPositive ? "text-green-600" : ""
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
