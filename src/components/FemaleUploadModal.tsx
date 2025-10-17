import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from '@/integrations/supabase/client';
import { read, utils } from 'xlsx';
import { parse as parseDateFn, isValid as isValidDate } from 'date-fns';

const TARGET_TABLE = "females";

const canonicalColumns = [
  'id', 'farm_id', 'category', 'ptas', 'created_at', 'updated_at',
  'sire_naab', 'mgs_naab', 'mmgs_naab', 'fonte', 'parity_order',
  'identifier', 'name', 'cdcb_id', 'birth_date',
  'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
  'ptam', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 'cfp', 'scs', 'pl', 'dpr', 'h_liv',
  'gl', 'mf', 'da', 'ket', 'mast', 'met', 'rp', 'ccr', 'hcr', 'fi', 'rfi',
  'f_sav', 'ptat', 'udc', 'flc', 'bwc', 'sta', 'str', 'bd', 'dfm',
  'rua', 'tw', 'rls', 'rlr', 'fa', 'fls', 'fta', 'ruh', 'rw', 'ucl', 'ud', 'ftp', 'rtp', 'ftl',
  'sce', 'dce', 'ssb', 'dsb', 'gfi',
  // Campos adicionais suportados anteriormente permanecem aceitos
  'liv', 'efc', 'ruw', 'udp', 'fua', 'beta_casein', 'kappa_casein'
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
  category: 'category',
  fonte: 'fonte',
  origem: 'fonte',
  source: 'fonte'
};

const numericFields = new Set<string>([
  'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar', 'f_sav', 'ptam', 'cfp', 'ptaf',
  'ptaf_pct', 'ptap', 'ptap_pct', 'pl', 'dpr', 'liv', 'h_liv', 'scs', 'mast', 'met', 'rp', 'ccr', 'hcr', 'fi',
  'rfi', 'gl', 'mf', 'da', 'ket', 'ptat', 'udc', 'flc', 'bwc', 'sta', 'str', 'bd', 'dfm', 'rua', 'tw', 'rls',
  'rlr', 'fa', 'fls', 'fta', 'ruh', 'rw', 'ucl', 'ud', 'udp', 'ftp', 'rtp', 'ftl', 'sce', 'dce', 'ssb', 'dsb',
  'gfi', 'efc', 'ruw', 'fua', 'parity_order'
]);

const dateFields = new Set<string>(['birth_date']);
const timestampFields = new Set<string>(['created_at', 'updated_at']);

const nullTokens = new Set<string>([
  '', 'null', 'undefined', 'na', 'n/a', 'nan', 'none', 'sem dado', 'sem dados', 'sem valor', '-', '--', '#########'
]);

const normalizeFonteValue = (value: FemaleValue | undefined): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  if (normalized.startsWith('genom')) return 'Genômica';
  if (normalized.startsWith('pred')) return 'Predição';

  return raw;
};

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

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim()); current = '';
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
    if (parsed.length > bestScore) { bestScore = parsed.length; bestDelimiter = candidate; }
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
  const { toast } = useToast();

  const optionalFields = canonicalColumns.filter((column) => !['id', 'farm_id', 'name'].includes(column)) as FemaleOptionalColumn[];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
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

          if (!headerCaptured) throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
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

    try {
      const recordsData = await parseFileData(selectedFile);
      if (!recordsData || recordsData.length === 0) throw new Error('Nenhum dado válido encontrado no arquivo');

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

        if ('fonte' in record) {
          record.fonte = normalizeFonteValue(record.fonte as FemaleValue | undefined);
        }

        // reforçar alguns campos textuais com trim
        if (record.identifier != null) record.identifier = String(record.identifier).trim();
        if (record.cdcb_id != null) record.cdcb_id = String(record.cdcb_id).trim();

        return record;
      });

      // Use edge function for server-side validation and insertion
      const { data, error } = await supabase.functions.invoke('upload-females', {
        body: { 
          records: recordsToInsert, 
          farm_id: farmId 
        }
      });

      if (error) {
        console.error('Upload function error:', error);
        throw new Error(`Erro ao processar upload: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(`Erro ao inserir dados: ${data.insert_errors} erro(s) de inserção`);
      }

      const totalInserted = data.inserted;
      
      if (data.validation_errors > 0) {
        console.warn(`${data.validation_errors} registro(s) com erro de validação foram ignorados`);
      }

      toast({
        title: "Fêmeas importadas com sucesso!",
        description: `${totalInserted} fêmea(s) importada(s) para a fazenda ${farmName}`,
      });

      setSelectedFile(null);
      if (onImportSuccess) onImportSuccess();
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
    // Template compatível com o layout oficial solicitado
    const headers = [
      'id','farm_id','category','ptas','created_at','updated_at','sire_naab','mgs_naab','mmgs_naab','Fonte','parity_order',
      'identifier','name','cdcb_id','birth_date','HHP$','TPI','NM$','CM$','FM$','GM$','PTAM','PTAF','PTAF%','PTAP','PTAP%',
      'CFP','SCS','PL','DPR','H LIV','GL','MF','DA','Ket','Mast','Met','RP','CCR','HCR','FI','RFI','F SAV','PTAT','UDC',
      'FLC','BWC','STA','STR','BD','DFM','RUA','TW','RLS','RLR','FA','FLS','FTA','RUH','RW','UCL','UD','FTP','RTP','FTL',
      'SCE','DCE','SSB','DSB','GFI'
    ];

    const sampleRow = [
      'FEMEA-001','FARM-123','Multipara','','2024-01-01T12:00:00Z','2024-02-01T12:00:00Z','200HO12345','100HO98765','050HO11111',
      'Genômica','2','BR001','Fêmea Exemplo','1234567890','2020-01-15','820','2650','750','680','590','420','1100','10','3.5',
      '38','3.1','2.3','2.85','4.2','1.8','1.1','0.2','0.1','2.4','1.8','0.4','0.3','1.2','0.8','2.1','1.9','2.2','1.4',
      '0.9','1.7','1.3','0.6','1.5','2.0','1.8','0.7','0.2','0.5','1.1','0.9','1.3','0.8','0.4','1.2','0.6','0.7','1.0',
      '0.3','0.5','1.6','2.1','1.5','1.2','0.9','1.4'
    ];
    const csvContent = [headers.join(';'), sampleRow.join(';')].join('\n');
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
            <strong>Codificação:</strong> UTF-8 (recomendado)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FemaleUploadModal;
