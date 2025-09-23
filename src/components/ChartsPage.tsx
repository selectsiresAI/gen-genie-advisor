import React, { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine, ScatterChart, Scatter, PieChart, Pie, Cell, Tooltip, ComposedChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon, Download, Settings, Filter, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface ChartsPageProps {
  farm?: any;
  onBack: () => void;
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

const ChartsPage: React.FC<ChartsPageProps> = ({ farm, onBack }) => {
  const [females, setFemales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(['tpi', 'hhp_dollar', 'nm_dollar']);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [showTrend, setShowTrend] = useState(true);
  const [activeView, setActiveView] = useState<'trends' | 'comparison' | 'distribution' | 'panorama'>('trends');
  const [groupBy, setGroupBy] = useState<'year' | 'category' | 'parity'>('year');
  const [statisticsData, setStatisticsData] = useState<any>({});
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

  const loadFemalesData = async () => {
    if (!farm?.farm_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('females_denorm')
        .select('*')
        .eq('farm_id', farm.farm_id)
        .order('birth_date', { ascending: true });

      if (error) throw error;
      
      setFemales(data || []);
      calculateStatistics(data || []);
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

  // Calcular estatísticas
  const calculateStatistics = (data: any[]) => {
    if (!data.length) return;

    const stats: any = {};
    
    selectedPTAs.forEach(pta => {
      const values = data.map(f => Number(f[pta])).filter(v => !isNaN(v) && v !== null);
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        stats[pta] = {
          mean: values.reduce((sum, val) => sum + val, 0) / values.length,
          median: sorted[Math.floor(sorted.length / 2)],
          min: Math.min(...values),
          max: Math.max(...values),
          std: Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - (values.reduce((s, v) => s + v, 0) / values.length), 2), 0) / values.length),
          count: values.length
        };
      }
    });
    
    setStatisticsData(stats);
  };

  // Processar dados para gráficos de tendência
  const processedTrendData = useMemo(() => {
    if (!females.length) return [];
    
    let processedData: any[] = [];
    
    if (groupBy === 'year') {
      const dataByYear: { [key: string]: any } = {};
      
      females.forEach(female => {
        if (!female.birth_date) return;
        
        const year = new Date(female.birth_date).getFullYear();
        if (!dataByYear[year]) {
          dataByYear[year] = { year, count: 0 };
          selectedPTAs.forEach(pta => {
            dataByYear[year][pta] = [];
          });
        }
        
        dataByYear[year].count++;
        selectedPTAs.forEach(pta => {
          const value = Number(female[pta]);
          if (!isNaN(value) && value !== null) {
            dataByYear[year][pta].push(value);
          }
        });
      });
      
      processedData = Object.values(dataByYear)
        .map((yearData: any) => {
          const result: any = { year: yearData.year, count: yearData.count };
          selectedPTAs.forEach(pta => {
            const values = yearData[pta];
            result[pta] = values.length > 0 
              ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length 
              : null;
          });
          return result;
        })
        .filter(d => d.count > 0)
        .sort((a, b) => a.year - b.year);
    }
    
    else if (groupBy === 'category') {
      const dataByCategory: { [key: string]: any } = {};
      
      females.forEach(female => {
        const category = female.category || 'Sem Categoria';
        if (!dataByCategory[category]) {
          dataByCategory[category] = { category, count: 0 };
          selectedPTAs.forEach(pta => {
            dataByCategory[category][pta] = [];
          });
        }
        
        dataByCategory[category].count++;
        selectedPTAs.forEach(pta => {
          const value = Number(female[pta]);
          if (!isNaN(value) && value !== null) {
            dataByCategory[category][pta].push(value);
          }
        });
      });
      
      processedData = Object.values(dataByCategory)
        .map((catData: any) => {
          const result: any = { name: catData.category, count: catData.count };
          selectedPTAs.forEach(pta => {
            const values = catData[pta];
            result[pta] = values.length > 0 
              ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length 
              : null;
          });
          return result;
        })
        .filter(d => d.count > 0);
    }
    
    else if (groupBy === 'parity') {
      const dataByParity: { [key: string]: any } = {};
      
      females.forEach(female => {
        const parity = female.parity_order || 'Primípara';
        if (!dataByParity[parity]) {
          dataByParity[parity] = { parity, count: 0 };
          selectedPTAs.forEach(pta => {
            dataByParity[parity][pta] = [];
          });
        }
        
        dataByParity[parity].count++;
        selectedPTAs.forEach(pta => {
          const value = Number(female[pta]);
          if (!isNaN(value) && value !== null) {
            dataByParity[parity][pta].push(value);
          }
        });
      });
      
      processedData = Object.values(dataByParity)
        .map((parityData: any) => {
          const result: any = { name: parityData.parity, count: parityData.count };
          selectedPTAs.forEach(pta => {
            const values = parityData[pta];
            result[pta] = values.length > 0 
              ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length 
              : null;
          });
          return result;
        })
        .filter(d => d.count > 0);
    }
    
    return processedData;
  }, [females, selectedPTAs, groupBy]);

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
      buckets[bucketIndex].count++;
    });
    
    buckets.forEach(bucket => {
      bucket.percentage = (bucket.count / values.length) * 100;
    });
    
    return buckets;
  }, [females, selectedPTAs]);

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

  // Renderizar gráfico baseado no tipo selecionado
  const renderChart = () => {
    if (!processedTrendData.length) {
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

    const dataKey = groupBy === 'year' ? 'year' : 'name';
    
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={processedTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey={dataKey} 
              stroke="#666" 
              fontSize={12}
              tickFormatter={(value) => groupBy === 'year' ? value.toString() : value}
            />
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
            {selectedPTAs.map((pta, index) => (
              <Line
                key={pta}
                type="monotone"
                dataKey={pta}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2, r: 4 }}
                name={availablePTAs.find(p => p.key === pta)?.label || pta}
                connectNulls={false}
              />
            ))}
            {showTrend && processedTrendData.length > 1 && (
              <ReferenceLine 
                segment={[
                  { x: processedTrendData[0][dataKey], y: processedTrendData[0][selectedPTAs[0]] },
                  { x: processedTrendData[processedTrendData.length - 1][dataKey], y: processedTrendData[processedTrendData.length - 1][selectedPTAs[0]] }
                ]}
                stroke={COLORS.gray}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={processedTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={dataKey} stroke="#666" fontSize={12} />
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
            {selectedPTAs.map((pta, index) => (
              <Bar
                key={pta}
                dataKey={pta}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                name={availablePTAs.find(p => p.key === pta)?.label || pta}
                opacity={0.8}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={processedTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={dataKey} stroke="#666" fontSize={12} />
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
            {selectedPTAs.map((pta, index) => (
              <Area
                key={pta}
                type="monotone"
                dataKey={pta}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={0.3}
                name={availablePTAs.find(p => p.key === pta)?.label || pta}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
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
              <Card>
                <CardHeader>
                  <CardTitle>
                    Análise de Tendências - {groupBy === 'year' ? 'Por Ano' : groupBy === 'category' ? 'Por Categoria' : 'Por Ordem de Parto'}
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
                    if (!stats) return null;
                    
                    return (
                      <Card key={pta}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{ptaInfo?.label || pta}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Média:</span>
                              <div className="font-medium">{stats.mean.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mediana:</span>
                              <div className="font-medium">{stats.median.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Mín:</span>
                              <div className="font-medium">{stats.min.toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Máx:</span>
                              <div className="font-medium">{stats.max.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Desvio Padrão: {stats.std.toFixed(2)} | {stats.count} animais
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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

// Componente para a visualização Panorama do Rebanho
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
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Filtrar PTAs disponíveis baseado na busca
  const filteredPTAs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return availablePTAs;
    return availablePTAs.filter(pta => 
      pta.label.toLowerCase().includes(q) ||
      pta.description.toLowerCase().includes(q)
    );
  }, [availablePTAs, searchTerm]);

  // Utilitários matemáticos
  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
  const variance = (arr: number[]) => {
    if (arr.length <= 1) return 0;
    const m = mean(arr);
    return arr.reduce((s, v) => s + (v - m) * (v - m), 0) / arr.length;
  };

  const linearRegression = (xs: number[], ys: number[]) => {
    if (xs.length !== ys.length || xs.length === 0) return { a: 0, b: 0 };
    const mx = mean(xs), my = mean(ys);
    const vxx = variance(xs);
    if (vxx === 0) return { a: my, b: 0 };
    const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / xs.length;
    const b = cov / vxx;
    const a = my - b * mx;
    return { a, b };
  };

  const descriptiveStats = (values: number[]) => {
    const vals = values.filter((v) => Number.isFinite(v));
    const m = mean(vals);
    const std = Math.sqrt(variance(vals));
    const max = vals.length ? Math.max(...vals) : 0;
    const min = vals.length ? Math.min(...vals) : 0;
    const belowPct = vals.length ? (vals.filter(v => v < m).length / vals.length) * 100 : 0;
    return { mean: m, std, max, min, belowPct };
  };

  // Herdabilidades
  const getHeritability = (pta: string): string => {
    const heritabilities: { [key: string]: number } = {
      'hhp_dollar': 0.25, 'tpi': 0.25, 'nm_dollar': 0.25, 'cm_dollar': 0.25, 'fm_dollar': 0.25,
      'ptam': 0.35, 'ptaf': 0.28, 'ptap': 0.25, 'scs': 0.15, 'pl': 0.10, 'dpr': 0.07
    };
    const h2 = heritabilities[pta] || 0.30;
    return h2.toFixed(2).replace('.', ',');
  };

  // Processar dados por ano (2021-2025) para cada PTA
  const processedPanoramaData = useMemo(() => {
    if (!females.length || !selectedPTAs.length) return {};

    const dataByPTA: any = {};
    const years = [2021, 2022, 2023, 2024, 2025];

    selectedPTAs.forEach(pta => {
      const yearData: any = {};
      let allValues: number[] = [];

      years.forEach(year => {
        const yearFemales = females.filter(f => {
          if (!f.birth_date) return false;
          const femaleYear = new Date(f.birth_date).getFullYear();
          return femaleYear === year;
        });

        const values = yearFemales
          .map(f => Number(f[pta]))
          .filter(v => !isNaN(v) && v !== null && v !== undefined);

        const meanVal = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : null;
        
        yearData[year] = {
          year,
          n: values.length,
          mean: meanVal ? Math.round(meanVal) : null,
          values
        };

        allValues = allValues.concat(values);
      });

      // Calcular ganho (delta) entre anos
      years.forEach((year, index) => {
        if (index === 0) {
          yearData[year].ganho = 0;
        } else {
          const prevYear = years[index - 1];
          const currentMean = yearData[year].mean;
          const prevMean = yearData[prevYear].mean;
          
          if (currentMean !== null && prevMean !== null) {
            yearData[year].ganho = Math.round(currentMean - prevMean);
          } else {
            yearData[year].ganho = 0;
          }
        }
      });

      // Calcular tendência linear
      const validYearData = years
        .map(year => ({ year, mean: yearData[year].mean }))
        .filter(d => d.mean !== null);

      let trend = 0;
      if (validYearData.length >= 2) {
        const xs = validYearData.map(d => d.year);
        const ys = validYearData.map(d => d.mean!);
        const { b } = linearRegression(xs, ys);
        trend = Math.round(b);
      }

      // Calcular estatísticas descritivas
      const stats = allValues.length > 0 ? {
        ...descriptiveStats(allValues),
        std: Math.round(descriptiveStats(allValues).std),
        max: Math.round(descriptiveStats(allValues).max),
        mean: Math.round(descriptiveStats(allValues).mean),
        min: Math.round(descriptiveStats(allValues).min),
        belowMean: Math.round(descriptiveStats(allValues).belowPct),
        heritability: getHeritability(pta)
      } : null;

      dataByPTA[pta] = {
        years: years.map(year => yearData[year]),
        trend,
        stats,
        farmMean: stats?.mean || 0
      };
    });

    return dataByPTA;
  }, [females, selectedPTAs]);

  // Exportar CSV para uma PTA específica
  const handleExportPTA = (pta: string) => {
    const data = processedPanoramaData[pta];
    if (!data) return;

    const csvContent = [
      'year,n,mean,ganho',
      ...data.years.map((yearData: any) => 
        `${yearData.year},${yearData.n},${yearData.mean || ''},${yearData.ganho}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panorama-${pta}-${farmName || 'fazenda'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `Dados de ${availablePTAs.find(p => p.key === pta)?.label} exportados com sucesso!`
    });
  };

  // Componente TraitCard para cada PTA
  const TraitCard = ({ trait, data }: { trait: string; data: any }) => {
    const ptaInfo = availablePTAs.find(p => p.key === trait);
    const chartData = data.years.filter((y: any) => y.mean !== null);

    if (chartData.length === 0) {
      return (
        <div className="rounded-2xl shadow overflow-hidden bg-white">
          <div className="bg-black text-white px-4 py-2 flex justify-between items-center">
            <h3 className="font-medium">{ptaInfo?.label || trait}</h3>
            <span className="text-sm">Tendência: 0/ano</span>
          </div>
          <div className="p-8 text-center text-muted-foreground">
            <p>Sem dados disponíveis para {ptaInfo?.label}</p>
          </div>
        </div>
      );
    }

    // Calcular linha de tendência
    const trendLineData = chartData.length >= 2 ? chartData.map((d: any) => ({
      year: d.year,
      trend: data.stats.mean + data.trend * (d.year - 2023)
    })) : [];

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const yearData = data.years.find((y: any) => y.year === label);
        return (
          <div className="bg-white/95 shadow rounded-md px-3 py-2 text-xs text-gray-800">
            <div className="font-semibold">Ano: {label}</div>
            <div>N: {yearData?.n || 0}</div>
            <div>Ganho: {yearData?.ganho || 0}</div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="rounded-2xl shadow overflow-hidden bg-white">
        {/* Header tarja preta com tendência geral */}
        <div className="bg-black text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
          <div className="truncate">{ptaInfo?.label || trait}</div>
          <div className="text-xs opacity-90">
            Tendência: {data.trend >= 0 ? "+" : ""}{data.trend}/ano
          </div>
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
              <XAxis 
                dataKey="year" 
                type="number" 
                domain={[2021, 2025]} 
                ticks={[2021, 2022, 2023, 2024, 2025]} 
                tickMargin={6} 
              />
              <YAxis tickMargin={6} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ opacity: 0.9 }} />
              
              {/* Área sombreada sob a linha principal */}
              <Area 
                type="monotone" 
                dataKey="mean" 
                fill={`url(#shade-${trait})`} 
                stroke="none" 
              />
              
              <Line
                type="monotone"
                dataKey="mean"
                name="Média anual"
                stroke="#111827"
                strokeWidth={2}
                dot={{ r: 5, strokeWidth: 2, stroke: '#111827', fill: '#fff' }}
              />
              
              {showFarmAverage && (
                <ReferenceLine 
                  y={data.farmMean} 
                  stroke="#22C3EE" 
                  strokeDasharray="6 6" 
                  ifOverflow="extendDomain" 
                  label={{ 
                    value: `Média ${data.farmMean}`, 
                    position: 'insideTopLeft', 
                    fill: '#0EA5B7', 
                    fontSize: 12 
                  }} 
                />
              )}
              
              {showTrendLine && trendLineData.length === 2 && (
                <Line 
                  type="linear" 
                  dataKey="trend" 
                  name={`Tendência (${data.trend}/ano)`} 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false} 
                  data={trendLineData} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Rodapé estatística descritiva */}
        {data.stats && (
          <div className="border-t px-4 py-2 text-xs text-gray-700 flex flex-wrap gap-x-6 gap-y-1">
            <span><strong>STD:</strong> {data.stats.std}</span>
            <span><strong>Max:</strong> {data.stats.max}</span>
            <span><strong>Média:</strong> {data.stats.mean}</span>
            <span><strong>Min:</strong> {data.stats.min}</span>
            <span><strong>% &lt; Média:</strong> {data.stats.belowMean}%</span>
            <span><strong>Herdabilidade:</strong> {data.stats.heritability}</span>
          </div>
        )}

        {/* Botão de exportar */}
        <div className="px-4 pb-3 pt-1 text-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPTA(trait)}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-xl">Panorama do Rebanho</CardTitle>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="farm-average"
                  checked={showFarmAverage}
                  onCheckedChange={setShowFarmAverage}
                />
                <Label htmlFor="farm-average" className="text-sm">Mostrar média da fazenda</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="trend-line"
                  checked={showTrendLine}
                  onCheckedChange={setShowTrendLine}
                />
                <Label htmlFor="trend-line" className="text-sm">Mostrar tendência genética</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              className="w-72"
              placeholder="Buscar característica (PTA)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedPTAs(availablePTAs.map(p => p.key))}
            >
              Selecionar todas
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedPTAs([])}
            >
              Limpar
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-auto pr-2">
            {filteredPTAs.map((pta) => {
              const isSelected = selectedPTAs.includes(pta.key);
              return (
                <Badge
                  key={pta.key}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer justify-center text-xs py-2 ${
                    isSelected 
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800" 
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPTAs(selectedPTAs.filter(p => p !== pta.key));
                    } else {
                      setSelectedPTAs([...selectedPTAs, pta.key]);
                    }
                  }}
                >
                  {pta.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cards por PTA */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedPTAs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhuma característica selecionada</p>
            <p>Selecione uma ou mais PTAs para visualizar o panorama do rebanho</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {selectedPTAs.map((trait) => {
            const data = processedPanoramaData[trait];
            if (!data) return null;
            return <TraitCard key={trait} trait={trait} data={data} />;
          })}
        </div>
      )}
    </div>
  );
};

export default ChartsPage;