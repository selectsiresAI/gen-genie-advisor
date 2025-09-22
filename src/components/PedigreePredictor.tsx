import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { usePedigreeStore, PTA_MAPPING, PTA_LABELS, formatPTAValue, predictFromPedigree, validateNaabs, getBullFromCache, Bull, BatchInput, BatchResult } from '@/hooks/usePedigreeStore';
import { Calculator, Upload, Download, Search } from 'lucide-react';
import { read, utils, writeFileXLSX } from 'xlsx';

// Estado para armazenar dados do ToolSSApp - idêntico ao ProjecaoGenetica
interface ToolSSBull {
  naab: string;
  nome: string;
  empresa?: string;
  TPI: number;
  "NM$": number;
  Milk: number;
  Fat: number;
  Protein: number;
  SCS: number;
  PTAT: number;
  DPR?: number;
  [key: string]: any;
}

interface ToolSSClient {
  id: number;
  nome: string;
  farms: Array<{
    id: string;
    nome: string;
    bulls: ToolSSBull[];
    females: any[];
  }>;
}

// Estado global para dados do ToolSS
let toolssClients: ToolSSClient[] = [];

// Função para carregar dados do ToolSSApp - idêntica ao ProjecaoGenetica
const loadToolSSData = () => {
  try {
    // Try v3 first (150 bulls), fallback to v2
    let toolssData = localStorage.getItem("toolss_clients_v3_with_150_bulls");
    if (!toolssData) {
      toolssData = localStorage.getItem("toolss_clients_v2_with_500_females");
    }
    
    if (toolssData) {
      const clients = JSON.parse(toolssData);
      console.log(`🐂 Nexus 2: Carregados ${clients.length} clientes com dados de touros`);
      toolssClients = clients;
      return clients;
    }
  } catch (e) {
    console.warn("❌ Nexus 2: Erro ao carregar dados do ToolSSApp:", e);
  }
  
  console.log('🚫 Nexus 2: Banco de touros não encontrado. Acesse "Busca Touros" primeiro.');
  return [];
};

// Function to clear localStorage and force reload
const clearAndReloadData = () => {
  console.log('🧹 Clearing localStorage...');
  const keysToRemove = Object.keys(localStorage).filter(k => k.includes('toolss'));
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('✅ Cleared keys:', keysToRemove);
  alert('localStorage limpo! Por favor, vá para a página "Busca Touros" para carregar o banco de dados atualizado.');
};

// Função de busca de touro como PROCV - busca direta nos dados carregados
const fetchBullFromDatabase = async (naab: string): Promise<Bull | null> => {
  const cleanNaab = naab.toUpperCase().trim();
  
  console.log(`🔍 Procurando touro com NAAB: "${cleanNaab}"`);
  
  // Se não há dados carregados, tenta carregar
  if (toolssClients.length === 0) {
    console.log('📦 Carregando dados do banco...');
    loadToolSSData();
  }
  
  if (toolssClients.length === 0) {
    console.log('❌ Nenhum cliente carregado');
    return null;
  }

  console.log(`🏢 Procurando em ${toolssClients.length} clientes...`);

  // Busca direta em todos os touros de todas as fazendas
  for (const client of toolssClients) {
    console.log(`🏢 Cliente: ${client.nome || client.id}, Fazendas: ${client.farms?.length || 0}`);
    for (const farm of client.farms) {
      if (farm.bulls && Array.isArray(farm.bulls)) {
        console.log(`🚜 Fazenda: ${farm.nome}, Touros: ${farm.bulls.length}`);
        
        // Log some example NABs to see the format
        if (farm.bulls.length > 0) {
          console.log(`🐂 Exemplo de NABs: ${farm.bulls.slice(0, 3).map(b => `"${b.naab}"`).join(', ')}`);
        }
        
        const bull = farm.bulls.find((b: ToolSSBull) => {
          const bullNaab = String(b.naab || '').toUpperCase().trim();
          console.log(`🔍 Comparando "${bullNaab}" === "${cleanNaab}"`);
          return bullNaab === cleanNaab;
        });
        
        if (bull) {
          console.log(`✅ Touro encontrado: ${bull.nome} (${bull.empresa})`);
          
          // Converter ToolSSBull para Bull (formato do PedigreePredictor)
          const convertedBull: Bull = {
            naab: bull.naab,
            name: bull.nome || 'Nome não informado',
            company: bull.empresa || 'Empresa não informada',
            ptas: {
              // Índices Econômicos
              ihhp_dollar: bull["HHP$"] || 0,
              tpi: bull.TPI || 0,
              nm_dollar: bull["NM$"] || 0,
              cm_dollar: bull["CM$"] || 0,
              fm_dollar: bull["FM$"] || 0,
              gm_dollar: bull["GM$"] || 0,
              f_sav: bull["F SAV"] || 0,
              
              // Produção de Leite
              milk: bull.Milk || 0,
              fat: bull.Fat || 0,
              protein: bull.Protein || 0,
              ptam: bull.PTAM || 0,
              cfp: bull.CFP || 0,
              ptaf: bull.PTAF || 0,
              ptaf_pct: bull["PTAF%"] || 0,
              ptap: bull.PTAP || 0,
              ptap_pct: bull["PTAP%"] || 0,
              pl: bull.PL || 0,
              
              // Fertilidade
              dpr: bull.DPR || 0,
              
              // Saúde e Longevidade
              liv: bull.LIV || 0,
              scs: bull.SCS || 0,
              mast: bull.MAST || 0,
              met: bull.MET || 0,
              rp: bull.RP || 0,
              da: bull.DA || 0,
              ket: bull.KET || 0,
              mf: bull.MF || 0,
              
              // Conformação
              ptat: bull.PTAT || 0,
              udc: bull.UDC || 0,
              flc: bull.FLC || 0,
              sce: bull.SCE || 0,
              dce: bull.DCE || 0,
              ssb: bull.SSB || 0,
              dsb: bull.DSB || 0,
              h_liv: bull["H LIV"] || 0,
              
              // Reprodução
              ccr: bull.CCR || 0,
              hcr: bull.HCR || 0,
              
              // Outras características
              fi: bull.FI || 0,
              gl: bull.GL || 0,
              efc: bull.EFC || 0,
              bwc: bull.BWC || 0,
              
              // Conformação Detalhada
              sta: bull.STA || 0,
              str: bull.STR || 0,
              dfm: bull.DFM || 0,
              rua: bull.RUA || 0,
              rls: bull.RLS || 0,
              rtp: bull.RTP || 0,
              ftl: bull.FTL || 0,
              rw: bull.RW || 0,
              rlr: bull.RLR || 0,
              fta: bull.FTA || 0,
              fls: bull.FLS || 0,
              fua: bull.FUA || 0,
              ruh: bull.RUH || 0,
              ruw: bull.RUW || 0,
              ucl: bull.UCL || 0,
              udp: bull.UDP || 0,
              ftp: bull.FTP || 0,
              
              // Eficiência Alimentar
              rfi: bull.RFI || 0
            }
          };
          
          return convertedBull;
        }
      }
    }
  }
  
  return null;
};

const PedigreePredictor: React.FC = () => {
  const { toast } = useToast();
  const { 
    pedigreeInput,
    bullsCache,
    predictionResult,
    isCalculating,
    setPedigreeInput,
    setBullCache,
    setPredictionResult,
    setIsCalculating,
    clearPrediction
  } = usePedigreeStore();

  // Carrega dados do ToolSSApp ao montar o componente
  useEffect(() => {
    loadToolSSData();
  }, []);

  // Handle NAAB input changes with automatic PTA loading (PROCV functionality)
  const handleNaabChange = async (naabType: 'sireNaab' | 'mgsNaab' | 'mmgsNaab', value: string) => {
    setPedigreeInput({ [naabType]: value.toUpperCase() });
    
    // If NAAB is 9+ characters, try to load bull data automatically
    if (value.length >= 9) {
      const bull = await fetchBullFromDatabase(value);
      if (bull) {
        setBullCache(value, bull);
        toast({
          title: "✅ PTAs carregadas automaticamente!",
          description: `${bull.name} (${bull.company}) - Todas as PTAs foram carregadas`,
        });
      }
    }
  };

  const [selectedTab, setSelectedTab] = useState<'individual' | 'batch'>('individual');

  const handleGeneratePrediction = () => {
    if (!pedigreeInput.sireNaab.trim()) {
      toast({
        title: "Erro",
        description: "Digite o NAAB do pai para gerar a predição.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    const errors = validateNaabs(pedigreeInput);
    
    if (errors.length > 0) {
      toast({
        title: "Erro de Validação",
        description: errors.join('\n'),
        variant: "destructive",
      });
      setIsCalculating(false);
      return;
    }

    // Get bulls from cache
    const sire = getBullFromCache(pedigreeInput.sireNaab, bullsCache);
    const mgs = getBullFromCache(pedigreeInput.mgsNaab, bullsCache);
    const mmgs = getBullFromCache(pedigreeInput.mmgsNaab, bullsCache);

    if (!sire) {
      toast({
        title: "Erro",
        description: "Dados do pai não encontrados. Verifique o NAAB.",
        variant: "destructive",
      });
      setIsCalculating(false);
      return;
    }

    const predictedPTAs = predictFromPedigree(sire, mgs, mmgs);

    setPredictionResult({
      predictedPTAs,
      sire,
      mgs,
      mmgs
    });
    
    setIsCalculating(false);
    
    toast({
      title: "Predição Gerada!",
      description: "As PTAs da filha foram calculadas baseadas no pedigrê.",
    });
  };

  const handleReset = () => {
    setPedigreeInput({ sireNaab: '', mgsNaab: '', mmgsNaab: '' });
    setPredictionResult(null);
    
    toast({
      title: "Dados Limpos",
      description: "Todos os campos foram resetados.",
    });
  };

  // Batch processing state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBatchFile(file);
      setBatchResults([]);
    }
  };

  const processBatchFile = async () => {
    if (!batchFile) return;

    setIsProcessing(true);
    
    try {
      const data = await batchFile.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet) as any[];
      
      const results: BatchResult[] = [];
      
      for (const row of jsonData) {
        const input: BatchInput = {
          idFazenda: row.idFazenda || '',
          nome: row.nome || '',
          dataNascimento: row.dataNascimento || '',
          naabPai: row.naabPai || '',
          naabAvoMaterno: row.naabAvoMaterno || '',
          naabBisavoMaterno: row.naabBisavoMaterno || ''
        };

        const pedigreeData = {
          sireNaab: input.naabPai,
          mgsNaab: input.naabAvoMaterno,
          mmgsNaab: input.naabBisavoMaterno
        };

        const errors = validateNaabs(pedigreeData);
        
        if (errors.length === 0) {
          const sire = getBullFromCache(input.naabPai, bullsCache);
          const mgs = getBullFromCache(input.naabAvoMaterno, bullsCache);
          const mmgs = getBullFromCache(input.naabBisavoMaterno, bullsCache);
          
          if (sire) {
            const predictedPTAs = predictFromPedigree(sire, mgs, mmgs);
            
            results.push({
              ...input,
              status: 'success',
              predictedPTAs
            });
          } else {
            results.push({
              ...input,
              status: 'error',
              errors: ['Dados do pai não encontrados']
            });
          }
        } else {
          results.push({
            ...input,
            status: 'error',
            errors
          });
        }
      }
      
      setBatchResults(results);
      
      toast({
        title: "Processamento Concluído!",
        description: `${results.length} linhas processadas.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro no Processamento",
        description: "Erro ao processar o arquivo. Verifique o formato.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportBatchResults = () => {
    if (batchResults.length === 0) return;

    const exportData = batchResults.map(result => ({
      // Input data
      IdFazenda: result.idFazenda,
      Nome: result.nome,
      DataNascimento: result.dataNascimento,
      NaabPai: result.naabPai,
      NaabAvoMaterno: result.naabAvoMaterno,
      NaabBisavoMaterno: result.naabBisavoMaterno,
      
      // Validation
      Status: result.status === 'success' ? 'Sucesso' : 'Erro',
      Errors: result.errors?.join('; ') || '',
      
      // Predictions (top PTAs)
      ...Object.entries(result.predictedPTAs || {}).reduce((acc, [key, value]) => {
        const ptaLabel = Object.keys(PTA_MAPPING).find(k => PTA_MAPPING[k] === key);
        if (ptaLabel && value !== null) {
          acc[ptaLabel] = typeof value === 'number' ? parseFloat(value.toFixed(2)) : value;
        }
        return acc;
      }, {} as Record<string, any>)
    }));

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Predições');
    
    writeFileXLSX(workbook, `predicoes_pedigree_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Arquivo Exportado!",
      description: "As predições foram exportadas para Excel.",
    });
  };

  // Calculate the displayed PTAs based on current prediction result
  const displayedPTAs = useMemo(() => {
    if (!predictionResult) return [];
    
    const result: Array<{ 
      label: string; 
      key: string;
      sire: number | null; 
      mgs: number | null; 
      mmgs: number | null; 
      daughter: number | null 
    }> = [];
    
    // Create rows for each PTA
    Object.entries(PTA_MAPPING).forEach(([label, key]) => {
      result.push({
        label,
        key,
        sire: predictionResult.sire?.ptas?.[key] ?? null,
        mgs: predictionResult.mgs?.ptas?.[key] ?? null,
        mmgs: predictionResult.mmgs?.ptas?.[key] ?? null,
        daughter: predictionResult.predictedPTAs?.[key] ?? null
      });
    });
    
    return result.slice(0, 20); // Show first 20 PTAs
  }, [predictionResult]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="w-8 h-8" />
            Nexus 2: Predição por Pedigrê
          </h1>
          <p className="text-muted-foreground mt-2">
            Baseado no pedigrê - Pai (57%) + Avô Materno (28%) + Bisavô Materno (15%)
          </p>
        </div>
        <Button 
          onClick={clearAndReloadData}
          variant="outline"
          className="text-sm"
        >
          Limpar localStorage
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'individual' | 'batch')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Predição Individual</TabsTrigger>
          <TabsTrigger value="batch">Processamento em Lote</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pedigrê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sire">NAAB do Pai (57%)</Label>
                  <Input
                    id="sire"
                    value={pedigreeInput.sireNaab}
                    onChange={(e) => handleNaabChange('sireNaab', e.target.value)}
                    placeholder="Ex: 007HO17508"
                    className="font-mono"
                  />
                  <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mgs">NAAB do Avô Materno (28%)</Label>
                  <Input
                    id="mgs"
                    value={pedigreeInput.mgsNaab}
                    onChange={(e) => handleNaabChange('mgsNaab', e.target.value)}
                    placeholder="Ex: 007HO15225"
                    className="font-mono"
                  />
                  <Badge variant="outline" className="text-xs">Opcional</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mmgs">NAAB do Bisavô Materno (15%)</Label>
                  <Input
                    id="mmgs"
                    value={pedigreeInput.mmgsNaab}
                    onChange={(e) => handleNaabChange('mmgsNaab', e.target.value)}
                    placeholder="Ex: 007HO12345"
                    className="font-mono"
                  />
                  <Badge variant="outline" className="text-xs">Opcional</Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleGeneratePrediction} disabled={isCalculating} className="flex-1">
                  <Calculator className="w-4 h-4 mr-2" />
                  {isCalculating ? 'Calculando...' : 'Calcular PTAs da Filha'}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {displayedPTAs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Predições das PTAs da Filha</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">PTA</TableHead>
                        <TableHead className="text-center">Pai (57%)</TableHead>
                        <TableHead className="text-center">Avô Mat. (28%)</TableHead>
                        <TableHead className="text-center">Bisavô Mat. (15%)</TableHead>
                        <TableHead className="text-center font-bold bg-primary/10">Filha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedPTAs.map((pta) => (
                        <TableRow key={pta.key}>
                          <TableCell className="font-medium">{pta.label}</TableCell>
                          <TableCell className="text-center">
                            {formatPTAValue(pta.key, pta.sire)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatPTAValue(pta.key, pta.mgs)}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatPTAValue(pta.key, pta.mmgs)}
                          </TableCell>
                          <TableCell className="text-center font-bold bg-primary/5">
                            {formatPTAValue(pta.key, pta.daughter)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processamento em Lote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-file">Arquivo Excel (.xlsx)</Label>
                <Input
                  id="batch-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
                <p className="text-sm text-muted-foreground">
                  O arquivo deve conter as colunas: idFazenda, nome, dataNascimento, naabPai, naabAvoMaterno, naabBisavoMaterno
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={processBatchFile} 
                  disabled={!batchFile || isProcessing}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processando...' : 'Processar Arquivo'}
                </Button>
                
                {batchResults.length > 0 && (
                  <Button onClick={exportBatchResults} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Resultados
                  </Button>
                )}
              </div>
              
              {batchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Resultados ({batchResults.length} animais)</h3>
                  <div className="max-h-96 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>TPI</TableHead>
                          <TableHead>NM$</TableHead>
                          <TableHead>PL</TableHead>
                          <TableHead>SCS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchResults.slice(0, 10).map((result, index) => (
                          <TableRow key={index}>
                            <TableCell>{result.nome}</TableCell>
                            <TableCell>
                              {result.status === 'success' ? (
                                <Badge variant="default">Válido</Badge>
                              ) : (
                                <Badge variant="destructive">Erro</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatPTAValue('tpi', result.predictedPTAs?.tpi || null)}</TableCell>
                            <TableCell>{formatPTAValue('nm_dollar', result.predictedPTAs?.nm_dollar || null)}</TableCell>
                            <TableCell>{formatPTAValue('pl', result.predictedPTAs?.pl || null)}</TableCell>
                            <TableCell>{formatPTAValue('scs', result.predictedPTAs?.scs || null)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PedigreePredictor;