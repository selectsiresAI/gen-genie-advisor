import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Calculator, ArrowLeft, Users, Target } from 'lucide-react';
import { read, utils, writeFileXLSX } from 'xlsx';

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
  const [females, setFemales] = useState<Female[]>([]);
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<number>(1); // 1, 2 ou 3 touros
  const [selectedBullIds, setSelectedBullIds] = useState<string[]>(['']);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upload de Fêmeas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Banco de Fêmeas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                {females.length > 0 && (
                  <Badge variant="secondary">
                    {females.length} fêmeas carregadas
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                </p>
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