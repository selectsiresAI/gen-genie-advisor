import React, { useState, useMemo, useEffect, useCallback } from "react";
import type { TooltipProps } from "recharts";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, ScatterChart, Scatter, PieChart, Pie, Cell, Tooltip, ComposedChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Download, RefreshCw, Users, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, LineChart as LineChartIcon, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Constants
const YEARS_FIXED = [2021, 2022, 2023, 2024, 2025];
const YEARS = [2021, 2022, 2023, 2024, 2025];

type RawRow = Record<string, any>;

interface PtaTrendYearRecord {
  year: number;
  mean: number | null;
  n: number | null;
}

interface PtaTrendStats {
  mean: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
  sd: number | null;
  n: number | null;
}

interface PtaTrendResult {
  trait_key: string;
  yearly: PtaTrendYearRecord[];
  stats: PtaTrendStats;
}

const DEFAULT_TREND_STATS: PtaTrendStats = {
  mean: null,
  median: null,
  min: null,
  max: null,
  sd: 0,
  n: 0
};

function coerceYear(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickNumber(row: RawRow, keys: string[], fallback = 0): number {
  for (const k of keys) {
    const v = row?.[k];
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toNumber(value: any): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length;
  const sd = Math.sqrt(variance);
  return Number.isFinite(sd) ? sd : 0;
}

function linearRegression(xs: number[], ys: number[]) {
  if (xs.length !== ys.length || xs.length < 2) return { a: 0, b: 0 };
  const meanFn = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = meanFn(xs), my = meanFn(ys);
  const vxx = xs.reduce((s, x) => s + (x - mx) * (x - mx), 0) / xs.length;
  if (vxx === 0) return { a: my, b: 0 };
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.length;
  const b = cov / vxx;
  const a = my - b * mx;
  return { a, b };
}

interface ChartsPageProps {
  farm?: any;
  onBack: () => void;
  onNavigateToHerd?: () => void;
}

// Cores para os gráficos
const COLORS = {
  primary: '#ED1C24',
  secondary: '#1C1C1C', 
  accent: '#8DC63F',
  gray: '#D9D9D9',
  white: '#F2F2F2'
};

const CHART_COLORS = [COLORS.primary, COLORS.accent, COLORS.secondary, '#FFA500', '#8B5CF6', '#06B6D4', '#F59E0B'];

const MONETARY_PTA_KEYS = new Set([
  'hhp_dollar',
  'nm_dollar',
  'cm_dollar',
  'fm_dollar',
  'gm_dollar'
]);

const trendNumberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const trendCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatTrendValue = (ptaKey: string, value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }

  if (MONETARY_PTA_KEYS.has(ptaKey)) {
    return trendCurrencyFormatter.format(value);
  }

  return trendNumberFormatter.format(value);
};

const formatTrendStatValue = (ptaKey: string, value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return 'N/A';
  }

  return formatTrendValue(ptaKey, numericValue);
};

const ChartsPage: React.FC<ChartsPageProps> = ({ farm, onBack, onNavigateToHerd }) => {
  const [females, setFemales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(['tpi', 'hhp_dollar', 'nm_dollar']);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [showTrend, setShowTrend] = useState(true);
  const [activeView, setActiveView] = useState<'trends' | 'comparison' | 'distribution' | 'panorama'>('trends');
  const [groupBy, setGroupBy] = useState<'year' | 'category' | 'parity'>('year');
  const [statisticsData, setStatisticsData] = useState<Record<string, PtaTrendStats>>({});
  const [trendDataByTrait, setTrendDataByTrait] = useState<Record<string, PtaTrendResult>>({});
  const [trendLoading, setTrendLoading] = useState(false);
  const [useComparableScale, setUseComparableScale] = useState(true);
  const [showFarmAverage, setShowFarmAverage] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Lista completa de PTAs disponíveis
  const availablePTAs = [
    { key: 'hhp_dollar', label: 'HHP$®', description: 'Lifetime Net Merit' },
    { key: 'tpi', label: 'TPI', description: 'Total Performance Index' },
    { key: 'nm_dollar', label: 'NM$', description: 'Net Merit' },
    { key: 'cm_dollar', label: 'CM$', description: 'Cheese Merit' },
    { key: 'fm_dollar', label: 'FM$', description: 'Fluid Merit' },
    { key: 'gm_dollar', label: 'GM$', description: 'Grazing Merit' },
    { key: 'f_sav', label: 'F SAV', description: 'Feed Saved' },
    { key: 'ptam', label: 'PTAM', description: 'PTA Milk' },
    { key: 'cfp', label: 'CFP', description: 'Calf Survival' },
    { key: 'ptaf', label: 'PTAF', description: 'PTA Fat' },
    { key: 'ptaf_pct', label: 'PTAF%', description: 'PTA Fat Percentage' },
    { key: 'ptap', label: 'PTAP', description: 'PTA Protein' },
    { key: 'ptap_pct', label: 'PTAP%', description: 'PTA Protein Percentage' },
    { key: 'pl', label: 'PL', description: 'Productive Life' },
    { key: 'dpr', label: 'DPR', description: 'Daughter Pregnancy Rate' },
    { key: 'liv', label: 'LIV', description: 'Livability' },
    { key: 'scs', label: 'SCS', description: 'Somatic Cell Score' },
    { key: 'mast', label: 'MAST', description: 'Mastitis Resistance' },
    { key: 'met', label: 'MET', description: 'Metritis Resistance' },
    { key: 'rp', label: 'RP', description: 'Retained Placenta' },
    { key: 'da', label: 'DA', description: 'Displaced Abomasum' },
    { key: 'ket', label: 'KET', description: 'Ketosis Resistance' },
    { key: 'mf', label: 'MF', description: 'Milking Speed' },
    { key: 'ptat', label: 'PTAT', description: 'Type' },
    { key: 'udc', label: 'UDC', description: 'Udder Composite' },
    { key: 'flc', label: 'FLC', description: 'Foot and Leg Composite' },
    { key: 'sce', label: 'SCE', description: 'Sire Calving Ease' },
    { key: 'dce', label: 'DCE', description: 'Daughter Calving Ease' },
    { key: 'ssb', label: 'SSB', description: 'Sire Stillbirth' },
    { key: 'dsb', label: 'DSB', description: 'Daughter Stillbirth' },
    { key: 'h_liv', label: 'H LIV', description: 'Heifer Livability' },
    { key: 'ccr', label: 'CCR', description: 'Cow Conception Rate' },
    { key: 'hcr', label: 'HCR', description: 'Heifer Conception Rate' },
    { key: 'fi', label: 'FI', description: 'Feed Intake' },
    { key: 'gl', label: 'GL', description: 'Gestation Length' },
    { key: 'efc', label: 'EFC', description: 'Early First Calving' },
    { key: 'bwc', label: 'BWC', description: 'Body Weight Composite' },
    { key: 'sta', label: 'STA', description: 'Stature' },
    { key: 'str', label: 'STR', description: 'Strength' },
    { key: 'dfm', label: 'DFM', description: 'Dairy Form' },
    { key: 'rua', label: 'RUA', description: 'Rear Udder Attachment' },
    { key: 'rls', label: 'RLS', description: 'Rear Leg Side View' },
    { key: 'rtp', label: 'RTP', description: 'Rear Teat Placement' },
    { key: 'ftl', label: 'FTL', description: 'Front Teat Length' },
    { key: 'rw', label: 'RW', description: 'Rump Width' },
    { key: 'rlr', label: 'RLR', description: 'Rear Leg Rear View' },
    { key: 'fta', label: 'FTA', description: 'Front Teat Attachment' },
    { key: 'fls', label: 'FLS', description: 'Foot Angle' },
    { key: 'fua', label: 'FUA', description: 'Fore Udder Attachment' },
    { key: 'ruh', label: 'RUH', description: 'Rear Udder Height' },
    { key: 'ruw', label: 'RUW', description: 'Rear Udder Width' },
    { key: 'ucl', label: 'UCL', description: 'Udder Cleft' },
    { key: 'udp', label: 'UDP', description: 'Udder Depth' },
    { key: 'ftp', label: 'FTP', description: 'Front Teat Placement' },
    { key: 'rfi', label: 'RFI', description: 'Residual Feed Intake' },
    { key: 'gfi', label: 'GFI', description: 'Gross Feed Efficiency' }
  ];

  // Carregar dados das fêmeas
  useEffect(() => {
    if (farm) {
      loadFemalesData();
    }
  }, [farm]);

  useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  useEffect(() => {
    if (activeView === 'trends') {
      setGroupBy('year');
      setChartType('line');
    }
  }, [activeView]);

  const loadFemalesData = async () => {
    if (!farm?.farm_id) return;

    try {
      setLoading(true);
      // Use same approach as HerdPage - load all females with high limit
      const { data, error } = await supabase
        .rpc('get_females_denorm', { target_farm_id: farm.farm_id })
        .order('birth_date', { ascending: true })
        .limit(10000); // Set high limit to ensure all records are loaded

      if (error) throw error;

      setFemales(data || []);
    } catch (error) {
      console.error('Error loading females data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das fêmeas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTrendData = useCallback(async () => {
    if (!farm?.farm_id || selectedPTAs.length === 0) {
      setTrendDataByTrait({});
      setStatisticsData({});
      return;
    }

    try {
      setTrendLoading(true);
      const { data, error } = await supabase.rpc('get_pta_trend_and_stats', {
        farm_id: farm.farm_id,
        trait_keys: selectedPTAs
      });

      if (error) throw error;

      const rawResults = Array.isArray(data) ? data : [];
      const mappedResults: Record<string, PtaTrendResult> = {};
      const statsMap: Record<string, PtaTrendStats> = {};

      rawResults.forEach((item: any) => {
        const traitKey = typeof item?.trait_key === 'string' ? item.trait_key : null;
        if (!traitKey) return;

        const yearlyData = Array.isArray(item?.yearly)
          ? item.yearly.map((entry: any) => ({
              year: toNumber(entry?.year) ?? NaN,
              mean: toNumber(entry?.mean),
              n: toNumber(entry?.n)
            }))
          : [];

        const stats = item?.stats || {};
        const parsedStats: PtaTrendStats = {
          mean: toNumber(stats?.mean),
          median: toNumber(stats?.median),
          min: toNumber(stats?.min),
          max: toNumber(stats?.max),
          sd: toNumber(stats?.sd) ?? 0,
          n: toNumber(stats?.n) ?? 0
        };

        mappedResults[traitKey] = {
          trait_key: traitKey,
          yearly: yearlyData,
          stats: parsedStats
        };
        statsMap[traitKey] = parsedStats;
      });

      selectedPTAs.forEach((trait) => {
        if (!mappedResults[trait]) {
          mappedResults[trait] = {
            trait_key: trait,
            yearly: [],
            stats: { ...DEFAULT_TREND_STATS }
          };
          statsMap[trait] = { ...DEFAULT_TREND_STATS };
        }
      });

      setTrendDataByTrait(mappedResults);
      setStatisticsData(statsMap);
    } catch (error) {
      console.error('Error loading PTA trend data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tendências de PTA",
        variant: "destructive"
      });
    } finally {
      setTrendLoading(false);
    }
  }, [farm?.farm_id, selectedPTAs, toast]);

  const handleRefreshData = async () => {
    await Promise.all([loadFemalesData(), loadTrendData()]);
  };

  const isRefreshing = loading || trendLoading;

  // Processar dados para gráficos de tendência - VERSÃO DEFENSIVA
  const processedTrendData = useMemo(() => {
    if (!females || !Array.isArray(females) || females.length === 0) return [];

    let processedData: any[] = [];
    
    if (groupBy === 'year') {
      // Normaliza dados por ano com segurança
      const byYear = new Map<number, { year: number; n: number; values: number[] }>();
      
      females.forEach(female => {
        if (!female) return;
        
        const birthYear = coerceYear(female.birth_date ? new Date(female.birth_date).getFullYear() : null);
        if (!birthYear) return;
        
        if (!byYear.has(birthYear)) {
          byYear.set(birthYear, { year: birthYear, n: 0, values: [] });
        }
        
        const yearData = byYear.get(birthYear)!;
        yearData.n++;
        
        selectedPTAs.forEach(pta => {
          const value = pickNumber(female, [pta], NaN);
          if (Number.isFinite(value)) {
            yearData.values.push(value);
          }
        });
      });
      
      // Constrói array final para o range fixo
      processedData = YEARS_FIXED.map(year => {
        const entry = byYear.get(year);
        const count = entry?.n || 0;
        const values = entry?.values || [];
        const meanVal = values.length > 0 ? mean(values) : 0;
        
        const result: any = { year, count };
        selectedPTAs.forEach(pta => {
          const ptaValues = values.length > 0 ? values : [];
          result[pta] = ptaValues.length > 0 ? meanVal : null;
        });
        
        return result;
      }).filter(d => d && typeof d === 'object' && (d.count || 0) > 0);
    }
    
    else if (groupBy === 'category') {
      const byCategory = new Map<string, { category: string; n: number; values: number[] }>();
      
      females.forEach(female => {
        if (!female) return;
        
        const category = female.category || 'Sem Categoria';
        
        if (!byCategory.has(category)) {
          byCategory.set(category, { category, n: 0, values: [] });
        }
        
        const catData = byCategory.get(category)!;
        catData.n++;
        
        selectedPTAs.forEach(pta => {
          const value = pickNumber(female, [pta], NaN);
          if (Number.isFinite(value)) {
            catData.values.push(value);
          }
        });
      });
      
      processedData = Array.from(byCategory.values()).map(catData => {
        const result: any = { name: catData.category, count: catData.n };
        selectedPTAs.forEach(pta => {
          const values = catData.values;
          result[pta] = values.length > 0 ? mean(values) : null;
        });
        return result;
      }).filter(d => d && typeof d === 'object' && (d.count || 0) > 0);
    }
    
    else if (groupBy === 'parity') {
      const byParity = new Map<string, { parity: string; n: number; values: number[] }>();
      
      females.forEach(female => {
        if (!female) return;
        
        const parity = String(female.parity_order || 'Primípara');
        
        if (!byParity.has(parity)) {
          byParity.set(parity, { parity, n: 0, values: [] });
        }
        
        const parData = byParity.get(parity)!;
        parData.n++;
        
        selectedPTAs.forEach(pta => {
          const value = pickNumber(female, [pta], NaN);
          if (Number.isFinite(value)) {
            parData.values.push(value);
          }
        });
      });
      
      processedData = Array.from(byParity.values()).map(parData => {
        const result: any = { name: parData.parity, count: parData.n };
        selectedPTAs.forEach(pta => {
          const values = parData.values;
          result[pta] = values.length > 0 ? mean(values) : null;
        });
        return result;
      }).filter(d => d && typeof d === 'object' && (d.count || 0) > 0);
    }
    
    return processedData;
  }, [females, selectedPTAs, groupBy]);

  const trendPreparedData = useMemo(() => {
    const chartByYear = new Map<number, Record<string, number>>();
    const deltaByTrait: Record<string, Record<number, number | null>> = {};
    const trendAvailability: Record<string, boolean> = {};

    selectedPTAs.forEach((trait) => {
      const trendInfo = trendDataByTrait[trait];
      if (!trendInfo) {
        trendAvailability[trait] = false;
        deltaByTrait[trait] = {};
        return;
      }

      const validYearly = (trendInfo.yearly || [])
        .map((entry) => {
          const yearValue = toNumber(entry?.year);
          const meanValue = toNumber(entry?.mean);
          const countValue = toNumber(entry?.n);
          return {
            year: yearValue,
            mean: meanValue,
            n: countValue
          };
        })
        .filter((entry) => entry.year !== null && entry.mean !== null && (entry.n ?? 0) > 0)
        .map((entry) => ({
          year: entry.year as number,
          mean: entry.mean as number
        }))
        .sort((a, b) => a.year - b.year);

      if (!validYearly.length) {
        trendAvailability[trait] = false;
        deltaByTrait[trait] = {};
        return;
      }

      const yearlyMeans = validYearly.map((entry) => entry.mean);
      const overallMean = mean(yearlyMeans);
      const sdAllYears = standardDeviation(yearlyMeans);
      const safeSd = Number.isFinite(sdAllYears) ? sdAllYears : 0;

      const regressionPoints = validYearly.map(({ year, mean }) => {
        const normalizedValue = safeSd === 0 ? 0 : (mean - overallMean) / safeSd;
        const displayValue = useComparableScale ? normalizedValue : mean;
        let row = chartByYear.get(year);
        if (!row) {
          row = { year };
          chartByYear.set(year, row);
        }
        row[trait] = displayValue;
        return { year, value: displayValue };
      });

      const deltaMap: Record<number, number | null> = {};
      if (regressionPoints.length >= 2) {
        const xs = regressionPoints.map((point) => point.year);
        const ys = regressionPoints.map((point) => point.value);
        const { a, b } = linearRegression(xs, ys);
        const predictions: Record<number, number> = {};

        validYearly.forEach(({ year }, index) => {
          const predicted = a + b * year;
          predictions[year] = predicted;
          const row = chartByYear.get(year);
          if (row) {
            row[`${trait}_trend`] = predicted;
          }
          if (index === 0) {
            deltaMap[year] = null;
          } else {
            const prevYear = validYearly[index - 1].year;
            const prevPredicted = predictions[prevYear];
            deltaMap[year] = prevPredicted !== undefined ? predicted - prevPredicted : null;
          }
        });
        trendAvailability[trait] = true;
      } else {
        validYearly.forEach(({ year }) => {
          deltaMap[year] = null;
        });
        trendAvailability[trait] = false;
      }

      deltaByTrait[trait] = deltaMap;
    });

    const chartData = Array.from(chartByYear.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => value);

    return { chartData, deltaByTrait, trendAvailability };
  }, [selectedPTAs, trendDataByTrait, useComparableScale]);

  const TrendTooltipContent = ({ active, label }: TooltipProps<number, string>) => {
    if (!active) {
      return null;
    }

    const hoveredLabel = label ?? '';
    const hoveredYear = typeof hoveredLabel === 'number' ? hoveredLabel : Number(hoveredLabel);
    if (!Number.isFinite(hoveredYear)) {
      return null;
    }

    return (
      <div className="min-w-[200px] space-y-2 text-xs" aria-live="polite">
        <div>
          <div className="text-sm font-semibold text-foreground">Ganho Genético</div>
          <div className="text-[11px] text-muted-foreground">Ano: {hoveredYear}</div>
        </div>
        <div className="space-y-2">
          {selectedPTAs.map((pta) => {
            const color = CHART_COLORS[selectedPTAs.indexOf(pta) % CHART_COLORS.length];
            const ptaInfo = availablePTAs.find((p) => p.key === pta);
            const labelText = ptaInfo?.label || pta.toUpperCase();
            const deltaMap = trendPreparedData.deltaByTrait[pta] ?? {};
            const hasTrend = trendPreparedData.trendAvailability[pta];
            const rawDelta = hasTrend ? deltaMap[hoveredYear] : null;
            const formattedDelta = rawDelta === null || rawDelta === undefined
              ? '—'
              : useComparableScale
                ? trendNumberFormatter.format(rawDelta)
                : formatTrendValue(pta, rawDelta);

            return (
              <div key={pta} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-foreground">{labelText}</div>
                  <div className="text-[11px] text-muted-foreground">
                    ΔG_t:{' '}
                    <span className="font-semibold text-foreground">{formattedDelta}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Dados para gráfico de distribuição
  const distributionData = useMemo(() => {
    if (!females.length || selectedPTAs.length === 0) return [];
    
    const firstPTA = selectedPTAs[0];
    const values = females
      .map(f => Number(f[firstPTA]))
      .filter(v => !isNaN(v) && v !== null);
    
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketCount = 10;
    const bucketSize = (max - min) / bucketCount;
    
    const buckets = Array(bucketCount).fill(0).map((_, i) => ({
      range: `${(min + i * bucketSize).toFixed(1)} - ${(min + (i + 1) * bucketSize).toFixed(1)}`,
      count: 0,
      percentage: 0
    }));
    
    values.forEach(value => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
      if (buckets[bucketIndex]) {
        buckets[bucketIndex].count++;
      }
    });
    
    buckets.forEach(bucket => {
      if (bucket && typeof bucket === 'object' && typeof bucket.count === 'number') {
        bucket.percentage = (bucket.count / values.length) * 100;
      }
    });
    
    return buckets;
  }, [females, selectedPTAs]);

  // Exportar dados
  const handleExport = () => {
    const dataToExport = activeView === 'trends'
      ? trendPreparedData.chartData
      : processedTrendData;

    if (!dataToExport.length) {
      toast({
        title: "Aviso",
        description: "Nenhum dado disponível para exportar",
        variant: "destructive"
      });
      return;
    }

    const csvContent = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row =>
        Object.values(row).map(val =>
          typeof val === 'number' ? val.toFixed(2) : val
        ).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graficos-${farm?.farm_name || 'fazenda'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação concluída",
      description: "Dados exportados com sucesso!"
    });
  };

  // Renderizar gráfico baseado no tipo selecionado
  const renderChart = () => {
    if (trendLoading) {
      return (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <BarChart3 className="w-12 h-12 mx-auto opacity-50 animate-pulse" />
            <p>Carregando tendências...</p>
          </div>
        </div>
      );
    }

    if (!trendPreparedData.chartData.length) {
      return (
        <div className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
            <p>Nenhum dado disponível para exibir</p>
            <p className="text-sm">Importe dados do rebanho para visualizar gráficos</p>
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={trendPreparedData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="year" stroke="#666" fontSize={12} />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip
            content={<TrendTooltipContent />}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          />
          <Legend />
          {selectedPTAs.map((pta, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            const ptaInfo = availablePTAs.find(p => p.key === pta);
            const label = ptaInfo?.label || pta;
            const trendKey = `${pta}_trend`;
            const hasTrend = trendPreparedData.trendAvailability[pta];

            return (
              <React.Fragment key={pta}>
                <Line
                  type="monotone"
                  dataKey={pta}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  name={label}
                  connectNulls={false}
                />
                {showTrend && hasTrend && (
                  <Line
                    type="monotone"
                    dataKey={trendKey}
                    stroke={color}
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                    name={`${label} (ŷ)`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Gráficos e Análises Genéticas</h1>
            {farm && (
              <p className="text-sm text-muted-foreground">{farm.farm_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {females.length} animais
            </Badge>
            {onNavigateToHerd && (
              <Button variant="outline" size="sm" onClick={onNavigateToHerd}>
                <Users className="w-4 h-4 mr-2" />
                Ver Rebanho
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Controls Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações dos Gráficos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Seleção de PTAs */}
                <div className="space-y-2">
                  <Label>PTAs para Análise</Label>
                  <div className="flex flex-wrap gap-1">
                    {availablePTAs.slice(0, 8).map(pta => (
                      <Badge
                        key={pta.key}
                        variant={selectedPTAs.includes(pta.key) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setSelectedPTAs(prev => 
                            prev.includes(pta.key) 
                              ? prev.filter(p => p !== pta.key)
                              : [...prev, pta.key].slice(0, 5) // Máximo 5 PTAs
                          );
                        }}
                      >
                        {pta.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tipo de Gráfico */}
                <div className="space-y-2">
                  <Label>Tipo de Gráfico</Label>
                  <Select
                    value={chartType}
                    onValueChange={(value: any) => setChartType(value)}
                    disabled={activeView === 'trends'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Linha</SelectItem>
                      <SelectItem value="bar">Barras</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agrupamento */}
                <div className="space-y-2">
                  <Label>Agrupar Por</Label>
                  <Select
                    value={groupBy}
                    onValueChange={(value: any) => setGroupBy(value)}
                    disabled={activeView === 'trends'}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">Ano de Nascimento</SelectItem>
                      <SelectItem value="category">Categoria</SelectItem>
                      <SelectItem value="parity">Ordem de Parto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Opções */}
                <div className="space-y-3">
                  <Label>Opções</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="comparable-scale"
                      checked={useComparableScale}
                      onChange={(e) => setUseComparableScale(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="comparable-scale" className="text-sm">Escala comparável</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="trend-line"
                      checked={showTrend} 
                      onChange={(e) => setShowTrend(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="trend-line" className="text-sm">Linha de tendência</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Charts */}
          <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4" />
                Tendências
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Comparação
              </TabsTrigger>
              <TabsTrigger value="distribution" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Distribuição
              </TabsTrigger>
              <TabsTrigger value="panorama" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Panorama do Rebanho
              </TabsTrigger>
            </TabsList>

            {/* Gráficos de Tendência */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Análise de Tendências - Ano de Nascimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderChart()}
                </CardContent>
              </Card>

              {/* Estatísticas */}
              {Object.keys(statisticsData).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedPTAs.map(pta => {
                    const stats = statisticsData[pta];
                    const ptaInfo = availablePTAs.find(p => p.key === pta);
                    
                    // Enhanced null safety check
                    if (!stats || typeof stats !== 'object') return null;
                    
                    return (
                      <Card key={pta}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{ptaInfo?.label || pta}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Média:</span>
                              <div className="font-medium">{formatTrendStatValue(pta, stats?.mean)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mediana:</span>
                              <div className="font-medium">{formatTrendStatValue(pta, stats?.median)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mín:</span>
                              <div className="font-medium">{formatTrendStatValue(pta, stats?.min)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Máx:</span>
                              <div className="font-medium">{formatTrendStatValue(pta, stats?.max)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Desvio Padrão: {formatTrendStatValue(pta, stats?.sd)} | {stats?.n ? Math.round(Number(stats.n)) : 0} animais
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </TabsContent>

            {/* Gráfico de Comparação */}
            <TabsContent value="comparison" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Entre PTAs</CardTitle>
                </CardHeader>
                <CardContent>
                  {processedTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={processedTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey={groupBy === 'year' ? 'year' : 'name'} stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          formatter={(value: any) => [Number(value).toFixed(2), '']}
                        />
                        <Legend />
                        {selectedPTAs.slice(0, 2).map((pta, index) => (
                          <Bar
                            key={pta}
                            dataKey={pta}
                            fill={CHART_COLORS[index]}
                            name={availablePTAs.find(p => p.key === pta)?.label || pta}
                            opacity={0.7}
                          />
                        ))}
                        {selectedPTAs.slice(2, 4).map((pta, index) => (
                          <Line
                            key={pta}
                            type="monotone"
                            dataKey={pta}
                            stroke={CHART_COLORS[index + 2]}
                            strokeWidth={3}
                            name={availablePTAs.find(p => p.key === pta)?.label || pta}
                          />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
                        <p>Nenhum dado disponível para comparação</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gráfico de Distribuição */}
            <TabsContent value="distribution" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Distribuição de Valores - {availablePTAs.find(p => p.key === selectedPTAs[0])?.label || selectedPTAs[0]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {distributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="range" 
                          stroke="#666" 
                          fontSize={10}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                          formatter={(value: any, name: string) => [
                            name === 'count' ? `${value} animais` : `${Number(value).toFixed(1)}%`,
                            name === 'count' ? 'Quantidade' : 'Porcentagem'
                          ]}
                        />
                        <Bar 
                          dataKey="count" 
                          fill={COLORS.primary} 
                          opacity={0.8}
                          name="Quantidade de Animais"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
                        <p>Nenhum dado disponível para distribuição</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pie Chart de Categorias */}
              {groupBy !== 'category' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const categoryData = females.reduce((acc: any, female: any) => {
                        const category = female.category || 'Sem Categoria';
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      }, {});
                      
                      const pieData = Object.entries(categoryData).map(([name, value]) => ({
                        name,
                        value,
                        percentage: ((value as number) / females.length * 100).toFixed(1)
                      }));

                      return pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry) => `${entry.name}: ${entry.percentage}%`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`${value} animais`, 'Quantidade']} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          <p>Nenhuma categoria disponível</p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Panorama View */}
            <TabsContent value="panorama" className="space-y-4">
              <PanoramaRebanhoView 
                females={females} 
                selectedPTAs={selectedPTAs}
                setSelectedPTAs={setSelectedPTAs}
                availablePTAs={availablePTAs}
                showFarmAverage={showFarmAverage}
                setShowFarmAverage={setShowFarmAverage}
                showTrendLine={showTrendLine}
                setShowTrendLine={setShowTrendLine}
                loading={loading}
                farmName={farm?.farm_name}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Lista completa de PTAs para o Panorama
const ALL_PTAS_PANORAMA = [
  "HHP$®","TPI","NM$","CM$","FM$","GM$","F SAV","PTAM","CFP","PTAF","PTAF%","PTAP","PTAP%","PL","DPR","LIV","SCS","MAST","MET","RP","DA","KET","MF","PTAT","UDC","FLC","SCE","DCE","SSB","DSB","H LIV","CCR","HCR","FI","GL","EFC","BWC","STA","STR","DFM","RUA","RLS","RTP","FTL","RW","RLR","FTA","FLS","FUA","RUH","RUW","UCL","UDP","FTP","RFI","GFI"
];

// Mapeamento de rótulos para chaves de banco
const PTA_TO_KEY_MAP: Record<string, string> = {
  "HHP$®": "hhp_dollar",
  "TPI": "tpi",
  "NM$": "nm_dollar",
  "CM$": "cm_dollar",
  "FM$": "fm_dollar",
  "GM$": "gm_dollar",
  "F SAV": "f_sav",
  "PTAM": "ptam",
  "CFP": "cfp",
  "PTAF": "ptaf",
  "PTAF%": "ptaf_pct",
  "PTAP": "ptap",
  "PTAP%": "ptap_pct",
  "PL": "pl",
  "DPR": "dpr",
  "LIV": "liv",
  "SCS": "scs",
  "MAST": "mast",
  "MET": "met",
  "RP": "rp",
  "DA": "da",
  "KET": "ket",
  "MF": "mf",
  "PTAT": "ptat",
  "UDC": "udc",
  "FLC": "flc",
  "SCE": "sce",
  "DCE": "dce",
  "SSB": "ssb",
  "DSB": "dsb",
  "H LIV": "h_liv",
  "CCR": "ccr",
  "HCR": "hcr",
  "FI": "fi",
  "GL": "gl",
  "EFC": "efc",
  "BWC": "bwc",
  "STA": "sta",
  "STR": "str",
  "DFM": "dfm",
  "RUA": "rua",
  "RLS": "rls",
  "RTP": "rtp",
  "FTL": "ftl",
  "RW": "rw",
  "RLR": "rlr",
  "FTA": "fta",
  "FLS": "fls",
  "FUA": "fua",
  "RUH": "ruh",
  "RUW": "ruw",
  "UCL": "ucl",
  "UDP": "udp",
  "FTP": "ftp",
  "RFI": "rfi",
  "GFI": "gfi"
};

// Utility functions
const descriptiveStats = (values: number[]) => {
  const vals = values.filter((v) => Number.isFinite(v));
  const m = mean(vals);
  const std = Math.sqrt(variance(vals));
  const max = vals.length ? Math.max(...vals) : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  const belowPct = vals.length ? (vals.filter(v => v < m).length / vals.length) * 100 : 0;
  return { mean: m, std, max, min, belowPct };
};

const variance = (arr: number[]) => {
  if (arr.length <= 1) return 0;
  const m = mean(arr);
  return arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length;
};

// Herdabilidades (fallback = 0.30 quando não houver)
const H2: Record<string, number> = { 
  PTAM: 0.35, PTAF: 0.28, "NM$": 0.25, TPI: 0.25, SCS: 0.15, DPR: 0.07 
};

// Componente Card para cada característica
function TraitCard({ 
  trait, 
  data, 
  showFarmMean, 
  showTrend 
}: { 
  trait: string; 
  data: Array<{year:number;n:number;mean:number}>; 
  showFarmMean: boolean; 
  showTrend: boolean; 
}) {
  const colorMean = "#111827"; // preto/cinza-900
  const colorFarmMean = "#22C3EE"; // azul claro para média da fazenda
  const colorTrend = "#10B981"; // verde-emerald

  const farmMeanRaw = useMemo(() => mean(data.map(d => d.mean)), [data]);
  const farmMean = Math.round(farmMeanRaw);

  const slopeRounded = useMemo(() => {
    const xs = data.map(d => d.year);
    const ys = data.map(d => d.mean);
    const { b } = linearRegression(xs, ys);
    return Math.round(b);
  }, [data]);

  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      year: d.year,
      n: Math.round(d.n),
      mean: Math.round(d.mean),
      delta: Math.round(i === 0 ? 0 : d.mean - data[i - 1].mean),
      farmMean,
    }));
  }, [data, farmMean]);

  const trendLine = useMemo(() => {
    if (!showTrend) return [] as Array<{year:number; trend:number}>;
    const years = data.map(d => d.year);
    if (years.length < 2) return [];
    const { a, b } = linearRegression(years, data.map(d => d.mean));
    const y1 = Math.round(a + b * years[0]);
    const y2 = Math.round(a + b * years[years.length - 1]);
    return [
      { year: years[0], trend: y1 },
      { year: years[years.length - 1], trend: y2 },
    ];
  }, [data, showTrend]);

  const stats = useMemo(() => descriptiveStats(data.map(d => d.mean)), [data]);
  const h2 = H2[trait] ?? 0.30;

  return (
    <div className="rounded-2xl shadow overflow-hidden bg-white">
      {/* Header tarja preta com tendência geral */}
      <div className="bg-black text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
        <div className="truncate">{trait}</div>
        <div className="text-xs opacity-90">Tendência: {slopeRounded >= 0 ? "+" : ""}{slopeRounded}/ano</div>
      </div>

      <div className="p-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={`shade-${trait}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111827" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#111827" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" type="number" domain={[2021, 2025]} ticks={[2021,2022,2023,2024,2025]} tickMargin={6} />
            <YAxis tickMargin={6} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0]?.payload as any;
                if (!p) return null;
                return (
                  <div className="bg-white/95 shadow rounded-md px-3 py-2 text-xs text-gray-800">
                    <div className="font-semibold">Ano: {label}</div>
                    <div>N: {Math.round(p.n || 0)}</div>
                    <div>Ganho: {Math.round(p.delta || 0)}</div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ opacity: 0.9 }} />
            {/* Área sombreada sob a linha principal */}
            <Area type="monotone" dataKey="mean" fill={`url(#shade-${trait})`} stroke="none" />
            <Line
              type="monotone"
              dataKey="mean"
              name="Média anual"
              stroke={colorMean}
              dot={{ r: 5, strokeWidth: 2, stroke: '#111827', fill: '#fff' }}
              label={{ position: 'top', formatter: (v:any) => Math.round(v), fontSize: 12 }}
            />
            {showFarmMean && (
              <ReferenceLine 
                y={farmMean} 
                stroke="#22C3EE" 
                strokeDasharray="6 6" 
                ifOverflow="extendDomain" 
                label={{ 
                  value: `Média ${farmMean}`, 
                  position: 'insideTopLeft', 
                  fill: '#0EA5B7', 
                  fontSize: 12 
                }} 
              />
            )}
            {showTrend && trendLine.length === 2 && (
              <Line 
                type="linear" 
                dataKey="trend" 
                name={`Tendência (${slopeRounded}/ano)`} 
                stroke={colorTrend} 
                dot={false} 
                data={trendLine}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Rodapé estatística descritiva */}
      <div className="border-t px-4 py-2 text-xs text-gray-700 flex flex-wrap gap-x-6 gap-y-1">
        <span><strong>STD:</strong> {Math.round(stats.std)}</span>
        <span><strong>Max:</strong> {Math.round(stats.max)}</span>
        <span><strong>Média:</strong> {Math.round(stats.mean)}</span>
        <span><strong>Min:</strong> {Math.round(stats.min)}</span>
        <span><strong>% &lt; Média:</strong> {Math.round(stats.belowPct)}%</span>
        <span><strong>Herdabilidade:</strong> {(h2 ?? 0.30).toFixed(2).replace('.', ',')}</span>
      </div>

      {/* Ações */}
      <div className="px-4 pb-3 pt-1 text-right">
        <button
          onClick={() => {
            const rows = chartData.map(d => ({ year: d.year, n: d.n, mean: d.mean, ganho: d.delta }));
            const headers = Object.keys(rows[0] || {});
            const csv = [headers.join(","), ...rows.map(r => headers.map(h => (r as any)[h]).join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); 
            a.href = url; 
            a.download = `panorama_${trait}.csv`; 
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          <Download size={14}/> Exportar CSV
        </button>
      </div>
    </div>
  );
}

// Componente principal do Panorama do Rebanho
const PanoramaRebanhoView: React.FC<{
  females: any[];
  selectedPTAs: string[];
  setSelectedPTAs: (ptas: string[]) => void;
  availablePTAs: any[];
  showFarmAverage: boolean;
  setShowFarmAverage: (show: boolean) => void;
  showTrendLine: boolean;
  setShowTrendLine: (show: boolean) => void;
  loading: boolean;
  farmName?: string;
}> = ({ 
  females, 
  selectedPTAs, 
  setSelectedPTAs, 
  availablePTAs, 
  showFarmAverage, 
  setShowFarmAverage,
  showTrendLine,
  setShowTrendLine,
  loading,
  farmName 
}) => {
  const [showFarmMean, setShowFarmMean] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(["TPI", "NM$"]);

  const filteredPTAs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_PTAS_PANORAMA;
    return ALL_PTAS_PANORAMA.filter((t) => t.toLowerCase().includes(q));
  }, [search]);

  function toggle(t: string) {
    setSelected((prev) => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function reset() { setSelected(["TPI", "NM$"]); }
  function selectAll() { setSelected([...ALL_PTAS_PANORAMA]); }
  function clearAll() { setSelected([]); }

  // Processar dados do Supabase
  const seriesByTrait = useMemo(() => {
    if (!females || !females.length) return {};
    
    const out: Record<string, Array<{year:number;n:number;mean:number}>> = {};
    
    for (const trait of selected) {
      const dbKey = PTA_TO_KEY_MAP[trait];
      if (!dbKey) continue;
      
      // Agrupar dados por ano
      const dataByYear: { [key: string]: number[] } = {};
      
      females.forEach(female => {
        if (!female || !female.birth_date) return;
        const year = new Date(female.birth_date).getFullYear();
        const value = Number(female[dbKey]);
        
        if (!isNaN(value) && value !== null && year >= 2021 && year <= 2025) {
          if (!dataByYear[year]) dataByYear[year] = [];
          dataByYear[year].push(value);
        }
      });
      
      // Calcular médias por ano
      const series = YEARS.map(year => {
        const values = dataByYear[year] || [];
        return {
          year,
          n: values.length,
          mean: values.length > 0 ? mean(values) : 0
        };
      }).filter(d => d.n > 0);
      
      out[trait] = series;
    }
    
    return out;
  }, [selected, females]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">Gráficos — Panorama do Rebanho</h2>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm flex items-center gap-2">
              <input 
                type="checkbox" 
                className="accent-black" 
                checked={showFarmMean} 
                onChange={(e) => setShowFarmMean(e.target.checked)} 
              />
              Mostrar média da fazenda
            </label>
            <label className="text-sm flex items-center gap-2">
              <input 
                type="checkbox" 
                className="accent-black" 
                checked={showTrend} 
                onChange={(e) => setShowTrend(e.target.checked)} 
              />
              Mostrar tendência genética
            </label>
            <button 
              onClick={reset} 
              className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
            >
              Resetar seleção
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-72"
            placeholder="Buscar característica (PTA)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            onClick={selectAll} 
            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            Selecionar todas
          </button>
          <button 
            onClick={clearAll} 
            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-auto pr-2">
          {filteredPTAs.map((t) => {
            const on = selected.includes(t);
            return (
              <label 
                key={t} 
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer ${
                  on ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input 
                  type="checkbox" 
                  className="accent-black" 
                  checked={on} 
                  onChange={() => toggle(t)} 
                />
                <span className="text-sm">{t}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Cards por PTA */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : selected.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Nenhuma característica selecionada</p>
          <p>Selecione uma ou mais PTAs para visualizar o panorama do rebanho</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {selected.map((t) => {
            const data = seriesByTrait[t];
            if (!data || data.length === 0) return null;
            return (
              <TraitCard 
                key={t} 
                trait={t} 
                data={data} 
                showFarmMean={showFarmMean} 
                showTrend={showTrend} 
              />
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center pb-8">
        Dados processados do rebanho da fazenda{farmName ? ` ${farmName}` : ''} com agrupamento por ano de nascimento (2021-2025).
      </div>
    </div>
  );
};

export default ChartsPage;