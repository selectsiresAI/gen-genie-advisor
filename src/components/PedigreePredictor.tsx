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
import { supabase } from '@/integrations/supabase/client';

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

// Estado global para dados do ToolSS (não mais necessário com Supabase)
// let toolssClients: ToolSSClient[] = [];

// Função anterior que carregava do localStorage (não mais necessária)
// const loadToolSSData = () => {
//   // Replaced by direct Supabase queries in fetchBullFromDatabase
//   console.log('🔄 loadToolSSData não é mais necessária - usando Supabase diretamente');
//   return [];
// };

// Function to clear localStorage and force reload
// Função para limpar cache antigo (não mais necessária com Supabase)
const clearAndReloadData = () => {
  console.log('🧹 Cache não é mais necessário - usando Supabase diretamente');
  alert('Agora usando dados direto do Supabase! Dados sempre atualizados.');
};

// Função de busca de touro via Supabase bulls_denorm
const fetchBullFromDatabase = async (naab: string): Promise<Bull | null> => {
  const cleanNaab = naab.toUpperCase().trim();
  
  console.log(`🔍 Procurando touro com NAAB: "${cleanNaab}" no Supabase`);
  
  try {
    const { data, error } = await supabase
      .from('bulls_denorm')
      .select('*')
      .eq('code', cleanNaab)
      .single();

    if (error) {
      console.log(`❌ Touro não encontrado: ${cleanNaab}`);
      return null;
    }

    if (data) {
      console.log(`✅ Touro encontrado: ${data.name}`);
      
      // Converter dados do Supabase para o formato Bull
      const convertedBull: Bull = {
        naab: data.code,
        name: data.name || 'Nome não informado',
        company: data.company || 'Empresa não informada',
        ptas: {
          // Índices Econômicos
          hhp_dollar: data.hhp_dollar || 0,
          tpi: data.tpi || 0,
          nm_dollar: data.nm_dollar || 0,
          cm_dollar: data.cm_dollar || 0,
          fm_dollar: data.fm_dollar || 0,
          gm_dollar: data.gm_dollar || 0,
          f_sav: data.f_sav || 0,
          
          // Produção de Leite
          milk: data.ptam || 0, // PTAM = Milk in Supabase
          fat: data.ptaf || 0,
          protein: data.ptap || 0,
          ptam: data.ptam || 0,
          cfp: data.cfp || 0,
          ptaf: data.ptaf || 0,
          ptaf_pct: data.ptaf_pct || 0,
          ptap: data.ptap || 0,
          ptap_pct: data.ptap_pct || 0,
          pl: data.pl || 0,
          
          // Fertilidade
          dpr: data.dpr || 0,
          
          // Saúde e Longevidade
          liv: data.liv || 0,
          scs: data.scs || 0,
          mast: data.mast || 0,
          met: data.met || 0,
          rp: data.rp || 0,
          da: data.da || 0,
          ket: data.ket || 0,
          mf: data.mf || 0,
          
          // Conformação
          ptat: data.ptat || 0,
          udc: data.udc || 0,
          flc: data.flc || 0,
          sce: data.sce || 0,
          dce: data.dce || 0,
          ssb: data.ssb || 0,
          dsb: data.dsb || 0,
          h_liv: data.h_liv || 0,
          
          // Reprodução
          ccr: data.ccr || 0,
          hcr: data.hcr || 0,
          
          // Outras características
          fi: data.fi || 0,
          bwc: data.bwc || 0,
          
          // Conformação Detalhada
          sta: data.sta || 0,
          str: data.str || 0,
          dfm: data.dfm || 0,
          rua: data.rua || 0,
          rls: data.rls || 0,
          rtp: data.rtp || 0,
          ftl: data.ftl || 0,
          rw: data.rw || 0,
          rlr: data.rlr || 0,
          fta: data.fta || 0,
          fls: data.fls || 0,
          fua: data.fua || 0,
          ruh: data.ruh || 0,
          ruw: data.ruw || 0,
          ucl: data.ucl || 0,
          udp: data.udp || 0,
          ftp: data.ftp || 0,
          
          // Eficiência Alimentar
          rfi: data.rfi || 0,
          gfi: data.gfi || 0
        }
      };
      
      return convertedBull;
    }
  } catch (error) {
    console.error('Erro ao buscar touro no Supabase:', error);
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

  // Remove carregamento do localStorage - usando Supabase diretamente
  useEffect(() => {
    console.log('🔄 PedigreePredictor usando dados direto do Supabase');
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
      
      // Get both header-based and position-based data
      const jsonData = utils.sheet_to_json(worksheet) as any[];
      const jsonDataWithoutHeaders = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      console.log(`🔄 Processando ${jsonData.length} linhas do arquivo em lote`);
      console.log('📋 Primeiras linhas dos dados:', jsonDataWithoutHeaders.slice(0, 3));
      
      const results: BatchResult[] = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowArray = jsonDataWithoutHeaders[i + 1]; // +1 because first row is headers
        
        // Try multiple ways to get the data
        const input: BatchInput = {
          idFazenda: row.idFazenda || row['idFazenda'] || (rowArray ? rowArray[0] : '') || '',
          nome: row.Nome || row.nome || row['Nome'] || (rowArray ? rowArray[1] : '') || '',
          dataNascimento: row.dataNascimento || row['dataNascimento'] || (rowArray ? rowArray[2] : '') || '',
          naabPai: row.naabPai || row['naabPai'] || (rowArray ? rowArray[3] : '') || '',
          naabAvoMaterno: row.naabAvoMaterno || row['naabAvoMaterno'] || (rowArray ? rowArray[4] : '') || '',
          naabBisavoMaterno: row.naabBisavoMaterno || row['naabBisavoMaterno'] || (rowArray ? rowArray[5] : '') || ''
        };
        
        // Clean up NAAB codes (remove any extra spaces and ensure they're valid)
        input.naabPai = input.naabPai?.toString().trim() || '';
        input.naabAvoMaterno = input.naabAvoMaterno?.toString().trim() || '';
        input.naabBisavoMaterno = input.naabBisavoMaterno?.toString().trim() || '';

        console.log(`📋 Processando linha: ${input.nome} - Pai: ${input.naabPai}`);

        const pedigreeData = {
          sireNaab: input.naabPai,
          mgsNaab: input.naabAvoMaterno,
          mmgsNaab: input.naabBisavoMaterno
        };

        const errors = validateNaabs(pedigreeData);
        
        if (errors.length === 0) {
          // Try to get from cache first, if not found, fetch from Supabase
          let sire = getBullFromCache(input.naabPai, bullsCache);
          let mgs = getBullFromCache(input.naabAvoMaterno, bullsCache);
          let mmgs = getBullFromCache(input.naabBisavoMaterno, bullsCache);
          
          // Fetch missing bulls from Supabase
          if (!sire && input.naabPai) {
            console.log(`🔍 Buscando pai ${input.naabPai} no Supabase...`);
            sire = await fetchBullFromDatabase(input.naabPai);
            if (sire) {
              setBullCache(input.naabPai, sire);
              console.log(`✅ Pai encontrado: ${sire.name}`);
            }
          }
          
          if (!mgs && input.naabAvoMaterno) {
            console.log(`🔍 Buscando avô materno ${input.naabAvoMaterno} no Supabase...`);
            mgs = await fetchBullFromDatabase(input.naabAvoMaterno);
            if (mgs) {
              setBullCache(input.naabAvoMaterno, mgs);
              console.log(`✅ Avô materno encontrado: ${mgs.name}`);
            }
          }
          
          if (!mmgs && input.naabBisavoMaterno) {
            console.log(`🔍 Buscando bisavô materno ${input.naabBisavoMaterno} no Supabase...`);
            mmgs = await fetchBullFromDatabase(input.naabBisavoMaterno);
            if (mmgs) {
              setBullCache(input.naabBisavoMaterno, mmgs);
              console.log(`✅ Bisavô materno encontrado: ${mmgs.name}`);
            }
          }
          
          if (sire) {
            const predictedPTAs = predictFromPedigree(sire, mgs, mmgs);
            
            console.log(`✅ Predição gerada para ${input.nome}`);
            
            results.push({
              ...input,
              status: 'success',
              predictedPTAs
            });
          } else {
            console.log(`❌ Pai não encontrado para ${input.nome}`);
            results.push({
              ...input,
              status: 'error',
              errors: [`Pai com NAAB ${input.naabPai} não encontrado no banco de dados`]
            });
          }
        } else {
          console.log(`❌ Erros de validação para ${input.nome}: ${errors.join(', ')}`);
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
                           <TableHead>HHP$®</TableHead>
                           <TableHead>TPI</TableHead>
                           <TableHead>NM$</TableHead>
                           <TableHead>CM$</TableHead>
                           <TableHead>FM$</TableHead>
                           <TableHead>GM$</TableHead>
                           <TableHead>F SAV</TableHead>
                           <TableHead>PTAM</TableHead>
                           <TableHead>CFP</TableHead>
                           <TableHead>PTAF</TableHead>
                           <TableHead>PTAF%</TableHead>
                           <TableHead>PTAP</TableHead>
                           <TableHead>PTAP%</TableHead>
                           <TableHead>PL</TableHead>
                           <TableHead>DPR</TableHead>
                           <TableHead>LIV</TableHead>
                           <TableHead>SCS</TableHead>
                           <TableHead>MAST</TableHead>
                           <TableHead>MET</TableHead>
                           <TableHead>RP</TableHead>
                           <TableHead>DA</TableHead>
                           <TableHead>KET</TableHead>
                           <TableHead>MF</TableHead>
                           <TableHead>PTAT</TableHead>
                           <TableHead>UDC</TableHead>
                           <TableHead>FLC</TableHead>
                           <TableHead>SCE</TableHead>
                           <TableHead>DCE</TableHead>
                           <TableHead>SSB</TableHead>
                           <TableHead>DSB</TableHead>
                           <TableHead>H LIV</TableHead>
                           <TableHead>CCR</TableHead>
                           <TableHead>HCR</TableHead>
                           <TableHead>FI</TableHead>
                           <TableHead>GL</TableHead>
                           <TableHead>EFC</TableHead>
                           <TableHead>BWC</TableHead>
                           <TableHead>STA</TableHead>
                           <TableHead>STR</TableHead>
                           <TableHead>DFM</TableHead>
                           <TableHead>RUA</TableHead>
                           <TableHead>RLS</TableHead>
                           <TableHead>RTP</TableHead>
                           <TableHead>FTL</TableHead>
                           <TableHead>RW</TableHead>
                           <TableHead>RLR</TableHead>
                           <TableHead>FTA</TableHead>
                           <TableHead>FLS</TableHead>
                           <TableHead>FUA</TableHead>
                           <TableHead>RUH</TableHead>
                           <TableHead>RUW</TableHead>
                           <TableHead>UCL</TableHead>
                           <TableHead>UDP</TableHead>
                           <TableHead>FTP</TableHead>
                           <TableHead>RFI</TableHead>
                           <TableHead>Beta-Casein</TableHead>
                           <TableHead>Kappa-Casein</TableHead>
                           <TableHead>GFI</TableHead>
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
                             <TableCell>{formatPTAValue('hhp_dollar', result.predictedPTAs?.hhp_dollar || null)}</TableCell>
                             <TableCell>{formatPTAValue('tpi', result.predictedPTAs?.tpi || null)}</TableCell>
                             <TableCell>{formatPTAValue('nm_dollar', result.predictedPTAs?.nm_dollar || null)}</TableCell>
                             <TableCell>{formatPTAValue('cm_dollar', result.predictedPTAs?.cm_dollar || null)}</TableCell>
                             <TableCell>{formatPTAValue('fm_dollar', result.predictedPTAs?.fm_dollar || null)}</TableCell>
                             <TableCell>{formatPTAValue('gm_dollar', result.predictedPTAs?.gm_dollar || null)}</TableCell>
                             <TableCell>{formatPTAValue('f_sav', result.predictedPTAs?.f_sav || null)}</TableCell>
                             <TableCell>{formatPTAValue('ptam', result.predictedPTAs?.ptam || null)}</TableCell>
                             <TableCell>{formatPTAValue('cfp', result.predictedPTAs?.cfp || null)}</TableCell>
                             <TableCell>{formatPTAValue('ptaf', result.predictedPTAs?.ptaf || null)}</TableCell>
                             <TableCell>{formatPTAValue('ptaf_pct', result.predictedPTAs?.ptaf_pct || null)}</TableCell>
                             <TableCell>{formatPTAValue('ptap', result.predictedPTAs?.ptap || null)}</TableCell>
                             <TableCell>{formatPTAValue('ptap_pct', result.predictedPTAs?.ptap_pct || null)}</TableCell>
                             <TableCell>{formatPTAValue('pl', result.predictedPTAs?.pl || null)}</TableCell>
                             <TableCell>{formatPTAValue('dpr', result.predictedPTAs?.dpr || null)}</TableCell>
                             <TableCell>{formatPTAValue('liv', result.predictedPTAs?.liv || null)}</TableCell>
                             <TableCell>{formatPTAValue('scs', result.predictedPTAs?.scs || null)}</TableCell>
                             <TableCell>{formatPTAValue('mast', result.predictedPTAs?.mast || null)}</TableCell>
                             <TableCell>{formatPTAValue('met', result.predictedPTAs?.met || null)}</TableCell>
                             <TableCell>{formatPTAValue('rp', result.predictedPTAs?.rp || null)}</TableCell>
                             <TableCell>{formatPTAValue('da', result.predictedPTAs?.da || null)}</TableCell>
                             <TableCell>{formatPTAValue('ket', result.predictedPTAs?.ket || null)}</TableCell>
                             <TableCell>{formatPTAValue('mf', result.predictedPTAs?.mf || null)}</TableCell>
                             <TableCell>{formatPTAValue('ptat', result.predictedPTAs?.ptat || null)}</TableCell>
                             <TableCell>{formatPTAValue('udc', result.predictedPTAs?.udc || null)}</TableCell>
                             <TableCell>{formatPTAValue('flc', result.predictedPTAs?.flc || null)}</TableCell>
                             <TableCell>{formatPTAValue('sce', result.predictedPTAs?.sce || null)}</TableCell>
                             <TableCell>{formatPTAValue('dce', result.predictedPTAs?.dce || null)}</TableCell>
                             <TableCell>{formatPTAValue('ssb', result.predictedPTAs?.ssb || null)}</TableCell>
                             <TableCell>{formatPTAValue('dsb', result.predictedPTAs?.dsb || null)}</TableCell>
                             <TableCell>{formatPTAValue('h_liv', result.predictedPTAs?.h_liv || null)}</TableCell>
                             <TableCell>{formatPTAValue('ccr', result.predictedPTAs?.ccr || null)}</TableCell>
                             <TableCell>{formatPTAValue('hcr', result.predictedPTAs?.hcr || null)}</TableCell>
                             <TableCell>{formatPTAValue('fi', result.predictedPTAs?.fi || null)}</TableCell>
                             <TableCell>{formatPTAValue('gl', result.predictedPTAs?.gl || null)}</TableCell>
                             <TableCell>{formatPTAValue('efc', result.predictedPTAs?.efc || null)}</TableCell>
                             <TableCell>{formatPTAValue('bwc', result.predictedPTAs?.bwc || null)}</TableCell>
                             <TableCell>{formatPTAValue('sta', result.predictedPTAs?.sta || null)}</TableCell>
                             <TableCell>{formatPTAValue('str', result.predictedPTAs?.str || null)}</TableCell>
                             <TableCell>{formatPTAValue('dfm', result.predictedPTAs?.dfm || null)}</TableCell>
                             <TableCell>{formatPTAValue('rua', result.predictedPTAs?.rua || null)}</TableCell>
                             <TableCell>{formatPTAValue('rls', result.predictedPTAs?.rls || null)}</TableCell>
                             <TableCell>{formatPTAValue('rtp', result.predictedPTAs?.rtp || null)}</TableCell>
                             <TableCell>{formatPTAValue('ftl', result.predictedPTAs?.ftl || null)}</TableCell>
                             <TableCell>{formatPTAValue('rw', result.predictedPTAs?.rw || null)}</TableCell>
                             <TableCell>{formatPTAValue('rlr', result.predictedPTAs?.rlr || null)}</TableCell>
                             <TableCell>{formatPTAValue('fta', result.predictedPTAs?.fta || null)}</TableCell>
                             <TableCell>{formatPTAValue('fls', result.predictedPTAs?.fls || null)}</TableCell>
                             <TableCell>{formatPTAValue('fua', result.predictedPTAs?.fua || null)}</TableCell>
                             <TableCell>{formatPTAValue('ruh', result.predictedPTAs?.ruh || null)}</TableCell>
                             <TableCell>{formatPTAValue('ruw', result.predictedPTAs?.ruw || null)}</TableCell>
                             <TableCell>{formatPTAValue('ucl', result.predictedPTAs?.ucl || null)}</TableCell>
                             <TableCell>{formatPTAValue('udp', result.predictedPTAs?.udp || null)}</TableCell>
                             <TableCell>{formatPTAValue('ftp', result.predictedPTAs?.ftp || null)}</TableCell>
                             <TableCell>{formatPTAValue('rfi', result.predictedPTAs?.rfi || null)}</TableCell>
                             <TableCell>{result.predictedPTAs?.beta_casein || '-'}</TableCell>
                             <TableCell>{result.predictedPTAs?.kappa_casein || '-'}</TableCell>
                             <TableCell>{formatPTAValue('gfi', result.predictedPTAs?.gfi || null)}</TableCell>
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