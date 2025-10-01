import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  usePedigreeStore,
  PTA_DEFINITIONS,
  formatPTAValue,
  predictFromPedigree,
  validateNaabs,
  getBullFromCache,
  Bull,
  BatchInput,
  BatchResult
} from '@/hooks/usePedigreeStore';
import { Calculator, Upload, Download } from 'lucide-react';
import { read, utils, writeFileXLSX } from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

type BatchUploadMode = 'standard' | 'sms';

const INTERNAL_HEADER_LABELS: Record<keyof BatchInput, string> = {
  idFazenda: 'ID_Fazenda',
  nome: 'Nome',
  dataNascimento: 'Data_de_Nascimento',
  naabPai: 'naab_pai',
  naabAvoMaterno: 'naab_avo_materno',
  naabBisavoMaterno: 'naab_bisavo_materno'
};

const BATCH_PREVIEW_COLUMNS: Array<{ key: keyof BatchInput; label: string }> = [
  { key: 'idFazenda', label: INTERNAL_HEADER_LABELS.idFazenda },
  { key: 'nome', label: INTERNAL_HEADER_LABELS.nome },
  { key: 'dataNascimento', label: INTERNAL_HEADER_LABELS.dataNascimento },
  { key: 'naabPai', label: INTERNAL_HEADER_LABELS.naabPai },
  { key: 'naabAvoMaterno', label: INTERNAL_HEADER_LABELS.naabAvoMaterno },
  { key: 'naabBisavoMaterno', label: INTERNAL_HEADER_LABELS.naabBisavoMaterno }
];

const REQUIRED_COLUMNS: Record<BatchUploadMode, Array<keyof BatchInput>> = {
  standard: ['idFazenda', 'nome', 'dataNascimento', 'naabPai', 'naabAvoMaterno', 'naabBisavoMaterno'],
  sms: ['idFazenda', 'dataNascimento', 'naabPai', 'naabAvoMaterno', 'naabBisavoMaterno']
};

const COMMON_HEADER_ALIASES: Array<[string, keyof BatchInput]> = [
  ['ID_Fazenda', 'idFazenda'],
  ['id_fazenda', 'idFazenda'],
  ['id fazenda', 'idFazenda'],
  ['idfazenda', 'idFazenda'],
  ['Nome', 'nome'],
  ['nome', 'nome'],
  ['nome animal', 'nome'],
  ['Animal', 'nome'],
  ['Data_de_Nascimento', 'dataNascimento'],
  ['data nascimento', 'dataNascimento'],
  ['data nasc', 'dataNascimento'],
  ['dt nasc', 'dataNascimento'],
  ['dt nascimento', 'dataNascimento'],
  ['naab_pai', 'naabPai'],
  ['naab pai', 'naabPai'],
  ['naab do pai', 'naabPai'],
  ['naab_avo_materno', 'naabAvoMaterno'],
  ['naab avo materno', 'naabAvoMaterno'],
  ['naab do avo materno', 'naabAvoMaterno'],
  ['naab_bisavo_materno', 'naabBisavoMaterno'],
  ['naab bisavo materno', 'naabBisavoMaterno'],
  ['naab do bisavo materno', 'naabBisavoMaterno']
];

const STANDARD_HEADER_ALIASES: Array<[string, keyof BatchInput]> = [
  ['ID Fazenda', 'idFazenda'],
  ['Nome Animal', 'nome'],
  ['Data Nascimento', 'dataNascimento'],
  ['Data Nasc.', 'dataNascimento'],
  ['NAAB Pai', 'naabPai'],
  ['NAAB Avô Materno', 'naabAvoMaterno'],
  ['NAAB Bisavô Materno', 'naabBisavoMaterno']
];

const SMS_HEADER_ALIASES: Array<[string, keyof BatchInput]> = [
  ['Nº VACA', 'idFazenda'],
  ['No Vaca', 'idFazenda'],
  ['Numero Vaca', 'idFazenda'],
  ['Num Vaca', 'idFazenda'],
  ['N Vaca', 'idFazenda'],
  ['PAI', 'naabPai'],
  ['Avo Materno', 'naabAvoMaterno'],
  ['AVÔ MATERNO', 'naabAvoMaterno'],
  ['AVO MAT', 'naabAvoMaterno'],
  ['BISAVÔ MATERNO', 'naabBisavoMaterno'],
  ['BISAVO MATERNO', 'naabBisavoMaterno'],
  ['BIS AVO MATERNO', 'naabBisavoMaterno'],
  ['DATA NASCIMENTO', 'dataNascimento'],
  ['DATA NASC', 'dataNascimento'],
  ['DT NASC', 'dataNascimento']
];

const ACCEPTED_FILE_TYPES =
  '.csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

const sanitizeHeader = (header: string) =>
  header
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const buildHeaderResolver = (mode: BatchUploadMode) => {
  const aliasMap = new Map<string, keyof BatchInput>();
  const register = (alias: string, key: keyof BatchInput) => {
    const sanitized = sanitizeHeader(alias);
    if (!sanitized) return;
    aliasMap.set(sanitized, key);
    aliasMap.set(sanitized.replace(/\s+/g, ''), key);
  };

  [...COMMON_HEADER_ALIASES, ...(mode === 'sms' ? SMS_HEADER_ALIASES : STANDARD_HEADER_ALIASES)].forEach(
    ([alias, key]) => register(alias, key)
  );

  // Always allow canonical keys regardless of mode
  (Object.keys(INTERNAL_HEADER_LABELS) as Array<keyof BatchInput>).forEach((key) => register(key, key));

  return (header: string): keyof BatchInput | null => {
    const sanitized = sanitizeHeader(header);
    if (!sanitized) return null;
    return aliasMap.get(sanitized) ?? aliasMap.get(sanitized.replace(/\s+/g, '')) ?? null;
  };
};

const normalizeString = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value.toString();
  return String(value).trim();
};

const toIsoDate = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number' && !isNaN(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const stringValue = String(value).trim();
  if (!stringValue) return '';

  const isoMatch = stringValue.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const isoDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString().split('T')[0];
    }
  }

  const brMatch = stringValue.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})$/);
  if (brMatch) {
    let [, day, month, year] = brMatch;
    if (year.length === 2) {
      year = Number(year) > 50 ? `19${year}` : `20${year}`;
    }
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  const parsedDate = new Date(stringValue);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }

  return '';
};

const parseWorksheet = (worksheet: any, mode: BatchUploadMode): BatchInput[] => {
  const rows = utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
  if (!rows.length) {
    throw new Error('O arquivo está vazio.');
  }

  const [rawHeaders, ...dataRows] = rows;
  const headers = rawHeaders.map((header) => normalizeString(header));
  const resolveHeader = buildHeaderResolver(mode);
  const headerKeys = headers.map((header) => resolveHeader(header));

  const requiredColumns = REQUIRED_COLUMNS[mode];
  const missingColumns = requiredColumns.filter((required) => !headerKeys.includes(required));

  if (missingColumns.length > 0) {
    const missingLabels = missingColumns.map((column) => INTERNAL_HEADER_LABELS[column]);
    throw new Error(`Colunas obrigatórias ausentes: ${missingLabels.join(', ')}.`);
  }

  const parsedRows: BatchInput[] = [];

  dataRows.forEach((row) => {
    if (!Array.isArray(row)) return;

    const normalizedRow: BatchInput = {
      idFazenda: '',
      nome: '',
      dataNascimento: '',
      naabPai: '',
      naabAvoMaterno: '',
      naabBisavoMaterno: ''
    };

    headerKeys.forEach((key, index) => {
      if (!key) return;
      const cellValue = row[index];

      if (key === 'dataNascimento') {
        normalizedRow[key] = toIsoDate(cellValue);
      } else {
        const normalizedValue = normalizeString(cellValue);
        if (key === 'naabPai' || key === 'naabAvoMaterno' || key === 'naabBisavoMaterno') {
          normalizedRow[key] = normalizedValue.toUpperCase();
        } else {
          normalizedRow[key] = normalizedValue;
        }
      }
    });

    const hasValues = Object.values(normalizedRow).some((value) => value !== '');
    if (hasValues) {
      parsedRows.push(normalizedRow);
    }
  });

  if (!parsedRows.length) {
    throw new Error('Nenhuma linha válida encontrada após a leitura do arquivo.');
  }

  return parsedRows;
};

const parseBatchFileForMode = async (file: File, mode: BatchUploadMode): Promise<BatchInput[]> => {
  const data = await file.arrayBuffer();
  const workbook = read(data, { type: 'array', cellDates: true, codepage: 65001 });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('Não foi possível localizar a primeira aba da planilha.');
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error('Não foi possível ler os dados da planilha selecionada.');
  }

  return parseWorksheet(worksheet, mode);
};

type BatchResultColumn = {
  header: string;
  render: (result: BatchResult) => React.ReactNode;
  exportValue: (result: BatchResult) => string;
};

const BATCH_RESULT_BASE_COLUMNS: BatchResultColumn[] = [
  {
    header: 'ID_Fazenda',
    render: (result) => result.idFazenda || '—',
    exportValue: (result) => result.idFazenda || '—'
  },
  {
    header: 'Nome',
    render: (result) => result.nome || '—',
    exportValue: (result) => result.nome || '—'
  },
  {
    header: 'Data_de_Nascimento',
    render: (result) => result.dataNascimento || '—',
    exportValue: (result) => result.dataNascimento || '—'
  },
  {
    header: 'naab_pai',
    render: (result) => result.naabPai || '—',
    exportValue: (result) => result.naabPai || '—'
  },
  {
    header: 'naab_avo_materno',
    render: (result) => result.naabAvoMaterno || '—',
    exportValue: (result) => result.naabAvoMaterno || '—'
  },
  {
    header: 'naab_bisavo_materno',
    render: (result) => result.naabBisavoMaterno || '—',
    exportValue: (result) => result.naabBisavoMaterno || '—'
  },
  {
    header: 'Status',
    render: (result) => (
      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
        {result.status === 'success' ? 'Válido' : 'Erro'}
      </Badge>
    ),
    exportValue: (result) => (result.status === 'success' ? 'Válido' : 'Erro')
  },
  {
    header: 'Erros',
    render: (result) => (result.errors?.length ? result.errors.join('; ') : '—'),
    exportValue: (result) => (result.errors?.length ? result.errors.join('; ') : '—')
  }
];

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
      .rpc('get_bulls_denorm')
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
          hhp_dollar: data.hhp_dollar ?? null,
          tpi: data.tpi ?? null,
          nm_dollar: data.nm_dollar ?? null,
          cm_dollar: data.cm_dollar ?? null,
          fm_dollar: data.fm_dollar ?? null,
          gm_dollar: data.gm_dollar ?? null,
          f_sav: data.f_sav ?? null,
          
          // Produção de Leite
          milk: data.ptam ?? null, // PTAM = Milk in Supabase
          fat: data.ptaf ?? null,
          protein: data.ptap ?? null,
          ptam: data.ptam ?? null,
          cfp: data.cfp ?? null,
          ptaf: data.ptaf ?? null,
          ptaf_pct: data.ptaf_pct ?? null,
          ptap: data.ptap ?? null,
          ptap_pct: data.ptap_pct ?? null,
          pl: data.pl ?? null,
          
          // Fertilidade
          dpr: data.dpr ?? null,
          
          // Saúde e Longevidade
          liv: data.liv ?? null,
          scs: data.scs ?? null,
          mast: data.mast ?? null,
          met: data.met ?? null,
          rp: data.rp ?? null,
          da: data.da ?? null,
          ket: data.ket ?? null,
          mf: data.mf ?? null,
          
          // Conformação
          ptat: data.ptat ?? null,
          udc: data.udc ?? null,
          flc: data.flc ?? null,
          sce: data.sce ?? null,
          dce: data.dce ?? null,
          ssb: data.ssb ?? null,
          dsb: data.dsb ?? null,
          h_liv: data.h_liv ?? null,
          
          // Reprodução
          ccr: data.ccr ?? null,
          hcr: data.hcr ?? null,
          
          // Outras características
          fi: data.fi ?? null,
          bwc: data.bwc ?? null,
          
          // Conformação Detalhada
          sta: data.sta ?? null,
          str: data.str ?? null,
          dfm: data.dfm ?? null,
          rua: data.rua ?? null,
          rls: data.rls ?? null,
          rtp: data.rtp ?? null,
          ftl: data.ftl ?? null,
          rw: data.rw ?? null,
          rlr: data.rlr ?? null,
          fta: data.fta ?? null,
          fls: data.fls ?? null,
          fua: data.fua ?? null,
          ruh: data.ruh ?? null,
          ruw: data.ruw ?? null,
          ucl: data.ucl ?? null,
          udp: data.udp ?? null,
          ftp: data.ftp ?? null,
          
          // Eficiência Alimentar
          rfi: data.rfi ?? null,
          gfi: data.gfi ?? null
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
  const [batchUploadMode, setBatchUploadMode] = useState<BatchUploadMode>('standard');
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [parsedBatchData, setParsedBatchData] = useState<BatchInput[]>([]);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setBatchResults([]);
    setParsedBatchData([]);
    setPreviewError(null);
    setBatchFile(file);

    // Allow uploading the same file again by clearing the input value
    if (event.target) {
      event.target.value = '';
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const parseFile = async () => {
      if (!batchFile) {
        if (!isCancelled) {
          setParsedBatchData([]);
          setPreviewError(null);
          setIsPreviewLoading(false);
        }
        return;
      }

      setIsPreviewLoading(true);
      setPreviewError(null);
      setBatchResults([]);

      try {
        const parsed = await parseBatchFileForMode(batchFile, batchUploadMode);
        if (!isCancelled) {
          setParsedBatchData(parsed);
        }
      } catch (error) {
        if (!isCancelled) {
          setParsedBatchData([]);
          setPreviewError(
            error instanceof Error
              ? error.message
              : 'Erro ao ler o arquivo. Verifique o formato e tente novamente.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsPreviewLoading(false);
        }
      }
    };

    parseFile();

    return () => {
      isCancelled = true;
    };
  }, [batchFile, batchUploadMode]);

  const processBatchFile = async () => {
    if (!parsedBatchData.length) {
      toast({
        title: 'Nenhum dado encontrado',
        description: 'Faça o upload de um arquivo válido antes de processar.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log(`🔄 Processando ${parsedBatchData.length} linhas do arquivo em lote (${batchUploadMode}).`);
      const results: BatchResult[] = [];

      for (let i = 0; i < parsedBatchData.length; i++) {
        const rawInput = parsedBatchData[i];
        const input: BatchInput = {
          idFazenda: normalizeString(rawInput.idFazenda),
          nome: normalizeString(rawInput.nome),
          dataNascimento: rawInput.dataNascimento,
          naabPai: normalizeString(rawInput.naabPai).toUpperCase(),
          naabAvoMaterno: normalizeString(rawInput.naabAvoMaterno).toUpperCase(),
          naabBisavoMaterno: normalizeString(rawInput.naabBisavoMaterno).toUpperCase(),
        };

        console.log(`📋 Processando linha ${i + 1}: ${input.idFazenda || input.nome || 'Sem identificação'}`);

        const pedigreeData = {
          sireNaab: input.naabPai,
          mgsNaab: input.naabAvoMaterno,
          mmgsNaab: input.naabBisavoMaterno,
        };

        const errors = validateNaabs(pedigreeData);

        if (errors.length === 0) {
          let sire = getBullFromCache(input.naabPai, bullsCache);
          let mgs = getBullFromCache(input.naabAvoMaterno, bullsCache);
          let mmgs = getBullFromCache(input.naabBisavoMaterno, bullsCache);

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
            console.log(`✅ Predição gerada para ${input.idFazenda || input.nome || 'Linha sem identificação'}`);

            results.push({
              ...input,
              status: 'success',
              predictedPTAs,
            });
          } else {
            console.log(`❌ Pai não encontrado para ${input.idFazenda || input.nome || 'Linha sem identificação'}`);
            results.push({
              ...input,
              status: 'error',
              errors: [`Pai com NAAB ${input.naabPai || 'não informado'} não encontrado no banco de dados`],
            });
          }
        } else {
          console.log(`❌ Erros de validação para ${input.idFazenda || input.nome || 'Linha sem identificação'}: ${errors.join(', ')}`);
          results.push({
            ...input,
            status: 'error',
            errors,
          });
        }
      }

      setBatchResults(results);

      toast({
        title: 'Processamento Concluído!',
        description: `${results.length} linhas processadas.`,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo em lote:', error);
      toast({
        title: 'Erro no Processamento',
        description: 'Erro ao processar o arquivo. Verifique o formato.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportBatchResults = () => {
    if (batchResults.length === 0) return;

    const headers = [
      ...BATCH_RESULT_BASE_COLUMNS.map((column) => column.header),
      ...PTA_DEFINITIONS.map(({ label }) => label)
    ];

    const rows = batchResults.map((result) => ([
      ...BATCH_RESULT_BASE_COLUMNS.map((column) => column.exportValue(result)),
      ...PTA_DEFINITIONS.map(({ key }) => formatPTAValue(key, result.predictedPTAs?.[key] ?? null))
    ]));

    const worksheet = utils.aoa_to_sheet([
      headers,
      ...rows
    ]);
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

    return PTA_DEFINITIONS.map(({ label, key }) => ({
      label,
      key,
      sire: predictionResult.sire?.ptas?.[key] ?? null,
      mgs: predictionResult.mgs?.ptas?.[key] ?? null,
      mmgs: predictionResult.mmgs?.ptas?.[key] ?? null,
      daughter: predictionResult.predictedPTAs?.[key] ?? null
    }));
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Tabs
                  value={batchUploadMode}
                  onValueChange={(value) => setBatchUploadMode(value as BatchUploadMode)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="standard">Modelo Padrão</TabsTrigger>
                    <TabsTrigger value="sms">Padrão SMS</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="batch-file">Arquivo (.csv, .xlsx, .xls)</Label>
                    <Input id="batch-file" type="file" accept={ACCEPTED_FILE_TYPES} onChange={handleFileUpload} />
                  </div>

                  {batchUploadMode === 'standard' ? (
                    <p className="text-sm text-muted-foreground">
                      Envie .csv/.xlsx/.xls com colunas: ID_Fazenda, Nome, Data_de_Nascimento, naab_pai, naab_avo_materno,
                      naab_bisavo_materno.
                    </p>
                  ) : (
                    <Alert className="border-primary/40 bg-primary/5">
                      <AlertTitle className="flex items-center gap-2">
                        <span role="img" aria-hidden="true">📘</span>
                        Como preparar seu arquivo SMS antes do upload:
                      </AlertTitle>
                      <AlertDescription>
                        <ol className="list-decimal space-y-1 pl-4">
                          <li>Abra a planilha SMS original.</li>
                          <li>
                            <strong>Apague a linha 1</strong> (cabeçalho antigo).
                          </li>
                          <li>
                            <strong>Apague as colunas B, D, G até AQ</strong>.
                          </li>
                          <li>
                            Certifique-se de manter apenas: Nº VACA, PAI, AVÔ MATERNO, BISAVÔ MATERNO, DATA NASCIMENTO.
                          </li>
                          <li>
                            Para animais sem NAAB do avô materno, preencha com <strong>007HO00001</strong>.
                          </li>
                          <li>
                            Para animais sem NAAB do bisavô materno, preencha com <strong>007HO00002</strong>.
                          </li>
                          <li>
                            Salve o arquivo em <code>.csv</code>, <code>.xlsx</code> ou <code>.xls (Excel 5.0/95)</code>.
                          </li>
                          <li>Faça o upload aqui.</li>
                        </ol>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {previewError && (
                <Alert variant="destructive">
                  <AlertTitle>Erro ao ler o arquivo</AlertTitle>
                  <AlertDescription>{previewError}</AlertDescription>
                </Alert>
              )}

              {isPreviewLoading && (
                <p className="text-sm text-muted-foreground">Carregando pré-visualização...</p>
              )}

              {!isPreviewLoading && parsedBatchData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="font-semibold">Pré-visualização normalizada</h3>
                    <span className="text-sm text-muted-foreground">
                      Mostrando {Math.min(10, parsedBatchData.length)} de {parsedBatchData.length} linhas
                    </span>
                  </div>
                  <div className="max-h-64 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {BATCH_PREVIEW_COLUMNS.map(({ key, label }) => (
                            <TableHead key={key}>{label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedBatchData.slice(0, 10).map((row, index) => (
                          <TableRow key={`${row.idFazenda || row.nome || 'linha'}-${index}`}>
                            {BATCH_PREVIEW_COLUMNS.map(({ key, label }) => (
                              <TableCell key={label}>{row[key] || '—'}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  onClick={processBatchFile}
                  disabled={
                    isProcessing ||
                    isPreviewLoading ||
                    !!previewError ||
                    parsedBatchData.length === 0
                  }
                  className="w-full sm:flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processando...' : 'Processar Arquivo'}
                </Button>

                {batchResults.length > 0 && (
                  <Button onClick={exportBatchResults} variant="outline" className="w-full sm:w-auto">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Resultados
                  </Button>
                )}
              </div>

              {batchResults.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Resultados ({batchResults.length} animais)</h3>
                  <div className="max-h-96 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {BATCH_RESULT_BASE_COLUMNS.map((column) => (
                            <TableHead key={column.header}>{column.header}</TableHead>
                          ))}
                          {PTA_DEFINITIONS.map(({ label }) => (
                            <TableHead key={label}>{label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchResults.slice(0, 10).map((result, index) => (
                          <TableRow key={index}>
                            {BATCH_RESULT_BASE_COLUMNS.map((column) => (
                              <TableCell key={column.header}>{column.render(result)}</TableCell>
                            ))}
                            {PTA_DEFINITIONS.map(({ key }) => (
                              <TableCell key={key}>{formatPTAValue(key, result.predictedPTAs?.[key] ?? null)}</TableCell>
                            ))}
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
