import React, { useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload, X, Trophy, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { getBullsByNaabs } from '@/supabase/queries/bulls';
import type { BullsDenormSelection } from '@/supabase/queries/bulls';
import { supabase } from '@/integrations/supabase/client';
import { fetchFemalesDenormByFarm, type CompleteFemaleDenormRow } from '@/supabase/queries/females';
import {
  PREDICTION_TRAITS,
  formatPredictionValue,
  type PredictionTraitKey
} from '@/services/prediction.service';
import { read, utils, writeFileXLSX } from 'xlsx';
import { useHerdStore } from '@/hooks/useHerdStore';

const ACCEPTED_EXTENSIONS = '.csv,.xlsx,.xls,.xlsm';

// Traits onde MENOR valor = MELHOR (saude, dificuldade de parto, etc.)
const LOWER_IS_BETTER = new Set<string>([
  'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
  'sce', 'dce', 'ssb', 'dsb', 'bwc', 'rfi', 'gl'
]);

// Header aliases para detectar colunas do SMS automaticamente
const ID_ALIASES = ['cow_id', 'id', 'd_fazenda', 'animal_id', 'brinco', 'ear_tag', 'identificacao', 'ident'];
const MATE1_NAAB_ALIASES = ['mate1_naab', '1st_recommendation', '1a_recomendacao', '1a_opcao', 'touro_1', 'naab_1', 'mate1'];
const MATE2_NAAB_ALIASES = ['mate2_naab', '2nd_recommendation', '2a_recomendacao', '2a_opcao', 'touro_2', 'naab_2', 'mate2'];
const MATE3_NAAB_ALIASES = ['mate3_naab', '3rd_recommendation', '3a_recomendacao', '3a_opcao', 'touro_3', 'naab_3', 'mate3'];
const MATE1_NAME_ALIASES = ['mate1_name', 'nome_touro_1', 'bull1_name'];
const MATE2_NAME_ALIASES = ['mate2_name', 'nome_touro_2', 'bull2_name'];
const MATE3_NAME_ALIASES = ['mate3_name', 'nome_touro_3', 'bull3_name'];

function normalizeHeader(h: string): string {
  return String(h ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function findColumn(headers: string[], aliases: string[]): string | null {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(alias);
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function normalizeNaab(value: string): string {
  let n = value.trim().replace(/[\s-]/g, '').toUpperCase();
  n = n.replace(/^0+([1-9]\d*[A-Z]+)/, '$1');
  n = n.replace(/^0+([A-Z]+)/, '$1');
  return n;
}

interface SMSRow {
  cowId: string;
  cowName?: string;
  mates: Array<{ naab: string; name?: string }>;
}

interface MatchedFemale {
  femaleId: string;
  identifier: string;
  name: string;
  ptas: Partial<Record<PredictionTraitKey, number | null>>;
}

interface PredictionRow {
  femaleId: string;
  femaleIdentifier: string;
  femaleName: string;
  recommendation: number; // 1, 2 ou 3
  bullNaab: string;
  bullName: string;
  predictions: Record<string, number | null>;
  segmentationClass?: string;
}

interface ElectionResult {
  bestPerTrait: Record<string, number>; // trait key -> recommendation number (1,2,3)
  overallBest: number; // recommendation number
  overallScore: Record<number, number>; // recommendation -> score
}

interface Nexus2SMSComparativeProps {
  selectedFarmId?: string | null;
}

const Nexus2SMSComparative: React.FC<Nexus2SMSComparativeProps> = ({ selectedFarmId }) => {
  const { toast } = useToast();
  const { locale } = useTranslation();
  const isEn = locale === 'en-US';
  const isEs = locale === 'es';
  const currentFarmId = useHerdStore(state => state.selectedHerdId) || selectedFarmId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [smsRows, setSmsRows] = useState<SMSRow[]>([]);
  const [predictionRows, setPredictionRows] = useState<PredictionRow[]>([]);
  const [unmatchedIds, setUnmatchedIds] = useState<string[]>([]);
  const [missingBulls, setMissingBulls] = useState<string[]>([]);
  const [elections, setElections] = useState<Map<string, ElectionResult>>(new Map());
  const [segObjectives, setSegObjectives] = useState<{ indexKey: string; weights: Record<string, number> } | null>(null);

  // --- Traits exibidos na tabela comparativa (subset legivel) ---
  const DISPLAY_TRAITS = useMemo(() => PREDICTION_TRAITS.filter(t =>
    ['hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
      'ptam', 'cfp', 'ptaf', 'ptap', 'pl', 'dpr', 'scs', 'ptat', 'udc', 'flc'].includes(t.key)
  ), []);

  // --- Parse do arquivo SMS ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsParsing(true);
    setPredictionRows([]);
    setElections(new Map());

    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json<Record<string, any>>(sheet);

      if (!jsonData.length) {
        toast({ title: 'Arquivo vazio', variant: 'destructive' });
        return;
      }

      const headers = Object.keys(jsonData[0]);
      const colId = findColumn(headers, ID_ALIASES);
      const colMate1 = findColumn(headers, MATE1_NAAB_ALIASES);
      const colMate2 = findColumn(headers, MATE2_NAAB_ALIASES);
      const colMate3 = findColumn(headers, MATE3_NAAB_ALIASES);
      const colName1 = findColumn(headers, MATE1_NAME_ALIASES);
      const colName2 = findColumn(headers, MATE2_NAME_ALIASES);
      const colName3 = findColumn(headers, MATE3_NAME_ALIASES);

      if (!colId || !colMate1) {
        toast({
          title: isEs ? 'Columnas no encontradas' : isEn ? 'Columns not found' : 'Colunas nao encontradas',
          description: isEs
            ? 'El archivo debe contener al menos: ID y 1a Recomendacion'
            : isEn
              ? 'File must contain at least: ID and 1st Recommendation'
              : 'Arquivo deve conter pelo menos: ID e 1a Recomendacao (Mate1_NAAB)',
          variant: 'destructive'
        });
        return;
      }

      const rows: SMSRow[] = jsonData
        .filter(row => row[colId] != null && String(row[colId]).trim())
        .map(row => {
          const mates: Array<{ naab: string; name?: string }> = [];
          if (colMate1 && row[colMate1]) mates.push({ naab: normalizeNaab(String(row[colMate1])), name: colName1 ? String(row[colName1] ?? '') : undefined });
          if (colMate2 && row[colMate2]) mates.push({ naab: normalizeNaab(String(row[colMate2])), name: colName2 ? String(row[colName2] ?? '') : undefined });
          if (colMate3 && row[colMate3]) mates.push({ naab: normalizeNaab(String(row[colMate3])), name: colName3 ? String(row[colName3] ?? '') : undefined });
          return {
            cowId: String(row[colId]).trim(),
            cowName: row['Cow_Name'] ? String(row['Cow_Name']) : undefined,
            mates
          };
        });

      setSmsRows(rows);
      toast({
        title: isEs ? 'Archivo cargado' : isEn ? 'File loaded' : 'Arquivo carregado',
        description: isEs
          ? `${rows.length} animales con ${rows[0]?.mates.length || 0} recomendaciones`
          : isEn
            ? `${rows.length} animals with ${rows[0]?.mates.length || 0} recommendations`
            : `${rows.length} animais com ${rows[0]?.mates.length || 0} recomendacoes`
      });
    } catch (error) {
      console.error('Erro ao parsear arquivo SMS:', error);
      toast({ title: 'Erro ao ler arquivo', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  // --- Processar: match femeas + lookup touros + calcular predicoes ---
  const handleProcess = async () => {
    if (!currentFarmId) {
      toast({
        title: isEs ? 'Seleccione un hato' : isEn ? 'Select a herd' : 'Selecione um rebanho',
        description: isEs ? 'Seleccione un hato en el dashboard primero' : isEn ? 'Select a herd on the dashboard first' : 'Selecione um rebanho no dashboard primeiro',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Buscar femeas do rebanho
      const farmFemales = await fetchFemalesDenormByFarm(currentFarmId, {
        select: 'id,name,identifier,farm_id,client_id,' + PREDICTION_TRAITS.map(t => t.key).join(','),
      });

      // Mapear por identifier (farm_id do animal)
      const femalesByIdentifier = new Map<string, CompleteFemaleDenormRow>();
      for (const f of farmFemales) {
        if (f.identifier) femalesByIdentifier.set(String(f.identifier).trim(), f);
        if (f.name) femalesByIdentifier.set(String(f.name).trim(), f);
      }

      // 2. Match SMS rows com femeas
      const matched: Array<{ sms: SMSRow; female: CompleteFemaleDenormRow }> = [];
      const unmatched: string[] = [];

      for (const sms of smsRows) {
        const female = femalesByIdentifier.get(sms.cowId)
          || femalesByIdentifier.get(sms.cowId.padStart(4, '0'))
          || femalesByIdentifier.get(sms.cowName ?? '');
        if (female) {
          matched.push({ sms, female });
        } else {
          unmatched.push(sms.cowId);
        }
      }
      setUnmatchedIds(unmatched);

      // 3. Coletar todos os NAABs unicos e buscar touros em batch
      const allNaabs = new Set<string>();
      for (const { sms } of matched) {
        for (const mate of sms.mates) {
          allNaabs.add(mate.naab);
        }
      }
      const bullsMap = await getBullsByNaabs(Array.from(allNaabs));

      const missing: string[] = [];
      for (const naab of allNaabs) {
        if (!bullsMap.has(naab)) missing.push(naab);
      }
      setMissingBulls(missing);

      // 4. Calcular predicoes
      const predictions: PredictionRow[] = [];

      for (const { sms, female } of matched) {
        for (let i = 0; i < sms.mates.length; i++) {
          const mate = sms.mates[i];
          const bull = bullsMap.get(mate.naab);

          const preds: Record<string, number | null> = {};
          for (const trait of PREDICTION_TRAITS) {
            const femalePta = (female as any)[trait.key];
            const bullPta = bull ? (bull as any)[trait.key] : null;

            if (femalePta != null && bullPta != null) {
              const avg = (Number(femalePta) + Number(bullPta)) / 2;
              preds[trait.key] = trait.key === 'scs'
                ? Math.round(avg * 100) / 100
                : Math.round(avg * 0.93 * 100) / 100;
            } else {
              preds[trait.key] = null;
            }
          }

          predictions.push({
            femaleId: female.id!,
            femaleIdentifier: String(female.identifier || female.name || sms.cowId),
            femaleName: String(female.name || ''),
            recommendation: i + 1,
            bullNaab: mate.naab,
            bullName: bull?.name ? String(bull.name) : mate.name || mate.naab,
            predictions: preds
          });
        }
      }
      setPredictionRows(predictions);

      // 5. Algoritmo de eleicao
      const electionMap = new Map<string, ElectionResult>();
      const femaleIds = [...new Set(predictions.map(p => p.femaleId))];

      for (const fid of femaleIds) {
        const rows = predictions.filter(p => p.femaleId === fid);
        const bestPerTrait: Record<string, number> = {};
        const overallScore: Record<number, number> = {};
        rows.forEach(r => { overallScore[r.recommendation] = 0; });

        for (const trait of PREDICTION_TRAITS) {
          const values = rows.map(r => ({
            rec: r.recommendation,
            val: r.predictions[trait.key]
          })).filter(v => v.val != null);

          if (values.length === 0) continue;

          const lowerBetter = LOWER_IS_BETTER.has(trait.key);
          const best = values.reduce((a, b) => {
            if (a.val == null) return b;
            if (b.val == null) return a;
            return lowerBetter
              ? (b.val! < a.val! ? b : a)
              : (b.val! > a.val! ? b : a);
          });
          bestPerTrait[trait.key] = best.rec;
          if (overallScore[best.rec] != null) overallScore[best.rec]++;
        }

        const overallBest = Object.entries(overallScore)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        electionMap.set(fid, {
          bestPerTrait,
          overallBest: Number(overallBest) || 1,
          overallScore
        });
      }
      setElections(electionMap);

      // 6. Carregar objetivos de segmentacao (se existir)
      try {
        const { data: settings } = await (supabase.from('farm_index_settings') as any)
          .select('active_index_key, custom_weights')
          .eq('farm_id', currentFarmId)
          .maybeSingle();
        if (settings) {
          setSegObjectives({
            indexKey: settings.active_index_key,
            weights: settings.custom_weights || {}
          });
        }
      } catch { /* sem segmentacao configurada */ }

      toast({
        title: isEs ? 'Procesamiento completo' : isEn ? 'Processing complete' : 'Processamento concluido',
        description: isEs
          ? `${matched.length} animales procesados, ${unmatched.length} sin correspondencia`
          : isEn
            ? `${matched.length} animals processed, ${unmatched.length} unmatched`
            : `${matched.length} animais processados, ${unmatched.length} sem correspondencia`
      });
    } catch (error) {
      console.error('Erro ao processar:', error);
      toast({
        title: isEs ? 'Error al procesar' : isEn ? 'Processing error' : 'Erro ao processar',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Agrupamento por femea ---
  const groupedByFemale = useMemo(() => {
    const groups: Record<string, PredictionRow[]> = {};
    for (const row of predictionRows) {
      if (!groups[row.femaleId]) groups[row.femaleId] = [];
      groups[row.femaleId].push(row);
    }
    return groups;
  }, [predictionRows]);

  // --- Melhor recomendacao por segmentacao ---
  const getBestBySegmentation = (femaleId: string): number | null => {
    if (!segObjectives) return null;
    const rows = groupedByFemale[femaleId];
    if (!rows) return null;

    const indexKey = segObjectives.indexKey?.toLowerCase();
    // Se o indice ativo e um trait direto (HHP$, TPI, NM$)
    const traitMap: Record<string, string> = {
      'hhp$': 'hhp_dollar', 'hhp': 'hhp_dollar',
      'tpi': 'tpi',
      'nm$': 'nm_dollar', 'nm': 'nm_dollar',
      'custom': 'custom'
    };
    const targetTrait = traitMap[indexKey] || indexKey;

    if (targetTrait === 'custom' && Object.keys(segObjectives.weights).length > 0) {
      // Pontuacao ponderada customizada
      let bestRec = 1;
      let bestScore = -Infinity;
      for (const row of rows) {
        let score = 0;
        for (const [trait, weight] of Object.entries(segObjectives.weights)) {
          const val = row.predictions[trait];
          if (val != null) {
            const direction = LOWER_IS_BETTER.has(trait) ? -1 : 1;
            score += val * weight * direction;
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestRec = row.recommendation;
        }
      }
      return bestRec;
    }

    // Indice direto: quem tem maior predicao nesse trait
    if (targetTrait) {
      const lowerBetter = LOWER_IS_BETTER.has(targetTrait);
      let bestRec = 1;
      let bestVal = lowerBetter ? Infinity : -Infinity;
      for (const row of rows) {
        const val = row.predictions[targetTrait];
        if (val != null) {
          if (lowerBetter ? val < bestVal : val > bestVal) {
            bestVal = val;
            bestRec = row.recommendation;
          }
        }
      }
      return bestRec;
    }

    return null;
  };

  // --- Exportar resultados ---
  const exportResults = () => {
    if (!predictionRows.length) return;

    const exportData = predictionRows.map(row => {
      const base: Record<string, any> = {
        'ID Fazenda': row.femaleIdentifier,
        'Nome Femea': row.femaleName,
        'Recomendacao': row.recommendation,
        'NAAB Touro': row.bullNaab,
        'Nome Touro': row.bullName
      };
      for (const trait of PREDICTION_TRAITS) {
        base[trait.label] = row.predictions[trait.key] ?? '';
      }
      const election = elections.get(row.femaleId);
      base['Melhor Geral'] = election?.overallBest === row.recommendation ? 'SIM' : '';
      if (segObjectives) {
        base['Melhor Segmentacao'] = getBestBySegmentation(row.femaleId) === row.recommendation ? 'SIM' : '';
      }
      return base;
    });

    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Predicao Comparativa SMS');
    writeFileXLSX(wb, 'predicao_comparativa_sms.xlsx');
  };

  // --- Navegar para segmentacao ---
  const goToSegmentation = () => {
    window.dispatchEvent(new CustomEvent('toolss:navigate-module', { detail: { view: 'segmentation' } }));
  };

  // --- Reset ---
  const handleReset = () => {
    setSmsRows([]);
    setPredictionRows([]);
    setElections(new Map());
    setUnmatchedIds([]);
    setMissingBulls([]);
    setFileName('');
    setSegObjectives(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasPredictions = predictionRows.length > 0;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {isEs ? 'Prediccion Comparativa SMS' : isEn ? 'SMS Comparative Prediction' : 'Predicao Comparativa SMS'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
              {isParsing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEs ? 'Cargando...' : isEn ? 'Loading...' : 'Carregando...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {isEs ? 'Subir Archivo SMS' : isEn ? 'Upload SMS File' : 'Enviar Arquivo SMS'}
                </span>
              )}
            </Button>
            {fileName && (
              <Badge variant="outline" className="flex items-center gap-2">
                {fileName}
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={handleReset}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isEs
              ? 'Archivo de acoplamiento SMS (.csv, .xlsx) con columnas: ID, Mate1_NAAB, Mate2_NAAB, Mate3_NAAB'
              : isEn
                ? 'SMS mating file (.csv, .xlsx) with columns: ID, Mate1_NAAB, Mate2_NAAB, Mate3_NAAB'
                : 'Arquivo de acasalamento SMS (.csv, .xlsx) com colunas: ID, Mate1_NAAB, Mate2_NAAB, Mate3_NAAB'}
          </p>

          {/* Preview do arquivo carregado */}
          {smsRows.length > 0 && !hasPredictions && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline">
                  {isEs ? `${smsRows.length} animales` : isEn ? `${smsRows.length} animals` : `${smsRows.length} animais`}
                </Badge>
                <Badge variant="outline">
                  {isEs ? `${smsRows[0]?.mates.length || 0} recomendaciones/animal` : isEn ? `${smsRows[0]?.mates.length || 0} recommendations/animal` : `${smsRows[0]?.mates.length || 0} recomendacoes/animal`}
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-md border max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{isEs ? '1a Recomendacion' : isEn ? '1st Recommendation' : '1a Recomendacao'}</TableHead>
                      <TableHead>{isEs ? '2a Recomendacion' : isEn ? '2nd Recommendation' : '2a Recomendacao'}</TableHead>
                      <TableHead>{isEs ? '3a Recomendacion' : isEn ? '3rd Recommendation' : '3a Recomendacao'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsRows.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row.cowId}</TableCell>
                        {[0, 1, 2].map(i => (
                          <TableCell key={i}>
                            {row.mates[i] ? (
                              <div className="flex flex-col">
                                <span className="font-medium">{row.mates[i].naab}</span>
                                {row.mates[i].name && <span className="text-xs text-muted-foreground">{row.mates[i].name}</span>}
                              </div>
                            ) : '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {smsRows.length > 10 && (
                <p className="text-xs text-muted-foreground">
                  {isEs ? `...y ${smsRows.length - 10} mas` : isEn ? `...and ${smsRows.length - 10} more` : `...e mais ${smsRows.length - 10}`}
                </p>
              )}

              {/* Botao processar */}
              <Button
                type="button"
                onClick={handleProcess}
                disabled={isProcessing || !currentFarmId}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEs ? 'Procesando...' : isEn ? 'Processing...' : 'Processando...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {isEs ? 'Procesar Predicciones' : isEn ? 'Process Predictions' : 'Processar Predicoes'}
                  </span>
                )}
              </Button>
              {!currentFarmId && (
                <p className="text-sm text-destructive">
                  {isEs ? 'Seleccione un hato en el dashboard primero' : isEn ? 'Select a herd on the dashboard first' : 'Selecione um rebanho no dashboard primeiro'}
                </p>
              )}
            </div>
          )}

          {/* Alertas de matching */}
          {unmatchedIds.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {isEs ? `${unmatchedIds.length} IDs sin correspondencia en el rebano` : isEn ? `${unmatchedIds.length} IDs not found in herd` : `${unmatchedIds.length} IDs sem correspondencia no rebanho`}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                {unmatchedIds.slice(0, 10).join(', ')}{unmatchedIds.length > 10 ? '...' : ''}
              </p>
            </div>
          )}
          {missingBulls.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {isEs ? `${missingBulls.length} toros NAAB no encontrados` : isEn ? `${missingBulls.length} bull NAABs not found` : `${missingBulls.length} touros NAAB nao encontrados`}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                {missingBulls.join(', ')}
              </p>
            </div>
          )}

          {/* Tabela de resultados comparativos */}
          {hasPredictions && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">
                  {isEs ? 'Resultados Comparativos' : isEn ? 'Comparative Results' : 'Resultados Comparativos'}
                </h3>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={exportResults}>
                    <Download className="h-4 w-4 mr-2" />
                    {isEs ? 'Exportar XLSX' : isEn ? 'Export XLSX' : 'Exportar XLSX'}
                  </Button>
                  <Button type="button" variant="outline" onClick={goToSegmentation}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {isEs ? 'Ir a Segmentacion' : isEn ? 'Go to Segmentation' : 'Ir para Segmentacao'}
                  </Button>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                  {isEs ? 'Mejor PTA en la caracteristica' : isEn ? 'Best PTA for the trait' : 'Melhor PTA na caracteristica'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" />
                  {isEs ? 'Mejor general (mas victorias)' : isEn ? 'Overall best (most wins)' : 'Melhor geral (mais vitorias)'}
                </span>
                {segObjectives && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-purple-100 border border-purple-400" />
                    {isEs ? 'Mejor por objetivo genetico' : isEn ? 'Best by genetic objective' : 'Melhor pelo objetivo genetico'}
                  </span>
                )}
              </div>

              {/* Tabela agrupada por femea */}
              {Object.entries(groupedByFemale).map(([femaleId, rows]) => {
                const election = elections.get(femaleId);
                const segBest = getBestBySegmentation(femaleId);

                return (
                  <div key={femaleId} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-sm">
                        {rows[0].femaleName} ({rows[0].femaleIdentifier})
                      </h4>
                      {election && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          <Trophy className="h-3 w-3 mr-1" />
                          {isEs ? `Mejor: Rec. ${election.overallBest}` : isEn ? `Best: Rec. ${election.overallBest}` : `Melhor: Rec. ${election.overallBest}`}
                          {` (${election.overallScore[election.overallBest] || 0} traits)`}
                        </Badge>
                      )}
                      {segBest && segObjectives && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                          <Target className="h-3 w-3 mr-1" />
                          {isEs ? `Seg. ${segObjectives.indexKey}: Rec. ${segBest}` : isEn ? `Seg. ${segObjectives.indexKey}: Rec. ${segBest}` : `Seg. ${segObjectives.indexKey}: Rec. ${segBest}`}
                        </Badge>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead>{isEs ? 'Toro' : isEn ? 'Bull' : 'Touro'}</TableHead>
                            <TableHead>NAAB</TableHead>
                            {DISPLAY_TRAITS.map(trait => (
                              <TableHead key={trait.key} className="text-center text-xs whitespace-nowrap">
                                {trait.label}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map(row => {
                            const isOverallBest = election?.overallBest === row.recommendation;
                            const isSegBest = segBest === row.recommendation;
                            return (
                              <TableRow
                                key={`${femaleId}-${row.recommendation}`}
                                className={cn(
                                  isOverallBest && 'bg-blue-50/50 dark:bg-blue-950/20',
                                  isSegBest && !isOverallBest && 'bg-purple-50/50 dark:bg-purple-950/20'
                                )}
                              >
                                <TableCell>
                                  <Badge variant={isOverallBest ? 'default' : 'outline'} className="text-xs">
                                    {row.recommendation}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium text-sm whitespace-nowrap">
                                  {row.bullName}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {row.bullNaab}
                                </TableCell>
                                {DISPLAY_TRAITS.map(trait => {
                                  const isBestForTrait = election?.bestPerTrait[trait.key] === row.recommendation;
                                  return (
                                    <TableCell
                                      key={trait.key}
                                      className={cn(
                                        'text-center text-sm',
                                        isBestForTrait && 'bg-emerald-100 dark:bg-emerald-900/30 font-semibold text-emerald-800 dark:text-emerald-200'
                                      )}
                                    >
                                      {formatPredictionValue(trait.label, row.predictions[trait.key] ?? null)}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}

              {/* Resumo final */}
              {elections.size > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-3">
                      {isEs ? 'Resumen de Eleccion' : isEn ? 'Election Summary' : 'Resumo da Eleicao'}
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[1, 2, 3].map(rec => {
                        const count = Array.from(elections.values())
                          .filter(e => e.overallBest === rec).length;
                        return (
                          <div key={rec} className="p-3 rounded-lg bg-background border">
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">
                              {isEs ? `Rec. ${rec} gano` : isEn ? `Rec. ${rec} won` : `Rec. ${rec} venceu`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Nexus2SMSComparative;
