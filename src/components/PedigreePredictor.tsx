import React, { useState, useMemo } from 'react';
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

// Exatamente a mesma STORAGE_KEY do ToolSSApp (Busca Touros)
const STORAGE_KEY = "toolss_clients_v3_with_150_bulls";

// Tipos idênticos aos do ToolSSApp
type ToolSSBull = {
  naab: string;
  nome: string;
  empresa?: string;
  TPI: number;
  ["NM$"]: number;
  Milk: number;
  Fat: number;
  Protein: number;
  SCS: number;
  PTAT: number;
  DPR?: number;
  [key: string]: any; // Para suportar todos os outros PTAs
};

type ToolSSClient = {
  id: number;
  nome: string;
  farms: Array<{
    id: string;
    nome: string;
    bulls: ToolSSBull[];
    females: any[];
  }>;
};

// Função loadClients idêntica ao ToolSSApp
const loadClients = (): ToolSSClient[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    console.log('🚫 Nexus 2: Banco de touros não encontrado. Acesse "Busca Touros" primeiro.');
    return [];
  }
  try {
    const loaded = JSON.parse(raw) as ToolSSClient[];
    const client1160 = loaded.find(c => c.id === 1160);
    if (!client1160 || !client1160.farms[0] || 
        client1160.farms[0].bulls.length < 150) {
      console.log('🔄 Nexus 2: Dados incompletos. Vá para "Busca Touros" para recarregar.');
      return [];
    }
    return loaded;
  } catch {
    console.log('❌ Nexus 2: Erro ao ler dados. Limpe o localStorage e vá para "Busca Touros".');
    return [];
  }
};

// Function to clear localStorage and force reload
const clearAndReloadData = () => {
  console.log('🧹 Clearing localStorage...');
  // Clear all toolss related data
  const keysToRemove = Object.keys(localStorage).filter(k => k.includes('toolss'));
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('✅ Cleared keys:', keysToRemove);
  
  // Show confirmation message
  alert('localStorage limpo! Por favor, vá para a página "Busca Touros" para carregar o banco de dados atualizado.');
};

// Função de busca de touro como PROCV - busca direta no banco do ToolSSApp
const fetchBullFromDatabase = async (naab: string): Promise<Bull | null> => {
  const cleanNaab = naab.toUpperCase().trim();
  
  const clients = loadClients();
  if (clients.length === 0) {
    return null;
  }

  // Busca direta em todos os touros de todas as fazendas
  for (const client of clients) {
    for (const farm of client.farms) {
      if (farm.bulls && Array.isArray(farm.bulls)) {
        const bull = farm.bulls.find((b: ToolSSBull) => 
          String(b.naab || '').toUpperCase().trim() === cleanNaab
        );
        
        if (bull) {
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
              ptam: bull.PTAM || 0,
              cfp: bull.CFP || 0,
              
              // Produção
              ptaf: bull.PTAF || 0,
              ptaf_percent: bull["PTAF%"] || 0,
              ptap: bull.PTAP || 0,
              ptap_percent: bull["PTAP%"] || 0,
              pl: bull.PL || 0,
              milk: bull.Milk || 0,
              fat: bull.Fat || 0,
              protein: bull.Protein || 0,
              
              // Saúde e Fertilidade
              dpr: bull.DPR || 0,
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
              
              // Facilidade de Parto
              sce: bull.SCE || 0,
              dce: bull.DCE || 0,
              ssb: bull.SSB || 0,
              dsb: bull.DSB || 0,
              h_liv: bull["H LIV"] || 0,
              
              // Multi-trait
              ccr: bull.CCR || 0,
              hcr: bull.HCR || 0,
              fi: bull.FI || 0,
              gl: bull.GL || 0,
              efc: bull.EFC || 0,
              bwc: bull.BWC || 0,
              sta: bull.STA || 0,
              str: bull.STR || 0,
              
              // Características lineares
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

const IndividualPrediction: React.FC = () => {
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

  // Add debug function to check localStorage - uses same key as Busca Touros
  const debugLocalStorage = () => {
    console.log('🔧 DEBUG: Checking localStorage keys...');
    const keys = Object.keys(localStorage);
    console.log('📋 LocalStorage keys:', keys.filter(k => k.includes('toolss')));
    
    const currentData = loadClients();
    console.log(`🔍 Current database (${STORAGE_KEY}) loaded:`, !!currentData);
    
    if (currentData && currentData.length > 0) {
      const bullsCount = currentData[0]?.farms?.[0]?.bulls?.length || 0;
      console.log('🐂 Bulls count in current database:', bullsCount);
      if (bullsCount > 0) {
        const sampleBulls = currentData[0].farms[0].bulls.slice(0, 5).map((b: any) => ({ naab: b.naab, nome: b.nome }));
        console.log('📋 Sample bulls from current database:', sampleBulls);
      }
    }
  };

  // Auto-fetch bull data when NAAB is typed (like VLOOKUP)
  const handleNaabChange = async (field: 'sireNaab' | 'mgsNaab' | 'mmgsNaab', value: string) => {
    const upperValue = value.toUpperCase();
    setPedigreeInput({ [field]: upperValue });
    
    // If NAAB is complete (typically 9-11 characters), try to fetch bull data automatically
    if (upperValue.length >= 9) {
      try {
        const bull = await fetchBullFromDatabase(upperValue);
        if (bull) {
          setBullCache(upperValue, bull);
          toast({
            title: 'Touro encontrado!',
            description: `${bull.name} (${bull.company}) - PTAs carregadas automaticamente`,
          });
        }
      } catch (error) {
        console.log(`Auto-fetch failed for ${upperValue}:`, error);
      }
    }
  };

  const fetchBullPTAs = async () => {
    debugLocalStorage();
    
    const errors = validateNaabs(pedigreeInput);
    if (errors.length > 0) {
      toast({
        title: 'Erro de validação',
        description: errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      const naabs = [pedigreeInput.sireNaab, pedigreeInput.mgsNaab, pedigreeInput.mmgsNaab];
      const bulls: (Bull | null)[] = [];
      const fetchErrors: string[] = [];

      // Fetch bulls from cache or database
      for (const naab of naabs) {
        const cached = getBullFromCache(naab, bullsCache);
        if (cached) {
          bulls.push(cached);
          continue;
        }

        try {
          const bull = await fetchBullFromDatabase(naab);
          if (bull) {
            setBullCache(naab, bull);
            bulls.push(bull);
          } else {
            bulls.push(null);
            fetchErrors.push(`NAAB ${naab} não encontrado`);
          }
        } catch (error) {
          bulls.push(null);
          fetchErrors.push(`Erro ao buscar NAAB ${naab}`);
        }
      }

      if (fetchErrors.length > 0) {
        toast({
          title: 'Erro ao buscar PTAs',
          description: `${fetchErrors.join(', ')}. Vá para a página "Busca Touros" primeiro para carregar o banco de dados.`,
          variant: 'destructive'
        });
        setIsCalculating(false);
        return;
      }

      const [sire, mgs, mmgs] = bulls;
      
      toast({
        title: 'PTAs carregadas',
        description: 'Todos os touros foram encontrados com sucesso!'
      });

    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao buscar PTAs',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculatePrediction = () => {
    const sire = getBullFromCache(pedigreeInput.sireNaab, bullsCache);
    const mgs = getBullFromCache(pedigreeInput.mgsNaab, bullsCache);
    const mmgs = getBullFromCache(pedigreeInput.mmgsNaab, bullsCache);

    if (!sire || !mgs || !mmgs) {
      toast({
        title: 'Erro',
        description: 'Busque os PTAs dos touros antes de calcular a predição',
        variant: 'destructive'
      });
      return;
    }

    const predictedPTAs = predictFromPedigree(sire, mgs, mmgs);
    
    setPredictionResult({
      predictedPTAs,
      sire,
      mgs,
      mmgs
    });

    toast({
      title: 'Predição calculada',
      description: 'A predição genética foi calculada com sucesso!'
    });
  };

  const exportToCsv = () => {
    if (!predictionResult) return;

    const data = PTA_LABELS.map(label => {
      const key = PTA_MAPPING[label];
      return {
        'Label': label,
        'Key': key,
        'Sire': predictionResult.sire ? formatPTAValue(key, predictionResult.sire.ptas[key]) : '—',
        'MGS': predictionResult.mgs ? formatPTAValue(key, predictionResult.mgs.ptas[key]) : '—', 
        'MMGS': predictionResult.mmgs ? formatPTAValue(key, predictionResult.mmgs.ptas[key]) : '—',
        'Predição': formatPTAValue(key, predictionResult.predictedPTAs[key])
      };
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Predição Individual');
    writeFileXLSX(wb, 'Predicao_Individual.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Input Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Entrada de Pedigrê
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sire-naab">NAAB do Pai *</Label>
              <Input
                id="sire-naab"
                value={pedigreeInput.sireNaab}
                onChange={(e) => handleNaabChange('sireNaab', e.target.value)}
                placeholder="Ex: 001HO25295"
                className="uppercase"
              />
              {getBullFromCache(pedigreeInput.sireNaab, bullsCache) && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  ✅ {getBullFromCache(pedigreeInput.sireNaab, bullsCache)?.name} - {getBullFromCache(pedigreeInput.sireNaab, bullsCache)?.company}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mgs-naab">NAAB do Avô Materno *</Label>
              <Input
                id="mgs-naab"
                value={pedigreeInput.mgsNaab}
                onChange={(e) => handleNaabChange('mgsNaab', e.target.value)}
                placeholder="Ex: 029HO22133"
                className="uppercase"
              />
              {getBullFromCache(pedigreeInput.mgsNaab, bullsCache) && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  ✅ {getBullFromCache(pedigreeInput.mgsNaab, bullsCache)?.name} - {getBullFromCache(pedigreeInput.mgsNaab, bullsCache)?.company}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mmgs-naab">NAAB do Bisavô Materno *</Label>
              <Input
                id="mmgs-naab"
                value={pedigreeInput.mmgsNaab}
                onChange={(e) => handleNaabChange('mmgsNaab', e.target.value)}
                placeholder="Ex: 097HO17371"
                className="uppercase"
              />
              {getBullFromCache(pedigreeInput.mmgsNaab, bullsCache) && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  ✅ {getBullFromCache(pedigreeInput.mmgsNaab, bullsCache)?.name} - {getBullFromCache(pedigreeInput.mmgsNaab, bullsCache)?.company}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Button 
              onClick={() => {
                setPedigreeInput({ 
                  sireNaab: '007HO17628', 
                  mgsNaab: '007HO25583', 
                  mmgsNaab: '007HO22300' 
                });
              }}
              variant="outline"
              size="sm"
            >
              📝 Usar NAABs de Exemplo
            </Button>
            <Button 
              onClick={clearAndReloadData}
              variant="outline"
              size="sm"
              className="bg-red-100 hover:bg-red-200 text-red-700"
            >
              🧹 Limpar localStorage
            </Button>
            <span className="text-sm text-blue-700">
              Clique para preencher com NAABs de teste do banco de touros ou limpar dados
            </span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={fetchBullPTAs} 
              disabled={isCalculating}
              variant="outline"
            >
              {isCalculating ? 'Buscando...' : 'Buscar PTAs'}
            </Button>
            
            <Button 
              onClick={calculatePrediction}
              disabled={isCalculating || !getBullFromCache(pedigreeInput.sireNaab, bullsCache)}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calcular Predição
            </Button>
            
            <Button 
              onClick={clearPrediction}
              variant="outline"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {predictionResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultado da Predição</CardTitle>
              <Button onClick={exportToCsv} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PTA</TableHead>
                    <TableHead>Pai (57%)</TableHead>
                    <TableHead>Avô Materno (28%)</TableHead>
                    <TableHead>Bisavô Materno (15%)</TableHead>
                    <TableHead className="font-bold">Predição da Fêmea</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PTA_LABELS.map(label => {
                    const key = PTA_MAPPING[label];
                    return (
                      <TableRow key={label}>
                        <TableCell className="font-medium">{label}</TableCell>
                        <TableCell>
                          {predictionResult.sire ? formatPTAValue(key, predictionResult.sire.ptas[key]) : '—'}
                        </TableCell>
                        <TableCell>
                          {predictionResult.mgs ? formatPTAValue(key, predictionResult.mgs.ptas[key]) : '—'}
                        </TableCell>
                        <TableCell>
                          {predictionResult.mmgs ? formatPTAValue(key, predictionResult.mmgs.ptas[key]) : '—'}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatPTAValue(key, predictionResult.predictedPTAs[key])}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const BatchPrediction: React.FC = () => {
  const { toast } = useToast();
  const {
    batchFile,
    batchData,
    batchResults,
    isBatchProcessing,
    setBatchFile,
    setBatchData,
    setBatchResults,
    setIsBatchProcessing,
    clearBatch
  } = usePedigreeStore();

  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      setBatchFile(file);
      setBatchData(data);
      setShowPreview(true);
      
      toast({
        title: 'Arquivo carregado',
        description: `${data.length} registros detectados`
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

  const parseFile = async (file: File): Promise<BatchInput[]> => {
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

          const mapped = data.map((row, index) => {
            const mapped: BatchInput = {
              idFazenda: row['ID Fazenda'] || row['id_fazenda'] || '',
              nome: row['Nome'] || row['nome'] || '',
              dataNascimento: row['Data de Nascimento'] || row['data_nascimento'] || '',
              naabPai: row['NAAB_Pai'] || row['naab_pai'] || '',
              naabAvoMaterno: row['NAAB_Avo_Materno'] || row['naab_avo_materno'] || '',
              naabBisavoMaterno: row['NAAB_Bisavo_Materno'] || row['naab_bisavo_materno'] || ''
            };

            return mapped;
          });

          resolve(mapped);
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
  };

  const processBatch = async () => {
    if (batchData.length === 0) return;

    setIsBatchProcessing(true);
    
    try {
      const results: BatchResult[] = [];
      
      for (const input of batchData) {
        const errors: string[] = [];
        
        // Validate NAABs
        if (!input.naabPai.trim()) errors.push('NAAB Pai ausente');
        if (!input.naabAvoMaterno.trim()) errors.push('NAAB Avô Materno ausente');
        if (!input.naabBisavoMaterno.trim()) errors.push('NAAB Bisavô Materno ausente');
        
        if (errors.length > 0) {
          results.push({
            ...input,
            status: 'error',
            errors
          });
          continue;
        }

        try {
          // Fetch bulls (in real implementation, batch this for efficiency)
          const [sire, mgs, mmgs] = await Promise.all([
            fetchBullFromDatabase(input.naabPai),
            fetchBullFromDatabase(input.naabAvoMaterno),
            fetchBullFromDatabase(input.naabBisavoMaterno)
          ]);

          if (!sire || !mgs || !mmgs) {
            const missingBulls: string[] = [];
            if (!sire) missingBulls.push('Pai');
            if (!mgs) missingBulls.push('Avô Materno');
            if (!mmgs) missingBulls.push('Bisavô Materno');
            
            results.push({
              ...input,
              status: 'error',
              errors: [`NAAB não encontrado: ${missingBulls.join(', ')}`]
            });
            continue;
          }

          const predictedPTAs = predictFromPedigree(sire, mgs, mmgs);
          
          results.push({
            ...input,
            status: 'success',
            predictedPTAs
          });
          
        } catch (error) {
          results.push({
            ...input,
            status: 'error',
            errors: ['Erro ao processar predição']
          });
        }
      }
      
      setBatchResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast({
        title: 'Processamento concluído',
        description: `${successCount} sucessos, ${errorCount} erros`
      });
      
    } catch (error) {
      toast({
        title: 'Erro no processamento',
        description: 'Erro inesperado durante o processamento',
        variant: 'destructive'
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const exportBatchResults = () => {
    if (batchResults.length === 0) return;

    const data = batchResults.map(result => {
      const row: any = {
        'ID Fazenda': result.idFazenda,
        'Nome': result.nome,
        'Data de Nascimento': result.dataNascimento,
        'NAAB Pai': result.naabPai,
        'NAAB Avô Materno': result.naabAvoMaterno,
        'NAAB Bisavô Materno': result.naabBisavoMaterno,
        'Status': result.status === 'success' ? 'Sucesso' : 'Erro',
        'Erros': result.errors?.join('; ') || ''
      };

      // Add predicted PTAs
      if (result.predictedPTAs) {
        PTA_LABELS.forEach(label => {
          const key = PTA_MAPPING[label];
          row[label] = formatPTAValue(key, result.predictedPTAs[key]);
        });
      }

      return row;
    });

    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Predições em Lote');
    writeFileXLSX(wb, 'Predicoes_Lote.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload de Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Colunas necessárias:</strong></p>
              <p>ID Fazenda, Nome, Data de Nascimento, NAAB_Pai, NAAB_Avo_Materno, NAAB_Bisavo_Materno</p>
            </div>
            
            <Input
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileUpload}
              className="w-full"
            />
            
            {batchData.length > 0 && (
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{batchData.length} registros</Badge>
                <Button 
                  onClick={processBatch}
                  disabled={isBatchProcessing}
                >
                  {isBatchProcessing ? 'Processando...' : 'Processar'}
                </Button>
                <Button onClick={clearBatch} variant="outline">Limpar</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {showPreview && batchData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia (primeiros 5 registros)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Fazenda</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data Nascimento</TableHead>
                    <TableHead>NAAB Pai</TableHead>
                    <TableHead>NAAB Avô Materno</TableHead>
                    <TableHead>NAAB Bisavô Materno</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchData.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.idFazenda}</TableCell>
                      <TableCell>{item.nome}</TableCell>
                      <TableCell>{item.dataNascimento}</TableCell>
                      <TableCell>{item.naabPai}</TableCell>
                      <TableCell>{item.naabAvoMaterno}</TableCell>
                      <TableCell>{item.naabBisavoMaterno}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultados do Processamento</CardTitle>
              <Button onClick={exportBatchResults} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erros</TableHead>
                    <TableHead>HHP$®</TableHead>
                    <TableHead>TPI</TableHead>
                    <TableHead>NM$</TableHead>
                    <TableHead>PL</TableHead>
                    <TableHead>DPR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.nome}</TableCell>
                      <TableCell>
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          {result.status === 'success' ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-600 text-xs">
                        {result.errors?.join('; ') || ''}
                      </TableCell>
                      <TableCell>
                        {result.predictedPTAs ? formatPTAValue('ihhp_dollar', result.predictedPTAs.ihhp_dollar) : '—'}
                      </TableCell>
                      <TableCell>
                        {result.predictedPTAs ? formatPTAValue('tpi', result.predictedPTAs.tpi) : '—'}
                      </TableCell>
                      <TableCell>
                        {result.predictedPTAs ? formatPTAValue('nm_dollar', result.predictedPTAs.nm_dollar) : '—'}
                      </TableCell>
                      <TableCell>
                        {result.predictedPTAs ? formatPTAValue('pl', result.predictedPTAs.pl) : '—'}
                      </TableCell>
                      <TableCell>
                        {result.predictedPTAs ? formatPTAValue('dpr', result.predictedPTAs.dpr) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const PedigreePredictor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Nexus - Predição por Pedigrê</h2>
        <p className="text-muted-foreground">
          Pai 57% + Avô Materno 28% + Bisavô Materno 15%
        </p>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Predição Individual</TabsTrigger>
          <TabsTrigger value="batch">Predição em Lote</TabsTrigger>
        </TabsList>
        
        <TabsContent value="individual" className="mt-6">
          <IndividualPrediction />
        </TabsContent>
        
        <TabsContent value="batch" className="mt-6">
          <BatchPrediction />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PedigreePredictor;