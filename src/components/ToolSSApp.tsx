import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, PieChart, Pie, Cell
} from "recharts";
import {
  Users, Search as SearchIcon, Calculator, FileText, LineChart as LineIcon,
  Plus, Download, Upload, SlidersHorizontal, ArrowLeftRight, Layers3, PieChart as PieIcon, ArrowLeft, Beef, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SegmentationPage from "./SegmentationPage";
import NexusApp from "./NexusApp";
import PlanoApp from "./PlanoApp";

/**
 * ToolSS — MVP interativo (Lovable-ready)
 * Select Sires color palette integrated with design system
 */

// ------------------------ Types ------------------------
type Female = {
  id: string;
  brinco: string;
  nascimento: string; // ISO yyyy-mm-dd
  naabPai: string;
  nomePai: string;
  TPI: number;
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  DPR: number; // fertilidade
  SCS: number; // menor melhor
  PTAT: number; // tipo
  year: number;
  // Campos calculados na segmentação (não obrigatórios no seed)
  _percentil?: number | null;
  _grupo?: "Doadoras" | "Inter" | "Receptoras";
  _motivo?: string;
};

type Bull = {
  naab: string;
  nome: string;
  pedigree: string;
  TPI: number;
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  SCS: number;
  PTAT: number;
  disponibilidade?: "Disponível" | "Sem estoque";
};

type Client = {
  id: number;
  nome: string;
  cidade: string;
  uf: string;
  farms: Array<{
    id: string;
    nome: string;
    females: Female[];
    bulls: Bull[];
  }>;
};

type Weights = { 
  TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; 
};

// ------------------------ Segmentation Types ------------------------
type PrimaryIndex = "TPI" | "NM$" | "Custom";
type SegmentConfig = {
  primaryIndex: PrimaryIndex;
  donorCutoffPercent: number;   // ex.: 20 → Top 20% = Doadoras
  goodCutoffUpper: number;      // ex.: 70 → Bom até 70%; resto Receptoras
  scsMaxDonor: number;          // 2.9
  dprMinDonor: number;          // 1.0
  critical_dpr_lt: number;      // -1.0
  critical_scs_gt: number;      // 3.0
};

// ------------------------ Utilities ------------------------
function toCSV(rows: any[], filename = "export.csv") {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv =
    [headers.join(",")]
      .concat(rows.map((r) => headers.map((h) => String(r[h] ?? "")).join(",")))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((x) => x.trim());
    const obj: any = {};
    headers.forEach((h, i) => (obj[h] = cols[i]));
    return obj;
  });
}

function zscale(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
  const sd = Math.sqrt(
    values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
      Math.max(values.length - 1, 1)
  );
  return { mean, sd: sd || 1 };
}

function normalize(value: number, mean: number, sd: number) {
  return (value - mean) / (sd || 1);
}

// ------------------------ Seed Data ------------------------
const seedFemales: Female[] = [
  {
    id: "F3382", brinco: "3382", nascimento: "2023-06-01",
    naabPai: "029HO19791", nomePai: "Haven", TPI: 2526, NM$: 853,
    Milk: 1811, Fat: 70, Protein: 53, DPR: 1, SCS: 2.9, PTAT: 0.42, year: 2023
  },
  {
    id: "F3407", brinco: "3407", nascimento: "2023-06-01",
    naabPai: "208HO00355", nomePai: "Cason", TPI: 2507, NM$: 797,
    Milk: 1854, Fat: 63, Protein: 57, DPR: 1.2, SCS: 2.98, PTAT: 0.50, year: 2023
  },
  {
    id: "F3151", brinco: "3151", nascimento: "2022-06-01",
    naabPai: "011HO15225", nomePai: "Luche", TPI: 2500, NM$: 835,
    Milk: 2180, Fat: 66, Protein: 67, DPR: -1.1, SCS: 2.8, PTAT: 0.38, year: 2022
  },
  {
    id: "F3370", brinco: "3370", nascimento: "2023-06-01",
    naabPai: "029HO19829", nomePai: "Stormy", TPI: 2496, NM$: 826,
    Milk: 1632, Fat: 64, Protein: 48, DPR: 0.6, SCS: 2.87, PTAT: 0.39, year: 2023
  },
  {
    id: "F3280", brinco: "3280", nascimento: "2023-06-01",
    naabPai: "029HO19829", nomePai: "Stormy", TPI: 2496, NM$: 840,
    Milk: 1716, Fat: 64, Protein: 52, DPR: 0.4, SCS: 2.9, PTAT: 0.43, year: 2023
  },
  {
    id: "F3185", brinco: "3185", nascimento: "2023-06-01",
    naabPai: "011HO15225", nomePai: "Luche", TPI: 2476, NM$: 731,
    Milk: 2084, Fat: 61, Protein: 64, DPR: -1.0, SCS: 2.87, PTAT: 0.70, year: 2023
  },
  {
    id: "F3430", brinco: "3430", nascimento: "2023-06-01",
    naabPai: "208HO00355", nomePai: "Cason", TPI: 2472, NM$: 723,
    Milk: 1780, Fat: 57, Protein: 54, DPR: 0.9, SCS: 3.0, PTAT: 0.66, year: 2023
  },
  // anos anteriores para gráficos
  {
    id: "F2019A", brinco: "2890", nascimento: "2019-05-20",
    naabPai: "007HO14195", nomePai: "Legacy", TPI: 1818, NM$: 243,
    Milk: 1050, Fat: 50, Protein: 38, DPR: 0.2, SCS: 2.95, PTAT: 0.1, year: 2019
  },
  {
    id: "F2021A", brinco: "3001", nascimento: "2021-03-15",
    naabPai: "250HO12961", nomePai: "Gameday", TPI: 2016, NM$: 326,
    Milk: 1200, Fat: 58, Protein: 45, DPR: -0.3, SCS: 2.85, PTAT: 0.2, year: 2021
  },
];

const seedBulls: Bull[] = [
  { naab: "7HO17191", nome: "Mican", pedigree: "Sheepster x Gameday x Legacy", TPI: 3479, NM$: 989, Milk: 1329, Fat: 100, Protein: 67, SCS: 2.70, PTAT: 1.6, disponibilidade: "Disponível" },
  { naab: "7HO17572", nome: "Myboyblue", pedigree: "Reaper x Parsly x Try Me", TPI: 3479, NM$: 1026, Milk: 994, Fat: 99, Protein: 50, SCS: 2.66, PTAT: 1.7, disponibilidade: "Disponível" },
  { naab: "14HO17486", nome: "Cobot", pedigree: "Rimbot x Monteverdi x Envoy", TPI: 3459, NM$: 1158, Milk: 840, Fat: 109, Protein: 50, SCS: 2.64, PTAT: 1.8, disponibilidade: "Disponível" },
  { naab: "7HO17200", nome: "Golley", pedigree: "Sheepster x Deluxe x Biggelo", TPI: 3448, NM$: 903, Milk: 665, Fat: 128, Protein: 53, SCS: 2.63, PTAT: 1.5, disponibilidade: "Disponível" },
  { naab: "7HO17478", nome: "Sturgeon", pedigree: "Sheepster x Upside x Legacy", TPI: 3448, NM$: 962, Milk: 1463, Fat: 111, Protein: 69, SCS: 2.68, PTAT: 1.3, disponibilidade: "Disponível" },
  { naab: "7HO17194", nome: "Donald", pedigree: "Sheepster x Engineer x Lionel", TPI: 3444, NM$: 1015, Milk: 831, Fat: 117, Protein: 56, SCS: 2.69, PTAT: 1.4, disponibilidade: "Disponível" },
  { naab: "14HO17393", nome: "Ozark", pedigree: "Sheepster x Gameday x Pursuit", TPI: 3443, NM$: 933, Milk: 725, Fat: 107, Protein: 42, SCS: 2.65, PTAT: 1.5, disponibilidade: "Disponível" },
];

const seedClients: Client[] = [
  {
    id: 1160, nome: "ANTONIO BRAZ TINOCO", cidade: "Patos de Minas", uf: "MG",
    farms: [{ id: "FAZ1", nome: "Fazenda Matriz", females: seedFemales, bulls: seedBulls }]
  },
  { id: 110, nome: "CARLOS JACOB WALLAUER", cidade: "Salvador do Sul", uf: "RS", farms: [{ id: "FAZ2", nome: "Fazenda das Araucárias", females: seedFemales.slice(0,6), bulls: seedBulls }] },
  { id: 85, nome: "CLAUDIO E SEMILDO SCHIEFELBEIN", cidade: "Fortaleza dos Valos", uf: "RS", farms: [{ id: "FAZ3", nome: "Rebanho Fini", females: seedFemales.slice(2), bulls: seedBulls }] },
  { id: 135, nome: "FAZENDA SAN DIEGO", cidade: "Chiapeta", uf: "RS", farms: [{ id: "FAZ4", nome: "San Diego", females: seedFemales, bulls: seedBulls }] },
];

// ------------------------ Persistence ------------------------
const STORAGE_KEY = "toolss_clients_v1";
const SEGMENT_CFG_KEY = "toolss_segment_config_v1";

function loadClients(): Client[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedClients;
  try { return JSON.parse(raw) as Client[]; } catch { return seedClients; }
}
function saveClients(clients: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

const defaultSegConfig: SegmentConfig = {
  primaryIndex: "NM$",
  donorCutoffPercent: 20,
  goodCutoffUpper: 70,
  scsMaxDonor: 2.9,
  dprMinDonor: 1.0,
  critical_dpr_lt: -1.0,
  critical_scs_gt: 3.0,
};

function loadSegConfig(): SegmentConfig {
  const raw = localStorage.getItem(SEGMENT_CFG_KEY);
  if (!raw) return defaultSegConfig;
  try { return { ...defaultSegConfig, ...(JSON.parse(raw) as SegmentConfig) }; }
  catch { return defaultSegConfig; }
}

function saveSegConfig(cfg: SegmentConfig) {
  localStorage.setItem(SEGMENT_CFG_KEY, JSON.stringify(cfg));
}

// ------------------------ Custom Index ------------------------
const defaultWeights: Weights = { TPI: 0.35, ["NM$"]: 0.30, Milk: 0.10, Fat: 0.10, Protein: 0.10, SCS: 0.03, PTAT: 0.02 };

function scoreAnimal(a: { TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; }, stats: any, w: Weights) {
  // Normaliza por z-score e aplica pesos; SCS entra negativo (penaliza).
  const zTPI = normalize(a.TPI, stats.TPI.mean, stats.TPI.sd);
  const zNM  = normalize(a["NM$"], stats.NM.mean, stats.NM.sd);
  const zMilk= normalize(a.Milk, stats.Milk.mean, stats.Milk.sd);
  const zFat = normalize(a.Fat,  stats.Fat.mean, stats.Fat.sd);
  const zProt= normalize(a.Protein, stats.Protein.mean, stats.Protein.sd);
  const zSCS = normalize(a.SCS,  stats.SCS.mean, stats.SCS.sd);
  const zPTAT= normalize(a.PTAT, stats.PTAT.mean, stats.PTAT.sd);
  return (
    w.TPI * zTPI +
    w["NM$"] * zNM +
    w.Milk * zMilk +
    w.Fat * zFat +
    w.Protein * zProt +
    w.PTAT * zPTAT -
    w.SCS * zSCS
  );
}

// Projeção simples (Parent Average): filha ≈ (PTA mãe + PTA touro) / 2
function projectDaughter(m: Female, b: Bull): Female {
  return {
    ...m,
    TPI: Math.round((m.TPI + b.TPI) / 2),
    ["NM$"]: Math.round((m["NM$"] + b["NM$"]) / 2),
    Milk: Math.round((m.Milk + b.Milk) / 2),
    Fat: Math.round((m.Fat + b.Fat) / 2),
    Protein: Math.round((m.Protein + b.Protein) / 2),
    DPR: (m.DPR + 0) / 2, // sem DPR do touro no seed
    SCS: (m.SCS + b.SCS) / 2,
    PTAT: Number(((m.PTAT + b.PTAT) / 2).toFixed(2)),
  };
}

// ------------------------ Segmentation Functions ------------------------
function getPrimaryValue(f: Female, primary: PrimaryIndex, statsForCustom: any, weights: Weights): number | null {
  if (primary === "TPI") return Number(f.TPI ?? null);
  if (primary === "NM$") return Number(f["NM$"] ?? null);
  if (primary === "Custom") {
    try {
      const base = { TPI: f.TPI, ["NM$"]: f["NM$"], Milk: f.Milk, Fat: f.Fat, Protein: f.Protein, SCS: f.SCS, PTAT: f.PTAT };
      return scoreAnimal(base, statsForCustom, weights);
    } catch { return null; }
  }
  return null;
}

function computePercentiles(values: Array<{ id: string; v: number }>): Map<string, number> {
  // Ordena desc (maior índice = melhor) e atribui percentil 1..100
  const sorted = [...values].sort((a, b) => b.v - a.v);
  const n = sorted.length;
  const map = new Map<string, number>();
  sorted.forEach((item, i) => {
    const p = Math.round(((i + 1) / n) * 100);
    map.set(item.id, p);
  });
  return map;
}

function segmentAnimals(
  females: Female[],
  cfg: SegmentConfig,
  statsForCustom: any,
  weights: Weights
): Female[] {
  const base: Array<{ id: string; v: number }> = [];
  females.forEach((f) => {
    const v = getPrimaryValue(f, cfg.primaryIndex, statsForCustom, weights);
    if (v === null || Number.isNaN(v)) return;
    base.push({ id: f.id, v: Number(v) });
  });
  const pct = computePercentiles(base);

  return females.map((f) => {
    const p = pct.get(f.id) ?? null;
    // Regras críticas → Receptoras
    const crit = (f.DPR ?? 0) < cfg.critical_dpr_lt || (f.SCS ?? 0) > cfg.critical_scs_gt;
    if (crit) {
      return { ...f, _percentil: p, _grupo: "Receptoras", _motivo: "Crítico: DPR/SCS" };
    }

    if (p !== null && p <= cfg.donorCutoffPercent) {
      const okSCS = (f.SCS ?? 99) <= cfg.scsMaxDonor;
      const okDPR = (f.DPR ?? -99) >= cfg.dprMinDonor;
      if (okSCS && okDPR) {
        return { ...f, _percentil: p, _grupo: "Doadoras", _motivo: "Top + saúde OK" };
      }
      return { ...f, _percentil: p, _grupo: "Inter", _motivo: "Top, saúde insuficiente" };
    }

    if (p !== null && p <= cfg.goodCutoffUpper) {
      return { ...f, _percentil: p, _grupo: "Inter", _motivo: "Faixa intermediária" };
    }

    return { ...f, _percentil: p, _grupo: "Receptoras", _motivo: "Abaixo do limiar" };
  });
}

// ------------------------ Main App ------------------------
export default function ToolSSApp() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<"clientes" | "fazenda" | "rebanho" | "touros" | "graficos" | "plano" | "info" | "segmentacao" | "nexus">("clientes");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]); // naab
  const farm = useMemo(
    () => selectedClient?.farms.find((f) => f.id === selectedFarmId) ?? null,
    [selectedClient, selectedFarmId]
  );

  useEffect(() => {
    const data = loadClients();
    setClients(data);
  }, []);

  useEffect(() => {
    if (clients.length) saveClients(clients);
  }, [clients]);

  // estatísticas p/ índice
  const stats = useMemo(() => {
    const base = (farm?.bulls?.length ? farm.bulls : seedBulls) as Array<any>;
    const cols = ["TPI", "NM$", "Milk", "Fat", "Protein", "SCS", "PTAT"] as const;
    const s: any = {};
    cols.forEach((c) => (s[c === "NM$" ? "NM" : c] = zscale(base.map((b) => Number(b[c])))));
    return {
      TPI: s.TPI, NM: s.NM, Milk: s.Milk, Fat: s.Fat, Protein: s.Protein, SCS: s.SCS, PTAT: s.PTAT,
    };
  }, [farm?.bulls]);

  const rankedBulls = useMemo(() => {
    if (!farm) return [];
    return [...farm.bulls]
      .map((b) => ({ ...b, _score: scoreAnimal(b as any, stats, weights) }))
      .sort((a, b) => b._score - a._score);
  }, [farm, stats, weights]);

  // projeções (usa o 1º touro selecionado, ou o 1º do ranking)
  const bullForProjection = useMemo(() => {
    const pick = selectedBulls[0];
    return rankedBulls.find((b) => b.naab === pick) || rankedBulls[0];
  }, [rankedBulls, selectedBulls]);

  const projectedFemales = useMemo(() => {
    if (!farm || !bullForProjection) return [];
    return farm.females.map((f) => projectDaughter(f, bullForProjection));
  }, [farm, bullForProjection]);

  // Agregados p/ gráficos por ano
  const aggByYear = (rows: Female[]) => {
    const map: Record<number, { year: number; TPI: number; ["NM$"]: number; count: number; Milk: number; Fat: number; Protein: number; }> = {};
    rows.forEach((r) => {
      const y = r.year || new Date(r.nascimento).getFullYear();
      if (!map[y]) map[y] = { year: y, TPI: 0, ["NM$"]: 0, Milk: 0, Fat: 0, Protein: 0, count: 0 };
      map[y].TPI += r.TPI; map[y]["NM$"] += r["NM$"];
      map[y].Milk += r.Milk; map[y].Fat += r.Fat; map[y].Protein += r.Protein; map[y].count += 1;
    });
    return Object.values(map)
      .map((d) => ({
        year: d.year,
        TPI: Math.round(d.TPI / d.count),
        ["NM$"]: Math.round(d["NM$"] / d.count),
        Milk: Math.round(d.Milk / d.count),
        Fat: Math.round(d.Fat / d.count),
        Protein: Math.round(d.Protein / d.count),
      }))
      .sort((a, b) => a.year - b.year);
  };

  const mothersSeries = useMemo(() => (farm ? aggByYear(farm.females) : []), [farm]);
  const daughtersSeries = useMemo(() => (projectedFemales.length ? aggByYear(projectedFemales) : []), [projectedFemales]);

  // filtros
  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.cidade.toLowerCase().includes(q) ||
        c.farms.some((f) => f.nome.toLowerCase().includes(q))
    );
  }, [clients, query]);

  const openFarm = (client: Client, farmId: string) => {
    setSelectedClient(client);
    setSelectedFarmId(farmId);
    setPage("fazenda");
  };

  // ------------------------ Upload CSV (fêmeas/touros) ------------------------
  const handleUpload = async (e: any, type: "females" | "bulls") => {
    const file = e.target.files?.[0];
    if (!file || !farm || !selectedClient) return;
    const text = await file.text();
    const rows = parseCSV(text);

    if (type === "bulls") {
      const bulls: Bull[] = rows.map((r: any) => ({
        naab: r.Naab || r.NAAB || r.naab || "",
        nome: r.Nome || r.Name || r.nome || "",
        pedigree: r.Pedigree || r.pedigree || "",
        TPI: Number(r.TPI || r.tpi || 0),
        ["NM$"]: Number(r["NM$"] || r.NM || r.nm || 0),
        Milk: Number(r.Milk || r.Leite || 0),
        Fat: Number(r.Fat || r.Gordura || 0),
        Protein: Number(r.Protein || r.Proteina || r.Proteína || 0),
        SCS: Number(r.SCS || r.CCS || 0),
        PTAT: Number(r.PTAT || r.Tipo || 0),
        disponibilidade: "Disponível",
      }));
      const newClients = clients.map((c) =>
        c.id !== selectedClient.id
          ? c
          : {
              ...c,
              farms: c.farms.map((f) =>
                f.id === farm.id ? { ...f, bulls: [...f.bulls, ...bulls] } : f
              ),
            }
      );
      setClients(newClients);
    } else {
      const females: Female[] = rows.map((r: any, i: number) => ({
        id: r.id || `CSVF${Date.now()}${i}`,
        brinco: r.Brinco || r.brinco || r.Tag || "",
        nascimento: r.Nascimento || r.Birth || "2023-01-01",
        naabPai: r.NaabPai || r.naabPai || r.SireNaab || "",
        nomePai: r.NomePai || r.nomePai || r.Sire || "",
        TPI: Number(r.TPI || 0), ["NM$"]: Number(r["NM$"] || r.NM || 0),
        Milk: Number(r.Milk || r.Leite || 0), Fat: Number(r.Fat || r.Gordura || 0),
        Protein: Number(r.Protein || r.Proteina || r.Proteína || 0),
        DPR: Number(r.DPR || 0), SCS: Number(r.SCS || r.CCS || 2.9),
        PTAT: Number(r.PTAT || 0.4),
        year: Number(r.Ano || r.Year || new Date(r.Nascimento || "2023-01-01").getFullYear()),
      }));
      const newClients = clients.map((c) =>
        c.id !== selectedClient.id
          ? c
          : {
              ...c,
              farms: c.farms.map((f) =>
                f.id === farm.id ? { ...f, females: [...f.females, ...females] } : f
              ),
            }
      );
      setClients(newClients);
    }
    e.target.value = "";
  };

  // ------------------------ Render Pages ------------------------
  return (
    <div className="min-h-screen bg-background">
      <Header
        page={page}
        onGoto={(p) => setPage(p)}
        canGoHome={!!selectedClient}
        onHome={() => setPage("clientes")}
      />

      {page === "clientes" && (
        <ClientsPage
          clients={filteredClients}
          query={query}
          onQuery={setQuery}
          openFarm={openFarm}
        />
      )}

      {page === "fazenda" && farm && selectedClient && (
        <FarmHome
          client={selectedClient}
          farm={farm}
          open={(p) => setPage(p)}
        />
      )}

      {page === "rebanho" && farm && selectedClient && (
        <HerdPage
          client={selectedClient}
          farm={farm}
          onBack={() => setPage("fazenda")}
          onExport={() => toCSV(farm.females, `femeas_${selectedClient.id}.csv`)}
          onUpload={(e: any) => handleUpload(e, "females")}
        />
      )}

      {page === "touros" && farm && selectedClient && (
        <BullsPage
          bulls={rankedBulls}
          weights={weights}
          setWeights={setWeights}
          selectedBulls={selectedBulls}
          setSelectedBulls={setSelectedBulls}
          onExport={() => toCSV(rankedBulls, `touros_${selectedClient.id}.csv`)}
          onUpload={(e: any) => handleUpload(e, "bulls")}
          onBack={() => setPage("fazenda")}
        />
      )}

      {page === "graficos" && farm && (
        <ChartsPage
          mothers={mothersSeries}
          daughters={daughtersSeries}
          onBack={() => setPage("fazenda")}
        />
      )}

      {page === "plano" && (
        <PlanoApp
          onBack={() => setPage("clientes")}
        />
      )}

      {page === "segmentacao" && farm && (
        <SegmentationPage
          farm={farm}
          weights={weights}
          statsForCustom={stats}
          onBack={() => setPage("fazenda")}
        />
      )}

      {page === "nexus" && (
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 z-40 border-b bg-card shadow-sm mb-6">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
              <Button variant="outline" onClick={() => setPage("clientes")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao TOOLSS
              </Button>
              <div className="font-bold text-xl">
                Nexus <span className="font-normal text-sm text-muted-foreground">Sistema de Predição Genética</span>
              </div>
            </div>
          </div>
          <NexusApp />
        </div>
      )}

      {page === "info" && farm && (
        <InfoPage onBack={() => setPage("fazenda")} />
      )}
    </div>
  );
}

// ------------------------ Page Components ------------------------
function Header({
  page, onGoto, canGoHome, onHome,
}: { page: string; onGoto: (p: any) => void; canGoHome: boolean; onHome: () => void; }) {
  return (
    <div className="sticky top-0 z-40 border-b bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center">
            <Beef className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="font-bold text-xl">
            TOOLSS <span className="font-normal text-sm text-muted-foreground">by Select Sires</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {canGoHome && (
            <Button variant="outline" onClick={onHome} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Clientes
            </Button>
          )}
          <NavButton icon={<Beef size={16} />} label="Rebanho" onClick={() => onGoto("rebanho")} />
          <NavButton icon={<Layers3 size={16} />} label="Segmentação" onClick={() => onGoto("segmentacao")} />
          <NavButton icon={<SearchIcon size={16} />} label="Busca de touros" onClick={() => onGoto("touros")} />
          <NavButton icon={<LineIcon size={16} />} label="Gráficos" onClick={() => onGoto("graficos")} />
          <NavButton icon={<Calculator size={16} />} label="Plano" onClick={() => onGoto("plano")} />
          <NavButton icon={<TrendingUp size={16} />} label="Nexus" onClick={() => onGoto("nexus")} />
          <NavButton icon={<FileText size={16} />} label="Informações" onClick={() => onGoto("info")} />
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, onClick }: any) {
  return (
    <Button onClick={onClick} className="inline-flex items-center gap-2" size="sm">
      {icon}{label}
    </Button>
  );
}

function ClientsPage({
  clients, query, onQuery, openFarm,
}: { clients: Client[]; query: string; onQuery: (q: string) => void; openFarm: (c: Client, farmId: string) => void; }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            value={query} 
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Buscar cliente ou fazenda..."
            className="pl-10"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        <Button>
          <Plus size={16} className="mr-2" /> 
          Novo cliente
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {clients.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="font-bold text-lg">#{c.id} {c.nome}</div>
              <div className="text-sm text-muted-foreground">{c.cidade}, {c.uf}</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {c.farms.map((f) => (
                  <Button 
                    key={f.id}
                    variant="outline"
                    onClick={() => openFarm(c, f.id)}
                    className="justify-start"
                  >
                    {f.nome}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="outline">
          CARREGAR MAIS
        </Button>
      </div>
    </div>
  );
}

function FarmHome({
  client, farm, open,
}: { client: Client; farm: Client["farms"][number]; open: (p: any) => void; }) {
  const cards = [
    { icon: <Beef size={32} />, title: "Rebanho", desc: "Fêmeas genotipadas, PTAs e filtros", page: "rebanho" },
    { icon: <Layers3 size={32} />, title: "Segmentação", desc: "Doadoras, Bom, Receptoras", page: "segmentacao" },
    { icon: <SearchIcon size={32} />, title: "Busca de touros", desc: "Banco de touros e índices", page: "touros" },
    { icon: <Calculator size={32} />, title: "Plano", desc: "Projeção genética e calculadora", page: "plano" },
    { icon: <LineIcon size={32} />, title: "Gráficos", desc: "Evolução e projeções", page: "graficos" },
    { icon: <TrendingUp size={32} />, title: "Nexus", desc: "Sistema de predição genética", page: "nexus" },
    { icon: <FileText size={32} />, title: "Informações", desc: "CDC B / instruções / avisos", page: "info" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold mb-2">#{client.id} {client.nome}</div>
      <div className="text-muted-foreground mb-6">{client.cidade}, {client.uf}</div>

      <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-4">
        {cards.map((c) => (
          <Card key={c.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => open(c.page)}>
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground mb-3">{c.icon}</div>
              <div className="font-bold mb-2">{c.title}</div>
              <div className="text-sm text-muted-foreground">{c.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HerdPage({ client, farm, onBack, onExport, onUpload }: any) {
  const [order, setOrder] = useState<keyof Female>("TPI");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const females = useMemo(() => {
    let rows = [...farm.females];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r: Female) =>
        r.brinco.includes(q) ||
        r.nomePai.toLowerCase().includes(q) ||
        r.naabPai.toLowerCase().includes(q)
      );
    }
    rows.sort((a: any, b: any) =>
      dir === "asc" ? (a[order] as number) - (b[order] as number) : (b[order] as number) - (a[order] as number)
    );
    return rows;
  }, [farm.females, order, dir, search]);

  const setSort = (k: keyof Female) => {
    if (order === k) setDir(dir === "asc" ? "desc" : "asc");
    else { setOrder(k); setDir("desc"); }
  };

  const th = (label: string, k: keyof Female) => (
    <th
      onClick={() => setSort(k)}
      className="px-3 py-2 cursor-pointer whitespace-nowrap bg-foreground text-background sticky top-0"
    >
      {label} {order === k ? (dir === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftRight className="mr-2" size={16}/> Voltar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload size={16} className="mr-2"/> Importar fêmeas (CSV)
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={onUpload} className="hidden" />
          </label>
          <Button onClick={onExport}>
            <Download size={16} className="mr-2"/> Exportar
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fêmeas por brinco, NAAB do pai ou nome do pai"
            className="pl-10"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
        </div>
        <Button 
          variant="outline"
          className="bg-accent text-accent-foreground"
          onClick={() => window.alert("Aba 'Gráficos' → Evolução do rebanho")}
        >
          Evolução
        </Button>
      </div>

      <Card>
        <div className="overflow-auto rounded-lg">
          <table className="min-w-[900px] w-full">
            <thead>
              <tr>
                {th("Brinco", "brinco")}
                {th("Nascimento", "nascimento")}
                {th("NAAB do Pai", "naabPai")}
                {th("Nome do Pai", "nomePai")}
                {th("TPI", "TPI")}
                {th("NM$", "NM$" as keyof Female)}
                {th("Leite (lbs)", "Milk")}
                {th("Gordura (lbs)", "Fat")}
                {th("Proteína (lbs)", "Protein")}
                {th("DPR", "DPR")}
                {th("CCS", "SCS")}
                {th("PTAT", "PTAT")}
              </tr>
            </thead>
            <tbody>
              {females.map((f: Female) => (
                <tr key={f.id} className="odd:bg-card even:bg-muted/50">
                  <td className="px-3 py-2">{f.brinco}</td>
                  <td className="px-3 py-2">{new Date(f.nascimento).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{f.naabPai}</td>
                  <td className="px-3 py-2">{f.nomePai}</td>
                  <td className="px-3 py-2 font-semibold">{f.TPI}</td>
                  <td className="px-3 py-2 font-semibold">{f["NM$"]}</td>
                  <td className="px-3 py-2">{f.Milk}</td>
                  <td className="px-3 py-2">{f.Fat}</td>
                  <td className="px-3 py-2">{f.Protein}</td>
                  <td className="px-3 py-2">{f.DPR}</td>
                  <td className="px-3 py-2">{f.SCS.toFixed(2)}</td>
                  <td className="px-3 py-2">{f.PTAT.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BullsPage({ bulls, weights, setWeights, selectedBulls, setSelectedBulls, onExport, onUpload, onBack }: any) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return bulls;
    return bulls.filter((b: Bull) =>
      b.nome.toLowerCase().includes(s) ||
      b.naab.toLowerCase().includes(s) ||
      b.pedigree.toLowerCase().includes(s)
    );
  }, [bulls, q]);

  const toggleSelect = (naab: string) => {
    setSelectedBulls((prev: string[]) =>
      prev.includes(naab) ? prev.filter((x) => x !== naab) : [...prev, naab]
    );
  };

  const WeightSlider = ({ k, label }: any) => (
    <div className="grid grid-cols-5 items-center gap-3">
      <span className="col-span-2 text-sm">{label}</span>
      <input 
        type="range" 
        min={0} 
        max={0.6} 
        step={0.01}
        value={weights[k]} 
        onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
        className="col-span-3" 
      />
    </div>
  );

  const totalWeight = Object.values(weights).reduce((a: number, b: number) => a + Number(b), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftRight className="mr-2" size={16}/> Voltar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload size={16} className="mr-2"/> Importar touros (CSV)
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={onUpload} className="hidden" />
          </label>
          <Button onClick={onExport}>
            <Download size={16} className="mr-2"/> Exportar
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Input 
                    value={q} 
                    onChange={(e) => setQ(e.target.value)} 
                    placeholder="Buscar touros por NAAB, nome, pedigree"
                    className="pl-10"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
                </div>
                <span className="text-xs text-muted-foreground">Selecionados: {selectedBulls.length}</span>
              </div>
              <div className="overflow-auto rounded-lg border">
                <table className="min-w-[900px] w-full">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 sticky top-0 bg-foreground text-background">✓</th>
                      {["NAAB","Nome","Pedigree","TPI","NM$","Milk","Fat","Protein","SCS","PTAT","Disponibilidade","Score"].map((h) => (
                        <th key={h} className="px-3 py-2 sticky top-0 bg-foreground text-background">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b: any) => (
                      <tr key={b.naab} className="odd:bg-card even:bg-muted/50">
                        <td className="px-3 py-2">
                          <input type="checkbox" checked={selectedBulls.includes(b.naab)} onChange={() => toggleSelect(b.naab)} />
                        </td>
                        <td className="px-3 py-2">{b.naab}</td>
                        <td className="px-3 py-2 font-medium">{b.nome}</td>
                        <td className="px-3 py-2 text-muted-foreground">{b.pedigree}</td>
                        <td className="px-3 py-2 font-semibold">{b.TPI}</td>
                        <td className="px-3 py-2 font-semibold">{b["NM$"]}</td>
                        <td className="px-3 py-2">{b.Milk}</td>
                        <td className="px-3 py-2">{b.Fat}</td>
                        <td className="px-3 py-2">{b.Protein}</td>
                        <td className="px-3 py-2">{b.SCS.toFixed(2)}</td>
                        <td className="px-3 py-2">{b.PTAT.toFixed(2)}</td>
                        <td className="px-3 py-2">{b.disponibilidade || "—"}</td>
                        <td className="px-3 py-2 font-bold">{(b._score as number)?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal size={18}/> Índice personalizado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <WeightSlider k="TPI" label="TPI" />
            <WeightSlider k="NM$" label="NM$" />
            <WeightSlider k="Milk" label="Leite (lbs)" />
            <WeightSlider k="Fat" label="Gordura (lbs)" />
            <WeightSlider k="Protein" label="Proteína (lbs)" />
            <WeightSlider k="PTAT" label="PTAT (Tipo)" />
            <WeightSlider k="SCS" label="CCS (penaliza)" />
            <div className="text-xs text-muted-foreground">
              Soma de pesos: <b>{Number(totalWeight).toFixed(2)}</b> (recomendado 1.00 ± 0.2)
            </div>
            <div className="text-sm text-muted-foreground">
              O score usa z-score por traço para evitar escalas diferentes e aplica penalização para SCS (menor é melhor).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChartsPage({ mothers, daughters, onBack }: any) {
  const avgTPI = mothers.reduce((a: number, b: any) => a + b.TPI, 0) / Math.max(mothers.length,1);
  const avgNM = mothers.reduce((a: number, b: any) => a + b.NM$, 0) / Math.max(mothers.length,1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftRight className="mr-2" size={16}/> Voltar
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>TPI — Evolução (Mães x Projeção de Filhas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={mothers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Legend />
                <ReferenceLine y={avgTPI} stroke="hsl(var(--primary))" strokeDasharray="6 6" label={`Média ${Math.round(avgTPI)}`} />
                <Line type="monotone" dataKey="TPI" name="Mães (média)" stroke="hsl(var(--foreground))" dot />
                <Line type="monotone" data={daughters} dataKey="TPI" name="Filhas (proj.)" stroke="hsl(var(--primary))" dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NM$ — Evolução (Mães x Projeção de Filhas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={mothers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Legend />
                <ReferenceLine y={avgNM} stroke="hsl(var(--primary))" strokeDasharray="6 6" label={`Média ${Math.round(avgNM)}`} />
                <Line type="monotone" dataKey="NM$" name="Mães (média)" stroke="hsl(var(--foreground))" dot />
                <Line type="monotone" data={daughters} dataKey="NM$" name="Filhas (proj.)" stroke="hsl(var(--primary))" dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Leite (lbs) — média anual</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mothers}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="year"/><YAxis/><Legend/>
                  <Bar dataKey="Milk" name="Mães" fill="hsl(var(--foreground))"/>
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gordura (lbs) — média anual</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mothers}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="year"/><YAxis/><Legend/>
                  <Bar dataKey="Fat" name="Mães" fill="hsl(var(--foreground))"/>
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proteína (lbs) — média anual</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mothers}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="year"/><YAxis/><Legend/>
                  <Bar dataKey="Protein" name="Mães" fill="hsl(var(--foreground))"/>
                </BarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function InfoPage({ onBack }: any) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeftRight className="mr-2" size={16}/> Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sobre o ToolSS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Este MVP demonstra a plataforma <b>ToolSS</b> (Select Sires) para visualização de dados genômicos de fêmeas
            (CDCB EUA), comparação de índices, projeções de filhas e acompanhamento da evolução do rebanho.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li><b>Rebanho:</b> base de fêmeas com PTAs principais (TPI, NM$, Leite, Gordura, Proteína, DPR, CCS/SCS, PTAT).</li>
            <li><b>Busca de touros:</b> ranking por índice personalizado (com z-score e penalização de SCS).</li>
            <li><b>Predição:</b> Parent Average simplificado para o MVP (mãe+touro)/2.</li>
            <li><b>Gráficos:</b> evolução anual do rebanho com comparação de <i>mães × filhas (projeção)</i>.</li>
            <li><b>Importação:</b> CSV de fêmeas e touros (headers PT/EN). Persistência automática em localStorage.</li>
            <li><b>Paleta Select Sires:</b> vermelho #ED1C24, preto #1C1C1C, cinza #D9D9D9, branco #F2F2F2.</li>
          </ul>
          <div className="text-xs text-muted-foreground">
            *Para uso real, substituir dados simulados por exportações CDCB. Ajustar fórmulas (Parent Average, MACE/PA, compatibilidade de base, regressões) conforme as melhores práticas.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}