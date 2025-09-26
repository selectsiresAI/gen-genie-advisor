import React, { useState, useMemo, useEffect, Suspense, lazy } from "react";
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
import { TrendsErrorBoundary } from "./charts/trends/TrendsErrorBoundary";

const TrendsTab = lazy(() => import("./charts/trends/TrendsTab"));

// Constants
const YEARS_FIXED = [2021, 2022, 2023, 2024, 2025];
const YEARS = [2021, 2022, 2023, 2024, 2025];

type RawRow = Record<string, any>;

function pickNumber(row: RawRow, keys: string[], fallback = 0): number {
  for (const k of keys) {
    const v = row?.[k];
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
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

const LABEL_TO_DB: Record<string, string> = {
  'HHP$®': 'hhp_dollar',
  'TPI': 'tpi',
  'NM$': 'nm_dollar',
  'CM$': 'cm_dollar',
  'FM$': 'fm_dollar',
  'GM$': 'gm_dollar',
  'F SAV': 'f_sav',
  'PTAM': 'ptam',
  'CFP': 'cfp',
  'PTAF': 'ptaf',
  'PTAF%': 'ptaf_pct',
  'PTAP': 'ptap',
  'PTAP%': 'ptap_pct',
  'PL': 'pl',
  'DPR': 'dpr',
  'LIV': 'liv',
  'SCS': 'scs',
  'MAST': 'mast',
  'MET': 'met',
  'RP': 'rp',
  'DA': 'da',
  'KET': 'ket',
  'MF': 'mf',
  'PTAT': 'ptat',
  'UDC': 'udc',
  'FLC': 'flc',
  'SCE': 'sce',
  'DCE': 'dce',
  'SSB': 'ssb',
  'DSB': 'dsb',
  'H LIV': 'h_liv',
  'CCR': 'ccr',
  'HCR': 'hcr',
  'FI': 'fi',
  'GL': 'gl',
  'EFC': 'efc',
  'BWC': 'bwc',
  'STA': 'sta',
  'STR': 'str',
  'DFM': 'dfm',
  'RUA': 'rua',
  'RLS': 'rls',
  'RTP': 'rtp',
  'FTL': 'ftl',
  'RW': 'rw',
  'RLR': 'rlr',
  'FTA': 'fta',
  'FLS': 'fls',
  'FUA': 'fua',
  'RUH': 'ruh',
  'RUW': 'ruw',
  'UCL': 'ucl',
  'UDP': 'udp',
  'FTP': 'ftp',
  'RFI': 'rfi',
  'GFI': 'gfi'
};

const DB_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(LABEL_TO_DB).map(([label, key]) => [key, label])
);

const normalizePTAs = (arr: string[]) => arr.map((key) => LABEL_TO_DB[key] || key);

const ChartsPage: React.FC<ChartsPageProps> = ({ farm, onBack, onNavigateToHerd }) => {
  const [females, setFemales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(['tpi', 'hhp_dollar', 'nm_dollar']);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [showTrend, setShowTrend] = useState(true);
  const [activeView, setActiveView] = useState<'trends' | 'comparison' | 'distribution' | 'panorama'>('trends');
  const [groupBy, setGroupBy] = useState<'year' | 'category' | 'parity'>('year');
  const [showFarmAverage, setShowFarmAverage] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const normalizedPTAs = useMemo(() => normalizePTAs(selectedPTAs), [selectedPTAs]);

  useEffect(() => {
    const hasDifference =
      selectedPTAs.length !== normalizedPTAs.length ||
      selectedPTAs.some((value, index) => value !== normalizedPTAs[index]);

    if (hasDifference) {
      setSelectedPTAs([...normalizedPTAs]);
    }
  }, [normalizedPTAs, selectedPTAs]);

  const resolveTraitLabel = useMemo(() => {
    const directMap = new Map<string, string>();
    availablePTAs.forEach((item) => {
      directMap.set(item.key, item.label);
    });

    return (key: string) => directMap.get(key) || DB_TO_LABEL[key] || key;
  }, [availablePTAs]);

  // Carregar dados das fêmeas
  useEffect(() => {
    if (farm) {
      loadFemalesData();
    }
  }, [farm]);

  const loadFemalesData = async () => {
    if (!farm?.farm_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_females_denorm', {
        target_farm_id: farm.farm_id
      });

      if (error) throw error;

      const sorted = (data ?? []).slice().sort((a: any, b: any) => {
        const da = a?.birth_date ? new Date(a.birth_date).getTime() : 0;
        const db = b?.birth_date ? new Date(b.birth_date).getTime() : 0;
        return da - db;
      });

      setFemales(sorted);
    } catch (err: any) {
      console.error('[Tendências] Falha ao carregar', err);
      toast({
        title: "Erro",
        description: err?.message || 'Erro ao carregar dados das fêmeas',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Processar dados para gráficos de tendência - VERSÃO DEFENSIVA
  const { processedTrendData, validSelectedPTAs } = useMemo(() => {
    if (!females || !Array.isArray(females) || females.length === 0) {
      return { processedTrendData: [] as any[], validSelectedPTAs: [] as string[] };
    }

    const existingKeys = new Set(Object.keys(females[0] || {}));
    const validSelectedPTAs = normalizedPTAs.filter((key) => existingKeys.has(key));

    if (validSelectedPTAs.length === 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[Tendências] Nenhuma PTA encontrada nas colunas', {
          selectedPTAs,
          normalizedPTAs,
          sampleKeys: Array.from(existingKeys).slice(0, 20)
        });
      }
      return { processedTrendData: [] as any[], validSelectedPTAs: [] as string[] };
    }

    let processedData: any[] = [];

    if (groupBy === 'year') {
      const byYear = new Map<number, { year: number; n: number; values: number[] }>();

      females.forEach(female => {
        if (!female) return;

        const birthYear = (() => {
          const raw = female?.birth_date;
          if (!raw) return null;
          const d = new Date(raw);
          const y = d.getFullYear();
          return Number.isFinite(y) ? y : null;
        })();

        if (birthYear === null) return;

        if (!byYear.has(birthYear)) {
          byYear.set(birthYear, { year: birthYear, n: 0, values: [] });
        }

        const yearData = byYear.get(birthYear)!;
        yearData.n++;

        validSelectedPTAs.forEach(pta => {
          const value = pickNumber(female, [pta], NaN);
          if (Number.isFinite(value)) {
            yearData.values.push(value);
          }
        });
      });

      processedData = YEARS_FIXED.map(year => {
        const entry = byYear.get(year);
        const count = entry?.n || 0;
        const values = entry?.values || [];
        const meanVal = values.length > 0 ? mean(values) : 0;

        const result: any = { year, count };
        validSelectedPTAs.forEach(pta => {
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

        validSelectedPTAs.forEach(pta => {
          const value = pickNumber(female, [pta], NaN);
          if (Number.isFinite(value)) {
            catData.values.push(value);
          }
        });
      });

      processedData = Array.from(byCategory.values()).map(catData => {
        const result: any = { name: catData.category, count: catData.n };
        validSelectedPTAs.forEach(pta => {
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

        validSelectedPTAs.forEach(pta => {
          const value = pickNumber(female, [pta], NaN);
          if (Number.isFinite(value)) {
            parData.values.push(value);
          }
        });
      });

      processedData = Array.from(byParity.values()).map(parData => {
        const result: any = { name: parData.parity, count: parData.n };
        validSelectedPTAs.forEach(pta => {
          const values = parData.values;
          result[pta] = values.length > 0 ? mean(values) : null;
        });
        return result;
      }).filter(d => d && typeof d === 'object' && (d.count || 0) > 0);
    }

    return { processedTrendData: processedData, validSelectedPTAs };
  }, [females, normalizedPTAs, groupBy, selectedPTAs]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Tendências] farmId', farm?.farm_id);
      console.info('[Tendências] females length', females.length);
      if (females[0]) {
        console.info('[Tendências] sample keys', Object.keys(females[0]).slice(0, 20));
      }
      console.info('[Tendências] selectedPTAs', selectedPTAs, 'normalized', normalizedPTAs, 'valid', validSelectedPTAs);
      console.info('[Tendências] processedTrendData len', processedTrendData.length, 'sample', processedTrendData[0]);
    }
  }, [farm?.farm_id, females, selectedPTAs, processedTrendData, normalizedPTAs, validSelectedPTAs]);

  // Dados para gráfico de distribuição
  const distributionTraitKey = validSelectedPTAs[0] ?? normalizedPTAs[0];
  const distributionTraitLabel = distributionTraitKey ? resolveTraitLabel(distributionTraitKey) : (selectedPTAs[0] || '');

  const distributionData = useMemo(() => {
    if (!females.length || !distributionTraitKey) return [];

    const values = females
      .map(f => Number(f[distributionTraitKey]))
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
  }, [females, distributionTraitKey]);

  // Exportar dados
  const handleExport = () => {
    if (!processedTrendData.length) {
      toast({
        title: "Aviso",
        description: "Nenhum dado disponível para exportar",
        variant: "destructive"
      });
      return;
    }
    
    const csvContent = [
      Object.keys(processedTrendData[0]).join(','),
      ...processedTrendData.map(row => 
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
            <Button variant="outline" size="sm" onClick={loadFemalesData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
                        variant={normalizedPTAs.includes(pta.key) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setSelectedPTAs(prev => {
                            const normalizedPrev = normalizePTAs(prev);
                            if (normalizedPrev.includes(pta.key)) {
                              return normalizedPrev.filter(p => p !== pta.key);
                            }
                            return [...normalizedPrev, pta.key].slice(0, 5);
                          });
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
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
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
                  <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
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
              <TrendsErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                      Carregando tendências…
                    </div>
                  }
                >
                  {isClient ? (
                    <TrendsTab
                      farmId={farm?.farm_id}
                      selectedTraits={selectedPTAs}
                      availableTraits={availablePTAs}
                      showTrendLine={showTrend}
                      colors={CHART_COLORS}
                    />
                  ) : (
                    <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                      Preparando gráfico…
                    </div>
                  )}
                </Suspense>
              </TrendsErrorBoundary>
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
                        {validSelectedPTAs.slice(0, 2).map((pta, index) => (
                          <Bar
                            key={pta}
                            dataKey={pta}
                            fill={CHART_COLORS[index]}
                            name={resolveTraitLabel(pta)}
                            opacity={0.7}
                          />
                        ))}
                        {validSelectedPTAs.slice(2, 4).map((pta, index) => (
                          <Line
                            key={pta}
                            type="monotone"
                            dataKey={pta}
                            stroke={CHART_COLORS[index + 2]}
                            strokeWidth={3}
                            name={resolveTraitLabel(pta)}
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
                    Distribuição de Valores - {distributionTraitLabel || '—'}
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