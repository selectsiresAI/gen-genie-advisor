import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Calculator, ArrowLeft, Users, Target, Database, FileUp } from 'lucide-react';
import { read, utils, writeFileXLSX } from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

// Colunas específicas para Nexus 1
const NEXUS1_COLUMNS = [
  'ID Fazenda', 'Nome', 'HHP$®', 'TPI', 'NM$', 'CM$', 'FM$', 'GM$', 'F SAV', 'PTAM', 'CFP',
  'PTAF', 'PTAF%', 'PTAP', 'PTAP%', 'PL', 'DPR', 'LIV', 'SCS', 'MAST', 'MET', 'RP', 'DA',
  'KET', 'MF', 'PTAT', 'UDC', 'FLC', 'SCE', 'DCE', 'SSB', 'DSB', 'H LIV', 'CCR', 'HCR',
  'FI', 'GL', 'EFC', 'BWC', 'STA', 'STR', 'DFM', 'RUA', 'RLS', 'RTP', 'FTL', 'RW', 'RLR',
  'FTA', 'FLS', 'FUA', 'RUH', 'RUW', 'UCL', 'UDP', 'FTP', 'RFI'
];

// PTAs que devem ser calculados (excluindo colunas de identificação)
const PTA_COLUMNS = NEXUS1_COLUMNS.slice(2); // Remove 'ID Fazenda' e 'Nome'

interface Female {
  [key: string]: any;
}

interface Bull {
  [key: string]: any;
}

interface PredictionResult {
  female: Female;
  bull: Bull;
  predictions: Record<string, number>;
  bullNumber: number; // 1, 2, ou 3
}

interface Nexus1GenomicPredictionProps {
  onBack: () => void;
}

const Nexus1GenomicPrediction: React.FC<Nexus1GenomicPredictionProps> = ({ onBack }) => {
  const { toast } = useToast();
  
  // Estados
  const [dataSource, setDataSource] = useState<'upload' | 'database'>('upload');
  const [females, setFemales] = useState<Female[]>([]);
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<number>(1); // 1, 2 ou 3 touros
  const [selectedBullIds, setSelectedBullIds] = useState<string[]>(['']);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingDatabase, setLoadingDatabase] = useState(false);
  
  // Filtros para fêmeas do banco
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(['donor', 'inter', 'recipient']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['bezerra', 'novilha', 'primipara', 'secundipara', 'multipara']);

  // Função para calcular predições genômicas
  const calculateGenomicPrediction = (femalePTA: number, bullPTA: number): number => {
    return ((femalePTA + bullPTA) / 2) * 0.93;
  };

  // Parse de arquivos
  const parseFile = useCallback(async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let data: any[];
          
          if (file.name.toLowerCase().endsWith('.xlsx')) {
            const wb = read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            data = utils.sheet_to_json(ws);
          } else if (file.name.toLowerCase().endsWith('.csv')) {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const obj: any = {};
              headers.forEach((h, i) => obj[h] = values[i] || '');
              return obj;
            });
          } else {
            reject(new Error('Formato não suportado. Use .xlsx ou .csv'));
            return;
          }

          resolve(data);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo'));
        }
      };
      
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }, []);

  // Upload de fêmeas
  const handleFemaleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      setFemales(data);
      
      toast({
        title: 'Fêmeas carregadas',
        description: `${data.length} fêmeas carregadas com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
    
    e.target.value = '';
  };

  // Upload de touros
  const handleBullUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      setBulls(data);
      
      toast({
        title: 'Touros carregados',
        description: `${data.length} touros carregados com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
    
    e.target.value = '';
  };

  // Calcular predições
  const calculatePredictions = () => {
    if (females.length === 0 || bulls.length === 0) {
      toast({
        title: 'Dados insuficientes',
        description: 'Carregue fêmeas e touros antes de calcular',
        variant: 'destructive'
      });
      return;
    }

    const validBullIds = selectedBullIds.filter(id => id.trim() !== '');
    if (validBullIds.length === 0) {
      toast({
        title: 'Touros não selecionados',
        description: 'Selecione pelo menos um touro para acasalamento',
        variant: 'destructive'
      });
      return;
    }

    setIsCalculating(true);

    try {
      const results: PredictionResult[] = [];

      females.forEach(female => {
        validBullIds.forEach((bullId, index) => {
          const bull = bulls.find(b => b['ID Fazenda'] === bullId || b['Nome'] === bullId);
          
          if (!bull) {
            console.warn(`Touro ${bullId} não encontrado`);
            return;
          }

          const predictions: Record<string, number> = {};
          
          // Calcular predições para cada PTA
          PTA_COLUMNS.forEach(pta => {
            const femalePTA = parseFloat(female[pta]) || 0;
            const bullPTA = parseFloat(bull[pta]) || 0;
            
            if (!isNaN(femalePTA) && !isNaN(bullPTA)) {
              predictions[pta] = calculateGenomicPrediction(femalePTA, bullPTA);
            }
          });

          results.push({
            female,
            bull,
            predictions,
            bullNumber: index + 1
          });
        });
      });

      setPredictions(results);
      
      toast({
        title: 'Predições calculadas',
        description: `${results.length} predições geradas com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Erro ao calcular predições',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Exportar resultados
  const exportResults = () => {
    if (predictions.length === 0) return;

    const exportData = predictions.map(result => ({
      'ID Fazenda Fêmea': result.female['ID Fazenda'] || result.female['Nome'],
      'Nome Fêmea': result.female['Nome'],
      'ID Touro': result.bull['ID Fazenda'] || result.bull['Nome'],
      'Nome Touro': result.bull['Nome'],
      'Acasalamento': `Touro ${result.bullNumber}`,
      ...result.predictions
    }));

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Predições Nexus 1');
    writeFileXLSX(wb, 'Predicoes_Nexus1.xlsx');

    toast({
      title: 'Exportação concluída',
      description: 'Arquivo exportado com sucesso'
    });
  };

  // Carregar fêmeas do banco de dados
  const loadFemalesFromDatabase = async () => {
    if (selectedClassifications.length === 0 || selectedCategories.length === 0) {
      toast({
        title: 'Filtros obrigatórios',
        description: 'Selecione ao menos uma classificação e uma categoria',
        variant: 'destructive'
      });
      return;
    }

    setLoadingDatabase(true);
    try {
      const { data, error } = await supabase
        .from('females_denorm')
        .select('*')
        .in('segmentation_class', selectedClassifications as ('donor' | 'inter' | 'recipient')[])
        .not('segmentation_class', 'is', null);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma fêmea encontrada',
          description: 'Não há fêmeas segmentadas com os filtros selecionados',
          variant: 'destructive'
        });
        setFemales([]);
        return;
      }

      // Filtrar por categoria usando a categoria automática
      const getAutomaticCategory = (birthDate: string | null, parityOrder: number | null) => {
        if (!birthDate) return 'indefinida';
        
        const birth = new Date(birthDate);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                           (today.getMonth() - birth.getMonth());
        
        if (ageInMonths < 12) return 'bezerra';
        if (ageInMonths < 24 || !parityOrder || parityOrder === 0) return 'novilha';
        if (parityOrder === 1) return 'primipara';
        if (parityOrder === 2) return 'secundipara';
        return 'multipara';
      };

      const filteredFemales = data.filter(female => {
        const category = getAutomaticCategory(female.birth_date, female.parity_order);
        return selectedCategories.includes(category);
      });

      // Converter para formato esperado pelo Nexus
      const convertedFemales = filteredFemales.map(female => ({
        'ID Fazenda': female.identifier || female.name,
        'Nome': female.name,
        'HHP$®': female.hhp_dollar || 0,
        'TPI': female.tpi || 0,
        'NM$': female.nm_dollar || 0,
        'CM$': female.cm_dollar || 0,
        'FM$': female.fm_dollar || 0,
        'GM$': female.gm_dollar || 0,
        'F SAV': female.f_sav || 0,
        'PTAM': female.ptam || 0,
        'CFP': female.cfp || 0,
        'PTAF': female.ptaf || 0,
        'PTAF%': female.ptaf_pct || 0,
        'PTAP': female.ptap || 0,
        'PTAP%': female.ptap_pct || 0,
        'PL': female.pl || 0,
        'DPR': female.dpr || 0,
        'LIV': female.liv || 0,
        'SCS': female.scs || 0,
        'MAST': female.mast || 0,
        'MET': female.met || 0,
        'RP': female.rp || 0,
        'DA': female.da || 0,
        'KET': female.ket || 0,
        'MF': female.mf || 0,
        'PTAT': female.ptat || 0,
        'UDC': female.udc || 0,
        'FLC': female.flc || 0,
        'SCE': female.sce || 0,
        'DCE': female.dce || 0,
        'SSB': female.ssb || 0,
        'DSB': female.dsb || 0,
        'H LIV': female.h_liv || 0,
        'CCR': female.ccr || 0,
        'HCR': female.hcr || 0,
        'FI': female.fi || 0,
        'GL': female.gl || 0,
        'EFC': female.efc || 0,
        'BWC': female.bwc || 0,
        'STA': female.sta || 0,
        'STR': female.str || 0,
        'DFM': female.dfm || 0,
        'RUA': female.rua || 0,
        'RLS': female.rls || 0,
        'RTP': female.rtp || 0,
        'FTL': female.ftl || 0,
        'RW': female.rw || 0,
        'RLR': female.rlr || 0,
        'FTA': female.fta || 0,
        'FLS': female.fls || 0,
        'FUA': female.fua || 0,
        'RUH': female.ruh || 0,
        'RUW': female.ruw || 0,
        'UCL': female.ucl || 0,
        'UDP': female.udp || 0,
        'FTP': female.ftp || 0,
        'RFI': female.rfi || 0
      }));

      setFemales(convertedFemales);
      
      toast({
        title: 'Fêmeas carregadas',
        description: `${convertedFemales.length} fêmeas carregadas do banco de dados`
      });
    } catch (error) {
      console.error('Erro ao carregar fêmeas:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Erro ao carregar fêmeas do banco de dados',
        variant: 'destructive'
      });
    } finally {
      setLoadingDatabase(false);
    }
  };

  // Atualizar seleção de touros
  const updateSelectedBulls = (count: number) => {
    setSelectedBulls(count);
    const newSelection = Array(count).fill('').map((_, i) => selectedBullIds[i] || '');
    setSelectedBullIds(newSelection);
  };

  // Filtrar resultados por fêmea para exibição
  const groupedPredictions = useMemo(() => {
    const groups: Record<string, PredictionResult[]> = {};
    
    predictions.forEach(pred => {
      const key = pred.female['ID Fazenda'] || pred.female['Nome'];
      if (!groups[key]) groups[key] = [];
      groups[key].push(pred);
    });
    
    return groups;
  }, [predictions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Nexus 1: Predição Genômica
          </h2>
          <p className="text-muted-foreground">
            Baseado em dados genômicos completos - Fórmula: ((PTA Fêmea + PTA Touro) / 2) × 0,93
          </p>
        </div>
      </div>

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="setup">Configuração</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        {/* Aba de Dados */}
        <TabsContent value="data" className="space-y-4">
          {/* Seletor de Fonte de Dados */}
          <Card>
            <CardHeader>
              <CardTitle>Fonte dos Dados das Fêmeas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={dataSource === 'upload' ? 'default' : 'outline'}
                  onClick={() => setDataSource('upload')}
                  className="flex-1"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload de Arquivo
                </Button>
                <Button
                  variant={dataSource === 'database' ? 'default' : 'outline'}
                  onClick={() => setDataSource('database')}
                  className="flex-1"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Fêmeas Segmentadas
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fonte de Fêmeas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {dataSource === 'upload' ? 'Upload de Fêmeas' : 'Fêmeas do Banco'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataSource === 'upload' ? (
                  <>
                    <div>
                      <Label htmlFor="female-upload">Carregar arquivo (.xlsx, .csv)</Label>
                      <Input
                        id="female-upload"
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={handleFemaleUpload}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                    </p>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Classificações</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            { value: 'donor', label: 'Doadora' },
                            { value: 'inter', label: 'Intermediária' },
                            { value: 'recipient', label: 'Receptora' }
                          ].map(({ value, label }) => (
                            <div key={value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`class-${value}`}
                                checked={selectedClassifications.includes(value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedClassifications([...selectedClassifications, value]);
                                  } else {
                                    setSelectedClassifications(selectedClassifications.filter(c => c !== value));
                                  }
                                }}
                              />
                              <Label htmlFor={`class-${value}`} className="text-sm">
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Categorias</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[
                            { value: 'bezerra', label: 'Bezerra' },
                            { value: 'novilha', label: 'Novilha' },
                            { value: 'primipara', label: 'Primípara' },
                            { value: 'secundipara', label: 'Secundípara' },
                            { value: 'multipara', label: 'Multípara' }
                          ].map(({ value, label }) => (
                            <div key={value} className="flex items-center space-x-2">
                              <Checkbox
                                id={`cat-${value}`}
                                checked={selectedCategories.includes(value)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCategories([...selectedCategories, value]);
                                  } else {
                                    setSelectedCategories(selectedCategories.filter(c => c !== value));
                                  }
                                }}
                              />
                              <Label htmlFor={`cat-${value}`} className="text-sm">
                                {label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button 
                        onClick={loadFemalesFromDatabase} 
                        disabled={loadingDatabase}
                        className="w-full"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        {loadingDatabase ? 'Carregando...' : 'Carregar Fêmeas'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Carrega fêmeas já segmentadas do banco de dados com base nos filtros selecionados
                    </p>
                  </>
                )}
                
                {females.length > 0 && (
                  <Badge variant="secondary">
                    {females.length} fêmeas carregadas
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Upload de Touros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Banco de Touros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bull-upload">Carregar arquivo (.xlsx, .csv)</Label>
                  <Input
                    id="bull-upload"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleBullUpload}
                    className="mt-1"
                  />
                </div>
                {bulls.length > 0 && (
                  <Badge variant="secondary">
                    {bulls.length} touros carregados
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Configuração */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Acasalamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bull-count">Número de touros por fêmea</Label>
                <Select value={selectedBulls.toString()} onValueChange={(value) => updateSelectedBulls(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 touro</SelectItem>
                    <SelectItem value="2">2 touros</SelectItem>
                    <SelectItem value="3">3 touros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Selecionar Touros</Label>
                {selectedBullIds.map((bullId, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label className="min-w-[80px]">Touro {index + 1}:</Label>
                    <Select 
                      value={bullId} 
                      onValueChange={(value) => {
                        const newIds = [...selectedBullIds];
                        newIds[index] = value;
                        setSelectedBullIds(newIds);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um touro" />
                      </SelectTrigger>
                      <SelectContent>
                        {bulls.map((bull, bullIndex) => (
                          <SelectItem key={bullIndex} value={bull['ID Fazenda'] || bull['Nome']}>
                            {bull['Nome']} - {bull['ID Fazenda']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Button 
                onClick={calculatePredictions} 
                disabled={isCalculating || females.length === 0 || bulls.length === 0}
                className="w-full"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {isCalculating ? 'Calculando...' : 'Calcular Predições'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Resultados */}
        <TabsContent value="results" className="space-y-4">
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resultados das Predições</CardTitle>
                  <Button onClick={exportResults} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(groupedPredictions).map(([femaleKey, femalePredictions]) => (
                    <div key={femaleKey} className="space-y-2">
                      <h4 className="font-semibold">
                        Fêmea: {femalePredictions[0].female['Nome']} ({femaleKey})
                      </h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Touro</TableHead>
                              <TableHead>Acasalamento</TableHead>
                              {PTA_COLUMNS.slice(0, 5).map(pta => (
                                <TableHead key={pta}>{pta}</TableHead>
                              ))}
                              <TableHead>...</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {femalePredictions.map((pred, index) => (
                              <TableRow key={index}>
                                <TableCell>{pred.bull['Nome']}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">Touro {pred.bullNumber}</Badge>
                                </TableCell>
                                {PTA_COLUMNS.slice(0, 5).map(pta => (
                                  <TableCell key={pta}>
                                    {pred.predictions[pta]?.toFixed(2) || '—'}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    +{PTA_COLUMNS.length - 5} PTAs
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nexus1GenomicPrediction;