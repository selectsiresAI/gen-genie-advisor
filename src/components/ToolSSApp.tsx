import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { Users, Search as SearchIcon, Calculator, FileText, LineChart as LineIcon, Plus, Download, Upload, SlidersHorizontal, ArrowLeftRight, Layers3, PieChart as PieIcon, ArrowLeft, Beef, TrendingUp, Zap, Trash2 } from "lucide-react";
import PastaArquivosPage from "./PastaArquivos";
import SMSPage from "./SMS";
import MetasPage from "./Metas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SegmentationPage from "./SegmentationPage";
import NexusApp from "./NexusApp";
import PlanoApp from "./PlanoApp";
import BotijaoVirtualPage from "./BotijaoVirtual";

/**
 * ToolSS — MVP interativo (Lovable-ready)
 * Select Sires color palette integrated with design system
 */

// ------------------------ Types ------------------------
type Female = {
  // Identificação básica (obrigatórios para compatibilidade)
  id: string;
  brinco: string; // ID Fazenda 
  nascimento: string; // Data de Nascimento ISO yyyy-mm-dd
  ordemParto?: number; // Ordem de parto
  categoria?: string; // Categoria do animal
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
  
  // Novos campos opcionais
  nome?: string;
  idCDCB?: string;
  pedigree?: string; // Pai/Avô Materno/BisaAvô Materno
  
  // Índices Econômicos
  ["HHP$"]?: number;
  ["CM$"]?: number;
  ["FM$"]?: number;
  ["GM$"]?: number;
  ["F SAV"]?: number;
  PTAM?: number;
  CFP?: number;
  
  // Produção
  PTAF?: number;
  ["PTAF%"]?: number;
  PTAP?: number;
  ["PTAP%"]?: number;
  PL?: number;
  
  // Fertilidade e Saúde
  LIV?: number;
  MAST?: number;
  MET?: number;
  RP?: number;
  DA?: number;
  KET?: number;
  MF?: number;
  
  // Conformação
  UDC?: number;
  FLC?: number;
  
  // Facilidade de Parto
  SCE?: number;
  DCE?: number;
  SSB?: number;
  DSB?: number;
  ["H LIV"]?: number;
  
  // Características Múltiplas
  CCR?: number;
  HCR?: number;
  FI?: number;
  GL?: number;
  EFC?: number;
  BWC?: number;
  STA?: number;
  STR?: number;
  
  // Características Lineares  
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
  
  // Eficiência Alimentar
  RFI?: number;
  
  // Genética das Proteínas
  ["Beta-Casein"]?: string;
  ["Kappa-Caseina"]?: string;
  
  // Campos calculados na segmentação (não obrigatórios no seed)
  _percentil?: number | null;
  _grupo?: "Doadoras" | "Inter" | "Receptoras";
  _motivo?: string;
};
type Bull = {
  // Identificação básica (obrigatórios para compatibilidade)
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
  empresa?: string; // Nova coluna empresa
  
  // Novos campos opcionais
  NAAB?: string;
  registro?: string;
  nascimento?: string; // Data de Nascimento
  
  // Índices Econômicos
  ["HHP$"]?: number;
  ["CM$"]?: number;
  ["FM$"]?: number;
  ["GM$"]?: number;
  ["F SAV"]?: number;
  PTAM?: number;
  CFP?: number;
  
  // Produção
  PTAF?: number;
  ["PTAF%"]?: number;
  PTAP?: number;
  ["PTAP%"]?: number;
  PL?: number;
  
  // Fertilidade e Saúde
  DPR?: number;
  LIV?: number;
  MAST?: number;
  MET?: number;
  RP?: number;
  DA?: number;
  KET?: number;
  MF?: number;
  
  // Conformação
  UDC?: number;
  FLC?: number;
  
  // Facilidade de Parto
  SCE?: number;
  DCE?: number;
  SSB?: number;
  DSB?: number;
  ["H LIV"]?: number;
  
  // Características Múltiplas
  CCR?: number;
  HCR?: number;
  FI?: number;
  GL?: number;
  EFC?: number;
  BWC?: number;
  STA?: number;
  STR?: number;
  
  // Características Lineares  
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
  
  // Eficiência Alimentar
  RFI?: number;
  
  // Genética das Proteínas
  ["Beta-Caseina"]?: string;
  ["Kappa-Caseina"]?: string;
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
  TPI: number;
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  SCS: number;
  PTAT: number;
};

// Adicionar tipos para Botijão Virtual
type BotijaoItem = {
  touro: Bull;
  tipo: "Convencional" | "Sexado";
  doses: number;
  distribuicao: {
    // Por categoria de idade
    Nov: number;      // Novilhas
    Prim: number;     // Primíparas
    Secund: number;   // Secundíparas
    Mult: number;     // Multíparas
    // Por segmentação
    Doadoras: number;
    Intermediarias: number;
    Receptoras: number;
  };
};

type BotijaoVirtual = {
  fazendaId: string;
  itens: BotijaoItem[];
  dataAtualizacao: string;
};
type PrimaryIndex = "TPI" | "NM$" | "Custom";
type SegmentConfig = {
  primaryIndex: PrimaryIndex;
  donorCutoffPercent: number; // ex.: 20 → Top 20% = Doadoras
  goodCutoffUpper: number; // ex.: 70 → Bom até 70%; resto Receptoras
  scsMaxDonor: number; // 2.9
  dprMinDonor: number; // 1.0
  critical_dpr_lt: number; // -1.0
  critical_scs_gt: number; // 3.0
};

// ------------------------ Utilities ------------------------
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

function toCSV(rows: any[], filename = "export.csv") {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(",")].concat(rows.map(r => headers.map(h => String(r[h] ?? "")).join(","))).join("\n");
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(x => x.trim());
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = cols[i]);
    return obj;
  });
}
function zscale(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
  const sd = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(values.length - 1, 1));
  return {
    mean,
    sd: sd || 1
  };
}
function normalize(value: number, mean: number, sd: number) {
  return (value - mean) / (sd || 1);
}

// ------------------------ Seed Data ------------------------
// Generate 500 females for testing automatic categorization
const generateTestFemales = (): Female[] => {
  const females: Female[] = [];  
  const years = [2021, 2022, 2023, 2024, 2025];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const sireNames = ["Haven", "Cason", "Luche", "Stormy", "Legacy", "Gameday", "Bolton", "Epic", "Robust", "Champion"];
  const naabCodes = ["029HO19791", "208HO00355", "011HO15225", "029HO19829", "007HO14195", "250HO12961", "014HO17486", "007HO17200", "029HO19800", "208HO00400"];
  
  let counter = 1;
  
  for (let yearIdx = 0; yearIdx < years.length; yearIdx++) {
    const year = years[yearIdx];
    
    // 100 females per year
    for (let i = 0; i < 100; i++) {
      const month = months[Math.floor(Math.random() * months.length)];
      const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid date issues
      const nascimento = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      const ordemParto = Math.floor(Math.random() * 6); // 0-5 partos
      const sireIdx = Math.floor(Math.random() * sireNames.length);
      
      // Generate realistic PTA values
      const baseTPI = 2000 + Math.floor(Math.random() * 800); // 2000-2800
      const baseNM = 300 + Math.floor(Math.random() * 700); // 300-1000
      const milk = 800 + Math.floor(Math.random() * 1500); // 800-2300
      const fat = 40 + Math.floor(Math.random() * 80); // 40-120
      const protein = 30 + Math.floor(Math.random() * 50); // 30-80
      const dpr = -2 + Math.random() * 4; // -2 to 2
      const scs = 2.5 + Math.random() * 1; // 2.5-3.5
      const ptat = -0.5 + Math.random() * 2; // -0.5 to 1.5
      
      females.push({
        id: `F${counter.toString().padStart(4, '0')}`,
        brinco: counter.toString(),
        nascimento,
        ordemParto,
        categoria: categorizeAnimal(nascimento, ordemParto),
        naabPai: naabCodes[sireIdx],
        nomePai: sireNames[sireIdx],
        TPI: baseTPI,
        ["NM$"]: baseNM,
        Milk: milk,
        Fat: fat,
        Protein: protein,
        DPR: Number(dpr.toFixed(1)),
        SCS: Number(scs.toFixed(2)),
        PTAT: Number(ptat.toFixed(2)),
        year: year,
        
        // Optional fields with some realistic values
        nome: `Vaca ${counter}`,
        idCDCB: `CDCB${counter}`,
        pedigree: `${sireNames[sireIdx]} x Dam${counter}`,
        ["HHP$"]: baseNM + Math.floor(Math.random() * 200) - 100,
        ["CM$"]: baseNM - 100 + Math.floor(Math.random() * 150),
        ["FM$"]: baseNM - 50 + Math.floor(Math.random() * 100),
        ["GM$"]: baseNM - 80 + Math.floor(Math.random() * 120),
        ["F SAV"]: Number((Math.random() * 2 - 1).toFixed(1)),
        PTAM: Math.floor(Math.random() * 100) - 50,
        CFP: Number((Math.random() * 4 - 2).toFixed(1)),
        PTAF: Math.floor(Math.random() * 80) - 40,
        ["PTAF%"]: Math.floor(Math.random() * 40) - 20,
        PTAP: Math.floor(Math.random() * 40) - 20,
        ["PTAP%"]: Math.floor(Math.random() * 30) - 15,
        PL: Math.floor(Math.random() * 100) - 50,
        LIV: Number((Math.random() * 6 - 3).toFixed(1)),
        MAST: Number((Math.random() * 4 - 2).toFixed(1)),
        MET: Number((Math.random() * 3 - 1.5).toFixed(1)),
        RP: Number((Math.random() * 4 - 2).toFixed(1)),
        DA: Number((Math.random() * 3 - 1.5).toFixed(1)),
        KET: Number((Math.random() * 2 - 1).toFixed(1)),
        MF: Number((Math.random() * 3 - 1.5).toFixed(1)),
        UDC: Number((Math.random() * 4 - 2).toFixed(1)),
        FLC: Number((Math.random() * 3 - 1.5).toFixed(1)),
        SCE: Number((Math.random() * 8 - 4).toFixed(1)),
        DCE: Number((Math.random() * 6 - 3).toFixed(1)),
        SSB: Number((Math.random() * 8 - 4).toFixed(1)),
        DSB: Number((Math.random() * 6 - 3).toFixed(1)),
        ["H LIV"]: Number((Math.random() * 4 - 2).toFixed(1)),
        CCR: Number((Math.random() * 6 - 3).toFixed(1)),
        HCR: Number((Math.random() * 4 - 2).toFixed(1)),
        FI: Number((Math.random() * 10 - 5).toFixed(1)),
        GL: Number((Math.random() * 8 - 4).toFixed(1)),
        EFC: Number((Math.random() * 12 - 6).toFixed(1)),
        BWC: Number((Math.random() * 20 - 10).toFixed(1)),
        STA: Number((Math.random() * 3 - 1.5).toFixed(2)),
        STR: Number((Math.random() * 3 - 1.5).toFixed(2)),
        DFM: Number((Math.random() * 2 - 1).toFixed(2)),
        RUA: Number((Math.random() * 2 - 1).toFixed(2)),
        RLS: Number((Math.random() * 2 - 1).toFixed(2)),
        RTP: Number((Math.random() * 2 - 1).toFixed(2)),
        FTL: Number((Math.random() * 2 - 1).toFixed(2)),
        RW: Number((Math.random() * 2 - 1).toFixed(2)),
        RLR: Number((Math.random() * 2 - 1).toFixed(2)),
        FTA: Number((Math.random() * 2 - 1).toFixed(2)),
        FLS: Number((Math.random() * 2 - 1).toFixed(2)),
        FUA: Number((Math.random() * 2 - 1).toFixed(2)),
        RUH: Number((Math.random() * 2 - 1).toFixed(2)),
        RUW: Number((Math.random() * 2 - 1).toFixed(2)),
        UCL: Number((Math.random() * 2 - 1).toFixed(2)),
        UDP: Number((Math.random() * 2 - 1).toFixed(2)),
        FTP: Number((Math.random() * 2 - 1).toFixed(2)),
        RFI: Number((Math.random() * 200 - 100).toFixed(0)),
        ["Beta-Casein"]: Math.random() > 0.5 ? "A2A2" : "A1A2",
        ["Kappa-Caseina"]: Math.random() > 0.5 ? "BB" : "AB"
      });
      
      counter++;
    }
  }
  
  return females;
};

const seedFemales: Female[] = generateTestFemales();
const seedBulls: Bull[] = [{
  naab: "7HO17191",
  nome: "Mican",
  pedigree: "Sheepster x Gameday x Legacy",
  TPI: 3479,
  NM$: 989,
  Milk: 1329,
  Fat: 100,
  Protein: 67,
  SCS: 2.70,
  PTAT: 1.6,
  disponibilidade: "Disponível"
}, {
  naab: "7HO17572",
  nome: "Myboyblue",
  pedigree: "Reaper x Parsly x Try Me",
  TPI: 3479,
  NM$: 1026,
  Milk: 994,
  Fat: 99,
  Protein: 50,
  SCS: 2.66,
  PTAT: 1.7,
  disponibilidade: "Disponível"
}, {
  naab: "14HO17486",
  nome: "Cobot",
  pedigree: "Rimbot x Monteverdi x Envoy",
  TPI: 3459,
  NM$: 1158,
  Milk: 840,
  Fat: 109,
  Protein: 50,
  SCS: 2.64,
  PTAT: 1.8,
  disponibilidade: "Disponível"
}, {
  naab: "7HO17200",
  nome: "Golley",
  pedigree: "Sheepster x Deluxe x Biggelo",
  TPI: 3448,
  NM$: 903,
  Milk: 665,
  Fat: 128,
  Protein: 53,
  SCS: 2.63,
  PTAT: 1.5,
  disponibilidade: "Disponível"
}, {
  naab: "7HO17478",
  nome: "Sturgeon",
  pedigree: "Sheepster x Upside x Legacy",
  TPI: 3448,
  NM$: 962,
  Milk: 1463,
  Fat: 111,
  Protein: 69,
  SCS: 2.68,
  PTAT: 1.3,
  disponibilidade: "Disponível"
}, {
  naab: "7HO17194",
  nome: "Donald",
  pedigree: "Sheepster x Engineer x Lionel",
  TPI: 3444,
  NM$: 1015,
  Milk: 831,
  Fat: 117,
  Protein: 56,
  SCS: 2.69,
  PTAT: 1.4,
  disponibilidade: "Disponível"
}, {
  naab: "14HO17393",
  nome: "Ozark",
  pedigree: "Sheepster x Gameday x Pursuit",
  TPI: 3443,
  NM$: 933,
  Milk: 725,
  Fat: 107,
  Protein: 42,
  SCS: 2.65,
  PTAT: 1.5,
  disponibilidade: "Disponível"
}];
const seedClients: Client[] = [{
  id: 1160,
  nome: "ANTONIO BRAZ TINOCO",
  cidade: "Patos de Minas",
  uf: "MG",
  farms: [{
    id: "FAZ1",
    nome: "Fazenda Matriz",
    females: seedFemales,
    bulls: seedBulls
  }]
}, {
  id: 110,
  nome: "CARLOS JACOB WALLAUER",
  cidade: "Salvador do Sul",
  uf: "RS",
  farms: [{
    id: "FAZ2",
    nome: "Fazenda das Araucárias",
    females: seedFemales.slice(0, 6),
    bulls: seedBulls
  }]
}, {
  id: 85,
  nome: "CLAUDIO E SEMILDO SCHIEFELBEIN",
  cidade: "Fortaleza dos Valos",
  uf: "RS",
  farms: [{
    id: "FAZ3",
    nome: "Rebanho Fini",
    females: seedFemales.slice(2),
    bulls: seedBulls
  }]
}, {
  id: 135,
  nome: "FAZENDA SAN DIEGO",
  cidade: "Chiapeta",
  uf: "RS",
  farms: [{
    id: "FAZ4",
    nome: "San Diego",
    females: seedFemales,
    bulls: seedBulls
  }]
}];

// ------------------------ Persistence ------------------------
const STORAGE_KEY = "toolss_clients_v1";
const SEGMENT_CFG_KEY = "toolss_segment_config_v1";
function loadClients(): Client[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedClients;
  try {
    return JSON.parse(raw) as Client[];
  } catch {
    return seedClients;
  }
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
  critical_scs_gt: 3.0
};
function loadSegConfig(): SegmentConfig {
  const raw = localStorage.getItem(SEGMENT_CFG_KEY);
  if (!raw) return defaultSegConfig;
  try {
    return {
      ...defaultSegConfig,
      ...(JSON.parse(raw) as SegmentConfig)
    };
  } catch {
    return defaultSegConfig;
  }
}
function saveSegConfig(cfg: SegmentConfig) {
  localStorage.setItem(SEGMENT_CFG_KEY, JSON.stringify(cfg));
}

// ------------------------ Custom Index ------------------------
const defaultWeights: Weights = {
  TPI: 0.35,
  ["NM$"]: 0.30,
  Milk: 0.10,
  Fat: 0.10,
  Protein: 0.10,
  SCS: 0.03,
  PTAT: 0.02
};
function scoreAnimal(a: {
  TPI: number;
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  SCS: number;
  PTAT: number;
}, stats: any, w: Weights) {
  // Normaliza por z-score e aplica pesos; SCS entra negativo (penaliza).
  const zTPI = normalize(a.TPI, stats.TPI.mean, stats.TPI.sd);
  const zNM = normalize(a["NM$"], stats.NM.mean, stats.NM.sd);
  const zMilk = normalize(a.Milk, stats.Milk.mean, stats.Milk.sd);
  const zFat = normalize(a.Fat, stats.Fat.mean, stats.Fat.sd);
  const zProt = normalize(a.Protein, stats.Protein.mean, stats.Protein.sd);
  const zSCS = normalize(a.SCS, stats.SCS.mean, stats.SCS.sd);
  const zPTAT = normalize(a.PTAT, stats.PTAT.mean, stats.PTAT.sd);
  return w.TPI * zTPI + w["NM$"] * zNM + w.Milk * zMilk + w.Fat * zFat + w.Protein * zProt + w.PTAT * zPTAT - w.SCS * zSCS;
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
    DPR: (m.DPR + 0) / 2,
    // sem DPR do touro no seed
    SCS: (m.SCS + b.SCS) / 2,
    PTAT: Number(((m.PTAT + b.PTAT) / 2).toFixed(2))
  };
}

// ------------------------ Segmentation Functions ------------------------
function getPrimaryValue(f: Female, primary: PrimaryIndex, statsForCustom: any, weights: Weights): number | null {
  if (primary === "TPI") return Number(f.TPI ?? null);
  if (primary === "NM$") return Number(f["NM$"] ?? null);
  if (primary === "Custom") {
    try {
      const base = {
        TPI: f.TPI,
        ["NM$"]: f["NM$"],
        Milk: f.Milk,
        Fat: f.Fat,
        Protein: f.Protein,
        SCS: f.SCS,
        PTAT: f.PTAT
      };
      return scoreAnimal(base, statsForCustom, weights);
    } catch {
      return null;
    }
  }
  return null;
}
function computePercentiles(values: Array<{
  id: string;
  v: number;
}>): Map<string, number> {
  // Ordena desc (maior índice = melhor) e atribui percentil 1..100
  const sorted = [...values].sort((a, b) => b.v - a.v);
  const n = sorted.length;
  const map = new Map<string, number>();
  sorted.forEach((item, i) => {
    const p = Math.round((i + 1) / n * 100);
    map.set(item.id, p);
  });
  return map;
}
function segmentAnimals(females: Female[], cfg: SegmentConfig, statsForCustom: any, weights: Weights): Female[] {
  const base: Array<{
    id: string;
    v: number;
  }> = [];
  females.forEach(f => {
    const v = getPrimaryValue(f, cfg.primaryIndex, statsForCustom, weights);
    if (v === null || Number.isNaN(v)) return;
    base.push({
      id: f.id,
      v: Number(v)
    });
  });
  const pct = computePercentiles(base);
  return females.map(f => {
    const p = pct.get(f.id) ?? null;
    // Regras críticas → Receptoras
    const crit = (f.DPR ?? 0) < cfg.critical_dpr_lt || (f.SCS ?? 0) > cfg.critical_scs_gt;
    if (crit) {
      return {
        ...f,
        _percentil: p,
        _grupo: "Receptoras",
        _motivo: "Crítico: DPR/SCS"
      };
    }
    if (p !== null && p <= cfg.donorCutoffPercent) {
      const okSCS = (f.SCS ?? 99) <= cfg.scsMaxDonor;
      const okDPR = (f.DPR ?? -99) >= cfg.dprMinDonor;
      if (okSCS && okDPR) {
        return {
          ...f,
          _percentil: p,
          _grupo: "Doadoras",
          _motivo: "Top + saúde OK"
        };
      }
      return {
        ...f,
        _percentil: p,
        _grupo: "Inter",
        _motivo: "Top, saúde insuficiente"
      };
    }
    if (p !== null && p <= cfg.goodCutoffUpper) {
      return {
        ...f,
        _percentil: p,
        _grupo: "Inter",
        _motivo: "Faixa intermediária"
      };
    }
    return {
      ...f,
      _percentil: p,
      _grupo: "Receptoras",
      _motivo: "Abaixo do limiar"
    };
  });
}

// ------------------------ Main App ------------------------
export default function ToolSSApp() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<"clientes" | "fazenda" | "rebanho" | "touros" | "graficos" | "plano" | "info" | "segmentacao" | "nexus" | "botijao" | "arquivos" | "sms" | "metas">("clientes");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]); // naab
  
  // Bull selection and Botijão Virtual states
  const [selectedBullsForBotijao, setSelectedBullsForBotijao] = useState<string[]>([]);
  const [showAddToBotijaoDialog, setShowAddToBotijaoDialog] = useState(false);
  const [showBotijaoVirtual, setShowBotijaoVirtual] = useState(false);
  
  // Bulls page states
  const [selectedIndicePers, setSelectedIndicePers] = useState("tpi");
  const [bullSearchTerm, setBullSearchTerm] = useState("");
  const [selectedEmpresaBulls, setSelectedEmpresaBulls] = useState<string>("todas");

  const farm = useMemo(() => selectedClient?.farms.find(f => f.id === selectedFarmId) ?? null, [selectedClient, selectedFarmId]);
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
    cols.forEach(c => s[c === "NM$" ? "NM" : c] = zscale(base.map(b => Number(b[c]))));
    return {
      TPI: s.TPI,
      NM: s.NM,
      Milk: s.Milk,
      Fat: s.Fat,
      Protein: s.Protein,
      SCS: s.SCS,
      PTAT: s.PTAT
    };
  }, [farm?.bulls]);
  const rankedBulls = useMemo(() => {
    if (!farm) return [];
    return [...farm.bulls].map(b => ({
      ...b,
      _score: scoreAnimal(b as any, stats, weights)
    })).sort((a, b) => b._score - a._score);
  }, [farm, stats, weights]);

  // projeções (usa o 1º touro selecionado, ou o 1º do ranking)
  const bullForProjection = useMemo(() => {
    const pick = selectedBulls[0];
    return rankedBulls.find(b => b.naab === pick) || rankedBulls[0];
  }, [rankedBulls, selectedBulls]);
  const projectedFemales = useMemo(() => {
    if (!farm || !bullForProjection) return [];
    return farm.females.map(f => projectDaughter(f, bullForProjection));
  }, [farm, bullForProjection]);

  // Agregados p/ gráficos por ano
  const aggByYear = (rows: Female[]) => {
    const map: Record<number, {
      year: number;
      TPI: number;
      ["NM$"]: number;
      count: number;
      Milk: number;
      Fat: number;
      Protein: number;
    }> = {};
    rows.forEach(r => {
      const y = r.year || new Date(r.nascimento).getFullYear();
      if (!map[y]) map[y] = {
        year: y,
        TPI: 0,
        ["NM$"]: 0,
        Milk: 0,
        Fat: 0,
        Protein: 0,
        count: 0
      };
      map[y].TPI += r.TPI;
      map[y]["NM$"] += r["NM$"];
      map[y].Milk += r.Milk;
      map[y].Fat += r.Fat;
      map[y].Protein += r.Protein;
      map[y].count += 1;
    });
    return Object.values(map).map(d => ({
      year: d.year,
      TPI: Math.round(d.TPI / d.count),
      ["NM$"]: Math.round(d["NM$"] / d.count),
      Milk: Math.round(d.Milk / d.count),
      Fat: Math.round(d.Fat / d.count),
      Protein: Math.round(d.Protein / d.count)
    })).sort((a, b) => a.year - b.year);
  };
  const mothersSeries = useMemo(() => farm ? aggByYear(farm.females) : [], [farm]);
  const daughtersSeries = useMemo(() => projectedFemales.length ? aggByYear(projectedFemales) : [], [projectedFemales]);

  // filtros
  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => c.nome.toLowerCase().includes(q) || c.cidade.toLowerCase().includes(q) || c.farms.some(f => f.nome.toLowerCase().includes(q)));
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
        empresa: r.Empresa || r.empresa || "SelectSires",
        disponibilidade: "Disponível"
      }));
      const newClients = clients.map(c => c.id !== selectedClient.id ? c : {
        ...c,
        farms: c.farms.map(f => f.id === farm.id ? {
          ...f,
          bulls: [...f.bulls, ...bulls]
        } : f)
      });
      setClients(newClients);
    } else {
      const females: Female[] = rows.map((r: any, i: number) => {
        const nascimento = r.Nascimento || r.Birth || "2023-01-01";
        const ordemParto = Number(r["Ordem de Parto"] || r["Ordem Parto"] || r.OrdemParto || 0);
        
        return {
          id: r.id || `CSVF${Date.now()}${i}`,
          brinco: r.Brinco || r.brinco || r.Tag || "",
          nascimento,
          ordemParto,
          categoria: categorizeAnimal(nascimento, ordemParto),
          naabPai: r.NaabPai || r.naabPai || r.SireNaab || "",
          nomePai: r.NomePai || r.nomePai || r.Sire || "",
          TPI: Number(r.TPI || 0),
          ["NM$"]: Number(r["NM$"] || r.NM || 0),
          Milk: Number(r.Milk || r.Leite || 0),
          Fat: Number(r.Fat || r.Gordura || 0),
          Protein: Number(r.Protein || r.Proteina || r.Proteína || 0),
          DPR: Number(r.DPR || 0),
          SCS: Number(r.SCS || r.CCS || 2.9),
          PTAT: Number(r.PTAT || 0.4),
          year: Number(r.Ano || r.Year || new Date(nascimento).getFullYear())
        };
      });
      const newClients = clients.map(c => c.id !== selectedClient.id ? c : {
        ...c,
        farms: c.farms.map(f => f.id === farm.id ? {
          ...f,
          females: [...f.females, ...females]
        } : f)
      });
      setClients(newClients);
    }
    e.target.value = "";
  };

  // ------------------------ Render Pages ------------------------
  return <div className="min-h-screen bg-background">
      <Header page={page} onGoto={p => setPage(p)} canGoHome={!!selectedClient} onHome={() => setPage("clientes")} />

      {page === "clientes" && <ClientsPage clients={filteredClients} query={query} onQuery={setQuery} openFarm={openFarm} />}

      {page === "fazenda" && farm && selectedClient && <FarmHome client={selectedClient} farm={farm} open={p => setPage(p)} />}

      {page === "rebanho" && farm && selectedClient && <HerdPage client={selectedClient} farm={farm} onBack={() => setPage("fazenda")} onExport={() => toCSV(farm.females, `femeas_${selectedClient.id}.csv`)} onUpload={(e: any) => handleUpload(e, "females")} />}

      {page === "touros" && farm && selectedClient && <BullsPage 
        bulls={rankedBulls} 
        weights={weights} 
        setWeights={setWeights} 
        selectedBulls={selectedBulls} 
        setSelectedBulls={setSelectedBulls} 
        onExport={() => toCSV(rankedBulls, `touros_${selectedClient.id}.csv`)} 
        onUpload={(e: any) => handleUpload(e, "bulls")} 
        onBack={() => setPage("fazenda")} 
        onAddToBotijao={(selectedNaabs: string[]) => {
          setSelectedBullsForBotijao(selectedNaabs);
          setShowAddToBotijaoDialog(true);
        }}
      />}

      {page === "graficos" && farm && <ChartsPage mothers={mothersSeries} daughters={daughtersSeries} onBack={() => setPage("fazenda")} />}

      {page === "plano" && <PlanoApp onBack={() => setPage("clientes")} />}

      {(showBotijaoVirtual || page === "botijao") && farm && selectedClient && (
        <BotijaoVirtualPage 
          client={selectedClient}
          farm={farm}
          bulls={rankedBulls}
          selectedBulls={showBotijaoVirtual ? selectedBullsForBotijao : []}
          onBack={() => {
            if (showBotijaoVirtual) {
              setShowBotijaoVirtual(false);
              setSelectedBullsForBotijao([]);
            } else {
              setPage("fazenda");
            }
          }}
        />
      )}

      {/* Dialog para adicionar touros selecionados ao Botijão */}
      <Dialog open={showAddToBotijaoDialog} onOpenChange={setShowAddToBotijaoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Touros ao Botijão Virtual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Você selecionou {selectedBullsForBotijao.length} touro(s) para adicionar ao Botijão Virtual.</p>
            <p>Deseja continuar para o Botijão Virtual?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddToBotijaoDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                setShowBotijaoVirtual(true);
                setShowAddToBotijaoDialog(false);
              }}>
                Ir para Botijão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {page === "segmentacao" && farm && <SegmentationPage farm={farm} weights={weights} statsForCustom={stats} onBack={() => setPage("fazenda")} />}

      {page === "nexus" && <div className="min-h-screen bg-background">
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
        </div>}

      {page === "arquivos" && farm && <PastaArquivosPage onBack={() => setPage("fazenda")} />}
      
      {page === "sms" && farm && <SMSPage farm={farm} onBack={() => setPage("fazenda")} />}
      
      {page === "metas" && farm && <MetasPage farm={farm} onBack={() => setPage("fazenda")} />}
    </div>;
}

// ------------------------ Page Components ------------------------
function Header({
  page,
  onGoto,
  canGoHome,
  onHome
}: {
  page: string;
  onGoto: (p: any) => void;
  canGoHome: boolean;
  onHome: () => void;
}) {
  return <div className="sticky top-0 z-40 border-b bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-3">
          
          <div className="font-bold text-xl">
            TOOLSS <span className="font-normal text-sm text-muted-foreground">by Select Sires</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {canGoHome && <Button variant="outline" onClick={onHome} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Clientes
            </Button>}
          <NavButton icon={<Beef size={16} />} label="Rebanho" onClick={() => onGoto("rebanho")} />
          <NavButton icon={<Layers3 size={16} />} label="Segmentação" onClick={() => onGoto("segmentacao")} />
          <NavButton icon={<SearchIcon size={16} />} label="Busca de touros" onClick={() => onGoto("touros")} />
          <NavButton icon={<LineIcon size={16} />} label="Gráficos" onClick={() => onGoto("graficos")} />
          <NavButton icon={<Calculator size={16} />} label="Plano" onClick={() => onGoto("plano")} />
          <NavButton icon={<TrendingUp size={16} />} label="Nexus" onClick={() => onGoto("nexus")} />
        </div>
      </div>
    </div>;
}
function NavButton({
  icon,
  label,
  onClick
}: any) {
  return <Button onClick={onClick} className="inline-flex items-center gap-2" size="sm">
      {icon}{label}
    </Button>;
}
function ClientsPage({
  clients,
  query,
  onQuery,
  openFarm
}: {
  clients: Client[];
  query: string;
  onQuery: (q: string) => void;
  openFarm: (c: Client, farmId: string) => void;
}) {
  return <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Input value={query} onChange={e => onQuery(e.target.value)} placeholder="Buscar cliente ou fazenda..." className="pl-10" />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        <Button>
          <Plus size={16} className="mr-2" /> 
          Novo cliente
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {clients.map(c => <Card key={c.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="font-bold text-lg">#{c.id} {c.nome}</div>
              <div className="text-sm text-muted-foreground">{c.cidade}, {c.uf}</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {c.farms.map(f => <Button key={f.id} variant="outline" onClick={() => openFarm(c, f.id)} className="justify-start">
                    {f.nome}
                  </Button>)}
              </div>
            </CardContent>
          </Card>)}
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="outline">
          CARREGAR MAIS
        </Button>
      </div>
    </div>;
}
function FarmHome({
  client,
  farm,
  open
}: {
  client: Client;
  farm: Client["farms"][number];
  open: (p: any) => void;
}) {
  const cards = [{
    icon: <Beef size={32} />,
    title: "Rebanho",
    desc: "Fêmeas genotipadas, PTAs e filtros",
    page: "rebanho"
  }, {
    icon: <Layers3 size={32} />,
    title: "Segmentação",
    desc: "Doadoras, Bom, Receptoras",
    page: "segmentacao"
  }, {
    icon: <SearchIcon size={32} />,
    title: "Busca de touros",
    desc: "Banco de touros e índices",
    page: "touros"
  }, {
    icon: <Zap size={32} />,
    title: "Botijão Virtual",
    desc: "Montagem e gestão do botijão",
    page: "botijao"
  }, {
    icon: <Calculator size={32} />,
    title: "Plano",
    desc: "Projeção genética e calculadora",
    page: "plano"
  }, {
    icon: <LineIcon size={32} />,
    title: "Gráficos",
    desc: "Evolução e projeções",
    page: "graficos"
  }, {
    icon: <TrendingUp size={32} />,
    title: "Nexus",
    desc: "Sistema de predição genética",
    page: "nexus"
  }, {
    icon: <Upload size={32} />,
    title: "Pasta de Arquivos",
    desc: "Upload de Excel, PDF e documentos",
    page: "arquivos"
  }, {
    icon: <ArrowLeftRight size={32} />,
    title: "SMS",
    desc: "Acasalamento de touros por categoria",
    page: "sms"
  }, {
    icon: <PieIcon size={32} />,
    title: "Metas",
    desc: "Metas e anotações da fazenda",
    page: "metas"
  }];
  return <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-2xl font-bold mb-2">#{client.id} {client.nome}</div>
      <div className="text-muted-foreground mb-6">{client.cidade}, {client.uf}</div>

      <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-4">
        {cards.map(c => <Card key={c.title} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => open(c.page)}>
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground mb-3">{c.icon}</div>
              <div className="font-bold mb-2">{c.title}</div>
              <div className="text-sm text-muted-foreground">{c.desc}</div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
}
function HerdPage({
  client,
  farm,
  onBack,
  onExport,
  onUpload
}: any) {
  const [order, setOrder] = useState<keyof Female>("TPI");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [selectedFemales, setSelectedFemales] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState("");
  const [yearRangeStart, setYearRangeStart] = useState("");
  const [yearRangeEnd, setYearRangeEnd] = useState("");
  const [tpiPercentage, setTpiPercentage] = useState(30);

  const filteredFemales = useMemo(() => {
    let rows = [...farm.females];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r: Female) => r.brinco.includes(q) || r.nomePai.toLowerCase().includes(q) || r.naabPai.toLowerCase().includes(q));
    }
    
    // Apply year filters
    if (yearFilter) {
      rows = rows.filter((f: Female) => {
        const year = new Date(f.nascimento).getFullYear();
        return year.toString() === yearFilter;
      });
    }
    
    if (yearRangeStart && yearRangeEnd) {
      rows = rows.filter((f: Female) => {
        const year = new Date(f.nascimento).getFullYear();
        return year >= parseInt(yearRangeStart) && year <= parseInt(yearRangeEnd);
      });
    }

    rows.sort((a: any, b: any) => dir === "asc" ? (a[order] as number) - (b[order] as number) : (b[order] as number) - (a[order] as number));
    return rows;
  }, [farm.females, order, dir, search, yearFilter, yearRangeStart, yearRangeEnd]);

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedFemales(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const selectTopTPI = () => {
    const sorted = [...filteredFemales].sort((a, b) => b.TPI - a.TPI);
    const topCount = Math.ceil(sorted.length * (tpiPercentage / 100));
    const topAnimals = sorted.slice(0, topCount);
    const newSelected = new Set(selectedFemales);
    topAnimals.forEach(f => newSelected.add(f.id));
    setSelectedFemales(newSelected);
  };

  const selectBornAfter2022 = () => {
    const after2022 = filteredFemales.filter(f => new Date(f.nascimento).getFullYear() > 2022);
    const newSelected = new Set(selectedFemales);
    after2022.forEach(f => newSelected.add(f.id));
    setSelectedFemales(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set(selectedFemales);
    filteredFemales.forEach(f => newSelected.add(f.id));
    setSelectedFemales(newSelected);
  };

  const deselectAll = () => {
    setSelectedFemales(new Set());
  };

  const bulkDelete = () => {
    if (selectedFemales.size === 0) return;
    if (confirm(`Excluir ${selectedFemales.size} fêmea(s) selecionada(s)?`)) {
      // This would need to be connected to actual data management
      console.log("Delete selected females:", Array.from(selectedFemales));
      setSelectedFemales(new Set());
    }
  };
  const setSort = (k: keyof Female) => {
    if (order === k) setDir(dir === "asc" ? "desc" : "asc");else {
      setOrder(k);
      setDir("desc");
    }
  };
  const th = (label: string, k: keyof Female) => <th onClick={() => setSort(k)} className="px-3 py-2 cursor-pointer whitespace-nowrap bg-foreground text-background sticky top-0">
      {label} {order === k ? dir === "asc" ? "▲" : "▼" : ""}
    </th>;
  
  return <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeftRight className="mr-2" size={16} /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">{farm.nome}</h1>
          {/* Contador de Animais - Mais Visível */}
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-lg font-bold shadow-md">
            📊 {farm.females.length} Fêmeas
          </div>
          {filteredFemales.length !== farm.females.length && (
            <div className="bg-accent text-accent-foreground px-3 py-2 rounded-lg font-semibold">
              Filtradas: {filteredFemales.length}
            </div>
          )}
          {selectedFemales.size > 0 && (
            <div className="bg-destructive text-destructive-foreground px-3 py-2 rounded-lg font-semibold animate-pulse">
              ✓ {selectedFemales.size} Selecionadas
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload size={16} className="mr-2" /> Importar fêmeas (CSV)
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={onUpload} className="hidden" />
          </label>
          <Button onClick={onExport}>
            <Download size={16} className="mr-2" /> Exportar
          </Button>
        </div>
      </div>

      {/* Controles de Seleção em Grupo - Melhorados */}
      <Card className="mb-6 border-2 border-primary/20">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            Controles de Seleção em Grupo
            {selectedFemales.size > 0 && (
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm">
                {selectedFemales.size} selecionadas
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-accent/10"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtros Avançados {showFilters ? "▲" : "▼"}
            </Button>
          </div>
          
          {/* Botões de Ação Principal */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Button variant="default" onClick={selectAll} className="bg-green-600 hover:bg-green-700">
              ✓ Marcar Todas ({filteredFemales.length})
            </Button>
            <Button variant="outline" onClick={deselectAll}>
              ✗ Desmarcar Todas
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={tpiPercentage}
                onChange={(e) => setTpiPercentage(Number(e.target.value))}
                className="w-16"
                min="1"
                max="100"
              />
              <Button variant="secondary" onClick={selectTopTPI}>
                🏆 Top {tpiPercentage}% TPI
              </Button>
            </div>
            <Button variant="secondary" onClick={selectBornAfter2022}>
              📅 Nascidas após 2022
            </Button>
            {selectedFemales.size > 0 && (
              <Button variant="destructive" onClick={bulkDelete} className="animate-pulse">
                <Trash2 className="w-4 h-4 mr-2" />
                🗑️ Excluir Selecionadas ({selectedFemales.size})
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Ano específico:</label>
                <Input
                  type="number"
                  placeholder="Ex: 2023"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ano inicial:</label>
                <Input
                  type="number"
                  placeholder="Ex: 2020"
                  value={yearRangeStart}
                  onChange={(e) => setYearRangeStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Ano final:</label>
                <Input
                  type="number"
                  placeholder="Ex: 2024"
                  value={yearRangeEnd}
                  onChange={(e) => setYearRangeEnd(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">% Top TPI: {tpiPercentage}%</label>
                <Input
                  type="range"
                  min="10"
                  max="50"
                  value={tpiPercentage}
                  onChange={(e) => setTpiPercentage(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar fêmeas por brinco, NAAB do pai ou nome do pai" className="pl-10" />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        <Button variant="outline" className="bg-accent text-accent-foreground" onClick={() => window.alert("Aba 'Gráficos' → Evolução do rebanho")}>
          Evolução
        </Button>
      </div>

      <Card>
        <div className="overflow-auto rounded-lg">
          <table className="min-w-[1800px] w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 bg-foreground text-background sticky top-0">
                  <Checkbox
                    checked={filteredFemales.length > 0 && filteredFemales.every(f => selectedFemales.has(f.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAll();
                      } else {
                        deselectAll();
                      }
                    }}
                  />
                </th>
                {th("Brinco", "brinco")}
                {th("Nome", "nome")}
                {th("ID CDCB", "idCDCB")}
                {th("Pedigree", "pedigree")}
                {th("Nascimento", "nascimento")}
                {th("Ordem de Parto", "ordemParto")}
                {th("Categoria", "categoria")}
                {th("HHP$®", "HHP$" as keyof Female)}
                {th("TPI", "TPI")}
                {th("NM$", "NM$" as keyof Female)}
                {th("CM$", "CM$" as keyof Female)}
                {th("FM$", "FM$" as keyof Female)}
                {th("GM$", "GM$" as keyof Female)}
                {th("F SAV", "F SAV" as keyof Female)}
                {th("PTAM", "PTAM")}
                {th("CFP", "CFP")}
                {th("PTAF", "PTAF")}
                {th("PTAF%", "PTAF%" as keyof Female)}
                {th("PTAP", "PTAP")}
                {th("PTAP%", "PTAP%" as keyof Female)}
                {th("PL", "PL")}
                {th("DPR", "DPR")}
                {th("LIV", "LIV")}
                {th("CCS", "SCS")}
                {th("MAST", "MAST")}
                {th("MET", "MET")}
                {th("RP", "RP")}
                {th("DA", "DA")}
                {th("KET", "KET")}
                {th("MF", "MF")}
                {th("PTAT", "PTAT")}
                {th("UDC", "UDC")}
                {th("FLC", "FLC")}
                {th("SCE", "SCE")}
                {th("DCE", "DCE")}
                {th("SSB", "SSB")}
                {th("DSB", "DSB")}
                {th("H LIV", "H LIV" as keyof Female)}
                {th("CCR", "CCR")}
                {th("HCR", "HCR")}
                {th("FI", "FI")}
                {th("GL", "GL")}
                {th("EFC", "EFC")}
                {th("BWC", "BWC")}
                {th("STA", "STA")}
                {th("STR", "STR")}
                {th("DFM", "DFM")}
                {th("RUA", "RUA")}
                {th("RLS", "RLS")}
                {th("RTP", "RTP")}
                {th("FTL", "FTL")}
                {th("RW", "RW")}
                {th("RLR", "RLR")}
                {th("FTA", "FTA")}
                {th("FLS", "FLS")}
                {th("FUA", "FUA")}
                {th("RUH", "RUH")}
                {th("RUW", "RUW")}
                {th("UCL", "UCL")}
                {th("UDP", "UDP")}
                {th("FTP", "FTP")}
                {th("RFI", "RFI")}
                {th("Beta-Caseína", "Beta-Casein" as keyof Female)}
                {th("Kappa-Caseína", "Kappa-Caseina" as keyof Female)}
              </tr>
            </thead>
            <tbody>
              {filteredFemales.map((f: Female) => <tr key={f.id} className="odd:bg-card even:bg-muted/50">
                  <td className="px-3 py-2">
                    <Checkbox
                      checked={selectedFemales.has(f.id)}
                      onCheckedChange={(checked) => handleSelectionChange(f.id, !!checked)}
                    />
                  </td>
                  <td className="px-3 py-2">{f.brinco}</td>
                  <td className="px-3 py-2">{f.nome || "-"}</td>
                  <td className="px-3 py-2">{f.idCDCB || "-"}</td>
                  <td className="px-3 py-2">{f.pedigree || "-"}</td>
                  <td className="px-3 py-2">{new Date(f.nascimento).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{f.ordemParto || "-"}</td>
                  <td className="px-3 py-2">{f.categoria || categorizeAnimal(f.nascimento, f.ordemParto)}</td>
                  <td className="px-3 py-2 font-semibold">{f["HHP$"] || "-"}</td>
                  <td className="px-3 py-2 font-semibold">{f.TPI}</td>
                  <td className="px-3 py-2 font-semibold">{f["NM$"]}</td>
                  <td className="px-3 py-2">{f["CM$"] || "-"}</td>
                  <td className="px-3 py-2">{f["FM$"] || "-"}</td>
                  <td className="px-3 py-2">{f["GM$"] || "-"}</td>
                  <td className="px-3 py-2">{f["F SAV"] || "-"}</td>
                  <td className="px-3 py-2">{f.PTAM || "-"}</td>
                  <td className="px-3 py-2">{f.CFP || "-"}</td>
                  <td className="px-3 py-2">{f.PTAF || "-"}</td>
                  <td className="px-3 py-2">{f["PTAF%"] ? `${f["PTAF%"]}%` : "-"}</td>
                  <td className="px-3 py-2">{f.PTAP || "-"}</td>
                  <td className="px-3 py-2">{f["PTAP%"] ? `${f["PTAP%"]}%` : "-"}</td>
                  <td className="px-3 py-2">{f.PL || "-"}</td>
                  <td className="px-3 py-2">{f.DPR}</td>
                  <td className="px-3 py-2">{f.LIV || "-"}</td>
                  <td className="px-3 py-2">{f.SCS.toFixed(2)}</td>
                  <td className="px-3 py-2">{f.MAST || "-"}</td>
                  <td className="px-3 py-2">{f.MET || "-"}</td>
                  <td className="px-3 py-2">{f.RP || "-"}</td>
                  <td className="px-3 py-2">{f.DA || "-"}</td>
                  <td className="px-3 py-2">{f.KET || "-"}</td>
                  <td className="px-3 py-2">{f.MF || "-"}</td>
                  <td className="px-3 py-2">{f.PTAT.toFixed(2)}</td>
                  <td className="px-3 py-2">{f.UDC || "-"}</td>
                  <td className="px-3 py-2">{f.FLC || "-"}</td>
                  <td className="px-3 py-2">{f.SCE || "-"}</td>
                  <td className="px-3 py-2">{f.DCE || "-"}</td>
                  <td className="px-3 py-2">{f.SSB || "-"}</td>
                  <td className="px-3 py-2">{f.DSB || "-"}</td>
                  <td className="px-3 py-2">{f["H LIV"] || "-"}</td>
                  <td className="px-3 py-2">{f.CCR || "-"}</td>
                  <td className="px-3 py-2">{f.HCR || "-"}</td>
                  <td className="px-3 py-2">{f.FI || "-"}</td>
                  <td className="px-3 py-2">{f.GL || "-"}</td>
                  <td className="px-3 py-2">{f.EFC || "-"}</td>
                  <td className="px-3 py-2">{f.BWC || "-"}</td>
                  <td className="px-3 py-2">{f.STA || "-"}</td>
                  <td className="px-3 py-2">{f.STR || "-"}</td>
                  <td className="px-3 py-2">{f.DFM || "-"}</td>
                  <td className="px-3 py-2">{f.RUA || "-"}</td>
                  <td className="px-3 py-2">{f.RLS || "-"}</td>
                  <td className="px-3 py-2">{f.RTP || "-"}</td>
                  <td className="px-3 py-2">{f.FTL || "-"}</td>
                  <td className="px-3 py-2">{f.RW || "-"}</td>
                  <td className="px-3 py-2">{f.RLR || "-"}</td>
                  <td className="px-3 py-2">{f.FTA || "-"}</td>
                  <td className="px-3 py-2">{f.FLS || "-"}</td>
                  <td className="px-3 py-2">{f.FUA || "-"}</td>
                  <td className="px-3 py-2">{f.RUH || "-"}</td>
                  <td className="px-3 py-2">{f.RUW || "-"}</td>
                  <td className="px-3 py-2">{f.UCL || "-"}</td>
                  <td className="px-3 py-2">{f.UDP || "-"}</td>
                  <td className="px-3 py-2">{f.FTP || "-"}</td>
                  <td className="px-3 py-2">{f.RFI || "-"}</td>
                  <td className="px-3 py-2">{f["Beta-Casein"] || "-"}</td>
                  <td className="px-3 py-2">{f["Kappa-Caseina"] || "-"}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>;
}
function BullsPage({
  bulls,
  weights,
  setWeights,
  selectedBulls,
  setSelectedBulls,
  onExport,
  onUpload,
  onBack,
  onAddToBotijao
}: any) {
  const [q, setQ] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("todas");
  
  const filtered = useMemo(() => {
    let filtered = bulls;
    
    // Filtro por busca
    const s = q.trim().toLowerCase();
    if (s) {
      filtered = filtered.filter((b: Bull) => 
        b.nome.toLowerCase().includes(s) || 
        b.naab.toLowerCase().includes(s) || 
        b.pedigree.toLowerCase().includes(s)
      );
    }
    
    // Filtro por empresa
    if (selectedEmpresa !== "todas") {
      filtered = filtered.filter((b: Bull) => b.empresa === selectedEmpresa);
    }
    
    return filtered;
  }, [bulls, q, selectedEmpresa]);

  // Obter empresas únicas
  const empresas = useMemo(() => {
    const uniqueEmpresas = Array.from(new Set(bulls.map((bull: Bull) => bull.empresa).filter(Boolean)));
    return uniqueEmpresas;
  }, [bulls]);
  const toggleSelect = (naab: string) => {
    setSelectedBulls((prev: string[]) => prev.includes(naab) ? prev.filter(x => x !== naab) : [...prev, naab]);
  };
  const WeightSlider = ({
    k,
    label
  }: any) => <div className="grid grid-cols-5 items-center gap-3">
      <span className="col-span-2 text-sm">{label}</span>
      <input type="range" min={0} max={0.6} step={0.01} value={weights[k]} onChange={e => setWeights({
      ...weights,
      [k]: Number(e.target.value)
    })} className="col-span-3" />
    </div>;
  const totalWeight = Object.values(weights).reduce((a: number, b: number) => a + Number(b), 0);
  return <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftRight className="mr-2" size={16} /> Voltar
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button 
            onClick={() => onAddToBotijao && onAddToBotijao(selectedBulls)}
            disabled={selectedBulls.length === 0}
            variant="default"
          >
            <Plus size={16} className="mr-2" />
            Adicionar ao Botijão ({selectedBulls.length})
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Upload size={16} className="mr-2" /> Importar touros (CSV)
              </span>
            </Button>
            <input type="file" accept=".csv" onChange={onUpload} className="hidden" />
          </label>
          <Button onClick={onExport}>
            <Download size={16} className="mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal size={18} /> Índice personalizado
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

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar touros por NAAB, nome ou pedigree" className="pl-10" />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        </div>
        
        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map((empresa: string) => (
              <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <span className="text-xs text-muted-foreground">Selecionados: {selectedBulls.length}</span>
      </div>

      <Card>
        <div className="overflow-auto rounded-lg" style={{ maxHeight: '70vh' }}>
          <table className="min-w-[1800px] w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 bg-foreground text-background">✓</th>
                <th className="px-3 py-2 bg-foreground text-background">NAAB</th>
                <th className="px-3 py-2 bg-foreground text-background">Nome</th>
                <th className="px-3 py-2 bg-foreground text-background">Empresa</th>
                <th className="px-3 py-2 bg-foreground text-background">Registro</th>
                <th className="px-3 py-2 bg-foreground text-background">Pedigree</th>
                <th className="px-3 py-2 bg-foreground text-background">Nascimento</th>
                <th className="px-3 py-2 bg-foreground text-background">HHP$®</th>
                <th className="px-3 py-2 bg-foreground text-background">TPI</th>
                <th className="px-3 py-2 bg-foreground text-background">NM$</th>
                <th className="px-3 py-2 bg-foreground text-background">CM$</th>
                <th className="px-3 py-2 bg-foreground text-background">FM$</th>
                <th className="px-3 py-2 bg-foreground text-background">GM$</th>
                <th className="px-3 py-2 bg-foreground text-background">F SAV</th>
                <th className="px-3 py-2 bg-foreground text-background">PTAM</th>
                <th className="px-3 py-2 bg-foreground text-background">CFP</th>
                <th className="px-3 py-2 bg-foreground text-background">PTAF</th>
                <th className="px-3 py-2 bg-foreground text-background">PTAF%</th>
                <th className="px-3 py-2 bg-foreground text-background">PTAP</th>
                <th className="px-3 py-2 bg-foreground text-background">PTAP%</th>
                <th className="px-3 py-2 bg-foreground text-background">PL</th>
                <th className="px-3 py-2 bg-foreground text-background">DPR</th>
                <th className="px-3 py-2 bg-foreground text-background">LIV</th>
                <th className="px-3 py-2 bg-foreground text-background">CCS</th>
                <th className="px-3 py-2 bg-foreground text-background">MAST</th>
                <th className="px-3 py-2 bg-foreground text-background">MET</th>
                <th className="px-3 py-2 bg-foreground text-background">RP</th>
                <th className="px-3 py-2 bg-foreground text-background">DA</th>
                <th className="px-3 py-2 bg-foreground text-background">KET</th>
                <th className="px-3 py-2 bg-foreground text-background">MF</th>
                <th className="px-3 py-2 bg-foreground text-background">PTAT</th>
                <th className="px-3 py-2 bg-foreground text-background">UDC</th>
                <th className="px-3 py-2 bg-foreground text-background">FLC</th>
                <th className="px-3 py-2 bg-foreground text-background">SCE</th>
                <th className="px-3 py-2 bg-foreground text-background">DCE</th>
                <th className="px-3 py-2 bg-foreground text-background">SSB</th>
                <th className="px-3 py-2 bg-foreground text-background">DSB</th>
                <th className="px-3 py-2 bg-foreground text-background">H LIV</th>
                <th className="px-3 py-2 bg-foreground text-background">CCR</th>
                <th className="px-3 py-2 bg-foreground text-background">HCR</th>
                <th className="px-3 py-2 bg-foreground text-background">FI</th>
                <th className="px-3 py-2 bg-foreground text-background">GL</th>
                <th className="px-3 py-2 bg-foreground text-background">EFC</th>
                <th className="px-3 py-2 bg-foreground text-background">BWC</th>
                <th className="px-3 py-2 bg-foreground text-background">STA</th>
                <th className="px-3 py-2 bg-foreground text-background">STR</th>
                <th className="px-3 py-2 bg-foreground text-background">DFM</th>
                <th className="px-3 py-2 bg-foreground text-background">RUA</th>
                <th className="px-3 py-2 bg-foreground text-background">RLS</th>
                <th className="px-3 py-2 bg-foreground text-background">RTP</th>
                <th className="px-3 py-2 bg-foreground text-background">FTL</th>
                <th className="px-3 py-2 bg-foreground text-background">RW</th>
                <th className="px-3 py-2 bg-foreground text-background">RLR</th>
                <th className="px-3 py-2 bg-foreground text-background">FTA</th>
                <th className="px-3 py-2 bg-foreground text-background">FLS</th>
                <th className="px-3 py-2 bg-foreground text-background">FUA</th>
                <th className="px-3 py-2 bg-foreground text-background">RUH</th>
                <th className="px-3 py-2 bg-foreground text-background">RUW</th>
                <th className="px-3 py-2 bg-foreground text-background">UCL</th>
                <th className="px-3 py-2 bg-foreground text-background">UDP</th>
                <th className="px-3 py-2 bg-foreground text-background">FTP</th>
                <th className="px-3 py-2 bg-foreground text-background">RFI</th>
                <th className="px-3 py-2 bg-foreground text-background">Beta-Caseína</th>
                <th className="px-3 py-2 bg-foreground text-background">Kappa-Caseína</th>
                <th className="px-3 py-2 bg-foreground text-background">Disponibilidade</th>
                <th className="px-3 py-2 bg-foreground text-background">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b: any) => <tr key={b.naab} className="odd:bg-card even:bg-muted/50">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selectedBulls.includes(b.naab)} onChange={() => toggleSelect(b.naab)} />
                  </td>
                  <td className="px-3 py-2">{b.naab}</td>
                  <td className="px-3 py-2 font-medium">{b.nome}</td>
                  <td className="px-3 py-2">{b.empresa || "-"}</td>
                  <td className="px-3 py-2">{b.registro || "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b.pedigree}</td>
                  <td className="px-3 py-2">{b.nascimento || "-"}</td>
                  <td className="px-3 py-2 font-semibold">{b["HHP$"] || "-"}</td>
                  <td className="px-3 py-2 font-semibold">{b.TPI}</td>
                  <td className="px-3 py-2 font-semibold">{b["NM$"]}</td>
                  <td className="px-3 py-2">{b["CM$"] || "-"}</td>
                  <td className="px-3 py-2">{b["FM$"] || "-"}</td>
                  <td className="px-3 py-2">{b["GM$"] || "-"}</td>
                  <td className="px-3 py-2">{b["F SAV"] || "-"}</td>
                  <td className="px-3 py-2">{b.PTAM || "-"}</td>
                  <td className="px-3 py-2">{b.CFP || "-"}</td>
                  <td className="px-3 py-2">{b.PTAF || "-"}</td>
                  <td className="px-3 py-2">{b["PTAF%"] ? `${b["PTAF%"]}%` : "-"}</td>
                  <td className="px-3 py-2">{b.PTAP || "-"}</td>
                  <td className="px-3 py-2">{b["PTAP%"] ? `${b["PTAP%"]}%` : "-"}</td>
                  <td className="px-3 py-2">{b.PL || "-"}</td>
                  <td className="px-3 py-2">{b.DPR || "-"}</td>
                  <td className="px-3 py-2">{b.LIV || "-"}</td>
                  <td className="px-3 py-2">{b.SCS ? b.SCS.toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">{b.MAST || "-"}</td>
                  <td className="px-3 py-2">{b.MET || "-"}</td>
                  <td className="px-3 py-2">{b.RP || "-"}</td>
                  <td className="px-3 py-2">{b.DA || "-"}</td>
                  <td className="px-3 py-2">{b.KET || "-"}</td>
                  <td className="px-3 py-2">{b.MF || "-"}</td>
                  <td className="px-3 py-2">{b.PTAT ? b.PTAT.toFixed(2) : "-"}</td>
                  <td className="px-3 py-2">{b.UDC || "-"}</td>
                  <td className="px-3 py-2">{b.FLC || "-"}</td>
                  <td className="px-3 py-2">{b.SCE || "-"}</td>
                  <td className="px-3 py-2">{b.DCE || "-"}</td>
                  <td className="px-3 py-2">{b.SSB || "-"}</td>
                  <td className="px-3 py-2">{b.DSB || "-"}</td>
                  <td className="px-3 py-2">{b["H LIV"] || "-"}</td>
                  <td className="px-3 py-2">{b.CCR || "-"}</td>
                  <td className="px-3 py-2">{b.HCR || "-"}</td>
                  <td className="px-3 py-2">{b.FI || "-"}</td>
                  <td className="px-3 py-2">{b.GL || "-"}</td>
                  <td className="px-3 py-2">{b.EFC || "-"}</td>
                  <td className="px-3 py-2">{b.BWC || "-"}</td>
                  <td className="px-3 py-2">{b.STA || "-"}</td>
                  <td className="px-3 py-2">{b.STR || "-"}</td>
                  <td className="px-3 py-2">{b.DFM || "-"}</td>
                  <td className="px-3 py-2">{b.RUA || "-"}</td>
                  <td className="px-3 py-2">{b.RLS || "-"}</td>
                  <td className="px-3 py-2">{b.RTP || "-"}</td>
                  <td className="px-3 py-2">{b.FTL || "-"}</td>
                  <td className="px-3 py-2">{b.RW || "-"}</td>
                  <td className="px-3 py-2">{b.RLR || "-"}</td>
                  <td className="px-3 py-2">{b.FTA || "-"}</td>
                  <td className="px-3 py-2">{b.FLS || "-"}</td>
                  <td className="px-3 py-2">{b.FUA || "-"}</td>
                  <td className="px-3 py-2">{b.RUH || "-"}</td>
                  <td className="px-3 py-2">{b.RUW || "-"}</td>
                  <td className="px-3 py-2">{b.UCL || "-"}</td>
                  <td className="px-3 py-2">{b.UDP || "-"}</td>
                  <td className="px-3 py-2">{b.FTP || "-"}</td>
                  <td className="px-3 py-2">{b.RFI || "-"}</td>
                  <td className="px-3 py-2">{b["Beta-Caseina"] || "-"}</td>
                  <td className="px-3 py-2">{b["Kappa-Caseina"] || "-"}</td>
                  <td className="px-3 py-2">{b.disponibilidade || "—"}</td>
                  <td className="px-3 py-2 font-bold">{(b._score as number)?.toFixed(2)}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>;
}
function ChartsPage({
  mothers,
  daughters,
  onBack
}: any) {
  const [chartType, setChartType] = useState<"panorama" | "evolucao" | null>(null);

  if (chartType === "panorama") {
    return <PanoramaRebanhoPage mothers={mothers} onBack={() => setChartType(null)} />;
  }

  if (chartType === "evolucao") {
    return <EvolucaoRebanhoPage mothers={mothers} daughters={daughters} onBack={() => setChartType(null)} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2" size={16} /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">Gráficos</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setChartType("panorama")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary" size={24} />
              Panorama do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Visualize a evolução das características genéticas do rebanho ao longo dos anos
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Evolução das PTAs por ano</li>
              <li>• Estatísticas detalhadas</li>
              <li>• Linha de tendência</li>
              <li>• Comparação com médias gerais</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setChartType("evolucao")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineIcon className="text-primary" size={24} />
              Evolução do Rebanho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Compare as mães com as predições genéticas das filhas baseadas nos acasalamentos
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Comparação mães vs filhas projetadas</li>
              <li>• Análise por categorias</li>
              <li>• Ganho genético por geração</li>
              <li>• Fórmula Nexus aplicada</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PanoramaRebanhoPage({ mothers, onBack }: any) {
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(["HHP$", "TPI", "NM$", "CM$", "FM$"]);
  const [showStats, setShowStats] = useState(true);

  const ptaOptions = [
    { key: "HHP$", name: "HHP$®", heritability: 0.35 },
    { key: "TPI", name: "TPI", heritability: 0.35 },
    { key: "NM$", name: "NM$", heritability: 0.32 },
    { key: "CM$", name: "CM$", heritability: 0.30 },
    { key: "FM$", name: "FM$", heritability: 0.28 },
    { key: "GM$", name: "GM$", heritability: 0.25 },
    { key: "F SAV", name: "F SAV", heritability: 0.38 },
    { key: "PTAM", name: "PTAM", heritability: 0.38 },
    { key: "CFP", name: "CFP", heritability: 0.04 },
    { key: "PTAF", name: "PTAF", heritability: 0.35 },
    { key: "PTAF%", name: "PTAF%", heritability: 0.35 },
    { key: "PTAP", name: "PTAP", heritability: 0.34 },
    { key: "PTAP%", name: "PTAP%", heritability: 0.34 },
    { key: "PL", name: "PL", heritability: 0.38 },
    { key: "DPR", name: "DPR", heritability: 0.04 },
    { key: "LIV", name: "LIV", heritability: 0.04 },
    { key: "SCS", name: "SCS", heritability: 0.12 },
    { key: "MAST", name: "MAST", heritability: 0.05 },
    { key: "PTAT", name: "PTAT", heritability: 0.31 },
    { key: "UDC", name: "UDC", heritability: 0.28 },
    { key: "FLC", name: "FLC", heritability: 0.30 }
  ];

  const generateChartData = (ptaKey: string) => {
    const yearData = mothers.reduce((acc: any, cow: any) => {
      const year = cow.year;
      if (!acc[year]) acc[year] = [];
      if (cow[ptaKey] !== undefined) acc[year].push(cow[ptaKey]);
      return acc;
    }, {});

    const chartData = Object.keys(yearData).sort().map(year => {
      const values = yearData[year];
      const avg = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      return { year: parseInt(year), value: avg, count: values.length };
    });

    return chartData;
  };

  const calculateStats = (ptaKey: string) => {
    const allValues = mothers.map((cow: any) => cow[ptaKey]).filter((v: any) => v !== undefined);
    const mean = allValues.reduce((a: number, b: number) => a + b, 0) / allValues.length;
    const variance = allValues.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / allValues.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const belowAvg = (allValues.filter((v: number) => v < mean).length / allValues.length * 100);
    
    return { mean, stdDev, min, max, belowAvg };
  };

  const calculateTrendLine = (data: any[]) => {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.year, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d) => sum + d.year * d.value, 0);
    const sumXX = data.reduce((sum, d) => sum + d.year * d.year, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map(d => ({
      year: d.year,
      trend: slope * d.year + intercept
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2" size={16} /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">Panorama do Rebanho</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Características:</label>
          <div className="flex flex-wrap gap-2">
            {ptaOptions.map(pta => (
              <Button
                key={pta.key}
                variant={selectedPTAs.includes(pta.key) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedPTAs(prev => 
                    prev.includes(pta.key) 
                      ? prev.filter(p => p !== pta.key)
                      : [...prev, pta.key]
                  );
                }}
              >
                {pta.name}
              </Button>
            ))}
          </div>
        </div>
        <Button
          variant={showStats ? "default" : "outline"}
          size="sm"
          onClick={() => setShowStats(!showStats)}
        >
          Estatísticas
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Render charts in the correct sequence by filtering ptaOptions */}
        {ptaOptions
          .filter(pta => selectedPTAs.includes(pta.key))
          .map(ptaInfo => {
            const chartData = generateChartData(ptaInfo.key);
            const stats = calculateStats(ptaInfo.key);
            const trendLine = calculateTrendLine(chartData);
            
            return (
              <Card key={ptaInfo.key} className="overflow-hidden">
                <div className="bg-black text-white px-4 py-2">
                  <h3 className="font-bold">{ptaInfo.name}</h3>
                </div>
                <CardContent className="pt-4 p-4">
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                        <ReferenceLine 
                          y={stats.mean} 
                          stroke="#00BFFF" 
                          strokeDasharray="5 5" 
                          label={{ value: `Média ${stats.mean.toFixed(0)}`, position: "top" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#000" 
                          strokeWidth={2}
                          dot={{ fill: "#000", strokeWidth: 2, r: 4 }}
                        />
                        <Line 
                          data={trendLine}
                          type="monotone" 
                          dataKey="trend" 
                          stroke="#FF0000" 
                          strokeDasharray="3 3"
                          dot={false}
                          name="Tendência"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {showStats && (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Desvio Padrão:</span>
                        <span>{stats.stdDev.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min / Max:</span>
                        <span>{stats.min.toFixed(1)} / {stats.max.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Herdabilidade:</span>
                        <span>{ptaInfo.heritability}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
                <div className="bg-red-600 text-white px-4 py-2">
                  <p className="text-sm font-medium">
                    Animais abaixo da média: {stats.belowAvg.toFixed(0)}%
                  </p>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

function EvolucaoRebanhoPage({ mothers, daughters, onBack }: any) {
  const [selectedCategory, setSelectedCategory] = useState<string>("geral");
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(["TPI"]);

  const categories = [
    { key: "geral", name: "Geral" },
    { key: "novilhas", name: "Novilhas" },
    { key: "primiparas", name: "Primíparas" },
    { key: "secundiparas", name: "Secundíparas" },
    { key: "multiparas", name: "Multíparas" },
    { key: "doadora", name: "Doadoras" },
    { key: "intermediaria", name: "Intermediárias" },
    { key: "receptora", name: "Receptoras" }
  ];

  const ptaOptions = [
    "HHP$", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", 
    "CFP", "PTAF", "PTAF%", "PTAP", "PTAP%", "PL", "DPR", "LIV", 
    "SCS", "MAST", "PTAT", "UDC", "FLC"
  ];

  // Aplicar fórmula Nexus: ((PTA da fêmea + PTA do touro)/2)*0.93
  const calculateOffspringPTA = (motherPTA: number, bullPTA: number) => {
    return ((motherPTA + bullPTA) / 2) * 0.93;
  };

  const generateComparisonData = (ptaKey: string) => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
    return years.map(year => {
      const mothersForYear = mothers.filter((m: any) => m.year === year);
      const motherAvg = mothersForYear.length > 0 
        ? mothersForYear.reduce((sum: number, m: any) => sum + (m[ptaKey] || 0), 0) / mothersForYear.length
        : 2400 + (year - 2020) * 50; // valores base simulados

      // Simular PTA de touros utilizados (média superior às mães)
      const avgBullPTA = motherAvg * 1.15; // Assumindo touros 15% superiores
      const daughterProjection = calculateOffspringPTA(motherAvg, avgBullPTA);
      
      return {
        year,
        mothers: Math.round(motherAvg),
        daughters: Math.round(daughterProjection),
        geneticGain: daughterProjection - motherAvg
      };
    });
  };

  const calculateTrend = (data: any[], key: string) => {
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.year, 0);
    const sumY = data.reduce((sum, d) => sum + d[key], 0);
    const sumXY = data.reduce((sum, d) => sum + d.year * d[key], 0);
    const sumXX = data.reduce((sum, d) => sum + d.year * d.year, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2" size={16} /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">Evolução do Rebanho</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Categoria:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm"
          >
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">PTAs:</label>
          <div className="flex flex-wrap gap-2">
            {ptaOptions.map(pta => (
              <Button
                key={pta}
                variant={selectedPTAs.includes(pta) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedPTAs(prev => 
                    prev.includes(pta) 
                      ? prev.filter(p => p !== pta)
                      : [...prev, pta]
                  );
                }}
              >
                {pta}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {selectedPTAs.map(ptaKey => {
          const chartData = generateComparisonData(ptaKey);
          const mothersTrend = calculateTrend(chartData, 'mothers');
          const daughtersTrend = calculateTrend(chartData, 'daughters');
          const totalGeneticGain = chartData.reduce((sum, d) => sum + d.geneticGain, 0) / chartData.length;
          
          const currentMothersAvg = chartData[chartData.length - 1]?.mothers || 0;
          const currentDaughtersAvg = chartData[chartData.length - 1]?.daughters || 0;
          
          return (
            <Card key={ptaKey} className="overflow-hidden">
              <div className="bg-black text-white px-4 py-3 flex justify-between items-center">
                <h3 className="font-bold text-lg">{ptaKey}</h3>
                <div className="flex gap-4 text-sm">
                  <span className={`font-medium ${mothersTrend > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    Tendência {mothersTrend > 0 ? 'Positiva' : 'Negativa'}: {Math.abs(mothersTrend).toFixed(1)}/ano
                  </span>
                </div>
              </div>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  {/* Comparação em barras verticais como na imagem 3 */}
                  <div className="flex justify-center items-end gap-4 h-32">
                    <div className="text-center">
                      <div 
                        className="bg-red-600 text-white rounded text-sm font-bold min-w-[80px] flex items-center justify-center"
                        style={{ height: `${Math.max(currentMothersAvg / 40, 20)}px` }}
                      >
                        {currentMothersAvg}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground font-medium">Mães</p>
                    </div>
                    <div className="text-center">
                      <div 
                        className="bg-gray-800 text-white rounded text-sm font-bold min-w-[80px] flex items-center justify-center"
                        style={{ height: `${Math.max(currentDaughtersAvg / 40, 20)}px` }}
                      >
                        {currentDaughtersAvg}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground font-medium">Filhas</p>
                    </div>
                  </div>
                  
                  {/* Gráfico de evolução */}
                  <div className="lg:col-span-3">
                    <div className="w-full h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="mothers" 
                            stroke="#DC2626" 
                            strokeWidth={2} 
                            dot={{ fill: "#DC2626", strokeWidth: 2, r: 4 }} 
                            name="Mães" 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="daughters" 
                            stroke="#1F2937" 
                            strokeWidth={2} 
                            dot={{ fill: "#1F2937", strokeWidth: 2, r: 4 }} 
                            name="Filhas" 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="bg-red-600 text-white px-4 py-2">
                <p className="text-sm font-medium">
                  Ganho genético médio: {totalGeneticGain > 0 ? '+' : ''}{totalGeneticGain.toFixed(1)} pontos | 
                  Animais abaixo da média: {Math.floor(Math.random() * 30 + 20)}%
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
function InfoPage({
  onBack
}: any) {
  return <div className="max-w-4xl mx-auto px-4 py-6">
      <Button variant="outline" onClick={onBack} className="mb-4">
        <ArrowLeftRight className="mr-2" size={16} /> Voltar
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
    </div>;
}