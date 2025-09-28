import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { read, utils } from 'xlsx';

type FemaleRow = Record<string, unknown>;

type SupabaseConfigInput = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

interface FemaleUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId: string;
  farmName: string;
  onImportSuccess?: () => void;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

const TARGET_TABLE = "females";

const DB_FIELD_MAP: Record<string, string> = {
  "hhp$": "hhp_dollar",
  "nm$": "nm_dollar",
  "cm$": "cm_dollar",
  "fm$": "fm_dollar",
  "gm$": "gm_dollar",
};

const PTA_CANONICAL_FIELDS = [
  'hhp$','tpi','nm$','cm$','fm$','gm$','f_sav','ptam','cfp','ptaf','ptaf_pct','ptap','ptap_pct','pl','dpr','liv','scs','mast','met','rp','da','ket','mf','ptat','udc','flc','sce','dce','ssb','dsb','h_liv','ccr','hcr','fi','gl','efc','bwc','sta','str','dfm','rua','rls','rtp','ftl','rw','rlr','fta','fls','fua','ruh','ruw','ucl','udp','ftp','rfi','gfi','beta_casein','kappa_casein'
] as const;

const PTAS_KEYS = [
  'tpi','ptam','ptaf','ptaf_pct','ptap','ptap_pct','scs','pl','dpr','liv','ptat','udc','flc','sce','dce','ssb','dsb','h_liv','ccr','hcr','fi','gl','efc','bwc','sta','str','dfm','rua','rls','rtp','ftl','rw','rlr','fta','fls','fua','ruh','ruw','ucl','udp','ftp','rfi','gfi','beta_casein','kappa_casein'
] as const;

const NUMERIC_KEYS = new Set<string>(
  PTA_CANONICAL_FIELDS.filter((key) => key !== 'beta_casein' && key !== 'kappa_casein')
);

const HEADER_SYNONYMS: Record<string, string[]> = {
  'hhp$': ['hhp', 'hhp dollar', 'hhp dolar', 'hhp score'],
  'tpi': ['total performance index', 'indice tpi'],
  'nm$': ['net merit', 'net merit $', 'merito liquido', 'merito liquido$', 'nm dollar'],
  'cm$': ['cheese merit', 'cheese merit $', 'merito queijo'],
  'fm$': ['fluid merit', 'fluid merit $'],
  'gm$': ['grazing merit', 'grazing merit $'],
  'f_sav': ['feed saved', 'economia de alimento'],
  'ptam': ['pta milk', 'milk', 'milk lbs', 'milk (lbs)', 'pta leite', 'leite pta', 'leite (kg)', 'milk kg'],
  'cfp': ['combined fat protein', 'cheese fat protein'],
  'ptaf': ['pta fat', 'fat', 'fat lbs', 'pta gordura', 'gordura (kg)'],
  'ptaf_pct': ['ptaf%', 'ptaf pct', 'fat%', 'fat pct', 'pta gordura %', 'gordura %'],
  'ptap': ['pta protein', 'protein', 'protein lbs', 'pta proteina', 'proteina (kg)'],
  'ptap_pct': ['ptap%', 'ptap pct', 'protein%', 'protein pct', 'proteina %'],
  'pl': ['productive life', 'vida produtiva'],
  'dpr': ['daughter pregnancy rate', 'taxa prenhez filhas'],
  'liv': ['longevity', 'longevidade'],
  'scs': ['somatic cell score', 'ccs', 'escore celulas somaticas'],
  'mast': ['mastitis'],
  'met': ['metritis'],
  'rp': ['retained placenta', 'placenta retida'],
  'da': ['displaced abomasum', 'abomaso deslocado'],
  'ket': ['ketosis', 'cetose'],
  'mf': ['milk fever', 'febre do leite'],
  'ptat': ['type', 'tipo'],
  'udc': ['udder composite', 'composto ubre'],
  'flc': ['feet and legs', 'composto pes pernas'],
  'sce': ['sire calving ease', 'facilidade parto touro'],
  'dce': ['daughter calving ease', 'facilidade parto filhas'],
  'ssb': ['sire stillbirth', 'natimorto touro'],
  'dsb': ['daughter stillbirth', 'natimorto filhas'],
  'h_liv': ['herd life', 'vida rebanho'],
  'ccr': ['cow conception rate', 'taxa concepcao vacas'],
  'hcr': ['heifer conception rate', 'taxa concepcao novilhas'],
  'fi': ['fertility index', 'indice fertilidade'],
  'gl': ['gestation length', 'gestacao'],
  'efc': ['early first calving', 'idade primeiro parto'],
  'bwc': ['body weight composite', 'composto peso corporal'],
  'sta': ['stature', 'estatura'],
  'str': ['strength', 'forca'],
  'dfm': ['dairy form', 'forma leiteira'],
  'rua': ['rump angle', 'angulo garupa'],
  'rls': ['rear legs side', 'pernas traseiras lateral'],
  'rtp': ['rear teat placement', 'posicao teto traseiro'],
  'ftl': ['fore teat length', 'comprimento teto frontal'],
  'rw': ['rump width', 'largura garupa'],
  'rlr': ['rear legs rear', 'pernas traseiras posterior'],
  'fta': ['front teat angle', 'angulo teto frontal'],
  'fls': ['foot angle', 'angulo casco'],
  'fua': ['front udder attachment', 'ligacao ubre frontal'],
  'ruh': ['rear udder height', 'altura ubre traseiro'],
  'ruw': ['rear udder width', 'largura ubre traseiro'],
  'ucl': ['udder cleft', 'ligamento ubre'],
  'udp': ['udder depth', 'profundidade ubre'],
  'ftp': ['front teat placement', 'posicao teto frontal'],
  'rfi': ['residual feed intake', 'ingestao residual alimento'],
  'gfi': ['grazing feed intake', 'ingestao pastejo'],
  'beta_casein': ['beta casein', 'beta-casein', 'beta caseina'],
  'kappa_casein': ['kappa casein', 'kappa-casein', 'kappa caseina'],
};

const FIXED_FIELD_ALIASES = [
  'Nome','name','Nome Animal','Animal','ID CDCB','cdcb_id','CDCB','CDCB ID','Data de Nascimento','birth_date','Nascimento','Data Nascimento',
  'Pedigre Pai/Avô Materno/BisaAvô Materno','Pedigree','Pedigree Pai','ID Fazenda','identifier','animal_id','Brinco','ID Animal','farm_id',
  'sire_naab','Pai','mgs_naab','Avô Materno','mmgs_naab','BisaAvô Materno'
];

const FIXED_FIELD_ALIAS_SET = new Set(FIXED_FIELD_ALIASES.map((alias) => sanitizeHeaderKey(alias)));

const sanitizeHeaderKey = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\$/g, 'dollar')
    .replace(/%/g, 'pct')
    .replace(/[^a-z0-9]/g, '');

const dbCol = (canonicalKey: string): string => {
  return DB_FIELD_MAP[canonicalKey] ?? canonicalKey;
};

const resolveSupabaseConfig = (input?: SupabaseConfigInput) => {
  const pickString = (source: Record<string, unknown> | undefined, keys: string[]): string | undefined => {
    if (!source) return undefined;
    for (const key of keys) {
      const candidate = source[key];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate;
      }
    }
    return undefined;
  };

  const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : undefined;
  const winEnvRaw = win?.['__env'];
  const winEnv = (typeof winEnvRaw === 'object' && winEnvRaw !== null)
    ? (winEnvRaw as Record<string, unknown>)
    : undefined;
  const importMetaEnv = typeof import.meta !== 'undefined'
    ? (((import.meta as unknown as Record<string, unknown>).env as Record<string, unknown>) ?? {})
    : {};
  const processEnv = typeof process !== 'undefined' && typeof process.env !== 'undefined'
    ? (process.env as unknown as Record<string, unknown>)
    : {};

  const supabaseUrl =
    input?.supabaseUrl ??
    pickString(win, ['supabaseUrl', 'SUPABASE_URL']) ??
    pickString(winEnv, ['supabaseUrl', 'SUPABASE_URL']) ??
    pickString(importMetaEnv, ['VITE_SUPABASE_URL', 'SUPABASE_URL']) ??
    pickString(processEnv, ['VITE_SUPABASE_URL', 'SUPABASE_URL']);

  const supabaseAnonKey =
    input?.supabaseAnonKey ??
    pickString(win, ['supabaseAnonKey', 'SUPABASE_ANON_KEY']) ??
    pickString(winEnv, ['supabaseAnonKey', 'SUPABASE_ANON_KEY']) ??
    pickString(importMetaEnv, ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']) ??
    pickString(processEnv, ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);

  return { supabaseUrl, supabaseAnonKey };
};

const createSupabase = ({ url, anonKey }: { url: string; anonKey: string }): SupabaseClient<Database> => {
  return createClient<Database>(url, anonKey);
};

const buildHeaderAliasMap = () => {
  const map = new Map<string, string>();

  const register = (alias: string, canonical: string) => {
    const sanitized = sanitizeHeaderKey(alias);
    if (!sanitized || map.has(sanitized)) return;
    map.set(sanitized, canonical);
  };

  PTA_CANONICAL_FIELDS.forEach((canonical) => {
    register(canonical, canonical);
    register(canonical.toUpperCase(), canonical);
    register(canonical.replace(/_/g, ' '), canonical);
    register(dbCol(canonical), canonical);
    register(dbCol(canonical).toUpperCase(), canonical);
  });

  Object.entries(HEADER_SYNONYMS).forEach(([canonical, synonyms]) => {
    synonyms.forEach((synonym) => register(synonym, canonical));
  });

  return map;
};

const HEADER_ALIAS_MAP = buildHeaderAliasMap();
const HEADER_ALIAS_ENTRIES = Array.from(HEADER_ALIAS_MAP.entries());

const hasValidString = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
};

const toCanonicalValue = (canonicalKey: string, _headerLabel: string, value: unknown): number | string | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (NUMERIC_KEYS.has(canonicalKey)) {
      return value;
    }
    return value.toString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '#########') return null;

    if (NUMERIC_KEYS.has(canonicalKey)) {
      const normalized = trimmed
        .replace(/\s+/g, '')
        .replace(/[%]/g, '')
        .replace(/[^0-9,.-]/g, '')
        .replace(/,(?=\d{3}(\D|$))/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(/,/g, '.');
      const num = parseFloat(normalized);
      return Number.isNaN(num) ? null : num;
    }

    return trimmed;
  }

  return value as string | null;
};

const parseDelimitedLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '"';

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if ((char === '"' || char === "'") && (!inQuotes || char === quoteChar)) {
      if (inQuotes && line[i + 1] === char) {
        current += char;
        i += 1;
      } else {
        inQuotes = !inQuotes;
        quoteChar = char;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

const detectDelimiter = (line: string): string => {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  if (semicolons === 0 && commas === 0) return ';';
  if (semicolons >= commas) return ';';
  return ',';
};

const parseCsvText = (text: string): { headers: string[]; rows: FemaleRow[] } => {
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseDelimitedLine(lines[0], delimiter).map((header) => header.trim());
  const headers = rawHeaders.filter((header) => header !== '');
  const rows: FemaleRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseDelimitedLine(lines[i], delimiter);
    const row: FemaleRow = {};
    let hasValue = false;

    rawHeaders.forEach((header, index) => {
      if (!header) return;
      const rawValue = values[index] ?? '';
      const trimmed = rawValue.trim();
      if (trimmed !== '') {
        hasValue = true;
        row[header] = trimmed;
      } else {
        row[header] = null;
      }
    });

    if (hasValue) {
      rows.push(row);
    }
  }

  return { headers, rows };
};

const parseXlsxData = (buffer: ArrayBuffer): { headers: string[]; rows: FemaleRow[] } => {
  const workbook = read(new Uint8Array(buffer), { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return { headers: [], rows: [] };
  }

  const rowsMatrix = utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
    blankrows: false,
    dateNF: 'yyyy-mm-dd',
  });

  if (rowsMatrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerRow = Array.isArray(rowsMatrix[0]) ? rowsMatrix[0] : [];
  const headers = headerRow.map((cell) => (cell == null ? '' : String(cell).trim())).filter((header) => header !== '');
  const rows: FemaleRow[] = [];

  rowsMatrix.slice(1).forEach((rowArray) => {
    if (!Array.isArray(rowArray)) return;
    const row: FemaleRow = {};
    let hasValue = false;

    headerRow.forEach((headerCell, index) => {
      const header = headerCell == null ? '' : String(headerCell).trim();
      if (!header) return;
      const cell = rowArray[index];
      let value: unknown = cell;

      if (typeof cell === 'string') {
        value = cell.trim() === '' ? null : cell.trim();
      }

      if (value !== null && value !== undefined && value !== '') {
        hasValue = true;
      } else {
        value = null;
      }

      row[header] = value;
    });

    if (hasValue) {
      rows.push(row);
    }
  });

  return { headers, rows };
};

const parseFile = async (file: File): Promise<{ headers: string[]; rows: FemaleRow[] }> => {
  const extension = file.name.toLowerCase();
  const isSpreadsheet = extension.endsWith('.xlsx') || extension.endsWith('.xls');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (result == null) {
          reject(new Error('Arquivo vazio ou ilegível'));
          return;
        }

        if (isSpreadsheet) {
          const buffer = result instanceof ArrayBuffer ? result : new Uint8Array(result as ArrayLike<number>).buffer;
          resolve(parseXlsxData(buffer));
        } else {
          const text = typeof result === 'string'
            ? result
            : new TextDecoder('utf-8').decode(result as ArrayBuffer);
          resolve(parseCsvText(text));
        }
      } catch (error) {
        reject(new Error('Erro ao processar arquivo'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

    if (isSpreadsheet) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'utf-8');
    }
  });
};

const buildRowValueResolver = (row: FemaleRow) => {
  const normalizedMap = new Map<string, string>();
  const sanitizedMap = new Map<string, string>();

  Object.keys(row).forEach((key) => {
    const lower = key.toLowerCase();
    if (!normalizedMap.has(lower)) {
      normalizedMap.set(lower, key);
    }

    const sanitized = sanitizeHeaderKey(key);
    if (sanitized && !sanitizedMap.has(sanitized)) {
      sanitizedMap.set(sanitized, key);
    }
  });

  return (candidates: string[]): unknown => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (Object.prototype.hasOwnProperty.call(row, candidate)) {
        return row[candidate];
      }

      const lower = candidate.toLowerCase();
      const normalizedMatch = normalizedMap.get(lower);
      if (normalizedMatch) {
        return row[normalizedMatch];
      }

      const sanitized = sanitizeHeaderKey(candidate);
      if (sanitized) {
        const sanitizedMatch = sanitizedMap.get(sanitized);
        if (sanitizedMatch) {
          return row[sanitizedMatch];
        }
      }
    }

    return undefined;
  };
};

const mapFixedColumns = (
  row: FemaleRow,
  farmId: string,
  resolveValue: (candidates: string[]) => unknown,
): FemaleRow => {
  const out: FemaleRow = { farm_id: farmId };

  const toTrimmedString = (value: unknown) =>
    value == null ? undefined : String(value).trim() || undefined;

  const nameValue = resolveValue(['Nome', 'name', 'Nome Animal', 'Animal']);
  if (nameValue != null) {
    out.name = toTrimmedString(nameValue);
  }

  const cdcbValue = resolveValue(['ID CDCB', 'cdcb_id', 'CDCB', 'CDCB ID']);
  if (cdcbValue != null) {
    out.cdcb_id = toTrimmedString(cdcbValue);
  }

  const birthValue = resolveValue(['Data de Nascimento', 'birth_date', 'Nascimento', 'Data Nascimento']);
  if (birthValue != null) {
    const birthString = toTrimmedString(birthValue);
    if (birthString) {
      out.birth_date = birthString.slice(0, 10);
    }
  }

  const pedigreeValue = resolveValue([
    'Pedigre Pai/Avô Materno/BisaAvô Materno',
    'Pedigree',
    'Pedigree Pai',
  ]);
  if (pedigreeValue) {
    const parts = String(pedigreeValue)
      .split('/')
      .map((part) => part.trim());
    out.sire_naab = parts[0] || null;
    out.mgs_naab = parts[1] || null;
    out.mmgs_naab = parts[2] || null;
  }

  const sireValue = resolveValue(['sire_naab', 'Pai', 'Sire NAAB', 'Pai NAAB']);
  if (sireValue && !out.sire_naab) {
    out.sire_naab = toTrimmedString(sireValue) ?? null;
  }

  const mgsValue = resolveValue(['mgs_naab', 'Avô Materno', 'MGS']);
  if (mgsValue && !out.mgs_naab) {
    out.mgs_naab = toTrimmedString(mgsValue) ?? null;
  }

  const mmgsValue = resolveValue(['mmgs_naab', 'BisaAvô Materno', 'MMGS']);
  if (mmgsValue && !out.mmgs_naab) {
    out.mmgs_naab = toTrimmedString(mmgsValue) ?? null;
  }

  const identifierValue = resolveValue(['ID Fazenda', 'identifier', 'animal_id', 'Brinco', 'ID Animal']);
  if (identifierValue != null) {
    out.identifier = toTrimmedString(identifierValue);
  }

  if (!out.name) {
    const fallback = out.identifier ?? out.cdcb_id;
    if (fallback) {
      out.name = fallback;
    }
  }

  return out;
};

const findCanonicalForHeader = (header: string): string | undefined => {
  const sanitized = sanitizeHeaderKey(header);
  if (!sanitized) return undefined;

  const direct = HEADER_ALIAS_MAP.get(sanitized);
  if (direct) return direct;

  for (const [alias, canonical] of HEADER_ALIAS_ENTRIES) {
    if (alias.length >= 4 && sanitized.includes(alias)) {
      return canonical;
    }
  }

  return undefined;
};

const buildHeaderMapping = (headers: string[]): { mapping: Record<string, string>; unmatched: string[] } => {
  const mapping: Record<string, string> = {};
  const unmatched: string[] = [];

  headers.forEach((header) => {
    const canonical = findCanonicalForHeader(header);
    if (canonical) {
      mapping[header] = canonical;
      return;
    }

    const sanitized = sanitizeHeaderKey(header);
    if (!sanitized || FIXED_FIELD_ALIAS_SET.has(sanitized) || sanitized === 'ptas') {
      return;
    }

    unmatched.push(header);
  });

  return { mapping, unmatched };
};

const FemaleUploadModal: React.FC<FemaleUploadModalProps> = ({
  isOpen,
  onClose,
  farmId,
  farmName,
  onImportSuccess,
  supabaseUrl,
  supabaseAnonKey,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const supabaseConfig = useMemo(
    () => resolveSupabaseConfig({ supabaseUrl, supabaseAnonKey }),
    [supabaseUrl, supabaseAnonKey]
  );

  const supabaseClient = useMemo(() => {
    if (!supabaseConfig.supabaseUrl || !supabaseConfig.supabaseAnonKey) {
      return null;
    }

    return createSupabase({
      url: supabaseConfig.supabaseUrl,
      anonKey: supabaseConfig.supabaseAnonKey,
    });
  }, [supabaseConfig.supabaseUrl, supabaseConfig.supabaseAnonKey]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    event.target.value = '';
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

    if (!supabaseClient) {
      toast({
        title: "Configuração do Supabase ausente",
        description: "Não foi possível resolver as credenciais do Supabase no navegador.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const parsed = await parseFile(selectedFile);
      if (!parsed || parsed.rows.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      const { mapping, unmatched } = buildHeaderMapping(parsed.headers);

      const normalizedRecords: FemaleRow[] = parsed.rows.map((row) => {
        const resolveValue = buildRowValueResolver(row);
        const normalized: FemaleRow = mapFixedColumns(row, farmId, resolveValue);

        Object.entries(mapping).forEach(([header, canonicalKey]) => {
          const rawValue = resolveValue([header]);
          const convertedValue = toCanonicalValue(canonicalKey, header, rawValue);
          const fallbackValue =
            rawValue === undefined || rawValue === null || rawValue === '' ? null : rawValue;
          const finalValue = convertedValue ?? fallbackValue;

          if (finalValue !== undefined) {
            normalized[dbCol(canonicalKey)] = finalValue;
          }
        });

        const ptas: Record<string, unknown> = {};
        PTAS_KEYS.forEach((key) => {
          const column = dbCol(key);
          if (
            Object.prototype.hasOwnProperty.call(normalized, column) &&
            normalized[column] !== undefined &&
            normalized[column] !== null
          ) {
            ptas[key] = normalized[column];
          }
        });

        if (Object.keys(ptas).length > 0) {
          normalized.ptas = ptas;
        }

        return normalized;
      });

      const warningMessages: string[] = [];

      const missingCdcb = normalizedRecords.filter((row) => !hasValidString(row['cdcb_id']));
      if (missingCdcb.length > 0) {
        warningMessages.push(`${missingCdcb.length} linha(s) sem ID CDCB válido foram ignoradas`);
      }

      const recordsToInsert = normalizedRecords.filter((row) => hasValidString(row['cdcb_id']));
      if (recordsToInsert.length === 0) {
        throw new Error('Nenhum ID CDCB válido encontrado nas linhas importadas.');
      }

      const missingName = recordsToInsert.filter((row) => !hasValidString(row['name']));
      if (missingName.length > 0) {
        warningMessages.push(`${missingName.length} linha(s) sem Nome válido`);
      }

      if (unmatched.length > 0) {
        warningMessages.push(`Colunas ignoradas: ${unmatched.join(', ')}`);
      }

      const chunkSize = 500;
      let totalInserted = 0;

      for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
        const chunk = recordsToInsert.slice(i, i + chunkSize);
        const { error } = await supabaseClient
          .from(TARGET_TABLE)
          .upsert(chunk, { onConflict: "farm_id,cdcb_id" });

        if (error) {
          throw new Error(`Erro ao inserir dados: ${error.message}`);
        }

        totalInserted += chunk.length;
      }

      toast({
        title: "Fêmeas importadas com sucesso!",
        description: `${totalInserted} registro(s) importado(s) para a fazenda ${farmName}`,
      });

      if (warningMessages.length > 0) {
        toast({
          title: "Importação concluída com avisos",
          description: warningMessages.join(' • '),
        });
      }

      setSelectedFile(null);

      if (onImportSuccess) {
        onImportSuccess();
      }

      onClose();
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: error instanceof Error
          ? error.message
          : "Não foi possível processar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Registros Genéticos</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel (.xlsx, .xls) com os dados dos registros genéticos para a fazenda {farmName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As colunas podem estar em qualquer ordem e aceitamos sinônimos conhecidos dos principais PTAs. Garanta apenas que as colunas fixas (Nome, ID CDCB, Data de Nascimento e pedigree) estejam presentes para melhor contexto.
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

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
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
