import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeftRight, Download, PieChart as PieIcon, Settings, Filter, Layers3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Female = {
  id: string;
  brinco: string;
  nascimento: string;
  ordemParto?: number; // Ordem de parto
  categoria?: string; // Categoria do animal
  naabPai: string;
  nomePai: string;
  TPI: number;
  ["HHP$"]?: number;
  ["NM$"]?: number;
  ["CM$"]?: number;
  ["FM$"]?: number;
  ["GM$"]?: number;
  ["F SAV"]?: number;
  PTAM?: number;
  CFP?: number;
  PTAF?: number;
  ["PTAF%"]?: number;
  PTAP?: number;
  ["PTAP%"]?: number;
  PL?: number;
  DPR: number;
  LIV?: number;
  SCS: number;
  MAST?: number;
  MET?: number;
  RP?: number;
  DA?: number;
  KET?: number;
  MF?: number;
  PTAT: number;
  UDC?: number;
  FLC?: number;
  SCE?: number;
  DCE?: number;
  SSB?: number;
  DSB?: number;
  ["H LIV"]?: number;
  CCR?: number;
  HCR?: number;
  FI?: number;
  GL?: number;
  EFC?: number;
  BWC?: number;
  STA?: number;
  STR?: number;
  DFM?: number;
  RUA?: number;
  RLS?: number;
  RTP?: number;
  FTL?: number;
  RW?: number;
  RLR?: number;
  FTA?: number;
  FLS?: number;
  FUA?: number;
  RUH?: number;
  RUW?: number;
  UCL?: number;
  UDP?: number;
  FTP?: number;
  RFI?: number;
  NM?: number;
  Milk: number;
  Fat: number;
  Protein: number;
  year: number;
  _percentil?: number | null;
  _grupo?: "Doadoras" | "Inter" | "Receptoras";
  _motivo?: string;
};

type Weights = { 
  ["HHP$"]: number;
  TPI: number; 
  ["NM$"]: number; 
  ["CM$"]: number;
  ["FM$"]: number;
  ["GM$"]: number;
  ["F SAV"]: number;
  PTAM: number;
  CFP: number;
  PTAF: number;
  ["PTAF%"]: number;
  PTAP: number;
  ["PTAP%"]: number;
  PL: number;
  DPR: number;
  LIV: number;
  SCS: number;
  MAST: number;
  MET: number;
  RP: number;
  DA: number;
  KET: number;
  MF: number;
  PTAT: number;
  UDC: number;
  FLC: number;
  SCE: number;
  DCE: number;
  SSB: number;
  DSB: number;
  ["H LIV"]: number;
  CCR: number;
  HCR: number;
  FI: number;
  GL: number;
  EFC: number;
  BWC: number;
  STA: number;
  STR: number;
  DFM: number;
  RUA: number;
  RLS: number;
  RTP: number;
  FTL: number;
  RW: number;
  RLR: number;
  FTA: number;
  FLS: number;
  FUA: number;
  RUH: number;
  RUW: number;
  UCL: number;
  UDP: number;
  FTP: number;
  RFI: number;
  Milk: number; 
  Fat: number; 
  Protein: number; 
};

type PrimaryIndex = "HHP$" | "NM$" | "TPI" | "Custom";

type SegmentConfig = {
  primaryIndex: PrimaryIndex;
  donorCutoffPercent: number;
  goodCutoffUpper: number;
  scsMaxDonor: number;
  dprMinDonor: number;
  critical_dpr_lt: number;
  critical_scs_gt: number;
  gates: {
    ["HHP$"]: { enabled: boolean; min?: number; max?: number };
    TPI: { enabled: boolean; min?: number; max?: number };
    ["NM$"]: { enabled: boolean; min?: number; max?: number };
    ["CM$"]: { enabled: boolean; min?: number; max?: number };
    ["FM$"]: { enabled: boolean; min?: number; max?: number };
    ["GM$"]: { enabled: boolean; min?: number; max?: number };
    ["F SAV"]: { enabled: boolean; min?: number; max?: number };
    PTAM: { enabled: boolean; min?: number; max?: number };
    CFP: { enabled: boolean; min?: number; max?: number };
    PTAF: { enabled: boolean; min?: number; max?: number };
    ["PTAF%"]: { enabled: boolean; min?: number; max?: number };
    PTAP: { enabled: boolean; min?: number; max?: number };
    ["PTAP%"]: { enabled: boolean; min?: number; max?: number };
    PL: { enabled: boolean; min?: number; max?: number };
    DPR: { enabled: boolean; min?: number; max?: number };
    LIV: { enabled: boolean; min?: number; max?: number };
    SCS: { enabled: boolean; min?: number; max?: number };
    MAST: { enabled: boolean; min?: number; max?: number };
    MET: { enabled: boolean; min?: number; max?: number };
    RP: { enabled: boolean; min?: number; max?: number };
    DA: { enabled: boolean; min?: number; max?: number };
    KET: { enabled: boolean; min?: number; max?: number };
    MF: { enabled: boolean; min?: number; max?: number };
    PTAT: { enabled: boolean; min?: number; max?: number };
    UDC: { enabled: boolean; min?: number; max?: number };
    FLC: { enabled: boolean; min?: number; max?: number };
    SCE: { enabled: boolean; min?: number; max?: number };
    DCE: { enabled: boolean; min?: number; max?: number };
    SSB: { enabled: boolean; min?: number; max?: number };
    DSB: { enabled: boolean; min?: number; max?: number };
    ["H LIV"]: { enabled: boolean; min?: number; max?: number };
    CCR: { enabled: boolean; min?: number; max?: number };
    HCR: { enabled: boolean; min?: number; max?: number };
    FI: { enabled: boolean; min?: number; max?: number };
    GL: { enabled: boolean; min?: number; max?: number };
    EFC: { enabled: boolean; min?: number; max?: number };
    BWC: { enabled: boolean; min?: number; max?: number };
    STA: { enabled: boolean; min?: number; max?: number };
    STR: { enabled: boolean; min?: number; max?: number };
    DFM: { enabled: boolean; min?: number; max?: number };
    RUA: { enabled: boolean; min?: number; max?: number };
    RLS: { enabled: boolean; min?: number; max?: number };
    RTP: { enabled: boolean; min?: number; max?: number };
    FTL: { enabled: boolean; min?: number; max?: number };
    RW: { enabled: boolean; min?: number; max?: number };
    RLR: { enabled: boolean; min?: number; max?: number };
    FTA: { enabled: boolean; min?: number; max?: number };
    FLS: { enabled: boolean; min?: number; max?: number };
    FUA: { enabled: boolean; min?: number; max?: number };
    RUH: { enabled: boolean; min?: number; max?: number };
    RUW: { enabled: boolean; min?: number; max?: number };
    UCL: { enabled: boolean; min?: number; max?: number };
    UDP: { enabled: boolean; min?: number; max?: number };
    FTP: { enabled: boolean; min?: number; max?: number };
    RFI: { enabled: boolean; min?: number; max?: number };
    Milk: { enabled: boolean; min?: number; max?: number };
    Fat: { enabled: boolean; min?: number; max?: number };
    Protein: { enabled: boolean; min?: number; max?: number };
  };
};

// Utility function for automatic categorization
function categorizeAnimal(nascimento: string, ordemParto?: number): string {
  const birthDate = new Date(nascimento);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Se não tem ordem de parto definida, assumir 0
  const parity = ordemParto || 0;
  
  // Bezerra: do nascimento até 90 dias
  if (ageInDays <= 90) {
    return "Bezerra";
  }
  
  // Baseado na ordem de parto
  if (parity === 0) {
    return "Novilha"; // Após 90 dias e nunca pariu
  } else if (parity === 1) {
    return "Primípara"; // Pariu uma vez
  } else if (parity === 2) {
    return "Secundípara"; // Pariu duas vezes
  } else if (parity >= 3) {
    return "Multípara"; // Pariu 3 ou mais vezes
  }
  
  return "Novilha"; // Default
}

// Color scheme matching Select Sires branding
const COLORS = {
  Doadoras: "hsl(var(--primary))", // Red
  Inter: "hsl(var(--accent))", // Green  
  Receptoras: "hsl(var(--muted))", // Gray
};

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

// Segmentation functions
function normalize(value: number, mean: number, sd: number) {
  return (value - mean) / (sd || 1);
}

function scoreAnimal(
  a: { TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; },
  stats: any,
  w: Weights
) {
  const zTPI  = normalize(a.TPI,      stats.TPI?.mean,   stats.TPI?.sd);
  const zNM   = normalize(a["NM$"],   (stats["NM$"]?.mean ?? stats.NM?.mean), (stats["NM$"]?.sd ?? stats.NM?.sd));
  const zMilk = normalize(a.Milk,     stats.Milk?.mean,  stats.Milk?.sd);
  const zFat  = normalize(a.Fat,      stats.Fat?.mean,   stats.Fat?.sd);
  const zProt = normalize(a.Protein,  stats.Protein?.mean, stats.Protein?.sd);
  const zSCS  = normalize(a.SCS,      stats.SCS?.mean,   stats.SCS?.sd);
  const zPTAT = normalize(a.PTAT,     stats.PTAT?.mean,  stats.PTAT?.sd);

  return (
    w.TPI    * zTPI +
    w["NM$"] * zNM  +
    w.Milk   * zMilk +
    w.Fat    * zFat +
    w.Protein* zProt +
    w.PTAT   * zPTAT -
    w.SCS    * zSCS        // SCS penaliza
  );
}

function getPrimaryValue(
  f: Female,
  primary: PrimaryIndex,
  statsForCustom: any,
  weights: Weights,
  selectedTraits?: any
): number | null {
  // Leitores robustos para NM$/NM
  const nmCandidate =
    (f as any)["HHP$"] ??            // se já existir HHP$ de verdade
    (f as any)["NM$"]  ??            // padrão com $
    (f as any).NM       ?? null;     // fallback sem $

  if (primary === "TPI")  return isFinite(Number(f.TPI)) ? Number(f.TPI) : null;
  if (primary === "NM$" || primary === "HHP$") {
    return isFinite(Number(nmCandidate)) ? Number(nmCandidate) : null;
  }
  if (primary === "Custom") {
    try {
      // Se nenhum traço for marcado em Custom, usar todos os traços por padrão
      const hasAnySelected = selectedTraits ? Object.values(selectedTraits).some(Boolean) : false;
      const effectiveWeights = hasAnySelected ? weights : {
        ["HHP$"]: 0, TPI: 1, ["NM$"]: 1, ["CM$"]: 0, ["FM$"]: 0, ["GM$"]: 0, ["F SAV"]: 0, PTAM: 0, CFP: 0,
        PTAF: 0, ["PTAF%"]: 0, PTAP: 0, ["PTAP%"]: 0, PL: 0, DPR: 0, LIV: 0, SCS: 1, MAST: 0, MET: 0, RP: 0, DA: 0, KET: 0, MF: 0,
        PTAT: 1, UDC: 0, FLC: 0, SCE: 0, DCE: 0, SSB: 0, DSB: 0, ["H LIV"]: 0, CCR: 0, HCR: 0, FI: 0, GL: 0, EFC: 0, BWC: 0, STA: 0,
        STR: 0, DFM: 0, RUA: 0, RLS: 0, RTP: 0, FTL: 0, RW: 0, RLR: 0, FTA: 0, FLS: 0, FUA: 0, RUH: 0, RUW: 0, UCL: 0, UDP: 0, FTP: 0, RFI: 0,
        Milk: 1, Fat: 1, Protein: 1
      };
      
      const base = {
        TPI: f.TPI,
        ["NM$"]: Number(nmCandidate ?? 0),
        Milk: f.Milk, Fat: f.Fat, Protein: f.Protein, SCS: f.SCS, PTAT: f.PTAT,
      };
      return scoreAnimal(base, statsForCustom || {}, effectiveWeights);
    } catch {
      return null;
    }
  }
  return null;
}

function computePercentiles(values: Array<{ id: string; v: number }>): Map<string, number> {
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
  weights: Weights,
  selectedTraits?: any
): Female[] {
  // 1) Tenta com índice escolhido
  const base: Array<{ id: string; v: number }> = [];
  females.forEach((f) => {
    const v = getPrimaryValue(f, cfg.primaryIndex, statsForCustom, weights, selectedTraits);
    if (v !== null && !Number.isNaN(v)) base.push({ id: f.id, v: Number(v) });
  });

  // 2) Se ficou vazio (ex.: dataset sem NM$/NM e usuário marcou HHP$),
  //    faz fallback automático para TPI (evita todo mundo cair em Receptoras)
  let pct: Map<string, number>;
  if (base.length === 0) {
    const fallbackBase: Array<{ id: string; v: number }> = [];
    females.forEach((f) => {
      if (isFinite(Number(f.TPI))) fallbackBase.push({ id: f.id, v: Number(f.TPI) });
    });
    console.warn("⚠️ Índice primário sem valores válidos. Usando fallback TPI para segmentação.");
    pct = computePercentiles(fallbackBase);
  } else {
    pct = computePercentiles(base);
  }

  return females.map((f) => {
    const p = pct.get(f.id) ?? null;
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

const defaultSegConfig: SegmentConfig = {
  primaryIndex: "HHP$",
  donorCutoffPercent: 20,
  goodCutoffUpper: 70,
  scsMaxDonor: 2.9,
  dprMinDonor: 1.0,
  critical_dpr_lt: -1.0,
  critical_scs_gt: 3.0,
  gates: {
    ["HHP$"]: { enabled: false },
    TPI: { enabled: false },
    ["NM$"]: { enabled: false },
    ["CM$"]: { enabled: false },
    ["FM$"]: { enabled: false },
    ["GM$"]: { enabled: false },
    ["F SAV"]: { enabled: false },
    PTAM: { enabled: false },
    CFP: { enabled: false },
    PTAF: { enabled: false },
    ["PTAF%"]: { enabled: false },
    PTAP: { enabled: false },
    ["PTAP%"]: { enabled: false },
    PL: { enabled: false },
    DPR: { enabled: false },
    LIV: { enabled: false },
    SCS: { enabled: false },
    MAST: { enabled: false },
    MET: { enabled: false },
    RP: { enabled: false },
    DA: { enabled: false },
    KET: { enabled: false },
    MF: { enabled: false },
    PTAT: { enabled: false },
    UDC: { enabled: false },
    FLC: { enabled: false },
    SCE: { enabled: false },
    DCE: { enabled: false },
    SSB: { enabled: false },
    DSB: { enabled: false },
    ["H LIV"]: { enabled: false },
    CCR: { enabled: false },
    HCR: { enabled: false },
    FI: { enabled: false },
    GL: { enabled: false },
    EFC: { enabled: false },
    BWC: { enabled: false },
    STA: { enabled: false },
    STR: { enabled: false },
    DFM: { enabled: false },
    RUA: { enabled: false },
    RLS: { enabled: false },
    RTP: { enabled: false },
    FTL: { enabled: false },
    RW: { enabled: false },
    RLR: { enabled: false },
    FTA: { enabled: false },
    FLS: { enabled: false },
    FUA: { enabled: false },
    RUH: { enabled: false },
    RUW: { enabled: false },
    UCL: { enabled: false },
    UDP: { enabled: false },
    FTP: { enabled: false },
    RFI: { enabled: false },
    Milk: { enabled: false },
    Fat: { enabled: false },
    Protein: { enabled: false },
  },
};

interface SegmentationPageProps {
  farm: { id: string; nome: string; females: Female[]; bulls: any[]; };
  weights: { TPI: number; ["NM$"]: number; Milk: number; Fat: number; Protein: number; SCS: number; PTAT: number; };
  statsForCustom: any;
  onBack: () => void;
}

export default function SegmentationPage({ farm, weights, statsForCustom, onBack }: SegmentationPageProps) {
  const [config, setConfig] = useState<SegmentConfig>(defaultSegConfig);
  const [customWeights, setCustomWeights] = useState<Weights>({
    ["HHP$"]: 0,
    TPI: weights.TPI || 1,
    ["NM$"]: weights["NM$"] || 1,
    ["CM$"]: 0, ["FM$"]: 0, ["GM$"]: 0, ["F SAV"]: 0, PTAM: 0, CFP: 0,
    PTAF: 0, ["PTAF%"]: 0, PTAP: 0, ["PTAP%"]: 0, PL: 0, DPR: 0, LIV: 0,
    SCS: weights.SCS || 1, MAST: 0, MET: 0, RP: 0, DA: 0, KET: 0, MF: 0,
    PTAT: weights.PTAT || 1, UDC: 0, FLC: 0, SCE: 0, DCE: 0, SSB: 0, DSB: 0,
    ["H LIV"]: 0, CCR: 0, HCR: 0, FI: 0, GL: 0, EFC: 0, BWC: 0, STA: 0,
    STR: 0, DFM: 0, RUA: 0, RLS: 0, RTP: 0, FTL: 0, RW: 0, RLR: 0,
    FTA: 0, FLS: 0, FUA: 0, RUH: 0, RUW: 0, UCL: 0, UDP: 0, FTP: 0, RFI: 0,
    Milk: weights.Milk || 1, Fat: weights.Fat || 1, Protein: weights.Protein || 1
  });
  const [selectedTraits, setSelectedTraits] = useState({
    ["HHP$"]: true, TPI: true, ["NM$"]: true, ["CM$"]: false, ["FM$"]: false, ["GM$"]: false,
    ["F SAV"]: false, PTAM: false, CFP: false, PTAF: false, ["PTAF%"]: false, PTAP: false, ["PTAP%"]: false,
    PL: false, DPR: true, LIV: false, SCS: true, MAST: false, MET: false, RP: false, DA: false, KET: false,
    MF: false, PTAT: true, UDC: false, FLC: false, SCE: false, DCE: false, SSB: false, DSB: false,
    ["H LIV"]: false, CCR: false, HCR: false, FI: false, GL: false, EFC: false, BWC: false, STA: false,
    STR: false, DFM: false, RUA: false, RLS: false, RTP: false, FTL: false, RW: false, RLR: false,
    FTA: false, FLS: false, FUA: false, RUH: false, RUW: false, UCL: false, UDP: false, FTP: false,
    RFI: false, Milk: true, Fat: true, Protein: true
  });
  const [applyBump, setApplyBump] = useState(0);

  const segmentedFemales = useMemo(() => {
    console.log("🔍 Debugging segmentation:", {
      femalesCount: farm.females?.length || 0,
      config,
      weightsKeys: Object.keys(customWeights),
      statsKeys: Object.keys(statsForCustom || {})
    });
    
    if (!farm.females || farm.females.length === 0) {
      console.log("❌ No females data available");
      return [];
    }
    
    const result = segmentAnimals(farm.females, config, statsForCustom, customWeights, selectedTraits);
    console.log("📊 Segmentation result:", {
      totalAnimals: result.length,
      groups: result.reduce((acc, f) => {
        acc[f._grupo || 'undefined'] = (acc[f._grupo || 'undefined'] || 0) + 1;
        return acc;
      }, {} as any)
    });
    
    return result;
  }, [farm.females, config, statsForCustom, customWeights, selectedTraits, applyBump]);

  const groupStats = useMemo(() => {
    const stats = { Doadoras: 0, Inter: 0, Receptoras: 0 };
    segmentedFemales.forEach(f => {
      if (f._grupo) stats[f._grupo]++;
    });
    
    const total = segmentedFemales.length;
    return Object.entries(stats).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0
    }));
  }, [segmentedFemales]);

  const handleExport = () => {
    const exportData = segmentedFemales.map(f => ({
      brinco: f.brinco,
      TPI: f.TPI,
      "NM$": f["NM$"],
      Milk: f.Milk,
      Fat: f.Fat,
      Protein: f.Protein,
      DPR: f.DPR,
      SCS: f.SCS,
      PTAT: f.PTAT,
      percentil: f._percentil,
      grupo: f._grupo,
      motivo: f._motivo
    }));
    toCSV(exportData, `segmentacao_${farm.id}.csv`);
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => ({ ...prev, [trait]: !prev[trait as keyof typeof prev] }));
  };

  const selectAllTraits = () => {
    setSelectedTraits({
      ["HHP$"]: true, TPI: true, ["NM$"]: true, ["CM$"]: true, ["FM$"]: true, ["GM$"]: true,
      ["F SAV"]: true, PTAM: true, CFP: true, PTAF: true, ["PTAF%"]: true, PTAP: true, ["PTAP%"]: true,
      PL: true, DPR: true, LIV: true, SCS: true, MAST: true, MET: true, RP: true, DA: true, KET: true,
      MF: true, PTAT: true, UDC: true, FLC: true, SCE: true, DCE: true, SSB: true, DSB: true,
      ["H LIV"]: true, CCR: true, HCR: true, FI: true, GL: true, EFC: true, BWC: true, STA: true,
      STR: true, DFM: true, RUA: true, RLS: true, RTP: true, FTL: true, RW: true, RLR: true,
      FTA: true, FLS: true, FUA: true, RUH: true, RUW: true, UCL: true, UDP: true, FTP: true,
      RFI: true, Milk: true, Fat: true, Protein: true
    });
  };

  const deselectAllTraits = () => {
    setSelectedTraits({
      ["HHP$"]: false, TPI: false, ["NM$"]: false, ["CM$"]: false, ["FM$"]: false, ["GM$"]: false,
      ["F SAV"]: false, PTAM: false, CFP: false, PTAF: false, ["PTAF%"]: false, PTAP: false, ["PTAP%"]: false,
      PL: false, DPR: false, LIV: false, SCS: false, MAST: false, MET: false, RP: false, DA: false, KET: false,
      MF: false, PTAT: false, UDC: false, FLC: false, SCE: false, DCE: false, SSB: false, DSB: false,
      ["H LIV"]: false, CCR: false, HCR: false, FI: false, GL: false, EFC: false, BWC: false, STA: false,
      STR: false, DFM: false, RUA: false, RLS: false, RTP: false, FTL: false, RW: false, RLR: false,
      FTA: false, FLS: false, FUA: false, RUH: false, RUW: false, UCL: false, UDP: false, FTP: false,
      RFI: false, Milk: false, Fat: false, Protein: false
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" /> Exportar Segmentação
          </Button>
        </div>
      </div>

      {/* Processo para o Técnico */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" />
            Processo para o Técnico - Checklist Pré-Segmentação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Validação dos Dados</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Verificar se dados PTA estão atualizados</li>
                <li>• Confirmar presença de HHP$/NM$ nas fêmeas</li>
                <li>• Validar campos DPR e SCS preenchidos</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Configuração</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Definir % de doadoras conforme objetivo</li>
                <li>• Ajustar gates sanitários (SCS ≤ 2.9)</li>
                <li>• Verificar cortes percentuais</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5" />
            Segmentação por literatura (Doadoras / Inter / Receptoras)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Índice Base */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Índice base</h3>
              <div className="space-y-3">
                {[
                  { value: "HHP$", label: "HHP$", disabled: false },
                  { value: "NM$", label: "NM$" }, 
                  { value: "TPI", label: "TPI" },
                  { value: "Custom", label: "Custom" }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={option.value}
                      name="primaryIndex"
                      value={option.value}
                      checked={config.primaryIndex === option.value}
                      disabled={option.disabled}
                      onChange={(e) => setConfig({...config, primaryIndex: e.target.value as PrimaryIndex})}
                      className="w-4 h-4"
                    />
                    <Label 
                      htmlFor={option.value} 
                      className={`${option.disabled ? 'text-muted-foreground' : ''} ${option.value === 'Custom' ? 'text-primary font-semibold' : ''}`}
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-blue-600 mt-2">
                Recomendado: HHP$ (Health & Productivity Profit) - índice holístico.
              </div>
            </div>

            {/* Cortes Percentuais */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Cortes percentuais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-blue-600">Top % (Doadoras)</Label>
                  <Input
                    type="number"
                    value={config.donorCutoffPercent}
                    onChange={(e) => setConfig({...config, donorCutoffPercent: Number(e.target.value)})}
                    min="1" max="100"
                  />
                </div>
                <div>
                  <Label className="text-blue-600">Bottom % (Receptoras)</Label>
                  <Input
                    type="number"
                    value={100 - config.goodCutoffUpper}
                    onChange={(e) => setConfig({...config, goodCutoffUpper: 100 - Number(e.target.value)})}
                    min="1" max="100"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Padrão: {config.donorCutoffPercent}% doadoras / {100 - config.goodCutoffUpper}% receptoras (restante = Inter).
              </div>
            </div>

            {/* Gates Sanitários */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Gates sanitários e tipo</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfig({
                        ...config,
                        scsMaxDonor: 2.9,
                        dprMinDonor: 1.0,
                        critical_dpr_lt: -1.0,
                        critical_scs_gt: 3.0,
                      });
                    }}
                    className="text-xs"
                  >
                    Aplicar Valores Referência
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-blue-600">SCS máx.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.scsMaxDonor}
                    onChange={(e) => setConfig({...config, scsMaxDonor: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label className="text-blue-600">DPR mín.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.dprMinDonor}
                    onChange={(e) => setConfig({...config, dprMinDonor: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label className="text-blue-600">PTAT mín.</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={0}
                    disabled
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Valores padrão alinhados à boa saúde do úbere (SCS≤3,0) e fertilidade não negativa (DPR≥0).
              </div>
            </div>
          </div>

          {/* Grid inferior com 2 colunas */}
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {/* Selecionar PTAs - Desabilitado quando não é Custom */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Selecionar PTAs (grupo)</h3>
                {config.primaryIndex === "Custom" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllTraits}
                      className="text-xs"
                    >
                      Selecionar Todas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllTraits}
                      className="text-xs"
                    >
                      Desmarcar Todas
                    </Button>
                  </div>
                )}
              </div>
              {config.primaryIndex !== "Custom" && (
                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  Para editar pesos/traços, selecione Custom.
                </div>
              )}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { key: 'HHP$', label: 'HHP$®', color: 'text-primary' },
                  { key: 'TPI', label: 'TPI', color: 'text-primary' },
                  { key: 'NM$', label: 'NM$', color: 'text-primary' },
                  { key: 'CM$', label: 'CM$', color: 'text-blue-600' },
                  { key: 'FM$', label: 'FM$', color: 'text-blue-600' },
                  { key: 'GM$', label: 'GM$', color: 'text-blue-600' },
                  { key: 'F SAV', label: 'F SAV', color: 'text-green-600' },
                  { key: 'PTAM', label: 'PTAM', color: 'text-black' },
                  { key: 'CFP', label: 'CFP', color: 'text-purple-600' },
                  { key: 'PTAF', label: 'PTAF', color: 'text-purple-600' },
                  { key: 'PTAF%', label: 'PTAF%', color: 'text-purple-600' },
                  { key: 'PTAP', label: 'PTAP', color: 'text-purple-600' },
                  { key: 'PTAP%', label: 'PTAP%', color: 'text-purple-600' },
                  { key: 'PL', label: 'PL', color: 'text-green-600' },
                  { key: 'DPR', label: 'DPR', color: 'text-purple-600' },
                  { key: 'LIV', label: 'LIV', color: 'text-green-600' },
                  { key: 'SCS', label: 'SCS', color: 'text-red-600' },
                  { key: 'MAST', label: 'MAST', color: 'text-red-600' },
                  { key: 'MET', label: 'MET', color: 'text-orange-600' },
                  { key: 'RP', label: 'RP', color: 'text-purple-600' },
                  { key: 'DA', label: 'DA', color: 'text-orange-600' },
                  { key: 'KET', label: 'KET', color: 'text-orange-600' },
                  { key: 'MF', label: 'MF', color: 'text-orange-600' },
                  { key: 'PTAT', label: 'PTAT', color: 'text-purple-600' },
                  { key: 'UDC', label: 'UDC', color: 'text-purple-600' },
                  { key: 'FLC', label: 'FLC', color: 'text-purple-600' },
                  { key: 'SCE', label: 'SCE', color: 'text-orange-600' },
                  { key: 'DCE', label: 'DCE', color: 'text-orange-600' },
                  { key: 'SSB', label: 'SSB', color: 'text-orange-600' },
                  { key: 'DSB', label: 'DSB', color: 'text-orange-600' },
                  { key: 'H LIV', label: 'H LIV', color: 'text-green-600' },
                  { key: 'CCR', label: 'CCR', color: 'text-orange-600' },
                  { key: 'HCR', label: 'HCR', color: 'text-orange-600' },
                  { key: 'FI', label: 'FI', color: 'text-gray-600' },
                  { key: 'GL', label: 'GL', color: 'text-gray-600' },
                  { key: 'EFC', label: 'EFC', color: 'text-blue-600' },
                  { key: 'BWC', label: 'BWC', color: 'text-orange-600' },
                  { key: 'STA', label: 'STA', color: 'text-purple-600' },
                  { key: 'STR', label: 'STR', color: 'text-purple-600' },
                  { key: 'DFM', label: 'DFM', color: 'text-purple-600' },
                  { key: 'RUA', label: 'RUA', color: 'text-purple-600' },
                  { key: 'RLS', label: 'RLS', color: 'text-purple-600' },
                  { key: 'RTP', label: 'RTP', color: 'text-purple-600' },
                  { key: 'FTL', label: 'FTL', color: 'text-purple-600' },
                  { key: 'RW', label: 'RW', color: 'text-purple-600' },
                  { key: 'RLR', label: 'RLR', color: 'text-purple-600' },
                  { key: 'FTA', label: 'FTA', color: 'text-purple-600' },
                  { key: 'FLS', label: 'FLS', color: 'text-purple-600' },
                  { key: 'FUA', label: 'FUA', color: 'text-purple-600' },
                  { key: 'RUH', label: 'RUH', color: 'text-purple-600' },
                  { key: 'RUW', label: 'RUW', color: 'text-purple-600' },
                  { key: 'UCL', label: 'UCL', color: 'text-purple-600' },
                  { key: 'UDP', label: 'UDP', color: 'text-purple-600' },
                  { key: 'FTP', label: 'FTP', color: 'text-purple-600' },
                  { key: 'RFI', label: 'RFI', color: 'text-blue-600' },
                  { key: 'Milk', label: 'Milk', color: 'text-black' },
                  { key: 'Fat', label: 'Fat', color: 'text-purple-600' },
                  { key: 'Protein', label: 'Protein', color: 'text-purple-600' }
                ].map((trait) => (
                  <div key={trait.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={trait.key}
                      checked={selectedTraits[trait.key as keyof typeof selectedTraits]}
                      onChange={() => toggleTrait(trait.key)}
                      disabled={config.primaryIndex !== "Custom"}
                      className="w-4 h-4"
                    />
                    <Label 
                      htmlFor={trait.key} 
                      className={`text-xs ${trait.color} ${config.primaryIndex !== "Custom" ? 'text-muted-foreground' : ''}`}
                    >
                      {trait.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-gray-600 mt-2">
                Se nenhum traço for marcado em Custom, usar todos os traços por padrão.
              </div>
            </div>

            {/* Pesos do Índice - Visível quando Custom é selecionado */}
            {config.primaryIndex === "Custom" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pesos do índice customizado</h3>
                <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {[
                    { key: 'HHP$', label: 'HHP$®' },
                    { key: 'TPI', label: 'TPI' },
                    { key: 'NM$', label: 'NM$' },
                    { key: 'CM$', label: 'CM$' },
                    { key: 'FM$', label: 'FM$' },
                    { key: 'GM$', label: 'GM$' },
                    { key: 'F SAV', label: 'F SAV' },
                    { key: 'PTAM', label: 'PTAM' },
                    { key: 'CFP', label: 'CFP' },
                    { key: 'PTAF', label: 'PTAF' },
                    { key: 'PTAF%', label: 'PTAF%' },
                    { key: 'PTAP', label: 'PTAP' },
                    { key: 'PTAP%', label: 'PTAP%' },
                    { key: 'PL', label: 'PL' },
                    { key: 'DPR', label: 'DPR' },
                    { key: 'LIV', label: 'LIV' },
                    { key: 'SCS', label: 'SCS' },
                    { key: 'MAST', label: 'MAST' },
                    { key: 'MET', label: 'MET' },
                    { key: 'RP', label: 'RP' },
                    { key: 'DA', label: 'DA' },
                    { key: 'KET', label: 'KET' },
                    { key: 'MF', label: 'MF' },
                    { key: 'PTAT', label: 'PTAT' },
                    { key: 'UDC', label: 'UDC' },
                    { key: 'FLC', label: 'FLC' },
                    { key: 'SCE', label: 'SCE' },
                    { key: 'DCE', label: 'DCE' },
                    { key: 'SSB', label: 'SSB' },
                    { key: 'DSB', label: 'DSB' },
                    { key: 'H LIV', label: 'H LIV' },
                    { key: 'CCR', label: 'CCR' },
                    { key: 'HCR', label: 'HCR' },
                    { key: 'FI', label: 'FI' },
                    { key: 'GL', label: 'GL' },
                    { key: 'EFC', label: 'EFC' },
                    { key: 'BWC', label: 'BWC' },
                    { key: 'STA', label: 'STA' },
                    { key: 'STR', label: 'STR' },
                    { key: 'DFM', label: 'DFM' },
                    { key: 'RUA', label: 'RUA' },
                    { key: 'RLS', label: 'RLS' },
                    { key: 'RTP', label: 'RTP' },
                    { key: 'FTL', label: 'FTL' },
                    { key: 'RW', label: 'RW' },
                    { key: 'RLR', label: 'RLR' },
                    { key: 'FTA', label: 'FTA' },
                    { key: 'FLS', label: 'FLS' },
                    { key: 'FUA', label: 'FUA' },
                    { key: 'RUH', label: 'RUH' },
                    { key: 'RUW', label: 'RUW' },
                    { key: 'UCL', label: 'UCL' },
                    { key: 'UDP', label: 'UDP' },
                    { key: 'FTP', label: 'FTP' },
                    { key: 'RFI', label: 'RFI' },
                    { key: 'Milk', label: 'Milk' },
                    { key: 'Fat', label: 'Fat' },
                    { key: 'Protein', label: 'Protein' },
                  ].filter(weight => selectedTraits[weight.key as keyof typeof selectedTraits]).map((weight) => (
                    <div key={weight.key} className="flex items-center justify-between gap-2">
                      <Label className="text-xs">{weight.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customWeights[weight.key as keyof Weights] || 0}
                        onChange={(e) => {
                          setCustomWeights(prev => ({...prev, [weight.key]: Number(e.target.value)}));
                        }}
                        className="w-20 h-8"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  SCS é penalizado automaticamente (sinal invertido).
                </div>
              </div>
            )}
          </div>

          {/* Botão de aplicar */}
          <div className="flex justify-center mt-8">
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setApplyBump((v) => v + 1)}
            >
              Aplicar segmentação
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos e Tabela */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5" />
              Distribuição da Segmentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={groupStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {groupStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
          </div>

          {/* Gates Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Gates - Valores de Corte</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newConfig = { ...config };
                    Object.keys(newConfig.gates).forEach(key => {
                      newConfig.gates[key as keyof typeof newConfig.gates].enabled = true;
                    });
                    setConfig(newConfig);
                  }}
                  className="text-xs"
                >
                  Ativar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newConfig = { ...config };
                    Object.keys(newConfig.gates).forEach(key => {
                      newConfig.gates[key as keyof typeof newConfig.gates].enabled = false;
                    });
                    setConfig(newConfig);
                  }}
                  className="text-xs"
                >
                  Desativar Todos
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {[
                { key: 'HHP$', label: 'HHP$®' },
                { key: 'TPI', label: 'TPI' },
                { key: 'NM$', label: 'NM$' },
                { key: 'CM$', label: 'CM$' },
                { key: 'FM$', label: 'FM$' },
                { key: 'GM$', label: 'GM$' },
                { key: 'F SAV', label: 'F SAV' },
                { key: 'PTAM', label: 'PTAM' },
                { key: 'CFP', label: 'CFP' },
                { key: 'PTAF', label: 'PTAF' },
                { key: 'PTAF%', label: 'PTAF%' },
                { key: 'PTAP', label: 'PTAP' },
                { key: 'PTAP%', label: 'PTAP%' },
                { key: 'PL', label: 'PL' },
                { key: 'DPR', label: 'DPR' },
                { key: 'LIV', label: 'LIV' },
                { key: 'SCS', label: 'SCS' },
                { key: 'MAST', label: 'MAST' },
                { key: 'MET', label: 'MET' },
                { key: 'RP', label: 'RP' },
                { key: 'DA', label: 'DA' },
                { key: 'KET', label: 'KET' },
                { key: 'MF', label: 'MF' },
                { key: 'PTAT', label: 'PTAT' },
                { key: 'UDC', label: 'UDC' },
                { key: 'FLC', label: 'FLC' },
                { key: 'SCE', label: 'SCE' },
                { key: 'DCE', label: 'DCE' },
                { key: 'SSB', label: 'SSB' },
                { key: 'DSB', label: 'DSB' },
                { key: 'H LIV', label: 'H LIV' },
                { key: 'CCR', label: 'CCR' },
                { key: 'HCR', label: 'HCR' },
                { key: 'FI', label: 'FI' },
                { key: 'GL', label: 'GL' },
                { key: 'EFC', label: 'EFC' },
                { key: 'BWC', label: 'BWC' },
                { key: 'STA', label: 'STA' },
                { key: 'STR', label: 'STR' },
                { key: 'DFM', label: 'DFM' },
                { key: 'RUA', label: 'RUA' },
                { key: 'RLS', label: 'RLS' },
                { key: 'RTP', label: 'RTP' },
                { key: 'FTL', label: 'FTL' },
                { key: 'RW', label: 'RW' },
                { key: 'RLR', label: 'RLR' },
                { key: 'FTA', label: 'FTA' },
                { key: 'FLS', label: 'FLS' },
                { key: 'FUA', label: 'FUA' },
                { key: 'RUH', label: 'RUH' },
                { key: 'RUW', label: 'RUW' },
                { key: 'UCL', label: 'UCL' },
                { key: 'UDP', label: 'UDP' },
                { key: 'FTP', label: 'FTP' },
                { key: 'RFI', label: 'RFI' },
                { key: 'Milk', label: 'Milk' },
                { key: 'Fat', label: 'Fat' },
                { key: 'Protein', label: 'Protein' },
              ].map((gate) => (
                <div key={gate.key} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`gate-${gate.key}`}
                      checked={config.gates[gate.key as keyof typeof config.gates]?.enabled || false}
                      onChange={(e) => {
                        const newConfig = { ...config };
                        newConfig.gates[gate.key as keyof typeof newConfig.gates].enabled = e.target.checked;
                        setConfig(newConfig);
                      }}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`gate-${gate.key}`} className="text-sm font-medium">
                      {gate.label}
                    </Label>
                  </div>
                  
                  {config.gates[gate.key as keyof typeof config.gates]?.enabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Mín</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Min"
                          value={config.gates[gate.key as keyof typeof config.gates]?.min || ''}
                          onChange={(e) => {
                            const newConfig = { ...config };
                            newConfig.gates[gate.key as keyof typeof newConfig.gates].min = e.target.value ? Number(e.target.value) : undefined;
                            setConfig(newConfig);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Máx</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Max"
                          value={config.gates[gate.key as keyof typeof config.gates]?.max || ''}
                          onChange={(e) => {
                            const newConfig = { ...config };
                            newConfig.gates[gate.key as keyof typeof newConfig.gates].max = e.target.value ? Number(e.target.value) : undefined;
                            setConfig(newConfig);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-600 mt-2">
              Configure valores mínimos e/ou máximos para cada PTA. Animais fora dos limites serão automaticamente classificados como Receptoras.
            </div>
          </div>
            
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Recomendações:</strong>
              </div>
              <div className="text-sm space-y-1">
                <div>• Doadoras: Animais de elite para transferência de embriões</div>
                <div>• Inter: Animais para reprodução natural premium</div>
                <div>• Receptoras: Animais adequados para receber embriões</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparação por Grupos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={groupStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Animais Segmentados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">Grupo</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Brinco</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Nascimento</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Ordem de Parto</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Categoria</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">NAAB Pai</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Nome Pai</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">{config.primaryIndex}</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">TPI</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">NM$</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Milk</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Fat</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Protein</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">DPR</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">SCS</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">PTAT</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Percentil</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {segmentedFemales
                  .sort((a, b) => {
                    // Ordenar por grupo: Doadoras primeiro, depois Inter, depois Receptoras
                    const groupOrder = { "Doadoras": 1, "Inter": 2, "Receptoras": 3 };
                    const aOrder = groupOrder[a._grupo as keyof typeof groupOrder] || 4;
                    const bOrder = groupOrder[b._grupo as keyof typeof groupOrder] || 4;
                    if (aOrder !== bOrder) return aOrder - bOrder;
                    // Dentro do mesmo grupo, ordenar por TPI descrescente
                    return b.TPI - a.TPI;
                  })
                  .map((f, index) => {
                    // Contar quantas doadoras já apareceram antes desta linha
                    const doadorasCount = segmentedFemales
                      .sort((a, b) => {
                        const groupOrder = { "Doadoras": 1, "Inter": 2, "Receptoras": 3 };
                        const aOrder = groupOrder[a._grupo as keyof typeof groupOrder] || 4;
                        const bOrder = groupOrder[b._grupo as keyof typeof groupOrder] || 4;
                        if (aOrder !== bOrder) return aOrder - bOrder;
                        return b.TPI - a.TPI;
                      })
                      .slice(0, index + 1)
                      .filter(animal => animal._grupo === "Doadoras")
                      .length;

                    const segmentLabel = f._grupo === "Doadoras" ? `D${doadorasCount}` : f._grupo;

                    return (
                      <tr key={f.id} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            f._grupo === "Doadoras" ? "bg-accent text-accent-foreground" :
                            f._grupo === "Inter" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {segmentLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium">{f.brinco}</td>
                        <td className="px-3 py-2">{new Date(f.nascimento).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{f.ordemParto || "-"}</td>
                        <td className="px-3 py-2">{f.categoria || categorizeAnimal(f.nascimento, f.ordemParto)}</td>
                        <td className="px-3 py-2">{f.naabPai}</td>
                        <td className="px-3 py-2 text-red-600 font-medium">{f.nomePai}</td>
                        <td className="px-3 py-2">
                          {(() => {
                            const primary = config.primaryIndex;
                            const nmCandidate = (f as any)["HHP$"] ?? (f as any)["NM$"] ?? (f as any).NM ?? null;
                            if (primary === "TPI")  return isFinite(Number(f.TPI)) ? Number(f.TPI).toFixed(0) : "—";
                            if (primary === "NM$" || primary === "HHP$")
                              return isFinite(Number(nmCandidate)) ? Number(nmCandidate).toFixed(0) : "—";
                            if (primary === "Custom") {
                              const val = getPrimaryValue(f, "Custom", statsForCustom, customWeights, selectedTraits);
                              return val !== null && isFinite(Number(val)) ? Number(val).toFixed(2) : "—";
                            }
                            return "—";
                          })()}
                        </td>
                        <td className="px-3 py-2 font-semibold">{f.TPI}</td>
                        <td className="px-3 py-2 font-semibold">{f["NM$"]}</td>
                        <td className="px-3 py-2">{f.Milk}</td>
                        <td className="px-3 py-2">{f.Fat}</td>
                        <td className="px-3 py-2">{f.Protein}</td>
                        <td className="px-3 py-2">{f.DPR?.toFixed(1)}</td>
                        <td className="px-3 py-2">{f.SCS?.toFixed(2)}</td>
                        <td className="px-3 py-2">{f.PTAT?.toFixed(2)}</td>
                        <td className="px-3 py-2">{f._percentil}%</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{f._motivo}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}