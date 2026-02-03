"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAutomaticCategory } from "@/utils/femaleCategories";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useAGFilters } from "../store";
import { ChartExportProvider } from "@/components/pdf/ChartExportProvider";
import { BatchExportBar, SingleExportButton } from "@/components/pdf/ExportButtons";
import { useRegisterChart } from "@/components/pdf/useRegisterChart";

/* ================== PTAs suportadas ================== */
const PTA_LABELS: Record<string, string> = {
  hhp_dollar: "HHP$",
  tpi: "TPI",
  nm_dollar: "NM$",
  ptam: "PTAM",
  ptaf: "PTAF",
  ptap: "PTAP",
  fi: "FI",
  ccr: "CCR",
  hcr: "HCR",
  pl: "PL",
  liv: "LIV",
  scs: "SCS",
  ptat: "PTAT",
  udc: "UDC",
  mast: "MAST",
  cfp: "CFP",
};
const ALL_PTA_KEYS = Object.keys(PTA_LABELS);

/* ============= Sinônimos comuns ============= */
const PTA_SYNONYMS: Record<string, string[]> = {
  hhp_dollar: ["hhp_dollar", "hhp$", "hhp"],
  nm_dollar: ["nm_dollar", "nm$", "nm", "netmerit", "meritoliquido"],
  tpi: ["tpi"],
  ptam: ["ptam", "pta_milk", "milk"],
  ptaf: ["ptaf", "pta_fat", "fat"],
  ptap: ["ptap", "pta_protein", "protein"],
  fi: ["fi", "fertilityindex", "fert_index"],
  ccr: ["ccr"],
  hcr: ["hcr"],
  pl: ["pl", "productive_life"],
  liv: ["liv"],
  scs: ["scs"],
  ptat: ["ptat"],
  udc: ["udc"],
  mast: ["mast", "mastitis"],
  cfp: ["cfp"],
};

/* ============= Tabelas/colunas candidatas ============= */
const TABLE_CANDIDATES = ["rebanho", "females_denorm", "female_denorm", "females", "female"];
const FARM_COLS = ["farm_id", "id_fazenda", "fazenda_id", "farmId"];

const DEFAULT_TABLE_TRAITS = ["hhp_dollar", "ptam", "cfp", "fi", "pl", "scs", "mast"];
const DEFAULT_CHART_TRAITS = [
  "hhp_dollar", "ptam", "ptaf", "ptap", "fi", "ccr", "hcr", "pl", "liv", "scs", "ptat", "udc",
];

const AGE_VALUES = ["Bezerra", "Novilha", "Primípara", "Secundípara", "Multípara"] as const;

/* ================== Helpers ================== */
const norm = (s: any) =>
  String(s ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");

const PTA_SYNONYMS_NORM: Record<string, string[]> = Object.fromEntries(
  Object.entries(PTA_SYNONYMS).map(([k, list]) => [k, Array.from(new Set(list.map(norm)))])
);

function toNumber(x: any): number | null {
  if (x == null) return null;
  const v = Number(String(x).replace(",", "."));
  return Number.isFinite(v) ? v : null;
}

function resolveTraitValue(row: any, canonical: string): number | null {
  const nm: Record<string, any> = {};
  for (const k of Object.keys(row)) nm[norm(k)] = row[k];

  const cands = PTA_SYNONYMS_NORM[canonical] || [norm(canonical)];
  for (const k of cands) {
    if (k in nm) {
      const v = toNumber(nm[k]);
      if (v != null) return v;
    }
    if (k.endsWith("dollar")) {
      const alt = k.replace("dollar", "");
      if (alt in nm) {
        const v2 = toNumber(nm[alt]);
        if (v2 != null) return v2;
      }
    } else {
      const alt = k + "dollar";
      if (alt in nm) {
        const v3 = toNumber(nm[alt]);
        if (v3 != null) return v3;
      }
    }
  }
  return null;
}

function detectColumn(keys: string[], candidates: string[]): string | null {
  for (const k of keys) {
    const nk = norm(k);
    if (candidates.some((c) => norm(c) === nk)) return k;
  }
  return null;
}

// Tooltip do radar exibindo valores BRUTOS
function RadarTooltip(props: any) {
  const { active, payload, label, groupA, groupB } = props;
  if (!active || !payload?.length) return null;
  const p = payload.find((pp: any) => pp.dataKey === "Group A")?.payload;
  return (
    <div className="rounded border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="font-medium mb-1">{label}</div>
      <div>{groupA}: {p?.rawA == null ? "-" : Number(p.rawA).toFixed(2)}</div>
      <div>{groupB}: {p?.rawB == null ? "-" : Number(p.rawB).toFixed(2)}</div>
    </div>
  );
}

/* ================== Tipos ================== */
type MeansByCategory = Record<string, Record<string, number | null>>;

/* ================== Componente ================== */
function Step6ProgressCompareContent() {
  const { farmId } = useAGFilters();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryCol, setCategoryCol] = useState<string>("");

  // Seleção de grupos e traits
  const [groupA, setGroupA] = useState("Novilha");
  const [groupB, setGroupB] = useState("Primípara");
  const [tableTraits, setTableTraits] = useState<string[]>(DEFAULT_TABLE_TRAITS);
  const [chartTraits, setChartTraits] = useState<string[]>(DEFAULT_CHART_TRAITS);

  const cardRef = useRef<HTMLDivElement>(null);
  const chartTitle = "Comparação por Categoria";
  useRegisterChart("step6-progress-compare", 6, chartTitle, cardRef);

  // Busca paginada para obter todos os animais
  async function fetchAllAnimals(table: string, farmCol: string, farmIdVal: string): Promise<any[]> {
    const PAGE_SIZE = 1000;
    const allRows: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq(farmCol, farmIdVal)
        .range(from, to);

      if (error) break;

      const pageData = Array.isArray(data) ? data : [];
      allRows.push(...pageData);

      hasMore = pageData.length === PAGE_SIZE;
      page += 1;
    }

    return allRows;
  }

  const fetchData = useCallback(async () => {
    if (!farmId) {
      setRows([]);
      setCategoryCol("");
      return;
    }
    setLoading(true);

    let gotRows: any[] = [];
    let catKey: string | null = null;

    for (const table of TABLE_CANDIDATES) {
      for (const fcol of FARM_COLS) {
        const { data: testData, error: testError } = await (supabase as any)
          .from(table)
          .select("*")
          .eq(fcol, farmId)
          .limit(1);
        
        if (!testError && Array.isArray(testData) && testData.length > 0) {
          gotRows = await fetchAllAnimals(table, fcol, String(farmId));
          if (gotRows.length > 0) break;
        }
      }
      if (gotRows.length > 0) break;
    }

    // Calcular categoria via birth_date usando getAutomaticCategory
    if (gotRows.length) {
      const keys = Object.keys(gotRows[0]);
      const birthKey = detectColumn(keys, ["birth_date", "birthdate", "dob", "data_nascimento", "datanascimento", "nascimento"]) ||
        keys.find((k) => norm(k).includes("birth") || norm(k).includes("nasc") || norm(k) === "dob");
      if (birthKey) {
        gotRows = gotRows.map((r) => {
          const birthDate = r?.[birthKey];
          if (birthDate) {
            const cat = getAutomaticCategory(birthDate);
            if (cat && cat !== 'Indefinida') {
              return { ...r, __category: cat };
            }
          }
          return r;
        });
        if (gotRows.some((r) => r?.__category)) catKey = "__category";
      }
    }

    // Fallback: usar parity/parity_order
    if ((!catKey || !gotRows.some((r) => r?.[catKey!])) && gotRows.length) {
      const keys = Object.keys(gotRows[0]);
      const parityKey =
        detectColumn(keys, ["parity", "paridade", "ordemparto", "order_of_calving", "parity_order"]) ||
        keys.find((k) => norm(k).includes("parit") || norm(k).includes("ordem"));
      if (parityKey) {
        gotRows = gotRows.map((r) => {
          const p = Number(r?.[parityKey]);
          let cat: string | null = null;
          if (Number.isFinite(p) && p >= 1) {
            if (p >= 3) cat = "Multípara";
            else if (p === 2) cat = "Secundípara";
            else cat = "Primípara";
          }
          return cat ? { ...r, __category: cat } : r;
        });
        if (gotRows.some((r) => r?.__category)) catKey = "__category";
      }
    }

    setRows(gotRows);
    setCategoryCol(catKey || "");

    const cats =
      catKey && gotRows.length
        ? Array.from(
            new Set(
              gotRows
                .map((r) => r?.[catKey!])
                .filter((c: any) => typeof c === "string" && c.trim().length > 0)
            )
          )
        : [];

    const ordered = [
      ...AGE_VALUES.filter((c) => cats.includes(c)),
      ...cats.filter((c) => !AGE_VALUES.includes(c as any)),
    ];

    setCategories(ordered);
    setLoading(false);
  }, [farmId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const meansByCategory: MeansByCategory = useMemo(() => {
    if (!rows.length || !categoryCol) return {};
    const acc: Record<string, Record<string, { sum: number; n: number }>> = {};

    for (const r of rows) {
      const cat = (r?.[categoryCol] as string) || "Sem categoria";
      if (!acc[cat]) acc[cat] = {};
      for (const key of ALL_PTA_KEYS) {
        const v = resolveTraitValue(r, key);
        if (v != null) {
          if (!acc[cat][key]) acc[cat][key] = { sum: 0, n: 0 };
          acc[cat][key].sum += v;
          acc[cat][key].n += 1;
        }
      }
    }

    const out: MeansByCategory = {};
    for (const [cat, map] of Object.entries(acc)) {
      out[cat] = {};
      for (const key of ALL_PTA_KEYS) {
        const b = map[key];
        out[cat][key] = b && b.n > 0 ? b.sum / b.n : null;
      }
    }
    return out;
  }, [rows, categoryCol]);

  const presentPTAs = useMemo(
    () =>
      ALL_PTA_KEYS.filter((key) =>
        Object.values(meansByCategory).some((group) => group && group[key] != null)
      ),
    [meansByCategory]
  );

  /* ------------------- Tabela + Radar normalizado ------------------- */
  const view = useMemo(() => {
    const A = meansByCategory[groupA] || {};
    const B = meansByCategory[groupB] || {};

    const tTraits = tableTraits.filter((k) => presentPTAs.includes(k));
    const cTraits = chartTraits.filter((k) => presentPTAs.includes(k));

    const table = {
      rows: [
        { label: groupA, ...Object.fromEntries(tTraits.map((k) => [k, A[k] ?? null])) },
        { label: groupB, ...Object.fromEntries(tTraits.map((k) => [k, B[k] ?? null])) },
        {
          label: "Change",
          ...Object.fromEntries(
            tTraits.map((k) => [k, A[k] != null && B[k] != null ? (A[k]! - B[k]!) : null])
          ),
        },
      ],
    };

    // Normalização 0–100 por eixo
    const radar = cTraits.map((k) => {
      const a = A[k] ?? 0;
      const b = B[k] ?? 0;
      const maxK = Math.max(1, Math.abs(a), Math.abs(b));
      const toPct = (v: number) => (Math.abs(v) / maxK) * 100;

      return {
        trait: (PTA_LABELS[k] ?? k).toUpperCase(),
        band25: 25,
        band50: 50,
        band75: 75,
        band100: 100,
        "Group A": toPct(a),
        "Group B": toPct(b),
        rawA: A[k] ?? null,
        rawB: B[k] ?? null,
      };
    });

    return { table, radar, presentPTAs };
  }, [meansByCategory, groupA, groupB, tableTraits, chartTraits, presentPTAs]);

  const toggleTableTrait = (key: string) => {
    setTableTraits(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleChartTrait = (key: string) => {
    setChartTraits(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <Card ref={cardRef}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{chartTitle}</CardTitle>
        <SingleExportButton targetRef={cardRef} step={6} title={chartTitle} slug="COMPARACAO" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Painel de informações de debug */}
        <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
          <div><strong>Fonte:</strong> {TABLE_CANDIDATES[0]} | <strong>Categoria:</strong> {categoryCol || "Não detectada"}</div>
          <div><strong>Total registros:</strong> {rows.length} | <strong>Categorias:</strong> {categories.join(", ") || "Nenhuma"}</div>
        </div>

        {/* Seleção de grupos */}
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground block mb-1">Grupo A</span>
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <Badge
                  key={`a-${cat}`}
                  variant={groupA === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setGroupA(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground block mb-1">Grupo B</span>
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <Badge
                  key={`b-${cat}`}
                  variant={groupB === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setGroupB(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Seleção de PTAs para tabela */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground block mb-1">PTAs da Tabela</span>
          <div className="flex gap-1 flex-wrap">
            {ALL_PTA_KEYS.filter(k => presentPTAs.includes(k)).map(key => (
              <Badge
                key={`t-${key}`}
                variant={tableTraits.includes(key) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleTableTrait(key)}
              >
                {PTA_LABELS[key] || key.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Seleção de PTAs para gráfico */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground block mb-1">PTAs do Gráfico</span>
          <div className="flex gap-1 flex-wrap">
            {ALL_PTA_KEYS.filter(k => presentPTAs.includes(k)).map(key => (
              <Badge
                key={`c-${key}`}
                variant={chartTraits.includes(key) ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => toggleChartTrait(key)}
              >
                {PTA_LABELS[key] || key.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {loading && <div className="py-6 text-center text-muted-foreground">Carregando dados…</div>}

        {!loading && (!rows.length || !categoryCol) && (
          <div className="py-6 text-center text-muted-foreground">
            Sem dados com categoria nas tabelas {TABLE_CANDIDATES.join(", ")}.
          </div>
        )}

        {!loading && rows.length > 0 && categoryCol && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="overflow-x-auto rounded-lg border bg-background">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="py-2 px-3 text-left font-semibold">Grupo</th>
                      {tableTraits.filter(t => presentPTAs.includes(t)).map((t) => (
                        <th key={`th-${t}`} className="py-2 px-3 text-left font-semibold">
                          {(PTA_LABELS[t] ?? t).toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {view.table.rows.map((r: any, idx: number) => (
                      <tr
                        key={`row-${idx}-${r.label}`}
                        className={`border-b ${idx === 2 ? "bg-muted/20" : ""}`}
                      >
                        <td className="py-2 px-3 font-medium">{r.label}</td>
                        {tableTraits.filter(t => presentPTAs.includes(t)).map((t) => {
                          const val = r[t] as number | null | undefined;
                          const isChange = idx === 2;
                          const isPos = (val ?? 0) > 0;
                          return (
                            <td
                              key={`td-${t}`}
                              className={`py-2 px-3 ${
                                isChange ? (isPos ? "text-green-600" : "text-red-600") : ""
                              }`}
                            >
                              {val == null ? "-" : Number(val).toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {view.radar.length > 0 && (
                <div className="flex flex-col rounded-lg border bg-background p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">
                    Rate of Change ({groupA} vs {groupB})
                  </h4>
                  <div className="mt-4 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={view.radar} startAngle={90} endAngle={-270}>
                        <PolarGrid gridType="circle" />
                        <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />

                        <Radar dataKey="band100" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.16} isAnimationActive={false} />
                        <Radar dataKey="band75" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.12} isAnimationActive={false} />
                        <Radar dataKey="band50" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.09} isAnimationActive={false} />
                        <Radar dataKey="band25" stroke="none" fill="hsl(var(--muted-foreground))" fillOpacity={0.06} isAnimationActive={false} />

                        <Radar
                          name={groupA}
                          dataKey="Group A"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2.5}
                          fill="hsl(var(--primary))"
                          fillOpacity={0.22}
                        />
                        <Radar
                          name={groupB}
                          dataKey="Group B"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={3}
                          strokeDasharray="6 6"
                          fill="hsl(var(--muted-foreground))"
                          fillOpacity={0.14}
                        />

                        <Legend 
                          formatter={(value: string) => {
                            if (value.startsWith("band")) return null;
                            return value;
                          }}
                          wrapperStyle={{ paddingTop: 8 }}
                        />
                        <Tooltip content={(props) => <RadarTooltip {...props} groupA={groupA} groupB={groupB} />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Step6ProgressCompare() {
  return (
    <ChartExportProvider>
      <BatchExportBar step={6} />
      <Step6ProgressCompareContent />
    </ChartExportProvider>
  );
}
