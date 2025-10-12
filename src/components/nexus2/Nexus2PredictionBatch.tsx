import React, { useMemo, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { getBullByNaab } from '@/supabase/queries/bulls';
import { supabase } from '@/integrations/supabase/client';
import {
  BullSummary,
  PREDICTION_TRAITS,
  calculatePedigreePrediction,
  formatPredictionValue,
  mapBullRecord,
  type PredictionResult
} from '@/services/prediction.service';
import { read, utils, writeFileXLSX, SSF } from 'xlsx';

const ACCEPTED_EXTENSIONS = '.csv,.xlsx,.xls';
const REQUIRED_HEADERS = ['naab_pai', 'naab_avo_materno', 'naab_bisavo_materno'] as const;

const normalizeNaab = (value: string) => {
  // Remove espaços, hífens e converte para uppercase
  let normalized = value.trim().replace(/[\s-]/g, '').toUpperCase();
  
  // Remove zeros à esquerda antes das letras (007HO -> 7HO, 011HO -> 11HO)
  normalized = normalized.replace(/^0+([1-9]\d*[A-Z]+)/, '$1');
  normalized = normalized.replace(/^0+([A-Z]+)/, '$1');
  
  return normalized;
};

const normalizeHeaderName = (value: unknown) => {
  const stringValue = String(value ?? '').trim();

  if (!stringValue) {
    return '';
  }

  return stringValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[^\w]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
};

const parseExcelDate = (value: string | number | null | undefined): string => {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  // Se for um número (data do Excel)
  if (typeof value === 'number' || !isNaN(Number(value))) {
    try {
      const date = SSF.parse_date_code(Number(value));
      if (date) {
        const day = String(date.d).padStart(2, '0');
        const month = String(date.m).padStart(2, '0');
        const year = date.y;
        return `${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error('Erro ao converter data do Excel:', error);
    }
  }

  // Se já for uma string de data, retorna como está
  const stringValue = String(value).trim();
  
  // Se já está no formato DD/MM/YYYY, retorna como está
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(stringValue)) {
    return stringValue;
  }

  return stringValue;
};

interface BatchRow {
  lineNumber: number;
  idFazenda: string;
  nome: string;
  dataNascimento: string;
  naabPai: string;
  naabAvoMaterno: string;
  naabBisavoMaterno: string;
  bulls: {
    sire: BullSummary | null;
    mgs: BullSummary | null;
    mmgs: BullSummary | null;
  };
  fieldErrors: {
    sire?: string | null;
    mgs?: string | null;
    mmgs?: string | null;
  };
  errors: string[];
  status: 'valid' | 'invalid';
  prediction: PredictionResult | null;
}

const buildErrorExportRows = (rows: BatchRow[]) =>
  rows
    .filter((row) => row.status === 'invalid')
    .map((row) => ({
      linha: row.lineNumber.toString(),
      id_fazenda: row.idFazenda,
      nome: row.nome,
      data_de_nascimento: row.dataNascimento,
      naab_pai: row.naabPai,
      naab_avo_materno: row.naabAvoMaterno,
      naab_bisavo_materno: row.naabBisavoMaterno,
      erros: [...row.errors, row.fieldErrors.sire, row.fieldErrors.mgs, row.fieldErrors.mmgs]
        .filter(Boolean)
        .join(' | ')
    }));

const buildResultExportRows = (rows: BatchRow[]) =>
  rows
    .filter((row) => row.status === 'valid' && row.prediction)
    .map((row) => {
      // Convert date from DD/MM/YYYY to YYYY-MM-DD format for import
      const convertDate = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateStr;
      };

      // Map PTA values with exact column names required for import
      const pred = row.prediction;
      
      return {
        id: '',
        farm_id: row.idFazenda,
        name: row.nome,
        identifier: '',
        cdcb_id: '',
        sire_naab: row.naabPai,
        mgs_naab: row.naabAvoMaterno,
        mmgs_naab: row.naabBisavoMaterno,
        birth_date: convertDate(row.dataNascimento),
        ptas: '',
        created_at: '',
        updated_at: '',
        'HHP$': formatPredictionValue(pred?.hhp_dollar ?? null),
        'TPI': formatPredictionValue(pred?.tpi ?? null),
        'NM$': formatPredictionValue(pred?.nm_dollar ?? null),
        'CM$': formatPredictionValue(pred?.cm_dollar ?? null),
        'FM$': formatPredictionValue(pred?.fm_dollar ?? null),
        'GM$': formatPredictionValue(pred?.gm_dollar ?? null),
        'F SAV': formatPredictionValue(pred?.f_sav ?? null),
        'PTAM': formatPredictionValue(pred?.ptam ?? null),
        'CFP': formatPredictionValue(pred?.cfp ?? null),
        'PTAF': formatPredictionValue(pred?.ptaf ?? null),
        'PTAF%': formatPredictionValue(pred?.ptaf_pct ?? null),
        'PTAP': formatPredictionValue(pred?.ptap ?? null),
        'PTAP%': formatPredictionValue(pred?.ptap_pct ?? null),
        'PL': formatPredictionValue(pred?.pl ?? null),
        'DPR': formatPredictionValue(pred?.dpr ?? null),
        '': formatPredictionValue(pred?.liv ?? null), // LIV column (unnamed in import format)
        'SCS': formatPredictionValue(pred?.scs ?? null),
        'Mast': formatPredictionValue(pred?.mast ?? null),
        'Met': formatPredictionValue(pred?.met ?? null),
        'RP': formatPredictionValue(pred?.rp ?? null),
        'DA': formatPredictionValue(pred?.da ?? null),
        'Ket': formatPredictionValue(pred?.ket ?? null),
        'MF': formatPredictionValue(pred?.mf ?? null),
        'PTAT': formatPredictionValue(pred?.ptat ?? null),
        'UDC': formatPredictionValue(pred?.udc ?? null),
        'FLC': formatPredictionValue(pred?.flc ?? null),
        'SCE': formatPredictionValue(pred?.sce ?? null),
        'DCE': formatPredictionValue(pred?.dce ?? null),
        'SSB': formatPredictionValue(pred?.ssb ?? null),
        'DSB': formatPredictionValue(pred?.dsb ?? null),
        'H LIV': formatPredictionValue(pred?.h_liv ?? null),
        'CCR': formatPredictionValue(pred?.ccr ?? null),
        'HCR': formatPredictionValue(pred?.hcr ?? null),
        'FI': formatPredictionValue(pred?.fi ?? null),
        'GL': '', // Not available in prediction
        'bwc': formatPredictionValue(pred?.bwc ?? null),
        'sta': formatPredictionValue(pred?.sta ?? null),
        'str': formatPredictionValue(pred?.str ?? null),
        'dfm': formatPredictionValue(pred?.dfm ?? null),
        'rua': formatPredictionValue(pred?.rua ?? null),
        'rls': formatPredictionValue(pred?.rls ?? null),
        'rtp': formatPredictionValue(pred?.rtp ?? null),
        'ftl': formatPredictionValue(pred?.ftl ?? null),
        'rw': formatPredictionValue(pred?.rw ?? null),
        'rlr': formatPredictionValue(pred?.rlr ?? null),
        'fta': formatPredictionValue(pred?.fta ?? null),
        'fls': formatPredictionValue(pred?.fls ?? null),
        'fua': formatPredictionValue(pred?.fua ?? null),
        'ruh': formatPredictionValue(pred?.ruh ?? null),
        'ruw': formatPredictionValue(pred?.ruw ?? null),
        'ucl': formatPredictionValue(pred?.ucl ?? null),
        'udp': formatPredictionValue(pred?.udp ?? null),
        'ftp': formatPredictionValue(pred?.ftp ?? null),
        'RFI': formatPredictionValue(pred?.rfi ?? null),
        'GFI': formatPredictionValue(pred?.gfi ?? null)
      };
    });

const saveSheet = (data: Record<string, string>[], sheetName: string, filename: string, format: 'xlsx' | 'csv') => {
  const worksheet = utils.json_to_sheet(data);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, sheetName);

  if (format === 'xlsx') {
    writeFileXLSX(workbook, filename);
    return;
  }

  const csv = utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Nexus2PredictionBatch: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const [rows, setRows] = useState<BatchRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const validRows = useMemo(() => rows.filter((row) => row.status === 'valid'), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => row.status === 'invalid'), [rows]);
  const hasPredictions = useMemo(
    () => validRows.some((row) => row.prediction),
    [validRows]
  );

  const parseFile = async (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const workbook =
      extension === 'csv'
        ? read(await file.text(), { type: 'string' })
        : read(await file.arrayBuffer(), { type: 'array' });

    if (!workbook.SheetNames.length) {
      throw new Error('emptyWorkbook');
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headerRows = utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      range: 0,
      blankrows: false
    });

    if (!headerRows.length) {
      throw new Error('emptyWorkbook');
    }

    const header = headerRows[0]?.map((value) => normalizeHeaderName(value)) ?? [];
    const missingHeaders = REQUIRED_HEADERS.filter((column) => !header.includes(column));

    if (missingHeaders.length) {
      throw new Error('invalidHeader');
    }

    const findHeaderIndex = (candidates: string[]) => {
      for (const candidate of candidates) {
        const normalized = normalizeHeaderName(candidate);
        const index = header.indexOf(normalized);
        if (index !== -1) {
          return index;
        }
      }
      return -1;
    };

    const indexMap = {
      idFazenda: findHeaderIndex(['id_fazenda', 'idfazenda']),
      nome: findHeaderIndex(['nome', 'name']),
      dataNascimento: findHeaderIndex(['data_de_nascimento', 'data_nascimento', 'datanascimento']),
      naabPai: findHeaderIndex(['naab_pai', 'naabpai']),
      naabAvoMaterno: findHeaderIndex(['naab_avo_materno', 'naabavomaterno']),
      naabBisavoMaterno: findHeaderIndex(['naab_bisavo_materno', 'naabbisavomaterno'])
    };

    const dataRows = headerRows.slice(1);

    const getCellValue = (row: (string | number | null | undefined)[], index: number) => {
      if (index === -1) {
        return '';
      }

      const value = row?.[index];

      if (value === undefined || value === null) {
        return '';
      }

      return String(value).trim();
    };

    const normalizedRows: BatchRow[] = dataRows.map((row, index) => {
      const idFazenda = getCellValue(row, indexMap.idFazenda);
      const nome = getCellValue(row, indexMap.nome);
      const dataNascimento = parseExcelDate(indexMap.dataNascimento !== -1 ? row?.[indexMap.dataNascimento] : '');
      const naabPai = normalizeNaab(getCellValue(row, indexMap.naabPai));
      const naabAvoMaterno = normalizeNaab(getCellValue(row, indexMap.naabAvoMaterno));
      const naabBisavoMaterno = normalizeNaab(getCellValue(row, indexMap.naabBisavoMaterno));
      const lineNumber = index + 2;
      const errors: string[] = [];
      const fieldErrors: BatchRow['fieldErrors'] = {};

      const isEmpty = !naabPai && !naabAvoMaterno && !naabBisavoMaterno;

      if (isEmpty) {
        errors.push(t('nexus2.batch.error.emptyRow'));
      }

      if (!naabPai) {
        fieldErrors.sire = t('nexus2.error.requiredSire');
      }

      if (!naabAvoMaterno) {
        fieldErrors.mgs = t('nexus2.error.requiredMgs');
      }

      if (!naabBisavoMaterno) {
        fieldErrors.mmgs = t('nexus2.error.requiredMmgs');
      }

      return {
        lineNumber,
        idFazenda,
        nome,
        dataNascimento,
        naabPai,
        naabAvoMaterno,
        naabBisavoMaterno,
        bulls: {
          sire: null,
          mgs: null,
          mmgs: null
        },
        fieldErrors,
        errors,
        status: 'invalid',
        prediction: null
      };
    });

    const bullCache = new Map<string, BullSummary | null>();

    const resolveBull = async (naab: string): Promise<BullSummary | null> => {
      if (!naab) {
        return null;
      }

      if (bullCache.has(naab)) {
        return bullCache.get(naab) ?? null;
      }

      try {
        // Primeiro tenta busca exata
        let record = await getBullByNaab(naab);
        
        // Se não encontrar, tenta variações com H/HO
        if (!record) {
          const normalized = normalizeNaab(naab);
          let variant: string | null = null;
          
          // Se tem H seguido de dígitos (como 7H18299), substitui por HO (7HO18299)
          if (/H\d/.test(normalized) && !/HO\d/.test(normalized)) {
            variant = normalized.replace(/H(\d)/g, 'HO$1');
          }
          // Se tem HO seguido de dígitos (como 7HO18299), substitui por H (7H18299)
          else if (/HO\d/.test(normalized)) {
            variant = normalized.replace(/HO(\d)/g, 'H$1');
          }
          
          if (variant) {
            record = await getBullByNaab(variant);
          }
        }
        
        // Se ainda não encontrar, tenta buscar por prefixo (código parcial como 7HO, 007HO)
        if (!record) {
          const { data } = await supabase
            .rpc('search_bulls', { q: naab, limit_count: 10 });
          
          if (data && data.length > 0) {
            // Busca o primeiro touro cujo código começa com o NAAB fornecido
            const match = data.find((bull: any) => {
              const bullCode = normalizeNaab(bull.code);
              return bullCode.startsWith(naab);
            });
            
            if (match) {
              record = { id: match.bull_id, ...match };
            }
          }
        }
        
        const bull = mapBullRecord(record);
        bullCache.set(naab, bull);
        return bull;
      } catch (error) {
        console.error('Erro ao buscar touro em lote:', error);
        return null;
      }
    };

    for (const row of normalizedRows) {
      const sire = row.fieldErrors.sire ? null : await resolveBull(row.naabPai);
      const mgs = row.fieldErrors.mgs ? null : await resolveBull(row.naabAvoMaterno);
      const mmgs = row.fieldErrors.mmgs ? null : await resolveBull(row.naabBisavoMaterno);

      row.bulls = { sire, mgs, mmgs };

      if (row.naabPai && !sire) {
        row.fieldErrors.sire = t('nexus2.error.sireNotFound');
        row.errors.push(t('nexus2.error.sireNotFound'));
      }

      if (row.naabAvoMaterno && !mgs) {
        row.fieldErrors.mgs = t('nexus2.error.mgsNotFound');
        row.errors.push(t('nexus2.error.mgsNotFound'));
      }

      if (row.naabBisavoMaterno && !mmgs) {
        row.fieldErrors.mmgs = t('nexus2.error.mmgsNotFound');
        row.errors.push(t('nexus2.error.mmgsNotFound'));
      }

      const hasFieldErrors = Boolean(row.fieldErrors.sire || row.fieldErrors.mgs || row.fieldErrors.mmgs);
      row.status = row.errors.length === 0 && !hasFieldErrors ? 'valid' : 'invalid';
    }

    return normalizedRows;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsParsing(true);

    try {
      const parsedRows = await parseFile(file);
      setRows(parsedRows);
      setFileName(file.name);
      toast({
        title: t('nexus2.batch.toast.uploadSuccess')
      });
    } catch (error) {
      console.error('Erro ao processar arquivo de lote:', error);
      setRows([]);
      setFileName(null);
      toast({
        variant: 'destructive',
        title: t('nexus2.batch.toast.uploadError')
      });
    } finally {
      setIsParsing(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleProcess = () => {
    if (!validRows.length) {
      toast({
        variant: 'destructive',
        title: t('nexus2.batch.toast.noValid')
      });
      return;
    }

    setIsProcessing(true);

    try {
      const updatedRows = rows.map((row) => {
        if (row.status !== 'valid') {
          return { ...row, prediction: null };
        }

        return {
          ...row,
          prediction: calculatePedigreePrediction(row.bulls)
        };
      });

      setRows(updatedRows);
      toast({
        title: t('nexus2.batch.toast.processSuccess')
      });
    } catch (error) {
      console.error('Erro ao calcular predição em lote:', error);
      toast({
        variant: 'destructive',
        title: t('nexus2.batch.toast.processError')
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setRows([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exportResults = (format: 'xlsx' | 'csv') => {
    const data = buildResultExportRows(rows);

    if (!data.length) {
      toast({
        variant: 'destructive',
        title: t('nexus2.batch.toast.noResultsToExport')
      });
      return;
    }

    const filename = `nexus2_resultados.${format}`;
    saveSheet(data, 'Resultados', filename, format);
    toast({
      title: t('nexus2.batch.toast.exportSuccess')
    });
  };

  const exportErrors = (format: 'xlsx' | 'csv') => {
    const data = buildErrorExportRows(rows);

    if (!data.length) {
      toast({
        variant: 'destructive',
        title: t('nexus2.batch.toast.noErrorsToExport')
      });
      return;
    }

    const filename = `nexus2_erros.${format}`;
    saveSheet(data, 'Erros', filename, format);
    toast({
      title: t('nexus2.batch.toast.exportSuccess')
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {t('nexus2.tabs.batch')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
                {t('nexus2.batch.upload.loading')}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('nexus2.batch.upload.button')}
              </span>
            )}
          </Button>
          {fileName && (
            <Badge variant="outline" className="flex items-center gap-2">
              {fileName}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleReset}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {rows.length > 0 && (
            <Button type="button" variant="outline" onClick={handleReset}>
              {t('nexus2.batch.actions.reset')}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{t('nexus2.batch.upload.helper')}</p>

        {rows.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">
                {t('nexus2.batch.preview.validCount', { count: validRows.length })}
              </Badge>
              <Badge variant={invalidRows.length ? 'destructive' : 'outline'}>
                {t('nexus2.batch.preview.invalidCount', { count: invalidRows.length })}
              </Badge>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('nexus2.batch.preview.line')}</TableHead>
                    <TableHead>{t('nexus2.batch.preview.farmId')}</TableHead>
                    <TableHead>{t('nexus2.batch.preview.name')}</TableHead>
                    <TableHead>{t('nexus2.batch.preview.birthDate')}</TableHead>
                    <TableHead>{t('nexus2.results.sire')}</TableHead>
                    <TableHead>{t('nexus2.results.mgs')}</TableHead>
                    <TableHead>{t('nexus2.results.mmgs')}</TableHead>
                    <TableHead>{t('nexus2.batch.preview.status')}</TableHead>
                    <TableHead>{t('nexus2.batch.preview.errors')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.lineNumber}>
                      <TableCell>{row.lineNumber}</TableCell>
                      <TableCell>{row.idFazenda || '—'}</TableCell>
                      <TableCell>{row.nome || '—'}</TableCell>
                      <TableCell>{row.dataNascimento || '—'}</TableCell>
                      <TableCell className={cn(row.fieldErrors.sire ? 'text-destructive' : '')}>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.naabPai || '—'}</span>
                          {row.bulls.sire && !row.fieldErrors.sire && (
                            <span className="text-xs text-muted-foreground">{row.bulls.sire.name}</span>
                          )}
                          {row.fieldErrors.sire && (
                            <span className="text-xs text-destructive">{row.fieldErrors.sire}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn(row.fieldErrors.mgs ? 'text-destructive' : '')}>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.naabAvoMaterno || '—'}</span>
                          {row.bulls.mgs && !row.fieldErrors.mgs && (
                            <span className="text-xs text-muted-foreground">{row.bulls.mgs.name}</span>
                          )}
                          {row.fieldErrors.mgs && (
                            <span className="text-xs text-destructive">{row.fieldErrors.mgs}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={cn(row.fieldErrors.mmgs ? 'text-destructive' : '')}>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.naabBisavoMaterno || '—'}</span>
                          {row.bulls.mmgs && !row.fieldErrors.mmgs && (
                            <span className="text-xs text-muted-foreground">{row.bulls.mmgs.name}</span>
                          )}
                          {row.fieldErrors.mmgs && (
                            <span className="text-xs text-destructive">{row.fieldErrors.mmgs}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'valid' ? 'outline' : 'destructive'}>
                          {row.status === 'valid'
                            ? t('nexus2.batch.status.valid')
                            : t('nexus2.batch.status.invalid')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.errors.length ? (
                          <ul className="list-disc space-y-1 pl-4 text-sm">
                            {row.errors.map((errorMessage, index) => (
                              <li key={`${row.lineNumber}-error-${index}`}>{errorMessage}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleProcess} disabled={isProcessing || !validRows.length}>
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('nexus2.batch.actions.processing')}
                  </span>
                ) : (
                  t('nexus2.batch.actions.process')
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportResults('xlsx')}
                disabled={!hasPredictions}
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('nexus2.batch.actions.exportResultsXlsx')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportResults('csv')}
                disabled={!hasPredictions}
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('nexus2.batch.actions.exportResultsCsv')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportErrors('xlsx')}
                disabled={!invalidRows.length}
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('nexus2.batch.actions.exportErrorsXlsx')}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportErrors('csv')}
                disabled={!invalidRows.length}
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('nexus2.batch.actions.exportErrorsCsv')}
                </span>
              </Button>
            </div>

            {hasPredictions && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">{t('nexus2.batch.results.title')}</h3>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('nexus2.batch.preview.line')}</TableHead>
                        <TableHead>{t('nexus2.batch.preview.farmId')}</TableHead>
                        <TableHead>{t('nexus2.batch.preview.name')}</TableHead>
                        <TableHead>{t('nexus2.batch.preview.birthDate')}</TableHead>
                        <TableHead>{t('nexus2.results.sire')}</TableHead>
                        <TableHead>{t('nexus2.results.mgs')}</TableHead>
                        <TableHead>{t('nexus2.results.mmgs')}</TableHead>
                        {PREDICTION_TRAITS.map((trait) => (
                          <TableHead key={`prediction-${trait.key}`}>{trait.label}</TableHead>
                        ))}
                        <TableHead>Fonte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows
                        .filter((row) => row.status === 'valid' && row.prediction)
                        .map((row) => (
                          <TableRow key={`prediction-row-${row.lineNumber}`}>
                            <TableCell>{row.lineNumber}</TableCell>
                            <TableCell>{row.idFazenda || '—'}</TableCell>
                            <TableCell>{row.nome || '—'}</TableCell>
                            <TableCell>{row.dataNascimento || '—'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{row.bulls.sire?.naab}</span>
                                <span className="text-xs text-muted-foreground">{row.bulls.sire?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{row.bulls.mgs?.naab}</span>
                                <span className="text-xs text-muted-foreground">{row.bulls.mgs?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{row.bulls.mmgs?.naab}</span>
                                <span className="text-xs text-muted-foreground">{row.bulls.mmgs?.name}</span>
                              </div>
                            </TableCell>
                            {PREDICTION_TRAITS.map((trait) => (
                              <TableCell key={`prediction-${row.lineNumber}-${trait.key}`}>
                                {formatPredictionValue(row.prediction?.[trait.key] ?? null)}
                              </TableCell>
                            ))}
                            <TableCell>Predição</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t('nexus2.batch.preview.empty')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Nexus2PredictionBatch;
