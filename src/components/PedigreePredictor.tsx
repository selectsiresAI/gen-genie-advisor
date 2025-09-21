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

// Mock function to get bull from database
// In real implementation, this would query the actual bulls database
const fetchBullFromDatabase = async (naab: string): Promise<Bull | null> => {
  console.log(`Fetching bull with NAAB: ${naab}`);
  
  // Mock data for demonstration
  // In real implementation, replace with actual database query
  const mockBulls: Record<string, Bull> = {
    '200HO12345': {
      naab: '200HO12345',
      name: 'GENOMIC STAR',
      company: 'SELECT SIRES',
      ptas: {
        ihhp_dollar: 850,
        tpi: 2650,
        nm_dollar: 1200,
        pl: 6.2,
        dpr: 1.8,
        scs: 2.85,
        ptat: 1.15,
        cfp: 68,
        // ... outros PTAs
      }
    },
    '250HO67890': {
      naab: '250HO67890', 
      name: 'GENETIC ADVANCE',
      company: 'ABS GLOBAL',
      ptas: {
        ihhp_dollar: 780,
        tpi: 2420,
        nm_dollar: 1050,
        pl: 5.8,
        dpr: 1.5,
        scs: 2.92,
        ptat: 0.98,
        cfp: 62,
        // ... outros PTAs
      }
    },
    '300HO11111': {
      naab: '300HO11111',
      name: 'FUTURE PROOF',
      company: 'GENEX',
      ptas: {
        ihhp_dollar: 720,
        tpi: 2280,
        nm_dollar: 980,
        pl: 5.4,
        dpr: 1.2,
        scs: 3.05,
        ptat: 0.85,
        cfp: 58,
        // ... outros PTAs
      }
    }
  };
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const bull = mockBulls[naab.toUpperCase().trim()];
  return bull || null;
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

  const fetchBullPTAs = async () => {
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
          description: fetchErrors.join(', '),
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
                onChange={(e) => setPedigreeInput({ sireNaab: e.target.value })}
                placeholder="Ex: 200HO12345"
                className="uppercase"
              />
              {getBullFromCache(pedigreeInput.sireNaab, bullsCache) && (
                <Badge variant="secondary" className="text-xs">
                  {getBullFromCache(pedigreeInput.sireNaab, bullsCache)?.name} - {getBullFromCache(pedigreeInput.sireNaab, bullsCache)?.company}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mgs-naab">NAAB do Avô Materno *</Label>
              <Input
                id="mgs-naab"
                value={pedigreeInput.mgsNaab}
                onChange={(e) => setPedigreeInput({ mgsNaab: e.target.value })}
                placeholder="Ex: 250HO67890"
                className="uppercase"
              />
              {getBullFromCache(pedigreeInput.mgsNaab, bullsCache) && (
                <Badge variant="secondary" className="text-xs">
                  {getBullFromCache(pedigreeInput.mgsNaab, bullsCache)?.name} - {getBullFromCache(pedigreeInput.mgsNaab, bullsCache)?.company}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mmgs-naab">NAAB do Bisavô Materno *</Label>
              <Input
                id="mmgs-naab"
                value={pedigreeInput.mmgsNaab}
                onChange={(e) => setPedigreeInput({ mmgsNaab: e.target.value })}
                placeholder="Ex: 300HO11111"
                className="uppercase"
              />
              {getBullFromCache(pedigreeInput.mmgsNaab, bullsCache) && (
                <Badge variant="secondary" className="text-xs">
                  {getBullFromCache(pedigreeInput.mmgsNaab, bullsCache)?.name} - {getBullFromCache(pedigreeInput.mmgsNaab, bullsCache)?.company}
                </Badge>
              )}
            </div>
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