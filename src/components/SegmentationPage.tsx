import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Download, Settings, Filter, Check, X, RefreshCw, ArrowLeft, TrendingUp, PieChart, BarChart3, Sliders, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpButton } from '@/components/help/HelpButton';
import { HelpHint } from '@/components/help/HelpHint';
import { getAutomaticCategory } from '@/utils/femaleCategories';

import SortableHeader from '@/components/animals/SortableHeader';
import { ANIMAL_METRIC_COLUMNS } from '@/constants/animalMetrics';
import { useAnimalTableSort } from '@/hooks/useAnimalTableSort';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { generateSegmentationPDF, generatePDFBlob } from '@/utils/pdfGenerator';
import { useFileStore } from '@/hooks/useFileStore';
import { fetchFemalesDenormByFarm, isCompleteFemaleRow, type CompleteFemaleDenormRow } from '@/supabase/queries/females';
import { cn } from "@/lib/utils";
import { utils as XLSXUtils, writeFile as writeXLSXFile } from "xlsx";
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
function sanitizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const cleaned = trimmed.replace(/\s+/g, "");
  const direct = Number(cleaned);
  if (!Number.isNaN(direct)) return direct;

  const numeric = cleaned.replace(/[^0-9.,-]/g, "");
  if (!numeric) return null;
  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");
  const hasComma = lastComma !== -1;
  const hasDot = lastDot !== -1;

  let normalized = numeric;
  if (hasComma && hasDot) {
    if (lastComma > lastDot) {
      normalized = numeric.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = numeric.replace(/,/g, "");
    }
  } else if (hasComma) {
    const parts = numeric.split(",");
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length > 0) {
      normalized = parts.join("");
    } else {
      normalized = numeric.replace(/,/g, ".");
    }
  } else if (hasDot) {
    normalized = numeric.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
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
      {code && <span className="font-medium text-foreground">{code}</span>}
      {name && <span className="text-[11px] text-muted-foreground">{name}</span>}
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

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  Bezerra: "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  Novilha: "border-accent/80 bg-accent/20 text-accent-foreground",
  "Primípara": "border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
  "Secundípara": "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "Multípara": "border-destructive/80 bg-destructive/20 text-destructive"
};
function getCategoryBadgeClasses(category: string): string {
  return CATEGORY_BADGE_CLASSES[category] ?? "border-border bg-muted text-muted-foreground";
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

  // Verificar disponibilidade de dados para cada índice
  const indexAvailability = useMemo(() => {
    const hasHHP = animals.some(a => {
      const val = Number(a.hhp_dollar);
      return Number.isFinite(val) && val !== 0;
    });
    const hasTPI = animals.some(a => {
      const val = Number(a.tpi);
      return Number.isFinite(val) && val !== 0;
    });
    const hasNM = animals.some(a => {
      const val = Number(a.nm_dollar);
      return Number.isFinite(val) && val !== 0;
    });
    return {
      "HHP$": hasHHP,
      "TPI": hasTPI,
      "NM$": hasNM,
      "Custom": true
    };
  }, [animals]);

  // Auto-selecionar primeiro índice disponível se o atual não tiver dados
  useEffect(() => {
    if (!indexAvailability[indexSelection]) {
      const firstAvailable = (["HHP$", "TPI", "NM$", "Custom"] as const).find(idx => indexAvailability[idx]);
      if (firstAvailable) {
        setIndexSelection(firstAvailable);
      }
    }
  }, [indexAvailability, indexSelection]);

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

    // Normalizar CustomScore para escala centesimal (0-100) quando índice customizado
    if (indexSelection === "Custom" && rows.length > 0) {
      const scores = rows.map(r => r.CustomScore).filter(s => Number.isFinite(s));
      if (scores.length > 0) {
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const range = maxScore - minScore;
        
        // Se há variação, normaliza para -100 a +100; senão mantém 0
        if (range > 0) {
          rows.forEach(r => {
            if (Number.isFinite(r.CustomScore)) {
              r.CustomScore = ((r.CustomScore - minScore) / range) * 200 - 100;
            }
          });
        } else {
          rows.forEach(r => {
            if (Number.isFinite(r.CustomScore)) {
              r.CustomScore = 0; // Valor médio quando todos são iguais
            }
          });
        }
      }
    }
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
        const automaticCategory = getAutomaticCategory((animal as any).birth_date, null);
        return automaticCategory === categoryFilter;
      });
    }

    // Apply classification filter
    if (classificationFilter !== "all") {
      result = result.filter(a => a.Classification === classificationFilter);
    }
    return result;
  }, [segmentedAnimals, animalSearch, categoryFilter, classificationFilter]);

  const getAnimalSortValue = useCallback((animal: Female, column: string) => {
    const record = animal as Record<string, unknown>;
    switch (column) {
      case 'farm_id':
        return record.farm_id ?? '';
      case 'name':
        return animal.__nameKey ? (animal as Record<string, unknown>)[animal.__nameKey] ?? '' : record.name ?? '';
      case 'identifier':
        return record.identifier ?? '';
      case 'cdcb_id':
        return record.cdcb_id ?? '';
      case 'sire_naab':
        return record.sire_naab ?? record.sire_name ?? '';
      case 'mgs_naab':
        return record.mgs_naab ?? record.mgs_name ?? '';
      case 'mmgs_naab':
        return record.mmgs_naab ?? record.mmgs_name ?? '';
      case 'birth_date':
        return record.birth_date ? new Date(record.birth_date as string).getTime() : null;
      case 'parity_order':
        return record.parity_order ?? null;
      case 'category':
        return getAutomaticCategory(record.birth_date as string | undefined, null);
      case 'fonte':
        return record.fonte ?? '';
      case 'Classification':
        return (animal as any).Classification ?? '';
      case 'CustomScore':
        return (animal as any).CustomScore ?? null;
      default:
        return record[column] ?? '';
    }
  }, [getAutomaticCategory]);

  const {
    sortedItems: sortedAnimals,
    sortConfig: animalSortConfig,
    requestSort: handleSortAnimals
  } = useAnimalTableSort(filteredAnimals, getAnimalSortValue);
  const formatAnimalMetricValue = (animal: Female, key: string) => {
    const rawValue = (animal as Record<string, unknown>)[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '-';
    }
    if (key === 'hhp_dollar') {
      const numericValue = Number(rawValue);
      return Number.isNaN(numericValue) ? rawValue : numericValue.toFixed(0);
    }
    return rawValue as React.ReactNode;
  };

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
  function exportToExcel() {
    const metricColumns = ANIMAL_METRIC_COLUMNS;

    const preparedRows = sortedAnimals.map(a => {
      const fonteInfo = getFonteDisplay((a as any).fonte);
      const customScore = sanitizeNumber(a.CustomScore ?? null);

      const metrics = metricColumns.map(column => {
        const rawValue = (a as any)[column.key];
        if (column.numeric) {
          return sanitizeNumber(rawValue ?? null);
        }
        if (rawValue === null || rawValue === undefined) {
          return "";
        }
        return String(rawValue);
      });

      const autoCategory = getAutomaticCategory((a as any).birth_date, null);

      return {
        id: a.__idKey ? (a as any)[a.__idKey] : a.id ?? "",
        nome: a.__nameKey ? (a as any)[a.__nameKey] : a.name ?? "",
        identificador: (a as any).identifier ?? "",
        id_cdcb: (a as any).fonte === 'Predição' ? '' : ((a as any).cdcb_id ?? ""),
        data_nascimento: (a as any).birth_date ? formatDate((a as any).birth_date) : "",
        ordem_parto: (a as any).parity_order ?? "",
        Categoria: autoCategory,
        Fonte: fonteInfo.label === '—' ? '' : fonteInfo.label,
        CustomScore: customScore,
        Classificacao: a.Classification ?? "",
        metrics
      };
    });

    const numericScores = preparedRows
      .map(row => row.CustomScore)
      .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

    const shouldIncludeNormalized = numericScores.length > 0;
    const minScore = shouldIncludeNormalized ? Math.min(...numericScores) : 0;
    const maxScore = shouldIncludeNormalized ? Math.max(...numericScores) : 0;
    const scoreRange = maxScore - minScore;

    const metricHeaders = metricColumns.map(column => column.label);
    const headers = [
      "id",
      "nome",
      "identificador",
      "id_cdcb",
      "data_nascimento",
      "Ordem de Parto",
      "Categoria",
      "Fonte",
      "CustomScore",
      ...(shouldIncludeNormalized ? ["CustomScore_Normalizado"] : []),
      "Classificacao",
      ...metricHeaders
    ];

    const dataRows = preparedRows.map(row => {
      const normalizedScore = shouldIncludeNormalized && typeof row.CustomScore === 'number' && !Number.isNaN(row.CustomScore)
        ? (scoreRange === 0
          ? 100
          : Math.round((((row.CustomScore - minScore) / scoreRange) * 100) * 100) / 100)
        : null;

      return [
        row.id,
        row.nome,
        row.identificador,
        row.id_cdcb,
        row.data_nascimento,
        row.ordem_parto,
        row.Categoria,
        row.Fonte,
        row.CustomScore,
        ...(shouldIncludeNormalized ? [normalizedScore] : []),
        row.Classificacao,
        ...row.metrics
      ];
    });

    const worksheet = XLSXUtils.aoa_to_sheet([
      headers,
      ...dataRows
    ]);

    const range = worksheet['!ref'] ? XLSXUtils.decode_range(worksheet['!ref']) : null;
    const customScoreColumnIndex = headers.indexOf("CustomScore");
    const normalizedColumnIndex = shouldIncludeNormalized ? headers.indexOf("CustomScore_Normalizado") : -1;

    if (range) {
      for (let rowIdx = range.s.r + 1; rowIdx <= range.e.r; rowIdx++) {
        if (customScoreColumnIndex >= 0) {
          const cellAddress = XLSXUtils.encode_cell({ c: customScoreColumnIndex, r: rowIdx });
          const cell = worksheet[cellAddress];
          if (cell && cell.v !== null && cell.v !== undefined) {
            const parsed = typeof cell.v === 'number' ? cell.v : sanitizeNumber(cell.v);
            if (parsed !== null) {
              cell.v = parsed;
              cell.t = 'n';
              cell.z = "0.00";
            }
          }
        }
        if (normalizedColumnIndex >= 0) {
          const cellAddress = XLSXUtils.encode_cell({ c: normalizedColumnIndex, r: rowIdx });
          const cell = worksheet[cellAddress];
          if (cell && cell.v !== null && cell.v !== undefined) {
            const parsed = typeof cell.v === 'number' ? cell.v : sanitizeNumber(cell.v);
            if (parsed !== null) {
              cell.v = parsed;
              cell.t = 'n';
              cell.z = "0.00";
            }
          }
        }
      }
    }

    worksheet['!cols'] = [
      { wch: 38 }, // id
      { wch: 18 }, // nome
      { wch: 12 }, // identificador
      { wch: 12 }, // id_cdcb
      { wch: 14 }, // data_nascimento
      { wch: 14 }, // Ordem de Parto
      { wch: 12 }, // Categoria
      { wch: 10 }, // Fonte
      { wch: 16 }, // CustomScore
      ...(shouldIncludeNormalized ? [{ wch: 16 }] : []), // CustomScore_Normalizado
      { wch: 12 }, // Classificacao
      ...metricColumns.map(column => ({ wch: column.numeric ? 10 : 12 }))
    ];

    // Aplicar formatação de datas
    import('@/lib/excel-date-formatter').then(({ autoFormatDateColumns }) => {
      autoFormatDateColumns(worksheet, headers, ['nascimento', 'data']);
    });

    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, "Segmentacao");
    writeXLSXFile(workbook, "segmentacao_custom_index.xlsx");
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
        femalesData: sortedAnimals,
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
          description: `Relatório de segmentação com ${sortedAnimals.length} fêmeas`,
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
      const category = getAutomaticCategory((animal as any).birth_date, null);
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
      <HelpButton context="segmentation" />
      <TooltipProvider>
        {/* Header */}
        <div className="border-b">
          <div className="flex h-16 items-center px-4 gap-4">
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{farm.name} - Segmentação</h1>
              <HelpHint content="Classifique o rebanho por índices customizados, gates e percentuais estratégicos" />
            </div>
          </div>
        </div>

      <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
        {/* Header / Index selector */}
        <div className="rounded-2xl shadow p-4 bg-card">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">Segmentação — Índice</h2>
              <HelpHint content="Escolha um índice padrão ou monte um personalizado com os traços mais relevantes" />
            </div>
            <div className="flex items-center gap-2">
              {(["HHP$", "TPI", "NM$", "Custom"] as const).map(opt => {
                const isDisabled = !indexAvailability[opt];
                return (
                  <Tooltip key={opt}>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => !isDisabled && setIndexSelection(opt)} 
                        disabled={isDisabled}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm transition-colors",
                          indexSelection === opt 
                            ? "border-foreground bg-foreground text-background" 
                            : "border-border bg-background text-foreground hover:bg-muted",
                          isDisabled && "opacity-50 cursor-not-allowed hover:bg-background"
                        )}
                      >
                        {opt}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isDisabled 
                          ? `Índice ${opt} não disponível - sem dados no rebanho`
                          : opt === "HHP$" ? "Índice econômico Health, Herd & Profit"
                          : opt === "TPI" ? "Total Performance Index - índice geral de performance"
                          : opt === "NM$" ? "Net Merit Dollar - mérito líquido em dólares"
                          : "Índice personalizado com PTAs selecionadas"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
          {indexSelection !== "Custom" && <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted px-2 py-1 text-sm text-foreground">
              <Settings size={16} /> Índice padrão – somente leitura
            </div>}
        </div>

        {/* Status de dados */}
        <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow">
          <div className="text-sm text-foreground">
            Fonte: <span className="font-semibold">Rebanho</span> {animals && animals.length ? `— ${animals.length} registros` : ""}
            {error && <span className="ml-2 text-red-600">(erro: {error})</span>}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={fetchAnimals} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
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
            <div className="rounded-2xl bg-card p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Quadro A — Selecione as PTAs</h3>
                  <HelpHint content="Escolha os traços que comporão o índice customizado" />
                </div>
                <input className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Buscar PTA…" value={ptaSearch} onChange={e => setPtaSearch(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-auto pr-2">
                {filteredPTAs.map(p => {
                const checked = selectedTraits.includes(p);
                return <label key={p} className={cn("flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-foreground transition-colors", checked ? "border-accent bg-accent/20" : "border-border bg-background hover:bg-muted")}>
                      <input type="checkbox" className="accent-foreground" checked={checked} onChange={() => toggleTrait(p)} />
                      <span className="text-sm">{p}</span>
                    </label>;
              })}
              </div>
              <div className="mt-3 text-sm text-foreground">✔ {selectedTraits.length} PTAs selecionadas</div>
            </div>

            {/* Quadro B – Pesos */}
            <div className="rounded-2xl bg-card p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Quadro B — Pesos por PTA</h3>
                  <HelpHint content="Defina a importância relativa (soma 100%) para cada PTA selecionada" />
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={normalizeAll} className="rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">Normalizar</button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Distribuir pesos proporcionalmente para somar 100%</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={resetWeights} className="rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">Resetar</button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Definir pesos iguais para todas as PTAs selecionadas</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <input className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Nome do preset" value={presetName} onChange={e => setPresetName(e.target.value)} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Digite um nome para salvar esta configuração</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={savePreset} className="rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">Salvar preset</button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Salvar configuração atual para reutilização</p>
                      </TooltipContent>
                    </Tooltip>
                    <HelpHint content="Salve seus pesos favoritos para reutilizar em outras análises" side="bottom" />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" onChange={e => e.target.value && loadPreset(e.target.value)} defaultValue="">
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
                {selectedTraits.map(t => <div key={t} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div className="text-sm font-medium text-foreground">{t}</div>
                    <input type="number" step="0.01" className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-right text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={Number.isFinite(Number(weights[t])) ? weights[t] : 0} onChange={e => updateWeight(t, e.target.value)} />
                  </div>)}
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-foreground">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-foreground" checked={standardize} onChange={e => setStandardize(e.target.checked)} />
                  Padronizar variáveis (Z-score intra-rebanho)
                </label>
                <HelpHint content="Use padronização para comparar PTAs com escalas diferentes" side="bottom" />
                <div>
                  Soma dos pesos: <span className={cn("font-semibold", Math.abs(weightSum - 1) < 1e-6 ? "text-accent" : "text-destructive")}>{weightSum.toFixed(3)}</span>
                  {Math.abs(weightSum - 1) >= 1e-6 && <span className="ml-2 text-xs text-foreground">(clique em Normalizar)</span>}
                </div>
              </div>
            </div>

            {/* Quadro C – Gates */}
            <div className="rounded-2xl bg-card p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Quadro C — Gates de Corte / Restrição</h3>
                  <HelpHint content="Crie filtros mínimos/máximos para excluir animais fora dos critérios" />
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <span className="flex items-center gap-2">
                    <input type="radio" className="accent-foreground" name="phase" checked={gatesPhase === "pre"} onChange={() => setGatesPhase("pre")} /> Pré-cálculo
                  </span>
                  <span className="flex items-center gap-2">
                    <input type="radio" className="accent-foreground" name="phase" checked={gatesPhase === "post"} onChange={() => setGatesPhase("post")} /> Pós-cálculo
                  </span>
                  {gatesPhase === "post" && <div className="flex items-center gap-2">
                      <select className="rounded-lg border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={postGateAction} onChange={e => setPostGateAction(e.target.value as "zero" | "penalize")}>
                        <option value="zero">zerar score</option>
                        <option value="penalize">penalizar</option>
                      </select>
                      {postGateAction === "penalize" && <input type="number" className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={penalty} onChange={e => setPenalty(Number(e.target.value))} />}
                    </div>}
                  <button onClick={addEmptyGate} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
                    <Filter size={16} /> Adicionar gate
                  </button>
                  <HelpHint content="Adicione regras de corte por PTA antes ou depois do cálculo do índice" side="bottom" />
                </div>
              </div>

              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-foreground">
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
                    {gates.map((g, i) => <tr key={i} className="border-t border-border text-foreground">
                        <td className="py-2 pr-4">
                          <select className="rounded-lg border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={g.trait} onChange={e => updateGate(i, "trait", e.target.value)}>
                            {ALL_PTAS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <select className="rounded-lg border border-border bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={g.op} onChange={e => updateGate(i, "op", e.target.value)}>
                            <option value=">=">≥</option>
                            <option value="<=">≤</option>
                            <option value="=">=</option>
                            <option value="between">entre</option>
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={g.value ?? ""} onChange={e => updateGate(i, "value", e.target.value === "" ? undefined : Number(e.target.value))} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={g.min ?? ""} onChange={e => updateGate(i, "min", e.target.value === "" ? undefined : Number(e.target.value))} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="number" className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-right text-foreground focus:outline-none focus:ring-2 focus:ring-ring" value={g.max ?? ""} onChange={e => updateGate(i, "max", e.target.value === "" ? undefined : Number(e.target.value))} />
                        </td>
                        <td className="py-2 pr-4">
                          <input type="checkbox" className="accent-foreground" checked={g.enabled} onChange={e => updateGate(i, "enabled", e.target.checked)} />
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
        <div className="rounded-2xl bg-card p-4 shadow">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <TrendingUp size={20} />
                Segmentação Automática
              </h3>
              <HelpHint content="Defina percentuais para classificar o rebanho em Superior, Intermediário e Inferior" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-foreground">
                <input type="checkbox" className="accent-foreground" checked={segmentationEnabled} onChange={e => setSegmentationEnabled(e.target.checked)} />
                Ativar Segmentação
              </label>
              <HelpHint content="Ative a segmentação para aplicar o índice e dividir os animais em grupos" side="bottom" />
              <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)} className="flex items-center gap-2">
                <BarChart3 size={16} />
                {showChart ? "Ocultar" : "Mostrar"} Gráfico
              </Button>
              <HelpHint content="Visualize ou oculte os gráficos de distribuição por grupo" side="bottom" />
            </div>
          </div>

          {segmentationEnabled && <>
              {/* Controles de Distribuição */}
              <div className="mb-6 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-foreground">Distribuição dos Grupos</h4>
                    <HelpHint content="Ajuste o percentual de animais em cada grupo para refletir sua estratégia" />
                  </div>

                  {/* Superior */}
                  <div className="mb-4 rounded-lg border border-red-500 p-3 bg-stone-200">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-black">Superior</span>
                      <span className="font-semibold text-black">{superiorPercent[0]}%</span>
                    </div>
                    <Slider value={superiorPercent} onValueChange={updateSuperiorPercent} max={100} step={1} className="w-full" />
                  </div>

                  {/* Intermediário */}
                  <div className="mb-4 rounded-lg border border-red-500 p-3 dark:border-red-500 bg-slate-200">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-black">Intermediário</span>
                      <span className="font-semibold text-black">{intermediarioPercent[0]}%</span>
                    </div>
                    <Slider value={intermediarioPercent} onValueChange={updateIntermediarioPercent} max={100} step={1} className="w-full" />
                  </div>

                  {/* Inferior */}
                  <div className="mb-4 rounded-lg border border-red-500 p-3 bg-gray-200">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-black">Inferior</span>
                      <span className="font-semibold text-black">{inferiorPercent[0]}%</span>
                    </div>
                    <Slider value={inferiorPercent} onValueChange={updateInferiorPercent} max={100} step={1} className="w-full" />
                  </div>

                  {/* Validação da soma */}
                  <div className={cn("rounded-lg p-2 text-center text-sm", superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0] === 100 ? "bg-accent/20 text-accent-foreground" : "bg-destructive/10 text-destructive")}>
                    Total: {superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0]}%
                    {superiorPercent[0] + intermediarioPercent[0] + inferiorPercent[0] === 100 ? " ✓" : " (deve ser 100%)"}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3 text-foreground">Presets e Estatísticas</h4>
                  
                  {/* Presets rápidos */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-foreground">Presets Rápidos:</label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {segmentationPresets.map(preset => <div key={preset.name} className="flex items-center justify-between p-2 border border-secondary rounded-lg">
                          <span className="text-sm text-foreground">{preset.name}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => applySegmentationPreset(preset)} className="px-2 py-1 text-xs rounded border border-secondary text-foreground">
                              Aplicar
                            </button>
                            {!["Padrão 20/60/20", "Equilibrado 33/34/33", "Quartis 25/50/25"].includes(preset.name) && <button onClick={() => deleteSegmentationPreset(preset.name)} className="text-destructive hover:text-destructive/80">
                                <X size={14} />
                              </button>}
                          </div>
                        </div>)}
                    </div>
                  </div>

                  {/* Salvar novo preset */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input className="flex-1 border border-input rounded-lg px-3 py-2 text-sm bg-background text-foreground" placeholder="Nome do novo preset..." value={newPresetName} onChange={e => setNewPresetName(e.target.value)} />
                      <button onClick={saveSegmentationPreset} className="px-3 py-2 rounded-lg border border-secondary text-foreground text-sm">
                        Salvar
                      </button>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="p-3 bg-muted rounded-lg">
                    <h5 className="text-sm font-medium mb-2 text-foreground">Distribuição Atual:</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-accent">Superior:</span>
                        <span className="text-foreground">{distributionStats.superior.count} animais ({distributionStats.superior.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-600 dark:text-amber-400">Intermediário:</span>
                        <span className="text-foreground">{distributionStats.intermediario.count} animais ({distributionStats.intermediario.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-destructive">Inferior:</span>
                        <span className="text-foreground">{distributionStats.inferior.count} animais ({distributionStats.inferior.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              {showChart && <div className="mb-6 p-4 border border-secondary rounded-lg bg-muted">
                  <h4 className="text-md font-medium mb-3 text-foreground">Distribuição Visual</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Gráfico de Pizza */}
                    <div>
                      <h5 className="text-sm font-medium mb-2 text-center text-foreground">Distribuição por Grupos</h5>
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
                      <h5 className="text-sm font-medium mb-2 text-center text-foreground">Quantidade por Grupo</h5>
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
        <div className="rounded-2xl shadow p-4 bg-card">
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={triggerSegmentation} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors bg-red-700 hover:bg-red-600">
                  <Check size={18} /> Aplicar Índice
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Executar segmentação com o índice selecionado</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={exportToExcel} className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted">
                  <Download size={18} /> Exportar Excel
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Baixar dados da segmentação em planilha Excel</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={saveSegmentationToDatabase} disabled={!segmentationEnabled || !segmentationTriggered || loading} className="flex items-center gap-2 border border-accent px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 text-slate-50 rounded-xl bg-red-700 hover:bg-red-600 text-sm">
                  <Database size={18} /> Salvar Segmentação
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar classificações no banco de dados para usar no Nexus</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={saveReportToFiles} className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted">
                  <Download size={18} /> Salvar Relatório
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Salvar relatório completo na Pasta de Arquivos</p>
              </TooltipContent>
            </Tooltip>
            <HelpHint content="Gere um PDF com tabelas e gráficos da segmentação para compartilhar" side="bottom" />
            
            {/* Filtros simplificados */}
            <div className="flex items-center gap-4">
              {/* Filtro por Categoria */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Categoria:</span>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="all">Todas</option>
                  {availableCategories.map(category => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              {/* Filtro por Classificação */}
              {segmentationEnabled && segmentationTriggered && <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Classificação:</span>
                  <select value={classificationFilter} onChange={e => setClassificationFilter(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="all">Todas</option>
                    <option value="Superior">Superior</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Inferior">Inferior</option>
                  </select>
                </div>}

              <div className="text-sm text-foreground">
                <span className="font-medium">Resultados: {sortedAnimals.length} animais</span>
                {animalSearch.trim() && <span className="ml-2">(busca: "{animalSearch.trim()}")</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Grade de fêmeas */}
        <div className="rounded-2xl bg-card p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">📊 Grade de Fêmeas</h3>
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="flex items-center gap-2">
                <input className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Buscar por nome ou identificação..." value={animalSearch} onChange={e => setAnimalSearch(e.target.value)} />
              </div>
              
              {/* Year Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Busca por Nome/ID:</span>
              </div>

              {segmentationEnabled && <div className="text-sm text-foreground">
                  Exibindo: {sortedAnimals.length} de {segmentedAnimals.length} animais
                </div>}
            </div>
          </div>
          {loading ? <div className="text-sm text-foreground">Carregando…</div> : <ScrollArea className="h-[600px] w-full rounded-md border border-border">
              <div className="min-w-max pb-4">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-20">
                    <tr className="border-b border-border bg-muted text-foreground">
                      <SortableHeader column="farm_id" label="Fazenda" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium" />
                      <SortableHeader column="name" label="Nome" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium" />
                      <SortableHeader column="identifier" label="Identificador" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="cdcb_id" label="ID CDCB" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="sire_naab" label="Pai" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="mgs_naab" label="Avô Materno" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="mmgs_naab" label="Bisavô Materno" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="birth_date" label="Data de Nascimento" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="parity_order" label="Ordem de Parto" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="category" label="Categoria" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      <SortableHeader column="fonte" label="Fonte" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      {segmentationEnabled && (
                        <SortableHeader column="Classification" label="Classificação" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      )}
                      <SortableHeader column="CustomScore" label="CustomScore" sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      {ANIMAL_METRIC_COLUMNS.map(column => (
                        <SortableHeader key={column.key} column={column.key} label={column.label} sortConfig={animalSortConfig} onSort={handleSortAnimals} className="border border-border px-2 py-1 text-left text-xs font-medium bg-secondary" />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAnimals.map((a, idx) => {
                    const classificationBg = a.Classification === "Superior" ? "bg-accent/10" : a.Classification === "Intermediário" ? "bg-amber-50 dark:bg-amber-950/20" : a.Classification === "Inferior" ? "bg-destructive/10" : "";
                    const category = getAutomaticCategory((a as any).birth_date, null);
                    const fonteInfo = getFonteDisplay((a as any).fonte);
                    return (
                      <tr key={a.__idKey ? (a as any)[a.__idKey] : a.id ?? idx} className={`border-b border-secondary text-foreground hover:opacity-90 ${segmentationEnabled && a.Classification ? classificationBg : ""}`}>
                        <td className="border border-border px-2 py-1 text-xs">{farm.name || '-'}</td>
                        <td className="border border-border px-2 py-1 text-xs font-medium">{a.__nameKey ? (a as any)[a.__nameKey] : (a as any).name ?? ''}</td>
                        <td className="border border-border px-2 py-1 text-xs">{(a as any).identifier || '-'}</td>
                        <td className="border border-border px-2 py-1 text-xs">{(a as any).fonte === 'Predição' ? '-' : ((a as any).cdcb_id || '-')}</td>
                        <td className="border border-border px-2 py-1 text-xs">{renderPedigreeCell((a as any).sire_naab, (a as any).sire_name)}</td>
                        <td className="border border-border px-2 py-1 text-xs">{renderPedigreeCell((a as any).mgs_naab, (a as any).mgs_name)}</td>
                        <td className="border border-border px-2 py-1 text-xs">{renderPedigreeCell((a as any).mmgs_naab, (a as any).mmgs_name)}</td>
                        <td className="border border-border px-2 py-1 text-xs">
                          {(a as any).birth_date ? formatDate((a as any).birth_date) : '-'}
                          {(a as any).birth_date && <span className="ml-1 text-muted-foreground">
                              ({getAge((a as any).birth_date)})
                            </span>}
                        </td>
                         <td className="border border-border px-2 py-1 text-xs">{(a as any).parity_order || '-'}</td>
                         <td className="border border-border px-2 py-1 text-xs">
                         <span className={cn("rounded border px-2 py-1 text-xs font-medium", getCategoryBadgeClasses(category))}>
                           {category}
                         </span>
                       </td>
                        <td className="border border-border px-2 py-1 text-xs">
                          {fonteInfo.label === '—' ? <span className="text-gray-500">—</span> : <Badge variant="outline" className={fonteInfo.className}>
                              {fonteInfo.label}
                            </Badge>}
                        </td>
                        {segmentationEnabled && <td className="border border-border px-2 py-1 text-xs">
                              {a.Classification && <span className={`px-2 py-1 rounded text-xs font-medium border ${a.Classification === "Superior" ? "bg-accent/20 text-accent border-accent" : a.Classification === "Intermediário" ? "bg-amber-100 text-amber-800 border-amber-500 dark:bg-amber-950/30 dark:text-amber-300" : "bg-destructive/20 text-destructive border-destructive"}`}>
                                  {a.Classification}
                                </span>}
                            </td>}
                        <td className="border border-border px-2 py-1 text-xs font-bold">{(a as any).CustomScore !== undefined ? Number((a as any).CustomScore).toFixed(1) : '-'}</td>
                        {ANIMAL_METRIC_COLUMNS.map(column => (
                          <td key={column.key} className="border border-border px-2 py-1 text-xs">
                            {formatAnimalMetricValue(a, column.key) as React.ReactNode}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>}
        </div>

        <div className="pb-8 text-center text-xs text-foreground">MVP demonstrativo — dados seguros via RLS</div>
        </div>
      </TooltipProvider>
    </div>;
}