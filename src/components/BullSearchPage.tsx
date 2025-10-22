import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Search, Upload, Download, Beaker } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { HelpButton } from '@/components/help/HelpButton';
import { HelpHint } from '@/components/help/HelpHint';

import SortableHeader from '@/components/animals/SortableHeader';
import { ANIMAL_METRIC_COLUMNS } from '@/constants/animalMetrics';
import { useAnimalTableSort } from '@/hooks/useAnimalTableSort';
import { useToast } from '@/hooks/use-toast';
import { StagingMigrationButton } from './StagingMigrationButton';
import {
  supabase,
  supabaseAnonKey,
  getImportBullsFunctionUrlCandidates
} from '@/integrations/supabase/client';
interface Bull {
  id: string;
  code: string;
  name: string;
  registration?: string;
  birth_date?: string;
  company?: string;
  sire_naab?: string;
  mgs_naab?: string;
  mmgs_naab?: string;
  sire_name?: string;
  mgs_name?: string;
  mmgs_name?: string;
  // All genetic traits from bulls_denorm
  hhp_dollar?: number;
  tpi?: number;
  nm_dollar?: number;
  cm_dollar?: number;
  fm_dollar?: number;
  gm_dollar?: number;
  f_sav?: number;
  ptam?: number;
  cfp?: number;
  ptaf?: number;
  ptaf_pct?: number;
  ptap?: number;
  ptap_pct?: number;
  pl?: number;
  dpr?: number;
  liv?: number;
  scs?: number;
  mast?: number;
  met?: number;
  rp?: number;
  da?: number;
  ket?: number;
  mf?: number;
  ptat?: number;
  udc?: number;
  flc?: number;
  sce?: number;
  dce?: number;
  ssb?: number;
  dsb?: number;
  h_liv?: number;
  ccr?: number;
  hcr?: number;
  fi?: number;
  bwc?: number;
  sta?: number;
  str?: number;
  dfm?: number;
  rua?: number;
  rls?: number;
  rtp?: number;
  ftl?: number;
  rw?: number;
  rlr?: number;
  fta?: number;
  fls?: number;
  fua?: number;
  ruh?: number;
  ruw?: number;
  ucl?: number;
  udp?: number;
  ftp?: number;
  rfi?: number;
  beta_casein?: string;
  kappa_casein?: string;
  gfi?: number;
  score?: number; // Calculated score
}
interface Farm {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  selected_bulls: number;
}
interface BullSearchPageProps {
  farm: Farm;
  onBack: () => void;
  onBullsSelected?: (selectedBulls: string[]) => void;
  onGoToBotijao?: () => void;
}

const IMPORT_BULLS_UPLOAD_URLS = getImportBullsFunctionUrlCandidates('/upload');
const PRIMARY_IMPORT_BULLS_UPLOAD_URL = IMPORT_BULLS_UPLOAD_URLS[0];

type ImportBullsOperation = 'upload';

const attemptImportBullsFetch = async (
  urls: string[],
  initFactory: () => RequestInit,
  operation: ImportBullsOperation
) => {
  const networkErrors: string[] = [];
  for (const url of urls) {
    let init: RequestInit;
    try {
      init = initFactory();
    } catch (error) {
      console.error(`${operation} init error`, error);
      throw error;
    }

    try {
      const response = await fetch(url, init);
      return { response, url };
    } catch (networkError) {
      const message = networkError instanceof Error ? networkError.message : String(networkError);
      console.error(`${operation} network error`, url, networkError);
      networkErrors.push(`${url} => ${message}`);
    }
  }

  throw new Error(
    networkErrors.length
      ? `Não foi possível conectar às funções de importação (${operation}). ${networkErrors.join(' | ')}`
      : `Nenhuma URL configurada para a função de importação (${operation}).`
  );
};
const BullSearchPage: React.FC<BullSearchPageProps> = ({
  farm,
  onBack,
  onBullsSelected,
  onGoToBotijao
}) => {
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [empresas, setEmpresas] = useState<string[]>(["Todas"]);
  const [weights, setWeights] = useState({
    TPI: 0.3,
    NM_dollar: 0.25,
    HHP_dollar: 0.2,
    PTAM: 0.15,
    CFP: 0.1
  });
  
  // Estados para importação
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  const { toast } = useToast();
  useEffect(() => {
    loadBulls();
  }, []);
  const handleImportUpload = async () => {
    if (!importFile) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo CSV ou XLSX",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const headers = {
        authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      };

      // Se for XLSX, converter para CSV e aplicar mapeamento de legendas
      let fileToUpload = importFile;
      const isXlsx = importFile.name.toLowerCase().endsWith('.xlsx') || importFile.name.toLowerCase().endsWith('.xls');
      
      if (isXlsx) {
        const XLSX = await import('xlsx');
        const { normalizeKey } = await import('@/pages/tools/conversao/utils');
        const { defaultLegendBank } = await import('@/pages/tools/conversao/defaultLegendBank');
        
        // Converter XLSX para objeto de dados
        const buffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length === 0) {
          toast({
            title: "Erro",
            description: "Arquivo XLSX vazio",
            variant: "destructive"
          });
          return;
        }
        
        // Primeira linha são os headers
        const originalHeaders = (jsonData[0] as any[]).map(h => String(h || '').trim());
        const rows = jsonData.slice(1) as any[][];
        
        // Criar mapa de legendas: header normalizado → canonical
        const legendMap = new Map<string, string>();
        defaultLegendBank.forEach(entry => {
          const normalizedAlias = normalizeKey(entry.alias);
          legendMap.set(normalizedAlias, entry.canonical);
        });
        
        // Mapear headers originais para canonizados
        const mappedHeaders = originalHeaders.map(header => {
          const normalized = normalizeKey(header);
          return legendMap.get(normalized) || header;
        });
        
        // Recriar CSV com headers mapeados
        const csvLines = [
          mappedHeaders.join(','),
          ...rows.map(row => 
            row.map(cell => {
              const value = String(cell ?? '').trim();
              // Escapar valores com vírgulas ou aspas
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ];
        
        const csvContent = csvLines.join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        fileToUpload = new File([csvBlob], importFile.name.replace(/\.xlsx?$/i, '.csv'), { type: 'text/csv' });
        
        console.log('📊 Headers mapeados:', { originalHeaders, mappedHeaders });
      }

      const { response: uploadResponse, url: uploadUrl } = await attemptImportBullsFetch(
        IMPORT_BULLS_UPLOAD_URLS,
        () => {
          const uploadForm = new FormData();
          uploadForm.append('file', fileToUpload);
          uploadForm.append('user_id', user.id);
          return {
            method: 'POST',
            headers,
            body: uploadForm,
          };
        },
        'upload'
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload falhou: ${uploadResponse.status} ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      
      // Resultado é apenas staging, não processamento completo
      setImportResult(uploadData);

      if (uploadData.total_rows > 0) {
        toast({
          title: "✅ CSV carregado no staging!",
          description: `${uploadData.total_rows} registros prontos. Clique em "Migrar Touros" para processar.`,
          duration: 5000
        });
      } else {
        toast({
          title: "⚠ Arquivo vazio",
          description: "O CSV não contém registros válidos.",
          variant: "destructive"
        });
      }

      // Recarregar lista de touros
      await loadBulls();

      // Limpar estado de importação após 3 segundos
      setTimeout(() => {
        setShowImportDialog(false);
        setImportFile(null);
        setImportResult(null);
      }, 3000);

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadBullTemplate = () => {
    // Template completo com dados reais de touros para exemplo
    const templateBulls = [{
      code: "11HO15933",
      name: "LADYS-MANOR PK ALTAMONT-ET",
      registration: "HOLUSA000142457321",
      birth_date: "2018-12-15",
      sire_naab: "7HO13386",
      mgs_naab: "11HO11478",
      mmgs_naab: "1HO09918",
      sire_name: "PINE-TREE MONUMENT-ET",
      mgs_name: "SEAGULL-BAY SILVER-ET",
      mmgs_name: "MR LOOKOUT P ENFORCER",
      // PTAs conforme tabela bulls_denorm
      nm_dollar: 1247,
      fm_dollar: 1180,
      gm_dollar: 1089,
      cm_dollar: 1156,
      hhp_dollar: 1098,
      tpi: 2856,
      ptam: 65,
      ptaf: 89,
      ptaf_pct: 0.15,
      ptap: 75,
      ptap_pct: 0.08,
      pl: 6.8,
      liv: 2.1,
      scs: 2.89,
      dpr: 1.8,
      cfp: -0.8,
      ptat: 1.89,
      udc: 1.45,
      flc: 0.78,
      fls: 0.95,
      fua: 1.23,
      ruh: 0.87,
      ruw: 1.12,
      rlr: 0.94,
      rls: 1.08,
      rtp: 0.76,
      str: 1.34,
      dfm: 0.89,
      rua: 1.67,
      ftl: 0.98,
      fta: 1.12,
      ftp: 0.85,
      rw: 1.05,
      ucl: 1.23,
      udp: 1.45,
      rfi: 1.2,
      gfi: -0.3,
      ssb: 108,
      dsb: 106,
      dce: 105,
      sce: 103,
      h_liv: 102,
      ccr: 104,
      hcr: 103,
      fi: 105,
      bwc: 106,
      sta: 108,
      mf: 0.15,
      da: 108,
      rp: 105,
      met: 103,
      mast: 104,
      ket: 102,
      f_sav: 102,
      kappa_casein: "AA",
      beta_casein: "A2A2"
    }, {
      code: "29HO21513",
      name: "PINE-TREE ACHIEVER-ET",
      registration: "HOLUSA000142658974",
      birth_date: "2019-03-20",
      sire_naab: "11HO15933",
      mgs_naab: "7HO13386",
      mmgs_naab: "11HO11478",
      nm_dollar: 1098,
      fm_dollar: 1045,
      gm_dollar: 987,
      cm_dollar: 1023,
      hhp_dollar: 965,
      tpi: 2634,
      ptam: 58,
      ptaf: 76,
      ptaf_pct: 0.12,
      ptap: 68,
      ptap_pct: 0.06,
      pl: 5.9,
      liv: 1.8,
      scs: 2.95,
      dpr: 1.5,
      cfp: -0.6,
      ptat: 1.67,
      udc: 1.28,
      flc: 0.65,
      fls: 0.82,
      fua: 1.05,
      ruh: 0.74,
      ruw: 0.98,
      rlr: 0.81,
      rls: 0.94,
      rtp: 0.63,
      str: 1.18,
      dfm: 0.76,
      rua: 1.42,
      ftl: 0.85,
      fta: 0.98,
      ftp: 0.72,
      rw: 0.91,
      ucl: 1.06,
      udp: 1.28,
      rfi: 1.05,
      gfi: -0.2,
      ssb: 105,
      dsb: 104,
      dce: 103,
      sce: 102,
      h_liv: 101,
      ccr: 103,
      hcr: 102,
      fi: 104,
      bwc: 105,
      sta: 106,
      mf: 0.12,
      da: 105,
      rp: 103,
      met: 102,
      mast: 103,
      ket: 101,
      f_sav: 101,
      kappa_casein: "AB",
      beta_casein: "A1A2"
    }, {
      code: "551HO05064",
      name: "WESTCOAST LAMBORGHINI-ET",
      registration: "HOLUSA000142789632",
      birth_date: "2020-01-10",
      sire_naab: "29HO21513",
      mgs_naab: "11HO15933",
      mmgs_naab: "7HO13386",
      nm_dollar: 1356,
      fm_dollar: 1298,
      gm_dollar: 1234,
      cm_dollar: 1276,
      hhp_dollar: 1187,
      tpi: 3012,
      ptam: 72,
      ptaf: 98,
      ptaf_pct: 0.18,
      ptap: 82,
      ptap_pct: 0.09,
      pl: 7.2,
      liv: 2.3,
      scs: 2.78,
      dpr: 2.1,
      cfp: -0.9,
      ptat: 2.05,
      udc: 1.62,
      flc: 0.89,
      fls: 1.08,
      fua: 1.38,
      ruh: 0.96,
      ruw: 1.25,
      rlr: 1.07,
      rls: 1.21,
      rtp: 0.84,
      str: 1.47,
      dfm: 0.98,
      rua: 1.78,
      ftl: 1.06,
      fta: 1.23,
      ftp: 0.94,
      rw: 1.15,
      ucl: 1.36,
      udp: 1.58,
      rfi: 1.35,
      gfi: -0.4,
      ssb: 112,
      dsb: 110,
      dce: 108,
      sce: 106,
      h_liv: 105,
      ccr: 107,
      hcr: 106,
      fi: 108,
      bwc: 109,
      sta: 112,
      mf: 0.18,
      da: 112,
      rp: 108,
      met: 106,
      mast: 107,
      ket: 105,
      f_sav: 105,
      kappa_casein: "BB",
      beta_casein: "A2A2"
    }];

    // Converter para CSV
    const headers = ["code", "name", "registration", "birth_date", "sire_naab", "mgs_naab", "mmgs_naab", "sire_name", "mgs_name", "mmgs_name", "nm_dollar", "fm_dollar", "gm_dollar", "cm_dollar", "hhp_dollar", "tpi", "ptam", "ptaf", "ptaf_pct", "ptap", "ptap_pct", "pl", "liv", "scs", "dpr", "cfp", "ptat", "udc", "flc", "fls", "fua", "ruh", "ruw", "rlr", "rls", "rtp", "str", "dfm", "rua", "ftl", "fta", "ftp", "rw", "ucl", "udp", "rfi", "gfi", "ssb", "dsb", "dce", "sce", "h_liv", "ccr", "hcr", "fi", "bwc", "sta", "mf", "da", "rp", "met", "mast", "ket", "f_sav", "kappa_casein", "beta_casein"];
    const csvContent = [headers.join(','), ...templateBulls.map(bull => headers.map(header => {
      const value = bull[header as keyof typeof bull];
      // Tratar valores nulos e strings com vírgula
      if (value === undefined || value === null) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(','))].join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_touros_supabase.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Template baixado",
      description: "Template completo de touros para Supabase foi baixado com sucesso."
    });
  };
  const loadBulls = async () => {
    try {
      setLoading(true);
      console.log('🐂 Carregando banco completo de touros...');
      const {
        data,
        error
      } = await supabase.rpc('get_bulls_denorm').order('tpi', {
        ascending: false
      });
      if (error) {
        console.error('Error from RPC get_bulls_denorm:', error);
        throw error;
      }
      console.log(`✅ ${data?.length || 0} touros carregados do banco`);

      // Transform data to match expected format
      const transformedBulls: Bull[] = (data || []).map(bull => ({
        id: bull.id || bull.code,
        code: bull.code || '',
        name: bull.name || '',
        registration: bull.registration,
        birth_date: bull.birth_date,
        company: bull.company,
        sire_naab: bull.sire_naab,
        mgs_naab: bull.mgs_naab,
        mmgs_naab: bull.mmgs_naab,
        sire_name: bull.sire_name,
        mgs_name: bull.mgs_name,
        mmgs_name: bull.mmgs_name,
        hhp_dollar: bull.hhp_dollar,
        tpi: bull.tpi,
        nm_dollar: bull.nm_dollar,
        cm_dollar: bull.cm_dollar,
        fm_dollar: bull.fm_dollar,
        gm_dollar: bull.gm_dollar,
        f_sav: bull.f_sav,
        ptam: bull.ptam,
        cfp: bull.cfp,
        ptaf: bull.ptaf,
        ptaf_pct: bull.ptaf_pct,
        ptap: bull.ptap,
        ptap_pct: bull.ptap_pct,
        pl: bull.pl,
        dpr: bull.dpr,
        liv: bull.liv,
        scs: bull.scs,
        mast: bull.mast,
        met: bull.met,
        rp: bull.rp,
        da: bull.da,
        ket: bull.ket,
        mf: bull.mf,
        ptat: bull.ptat,
        udc: bull.udc,
        flc: bull.flc,
        sce: bull.sce,
        dce: bull.dce,
        ssb: bull.ssb,
        dsb: bull.dsb,
        h_liv: bull.h_liv,
        ccr: bull.ccr,
        hcr: bull.hcr,
        fi: bull.fi,
        bwc: bull.bwc,
        sta: bull.sta,
        str: bull.str,
        dfm: bull.dfm,
        rua: bull.rua,
        rls: bull.rls,
        rtp: bull.rtp,
        ftl: bull.ftl,
        rw: bull.rw,
        rlr: bull.rlr,
        fta: bull.fta,
        fls: bull.fls,
        fua: bull.fua,
        ruh: bull.ruh,
        ruw: bull.ruw,
        ucl: bull.ucl,
        udp: bull.udp,
        ftp: bull.ftp,
        rfi: bull.rfi,
        beta_casein: bull.beta_casein,
        kappa_casein: bull.kappa_casein,
        gfi: bull.gfi
      }));
      setBulls(transformedBulls);

      // Extract unique companies from loaded bulls
      const uniqueCompanies = new Set<string>();
      transformedBulls.forEach(bull => {
        if (bull.company && bull.company.trim()) {
          uniqueCompanies.add(bull.company.trim());
        }
      });
      setEmpresas(["Todas", ...Array.from(uniqueCompanies).sort()]);
    } catch (error) {
      console.error('Error loading bulls:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar banco de touros",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get available birth years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    bulls.forEach(bull => {
      if (bull.birth_date) {
        years.add(new Date(bull.birth_date).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [bulls]);

  // Calculate weighted scores for bulls
  const bullsWithScores = useMemo(() => bulls.map(bull => ({
    ...bull,
    score: (bull.tpi || 0) * weights.TPI + (bull.nm_dollar || 0) * weights.NM_dollar + (bull.hhp_dollar || 0) * weights.HHP_dollar + (bull.ptam || 0) * weights.PTAM + (bull.cfp || 0) * weights.CFP
  })), [bulls, weights]);

  const filteredBulls = useMemo(() => bullsWithScores.filter(bull => {
    const normalizedSearch = searchTerm.toLowerCase();
    const pedigreeCandidates = [
      bull.sire_name,
      bull.mgs_name,
      bull.mmgs_name,
      bull.sire_naab,
      bull.mgs_naab,
      bull.mmgs_naab
    ]
      .filter(Boolean)
      .map(value => value!.toLowerCase());
    const matchesSearch = bull.name.toLowerCase().includes(normalizedSearch) || bull.code.toLowerCase().includes(normalizedSearch) || pedigreeCandidates.some(candidate => candidate.includes(normalizedSearch));
    const matchesCompany = !selectedEmpresa || selectedEmpresa === "todas" || selectedEmpresa === "Todas" || bull.company && bull.company.toLowerCase().includes(selectedEmpresa.toLowerCase());
    const matchesYear = !selectedYear || selectedYear === "all-years" || bull.birth_date && new Date(bull.birth_date).getFullYear().toString() === selectedYear;
    return matchesSearch && matchesCompany && matchesYear;
  }), [bullsWithScores, searchTerm, selectedEmpresa, selectedYear]);

  const getBullSortValue = useCallback((bull: Bull, column: string) => {
    switch (column) {
      case 'code':
        return bull.code;
      case 'name':
        return bull.name;
      case 'registration':
        return bull.registration ?? '';
      case 'sire_naab':
        return bull.sire_naab ?? bull.sire_name ?? '';
      case 'mgs_naab':
        return bull.mgs_naab ?? bull.mgs_name ?? '';
      case 'mmgs_naab':
        return bull.mmgs_naab ?? bull.mmgs_name ?? '';
      case 'birth_date':
        return bull.birth_date ? new Date(bull.birth_date).getTime() : null;
      case 'company':
        return bull.company ?? '';
      case 'score':
        return bull.score ?? null;
      default:
        return (bull as any)[column] ?? '';
    }
  }, []);

  const {
    sortedItems: rankedBulls,
    sortConfig: bullSortConfig,
    requestSort: handleSortBulls
  } = useAnimalTableSort(filteredBulls, getBullSortValue, { column: 'score', direction: 'desc' });
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const formatBullMetricValue = (bull: Bull, key: string): React.ReactNode => {
    const rawValue = (bull as any)[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '-';
    }
    if (key === 'hhp_dollar') {
      const numericValue = Number(rawValue);
      return Number.isNaN(numericValue) ? rawValue : numericValue.toFixed(0);
    }
    return rawValue as React.ReactNode;
  };
  const handleBullToggle = (code: string) => {
    setSelectedBulls(prev => prev.includes(code) ? prev.filter(n => n !== code) : [...prev, code]);
  };
  const handleAddToBotijao = () => {
    if (selectedBulls.length === 0) {
      toast({
        title: "Nenhum touro selecionado",
        description: "Selecione pelo menos um touro para adicionar ao Botijão Virtual.",
        variant: "destructive"
      });
      return;
    }

    // Save selected bulls to localStorage for the Botijão Virtual
    localStorage.setItem(`selected-bulls-${farm.farm_id}`, JSON.stringify(selectedBulls));
    if (onBullsSelected) {
      onBullsSelected(selectedBulls);
    }
    toast({
      title: "Touros selecionados",
      description: `${selectedBulls.length} touro(s) foram enviados para o Botijão Virtual.`
    });

    // Navigate to Botijão Virtual if callback is provided
    if (onGoToBotijao) {
      onGoToBotijao();
    }
  };
  const handleExport = () => {
    if (rankedBulls.length === 0) return;
    
    // Importar XLSX para exportação
    import('xlsx').then(({ utils, writeFile }) => {
      import('@/lib/excel-date-formatter').then(({ autoFormatDateColumns }) => {
        const headers = ['NAAB', 'Nome', 'Registro', 'Empresa', 'Data Nasc.', 'Pai NAAB', 'Avô Materno', 'Score', 'HHP$', 'TPI', 'NM$', 'PTAM', 'CFP'];
        
        const dataRows = rankedBulls.map(bull => [
          bull.code,
          bull.name,
          bull.registration || '-',
          bull.company || '-',
          bull.birth_date || '', // Manter como string ISO, será convertido depois
          bull.sire_naab || '-',
          bull.mgs_naab || '-',
          bull.score?.toFixed(2) || '-',
          bull.hhp_dollar || '-',
          bull.tpi || '-',
          bull.nm_dollar || '-',
          bull.ptam || '-',
          bull.cfp || '-'
        ]);

        // Criar worksheet
        const worksheet = utils.aoa_to_sheet([headers, ...dataRows]);
        
        // Aplicar formatação automática de datas
        autoFormatDateColumns(worksheet, headers);
        
        // Criar workbook e exportar
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Touros');
        
        const fileName = `touros_${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(workbook, fileName);
        
        toast({
          title: "Exportação concluída",
          description: "Arquivo XLSX foi baixado com sucesso!"
        });
      });
    });
  };
  return <div className="min-h-screen bg-background">
      <HelpButton context="bulls" />
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" onClick={onBack} className="mr-4 bg-slate-200 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{farm.farm_name} - Busca de Touros</h1>
            <HelpHint content="Importe touros, ajuste pesos e selecione candidatos ideais para o rebanho" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline">{rankedBulls.length} touros disponíveis</Badge>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Weight Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Configuração de Pesos - Índice Personalizado</CardTitle>
                <HelpHint content="Ajuste a importância de cada PTA para montar um score customizado" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {Object.entries(weights).map(([key, value]) => <div key={key} className="space-y-2">
                    <label className="text-sm font-medium">{key}</label>
                    <Input type="number" step="0.05" min="0" max="1" value={value} onChange={e => setWeights(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value) || 0
                }))} />
                  </div>)}
              </div>
              <div className="text-sm text-muted-foreground">
                Soma de pesos: <b>{totalWeight.toFixed(2)}</b> (recomendado 1.00 ± 0.2)
              </div>
              <div className="text-sm text-muted-foreground">
                O score usa z-score por traço para evitar escalas diferentes e aplica penalização para SCS (menor é melhor).
              </div>
              <div className="mt-2">
                <HelpHint content="Cada slider representa o peso do PTA na nota final. Garanta que a soma fique próxima de 100%" />
              </div>
            </CardContent>
          </Card>

          {/* Search and Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar touros por NAAB, nome ou parentesco" className="pl-10" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              </div>
              <HelpHint content="Busque por NAAB, nome, registro ou pedigree dos touros" side="bottom" />
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as empresas</SelectItem>
                  {empresas.slice(1).map(empresa => <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>)}
                </SelectContent>
              </Select>
              <HelpHint content="Filtre por central genética para comparar catálogos específicos" side="bottom" />
            </div>

            <div className="flex items-center gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ano nascimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-years">Todos os anos</SelectItem>
                  {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                </SelectContent>
              </Select>
              <HelpHint content="Limite os touros por ano de nascimento para focar em gerações específicas" side="bottom" />
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <StagingMigrationButton />
                <HelpHint content="Processa o staging e move os touros importados para a base oficial" side="bottom" />
              </div>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-slate-950">
                    <Upload size={16} className="mr-2" />
                    Importar Touros
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Importar Touros</DialogTitle>
                    <DialogDescription>
                      📥 Carregue seu arquivo CSV ou XLSX de touros. Os registros serão inseridos no staging.
                      Use o botão "Migrar Touros" para processar para a tabela bulls.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Arquivo CSV ou XLSX</label>
                      <Input 
                        type="file" 
                        accept=".csv,.xlsx,.xls"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        disabled={importing}
                      />
                      <p className="text-xs text-muted-foreground">
                        Máximo: 10MB. Formato: UTF-8 com cabeçalho.
                      </p>
                    </div>

                    {importResult && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 border border-green-200 dark:border-green-800">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          ✅ CSV Carregado no Staging
                        </p>
                        <div className="text-xs text-green-700 dark:text-green-300 mt-2 space-y-1">
                          <p>📋 {importResult.total_rows || 0} registros carregados</p>
                          <p className="text-blue-600 dark:text-blue-400 font-medium mt-3">
                            👉 Use o botão "Migrar Touros" para processar
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowImportDialog(false);
                        setImportFile(null);
                        setImportResult(null);
                      }}
                      disabled={importing}
                    >
                      {importResult ? 'Fechar' : 'Cancelar'}
                    </Button>
                    
                    {!importResult && (
                      <Button
                        onClick={handleImportUpload}
                        disabled={!importFile || importing}
                      >
                        {importing ? 'Processando...' : 'Importar Touros'}
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <HelpHint content="Importe planilhas CSV/XLSX com touros. Utilize o template para evitar erros" side="bottom" />

              <Button variant="outline" onClick={downloadBullTemplate} title="Baixar template completo de touros para Supabase" className="bg-gray-200 hover:bg-gray-100">
                <Download size={16} className="mr-2" />
                Template Touros
              </Button>
              <HelpHint content="Baixe o modelo com cabeçalhos obrigatórios e exemplos preenchidos" side="bottom" />

              <Button onClick={handleExport}>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
              <HelpHint content="Exporte a lista atual com scores e PTAs em CSV" side="bottom" />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Selecionados: {selectedBulls.length}
              </Badge>
              <HelpHint content="Marque touros para enviar ao Botijão ou gerar relatórios customizados" side="bottom" />
            </div>

            {selectedBulls.length > 0 && <Button onClick={handleAddToBotijao} className="bg-primary hover:bg-primary/90">
                <Beaker size={16} className="mr-2" />
                Enviar para Botijão Virtual
              </Button>}
            {selectedBulls.length > 0 && <HelpHint content="Envie os touros selecionados para planejar doses no Botijão Virtual" side="bottom" />}
          </div>

          {/* Bulls Table */}
          <Card>
            <ScrollArea className="h-[500px] w-full">
              <div className="min-w-[2100px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1 bg-foreground text-background text-xs">✓</th>
                      <SortableHeader column="code" label="NAAB" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="name" label="Nome" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="registration" label="Registro" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="sire_naab" label="Pai" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="mgs_naab" label="Avô Materno" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="mmgs_naab" label="Bisavô Materno" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="birth_date" label="Data de Nascimento" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="company" label="Empresa" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="score" label="Score" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      {ANIMAL_METRIC_COLUMNS.map(column => (
                        <SortableHeader key={column.key} column={column.key} label={column.label} sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                      {rankedBulls.map((bull, index) => (
                        <tr key={bull.code} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                          <td className="px-2 py-1 text-center">
                            <input type="checkbox" checked={selectedBulls.includes(bull.code)} onChange={() => handleBullToggle(bull.code)} />
                          </td>
                          <td className="px-2 py-1 font-mono text-xs">{bull.code}</td>
                          <td className="px-2 py-1 font-medium text-xs">{bull.name}</td>
                          <td className="px-2 py-1 font-mono text-xs">{bull.registration}</td>
                          <td className="px-2 py-1 text-xs">{bull.sire_name || bull.sire_naab || '-'}</td>
                          <td className="px-2 py-1 text-xs">{bull.mgs_name || bull.mgs_naab || '-'}</td>
                          <td className="px-2 py-1 text-xs">{bull.mmgs_name || bull.mmgs_naab || '-'}</td>
                          <td className="px-2 py-1 text-xs">{bull.birth_date}</td>
                          <td className="px-2 py-1 text-xs">{bull.company || '-'}</td>
                          <td className="px-2 py-1 text-center text-xs">{bull.score !== undefined ? bull.score.toFixed(0) : '-'}</td>
                          {ANIMAL_METRIC_COLUMNS.map(column => (
                            <td key={column.key} className="px-2 py-1 text-center text-xs">
                              {formatBullMetricValue(bull, column.key)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
            <div className="px-4 py-3 border-t bg-muted/40 flex items-center gap-2">
              <HelpHint content="Ordene qualquer coluna para priorizar touros conforme seu critério" />
            </div>
          </Card>

          {rankedBulls.length === 0 && <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-semibold">Nenhum touro encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros de pesquisa ou importe um novo banco de touros.
                  </p>
                </div>
              </CardContent>
            </Card>}
        </div>
      </div>
    </div>;
};
export default BullSearchPage;