import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Papa from "@/lib/papaparse";
import { read, utils } from 'xlsx';
import { parse as parseDateFn, isValid as isValidDate } from 'date-fns';

const TARGET_TABLE = "females";
const IMPORT_ENDPOINT = "/api/females/import";
const MAX_IMPORT_ROWS = 10_000;
const API_CHUNK_SIZE = 500;

const canonicalColumns = [
  'id', 'farm_id', 'name', 'identifier', 'cdcb_id', 'sire_naab', 'mgs_naab', 'mmgs_naab', 'birth_date',
  'ptas', 'created_at', 'updated_at', 'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
  'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 'pl', 'dpr', 'liv', 'scs', 'mast', 'met',
  'rp', 'da', 'ket', 'mf', 'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr', 'fi',
  'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua',
  'ruh', 'ruw', 'ucl', 'udp', 'ftp', 'rfi', 'gfi', 'beta_casein', 'kappa_casein', 'parity_order', 'category'
] as const;

const canonicalColumnsSet = new Set<string>(canonicalColumns);

const headerAliases: Record<string, string> = {
  id: 'id',
  farm: 'farm_id',
  farm_id: 'farm_id',
  farmid: 'farm_id',
  herd: 'farm_id',
  herd_id: 'farm_id',
  nome: 'name',
  animal: 'name',
  animal_nome: 'name',
  name: 'name',
  identifier: 'identifier',
  identificador: 'identifier',
  identificacao: 'identifier',
  animal_id: 'identifier',
  animalid: 'identifier',
  id_animal: 'identifier',
  brinco: 'identifier',
  ear_tag: 'identifier',
  tag: 'identifier',
  cdcb: 'cdcb_id',
  cdcb_id: 'cdcb_id',
  sire: 'sire_naab',
  naab: 'sire_naab',
  sire_naab: 'sire_naab',
  pai_naab: 'sire_naab',
  mgs: 'mgs_naab',
  mgs_naab: 'mgs_naab',
  avo_materno_naab: 'mgs_naab',
  mmgs: 'mmgs_naab',
  mmgs_naab: 'mmgs_naab',
  bisavo_materno_naab: 'mmgs_naab',
  dob: 'birth_date',
  birth_date: 'birth_date',
  data_nascimento: 'birth_date',
  nascimento: 'birth_date',
  ptas: 'ptas',
  created_at: 'created_at',
  data_criacao: 'created_at',
  updated_at: 'updated_at',
  data_atualizacao: 'updated_at',
  hhp: 'hhp_dollar',
  hhp_dollar: 'hhp_dollar',
  'hhp_dollar_usd': 'hhp_dollar',
  tpi: 'tpi',
  nm: 'nm_dollar',
  nm_dollar: 'nm_dollar',
  cm: 'cm_dollar',
  cm_dollar: 'cm_dollar',
  fm: 'fm_dollar',
  fm_dollar: 'fm_dollar',
  gm: 'gm_dollar',
  gm_dollar: 'gm_dollar',
  parity_order: 'parity_order',
  ordem_parto: 'parity_order',
  ordem_de_parto: 'parity_order',
  categoria: 'category',
  category: 'category'
};

const numericFields = new Set<string>([
  'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar', 'f_sav', 'ptam', 'cfp', 'ptaf',
  'ptaf_pct', 'ptap', 'ptap_pct', 'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf', 'ptat',
  'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str',
  'dfm', 'rua', 'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp', 'ftp',
  'rfi', 'gfi', 'parity_order'
]);

const dateFields = new Set<string>(['birth_date']);
const timestampFields = new Set<string>(['created_at', 'updated_at']);

const nullTokens = new Set<string>([
  '', 'null', 'undefined', 'na', 'n/a', 'nan', 'none', 'sem dado', 'sem dados', 'sem valor', '-', '--', '#########'
]);

const padNumber = (value: number) => value.toString().padStart(2, '0');

const excelSerialToDate = (serial: number) => {
  const utcMilliseconds = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(utcMilliseconds);
};

const formatDateUTC = (date: Date) => {
  return `${date.getUTCFullYear()}-${padNumber(date.getUTCMonth() + 1)}-${padNumber(date.getUTCDate())}`;
};

const formatDateTimeUTC = (date: Date) => {
  return `${formatDateUTC(date)}T${padNumber(date.getUTCHours())}:${padNumber(date.getUTCMinutes())}:${padNumber(date.getUTCSeconds())}Z`;
};

const tryParseWithFormats = (value: string, formats: string[]): Date | null => {
  for (const formatStr of formats) {
    const parsed = parseDateFn(value, formatStr, new Date());
    if (isValidDate(parsed)) {
      return parsed;
    }
  }
  return null;
};

const normalizeHeader = (header: string): string => {
  let normalized = header.trim().toLowerCase();
  normalized = normalized.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  normalized = normalized.replace(/\$/g, '_dollar');
  normalized = normalized.replace(/%/g, '_pct');
  normalized = normalized.replace(/[^a-z0-9_]+/g, '_');
  normalized = normalized.replace(/_{2,}/g, '_');
  normalized = normalized.replace(/^_|_$/g, '');
  return normalized;
};

const isEmptyCell = (value: unknown) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return false;
};

const normalizeDateValue = (value: unknown, column: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return formatDateUTC(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatDateUTC(excelSerialToDate(value));
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }
  const sanitized = raw.replace(/\u00A0/g, ' ');
  const parsed =
    tryParseWithFormats(sanitized, [
      'dd/MM/yyyy','MM/dd/yyyy','dd-MM-yyyy','MM-dd-yyyy',
      'dd.MM.yyyy','MM.dd.yyyy','yyyy/MM/dd','ddMMyyyy','yyyyMMdd'
    ]) || new Date(sanitized);
  if (parsed && isValidDate(parsed)) {
    return formatDateUTC(parsed);
  }
  console.warn(`⚠️  Não foi possível normalizar a data na coluna ${column}. Valor mantido como string.`);
  return raw;
};

const normalizeTimestampValue = (value: unknown, column: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return formatDateTimeUTC(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatDateTimeUTC(excelSerialToDate(value));
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const directParse = new Date(raw);
  if (!Number.isNaN(directParse.getTime())) {
    return directParse.toISOString();
  }
  const parsed = tryParseWithFormats(raw, [
    'dd/MM/yyyy HH:mm:ss','dd/MM/yyyy HH:mm',
    'MM/dd/yyyy HH:mm:ss','MM/dd/yyyy HH:mm',
    'dd-MM-yyyy HH:mm:ss','dd-MM-yyyy HH:mm',
    'yyyy-MM-dd HH:mm:ss','yyyy-MM-dd HH:mm'
  ]);
  if (parsed && isValidDate(parsed)) {
    return parsed.toISOString();
  }
  console.warn(`⚠️  Não foi possível normalizar o timestamp na coluna ${column}. Valor mantido como string.`);
  return raw;
};

const normalizeNumericValue = (canonicalKey: string, value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s+/g, '')
    .replace(/%/g, '')
    .replace(/\./g, raw.includes(',') ? '' : '.')
    .replace(/,/g, '.');
  const numericValue = canonicalKey === 'parity_order'
    ? parseInt(cleaned, 10)
    : parseFloat(cleaned);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const parsePtasValue = (value: unknown, header: string) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  const raw = typeof value === 'string' ? value.trim() : String(value);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const entries = raw.split(/[,;]+/).map((part) => part.trim()).filter(Boolean);
    if (entries.length > 0) {
      const result: Record<string, unknown> = {};
      for (const entry of entries) {
        const [key, rawVal] = entry.split(/[:=]/).map(part => part.trim());
        if (!key || !rawVal) continue;
        const normalizedKey = normalizeHeader(key);
        const numeric = normalizeNumericValue(normalizedKey, rawVal);
        result[normalizedKey] = numeric ?? rawVal;
      }
      if (Object.keys(result).length > 0) return result;
    }
    console.warn(`⚠️  Não foi possível converter o campo PTAs na coluna ${header}. Valor armazenado como texto.`);
    return { raw };
  }
};

type FemaleCanonicalColumn = typeof canonicalColumns[number];
type FemaleOptionalColumn = Exclude<FemaleCanonicalColumn, 'id' | 'farm_id' | 'name'>;
type FemaleValue = string | number | boolean | null | Record<string, unknown>;
type FemaleRow = Partial<Record<FemaleCanonicalColumn, FemaleValue>>;

type ImportBatchResult = {
  batch: number;
  total: number;
  inserted: number;
  updated: number;
  error?: string;
};

type ImportSummary = {
  total_received: number;
  total_success: number;
  total_batches: number;
  chunk_size: number;
  inserted?: number;
  updated?: number;
  errors?: Array<{ batch: number; message: string }>;
  batch_results?: ImportBatchResult[];
};

const toCanonicalValue = (
  canonicalKey: string,
  header: string,
  value: unknown
): FemaleValue | null => {
  if (value === undefined) return null;

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (nullTokens.has(normalized.toLowerCase())) return null;
    value = normalized;
  }
  if (value === null || value === '') return null;

  if (dateFields.has(canonicalKey)) return normalizeDateValue(value, header);
  if (timestampFields.has(canonicalKey)) return normalizeTimestampValue(value, header);
  if (canonicalKey === 'ptas') return parsePtasValue(value, header);
  if (numericFields.has(canonicalKey)) return normalizeNumericValue(canonicalKey, value);

  return value as FemaleValue;
};

const isRowEmpty = (row: (string | number | null | undefined)[]) => {
  if (!row) return true;
  return row.every((cell) => {
    if (cell === null || cell === undefined) return true;
    if (typeof cell === 'string') return cell.trim() === '';
    if (Array.isArray(cell)) return cell.length === 0;
    return false;
  });
};

const buildRecordsFromRows = (rows: (string | number | null | undefined)[][]): FemaleRow[] => {
  const workingRows = [...rows];

  while (workingRows.length > 0 && isRowEmpty(workingRows[0])) {
    workingRows.shift();
  }
  if (workingRows.length < 2) throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');

  const headerRow = workingRows[0].map((cell) => {
    const raw = cell === null || cell === undefined ? '' : String(cell);
    return raw.replace(/^\uFEFF/, '');
  });

  const headerInfos = headerRow.map((header) => {
    const normalized = normalizeHeader(header);
    const canonicalKey = headerAliases[normalized] ?? (canonicalColumnsSet.has(normalized) ? normalized : undefined);
    return { header, normalized, canonicalKey };
  });

  const recognized = headerInfos.filter((info) => info.canonicalKey);
  if (recognized.length === 0) {
    throw new Error('Nenhuma coluna conhecida foi identificada. Baixe o template atualizado do rebanho e tente novamente.');
  }

  const dataRows: FemaleRow[] = [];
  const rowErrors: string[] = [];
  const seenIds = new Set<string>();
  const seenIdentifiers = new Map<string, number>();

  workingRows.slice(1).forEach((rawValues, index) => {
    if (isRowEmpty(rawValues)) return;

    const row: FemaleRow = {};
    headerInfos.forEach((info, columnIndex) => {
      if (!info.canonicalKey) return;
      const rawValue = rawValues[columnIndex];
      const value = toCanonicalValue(info.canonicalKey, info.header, rawValue);
      if (value !== undefined) row[info.canonicalKey] = value;
    });

    const displayRow = index + 2;

    if (row.id !== undefined && row.id !== null) row.id = String(row.id).trim();
    if (row.identifier !== undefined && row.identifier !== null) row.identifier = String(row.identifier).trim();
    if (row.cdcb_id !== undefined && row.cdcb_id !== null) row.cdcb_id = String(row.cdcb_id).trim();

    if (!row.name || String(row.name).trim() === '') {
      const fallback = row.identifier || row.cdcb_id || row.id;
      if (fallback) row.name = String(fallback).trim();
    } else {
      row.name = String(row.name).trim();
    }

    if (!row.identifier && row.cdcb_id) row.identifier = row.cdcb_id;
    if (!row.identifier && row.id) row.identifier = row.id;

    if (!row.name || String(row.name).trim() === '') {
      rowErrors.push(`Linha ${displayRow}: não há coluna "name" preenchida nem identificador para deduzir o nome do animal.`);
    }

    if (row.id) {
      const idValue = String(row.id).trim();
      if (idValue) {
        if (seenIds.has(idValue)) rowErrors.push(`Linha ${displayRow}: identificador de registro duplicado (id=${idValue}).`);
        else seenIds.add(idValue);
      }
    }

    if (row.identifier) {
      const identifierValue = String(row.identifier).trim();
      if (identifierValue) {
        const firstOccurrence = seenIdentifiers.get(identifierValue);
        if (firstOccurrence) rowErrors.push(`Linhas ${firstOccurrence} e ${displayRow}: identificador '${identifierValue}' duplicado no arquivo.`);
        else seenIdentifiers.set(identifierValue, displayRow);
      }
    }

    dataRows.push(row);
  });

  if (dataRows.length === 0) throw new Error('Nenhum dado válido encontrado no arquivo. Verifique se as linhas possuem informações preenchidas.');

  if (rowErrors.length > 0) {
    const preview = rowErrors.slice(0, 3).join(' | ');
    const suffix = rowErrors.length > 3 ? ` (+${rowErrors.length - 3} linha(s) adicionais com erro)` : '';
    throw new Error(`Erros de validação encontrados: ${preview}${suffix}`);
  }

  return dataRows;
};

interface FemaleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName: string;
  onImportSuccess?: () => void;
}

const FemaleUploadModal: React.FC<FemaleUploadModalProps> = ({
  isOpen,
  onClose,
  farmId,
  farmName,
  onImportSuccess
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState({ total: 0, processed: 0, totalBatches: 0, completedBatches: 0 });
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [batchResults, setBatchResults] = useState<ImportBatchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const optionalFields = canonicalColumns.filter((column) => !['id', 'farm_id', 'name'].includes(column)) as FemaleOptionalColumn[];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMessage(null);
      setImportSummary(null);
      setBatchResults([]);
      setProgress({ total: 0, processed: 0, totalBatches: 0, completedBatches: 0 });
    }
    e.target.value = '';
  };

  const parseCsvFile = async (file: File): Promise<FemaleRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        worker: true,
        complete: (result) => {
          if (result.errors && result.errors.length > 0) {
            const first = result.errors[0];
            reject(new Error(first.message || 'Erro ao processar arquivo CSV'));
            return;
          }

          const header = result.meta.fields ?? [];
          if (header.length === 0) {
            reject(new Error('Arquivo deve conter pelo menos um cabeçalho válido.'));
            return;
          }

          const rows: (string | number | null | undefined)[][] = [header];
          result.data.forEach((row) => {
            const normalizedRow = header.map((field) => {
              const value = (row as Record<string, unknown>)[field];
              return value === undefined ? null : value;
            });
            rows.push(normalizedRow);
          });

          try {
            resolve(buildRecordsFromRows(rows));
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Erro ao transformar dados do CSV'));
          }
        },
        error: (error) => {
          reject(error instanceof Error ? error : new Error('Erro ao processar arquivo CSV'));
        },
      });
    });
  };

  const parseExcelFile = async (file: File): Promise<FemaleRow[]> => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('Arquivo Excel sem abas válidas.');
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = utils.sheet_to_json<(string | number | null | undefined)[]>(worksheet, { header: 1, raw: true });

      const rows = rawRows.map((row) => {
        if (!Array.isArray(row)) return [];
        return row.map((cell) => (typeof cell === 'string' ? cell.trim() : cell));
      });

      return buildRecordsFromRows(rows);
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw error instanceof Error ? error : new Error('Erro ao processar arquivo Excel');
    }
  };

  const parseFileData = async (file: File): Promise<FemaleRow[]> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv' || extension === 'txt') return parseCsvFile(file);
    if (extension && ['xlsx', 'xls', 'xlsm', 'xlsb'].includes(extension)) return parseExcelFile(file);
    throw new Error('Formato de arquivo não suportado. Utilize CSV ou Excel (.xlsx, .xls).');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Nenhum arquivo selecionado", description: "Selecione um arquivo CSV ou Excel para continuar.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setImportSummary(null);
    setBatchResults([]);
    setProgress({ total: 0, processed: 0, totalBatches: 0, completedBatches: 0 });

    try {
      const recordsData = await parseFileData(selectedFile);
      if (!recordsData || recordsData.length === 0) throw new Error('Nenhum dado válido encontrado no arquivo');

      if (recordsData.length > MAX_IMPORT_ROWS) {
        throw new Error(`Máximo de ${MAX_IMPORT_ROWS.toLocaleString('pt-BR')} linhas por operação. Divida o arquivo.`);
      }

      // Montar registros para a tabela females
      type FemaleInsertRecord = FemaleRow & { farm_id: string; name: string | null };
      const recordsToInsert: FemaleInsertRecord[] = recordsData.map((row) => {
        const nameValue = row.name;
        const record: FemaleInsertRecord = {
          farm_id: farmId,
          name: typeof nameValue === 'string' ? nameValue : nameValue != null ? String(nameValue) : null,
        };
        // id opcional
        if (row.id) record.id = String(row.id);

        // copiar os demais campos reconhecidos (ou null)
        optionalFields.forEach((field) => {
          if (field in row) {
            const value = row[field];
            record[field] = value ?? null;
          }
        });

        // reforçar alguns campos textuais com trim
        if (record.identifier != null) record.identifier = String(record.identifier).trim();
        if (record.cdcb_id != null) record.cdcb_id = String(record.cdcb_id).trim();

        return record;
      });

      // Validação mínima: nome obrigatório
      const invalidRows = recordsToInsert.filter(r => !r.name || String(r.name).trim() === '');
      if (invalidRows.length > 0) throw new Error(`${invalidRows.length} linha(s) sem nome válido encontrada(s)`);
      const totalRows = recordsToInsert.length;
      const expectedBatches = Math.max(1, Math.ceil(totalRows / API_CHUNK_SIZE));

      setProgress({ total: totalRows, processed: 0, totalBatches: expectedBatches, completedBatches: 0 });

      const response = await fetch(IMPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          rows: recordsToInsert,
          targetTable: TARGET_TABLE,
          onConflict: 'farm_id,identifier',
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      const clonedResponse = response.clone();
      let payload: ImportSummary | { error?: string } | null = null;
      let fallbackText: string | null = null;

      if (contentType.includes('application/json')) {
        try {
          payload = await clonedResponse.json();
        } catch (error) {
          console.error('Falha ao interpretar resposta JSON do importador:', error);
        }
      }

      if (!payload) {
        try {
          fallbackText = await response.text();
        } catch (error) {
          console.error('Falha ao ler texto da resposta do importador:', error);
        }
      }

      if (!response.ok) {
        const message = (payload && 'error' in payload && typeof payload.error === 'string')
          ? payload.error
          : fallbackText?.trim().slice(0, 500) || 'Não foi possível concluir o import.';
        setErrorMessage(message);
        throw new Error(message);
      }

      if (!payload) {
        const message = fallbackText?.trim().slice(0, 500) || 'Resposta inesperada do servidor do importador.';
        setErrorMessage(message);
        throw new Error(message);
      }

      if (typeof (payload as ImportSummary).total_received !== 'number') {
        const message = 'Resposta inesperada do servidor do importador.';
        setErrorMessage(message);
        throw new Error(message);
      }

      const summary: ImportSummary = payload as ImportSummary;
      const batches = Array.isArray(summary.batch_results) ? summary.batch_results : [];

      setImportSummary(summary);
      setBatchResults(batches);

      let processed = 0;
      let completedBatches = 0;
      const totalBatches = summary.total_batches ?? expectedBatches;

      if (batches.length > 0) {
        for (const batch of batches) {
          const processedInBatch = (batch.inserted ?? 0) + (batch.updated ?? 0);
          processed += processedInBatch;
          if (!batch.error) completedBatches += 1;

          setProgress({
            total: totalRows,
            processed,
            totalBatches,
            completedBatches,
          });

          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        setProgress({
          total: totalRows,
          processed: summary.total_success ?? processed,
          totalBatches,
          completedBatches,
        });
      } else {
        setProgress({
          total: totalRows,
          processed: summary.total_success ?? 0,
          totalBatches,
          completedBatches: totalBatches - (summary.errors?.length ?? 0),
        });
      }

      toast({
        title: "Fêmeas importadas com sucesso!",
        description: `${summary.total_success ?? 0} fêmea(s) processada(s) com sucesso na fazenda ${farmName}`,
      });

      setSelectedFile(null);
      if (onImportSuccess) onImportSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : "Não foi possível processar o arquivo. Tente novamente.";
      setErrorMessage(message);
      toast({
        title: "Erro no upload",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Template baseado nas colunas principais de females
    const headers = [
      'name','identifier','cdcb_id','birth_date','parity_order','category',
      'sire_naab','mgs_naab','mmgs_naab',
      'hhp_dollar','tpi','nm_dollar','cm_dollar','fm_dollar','gm_dollar',
      'f_sav','ptam','cfp','ptaf','ptaf_pct','ptap','ptap_pct',
      'pl','dpr','liv','scs','mast','met','rp','da','ket','mf',
      'ptat','udc','flc','sce','dce','ssb','dsb','h_liv','ccr','hcr','fi','gl','efc','bwc','sta','str','dfm',
      'rua','rls','rtp','ftl','rw','rlr','fta','fls','fua','ruh','ruw','ucl','udp','ftp','rfi','gfi',
      'beta_casein','kappa_casein'
    ];

    const sampleData = [
      'FEMEA EXEMPLO;BR001;1234567890;2020-01-15;2;Multipara;200HO12345;100HO98765;050HO11111;820;2650;750;680;590;420;1,2;1100;10;45;3,5;38;3,1;2,3;1,1;1,0;2,85;4,2;1,8;1,1;0,2;0,1;2,4;1,8;0,4;0,3;1,2;0,8;2,1;1,9;2,2;1,4;0,9;1,7;1,3;0,6;1,5;2,0;1,8;0,7;0,2;0,5;1,1;0,9;1,3;0,8;0,4;1,2;0,6;0,7;1,0;0,3;0,5;1,6;A2A2;AA'
    ];

    const csvContent = [headers.join(';'), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_femeas_${farmName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Fêmeas</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel com os dados das fêmeas para a fazenda {farmName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O arquivo pode conter colunas em ordem diferente e com nomes alternativos — o importador tenta reconhecer e normalizar.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Selecionar arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadTemplate} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Baixar Template
            </Button>

            <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="flex-1">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Formatos aceitos:</strong> CSV, Excel (.xlsx, .xls)<br />
            <strong>Tamanho máximo:</strong> 10MB<br />
            <strong>Limite por operação:</strong> 10.000 linhas<br />
            <strong>Codificação:</strong> UTF-8 (recomendado)
          </div>

          {(progress.total > 0 || batchResults.length > 0 || importSummary || errorMessage) && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              {progress.total > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Progresso do envio</div>
                  <div className="text-muted-foreground">
                    Processados: {progress.processed} / {progress.total}
                  </div>
                  <Progress value={progress.total ? Math.min(100, (progress.processed / progress.total) * 100) : 0} />
                  <div className="text-muted-foreground">
                    Lotes concluídos: {progress.completedBatches} / {progress.totalBatches}
                  </div>
                </div>
              )}

              {batchResults.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Resumo por lote</div>
                  <div className="max-h-48 overflow-y-auto overflow-x-auto rounded-md border">
                    <table className="min-w-[420px] w-full text-xs">
                      <thead className="bg-muted/60 text-muted-foreground">
                        <tr>
                          <th className="px-2 py-1 text-left">Lote</th>
                          <th className="px-2 py-1 text-left">Registros</th>
                          <th className="px-2 py-1 text-left">Inseridos</th>
                          <th className="px-2 py-1 text-left">Atualizados</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResults.map((batch) => (
                          <tr key={batch.batch} className="odd:bg-background even:bg-muted/40">
                            <td className="px-2 py-1 font-medium">{batch.batch}</td>
                            <td className="px-2 py-1">{batch.total}</td>
                            <td className="px-2 py-1">{batch.inserted}</td>
                            <td className="px-2 py-1">{batch.updated}</td>
                            <td className="px-2 py-1">
                              {batch.error ? (
                                <span className="text-destructive">Falha: {batch.error}</span>
                              ) : (
                                <span className="text-emerald-600">Sucesso</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importSummary && (
                <div className="space-y-1 text-xs">
                  <div>Total recebido: {importSummary.total_received}</div>
                  <div>Total processado com sucesso: {importSummary.total_success}</div>
                  <div>Chunks configurados: {importSummary.chunk_size}</div>
                  {typeof importSummary.inserted === 'number' && (
                    <div>Inseridos: {importSummary.inserted}</div>
                  )}
                  {typeof importSummary.updated === 'number' && (
                    <div>Atualizados: {importSummary.updated}</div>
                  )}
                  {importSummary.errors && importSummary.errors.length > 0 ? (
                    <div className="text-destructive">
                      {importSummary.errors.length} lote(s) com falha.
                    </div>
                  ) : (
                    <div className="text-emerald-600">Todos os lotes concluídos sem erros.</div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FemaleUploadModal;
