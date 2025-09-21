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

// Same STORAGE_KEY used in ToolSSApp (Busca Touros page)
const STORAGE_KEY = "toolss_clients_v3_with_150_bulls";

// Load clients function - same as ToolSSApp
const loadClients = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    console.log('❌ No data found in localStorage. Please go to "Busca Touros" page first.');
    return null;
  }
  try {
    const loaded = JSON.parse(raw);
    // Check if data is valid (same validation as ToolSSApp)
    const client1160 = loaded.find((c: any) => c.id === 1160);
    if (!client1160 || !client1160.farms[0] || 
        client1160.farms[0].females.length < 500 || 
        client1160.farms[0].bulls.length < 150) {
      console.log("🔄 Data incomplete. Please go to 'Busca Touros' to reload data...");
      return null;
    }
    return loaded;
  } catch {
    console.log('❌ Error parsing data. Please clear localStorage and go to "Busca Touros".');
    return null;
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

// Function to get bull from ToolSSApp database - uses same logic as Busca Touros
const fetchBullFromDatabase = async (naab: string): Promise<Bull | null> => {
  const cleanNaab = naab.toUpperCase().trim();
  console.log(`🔍 Nexus 2: Buscando touro com NAAB: ${cleanNaab}`);
  
  try {
    // Use same loadClients function as ToolSSApp
    const clients = loadClients();
    if (!clients) {
      return null;
    }

    console.log(`📊 Clientes encontrados: ${clients.length}`);
    
    // Count total bulls across all farms
    let totalBulls = 0;
    let foundBull = null;
    
    // Search through all farms and all bulls
    for (const client of clients) {
      if (client.farms && Array.isArray(client.farms)) {
        for (const farm of client.farms) {
          if (farm.bulls && Array.isArray(farm.bulls)) {
            totalBulls += farm.bulls.length;
            
            // Search for the specific bull by NAAB
            const bull = farm.bulls.find((b: any) => {
              const bullNaab = String(b.naab || '').toUpperCase().trim();
              return bullNaab === cleanNaab;
            });
            
            if (bull) {
              foundBull = bull;
              console.log(`✅ Touro encontrado: ${bull.nome} (${bull.empresa}) - NAAB: ${bull.naab}`);
              break;
            }
          }
        }
        if (foundBull) break;
      }
    }
    
    console.log(`🔍 Total de touros no banco: ${totalBulls}`);
    
    if (!foundBull) {
      console.log(`❌ Touro com NAAB ${cleanNaab} não encontrado no banco de ${totalBulls} touros`);
      
      // Log some sample NAABs for debugging
      if (totalBulls > 0) {
        const sampleNaabs = [];
        for (const client of clients) {
          if (client.farms) {
            for (const farm of client.farms) {
              if (farm.bulls && Array.isArray(farm.bulls) && farm.bulls.length > 0) {
                sampleNaabs.push(...farm.bulls.slice(0, 3).map((b: any) => b.naab));
                break;
              }
            }
          }
          if (sampleNaabs.length > 0) break;
        }
        console.log('📋 Exemplos de NAABs no banco:', sampleNaabs);
      }
      
      return null;
    }
    
    // Convert ToolSSApp bull format to PedigreePredictor Bull format
    const convertedBull: Bull = {
      naab: foundBull.naab,
      name: foundBull.nome || 'Nome não informado',
      company: foundBull.empresa || 'Empresa não informada',
      ptas: {
        // Economic Indices
        ihhp_dollar: foundBull["HHP$"] || foundBull["HHP$®"] || 0,
        tpi: foundBull.TPI || 0,
        nm_dollar: foundBull["NM$"] || 0,
        cm_dollar: foundBull["CM$"] || 0,
        fm_dollar: foundBull["FM$"] || 0,
        gm_dollar: foundBull["GM$"] || 0,
        f_sav: foundBull["F SAV"] || 0,
        ptam: foundBull.PTAM || 0,
        cfp: foundBull.CFP || 0,
        
        // Production
        ptaf: foundBull.PTAF || 0,
        ptaf_percent: foundBull["PTAF%"] || 0,
        ptap: foundBull.PTAP || 0,
        ptap_percent: foundBull["PTAP%"] || 0,
        pl: foundBull.PL || 0,
        milk: foundBull.Milk || 0,
        fat: foundBull.Fat || 0,
        protein: foundBull.Protein || 0,
        
        // Health & Fertility
        dpr: foundBull.DPR || 0,
        liv: foundBull.LIV || 0,
        scs: foundBull.SCS || 0,
        mast: foundBull.MAST || 0,
        met: foundBull.MET || 0,
        rp: foundBull.RP || 0,
        da: foundBull.DA || 0,
        ket: foundBull.KET || 0,
        mf: foundBull.MF || 0,
        
        // Conformation
        ptat: foundBull.PTAT || 0,
        udc: foundBull.UDC || 0,
        flc: foundBull.FLC || 0,
        
        // Calving Ease
        sce: foundBull.SCE || 0,
        dce: foundBull.DCE || 0,
        ssb: foundBull.SSB || 0,
        dsb: foundBull.DSB || 0,
        h_liv: foundBull["H LIV"] || 0,
        
        // Multi-trait
        ccr: foundBull.CCR || 0,
        hcr: foundBull.HCR || 0,
        fi: foundBull.FI || 0,
        gl: foundBull.GL || 0,
        efc: foundBull.EFC || 0,
        bwc: foundBull.BWC || 0,
        sta: foundBull.STA || 0,
        str: foundBull.STR || 0,
        
        // Linear traits
        dfm: foundBull.DFM || 0,
        rua: foundBull.RUA || 0,
        rls: foundBull.RLS || 0,
        rtp: foundBull.RTP || 0,
        ftl: foundBull.FTL || 0,
        rw: foundBull.RW || 0,
        rlr: foundBull.RLR || 0,
        fta: foundBull.FTA || 0,
        fls: foundBull.FLS || 0,
        fua: foundBull.FUA || 0,
        ruh: foundBull.RUH || 0,
        ruw: foundBull.RUW || 0,
        ucl: foundBull.UCL || 0,
        udp: foundBull.UDP || 0,
        ftp: foundBull.FTP || 0,
        
        // Feed Efficiency
        rfi: foundBull.RFI || 0
      }
    };
    
    console.log(`📊 PTAs carregadas para ${convertedBull.name}:`, {
      TPI: convertedBull.ptas.tpi,
      NM$: convertedBull.ptas.nm_dollar,
      DPR: convertedBull.ptas.dpr,
      SCS: convertedBull.ptas.scs
    });
    
    return convertedBull;
    
  } catch (error) {
    console.error('💥 Erro ao buscar touro no banco:', error);
    return null;
  }
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

  const fetchBullPTAs = async () => {
    // First run debug
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
                onChange={(e) => setPedigreeInput({ sireNaab: e.target.value.toUpperCase() })}
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
                onChange={(e) => setPedigreeInput({ mgsNaab: e.target.value.toUpperCase() })}
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
                onChange={(e) => setPedigreeInput({ mmgsNaab: e.target.value.toUpperCase() })}
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