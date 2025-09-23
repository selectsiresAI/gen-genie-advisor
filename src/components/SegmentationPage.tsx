import React, { useEffect, useMemo, useState } from "react";
import { Download, Settings, Filter, Check, X, RefreshCw, ArrowLeft, TrendingUp, PieChart, BarChart3, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface Farm {
  id: string;
  farm_id: string;
  name: string;
  owner_name: string;
}

interface SegmentationPageProps {
  farm: Farm;
  onBack: () => void;
}

type Female = {
  id: string;
  name: string;
  identifier?: string;
  birth_date?: string;
  parity_order?: number;
  category?: string;
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
  CustomScore?: number;
  Classification?: "Superior" | "Intermediário" | "Inferior";
  __idKey?: string;
  __nameKey?: string;
};

type SegmentationPreset = {
  name: string;
  superior: number;
  intermediario: number;
  inferior: number;
};

type DistributionStats = {
  superior: { count: number; percentage: number };
  intermediario: { count: number; percentage: number };
  inferior: { count: number; percentage: number };
};

// ────────────────────────────────────────────────────────────────────
// Configurações de cor (Select Sires)
// ────────────────────────────────────────────────────────────────────
const SS = {
  red: "#ED1C24",
  black: "#1C1C1C",
  gray: "#D9D9D9",
  white: "#F2F2F2",
  green: "#8DC63F",
};

// ────────────────────────────────────────────────────────────────────
// Lista completa de PTAs (rótulos)
// ────────────────────────────────────────────────────────────────────
const ALL_PTAS = [
  "HHP$®","TPI","NM$","CM$","FM$","GM$","F SAV","PTAM","CFP","PTAF","PTAF%","PTAP","PTAP%","PL","DPR","LIV","SCS","MAST","MET","RP","DA","KET","MF","PTAT","UDC","FLC","SCE","DCE","SSB","DSB","H LIV","CCR","HCR","FI","GL","EFC","BWC","STA","STR","DFM","RUA","RLS","RTP","FTL","RW","RLR","FTA","FLS","FUA","RUH","RUW","UCL","UDP","FTP","RFI","Beta-Casein","Kappa-Casein","GFI"
];

// Alias para chaves (mapeia colunas que vêm com símbolo)
const ALIAS: Record<string, string> = {
  "HHP$®": "hhp_dollar",
  "HHP$": "hhp_dollar",
  "F SAV": "f_sav",
  "H LIV": "h_liv",
  "NM$": "nm_dollar",
  "CM$": "cm_dollar",
  "FM$": "fm_dollar",
  "GM$": "gm_dollar",
  "TPI": "tpi",
  "PTAF%": "ptaf_pct",
  "PTAP%": "ptap_pct",
  "Beta-Casein": "beta_casein",
  "Kappa-Casein": "kappa_casein",
};

// Colunas candidatas a nome/identificação
const NAME_COLS = ["name", "nome", "animal_name", "cow_name", "animal", "ident", "id_animal"];
const ID_COLS = ["id", "animal_id", "brinco", "ear_tag", "cdcb_id", "uuid"];

// Dataset demo (fallback se não houver dados)
const DEMO_ANIMALS: Female[] = [
  { id: "A001", name: "Vaca 001", hhp_dollar: 620, tpi: 2350, nm_dollar: 415, ptam: 1200, ptaf: 50, scs: 2.6, dpr: 1.2 },
  { id: "A002", name: "Vaca 002", hhp_dollar: 590, tpi: 2280, nm_dollar: 380, ptam: 1080, ptaf: 44, scs: 2.9, dpr: -0.1 },
  { id: "A003", name: "Vaca 003", hhp_dollar: 655, tpi: 2425, nm_dollar: 430, ptam: 1305, ptaf: 56, scs: 2.4, dpr: 0.4 },
  { id: "A004", name: "Vaca 004", hhp_dollar: 540, tpi: 2205, nm_dollar: 350, ptam: 980,  ptaf: 40, scs: 3.1, dpr: -0.6 },
  { id: "A005", name: "Vaca 005", hhp_dollar: 605, tpi: 2360, nm_dollar: 405, ptam: 1190, ptaf: 48, scs: 2.7, dpr: 0.8 },
];

// ────────────────────────────────────────────────────────────────────
// Utilitários
// ────────────────────────────────────────────────────────────────────
const getKey = (trait: string): string => ALIAS[trait] ?? trait.toLowerCase().replace(/[^\w]/g, '_');

function toCSV(rows: any[]): string {
  if (!rows || !rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const r of rows) {
    const line = headers.map(h => {
      const v = r[h];
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s}"` : s;
    }).join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  
  try {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return '-';
    
    const formatted = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    return formatted;
  } catch {
    return '-';
  }
}

function getAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '-';
  
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years--;
    }
    
    return `${years}a`;
  } catch {
    return '-';
  }
}

function getAutomaticCategory(birthDate?: string, parityOrder?: number): string {
  if (!birthDate) return 'Indefinida';
  
  const birth = new Date(birthDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  
  // Bezerras - até 90 dias pós nascimento e ordem de parto 0 ou null
  if (daysDiff <= 90 && (!parityOrder || parityOrder === 0)) {
    return 'Bezerra';
  }
  
  // Novilhas - de 91 dias após nascimento até primeiro parto (ordem de parto 0 ou null)
  if (daysDiff > 90 && (!parityOrder || parityOrder === 0)) {
    return 'Novilha';
  }
  
  // Primípara - ordem de parto 1
  if (parityOrder === 1) {
    return 'Primípara';
  }
  
  // Secundípara - ordem de parto 2
  if (parityOrder === 2) {
    return 'Secundípara';
  }
  
  // Multípara - ordem de parto 3 ou maior
  if (parityOrder && parityOrder >= 3) {
    return 'Multípara';
  }
  
  return 'Indefinida';
}

function computeZMeta(list: Female[], traits: string[]) {
  const meta: Record<string, { mu: number; sigma: number }> = {};
  for (const t of traits) {
    const k = getKey(t);
    const vals = list.map(a => Number((a as any)[k])).filter(v => Number.isFinite(v));
    const mu = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    const variance = vals.length ? vals.reduce((s, v) => s + Math.pow(v - mu, 2), 0) / vals.length : 0;
    const sigma = Math.sqrt(variance) || 0;
    meta[t] = { mu, sigma };
  }
  return meta;
}

function normalizeWeights(weights: Record<string, number>) {
  const sum = Object.values(weights).reduce((s, v) => s + (Number(v) || 0), 0);
  if (sum === 0) return { ...weights };
  const out: Record<string, number> = {};
  for (const k of Object.keys(weights)) out[k] = (Number(weights[k]) || 0) / sum;
  return out;
}

function pickFirst(obj: any, candidates: string[], fallback: string): string {
  for (const c of candidates) if (c in obj) return c;
  return fallback;
}

type Gate = {
  trait: string;
  op: string;
  value?: number;
  min?: number;
  max?: number;
  enabled: boolean;
};

// ────────────────────────────────────────────────────────────────────
// Componente principal
// ────────────────────────────────────────────────────────────────────
export default function SegmentationPage({ farm, onBack }: SegmentationPageProps) {
  const [indexSelection, setIndexSelection] = useState<"HHP$" | "TPI" | "NM$" | "Custom">("Custom");

  // Custom state
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedTraits, setSelectedTraits] = useState(["PTAM", "PTAF", "SCS"]);
  const [weights, setWeights] = useState<Record<string, number>>({ PTAM: 0.4, PTAF: 0.4, SCS: -0.2 });
  const [standardize, setStandardize] = useState(true);

  // Segmentation state
  const [segmentationEnabled, setSegmentationEnabled] = useState(false);
  const [superiorPercent, setSuperiorPercent] = useState([20]);
  const [intermediarioPercent, setIntermediarioPercent] = useState([60]);
  const [inferiorPercent, setInferiorPercent] = useState([20]);
  const [segmentationPresets, setSegmentationPresets] = useState<SegmentationPreset[]>([
    { name: "Padrão 20/60/20", superior: 20, intermediario: 60, inferior: 20 },
    { name: "Equilibrado 33/34/33", superior: 33, intermediario: 34, inferior: 33 },
    { name: "Quartis 25/50/25", superior: 25, intermediario: 50, inferior: 25 }
  ]);
  const [newPresetName, setNewPresetName] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<"all" | "Superior" | "Intermediário" | "Inferior">("all");
  const [showChart, setShowChart] = useState(false);

  const [gates, setGates] = useState<Gate[]>([
    { trait: "SCS", op: "<=", value: 2.75, enabled: true },
    { trait: "PTAF", op: ">=", value: 40, enabled: true },
  ]);
  const [gatesPhase, setGatesPhase] = useState<"pre" | "post">("pre");
  const [postGateAction, setPostGateAction] = useState<"zero" | "penalize">("zero");
  const [penalty, setPenalty] = useState(-1000);

  // Dados do rebanho (Supabase → females_denorm)
  const [animals, setAnimals] = useState<Female[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Presets (localStorage)
  const [presets, setPresets] = useState<any[]>([]);
  const [presetName, setPresetName] = useState("");

  // Carrega presets
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem("toolss_custom_index_presets_segment") : null;
      if (raw) setPresets(JSON.parse(raw));
    } catch (_) {}
  }, []);
  
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem("toolss_custom_index_presets_segment", JSON.stringify(presets));
    } catch (_) {}
  }, [presets]);

  // Carrega dados do Supabase
  async function fetchAnimals() {
    setLoading(true); 
    setError("");
    try {
      const { data, error: err } = await supabase
        .rpc('get_females_denorm', { target_farm_id: farm.farm_id })
        .limit(1000);

      if (err) throw err;
      if (!data || !data.length) { 
        setAnimals([]); 
        return; 
      }

      // Mapeia campos id/nome dinâmicos
      const mapped = data.map(row => {
        const idKey = pickFirst(row, ID_COLS, Object.keys(row)[0]);
        const nameKey = pickFirst(row, NAME_COLS, idKey);
        return { __idKey: idKey, __nameKey: nameKey, ...row };
      });
      setAnimals(mapped);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erro ao carregar dados do rebanho');
      setAnimals(DEMO_ANIMALS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    fetchAnimals(); 
  }, [farm.farm_id]);

  // Gates helpers
  function passGate(animal: Female, g: Gate): boolean {
    if (!g.enabled) return true;
    const k = getKey(g.trait);
    const raw = (animal as any)[k];
    if (raw === undefined || raw === null) return false;
    const v = Number(raw);
    if (!Number.isFinite(v)) return false;
    switch (g.op) {
      case ">=": return v >= (g.value ?? Number.NEGATIVE_INFINITY);
      case "<=": return v <= (g.value ?? Number.POSITIVE_INFINITY);
      case "=": return v === (g.value ?? v);
      case "between": return v >= (g.min ?? Number.NEGATIVE_INFINITY) && v <= (g.max ?? Number.POSITIVE_INFINITY);
      default: return true;
    }
  }

  function applyGatesPre(list: Female[], _gates: Gate[]): Female[] {
    return list.filter(a => _gates.every(g => passGate(a, g)));
  }

  // Cálculo principal
  const calc = useMemo(() => {
    const base = animals && animals.length ? animals : DEMO_ANIMALS;
    let baseList = base;
    if (indexSelection === "Custom" && gatesPhase === "pre") baseList = applyGatesPre(base, gates);

    let zMeta: Record<string, { mu: number; sigma: number }> = {};
    if (indexSelection === "Custom" && standardize) zMeta = computeZMeta(baseList, selectedTraits);

    const rows = baseList.map(a => {
      let score = 0;
      if (indexSelection === "HHP$") score = Number(a.hhp_dollar) || 0;
      else if (indexSelection === "TPI") score = Number(a.tpi) || 0;
      else if (indexSelection === "NM$") score = Number(a.nm_dollar) || 0;
      else {
        for (const t of selectedTraits) {
          const k = getKey(t);
          const w = Number(weights[t]) || 0;
          const raw = Number((a as any)[k]);
          if (!Number.isFinite(raw)) continue;
          const val = standardize ? (zMeta[t] && zMeta[t].sigma ? (raw - zMeta[t].mu) / zMeta[t].sigma : 0) : raw;
          score += w * val;
        }
      }
      return { ...a, CustomScore: score };
    });

    if (indexSelection === "Custom" && gatesPhase === "post") {
      let approved = 0, rejected = 0;
      const list = rows.map(r => {
        const ok = gates.every(g => passGate(r, g));
        if (!ok) {
          if (postGateAction === "zero") r.CustomScore = 0;
          else r.CustomScore = (r.CustomScore || 0) + penalty;
          rejected++;
        } else approved++;
        return r;
      });
      return { list, approved, rejected };
    }

    const approved = rows.length;
    const rejected = (indexSelection === "Custom" && gatesPhase === "pre") ? ((animals && animals.length ? animals : base).length - rows.length) : 0;
    return { list: rows, approved, rejected };
  }, [animals, selectedTraits, weights, standardize, indexSelection, gates, gatesPhase, postGateAction, penalty]);

  const sorted = useMemo(() => {
    const copy = [...(calc.list || [])];
    return copy.sort((a, b) => (Number(b.CustomScore) || 0) - (Number(a.CustomScore) || 0));
  }, [calc]);

  // Segmentation calculation
  const segmentedAnimals = useMemo(() => {
    if (!segmentationEnabled) {
      return sorted;
    }

    const totalPercent = superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0];
    if (totalPercent !== 100) {
      // If percentages don't add up to 100, return unsegmented
      return sorted.map(animal => ({ ...animal, Classification: undefined }));
    }

    const total = sorted.length;
    const superiorCount = Math.floor((superiorPercent[0] / 100) * total);
    const intermediarioCount = Math.floor((intermediarioPercent[0] / 100) * total);
    
    return sorted.map((animal, index) => {
      let classification: "Superior" | "Intermediário" | "Inferior";
      
      if (index < superiorCount) {
        classification = "Superior";
      } else if (index < superiorCount + intermediarioCount) {
        classification = "Intermediário";
      } else {
        classification = "Inferior";
      }
      
      return { ...animal, Classification: classification };
    });
  }, [sorted, segmentationEnabled, superiorPercent, intermediarioPercent, inferiorPercent]);

  // Get available birth years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    animals.forEach(animal => {
      if ((animal as any).birth_date) {
        years.add(new Date((animal as any).birth_date).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [animals]);

  // Distribution statistics
  const distributionStats: DistributionStats = useMemo(() => {
    const total = segmentedAnimals.length;
    const superior = segmentedAnimals.filter(a => a.Classification === "Superior").length;
    const intermediario = segmentedAnimals.filter(a => a.Classification === "Intermediário").length;
    const inferior = segmentedAnimals.filter(a => a.Classification === "Inferior").length;
    
    return {
      superior: { count: superior, percentage: total > 0 ? (superior / total) * 100 : 0 },
      intermediario: { count: intermediario, percentage: total > 0 ? (intermediario / total) * 100 : 0 },
      inferior: { count: inferior, percentage: total > 0 ? (inferior / total) * 100 : 0 }
    };
  }, [segmentedAnimals]);

  // Filter animals by classification
  const filteredAnimals = useMemo(() => {
    if (classificationFilter === "all") {
      return segmentedAnimals;
    }
    return segmentedAnimals.filter(a => a.Classification === classificationFilter);
  }, [segmentedAnimals, classificationFilter]);

  // Chart data
  const chartData = useMemo(() => [
    { name: 'Superior', value: distributionStats.superior.count, color: '#10B981' },
    { name: 'Intermediário', value: distributionStats.intermediario.count, color: '#F59E0B' },
    { name: 'Inferior', value: distributionStats.inferior.count, color: '#EF4444' }
  ], [distributionStats]);

  const approvedCountDisplay = calc.approved || 0;
  const rejectedCountDisplay = calc.rejected || 0;

  function toggleTrait(t: string) {
    setSelectedTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }
  
  function updateWeight(t: string, val: string) { 
    setWeights(prev => ({ ...prev, [t]: Number(val) })); 
  }
  
  function normalizeAll() { 
    setWeights(prev => normalizeWeights(prev)); 
  }
  
  function resetWeights() { 
    const out: Record<string, number> = {}; 
    for (const t of selectedTraits) out[t] = 1; 
    setWeights(out); 
  }
  
  function addEmptyGate() { 
    setGates(prev => [...prev, { trait: "PTAM", op: ">=", value: 0, enabled: true }]); 
  }
  
  function updateGate(i: number, key: string, value: any) { 
    setGates(prev => prev.map((g, idx) => idx === i ? { ...g, [key]: value } : g)); 
  }
  
  function removeGate(i: number) { 
    setGates(prev => prev.filter((_, idx) => idx !== i)); 
  }

  function exportCSV() {
    const rows = filteredAnimals.map(a => ({
      id: a.__idKey ? (a as any)[a.__idKey] : (a.id ?? ""),
      nome: a.__nameKey ? (a as any)[a.__nameKey] : (a.name ?? ""),
      "HHP$": a.hhp_dollar ?? "",
      TPI: a.tpi ?? "",
      "NM$": a.nm_dollar ?? "",
      PTAM: a.ptam ?? "",
      PTAF: a.ptaf ?? "",
      SCS: a.scs ?? "",
      DPR: a.dpr ?? "",
      CustomScore: a.CustomScore,
      Classificacao: a.Classification ?? "",
    }));
    const csv = toCSV(rows);
    downloadText("segmentacao_custom_index.csv", csv);
  }

  function savePreset() {
    if (!presetName.trim()) { 
      alert("Dê um nome ao preset."); 
      return; 
    }
    const payload = { 
      name: presetName.trim(), 
      selectedTraits, 
      weights, 
      standardize, 
      gates, 
      gatesPhase, 
      postGateAction, 
      penalty 
    };
    setPresets(prev => [payload, ...prev.filter(p => p.name !== payload.name)]);
    setPresetName("");
  }
  
  function loadPreset(name: string) {
    const p = presets.find(pp => pp.name === name); 
    if (!p) return;
    setSelectedTraits(p.selectedTraits); 
    setWeights(p.weights); 
    setStandardize(p.standardize);
    setGates(p.gates); 
    setGatesPhase(p.gatesPhase); 
    setPostGateAction(p.postGateAction); 
    setPenalty(p.penalty);
  }
  
  function deletePreset(name: string) { 
    setPresets(prev => prev.filter(p => p.name !== name)); 
  }

  // Segmentation functions
  function updateSuperiorPercent(value: number[]) {
    setSuperiorPercent(value);
    const remaining = 100 - value[0];
    const currentInter = intermediarioPercent[0];
    const currentInf = inferiorPercent[0];
    const total = currentInter + currentInf;
    
    if (total > 0) {
      setIntermediarioPercent([Math.round((currentInter / total) * remaining)]);
      setInferiorPercent([Math.round((currentInf / total) * remaining)]);
    }
  }

  function updateIntermediarioPercent(value: number[]) {
    setIntermediarioPercent(value);
    const remaining = 100 - value[0];
    const currentSup = superiorPercent[0];
    const currentInf = inferiorPercent[0];
    const total = currentSup + currentInf;
    
    if (total > 0) {
      setSuperiorPercent([Math.round((currentSup / total) * remaining)]);
      setInferiorPercent([Math.round((currentInf / total) * remaining)]);
    }
  }

  function updateInferiorPercent(value: number[]) {
    setInferiorPercent(value);
    const remaining = 100 - value[0];
    const currentSup = superiorPercent[0];
    const currentInter = intermediarioPercent[0];
    const total = currentSup + currentInter;
    
    if (total > 0) {
      setSuperiorPercent([Math.round((currentSup / total) * remaining)]);
      setIntermediarioPercent([Math.round((currentInter / total) * remaining)]);
    }
  }

  function applySegmentationPreset(preset: SegmentationPreset) {
    setSuperiorPercent([preset.superior]);
    setIntermediarioPercent([preset.intermediario]);
    setInferiorPercent([preset.inferior]);
  }

  function saveSegmentationPreset() {
    if (!newPresetName.trim()) {
      alert("Dê um nome ao preset de segmentação.");
      return;
    }
    const newPreset: SegmentationPreset = {
      name: newPresetName.trim(),
      superior: superiorPercent[0],
      intermediario: intermediarioPercent[0],
      inferior: inferiorPercent[0]
    };
    setSegmentationPresets(prev => [newPreset, ...prev.filter(p => p.name !== newPreset.name)]);
    setNewPresetName("");
  }

  function deleteSegmentationPreset(name: string) {
    setSegmentationPresets(prev => prev.filter(p => p.name !== name));
  }

  const weightSum = useMemo(() => Object.values(weights).reduce((s, v) => s + (Number(v) || 0), 0), [weights]);
  const filteredPTAs = useMemo(() => { 
    const s = search.trim().toLowerCase(); 
    if (!s) return ALL_PTAS; 
    return ALL_PTAS.filter(p => p.toLowerCase().includes(s)); 
  }, [search]);

  // ────────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold">{farm.name} - Segmentação</h1>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
        {/* Header / Index selector */}
        <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold" style={{ color: SS.black }}>Segmentação — Índice</h2>
            <div className="flex items-center gap-2">
              {(["HHP$", "TPI", "NM$", "Custom"] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setIndexSelection(opt)}
                  className="px-3 py-2 rounded-xl border text-sm"
                  style={{
                    borderColor: indexSelection === opt ? SS.black : SS.gray,
                    background: indexSelection === opt ? SS.black : SS.white,
                    color: indexSelection === opt ? SS.white : SS.black,
                  }}
                >{opt}</button>
              ))}
            </div>
          </div>
          {indexSelection !== "Custom" && (
            <div className="mt-3 text-sm inline-flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: SS.gray, color: SS.black }}>
              <Settings size={16}/> Índice padrão – somente leitura
            </div>
          )}
        </div>

        {/* Status de dados */}
        <div className="rounded-2xl shadow p-4 flex items-center justify-between" style={{ background: SS.white }}>
          <div className="text-sm" style={{ color: SS.black }}>
            Fonte: <span className="font-semibold">Rebanho</span> {animals && animals.length ? `— ${animals.length} registros` : ""}
            {error && <span className="ml-2 text-red-600">(erro: {error})</span>}
          </div>
          <button onClick={fetchAnimals} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" style={{ borderColor: SS.gray, color: SS.black }}>
            <RefreshCw size={16}/> Recarregar
          </button>
        </div>

        {indexSelection === "Custom" && (
          <>
            {/* Quadro A – Escolha PTAs */}
            <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: SS.black }}>Quadro A — Selecione as PTAs</h3>
                <input
                  className="border rounded-lg px-3 py-2 text-sm w-64"
                  placeholder="Buscar PTA…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-auto pr-2">
                {filteredPTAs.map((p) => {
                  const checked = selectedTraits.includes(p);
                  return (
                    <label key={p} className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer" style={{ borderColor: checked ? SS.green : SS.gray, background: checked ? "#ECFDF5" : SS.white, color: SS.black }}>
                      <input type="checkbox" className="accent-black" checked={checked} onChange={() => toggleTrait(p)} />
                      <span className="text-sm">{p}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 text-sm" style={{ color: SS.black }}>✔ {selectedTraits.length} PTAs selecionadas</div>
            </div>

            {/* Quadro B – Pesos */}
            <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: SS.black }}>Quadro B — Pesos por PTA</h3>
                <div className="flex items-center gap-2">
                  <button onClick={normalizeAll} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: SS.gray, color: SS.black }}>Normalizar</button>
                  <button onClick={resetWeights} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: SS.gray, color: SS.black }}>Resetar</button>
                  <div className="flex items-center gap-2">
                    <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Nome do preset" value={presetName} onChange={e => setPresetName(e.target.value)} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }} />
                    <button onClick={savePreset} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: SS.gray, color: SS.black }}>Salvar preset</button>
                    <select className="border rounded-lg px-3 py-2 text-sm" onChange={e => e.target.value && loadPreset(e.target.value)} defaultValue="" style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}>
                      <option value="" disabled>Carregar preset…</option>
                      {presets.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedTraits.map(t => (
                  <div key={t} className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{ borderColor: SS.gray }}>
                    <div className="text-sm font-medium" style={{ color: SS.black }}>{t}</div>
                    <input type="number" step="0.01" className="border rounded-lg px-3 py-2 text-sm w-28 text-right" value={Number.isFinite(Number(weights[t])) ? weights[t] : 0} onChange={e => updateWeight(t, e.target.value)} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }} />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <label className="flex items-center gap-2" style={{ color: SS.black }}>
                  <input type="checkbox" className="accent-black" checked={standardize} onChange={e => setStandardize(e.target.checked)} />
                  Padronizar variáveis (Z-score intra-rebanho)
                </label>
                <div style={{ color: SS.black }}>
                  Soma dos pesos: <span className="font-semibold" style={{ color: Math.abs(weightSum - 1) < 1e-6 ? SS.green : SS.red }}>{weightSum.toFixed(3)}</span>
                  {Math.abs(weightSum - 1) >= 1e-6 && <span className="ml-2 text-xs" style={{ color: SS.black }}>(clique em Normalizar)</span>}
                </div>
              </div>
            </div>

            {/* Quadro C – Gates */}
            <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: SS.black }}>Quadro C — Gates de Corte / Restrição</h3>
                <div className="flex items-center gap-3 text-sm" style={{ color: SS.black }}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="phase" checked={gatesPhase === "pre"} onChange={() => setGatesPhase("pre")} /> Pré-cálculo
                  </span>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="phase" checked={gatesPhase === "post"} onChange={() => setGatesPhase("post")} /> Pós-cálculo
                  </span>
                  {gatesPhase === "post" && (
                    <div className="flex items-center gap-2">
                      <select className="border rounded-lg px-2 py-1" value={postGateAction} onChange={e => setPostGateAction(e.target.value as "zero" | "penalize")} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}>
                        <option value="zero">zerar score</option>
                        <option value="penalize">penalizar</option>
                      </select>
                      {postGateAction === "penalize" && (
                        <input type="number" className="border rounded-lg px-2 py-1 w-24 text-right" value={penalty} onChange={e => setPenalty(Number(e.target.value))} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }} />
                      )}
                    </div>
                  )}
                  <button onClick={addEmptyGate} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" style={{ borderColor: SS.gray, color: SS.black }}>
                    <Filter size={16}/> Adicionar gate
                  </button>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ color: SS.black }}>
                      <th className="py-2 pr-4">PTA</th>
                      <th className="py-2 pr-4">Operador</th>
                      <th className="py-2 pr-4">Valor</th>
                      <th className="py-2 pr-4">Min</th>
                      <th className="py-2 pr-4">Max</th>
                      <th className="py-2 pr-4">Ativo</th>
                      <th className="py-2 pr-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gates.map((g, i) => (
                      <tr key={i} className="border-t" style={{ color: SS.black, borderColor: SS.gray }}>
                        <td className="py-2 pr-4">
                          <select className="border rounded-lg px-2 py-1" value={g.trait} onChange={e => updateGate(i, "trait", e.target.value)} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}>
                            {ALL_PTAS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <select className="border rounded-lg px-2 py-1" value={g.op} onChange={e => updateGate(i, "op", e.target.value)} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}>
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                            <option value="=">=</option>
                            <option value="between">entre</option>
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="border rounded-lg px-2 py-1 w-28 text-right" value={g.value ?? ""} onChange={e => updateGate(i, "value", e.target.value === "" ? undefined : Number(e.target.value))} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="border rounded-lg px-2 py-1 w-28 text-right" value={g.min ?? ""} onChange={e => updateGate(i, "min", e.target.value === "" ? undefined : Number(e.target.value))} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="border rounded-lg px-2 py-1 w-28 text-right" value={g.max ?? ""} onChange={e => updateGate(i, "max", e.target.value === "" ? undefined : Number(e.target.value))} style={{ borderColor: SS.gray, color: SS.black, background: SS.white }} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" className="accent-black" checked={g.enabled} onChange={e => updateGate(i, "enabled", e.target.checked)} />
                        </td>
                        <td className="py-2 pr-4">
                          <button onClick={() => removeGate(i)} className="text-gray-400 hover:text-red-600"><X size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Segmentação */}
        <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: SS.black }}>
              <TrendingUp size={20} />
              Segmentação Automática
            </h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2" style={{ color: SS.black }}>
                <input 
                  type="checkbox" 
                  className="accent-black" 
                  checked={segmentationEnabled} 
                  onChange={e => setSegmentationEnabled(e.target.checked)} 
                />
                Ativar Segmentação
              </label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowChart(!showChart)}
                className="flex items-center gap-2"
              >
                <BarChart3 size={16} />
                {showChart ? "Ocultar" : "Mostrar"} Gráfico
              </Button>
            </div>
          </div>

          {segmentationEnabled && (
            <>
              {/* Controles de Distribuição */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium mb-3" style={{ color: SS.black }}>Distribuição dos Grupos</h4>
                  
                  {/* Superior */}
                  <div className="mb-4 p-3 rounded-lg border-2" style={{ borderColor: '#10B981', backgroundColor: '#ECFDF5' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium" style={{ color: '#065F46' }}>Superior</span>
                      <span className="font-semibold" style={{ color: '#065F46' }}>{superiorPercent[0]}%</span>
                    </div>
                    <Slider
                      value={superiorPercent}
                      onValueChange={updateSuperiorPercent}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Intermediário */}
                  <div className="mb-4 p-3 rounded-lg border-2" style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium" style={{ color: '#92400E' }}>Intermediário</span>
                      <span className="font-semibold" style={{ color: '#92400E' }}>{intermediarioPercent[0]}%</span>
                    </div>
                    <Slider
                      value={intermediarioPercent}
                      onValueChange={updateIntermediarioPercent}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Inferior */}
                  <div className="mb-4 p-3 rounded-lg border-2" style={{ borderColor: '#EF4444', backgroundColor: '#FEF2F2' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium" style={{ color: '#991B1B' }}>Inferior</span>
                      <span className="font-semibold" style={{ color: '#991B1B' }}>{inferiorPercent[0]}%</span>
                    </div>
                    <Slider
                      value={inferiorPercent}
                      onValueChange={updateInferiorPercent}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Validação da soma */}
                  <div className="text-sm text-center p-2 rounded-lg" 
                       style={{ 
                         backgroundColor: (superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0]) === 100 ? '#ECFDF5' : '#FEF2F2',
                         color: (superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0]) === 100 ? '#065F46' : '#991B1B'
                       }}>
                    Total: {superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0]}% 
                    {(superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0]) === 100 ? ' ✓' : ' (deve ser 100%)'}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3" style={{ color: SS.black }}>Presets e Estatísticas</h4>
                  
                  {/* Presets rápidos */}
                  <div className="mb-4">
                    <label className="text-sm font-medium" style={{ color: SS.black }}>Presets Rápidos:</label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {segmentationPresets.map(preset => (
                        <div key={preset.name} className="flex items-center justify-between p-2 border rounded-lg" style={{ borderColor: SS.gray }}>
                          <span className="text-sm" style={{ color: SS.black }}>{preset.name}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => applySegmentationPreset(preset)}
                              className="px-2 py-1 text-xs rounded border" 
                              style={{ borderColor: SS.gray, color: SS.black }}
                            >
                              Aplicar
                            </button>
                            {!["Padrão 20/60/20", "Equilibrado 33/34/33", "Quartis 25/50/25"].includes(preset.name) && (
                              <button 
                                onClick={() => deleteSegmentationPreset(preset.name)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Salvar novo preset */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 border rounded-lg px-3 py-2 text-sm"
                        placeholder="Nome do novo preset..."
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                        style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}
                      />
                      <button 
                        onClick={saveSegmentationPreset}
                        className="px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: SS.gray, color: SS.black }}
                      >
                        Salvar
                      </button>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2" style={{ color: SS.black }}>Distribuição Atual:</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: '#10B981' }}>Superior:</span>
                        <span style={{ color: SS.black }}>{distributionStats.superior.count} animais ({distributionStats.superior.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#F59E0B' }}>Intermediário:</span>
                        <span style={{ color: SS.black }}>{distributionStats.intermediario.count} animais ({distributionStats.intermediario.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: '#EF4444' }}>Inferior:</span>
                        <span style={{ color: SS.black }}>{distributionStats.inferior.count} animais ({distributionStats.inferior.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              {showChart && (
                <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: SS.gray, backgroundColor: '#FAFAFA' }}>
                  <h4 className="text-md font-medium mb-3" style={{ color: SS.black }}>Distribuição Visual</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Gráfico de Pizza */}
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-center" style={{ color: SS.black }}>Distribuição por Grupos</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Gráfico de Barras */}
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-center" style={{ color: SS.black }}>Quantidade por Grupo</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Ações + Resumo */}
        <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2 rounded-xl text-sm flex items-center gap-2" style={{ background: SS.red, color: SS.white }}> 
              <Check size={18}/> Aplicar Índice 
            </button>
            <button onClick={exportCSV} className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2" style={{ borderColor: SS.gray, color: SS.black }}>
              <Download size={18}/> Exportar CSV
            </button>
            
            {/* Filtros de Classificação */}
            {segmentationEnabled && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: SS.black }}>Filtrar:</span>
                <select 
                  value={classificationFilter} 
                  onChange={e => setClassificationFilter(e.target.value as any)}
                  className="border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: SS.gray, color: SS.black, background: SS.white }}
                >
                  <option value="all">Todos os Grupos</option>
                  <option value="Superior">Superior</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Inferior">Inferior</option>
                </select>
              </div>
            )}
            
            <div className="ml-auto text-sm" style={{ color: SS.black }}>
              <div className="font-semibold">Resumo</div>
              {indexSelection === "Custom" ? (
                <div>
                  PTAs: {selectedTraits.map(t => `${t} (${Number(weights[t] ?? 0).toFixed(2)})`).join(", ")} — Padronização: {standardize ? "ON" : "OFF"}
                  <br/>
                  Gates ({gatesPhase}): {gates.map(g => `${g.trait} ${g.op === ">=" ? "≥" : g.op === "<=" ? "≤" : g.op === "=" ? "=" : "entre"} ${g.op === "between" ? `${g.min ?? "-∞"}–${g.max ?? "+∞"}` : (g.value ?? "—")}`).join("; ")}
                  <br/>
                  Aprovadas: {approvedCountDisplay} | Reprovadas: {rejectedCountDisplay}
                  {segmentationEnabled && <><br/>Segmentação: Superior {superiorPercent[0]}% | Intermediário {intermediarioPercent[0]}% | Inferior {inferiorPercent[0]}%</>}
                </div>
              ) : (
                <div>Índice padrão: {indexSelection}</div>
              )}
            </div>
          </div>
        </div>

        {/* Grade de fêmeas */}
        <div className="rounded-2xl shadow p-4" style={{ background: SS.white }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold" style={{ color: SS.black }}>📊 Grade de Fêmeas</h3>
            {segmentationEnabled && (
              <div className="text-sm" style={{ color: SS.black }}>
                Exibindo: {filteredAnimals.length} de {segmentedAnimals.length} animais
              </div>
            )}
          </div>
          {loading ? (
            <div className="text-sm" style={{ color: SS.black }}>Carregando…</div>
          ) : (
            <ScrollArea className="h-[500px] w-full">
              <div className="min-w-[2000px]">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b" style={{ color: SS.black, borderColor: SS.gray, background: SS.gray }}>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>ID Fazenda</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Nome</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>ID CDCB</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Pedigre Pai/Avô Materno/BisaAvô Materno</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Data de Nascimento</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Ordem de Parto</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Categoria</th>
                      {segmentationEnabled && <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Classificação</th>}
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>HHP$®</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>TPI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>NM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>CM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>GM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>F SAV</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PTAM</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>CFP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PTAF</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PTAF%</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PTAP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PTAP%</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>DPR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>LIV</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>SCS</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>MAST</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>MET</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>DA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>KET</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>MF</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>PTAT</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>UDC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FLC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>SCE</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>DCE</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>SSB</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>DSB</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>H LIV</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>CCR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>HCR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>GL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>EFC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>BWC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>STA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>STR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>DFM</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RUA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RLS</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RTP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FTL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RW</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RLR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FTA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FLS</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FUA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RUH</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RUW</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>UCL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>UDP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>FTP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>RFI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Beta-Casein</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>Kappa-Casein</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>GFI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{ background: SS.gray }}>CustomScore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnimals.slice(0, 10).map((a, idx) => {
                      const classificationColor = a.Classification === "Superior" ? "#10B981" : 
                                                 a.Classification === "Intermediário" ? "#F59E0B" : 
                                                 a.Classification === "Inferior" ? "#EF4444" : "transparent";
                      
                      return (
                      <tr key={(a.__idKey ? (a as any)[a.__idKey] : (a.id ?? idx))} 
                          className="border-b hover:opacity-90" 
                          style={{ 
                            borderColor: SS.gray, 
                            color: SS.black,
                            backgroundColor: segmentationEnabled && a.Classification ? `${classificationColor}10` : "transparent"
                          }}>
                        <td className="border px-2 py-1 text-xs">{(a as any).farm_id || '-'}</td>
                        <td className="border px-2 py-1 text-xs font-medium">{a.__nameKey ? (a as any)[a.__nameKey] : ((a as any).name ?? '')}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).cdcb_id || (a as any).identifier || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{[(a as any).sire_naab, (a as any).mgs_naab, (a as any).mmgs_naab].filter(Boolean).join('/') || '-'}</td>
                        <td className="border px-2 py-1 text-xs">
                          {(a as any).birth_date ? formatDate((a as any).birth_date) : '-'}
                          {(a as any).birth_date && (
                            <span className="ml-1" style={{ color: '#9CA3AF' }}>
                              ({getAge((a as any).birth_date)})
                            </span>
                          )}
                        </td>
                         <td className="border px-2 py-1 text-xs">{(a as any).parity_order || '-'}</td>
                         <td className="border px-2 py-1 text-xs">
                           <span 
                             className="px-2 py-1 rounded text-xs font-medium"
                             style={{
                               backgroundColor: 
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Bezerra' ? '#EBF4FF' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Novilha' ? '#F0FDF4' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Primípara' ? '#FAF5FF' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Secundípara' ? '#FFF7ED' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Multípara' ? '#FEF2F2' :
                                 '#F9FAFB',
                               color:
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Bezerra' ? '#1E40AF' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Novilha' ? '#166534' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Primípara' ? '#7C3AED' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Secundípara' ? '#EA580C' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Multípara' ? '#DC2626' :
                                 '#6B7280',
                               border: '1px solid',
                               borderColor:
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Bezerra' ? '#DBEAFE' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Novilha' ? '#DCFCE7' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Primípara' ? '#F3E8FF' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Secundípara' ? '#FED7AA' :
                                 getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Multípara' ? '#FECACA' :
                                 '#E5E7EB'
                             }}
                           >
                             {getAutomaticCategory((a as any).birth_date, (a as any).parity_order)}
                           </span>
                         </td>
                         {segmentationEnabled && (
                           <td className="border px-2 py-1 text-xs">
                             {a.Classification && (
                               <span 
                                 className="px-2 py-1 rounded text-xs font-medium"
                                 style={{
                                   backgroundColor: classificationColor + '20',
                                   color: classificationColor,
                                   border: `1px solid ${classificationColor}`
                                 }}
                               >
                                 {a.Classification}
                               </span>
                             )}
                           </td>
                         )}
                        <td className="border px-2 py-1 text-xs">{((a as any).hhp_dollar !== undefined && (a as any).hhp_dollar !== null) ? Number((a as any).hhp_dollar).toFixed(0) : '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).tpi || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).nm_dollar || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).cm_dollar || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).fm_dollar || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).gm_dollar || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).f_sav || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ptam || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).cfp || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ptaf || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ptaf_pct || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ptap || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ptap_pct || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).pl || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).dpr || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).liv || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).scs || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).mast || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).met || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rp || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).da || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ket || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).mf || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ptat || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).udc || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).flc || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).sce || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).dce || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ssb || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).dsb || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).h_liv || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ccr || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).hcr || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).fi || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).gl || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).efc || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).bwc || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).sta || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).str || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).dfm || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rua || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rls || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rtp || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ftl || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rw || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rlr || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).fta || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).fls || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).fua || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ruh || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ruw || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ucl || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).udp || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).ftp || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).rfi || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).beta_casein || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).kappa_casein || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).gfi || '-'}</td>
                        <td className="border px-2 py-1 text-xs font-bold">{((a as any).CustomScore !== undefined) ? Number((a as any).CustomScore).toFixed(1) : '-'}</td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="text-xs text-center pb-8" style={{ color: SS.black }}>MVP demonstrativo — dados seguros via RLS</div>
      </div>
    </div>
  );
}