import React, { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeftRight, Download, PieChart as PieIcon, Settings, Filter, Layers3, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Farm {
  id: string;
  farm_id: string;
  name: string;
  owner_name: string;
}

type Female = {
  id: string;
  name: string;
  identifier?: string;
  birth_date?: string;
  sire_naab?: string;
  hhp_dollar?: number;
  nm_dollar?: number;
  tpi?: number;
  cm_dollar?: number;
  fm_dollar?: number;
  gm_dollar?: number;
  f_sav?: number;
  ptam?: number;
  cfp?: number;
  ptaf?: number;
  ptaf_pct?: number;
  ptap?: number;
  ptap_pct?: number;
  pl?: number;
  dpr?: number;
  liv?: number;
  scs?: number;
  mast?: number;
  met?: number;
  rp?: number;
  da?: number;
  ket?: number;
  mf?: number;
  ptat?: number;
  udc?: number;
  flc?: number;
  sce?: number;
  dce?: number;
  ssb?: number;
  dsb?: number;
  h_liv?: number;
  ccr?: number;
  hcr?: number;
  fi?: number;
  gl?: number;
  efc?: number;
  bwc?: number;
  sta?: number;
  str?: number;
  dfm?: number;
  rua?: number;
  rls?: number;
  rtp?: number;
  ftl?: number;
  rw?: number;
  rlr?: number;
  fta?: number;
  fls?: number;
  fua?: number;
  ruh?: number;
  ruw?: number;
  ucl?: number;
  udp?: number;
  ftp?: number;
  rfi?: number;
  gfi?: number;
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
  a: { tpi: number; nm_dollar: number; scs: number; ptat: number; },
  stats: any,
  w: Weights
) {
  const zTPI  = normalize(a.tpi,      stats.tpi?.mean,   stats.tpi?.sd);
  const zNM   = normalize(a.nm_dollar,   stats.nm_dollar?.mean, stats.nm_dollar?.sd);
  const zSCS  = normalize(a.scs,      stats.scs?.mean,   stats.scs?.sd);
  const zPTAT = normalize(a.ptat,     stats.ptat?.mean,  stats.ptat?.sd);

  return (
    w.TPI    * zTPI +
    w["NM$"] * zNM  +
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
  const nmCandidate = f.hhp_dollar ?? f.nm_dollar ?? null;

  if (primary === "TPI")  return isFinite(Number(f.tpi)) ? Number(f.tpi) : null;
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
        tpi: f.tpi || 0,
        nm_dollar: Number(nmCandidate ?? 0),
        scs: f.scs || 0, 
        ptat: f.ptat || 0,
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
      if (isFinite(Number(f.tpi))) fallbackBase.push({ id: f.id, v: Number(f.tpi) });
    });
    console.warn("⚠️ Índice primário sem valores válidos. Usando fallback TPI para segmentação.");
    pct = computePercentiles(fallbackBase);
  } else {
    pct = computePercentiles(base);
  }

  return females.map((f) => {
    const p = pct.get(f.id) ?? null;
    const crit = (f.dpr ?? 0) < cfg.critical_dpr_lt || (f.scs ?? 0) > cfg.critical_scs_gt;
    if (crit) {
      return { ...f, _percentil: p, _grupo: "Receptoras", _motivo: "Crítico: DPR/SCS" };
    }

    if (p !== null && p <= cfg.donorCutoffPercent) {
      const okSCS = (f.scs ?? 99) <= cfg.scsMaxDonor;
      const okDPR = (f.dpr ?? -99) >= cfg.dprMinDonor;
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
  farm: Farm;
  onBack: () => void;
}

export default function SegmentationPage({ farm, onBack }: SegmentationPageProps) {
  const [females, setFemales] = useState<Female[]>([]);
  const [loading, setLoading] = useState(true);

  // Load females from database
  const loadFemales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('females_denorm')
        .select('*')
        .eq('farm_id', farm.farm_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading females:', error);
        return;
      }

      setFemales(data || []);
    } catch (error) {
      console.error('Error loading females:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farm.farm_id) {
      loadFemales();
    }
  }, [farm.farm_id]);

  const [config, setConfig] = useState<SegmentConfig>(defaultSegConfig);
  const [customWeights, setCustomWeights] = useState<Weights>({
    ["HHP$"]: 0,
    TPI: 1,
    ["NM$"]: 1,
    ["CM$"]: 0, ["FM$"]: 0, ["GM$"]: 0, ["F SAV"]: 0, PTAM: 0, CFP: 0,
    PTAF: 0, ["PTAF%"]: 0, PTAP: 0, ["PTAP%"]: 0, PL: 0, DPR: 0, LIV: 0,
    SCS: 1, MAST: 0, MET: 0, RP: 0, DA: 0, KET: 0, MF: 0,
    PTAT: 1, UDC: 0, FLC: 0, SCE: 0, DCE: 0, SSB: 0, DSB: 0,
    ["H LIV"]: 0, CCR: 0, HCR: 0, FI: 0, GL: 0, EFC: 0, BWC: 0, STA: 0,
    STR: 0, DFM: 0, RUA: 0, RLS: 0, RTP: 0, FTL: 0, RW: 0, RLR: 0,
    FTA: 0, FLS: 0, FUA: 0, RUH: 0, RUW: 0, UCL: 0, UDP: 0, FTP: 0, RFI: 0,
    Milk: 1, Fat: 1, Protein: 1
  });
  const [selectedTraits, setSelectedTraits] = useState({
    ["HHP$"]: true, TPI: true, ["NM$"]: true, ["CM$"]: false, ["FM$"]: false, ["GM$"]: false,
    ["F SAV"]: false, PTAM: false, CFP: false, PTAF: false, ["PTAF%"]: false, PTAP: false, ["PTAP%"]: false,
    PL: false, DPR: true, LIV: false, SCS: true, MAST: false, MET: false, RP: false, DA: false, KET: false,
    MF: false, PTAT: true, UDC: false, FLC: false, SCE: false, DCE: false, SSB: false, DSB: false,
    ["H LIV"]: false, CCR: false, HCR: false, FI: false, GL: false, EFC: false, BWC: false, STA: false,
    STR: false, DFM: false, RUA: false, RLS: false, RTP: false, FTL: false, RW: false, RLR: false,
    FTA: false, FLS: false, FUA: false, RUH: false, RUW: false, UCL: false, UDP: false, FTP: false,
    RFI: false, Milk: false, Fat: false, Protein: false
  });

  // Calculate statistics for custom scoring
  const statsForCustom = useMemo(() => {
    if (!females.length) return {};
    
    const stats: any = {};
    const keys = ['tpi', 'nm_dollar', 'scs', 'ptat'];
    
    keys.forEach(key => {
      const values = females.map(f => (f as any)[key]).filter(v => v != null && !isNaN(v));
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const sd = Math.sqrt(variance);
        stats[key] = { mean, sd };
      }
    });
    
    return stats;
  }, [females]);

  // Processo de segmentação baseado no rebanho
  const segmentedAnimals = useMemo(() => {
    if (!females.length) return [];
    
    return segmentAnimals(
      females,
      config,
      statsForCustom,
      customWeights,
      selectedTraits
    );
  }, [females, config, statsForCustom, customWeights, selectedTraits]);

  const counts = useMemo(() => {
    const cats = { Doadoras: 0, Inter: 0, Receptoras: 0 };
    segmentedAnimals.forEach((f) => cats[f._grupo!]++);
    return cats;
  }, [segmentedAnimals]);

  // Função para determinação automatica de categoria com base na idade e parto
  const handleAutoCategory = () => {
    // Essa função pode ser implementada se necessário
  };

  const handleExport = () => {
    toCSV(segmentedAnimals, `segmentacao-${farm.name}.csv`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Segmentação - {farm.name}</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-lg">Carregando dados...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers3 className="w-7 h-7" />
            Segmentação - {farm.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentedAnimals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Doadoras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {counts.Doadoras} ({segmentedAnimals.length > 0 ? ((counts.Doadoras / segmentedAnimals.length) * 100).toFixed(1) : '0'}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Inter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {counts.Inter} ({segmentedAnimals.length > 0 ? ((counts.Inter / segmentedAnimals.length) * 100).toFixed(1) : '0'}%)
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receptoras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {counts.Receptoras} ({segmentedAnimals.length > 0 ? ((counts.Receptoras / segmentedAnimals.length) * 100).toFixed(1) : '0'}%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração da Segmentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Index Selection */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Índice Primário</Label>
              <Select
                value={config.primaryIndex}
                onValueChange={(value: PrimaryIndex) =>
                  setConfig({ ...config, primaryIndex: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HHP$">HHP$</SelectItem>
                  <SelectItem value="NM$">NM$ / TLV</SelectItem>
                  <SelectItem value="TPI">TPI</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Corte Doadoras (%)</Label>
              <Input
                type="number"
                value={config.donorCutoffPercent}
                onChange={(e) =>
                  setConfig({ ...config, donorCutoffPercent: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Corte Inter (%)</Label>
              <Input
                type="number"
                value={config.goodCutoffUpper}
                onChange={(e) =>
                  setConfig({ ...config, goodCutoffUpper: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">SCS Máx Doadoras</Label>
              <Input
                type="number"
                step="0.1"
                value={config.scsMaxDonor}
                onChange={(e) =>
                  setConfig({ ...config, scsMaxDonor: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">DPR Mín Doadoras</Label>
              <Input
                type="number"
                step="0.1"
                value={config.dprMinDonor}
                onChange={(e) =>
                  setConfig({ ...config, dprMinDonor: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">DPR Crítico (&lt;)</Label>
              <Input
                type="number"
                step="0.1"
                value={config.critical_dpr_lt}
                onChange={(e) =>
                  setConfig({ ...config, critical_dpr_lt: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">SCS Crítico (&gt;)</Label>
              <Input
                type="number"
                step="0.1"
                value={config.critical_scs_gt}
                onChange={(e) =>
                  setConfig({ ...config, critical_scs_gt: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="w-5 h-5" />
              Distribuição por Segmento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Doadoras", value: counts.Doadoras, color: COLORS.Doadoras },
                    { name: "Inter", value: counts.Inter, color: COLORS.Inter },
                    { name: "Receptoras", value: counts.Receptoras, color: COLORS.Receptoras },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: "Doadoras", value: counts.Doadoras, color: COLORS.Doadoras },
                    { name: "Inter", value: counts.Inter, color: COLORS.Inter },
                    { name: "Receptoras", value: counts.Receptoras, color: COLORS.Receptoras },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Índice de Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: "Doadoras",
                    tpi: segmentedAnimals
                      .filter((f) => f._grupo === "Doadoras")
                      .reduce((acc, f) => acc + (f.tpi || 0), 0) /
                      Math.max(counts.Doadoras, 1),
                  },
                  {
                    name: "Inter",
                    tpi: segmentedAnimals
                      .filter((f) => f._grupo === "Inter")
                      .reduce((acc, f) => acc + (f.tpi || 0), 0) /
                      Math.max(counts.Inter, 1),
                  },
                  {
                    name: "Receptoras",
                    tpi: segmentedAnimals
                      .filter((f) => f._grupo === "Receptoras")
                      .reduce((acc, f) => acc + (f.tpi || 0), 0) /
                      Math.max(counts.Receptoras, 1),
                  },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="tpi" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Animals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Animais Segmentados ({segmentedAnimals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Identificador</th>
                  <th className="text-left p-2">NAAB Pai</th>
                  <th className="text-left p-2">Nascimento</th>
                  <th className="text-left p-2">Segmento</th>
                  <th className="text-left p-2">TPI</th>
                  <th className="text-left p-2">%</th>
                  <th className="text-left p-2">DPR</th>
                  <th className="text-left p-2">SCS</th>
                  <th className="text-left p-2">PTAT</th>
                  <th className="text-left p-2">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {segmentedAnimals.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{f.name || f.identifier || "-"}</td>
                    <td className="p-2">{f.identifier || "-"}</td>
                    <td className="p-2">{f.sire_naab || "-"}</td>
                    <td className="p-2">{f.birth_date ? new Date(f.birth_date).toLocaleDateString() : "-"}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          f._grupo === "Doadoras"
                            ? "bg-red-100 text-red-800"
                            : f._grupo === "Inter"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {f._grupo}
                      </span>
                    </td>
                    <td className="p-2 text-right">{f.tpi?.toFixed(0) || "-"}</td>
                    <td className="p-2 text-right">{f._percentil ? `${f._percentil}%` : "-"}</td>
                    <td className="p-2 text-right">{f.dpr?.toFixed(1) || "-"}</td>
                    <td className="p-2 text-right">{f.scs?.toFixed(2) || "-"}</td>
                    <td className="p-2 text-right">{f.ptat?.toFixed(1) || "-"}</td>
                    <td className="p-2 text-xs text-gray-600">{f._motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}