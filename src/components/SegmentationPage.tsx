import React, { useEffect, useMemo, useState } from "react";
import { Download, Settings, Filter, Check, X, RefreshCw, ArrowLeft, TrendingUp, PieChart, BarChart3, Sliders, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { generateSegmentationPDF, generatePDFBlob } from '@/utils/pdfGenerator';
import { useFileStore } from '@/hooks/useFileStore';
import { fetchFemalesDenormByFarm, isCompleteFemaleRow, type CompleteFemaleDenormRow } from '@/supabase/queries/females';
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
type Female = CompleteFemaleDenormRow & {
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
  superior: {
    count: number;
    percentage: number;
  };
  intermediario: {
    count: number;
    percentage: number;
  };
  inferior: {
    count: number;
    percentage: number;
  };
};

// ────────────────────────────────────────────────────────────────────
// Configurações de cor (Select Sires)
// ────────────────────────────────────────────────────────────────────
const SS = {
  red: "#ED1C24",
  black: "#1C1C1C",
  gray: "#D9D9D9",
  white: "#F2F2F2",
  green: "#8DC63F"
};

// ────────────────────────────────────────────────────────────────────
// Lista completa de PTAs (rótulos)
// ────────────────────────────────────────────────────────────────────
const ALL_PTAS = ["HHP$®", "TPI", "NM$", "CM$", "FM$", "GM$", "F SAV", "PTAM", "CFP", "PTAF", "PTAF%", "PTAP", "PTAP%", "PL", "DPR", "LIV", "SCS", "MAST", "MET", "RP", "DA", "KET", "MF", "PTAT", "UDC", "FLC", "SCE", "DCE", "SSB", "DSB", "H LIV", "CCR", "HCR", "FI", "GL", "EFC", "BWC", "STA", "STR", "DFM", "RUA", "RLS", "RTP", "FTL", "RW", "RLR", "FTA", "FLS", "FUA", "RUH", "RUW", "UCL", "UDP", "FTP", "RFI", "Beta-Casein", "Kappa-Casein", "GFI"];

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
  "Kappa-Casein": "kappa_casein"
};

// Colunas candidatas a nome/identificação
const NAME_COLS = ["name", "nome", "animal_name", "cow_name", "animal", "ident", "id_animal"];
const ID_COLS = ["id", "animal_id", "brinco", "ear_tag", "cdcb_id", "uuid"];

// Dataset demo (fallback se não houver dados)
const DEMO_ANIMALS: Female[] = [{
  id: "A001",
  name: "Vaca 001",
  hhp_dollar: 620,
  tpi: 2350,
  nm_dollar: 415,
  ptam: 1200,
  ptaf: 50,
  scs: 2.6,
  dpr: 1.2
} as Female, {
  id: "A002",
  name: "Vaca 002",
  hhp_dollar: 590,
  tpi: 2280,
  nm_dollar: 380,
  ptam: 1080,
  ptaf: 44,
  scs: 2.9,
  dpr: -0.1
} as Female, {
  id: "A003",
  name: "Vaca 003",
  hhp_dollar: 655,
  tpi: 2425,
  nm_dollar: 430,
  ptam: 1305,
  ptaf: 56,
  scs: 2.4,
  dpr: 0.4
} as Female, {
  id: "A004",
  name: "Vaca 004",
  hhp_dollar: 540,
  tpi: 2205,
  nm_dollar: 350,
  ptam: 980,
  ptaf: 40,
  scs: 3.1,
  dpr: -0.6
} as Female, {
  id: "A005",
  name: "Vaca 005",
  hhp_dollar: 605,
  tpi: 2360,
  nm_dollar: 405,
  ptam: 1190,
  ptaf: 48,
  scs: 2.7,
  dpr: 0.8
} as Female];

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
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    }).join(",");
    lines.push(line);
  }
  return lines.join("\n");
}
function downloadText(filename: string, text: string) {
  const blob = new Blob([text], {
    type: "text/csv;charset=utf-8;"
  });
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
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < birth.getDate()) {
      years--;
    }
    return `${years}a`;
  } catch {
    return '-';
  }
}
function renderPedigreeCell(code?: string | null, name?: string | null) {
  if (!code && !name) {
    return <span>-</span>;
  }
  return <div className="flex flex-col leading-tight">
      {code && <span className="font-medium" style={{
      color: SS.black
    }}>{code}</span>}
      {name && <span className="text-[11px]" style={{
      color: '#6B7280'
    }}>{name}</span>}
    </div>;
}
function getFonteDisplay(fonte?: string | null) {
  if (!fonte) {
    return {
      label: '—',
      className: 'border-gray-200 bg-gray-50 text-gray-600'
    };
  }
  const normalized = fonte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (normalized.startsWith('genom')) {
    return {
      label: 'Genômica',
      className: 'border-green-200 bg-green-50 text-green-700'
    };
  }
  if (normalized.startsWith('pred')) {
    return {
      label: 'Predição',
      className: 'border-purple-200 bg-purple-50 text-purple-700'
    };
  }
  return {
    label: fonte,
    className: 'border-gray-200 bg-gray-50 text-gray-700'
  };
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
  const meta: Record<string, {
    mu: number;
    sigma: number;
  }> = {};
  for (const t of traits) {
    const k = getKey(t);
    const vals = list.map(a => Number((a as any)[k])).filter(v => Number.isFinite(v));
    const mu = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    const variance = vals.length ? vals.reduce((s, v) => s + Math.pow(v - mu, 2), 0) / vals.length : 0;
    const sigma = Math.sqrt(variance) || 0;
    meta[t] = {
      mu,
      sigma
    };
  }
  return meta;
}
function normalizeWeights(weights: Record<string, number>) {
  const sum = Object.values(weights).reduce((s, v) => s + (Number(v) || 0), 0);
  if (sum === 0) return {
    ...weights
  };
  const out: Record<string, number> = {};
  for (const k of Object.keys(weights)) out[k] = (Number(weights[k]) || 0) / sum * 100;
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
export default function SegmentationPage({
  farm,
  onBack
}: SegmentationPageProps) {
  const [indexSelection, setIndexSelection] = useState<"HHP$" | "TPI" | "NM$" | "Custom">("HHP$");
  const {
    addReport
  } = useFileStore();

  // Custom state - separated search terms for different purposes
  const [ptaSearch, setPtaSearch] = useState(""); // For filtering PTAs in selection
  const [animalSearch, setAnimalSearch] = useState(""); // For filtering animals in table
  const [categoryFilter, setCategoryFilter] = useState<string>("all"); // Filter by category
  const [selectedTraits, setSelectedTraits] = useState(["HHP$®", "PTAM", "PTAF"]);
  const [weights, setWeights] = useState<Record<string, number>>({
    "HHP$®": 40,
    PTAM: 30,
    PTAF: 30
  });
  const [standardize, setStandardize] = useState(true);
  const [segmentationTriggered, setSegmentationTriggered] = useState(false);

  // Segmentation state
  const [segmentationEnabled, setSegmentationEnabled] = useState(true);
  const [superiorPercent, setSuperiorPercent] = useState([20]);
  const [intermediarioPercent, setIntermediarioPercent] = useState([60]);
  const [inferiorPercent, setInferiorPercent] = useState([20]);
  const [segmentationPresets, setSegmentationPresets] = useState<SegmentationPreset[]>([{
    name: "Padrão 20/60/20",
    superior: 20,
    intermediario: 60,
    inferior: 20
  }, {
    name: "Equilibrado 33/34/33",
    superior: 33,
    intermediario: 34,
    inferior: 33
  }, {
    name: "Quartis 25/50/25",
    superior: 25,
    intermediario: 50,
    inferior: 25
  }]);
  const [newPresetName, setNewPresetName] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<"all" | "Superior" | "Intermediário" | "Inferior">("all");
  const [showChart, setShowChart] = useState(false);
  const [gates, setGates] = useState<Gate[]>([{
    trait: "SCS",
    op: "<=",
    value: 2.75,
    enabled: true
  }, {
    trait: "PTAF",
    op: ">=",
    value: 40,
    enabled: true
  }]);
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
      const rows = await fetchFemalesDenormByFarm(farm.farm_id);
      const data = rows.filter(isCompleteFemaleRow) as Female[];
      if (rows.length !== data.length) {
        console.warn('[SegmentationPage] Ignored female rows missing id, name, farm_id or created_at:', rows.length - data.length);
      }
      if (!data || !data.length) {
        setAnimals([]);
        return;
      }

      // Mapeia campos id/nome dinâmicos
      const mapped = data.map(row => {
        const idKey = pickFirst(row, ID_COLS, Object.keys(row)[0]);
        const nameKey = pickFirst(row, NAME_COLS, idKey);
        return {
          __idKey: idKey,
          __nameKey: nameKey,
          ...row
        };
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
      case ">=":
        return v >= (g.value ?? Number.NEGATIVE_INFINITY);
      case "<=":
        return v <= (g.value ?? Number.POSITIVE_INFINITY);
      case "=":
        return v === (g.value ?? v);
      case "between":
        return v >= (g.min ?? Number.NEGATIVE_INFINITY) && v <= (g.max ?? Number.POSITIVE_INFINITY);
      default:
        return true;
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
    let zMeta: Record<string, {
      mu: number;
      sigma: number;
    }> = {};
    if (indexSelection === "Custom" && standardize) zMeta = computeZMeta(baseList, selectedTraits);
    const rows = baseList.map(a => {
      let score = 0;
      if (indexSelection === "HHP$") score = Number(a.hhp_dollar) || 0;else if (indexSelection === "TPI") score = Number(a.tpi) || 0;else if (indexSelection === "NM$") score = Number(a.nm_dollar) || 0;else {
        for (const t of selectedTraits) {
          const k = getKey(t);
          const w = (Number(weights[t]) || 0) / 100; // Convert percentage to decimal
          const raw = Number((a as any)[k]);
          if (!Number.isFinite(raw)) continue;
          const val = standardize ? zMeta[t] && zMeta[t].sigma ? (raw - zMeta[t].mu) / zMeta[t].sigma : 0 : raw;
          score += w * val;
        }
      }
      return {
        ...a,
        CustomScore: score
      };
    });
    if (indexSelection === "Custom" && gatesPhase === "post") {
      let approved = 0,
        rejected = 0;
      const list = rows.map(r => {
        const ok = gates.every(g => passGate(r, g));
        if (!ok) {
          if (postGateAction === "zero") r.CustomScore = 0;else r.CustomScore = (r.CustomScore || 0) + penalty;
          rejected++;
        } else approved++;
        return r;
      });
      return {
        list,
        approved,
        rejected
      };
    }
    const approved = rows.length;
    const rejected = indexSelection === "Custom" && gatesPhase === "pre" ? (animals && animals.length ? animals : base).length - rows.length : 0;
    return {
      list: rows,
      approved,
      rejected
    };
  }, [animals, selectedTraits, weights, standardize, indexSelection, gates, gatesPhase, postGateAction, penalty]);
  const sorted = useMemo(() => {
    const copy = [...(calc.list || [])];
    return copy.sort((a, b) => (Number(b.CustomScore) || 0) - (Number(a.CustomScore) || 0));
  }, [calc]);

  // Segmentation calculation with proper score handling for all index types
  const segmentedAnimals = useMemo(() => {
    if (!segmentationEnabled || !segmentationTriggered) {
      return sorted;
    }

    // Only run segmentation if percentages sum to 100%
    const totalPercent = superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0];
    if (totalPercent !== 100) {
      return sorted;
    }
    const total = sorted.length;
    if (total === 0) {
      return sorted;
    }

    // Create a properly sorted list based on the selected index
    let scoredAnimals = [...sorted];

    // Sort based on the current index selection
    scoredAnimals.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (indexSelection === "HHP$") {
        scoreA = Number(a.hhp_dollar) || 0;
        scoreB = Number(b.hhp_dollar) || 0;
      } else if (indexSelection === "TPI") {
        scoreA = Number(a.tpi) || 0;
        scoreB = Number(b.tpi) || 0;
      } else if (indexSelection === "NM$") {
        scoreA = Number(a.nm_dollar) || 0;
        scoreB = Number(b.nm_dollar) || 0;
      } else {
        // Custom index
        scoreA = Number(a.CustomScore) || 0;
        scoreB = Number(b.CustomScore) || 0;
      }
      return scoreB - scoreA; // Higher scores first
    });

    // Calculate counts based on percentages, ensuring all animals are classified
    const superiorCount = Math.floor(superiorPercent[0] / 100 * total);
    const intermediarioCount = Math.floor(intermediarioPercent[0] / 100 * total);
    // Assign remaining animals to inferior to ensure all are classified
    const inferiorCount = total - superiorCount - intermediarioCount;
    return scoredAnimals.map((animal, index) => {
      let classification: "Superior" | "Intermediário" | "Inferior";
      if (index < superiorCount) {
        classification = "Superior";
      } else if (index < superiorCount + intermediarioCount) {
        classification = "Intermediário";
      } else {
        classification = "Inferior";
      }
      return {
        ...animal,
        Classification: classification
      };
    });
  }, [sorted, segmentationEnabled, segmentationTriggered, superiorPercent, intermediarioPercent, inferiorPercent, indexSelection]);

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
      superior: {
        count: superior,
        percentage: total > 0 ? superior / total * 100 : 0
      },
      intermediario: {
        count: intermediario,
        percentage: total > 0 ? intermediario / total * 100 : 0
      },
      inferior: {
        count: inferior,
        percentage: total > 0 ? inferior / total * 100 : 0
      }
    };
  }, [segmentedAnimals]);

  // Filter animals by search, category and classification
  const filteredAnimals = useMemo(() => {
    let result = segmentedAnimals;

    // Apply search filter (name or identifier)
    if (animalSearch.trim()) {
      const searchTerm = animalSearch.trim().toLowerCase();
      result = result.filter(animal => animal.name && animal.name.toLowerCase().includes(searchTerm) || (animal as any).identifier && (animal as any).identifier.toLowerCase().includes(searchTerm) || (animal as any).cdcb_id && (animal as any).cdcb_id.toLowerCase().includes(searchTerm));
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(animal => {
        const automaticCategory = getAutomaticCategory((animal as any).birth_date, animal.parity_order);
        return automaticCategory === categoryFilter;
      });
    }

    // Apply classification filter
    if (classificationFilter !== "all") {
      result = result.filter(a => a.Classification === classificationFilter);
    }
    return result;
  }, [segmentedAnimals, animalSearch, categoryFilter, classificationFilter]);

  // Chart data
  const chartData = useMemo(() => [{
    name: 'Superior',
    value: distributionStats.superior.count,
    color: '#10B981'
  }, {
    name: 'Intermediário',
    value: distributionStats.intermediario.count,
    color: '#F59E0B'
  }, {
    name: 'Inferior',
    value: distributionStats.inferior.count,
    color: '#EF4444'
  }], [distributionStats]);
  const approvedCountDisplay = calc.approved || 0;
  const rejectedCountDisplay = calc.rejected || 0;
  function toggleTrait(t: string) {
    setSelectedTraits(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }
  function updateWeight(t: string, val: string) {
    setWeights(prev => ({
      ...prev,
      [t]: Number(val)
    }));
  }
  function normalizeAll() {
    setWeights(prev => normalizeWeights(prev));
  }
  function resetWeights() {
    const equalWeight = selectedTraits.length > 0 ? Math.floor(100 / selectedTraits.length) : 0;
    const out: Record<string, number> = {};
    for (const t of selectedTraits) out[t] = equalWeight;
    // Distribute remainder to first traits
    const remainder = 100 - equalWeight * selectedTraits.length;
    for (let i = 0; i < remainder && i < selectedTraits.length; i++) {
      out[selectedTraits[i]] += 1;
    }
    setWeights(out);
  }
  function addEmptyGate() {
    setGates(prev => [...prev, {
      trait: "PTAM",
      op: ">=",
      value: 0,
      enabled: true
    }]);
  }
  function updateGate(i: number, key: string, value: any) {
    setGates(prev => prev.map((g, idx) => idx === i ? {
      ...g,
      [key]: value
    } : g));
  }
  function removeGate(i: number) {
    setGates(prev => prev.filter((_, idx) => idx !== i));
  }
  function exportCSV() {
    const rows = filteredAnimals.map(a => {
      const fonteInfo = getFonteDisplay((a as any).fonte);
      return {
        id: a.__idKey ? (a as any)[a.__idKey] : a.id ?? "",
        nome: a.__nameKey ? (a as any)[a.__nameKey] : a.name ?? "",
        Fonte: fonteInfo.label === '—' ? '' : fonteInfo.label,
        "HHP$": a.hhp_dollar ?? "",
        TPI: a.tpi ?? "",
        "NM$": a.nm_dollar ?? "",
        PTAM: a.ptam ?? "",
        PTAF: a.ptaf ?? "",
        SCS: a.scs ?? "",
        DPR: a.dpr ?? "",
        CustomScore: a.CustomScore,
        Classificacao: a.Classification ?? ""
      };
    });
    const csv = toCSV(rows);
    downloadText("segmentacao_custom_index.csv", csv);
  }
  const saveSegmentationToDatabase = async () => {
    if (!segmentationEnabled || !segmentationTriggered) {
      alert("Execute a segmentação antes de salvar.");
      return;
    }
    setLoading(true);
    try {
      // Primeiro, limpar segmentações antigas desta fazenda
      await supabase.from('female_segmentations').delete().eq('farm_id', farm.farm_id);

      // Preparar dados para inserção
      const segmentationData = segmentedAnimals.filter(animal => animal.Classification).map(animal => ({
        female_id: animal.id,
        farm_id: farm.farm_id,
        class: (animal.Classification === 'Superior' ? 'donor' : animal.Classification === 'Intermediário' ? 'inter' : 'recipient') as 'donor' | 'inter' | 'recipient',
        score: animal.CustomScore || 0,
        parameters: {
          index_type: indexSelection,
          selected_traits: selectedTraits,
          weights: weights,
          segmentation_percentages: {
            superior: superiorPercent[0],
            intermediario: intermediarioPercent[0],
            inferior: inferiorPercent[0]
          }
        }
      }));
      if (segmentationData.length === 0) {
        alert("Nenhuma fêmea classificada para salvar.");
        return;
      }

      // Inserir novos dados de segmentação
      const {
        error
      } = await supabase.from('female_segmentations').insert(segmentationData);
      if (error) throw error;
      alert(`Segmentação salva! ${segmentationData.length} fêmeas classificadas foram salvas no banco de dados.`);
    } catch (error: any) {
      console.error('Erro ao salvar segmentação:', error);
      alert(`Erro ao salvar segmentação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const saveReportToFiles = async () => {
    try {
      const reportData = {
        farmName: farm.name,
        filters: {
          categories: availableCategories.filter(cat => !categoryFilter || categoryFilter === 'all' || cat === categoryFilter),
          classifications: ['donor', 'inter', 'recipient']
        },
        distribution: {
          superior: distributionStats.superior.percentage,
          intermediario: distributionStats.intermediario.percentage,
          inferior: distributionStats.inferior.percentage
        },
        customSettings: indexSelection === 'Custom' ? {
          selectedIndex: indexSelection,
          selectedTraits,
          weights
        } : undefined,
        femalesData: filteredAnimals,
        date: new Date().toLocaleDateString('pt-BR')
      };
      const pdf = await generateSegmentationPDF(reportData);
      const pdfBlob = await generatePDFBlob(pdf);

      // Salvar no store de arquivos
      addReport({
        name: `Segmentação ${farm.name} - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'segmentation',
        sourceId: farm.farm_id,
        data: reportData,
        metadata: {
          createdAt: new Date().toISOString(),
          size: pdfBlob.size,
          description: `Relatório de segmentação com ${filteredAnimals.length} fêmeas`,
          filters: reportData.filters,
          settings: reportData.customSettings
        },
        fileBlob: pdfBlob
      });

      // Também fazer o download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Segmentacao_${farm.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Relatório salvo na Pasta de Arquivos');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
    }
  };
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
      setIntermediarioPercent([Math.round(currentInter / total * remaining)]);
      setInferiorPercent([Math.round(currentInf / total * remaining)]);
    }
  }
  function updateIntermediarioPercent(value: number[]) {
    setIntermediarioPercent(value);
    const remaining = 100 - value[0];
    const currentSup = superiorPercent[0];
    const currentInf = inferiorPercent[0];
    const total = currentSup + currentInf;
    if (total > 0) {
      setSuperiorPercent([Math.round(currentSup / total * remaining)]);
      setInferiorPercent([Math.round(currentInf / total * remaining)]);
    }
  }
  function updateInferiorPercent(value: number[]) {
    setInferiorPercent(value);
    const remaining = 100 - value[0];
    const currentSup = superiorPercent[0];
    const currentInter = intermediarioPercent[0];
    const total = currentSup + currentInter;
    if (total > 0) {
      setSuperiorPercent([Math.round(currentSup / total * remaining)]);
      setIntermediarioPercent([Math.round(currentInter / total * remaining)]);
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

  // Get available categories from animals
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    animals.forEach(animal => {
      const category = getAutomaticCategory((animal as any).birth_date, animal.parity_order);
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [animals]);
  function triggerSegmentation() {
    const totalPercent = superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0];
    if (totalPercent !== 100) {
      alert("A soma das porcentagens deve ser exatamente 100% para executar a segmentação.");
      return;
    }
    setSegmentationTriggered(true);
  }
  const filteredPTAs = useMemo(() => {
    const s = ptaSearch.trim().toLowerCase();
    if (!s) return ALL_PTAS;
    return ALL_PTAS.filter(p => p.toLowerCase().includes(s));
  }, [ptaSearch]);

  // ────────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────────
  return <div className="min-h-screen bg-background">
      <TooltipProvider>
        {/* Header */}
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={onBack} className="mr-4 bg-slate-200 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voltar ao painel principal da fazenda</p>
              </TooltipContent>
            </Tooltip>
            <h1 className="text-xl font-semibold">{farm.name} - Segmentação</h1>
          </div>
        </div>

      <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
        {/* Header / Index selector */}
        <div className="rounded-2xl shadow p-4" style={{
          background: SS.white
        }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-semibold" style={{
              color: SS.black
            }}>Segmentação — Índice</h2>
            <div className="flex items-center gap-2">
              {(["HHP$", "TPI", "NM$", "Custom"] as const).map(opt => <Tooltip key={opt}>
                  <TooltipTrigger asChild>
                    <button onClick={() => setIndexSelection(opt)} className="px-3 py-2 rounded-xl border text-sm" style={{
                    borderColor: indexSelection === opt ? SS.black : SS.gray,
                    background: indexSelection === opt ? SS.black : SS.white,
                    color: indexSelection === opt ? SS.white : SS.black
                  }}>{opt}</button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {opt === "HHP$" && "Índice econômico Health, Herd & Profit"}
                      {opt === "TPI" && "Total Performance Index - índice geral de performance"}
                      {opt === "NM$" && "Net Merit Dollar - mérito líquido em dólares"}
                      {opt === "Custom" && "Índice personalizado com PTAs selecionadas"}
                    </p>
                  </TooltipContent>
                </Tooltip>)}
            </div>
          </div>
          {indexSelection !== "Custom" && <div className="mt-3 text-sm inline-flex items-center gap-2 px-2 py-1 rounded-lg" style={{
            background: SS.gray,
            color: SS.black
          }}>
              <Settings size={16} /> Índice padrão – somente leitura
            </div>}
        </div>

        {/* Status de dados */}
        <div className="rounded-2xl shadow p-4 flex items-center justify-between" style={{
          background: SS.white
        }}>
          <div className="text-sm" style={{
            color: SS.black
          }}>
            Fonte: <span className="font-semibold">Rebanho</span> {animals && animals.length ? `— ${animals.length} registros` : ""}
            {error && <span className="ml-2 text-red-600">(erro: {error})</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={fetchAnimals} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" style={{
                borderColor: SS.gray,
                color: SS.black
              }}>
                <RefreshCw size={16} /> Recarregar
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Recarregar dados do rebanho da fazenda</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {indexSelection === "Custom" && <>
            {/* Quadro A – Escolha PTAs */}
            <div className="rounded-2xl shadow p-4" style={{
            background: SS.white
          }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{
                color: SS.black
              }}>Quadro A — Selecione as PTAs</h3>
                <input className="border rounded-lg px-3 py-2 text-sm w-64" placeholder="Buscar PTA…" value={ptaSearch} onChange={e => setPtaSearch(e.target.value)} style={{
                borderColor: SS.gray,
                color: SS.black,
                background: SS.white
              }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-auto pr-2">
                {filteredPTAs.map(p => {
                const checked = selectedTraits.includes(p);
                return <label key={p} className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer" style={{
                  borderColor: checked ? SS.green : SS.gray,
                  background: checked ? "#ECFDF5" : SS.white,
                  color: SS.black
                }}>
                      <input type="checkbox" className="accent-black" checked={checked} onChange={() => toggleTrait(p)} />
                      <span className="text-sm">{p}</span>
                    </label>;
              })}
              </div>
              <div className="mt-3 text-sm" style={{
              color: SS.black
            }}>✔ {selectedTraits.length} PTAs selecionadas</div>
            </div>

            {/* Quadro B – Pesos */}
            <div className="rounded-2xl shadow p-4" style={{
            background: SS.white
          }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{
                color: SS.black
              }}>Quadro B — Pesos por PTA</h3>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={normalizeAll} className="px-3 py-2 rounded-xl border text-sm" style={{
                      borderColor: SS.gray,
                      color: SS.black
                    }}>Normalizar</button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Distribuir pesos proporcionalmente para somar 100%</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={resetWeights} className="px-3 py-2 rounded-xl border text-sm" style={{
                      borderColor: SS.gray,
                      color: SS.black
                    }}>Resetar</button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Definir pesos iguais para todas as PTAs selecionadas</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Nome do preset" value={presetName} onChange={e => setPresetName(e.target.value)} style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Digite um nome para salvar esta configuração</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={savePreset} className="px-3 py-2 rounded-xl border text-sm" style={{
                        borderColor: SS.gray,
                        color: SS.black
                      }}>Salvar preset</button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Salvar configuração atual para reutilização</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <select className="border rounded-lg px-3 py-2 text-sm" onChange={e => e.target.value && loadPreset(e.target.value)} defaultValue="" style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }}>
                          <option value="" disabled>Carregar preset…</option>
                          {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Carregar uma configuração previamente salva</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedTraits.map(t => <div key={t} className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{
                borderColor: SS.gray
              }}>
                    <div className="text-sm font-medium" style={{
                  color: SS.black
                }}>{t}</div>
                    <input type="number" step="0.01" className="border rounded-lg px-3 py-2 text-sm w-28 text-right" value={Number.isFinite(Number(weights[t])) ? weights[t] : 0} onChange={e => updateWeight(t, e.target.value)} style={{
                  borderColor: SS.gray,
                  color: SS.black,
                  background: SS.white
                }} />
                  </div>)}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <label className="flex items-center gap-2" style={{
                color: SS.black
              }}>
                  <input type="checkbox" className="accent-black" checked={standardize} onChange={e => setStandardize(e.target.checked)} />
                  Padronizar variáveis (Z-score intra-rebanho)
                </label>
                <div style={{
                color: SS.black
              }}>
                  Soma dos pesos: <span className="font-semibold" style={{
                  color: Math.abs(weightSum - 1) < 1e-6 ? SS.green : SS.red
                }}>{weightSum.toFixed(3)}</span>
                  {Math.abs(weightSum - 1) >= 1e-6 && <span className="ml-2 text-xs" style={{
                  color: SS.black
                }}>(clique em Normalizar)</span>}
                </div>
              </div>
            </div>

            {/* Quadro C – Gates */}
            <div className="rounded-2xl shadow p-4" style={{
            background: SS.white
          }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{
                color: SS.black
              }}>Quadro C — Gates de Corte / Restrição</h3>
                <div className="flex items-center gap-3 text-sm" style={{
                color: SS.black
              }}>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="phase" checked={gatesPhase === "pre"} onChange={() => setGatesPhase("pre")} /> Pré-cálculo
                  </span>
                  <span className="flex items-center gap-2">
                    <input type="radio" name="phase" checked={gatesPhase === "post"} onChange={() => setGatesPhase("post")} /> Pós-cálculo
                  </span>
                  {gatesPhase === "post" && <div className="flex items-center gap-2">
                      <select className="border rounded-lg px-2 py-1" value={postGateAction} onChange={e => setPostGateAction(e.target.value as "zero" | "penalize")} style={{
                    borderColor: SS.gray,
                    color: SS.black,
                    background: SS.white
                  }}>
                        <option value="zero">zerar score</option>
                        <option value="penalize">penalizar</option>
                      </select>
                      {postGateAction === "penalize" && <input type="number" className="border rounded-lg px-2 py-1 w-24 text-right" value={penalty} onChange={e => setPenalty(Number(e.target.value))} style={{
                    borderColor: SS.gray,
                    color: SS.black,
                    background: SS.white
                  }} />}
                    </div>}
                  <button onClick={addEmptyGate} className="px-3 py-2 rounded-xl border text-sm flex items-center gap-2" style={{
                  borderColor: SS.gray,
                  color: SS.black
                }}>
                    <Filter size={16} /> Adicionar gate
                  </button>
                </div>
              </div>

              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{
                    color: SS.black
                  }}>
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
                    {gates.map((g, i) => <tr key={i} className="border-t" style={{
                    color: SS.black,
                    borderColor: SS.gray
                  }}>
                        <td className="py-2 pr-4">
                          <select className="border rounded-lg px-2 py-1" value={g.trait} onChange={e => updateGate(i, "trait", e.target.value)} style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }}>
                            {ALL_PTAS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <select className="border rounded-lg px-2 py-1" value={g.op} onChange={e => updateGate(i, "op", e.target.value)} style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }}>
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                            <option value="=">=</option>
                            <option value="between">entre</option>
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="border rounded-lg px-2 py-1 w-28 text-right" value={g.value ?? ""} onChange={e => updateGate(i, "value", e.target.value === "" ? undefined : Number(e.target.value))} style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="border rounded-lg px-2 py-1 w-28 text-right" value={g.min ?? ""} onChange={e => updateGate(i, "min", e.target.value === "" ? undefined : Number(e.target.value))} style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="border rounded-lg px-2 py-1 w-28 text-right" value={g.max ?? ""} onChange={e => updateGate(i, "max", e.target.value === "" ? undefined : Number(e.target.value))} style={{
                        borderColor: SS.gray,
                        color: SS.black,
                        background: SS.white
                      }} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" className="accent-black" checked={g.enabled} onChange={e => updateGate(i, "enabled", e.target.checked)} />
                        </td>
                        <td className="py-2 pr-4">
                          <button onClick={() => removeGate(i)} className="text-gray-400 hover:text-red-600"><X size={16} /></button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </>}

        {/* Segmentação */}
        <div className="rounded-2xl shadow p-4" style={{
          background: SS.white
        }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2" style={{
              color: SS.black
            }}>
              <TrendingUp size={20} />
              Segmentação Automática
            </h3>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2" style={{
                color: SS.black
              }}>
                <input type="checkbox" className="accent-black" checked={segmentationEnabled} onChange={e => setSegmentationEnabled(e.target.checked)} />
                Ativar Segmentação
              </label>
              <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} className="flex items-center gap-2">
                <BarChart3 size={16} />
                {showChart ? "Ocultar" : "Mostrar"} Gráfico
              </Button>
            </div>
          </div>

          {segmentationEnabled && <>
              {/* Controles de Distribuição */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium mb-3" style={{
                  color: SS.black
                }}>Distribuição dos Grupos</h4>
                  
                  {/* Superior */}
                  <div style={{
                  borderColor: '#10B981',
                  backgroundColor: '#ECFDF5'
                }} className="mb-4 p-3 rounded-lg border-2 bg-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{
                      color: '#065F46'
                    }} className="font-medium text-slate-950">Superior</span>
                      <span style={{
                      color: '#065F46'
                    }} className="font-semibold text-zinc-950">{superiorPercent[0]}%</span>
                    </div>
                    <Slider value={superiorPercent} onValueChange={updateSuperiorPercent} max={100} step={1} className="w-full" />
                  </div>

                  {/* Intermediário */}
                  <div style={{
                  borderColor: '#F59E0B',
                  backgroundColor: '#FFFBEB'
                }} className="mb-4 p-3 rounded-lg border-2 bg-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{
                      color: '#92400E'
                    }} className="font-medium text-slate-950">Intermediário</span>
                      <span style={{
                      color: '#92400E'
                    }} className="font-semibold text-zinc-950">{intermediarioPercent[0]}%</span>
                    </div>
                    <Slider value={intermediarioPercent} onValueChange={updateIntermediarioPercent} max={100} step={1} className="w-full" />
                  </div>

                  {/* Inferior */}
                  <div style={{
                  borderColor: '#EF4444',
                  backgroundColor: '#FEF2F2'
                }} className="mb-4 p-3 rounded-lg border-2 bg-gray-200">
                    <div className="flex items-center justify-between mb-2 bg-gray-200">
                      <span style={{
                      color: '#991B1B'
                    }} className="font-medium text-slate-950">Inferior</span>
                      <span style={{
                      color: '#991B1B'
                    }} className="font-semibold text-zinc-950">{inferiorPercent[0]}%</span>
                    </div>
                    <Slider value={inferiorPercent} onValueChange={updateInferiorPercent} max={100} step={1} className="w-full" />
                  </div>

                  {/* Validação da soma */}
                  <div style={{
                  backgroundColor: superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0] === 100 ? '#ECFDF5' : '#FEF2F2',
                  color: superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0] === 100 ? '#065F46' : '#991B1B'
                }} className="text-sm text-center p-2 rounded-lg bg-gray-200">
                    Total: {superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0]}% 
                    {superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0] === 100 ? ' ✓' : ' (deve ser 100%)'}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3" style={{
                  color: SS.black
                }}>Presets e Estatísticas</h4>
                  
                  {/* Presets rápidos */}
                  <div className="mb-4">
                    <label className="text-sm font-medium" style={{
                    color: SS.black
                  }}>Presets Rápidos:</label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {segmentationPresets.map(preset => <div key={preset.name} className="flex items-center justify-between p-2 border rounded-lg" style={{
                      borderColor: SS.gray
                    }}>
                          <span className="text-sm" style={{
                        color: SS.black
                      }}>{preset.name}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => applySegmentationPreset(preset)} className="px-2 py-1 text-xs rounded border" style={{
                          borderColor: SS.gray,
                          color: SS.black
                        }}>
                              Aplicar
                            </button>
                            {!["Padrão 20/60/20", "Equilibrado 33/34/33", "Quartis 25/50/25"].includes(preset.name) && <button onClick={() => deleteSegmentationPreset(preset.name)} className="text-red-500 hover:text-red-700">
                                <X size={14} />
                              </button>}
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Salvar novo preset */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Nome do novo preset..." value={newPresetName} onChange={e => setNewPresetName(e.target.value)} style={{
                      borderColor: SS.gray,
                      color: SS.black,
                      background: SS.white
                    }} />
                      <button onClick={saveSegmentationPreset} className="px-3 py-2 rounded-lg border text-sm" style={{
                      borderColor: SS.gray,
                      color: SS.black
                    }}>
                        Salvar
                      </button>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2" style={{
                    color: SS.black
                  }}>Distribuição Atual:</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span style={{
                        color: '#10B981'
                      }} className="text-amber-500">Superior:</span>
                        <span style={{
                        color: SS.black
                      }}>{distributionStats.superior.count} animais ({distributionStats.superior.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{
                        color: '#F59E0B'
                      }} className="text-gray-400">Intermediário:</span>
                        <span style={{
                        color: SS.black
                      }}>{distributionStats.intermediario.count} animais ({distributionStats.intermediario.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{
                        color: '#EF4444'
                      }} className="text-red-400">Inferior:</span>
                        <span style={{
                        color: SS.black
                      }}>{distributionStats.inferior.count} animais ({distributionStats.inferior.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              {showChart && <div className="mb-6 p-4 border rounded-lg" style={{
              borderColor: SS.gray,
              backgroundColor: '#FAFAFA'
            }}>
                  <h4 className="text-md font-medium mb-3" style={{
                color: SS.black
              }}>Distribuição Visual</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Gráfico de Pizza */}
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-center" style={{
                    color: SS.black
                  }}>Distribuição por Grupos</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <RechartsPieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Gráfico de Barras */}
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-center" style={{
                    color: SS.black
                  }}>Quantidade por Grupo</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8">
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>}
            </>}
        </div>

        {/* Ações + Resumo */}
        <div className="rounded-2xl shadow p-4" style={{
          background: SS.white
        }}>
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={triggerSegmentation} style={{
                  background: SS.red,
                  color: SS.white
                }} className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-slate-50 bg-red-700 hover:bg-red-600"> 
                  <Check size={18} /> Aplicar Índice 
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Executar segmentação com o índice selecionado</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={exportCSV} className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2" style={{
                  borderColor: SS.gray,
                  color: SS.black
                }}>
                  <Download size={18} /> Exportar CSV
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Baixar dados da segmentação em planilha CSV</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={saveSegmentationToDatabase} style={{
                  borderColor: SS.green,
                  backgroundColor: SS.green,
                  color: SS.white
                }} disabled={!segmentationEnabled || !segmentationTriggered || loading} className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2 text-zinc-50 bg-red-700 hover:bg-red-600">
                  <Database size={18} /> Salvar Segmentação
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar classificações no banco de dados para usar no Nexus</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={saveReportToFiles} className="px-4 py-2 rounded-xl border text-sm flex items-center gap-2" style={{
                  borderColor: SS.gray,
                  color: SS.black
                }}>
                  <Download size={18} /> Salvar Relatório
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar relatório completo na Pasta de Arquivos</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Filtros simplificados */}
            <div className="flex items-center gap-4">
              {/* Filtro por Categoria */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{
                  color: SS.black
                }}>Categoria:</span>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{
                  borderColor: SS.gray,
                  color: SS.black,
                  background: SS.white
                }}>
                  <option value="all">Todas</option>
                  {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              {/* Filtro por Classificação */}
              {segmentationEnabled && segmentationTriggered && <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{
                  color: SS.black
                }}>Classificação:</span>
                  <select value={classificationFilter} onChange={e => setClassificationFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm" style={{
                  borderColor: SS.gray,
                  color: SS.black,
                  background: SS.white
                }}>
                    <option value="all">Todas</option>
                    <option value="Superior">Superior</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Inferior">Inferior</option>
                  </select>
                </div>}
              
              <div className="text-sm" style={{
                color: SS.black
              }}>
                <span className="font-medium">Resultados: {filteredAnimals.length} animais</span>
                {animalSearch.trim() && <span className="ml-2">(busca: "{animalSearch.trim()}")</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Grade de fêmeas */}
        <div className="rounded-2xl shadow p-4" style={{
          background: SS.white
        }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold" style={{
              color: SS.black
            }}>📊 Grade de Fêmeas</h3>
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="flex items-center gap-2">
                <input className="border rounded-lg px-3 py-2 text-sm w-64" placeholder="Buscar por nome ou identificação..." value={animalSearch} onChange={e => setAnimalSearch(e.target.value)} style={{
                  borderColor: SS.gray,
                  color: SS.black,
                  background: SS.white
                }} />
              </div>
              
              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{
                  color: SS.black
                }}>Busca por Nome/ID:</span>
              </div>
              
              {segmentationEnabled && <div className="text-sm" style={{
                color: SS.black
              }}>
                  Exibindo: {filteredAnimals.length} de {segmentedAnimals.length} animais
                </div>}
            </div>
          </div>
          {loading ? <div className="text-sm" style={{
            color: SS.black
          }}>Carregando…</div> : <ScrollArea className="h-[600px] w-full rounded-md border" style={{
            borderColor: SS.gray
          }}>
              <div className="min-w-max pb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b" style={{
                    color: SS.black,
                    borderColor: SS.gray,
                    background: SS.gray
                  }}>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>ID Fazenda</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Nome</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>ID CDCB</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Pai</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Avô Materno</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Bisavô Materno</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Data de Nascimento</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Ordem de Parto</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Categoria</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Fonte</th>
                      {segmentationEnabled && <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Classificação</th>}
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>HHP$®</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>TPI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>NM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>CM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>GM$</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>F SAV</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PTAM</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>CFP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PTAF</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PTAF%</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PTAP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PTAP%</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>DPR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>LIV</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>SCS</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>MAST</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>MET</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>DA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>KET</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>MF</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>PTAT</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>UDC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FLC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>SCE</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>DCE</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>SSB</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>DSB</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>H LIV</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>CCR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>HCR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>GL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>EFC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>BWC</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>STA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>STR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>DFM</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RUA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RLS</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RTP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FTL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RW</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RLR</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FTA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FLS</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FUA</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RUH</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RUW</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>UCL</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>UDP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>FTP</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>RFI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Beta-Casein</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>Kappa-Casein</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>GFI</th>
                      <th className="border px-2 py-1 text-left text-xs" style={{
                      background: SS.gray
                    }}>CustomScore</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnimals.map((a, idx) => {
                    const classificationColor = a.Classification === "Superior" ? "#10B981" : a.Classification === "Intermediário" ? "#F59E0B" : a.Classification === "Inferior" ? "#EF4444" : "transparent";
                    const fonteInfo = getFonteDisplay((a as any).fonte);
                    return <tr key={a.__idKey ? (a as any)[a.__idKey] : a.id ?? idx} className="border-b hover:opacity-90" style={{
                      borderColor: SS.gray,
                      color: SS.black,
                      backgroundColor: segmentationEnabled && a.Classification ? `${classificationColor}10` : "transparent"
                    }}>
                        <td className="border px-2 py-1 text-xs">{(a as any).farm_id || '-'}</td>
                        <td className="border px-2 py-1 text-xs font-medium">{a.__nameKey ? (a as any)[a.__nameKey] : (a as any).name ?? ''}</td>
                        <td className="border px-2 py-1 text-xs">{(a as any).cdcb_id || (a as any).identifier || '-'}</td>
                        <td className="border px-2 py-1 text-xs">{renderPedigreeCell((a as any).sire_naab, (a as any).sire_name)}</td>
                        <td className="border px-2 py-1 text-xs">{renderPedigreeCell((a as any).mgs_naab, (a as any).mgs_name)}</td>
                        <td className="border px-2 py-1 text-xs">{renderPedigreeCell((a as any).mmgs_naab, (a as any).mmgs_name)}</td>
                        <td className="border px-2 py-1 text-xs">
                          {(a as any).birth_date ? formatDate((a as any).birth_date) : '-'}
                          {(a as any).birth_date && <span className="ml-1" style={{
                          color: '#9CA3AF'
                        }}>
                              ({getAge((a as any).birth_date)})
                            </span>}
                        </td>
                         <td className="border px-2 py-1 text-xs">{(a as any).parity_order || '-'}</td>
                         <td className="border px-2 py-1 text-xs">
                         <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          backgroundColor: getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Bezerra' ? '#EBF4FF' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Novilha' ? '#F0FDF4' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Primípara' ? '#FAF5FF' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Secundípara' ? '#FFF7ED' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Multípara' ? '#FEF2F2' : '#F9FAFB',
                          color: getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Bezerra' ? '#1E40AF' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Novilha' ? '#166534' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Primípara' ? '#7C3AED' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Secundípara' ? '#EA580C' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Multípara' ? '#DC2626' : '#6B7280',
                          border: '1px solid',
                          borderColor: getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Bezerra' ? '#DBEAFE' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Novilha' ? '#DCFCE7' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Primípara' ? '#F3E8FF' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Secundípara' ? '#FED7AA' : getAutomaticCategory((a as any).birth_date, (a as any).parity_order) === 'Multípara' ? '#FECACA' : '#E5E7EB'
                        }}>
                           {getAutomaticCategory((a as any).birth_date, (a as any).parity_order)}
                         </span>
                       </td>
                        <td className="border px-2 py-1 text-xs">
                          {fonteInfo.label === '—' ? <span className="text-gray-500">—</span> : <Badge variant="outline" className={fonteInfo.className}>
                              {fonteInfo.label}
                            </Badge>}
                        </td>
                         {segmentationEnabled && <td className="border px-2 py-1 text-xs">
                             {a.Classification && <span className="px-2 py-1 rounded text-xs font-medium" style={{
                          backgroundColor: classificationColor + '20',
                          color: classificationColor,
                          border: `1px solid ${classificationColor}`
                        }}>
                                 {a.Classification}
                               </span>}
                           </td>}
                        <td className="border px-2 py-1 text-xs">{(a as any).hhp_dollar !== undefined && (a as any).hhp_dollar !== null ? Number((a as any).hhp_dollar).toFixed(0) : '-'}</td>
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
                        <td className="border px-2 py-1 text-xs font-bold">{(a as any).CustomScore !== undefined ? Number((a as any).CustomScore).toFixed(1) : '-'}</td>
                      </tr>;
                  })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>}
        </div>

        <div className="text-xs text-center pb-8" style={{
          color: SS.black
        }}>MVP demonstrativo — dados seguros via RLS</div>
        </div>
      </TooltipProvider>
    </div>;
}