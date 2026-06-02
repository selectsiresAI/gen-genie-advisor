import React, { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, ScatterChart, Scatter, PieChart, Pie, Cell, Tooltip, ComposedChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings, Download, RefreshCw, Users, TrendingUp, BarChart3, PieChart as PieChartIcon, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { HelpButton } from "@/components/help/HelpButton";
import { HelpHint } from "@/components/help/HelpHint";
import { formatPtaValue } from "@/utils/ptaFormat";
import { getAdaptiveYAxisDomainFromValues } from "@/lib/chart-utils";

import {
  fetchFemalesDenormByFarm,
  isCompleteFemaleRow,
  type CompleteFemaleDenormRow,
} from "@/supabase/queries/females";

type RawRow = Record<string, any>;

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

const ChartsPage: React.FC<ChartsPageProps> = ({ farm, onBack, onNavigateToHerd }) => {
  const [females, setFemales] = useState<CompleteFemaleDenormRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(['tpi', 'hhp_dollar', 'nm_dollar']);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [activeView, setActiveView] = useState<'comparison' | 'distribution' | 'panorama'>('comparison');
  const [groupBy, setGroupBy] = useState<'year' | 'category' | 'parity'>('year');
  const [showFarmAverage, setShowFarmAverage] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const { t, locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";

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

  const loadFemalesData = async () => {
    if (!farm?.farm_id) return;

    try {
      setLoading(true);
      
      const rows = await fetchFemalesDenormByFarm(farm.farm_id, {
        order: { column: 'birth_date', ascending: true, nullsFirst: true },
      });

      const completeRows = rows.filter(isCompleteFemaleRow);

      setFemales(completeRows);
    } catch (error) {
      console.error('Error loading females data:', error);
      toast({
        title: t("charts.errorTitle"),
        description: t("charts.errorLoadingFemales"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processedTrendData = useMemo(() => {
    if (!Array.isArray(females) || females.length === 0 || selectedPTAs.length === 0) return [];
    let rows: any[] = [];

    if (groupBy === 'year') {
      const byYear = new Map<number, { n: number; sums: Record<string, number>; counts: Record<string, number> }>();
      females.forEach((female) => {
        const year = female?.birth_date ? new Date(female.birth_date).getFullYear() : undefined;
        if (!Number.isFinite(year)) return;
        if (!byYear.has(year as number)) {
          byYear.set(year as number, { n: 0, sums: {}, counts: {} });
        }
        const slot = byYear.get(year as number)!;
        slot.n++;
        selectedPTAs.forEach((ptaKey) => {
          const value = Number(female?.[ptaKey]);
          if (Number.isFinite(value)) {
            slot.sums[ptaKey] = (slot.sums[ptaKey] ?? 0) + value;
            slot.counts[ptaKey] = (slot.counts[ptaKey] ?? 0) + 1;
          }
        });
      });
      rows = Array.from(byYear.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, { n, sums, counts }]) => {
          const row: any = { year, count: n };
          selectedPTAs.forEach((ptaKey) => {
            const count = counts[ptaKey] ?? 0;
            row[ptaKey] = count > 0 ? sums[ptaKey] / count : null;
          });
          return row;
        });
    } else if (groupBy === 'category') {
      const byCategory = new Map<string, { n: number; sums: Record<string, number>; counts: Record<string, number> }>();
      females.forEach((female) => {
        const category = (female?.category || t("charts.noCategory")) as string;
        if (!byCategory.has(category)) {
          byCategory.set(category, { n: 0, sums: {}, counts: {} });
        }
        const slot = byCategory.get(category)!;
        slot.n++;
        selectedPTAs.forEach((ptaKey) => {
          const value = Number(female?.[ptaKey]);
          if (Number.isFinite(value)) {
            slot.sums[ptaKey] = (slot.sums[ptaKey] ?? 0) + value;
            slot.counts[ptaKey] = (slot.counts[ptaKey] ?? 0) + 1;
          }
        });
      });
      rows = Array.from(byCategory.entries()).map(([name, { n, sums, counts }]) => {
        const row: any = { name, count: n };
        selectedPTAs.forEach((ptaKey) => {
          const count = counts[ptaKey] ?? 0;
          row[ptaKey] = count > 0 ? sums[ptaKey] / count : null;
        });
        return row;
      });
    } else if (groupBy === 'parity') {
      const byParity = new Map<string, { n: number; sums: Record<string, number>; counts: Record<string, number> }>();
      females.forEach((female) => {
        const parity = String(female?.parity_order ?? '1');
        if (!byParity.has(parity)) {
          byParity.set(parity, { n: 0, sums: {}, counts: {} });
        }
        const slot = byParity.get(parity)!;
        slot.n++;
        selectedPTAs.forEach((ptaKey) => {
          const value = Number(female?.[ptaKey]);
          if (Number.isFinite(value)) {
            slot.sums[ptaKey] = (slot.sums[ptaKey] ?? 0) + value;
            slot.counts[ptaKey] = (slot.counts[ptaKey] ?? 0) + 1;
          }
        });
      });
      rows = Array.from(byParity.entries()).map(([name, { n, sums, counts }]) => {
        const row: any = { name, count: n };
        selectedPTAs.forEach((ptaKey) => {
          const count = counts[ptaKey] ?? 0;
          row[ptaKey] = count > 0 ? sums[ptaKey] / count : null;
        });
        return row;
      });
    }
    return rows;
  }, [females, selectedPTAs, groupBy]);

  const domainTicks = useMemo(() => {
    const years = new Set<number>();
    females.forEach((female) => {
      const year = female?.birth_date ? new Date(female.birth_date).getFullYear() : undefined;
      if (Number.isFinite(year)) {
        years.add(year as number);
      }
    });
    const sorted = Array.from(years).sort((a, b) => a - b);
    return sorted;
  }, [females]);




  // Dados para gráfico de distribuição
  const distributionData = useMemo(() => {
    if (!females.length || selectedPTAs.length === 0) return [];
    const firstPTA = selectedPTAs[0];
    const values = females
      .map((female) => Number(female?.[firstPTA]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      return [{ range: `${min.toFixed(1)}`, count: values.length, percentage: 100 }];
    }
    const bucketCount = 10;
    const bucketSize = (max - min) / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      range: `${(min + index * bucketSize).toFixed(1)} - ${(min + (index + 1) * bucketSize).toFixed(1)}`,
      count: 0,
      percentage: 0,
    }));
    values.forEach((value) => {
      const bucketIndex = Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
      buckets[bucketIndex].count++;
    });
    buckets.forEach((bucket) => {
      bucket.percentage = (bucket.count / values.length) * 100;
    });
    return buckets;
  }, [females, selectedPTAs]);

  // Exportar dados
  const handleExport = () => {
    if (!processedTrendData.length) {
      toast({
        title: t("charts.warningTitle"),
        description: t("charts.noDataToExport"),
        variant: "destructive"
      });
      return;
    }
    
    const escCSV = (v: unknown): string => { const s = v == null ? '' : typeof v === 'number' ? v.toFixed(2) : String(v); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csvContent = [
      Object.keys(processedTrendData[0]).join(','),
      ...processedTrendData.map(row =>
        Object.values(row).map(escCSV).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isEs ? 'graficos' : isEn ? 'charts' : 'graficos'}-${farm?.farm_name || (isEs ? 'finca' : isEn ? 'farm' : 'fazenda')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t("charts.exportDone"),
      description: t("charts.exportSuccess")
    });
  };


  return (
    <div className="min-h-screen bg-background">
      <HelpButton context="charts" />
      
      {/* Header */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("charts.back")}
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <h1 className="text-xl font-semibold">{t("charts.title")}</h1>
            <HelpHint content={t("charts.hintHeader")} />
            {farm && (
              <p className="text-sm text-muted-foreground">{farm.farm_name}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {females.length} {t("charts.animals")}
            </Badge>
            {onNavigateToHerd && (
              <Button variant="outline" size="sm" onClick={onNavigateToHerd}>
                <Users className="w-4 h-4 mr-2" />
                {t("charts.viewHerd")}
              </Button>
            )}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={loadFemalesData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t("charts.refresh")}
              </Button>
              <HelpHint content={t("charts.hintRefresh")} side="bottom" />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                {t("charts.export")}
              </Button>
              <HelpHint content={t("charts.hintExport")} side="bottom" />
            </div>
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
                {t("charts.chartSettings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Seleção de PTAs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("charts.ptasForAnalysis")}</Label>
                    <HelpHint content={t("charts.hintPtas")} side="bottom" />
                  </div>
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
                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("charts.chartType")}</Label>
                    <HelpHint content={t("charts.hintChartType")} side="bottom" />
                  </div>
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">{t("charts.chartTypeLine")}</SelectItem>
                      <SelectItem value="bar">{t("charts.chartTypeBar")}</SelectItem>
                      <SelectItem value="area">{t("charts.chartTypeArea")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agrupamento */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>{t("charts.groupBy")}</Label>
                    <HelpHint content={t("charts.hintGroupBy")} side="bottom" />
                  </div>
                  <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">{t("charts.groupByYear")}</SelectItem>
                      <SelectItem value="category">{t("charts.groupByCategory")}</SelectItem>
                      <SelectItem value="parity">{t("charts.groupByParity")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Main Charts */}
          <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {t("charts.comparison")}
              </TabsTrigger>
              <TabsTrigger value="distribution" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t("charts.distribution")}
              </TabsTrigger>
              <TabsTrigger value="panorama" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {t("charts.herdOverview")}
              </TabsTrigger>
            </TabsList>

            {/* Gráfico de Comparação */}
            <TabsContent value="comparison" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("charts.ptaComparison")}</CardTitle>
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
                          formatter={(value: any, name: string) => [formatPtaValue(name, Number(value)), '']}
                        />
                        <Legend />
                        {selectedPTAs.map((ptaKey, index) => {
                          const color = CHART_COLORS[index % CHART_COLORS.length];
                          const name = availablePTAs.find((p) => p.key === ptaKey)?.label || ptaKey;
                          if (chartType === 'bar') {
                            return <Bar key={ptaKey} dataKey={ptaKey} fill={color} name={name} opacity={0.8} />;
                          }
                          if (chartType === 'area') {
                            return (
                              <Area
                                key={ptaKey}
                                type="monotone"
                                dataKey={ptaKey}
                                name={name}
                                stroke={color}
                                fill={color}
                                fillOpacity={0.15}
                              />
                            );
                          }
                          return (
                            <Line
                              key={ptaKey}
                              type="monotone"
                              dataKey={ptaKey}
                              stroke={color}
                              strokeWidth={3}
                              name={name}
                              dot={false}
                            />
                          );
                        })}
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
                        <p>{t("charts.noDataForComparison")}</p>
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
                  <div className="flex items-center gap-2">
                    <CardTitle>
                      {t("charts.valueDistribution")} - {availablePTAs.find(p => p.key === selectedPTAs[0])?.label || selectedPTAs[0]}
                    </CardTitle>
                    <HelpHint content={t("charts.hintDistribution")} />
                  </div>
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
                            name === 'count' ? `${value} ${t("charts.animals")}` : `${Number(value).toFixed(1)}%`,
                            name === 'count' ? t("charts.quantity") : t("charts.percentage")
                          ]}
                        />
                        <Bar 
                          dataKey="count" 
                          fill={COLORS.primary} 
                          opacity={0.8}
                          name={t("charts.animalCount")}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center space-y-2">
                        <BarChart3 className="w-12 h-12 mx-auto opacity-50" />
                        <p>{t("charts.noDataForDistribution")}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pie Chart de Categorias */}
              {groupBy !== 'category' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle>{t("charts.categoryDistribution")}</CardTitle>
                      <HelpHint content={t("charts.hintCategory")} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const categoryData = females.reduce((acc: any, female: any) => {
                        const category = female.category || t("charts.noCategory");
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
                            <Tooltip formatter={(value: any) => [`${value} ${t("charts.animals")}`, t("charts.quantity")]} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                          <p>{t("charts.noCategoryAvailable")}</p>
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
                domainTicks={domainTicks}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
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
  showTrend,
  domainTicks,
}: {
  trait: string;
  data: Array<{year:number;n:number;mean:number}>;
  showFarmMean: boolean;
  showTrend: boolean;
  domainTicks: number[];
}) {
  const { t, locale } = useTranslation();
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

  // Domínio adaptativo do eixo Y
  const yDomain = useMemo(() => {
    const allValues = [
      ...data.map(d => d.mean),
      ...(showTrend && trendLine.length ? trendLine.map(t => t.trend) : []),
      ...(showFarmMean ? [farmMean] : []),
    ].filter((v): v is number => Number.isFinite(v));
    return getAdaptiveYAxisDomainFromValues(allValues);
  }, [data, showTrend, showFarmMean, farmMean, trendLine]);

  return (
    <div className="rounded-2xl shadow overflow-hidden bg-white">
      {/* Header tarja preta com tendência geral */}
      <div className="bg-black text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
        <div className="truncate">{trait}</div>
        <div className="text-xs opacity-90">{t("charts.trend")}: {slopeRounded >= 0 ? "+" : ""}{slopeRounded}{t("charts.perYear")}</div>
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
            <XAxis dataKey="year" type="number" domain={[domainTicks[0], domainTicks[domainTicks.length - 1]]} ticks={domainTicks} tickMargin={6} />
            <YAxis domain={yDomain} tickMargin={6} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0]?.payload as any;
                if (!p) return null;
                return (
                  <div className="bg-white/95 shadow rounded-md px-3 py-2 text-xs text-gray-800">
                    <div className="font-semibold">{t("charts.year")}: {label}</div>
                    <div>N: {Math.round(p.n || 0)}</div>
                    <div>{t("charts.gain")}: {formatPtaValue(trait, p.delta)}</div>
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
              name={t("charts.annualMean")}
              stroke={colorMean}
              dot={{ r: 5, strokeWidth: 2, stroke: '#111827', fill: '#fff' }}
              label={{ position: 'top', formatter: (v:any) => formatPtaValue(trait, v), fontSize: 12 }}
            />
            {showFarmMean && (
              <ReferenceLine 
                y={farmMean} 
                stroke="#22C3EE" 
                strokeDasharray="6 6" 
                ifOverflow="extendDomain" 
                label={{ 
                  value: `${t("charts.mean")} ${formatPtaValue(trait, farmMean)}`,
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
                name={`${t("charts.trendLabel")} (${slopeRounded}${t("charts.perYear")})`}
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
        <span><strong>STD:</strong> {formatPtaValue(trait, stats.std)}</span>
        <span><strong>Max:</strong> {formatPtaValue(trait, stats.max)}</span>
        <span><strong>{t("charts.mean")}:</strong> {formatPtaValue(trait, stats.mean)}</span>
        <span><strong>Min:</strong> {formatPtaValue(trait, stats.min)}</span>
        <span><strong>{t("charts.belowMean")}:</strong> {Math.round(stats.belowPct)}%</span>
        <span><strong>{t("charts.heritability")}:</strong> {(h2 ?? 0.30).toFixed(2).replace('.', locale === "pt-BR" ? ',' : '.')}</span>
      </div>

      {/* Ações */}
      <div className="px-4 pb-3 pt-1 text-right">
        <button
          onClick={() => {
            const rows = chartData.map(d => ({ year: d.year, n: d.n, mean: d.mean, ganho: d.delta }));
            const headers = Object.keys(rows[0] || {});
            const esc = (v: unknown): string => { const s = v == null ? '' : String(v); return (s.includes(',') || s.includes('"') || s.includes('\n')) ? '"' + s.replace(/"/g, '""') + '"' : s; };
            const csv = [headers.join(","), ...rows.map(r => headers.map(h => esc((r as any)[h])).join(","))].join("\n");
            const blob = new Blob(['\uFEFF' + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); 
            a.href = url; 
            a.download = `panorama_${trait}.csv`; 
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-xs inline-flex items-center gap-1 px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          <Download size={14}/> {t("charts.exportCsv")}
        </button>
      </div>
    </div>
  );
}

// Componente principal do Panorama do Rebanho
const PanoramaRebanhoView: React.FC<{
  females: any[];
  selectedPTAs: string[];
  setSelectedPTAs: React.Dispatch<React.SetStateAction<string[]>>;
  availablePTAs: any[];
  showFarmAverage: boolean;
  setShowFarmAverage: (show: boolean) => void;
  showTrendLine: boolean;
  setShowTrendLine: (show: boolean) => void;
  loading: boolean;
  farmName?: string;
  domainTicks: number[];
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
  farmName,
  domainTicks,
}) => {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredPTAs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availablePTAs;
    return availablePTAs.filter((pta: any) => {
      const label = String(pta.label ?? "").toLowerCase();
      const description = String(pta.description ?? "").toLowerCase();
      return label.includes(query) || description.includes(query);
    });
  }, [search, availablePTAs]);

  const toggle = (key: string) => {
    setSelectedPTAs((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const reset = () => setSelectedPTAs(["tpi", "nm_dollar"]);
  const selectAll = () => setSelectedPTAs(availablePTAs.map((pta: any) => pta.key));
  const clearAll = () => setSelectedPTAs([]);

  // Processar dados do Supabase
  const seriesByTrait = useMemo(() => {
    if (!females || !females.length) return {};

    const out: Record<string, Array<{ year: number; n: number; mean: number }>> = {};

    selectedPTAs.forEach((key) => {
      const byYear = new Map<number, number[]>();
      females.forEach((female) => {
        const year = female?.birth_date ? new Date(female.birth_date).getFullYear() : undefined;
        const value = Number(female?.[key]);
        if (Number.isFinite(year) && Number.isFinite(value)) {
          const list = byYear.get(year as number) ?? [];
          list.push(value as number);
          byYear.set(year as number, list);
        }
      });

      out[key] = domainTicks
        .map((year) => {
          const values = byYear.get(year) ?? [];
          return {
            year,
            n: values.length,
            mean: values.length ? mean(values) : 0,
          };
        })
        .filter((entry) => entry.n > 0);
    });

    return out;
  }, [selectedPTAs, females, domainTicks]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">{t("charts.panoramaTitle")}</h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={showFarmAverage}
                  onChange={(e) => setShowFarmAverage(e.target.checked)}
                />
                {t("charts.showFarmAverage")}
              </label>
              <HelpHint content={t("charts.hintFarmAverage")} side="bottom" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={showTrendLine}
                  onChange={(e) => setShowTrendLine(e.target.checked)}
                />
                {t("charts.showGeneticTrend")}
              </label>
              <HelpHint content={t("charts.hintTrend")} side="bottom" />
            </div>
            <button
              onClick={reset}
              className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
            >
              {t("charts.resetSelection")}
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm w-72"
            placeholder={t("charts.searchTrait")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <HelpHint content={t("charts.hintSearch")} side="bottom" />
          <button
            onClick={selectAll}
            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            {t("charts.selectAll")}
          </button>
          <button 
            onClick={clearAll} 
            className="px-3 py-2 rounded-xl border text-sm hover:bg-gray-50"
          >
            {t("charts.clear")}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-auto pr-2">
          {filteredPTAs.map((pta: any) => {
            const active = selectedPTAs.includes(pta.key);
            return (
              <label
                key={pta.key}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer ${
                  active ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-black"
                  checked={active}
                  onChange={() => toggle(pta.key)}
                />
                <span className="text-sm">{pta.label}</span>
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
            <p className="text-sm text-muted-foreground">{t("charts.loadingData")}</p>
          </div>
        </div>
      ) : selectedPTAs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">{t("charts.noTraitSelected")}</p>
          <p>{t("charts.selectPtasToView")}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {selectedPTAs.map((key) => {
            const data = seriesByTrait[key];
            if (!data || data.length === 0) return null;
            const label = availablePTAs.find((pta: any) => pta.key === key)?.label || key.toUpperCase();
            return (
              <TraitCard
                key={key}
                trait={label}
                data={data}
                showFarmMean={showFarmAverage}
                showTrend={showTrendLine}
                domainTicks={domainTicks}
              />
            );
          })}
        </div>
      )}

      <div className="text-xs text-gray-500 text-center pb-8">
        {t("charts.farmDataFooter")}{farmName ? ` ${farmName}` : ''} {t("charts.yearGroupingFooter")}
      </div>
    </div>
  );
};

export default ChartsPage;