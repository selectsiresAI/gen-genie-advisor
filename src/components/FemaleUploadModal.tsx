import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { read, utils } from 'xlsx';
import { parse as parseDateFn, isValid as isValidDate } from 'date-fns';

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

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

const isValidUUID = (value: string): boolean => uuidRegex.test(value);

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
      'dd/MM/yyyy',
      'MM/dd/yyyy',
      'dd-MM-yyyy',
      'MM-dd-yyyy',
      'dd.MM.yyyy',
      'MM.dd.yyyy',
      'yyyy/MM/dd',
      'ddMMyyyy',
      'yyyyMMdd'
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
    'dd/MM/yyyy HH:mm:ss',
    'dd/MM/yyyy HH:mm',
    'MM/dd/yyyy HH:mm:ss',
    'MM/dd/yyyy HH:mm',
    'dd-MM-yyyy HH:mm:ss',
    'dd-MM-yyyy HH:mm',
    'yyyy-MM-dd HH:mm:ss',
    'yyyy-MM-dd HH:mm'
  ]);

  if (parsed && isValidDate(parsed)) {
    return parsed.toISOString();
  }

  console.warn(`⚠️  Não foi possível normalizar o timestamp na coluna ${column}. Valor mantido como string.`);
  return raw;
};

const parsePtasValue = (value: unknown, header: string) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  const raw = typeof value === 'string' ? value.trim() : String(value);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
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
      if (Object.keys(result).length > 0) {
        return result;
      }
    }

    console.warn(`⚠️  Não foi possível converter o campo PTAs na coluna ${header}. Valor armazenado como texto.`);
    return { raw };
  }
};

const normalizeNumericValue = (canonicalKey: string, value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

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

type FemaleCanonicalColumn = typeof canonicalColumns[number];
type FemaleOptionalColumn = Exclude<FemaleCanonicalColumn, 'id' | 'farm_id' | 'name'>;
type FemaleValue = string | number | boolean | null | Record<string, unknown>;
type FemaleRow = Partial<Record<FemaleCanonicalColumn, FemaleValue>>;

const toCanonicalValue = (
  canonicalKey: string,
  header: string,
  value: unknown
): FemaleValue | null => {
  if (value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (nullTokens.has(normalized.toLowerCase())) {
      return null;
    }
    value = normalized;
  }

  if (value === null || value === '') {
    return null;
  }

  if (dateFields.has(canonicalKey)) {
    return normalizeDateValue(value, header);
  }

  if (timestampFields.has(canonicalKey)) {
    return normalizeTimestampValue(value, header);
  }

  if (canonicalKey === 'ptas') {
    return parsePtasValue(value, header);
  }

  if (numericFields.has(canonicalKey)) {
    return normalizeNumericValue(canonicalKey, value);
  }

  return value as FemaleValue;
};

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values.map((value) => value.replace(/^["']|["']$/g, ''));
};

const detectDelimiter = (line: string): string => {
  const candidates = [';', ',', '\t', '|'];
  let bestDelimiter = ';';
  let bestScore = 1;

  for (const candidate of candidates) {
    const parsed = splitCsvLine(line, candidate);
    if (parsed.length > bestScore) {
      bestScore = parsed.length;
      bestDelimiter = candidate;
    }
  }

  return bestDelimiter === '\t' ? '\t' : bestDelimiter;
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

  if (workingRows.length < 2) {
    throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
  }

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
    if (isRowEmpty(rawValues)) {
      return;
    }

    const row: FemaleRow = {};

    headerInfos.forEach((info, columnIndex) => {
      if (!info.canonicalKey) return;
      const rawValue = rawValues[columnIndex];
      const value = toCanonicalValue(info.canonicalKey, info.header, rawValue);
      if (value !== undefined) {
        row[info.canonicalKey] = value;
      }
    });

    const displayRow = index + 2;

    if (row.id !== undefined && row.id !== null) {
      const trimmedId = String(row.id).trim();
      if (trimmedId && isValidUUID(trimmedId)) {
        row.id = trimmedId;
      } else if (trimmedId) {
        rowErrors.push(`Linha ${displayRow}: valor inválido em "id" (${trimmedId}). Informe um UUID ou deixe vazio.`);
        delete row.id;
      }
    }

    if (row.identifier !== undefined && row.identifier !== null) {
      const trimmedIdentifier = String(row.identifier).trim();
      if (trimmedIdentifier) {
        row.identifier = trimmedIdentifier;
      } else {
        delete row.identifier;
      }
    }

    if (row.cdcb_id !== undefined && row.cdcb_id !== null) {
      const trimmedCdcb = String(row.cdcb_id).trim();
      if (trimmedCdcb) {
        row.cdcb_id = trimmedCdcb;
      } else {
        delete row.cdcb_id;
      }
    }

    if (!row.name || String(row.name).trim() === '') {
      const fallback = row.identifier || row.cdcb_id || row.id;
      if (fallback) {
        row.name = String(fallback).trim();
      }
    } else {
      row.name = String(row.name).trim();
    }

    if (!row.identifier && row.cdcb_id) {
      row.identifier = row.cdcb_id;
    }

    if (!row.identifier && row.id) {
      row.identifier = row.id;
    }

    if (!row.name || String(row.name).trim() === '') {
      rowErrors.push(`Linha ${displayRow}: não há coluna "name" preenchida nem identificador para deduzir o nome do animal.`);
    }

    if (row.id) {
      const idValue = String(row.id).trim();
      if (idValue) {
        if (seenIds.has(idValue)) {
          rowErrors.push(`Linha ${displayRow}: identificador de registro duplicado (id=${idValue}).`);
        } else {
          seenIds.add(idValue);
        }
      }
    }

    if (row.identifier) {
      const identifierValue = String(row.identifier).trim();
      if (identifierValue) {
        const firstOccurrence = seenIdentifiers.get(identifierValue);
        if (firstOccurrence) {
          rowErrors.push(`Linhas ${firstOccurrence} e ${displayRow}: identificador '${identifierValue}' duplicado no arquivo.`);
        } else {
          seenIdentifiers.set(identifierValue, displayRow);
        }
      }
    }

    dataRows.push(row);
  });

  if (dataRows.length === 0) {
    throw new Error('Nenhum dado válido encontrado no arquivo. Verifique se as linhas possuem informações preenchidas.');
  }

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
  const { toast } = useToast();

  const optionalFields = canonicalColumns.filter((column) => !['id', 'farm_id', 'name'].includes(column)) as FemaleOptionalColumn[];

  type FemaleInsertPayload = Database['public']['Tables']['females']['Insert'];

  const buildInsertRecord = (
    row: FemaleRow,
    identifierToId: Map<string, string>
  ): FemaleInsertPayload => {
    const nameValue = row.name;
    const identifierValue = row.identifier ? String(row.identifier).trim() : '';
    const normalizedIdentifier = identifierValue || null;
    const normalizedName = typeof nameValue === 'string'
      ? nameValue.trim()
      : nameValue != null
        ? String(nameValue).trim()
        : '';

    const record: FemaleInsertPayload = {
      farm_id: farmId,
      name: normalizedName,
      identifier: normalizedIdentifier,
    };

    const rowId = typeof row.id === 'string' ? row.id : row.id != null ? String(row.id) : undefined;
    const fallbackId = normalizedIdentifier ? identifierToId.get(normalizedIdentifier) : undefined;
    const finalId = rowId || fallbackId;

    if (finalId && isValidUUID(finalId)) {
      record.id = finalId;
    }

    optionalFields.forEach((field) => {
      if (field in row) {
        const value = row[field];
        if (value === undefined) {
          return;
        }

        if (field === 'name' || field === 'farm_id' || field === 'identifier') {
          return;
        }

        record[field as keyof FemaleInsertPayload] = (value as FemaleInsertPayload[keyof FemaleInsertPayload]) ?? null;
      }
    });

    return record;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    e.target.value = '';
  };

  const parseCsvFile = async (file: File): Promise<FemaleRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = (event.target?.result as string) ?? '';
          const normalizedText = text.replace(/\r\n/g, '\n');
          const lines = normalizedText.split('\n');

          const rows: (string | number | null | undefined)[][] = [];
          let delimiter = ';';
          let headerCaptured = false;

          for (const rawLine of lines) {
            if (!headerCaptured) {
              if (rawLine.trim() === '') continue;
              const headerLine = rawLine.replace(/^\uFEFF/, '');
              delimiter = detectDelimiter(headerLine);
              rows.push(splitCsvLine(headerLine, delimiter));
              headerCaptured = true;
            } else {
              rows.push(splitCsvLine(rawLine, delimiter));
            }
          }

          if (!headerCaptured) {
            throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
          }

          resolve(buildRecordsFromRows(rows));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Erro ao processar arquivo CSV'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file, 'utf-8');
    });
  };

  const parseExcelFile = async (file: File): Promise<FemaleRow[]> => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error('Arquivo Excel sem abas válidas.');
      }

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

    if (extension === 'csv' || extension === 'txt') {
      return parseCsvFile(file);
    }

    if (extension && ['xlsx', 'xls', 'xlsm', 'xlsb'].includes(extension)) {
      return parseExcelFile(file);
    }

    throw new Error('Formato de arquivo não suportado. Utilize CSV ou Excel (.xlsx, .xls).');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione um arquivo CSV ou Excel para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const recordsData = await parseFileData(selectedFile);

      if (!recordsData || recordsData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      const identifiers = Array.from(
        new Set(
          recordsData
            .map((row) => {
              if (!row.identifier) return null;
              const identifierValue = String(row.identifier).trim();
              return identifierValue || null;
            })
            .filter((value): value is string => Boolean(value))
        )
      );

      const identifierToId = new Map<string, string>();

      const identifierChunkSize = 100;
      for (let i = 0; i < identifiers.length; i += identifierChunkSize) {
        const chunk = identifiers.slice(i, i + identifierChunkSize);
        const { data: existingFemales, error: existingFemalesError } = await supabase
          .from('females')
          .select('id, identifier')
          .eq('farm_id', farmId)
          .in('identifier', chunk);

        if (existingFemalesError) {
          console.error('Erro ao buscar fêmeas existentes:', existingFemalesError);
          throw new Error('Não foi possível verificar os registros existentes. Tente novamente mais tarde.');
        }

        existingFemales
          ?.filter((female): female is { id: string; identifier: string } => Boolean(female?.id && female?.identifier))
          .forEach((female) => {
            identifierToId.set(female.identifier, female.id);
          });
      }

      const recordsToInsert = recordsData.map((row) => buildInsertRecord(row, identifierToId));

      const missingNames = recordsToInsert.filter((record) => !record.name || record.name.trim() === '');
      if (missingNames.length > 0) {
        throw new Error('Alguns registros não possuem nome válido após o processamento. Verifique o arquivo e tente novamente.');
      }

      const batchSize = 100;
      let totalInserted = 0;

      for (let i = 0; i < recordsToInsert.length; i += batchSize) {
        const chunk = recordsToInsert.slice(i, i + batchSize);

        const { error } = await supabase
          .from('females')
          .upsert(chunk as Record<string, unknown>[], { onConflict: 'id' });

        if (error) {
          console.error('Supabase insertion error:', error);
          const details = (error as { details?: string; hint?: string } | null | undefined)?.details
            || (error as { details?: string; hint?: string } | null | undefined)?.hint;
          const message = details ? `${error.message} (${details})` : error.message;
          throw new Error(`Erro ao inserir dados: ${message}`);
        }

        totalInserted += chunk.length;
      }

      toast({
        title: "Rebanho importado com sucesso!",
        description: `${totalInserted} fêmea(s) importada(s) para a fazenda ${farmName}`,
      });

      setSelectedFile(null);
      
      // Call import success callback if provided
      if (onImportSuccess) {
        onImportSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Não foi possível processar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a comprehensive CSV template baseado na tabela females/females_denorm
    const headers = ['id', 'farm_id', 'name', ...optionalFields];

    const sampleRow: Record<string, string> = {
      id: 'uuid-exemplo',
      farm_id: farmId,
      name: 'Fêmea Exemplo',
      identifier: 'BR123456789',
      cdcb_id: 'USA000000000',
      sire_naab: '1HO12345',
      mgs_naab: '1HO54321',
      mmgs_naab: '1HO67890',
      birth_date: '2021-05-12',
      ptas: '{"TPI": 2700, "NM$": 620}',
      hhp_dollar: '850',
      tpi: '2700',
      nm_dollar: '620',
      cm_dollar: '580',
      fm_dollar: '520',
      gm_dollar: '450',
      f_sav: '1.2',
      ptam: '1100',
      ptaf: '45',
      ptap: '38',
      pl: '2.3',
      dpr: '1.1',
      scs: '2.85',
      ptat: '2.4',
      udc: '2.1',
      category: 'Novilha',
      parity_order: '0',
      beta_casein: 'A2/A2',
      kappa_casein: 'BB'
    };

    const sampleData = [headers.map(header => sampleRow[header] ?? '').join(';')];

    const csvContent = [headers.join(';'), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_rebanho_${farmName.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template baixado",
      description: "Use este modelo para organizar os dados do rebanho.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Registros Genéticos</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel com os dados dos registros genéticos para a fazenda {farmName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O arquivo deve conter as colunas conforme o template. Baixe o template para ver todas as colunas disponíveis nas tabelas females/females_denorm.
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
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Baixar Template
            </Button>
            
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
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
            <strong>Codificação:</strong> UTF-8 (recomendado)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FemaleUploadModal;