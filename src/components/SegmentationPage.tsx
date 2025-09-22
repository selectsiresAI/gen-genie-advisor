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
        nm_dollar: Number(nmCandidate || 0),
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
    const crit = (f.dpr || 0) < cfg.critical_dpr_lt || (f.scs || 0) > cfg.critical_scs_gt;
    if (crit) {
      return { ...f, _percentil: p, _grupo: "Receptoras", _motivo: "Crítico: DPR/SCS" };
    }

    if (p !== null && p <= cfg.donorCutoffPercent) {
      const okSCS = (f.scs || 99) <= cfg.scsMaxDonor;
      const okDPR = (f.dpr || -99) >= cfg.dprMinDonor;
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
  const [segConfig, setSegConfig] = useState<SegmentConfig>(defaultSegConfig);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Weights>({
    ["HHP$"]: 0, TPI: 1, ["NM$"]: 1, ["CM$"]: 0, ["FM$"]: 0, ["GM$"]: 0, ["F SAV"]: 0, PTAM: 0, CFP: 0,
    PTAF: 0, ["PTAF%"]: 0, PTAP: 0, ["PTAP%"]: 0, PL: 0, DPR: 0, LIV: 0, SCS: 1, MAST: 0, MET: 0, RP: 0, DA: 0, KET: 0, MF: 0,
    PTAT: 1, UDC: 0, FLC: 0, SCE: 0, DCE: 0, SSB: 0, DSB: 0, ["H LIV"]: 0, CCR: 0, HCR: 0, FI: 0, GL: 0, EFC: 0, BWC: 0, STA: 0,
    STR: 0, DFM: 0, RUA: 0, RLS: 0, RTP: 0, FTL: 0, RW: 0, RLR: 0, FTA: 0, FLS: 0, FUA: 0, RUH: 0, RUW: 0, UCL: 0, UDP: 0, FTP: 0, RFI: 0,
    Milk: 1, Fat: 1, Protein: 1
  });

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

      // Convert database data to Female type
      const convertedFemales: Female[] = (data || []).map(dbFemale => ({
        id: dbFemale.id,
        name: dbFemale.name || '',
        identifier: dbFemale.identifier,
        birth_date: dbFemale.birth_date,
        sire_naab: dbFemale.sire_naab,
        hhp_dollar: dbFemale.hhp_dollar,
        nm_dollar: dbFemale.nm_dollar,
        tpi: dbFemale.tpi,
        cm_dollar: dbFemale.cm_dollar,
        fm_dollar: dbFemale.fm_dollar,
        gm_dollar: dbFemale.gm_dollar,
        f_sav: dbFemale.f_sav,
        ptam: dbFemale.ptam,
        cfp: dbFemale.cfp,
        ptaf: dbFemale.ptaf,
        ptaf_pct: dbFemale.ptaf_pct,
        ptap: dbFemale.ptap,
        ptap_pct: dbFemale.ptap_pct,
        pl: dbFemale.pl,
        dpr: dbFemale.dpr,
        liv: dbFemale.liv,
        scs: dbFemale.scs,
        mast: dbFemale.mast,
        met: dbFemale.met,
        rp: dbFemale.rp,
        da: dbFemale.da,
        ket: dbFemale.ket,
        mf: dbFemale.mf,
        ptat: dbFemale.ptat,
        udc: dbFemale.udc,
        flc: dbFemale.flc,
        sce: dbFemale.sce,
        dce: dbFemale.dce,
        ssb: dbFemale.ssb,
        dsb: dbFemale.dsb,
        h_liv: dbFemale.h_liv,
        ccr: dbFemale.ccr,
        hcr: dbFemale.hcr,
        fi: dbFemale.fi,
        gl: dbFemale.gl,
        efc: dbFemale.efc,
        bwc: dbFemale.bwc,
        sta: dbFemale.sta,
        str: dbFemale.str,
        dfm: dbFemale.dfm,
        rua: dbFemale.rua,
        rls: dbFemale.rls,
        rtp: dbFemale.rtp,
        ftl: dbFemale.ftl,
        rw: dbFemale.rw,
        rlr: dbFemale.rlr,
        fta: dbFemale.fta,
        fls: dbFemale.fls,
        fua: dbFemale.fua,
        ruh: dbFemale.ruh,
        ruw: dbFemale.ruw,
        ucl: dbFemale.ucl,
        udp: dbFemale.udp,
        ftp: dbFemale.ftp,
        rfi: dbFemale.rfi,
        gfi: dbFemale.gfi
      }));

      setFemales(convertedFemales);
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

  // Compute stats for custom scoring
  const statsForCustom = useMemo(() => {
    if (!females.length) return {};
    
    const tpiValues = females.map(f => f.tpi).filter(v => v != null && isFinite(v)) as number[];
    const nmValues = females.map(f => f.nm_dollar).filter(v => v != null && isFinite(v)) as number[];
    const scsValues = females.map(f => f.scs).filter(v => v != null && isFinite(v)) as number[];
    const ptatValues = females.map(f => f.ptat).filter(v => v != null && isFinite(v)) as number[];

    const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const sd = (arr: number[]) => {
      const m = mean(arr);
      const variance = arr.length ? arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length : 0;
      return Math.sqrt(variance);
    };

    return {
      tpi: { mean: mean(tpiValues), sd: sd(tpiValues) },
      nm_dollar: { mean: mean(nmValues), sd: sd(nmValues) },
      scs: { mean: mean(scsValues), sd: sd(scsValues) },
      ptat: { mean: mean(ptatValues), sd: sd(ptatValues) }
    };
  }, [females]);

  // Apply segmentation
  const segmentedFemales = useMemo(() => {
    if (!females.length) return [];
    return segmentAnimals(females, segConfig, statsForCustom, weights, selectedTraits);
  }, [females, segConfig, statsForCustom, weights, selectedTraits]);

  // Calculate statistics
  const segmentStats = useMemo(() => {
    const doadoras = segmentedFemales.filter(f => f._grupo === "Doadoras");
    const inter = segmentedFemales.filter(f => f._grupo === "Inter");  
    const receptoras = segmentedFemales.filter(f => f._grupo === "Receptoras");
    
    return {
      doadoras: { count: doadoras.length, percent: segmentedFemales.length ? (doadoras.length / segmentedFemales.length) * 100 : 0 },
      inter: { count: inter.length, percent: segmentedFemales.length ? (inter.length / segmentedFemales.length) * 100 : 0 },
      receptoras: { count: receptoras.length, percent: segmentedFemales.length ? (receptoras.length / segmentedFemales.length) * 100 : 0 }
    };
  }, [segmentedFemales]);

  const pieData = [
    { name: "Doadoras", value: segmentStats.doadoras.count, color: COLORS.Doadoras },
    { name: "Inter", value: segmentStats.inter.count, color: COLORS.Inter },
    { name: "Receptoras", value: segmentStats.receptoras.count, color: COLORS.Receptoras }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando fêmeas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Segmentação</h1>
            <span className="text-muted-foreground">• {farm.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toCSV(segmentedFemales, `segmentacao-${farm.name}.csv`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total de Fêmeas</span>
              </div>
              <p className="text-2xl font-bold mt-1">{segmentedFemales.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.Doadoras }}></div>
                <span className="text-sm font-medium">Doadoras</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {segmentStats.doadoras.count} <span className="text-sm text-muted-foreground">({segmentStats.doadoras.percent.toFixed(1)}%)</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.Inter }}></div>
                <span className="text-sm font-medium">Inter</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {segmentStats.inter.count} <span className="text-sm text-muted-foreground">({segmentStats.inter.percent.toFixed(1)}%)</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.Receptoras }}></div>
                <span className="text-sm font-medium">Receptoras</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {segmentStats.receptoras.count} <span className="text-sm text-muted-foreground">({segmentStats.receptoras.percent.toFixed(1)}%)</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primaryIndex">Índice Primário</Label>
                  <Select
                    value={segConfig.primaryIndex}
                    onValueChange={(value: PrimaryIndex) => 
                      setSegConfig(prev => ({ ...prev, primaryIndex: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HHP$">HHP$</SelectItem>
                      <SelectItem value="NM$">NM$</SelectItem>
                      <SelectItem value="TPI">TPI</SelectItem>
                      <SelectItem value="Custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="donorCutoff">% Corte Doadoras</Label>
                  <Input
                    id="donorCutoff"
                    type="number"
                    value={segConfig.donorCutoffPercent}
                    onChange={e => setSegConfig(prev => ({ 
                      ...prev, 
                      donorCutoffPercent: Number(e.target.value) 
                    }))}
                    min={1}
                    max={100}
                  />
                </div>

                <div>
                  <Label htmlFor="goodCutoff">% Corte Inter</Label>
                  <Input
                    id="goodCutoff"
                    type="number"
                    value={segConfig.goodCutoffUpper}
                    onChange={e => setSegConfig(prev => ({ 
                      ...prev, 
                      goodCutoffUpper: Number(e.target.value) 
                    }))}
                    min={1}
                    max={100}
                  />
                </div>

                <div>
                  <Label htmlFor="scsMaxDonor">SCS Máx Doadoras</Label>
                  <Input
                    id="scsMaxDonor"
                    type="number"
                    step="0.1"
                    value={segConfig.scsMaxDonor}
                    onChange={e => setSegConfig(prev => ({ 
                      ...prev, 
                      scsMaxDonor: Number(e.target.value) 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="dprMinDonor">DPR Mín Doadoras</Label>
                  <Input
                    id="dprMinDonor"
                    type="number"
                    step="0.1"
                    value={segConfig.dprMinDonor}
                    onChange={e => setSegConfig(prev => ({ 
                      ...prev, 
                      dprMinDonor: Number(e.target.value) 
                    }))}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showAdvanced ? "Ocultar" : "Mostrar"} Avançado
                </Button>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="h-4 w-4" />
                  Distribuição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name, percent }) => 
                          `${name} ${(Number(percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Fêmeas Segmentadas ({segmentedFemales.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Nasc.</th>
                        <th className="text-center p-2">HHP$</th>
                        <th className="text-center p-2">TPI</th>
                        <th className="text-center p-2">NM$</th>
                        <th className="text-center p-2">SCS</th>
                        <th className="text-center p-2">DPR</th>
                        <th className="text-center p-2">%ile</th>
                        <th className="text-left p-2">Grupo</th>
                        <th className="text-left p-2">Motivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segmentedFemales.slice(0, 100).map((female) => (
                        <tr key={female.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{female.name}</td>
                          <td className="p-2 text-muted-foreground">{female.identifier || "-"}</td>
                          <td className="p-2 text-muted-foreground">
                            {female.birth_date ? new Date(female.birth_date).toLocaleDateString() : "-"}
                          </td>
                          <td className="p-2 text-center">{female.hhp_dollar?.toFixed(0) || "-"}</td>
                          <td className="p-2 text-center">{female.tpi?.toFixed(0) || "-"}</td>
                          <td className="p-2 text-center">{female.nm_dollar?.toFixed(0) || "-"}</td>
                          <td className="p-2 text-center">{female.scs?.toFixed(2) || "-"}</td>
                          <td className="p-2 text-center">{female.dpr?.toFixed(1) || "-"}</td>
                          <td className="p-2 text-center">{female._percentil || "-"}</td>
                          <td className="p-2">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: COLORS[female._grupo!] }}
                            >
                              {female._grupo}
                            </span>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">{female._motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {segmentedFemales.length > 100 && (
                    <p className="text-center text-muted-foreground mt-4 text-sm">
                      Mostrando primeiras 100 de {segmentedFemales.length} fêmeas. Exporte CSV para ver todas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}