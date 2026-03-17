import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Search, Upload, Download, Beaker, Filter, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { HelpButton } from '@/components/help/HelpButton';
import { HelpHint } from '@/components/help/HelpHint';
import { formatPtaValue } from '@/utils/ptaFormat';

import SortableHeader from '@/components/animals/SortableHeader';
import { ANIMAL_METRIC_COLUMNS } from '@/constants/animalMetrics';
import { useToast } from '@/hooks/use-toast';
import { StagingMigrationButton } from './StagingMigrationButton';
import { normalizeNaabCode } from '@/utils/bullNormalization';
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
  score?: number;
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

const IMPORT_BULLS_UPLOAD_URLS = getImportBullsFunctionUrlCandidates().map(u => u + '/upload');

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

// ── Known brands (main companies) ──
const MAIN_BRANDS = ['Select Sires', 'Accelerated', 'ABS', 'Alta', 'Genex', 'Semex', 'ST'];
const DEFAULT_BRANDS = new Set(['Select Sires', 'Accelerated']);
const PAGE_SIZE = 50;

const BullSearchPage: React.FC<BullSearchPageProps> = ({
  farm,
  onBack,
  onBullsSelected,
  onGoToBotijao
}) => {
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBulls, setSelectedBulls] = useState<string[]>([]);

  // Brand filter
  const [brandCounts, setBrandCounts] = useState<Record<string, number>>({});
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set(DEFAULT_BRANDS));
  const [showFilters, setShowFilters] = useState(false);
  const [brandsOpen, setBrandsOpen] = useState(true);

  // Pagination & count
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  // Sort (server-side)
  const [sortColumn, setSortColumn] = useState('hhp_dollar');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Weights for score
  const [weights, setWeights] = useState({
    TPI: 0.3,
    NM_dollar: 0.25,
    HHP_dollar: 0.2,
    PTAM: 0.15,
    CFP: 0.1
  });

  // Import states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const { toast } = useToast();

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ── Load brand counts on mount ──
  useEffect(() => {
    loadBrandCounts();
  }, []);

  // ── Load bulls when filters/page/sort change ──
  useEffect(() => {
    loadBulls();
  }, [selectedBrands, debouncedSearch, page, sortColumn, sortDirection]);

  const loadBrandCounts = async () => {
    try {
      // Load counts for each known brand
      const counts: Record<string, number> = {};
      const promises = MAIN_BRANDS.map(async (brand) => {
        const { count } = await supabase
          .from('bulls_denorm')
          .select('id', { count: 'exact', head: true })
          .eq('company', brand);
        counts[brand] = count || 0;
      });
      // Also get total
      const totalPromise = supabase
        .from('bulls_denorm')
        .select('id', { count: 'exact', head: true });
      
      const [_, totalResult] = await Promise.all([
        Promise.all(promises),
        totalPromise
      ]);

      // "Outros" = total - sum of known brands
      const knownSum = Object.values(counts).reduce((s, c) => s + c, 0);
      counts['Outros'] = (totalResult.count || 0) - knownSum;
      
      setBrandCounts(counts);
    } catch (e) {
      console.error('Error loading brand counts:', e);
    }
  };

  const loadBulls = async () => {
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from('bulls_denorm')
        .select('*', { count: 'exact' });

      // ── Brand filter ──
      if (selectedBrands.size > 0) {
        const specificBrands = Array.from(selectedBrands).filter(b => b !== 'Outros');
        const includeOther = selectedBrands.has('Outros');

        if (specificBrands.length > 0 && includeOther) {
          // Brands in list OR company is null OR company not in main brands
          const brandList = specificBrands.map(b => `"${b}"`).join(',');
          query = query.or(`company.in.(${specificBrands.join(',')}),company.is.null`);
        } else if (includeOther) {
          // Only "Outros": null or not in MAIN_BRANDS
          query = query.or(`company.is.null,company.not.in.(${MAIN_BRANDS.join(',')})`);
        } else if (specificBrands.length > 0) {
          query = query.in('company', specificBrands);
        }
      }

      // ── Search filter ──
      if (debouncedSearch.trim()) {
        const term = debouncedSearch.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
        query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`);
      }

      // ── Sort ──
      const validColumns = [
        'id', 'code', 'name', 'registration', 'birth_date', 'company',
        'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
        'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct',
        'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
        'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr',
        'fi', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp', 'ftl', 'rw',
        'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp', 'ftp', 'rfi', 'gfi'
      ];
      const serverSort = sortColumn !== 'score' && validColumns.includes(sortColumn);
      if (serverSort) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', nullsFirst: false });
      } else {
        query = query.order('hhp_dollar', { ascending: false, nullsFirst: false });
      }

      // ── Pagination ──
      const from = page * PAGE_SIZE;
      query = query.range(from, from + PAGE_SIZE - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching bulls_denorm:', error);
        throw error;
      }

      const transformedBulls: Bull[] = (data || []).map((bull: any) => ({
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
      setTotalCount(count || 0);
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

  // ── Score calculation ──
  const bullsWithScores = useMemo(() => bulls.map(bull => ({
    ...bull,
    score: (bull.tpi || 0) * weights.TPI + (bull.nm_dollar || 0) * weights.NM_dollar + (bull.hhp_dollar || 0) * weights.HHP_dollar + (bull.ptam || 0) * weights.PTAM + (bull.cfp || 0) * weights.CFP
  })), [bulls, weights]);

  // ── Client-side sort for score column only ──
  const rankedBulls = useMemo(() => {
    if (sortColumn === 'score') {
      return [...bullsWithScores].sort((a, b) =>
        sortDirection === 'desc' ? (b.score || 0) - (a.score || 0) : (a.score || 0) - (b.score || 0)
      );
    }
    return bullsWithScores;
  }, [bullsWithScores, sortColumn, sortDirection]);

  // ── Sort handler ──
  const handleSortBulls = useCallback((column: string) => {
    if (column === sortColumn) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setPage(0);
  }, [sortColumn]);

  const bullSortConfig = { column: sortColumn, direction: sortDirection };

  // ── Brand toggle ──
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
    setPage(0);
  };

  const selectAllBrands = () => {
    setSelectedBrands(new Set([...MAIN_BRANDS, 'Outros']));
    setPage(0);
  };

  const clearAllBrands = () => {
    setSelectedBrands(new Set());
    setPage(0);
  };

  // ── Pagination ──
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const activeFilterCount = selectedBrands.size + (debouncedSearch ? 1 : 0);

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const formatBullMetricValue = (bull: Bull, key: string): React.ReactNode => {
    const rawValue = (bull as any)[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') return '-';
    if (key === 'hhp_dollar') return formatPtaValue('HHP$', rawValue);
    return rawValue as React.ReactNode;
  };

  const handleBullToggle = (code: string) => {
    setSelectedBulls(prev => prev.includes(code) ? prev.filter(n => n !== code) : [...prev, code]);
  };

  const handleAddToBotijao = () => {
    if (selectedBulls.length === 0) {
      toast({ title: "Nenhum touro selecionado", description: "Selecione pelo menos um touro para adicionar ao Botijão Virtual.", variant: "destructive" });
      return;
    }
    localStorage.setItem(`selected-bulls-${farm.farm_id}`, JSON.stringify(selectedBulls));
    if (onBullsSelected) onBullsSelected(selectedBulls);
    toast({ title: "Touros selecionados", description: `${selectedBulls.length} touro(s) foram enviados para o Botijão Virtual.` });
    if (onGoToBotijao) onGoToBotijao();
  };

  // ── Import handler ──
  const handleImportUpload = async () => {
    if (!importFile) {
      toast({ title: "Erro", description: "Selecione um arquivo CSV ou XLSX", variant: "destructive" });
      return;
    }
    setImporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const headers = { authorization: `Bearer ${accessToken}`, apikey: supabaseAnonKey };

      let fileToUpload = importFile;
      const isXlsx = /\.(xlsx|xls|xlsm)$/i.test(importFile.name);
      if (isXlsx) {
        const XLSX = await import('xlsx');
        const { normalizeKey } = await import('@/pages/tools/conversao/utils');
        const { defaultLegendBank } = await import('@/pages/tools/conversao/defaultLegendBank');
        const buffer = await importFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        if (jsonData.length === 0) { toast({ title: "Erro", description: "Arquivo XLSX vazio", variant: "destructive" }); return; }
        const originalHeaders = (jsonData[0] as any[]).map(h => String(h || '').trim());
        const rows = jsonData.slice(1) as any[][];
        const legendMap = new Map<string, string>();
        defaultLegendBank.forEach(entry => { legendMap.set(normalizeKey(entry.alias), entry.canonical); });
        const mappedHeaders = originalHeaders.map(header => legendMap.get(normalizeKey(header)) || header);
        const csvLines = [
          mappedHeaders.join(','),
          ...rows.map(row => row.map(cell => {
            const value = String(cell ?? '').trim();
            if (value.includes(',') || value.includes('"') || value.includes('\n')) return `"${value.replace(/"/g, '""')}"`;
            return value;
          }).join(','))
        ];
        const csvBlob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        fileToUpload = new File([csvBlob], importFile.name.replace(/\.(xlsx|xls|xlsm)$/i, '.csv'), { type: 'text/csv' });
      }

      const { response: uploadResponse } = await attemptImportBullsFetch(
        IMPORT_BULLS_UPLOAD_URLS,
        () => { const f = new FormData(); f.append('file', fileToUpload); f.append('user_id', user.id); return { method: 'POST', headers, body: f }; },
        'upload'
      );
      if (!uploadResponse.ok) { const errorText = await uploadResponse.text(); throw new Error(`Upload falhou: ${uploadResponse.status} ${errorText}`); }
      const uploadData = await uploadResponse.json();
      setImportResult(uploadData);
      if (uploadData.total_rows > 0) {
        toast({ title: "✅ CSV carregado no staging!", description: `${uploadData.total_rows} registros prontos. Clique em "Migrar Touros" para processar.`, duration: 5000 });
      } else {
        toast({ title: "⚠ Arquivo vazio", description: "O CSV não contém registros válidos.", variant: "destructive" });
      }
      await loadBulls();
      setTimeout(() => { setShowImportDialog(false); setImportFile(null); setImportResult(null); }, 3000);
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: "Erro na importação", description: error instanceof Error ? error.message : "Erro desconhecido", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const downloadBullTemplate = () => {
    const templateBulls = [{
      code: "11HO15933", name: "LADYS-MANOR PK ALTAMONT-ET", registration: "HOLUSA000142457321",
      birth_date: "2018-12-15", sire_naab: "7HO13386", mgs_naab: "11HO11478", mmgs_naab: "1HO09918",
      sire_name: "PINE-TREE MONUMENT-ET", mgs_name: "SEAGULL-BAY SILVER-ET", mmgs_name: "MR LOOKOUT P ENFORCER",
      nm_dollar: 1247, fm_dollar: 1180, gm_dollar: 1089, cm_dollar: 1156, hhp_dollar: 1098, tpi: 2856,
      ptam: 65, ptaf: 89, ptaf_pct: 0.15, ptap: 75, ptap_pct: 0.08, pl: 6.8, liv: 2.1, scs: 2.89,
      dpr: 1.8, cfp: -0.8, ptat: 1.89, udc: 1.45, flc: 0.78, kappa_casein: "AA", beta_casein: "A2A2"
    }];
    const csvHeaders = ["code", "name", "registration", "birth_date", "sire_naab", "mgs_naab", "mmgs_naab",
      "nm_dollar", "fm_dollar", "gm_dollar", "cm_dollar", "hhp_dollar", "tpi", "ptam", "ptaf", "ptaf_pct",
      "ptap", "ptap_pct", "pl", "liv", "scs", "dpr", "cfp", "ptat", "udc", "flc", "kappa_casein", "beta_casein"];
    const csvContent = [csvHeaders.join(','), ...templateBulls.map(bull =>
      csvHeaders.map(h => { const v = (bull as any)[h]; return v === undefined ? '' : typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(',')
    )].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'template_touros_supabase.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Template baixado", description: "Template completo de touros foi baixado com sucesso." });
  };

  const handleExport = () => {
    if (rankedBulls.length === 0) return;
    import('xlsx').then(({ utils, writeFile }) => {
      import('@/lib/excel-date-formatter').then(({ autoFormatDateColumns }) => {
        const headers = ['NAAB', 'Nome', 'Registro', 'Empresa', 'Data Nasc.', 'Pai NAAB', 'Avô Materno', 'Score', 'HHP$', 'TPI', 'NM$', 'PTAM', 'CFP'];
        const dataRows = rankedBulls.map(bull => [
          bull.code, bull.name, bull.registration || '-', bull.company || '-',
          bull.birth_date || '', bull.sire_naab || '-', bull.mgs_naab || '-',
          bull.score?.toFixed(2) || '-', formatPtaValue('HHP$', bull.hhp_dollar),
          formatPtaValue('TPI', bull.tpi), formatPtaValue('NM$', bull.nm_dollar),
          formatPtaValue('PTAM', bull.ptam), formatPtaValue('CFP', bull.cfp)
        ]);
        const worksheet = utils.aoa_to_sheet([headers, ...dataRows]);
        autoFormatDateColumns(worksheet, headers);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Touros');
        writeFile(workbook, `touros_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast({ title: "Exportação concluída", description: "Arquivo XLSX foi baixado com sucesso!" });
      });
    });
  };

  // ── Averages row ──
  const averages = useMemo(() => {
    if (rankedBulls.length === 0) return null;
    const numericKeys = ['tpi', 'nm_dollar', 'cm_dollar', 'hhp_dollar', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct', 'pl', 'dpr', 'scs'];
    const avgs: Record<string, number | null> = {};
    numericKeys.forEach(key => {
      const values = rankedBulls.map(b => (b as any)[key]).filter((v: any) => v != null && v !== '') as number[];
      avgs[key] = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
    });
    return avgs;
  }, [rankedBulls]);

  return (
    <div className="min-h-screen bg-background">
      <HelpButton context="bulls" />

      {/* ── Header Bar ── */}
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" onClick={onBack} className="mr-4 bg-slate-200 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{farm.farm_name} - Busca de Touros</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="secondary">{totalCount.toLocaleString()} touros</Badge>
            {selectedBulls.length > 0 && (
              <Badge variant="outline">Selecionados: {selectedBulls.length}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">

          {/* ── Filters Bar ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filters Toggle */}
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter size={16} className="text-red-500" />
              <span className="font-bold uppercase tracking-wide text-sm">Filtros</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Search */}
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por NAAB ou nome..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <StagingMigrationButton />
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload size={14} className="mr-1" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Importar Touros</DialogTitle>
                    <DialogDescription>
                      📥 Carregue seu arquivo CSV ou XLSX de touros.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input type="file" accept=".csv,.xlsx,.xls,.xlsm" onChange={(e) => setImportFile(e.target.files?.[0] || null)} disabled={importing} />
                    {importResult && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 border border-green-200">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">✅ {importResult.total_rows || 0} registros carregados no staging</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportFile(null); setImportResult(null); }} disabled={importing}>Cancelar</Button>
                    {!importResult && <Button onClick={handleImportUpload} disabled={!importFile || importing}>{importing ? 'Processando...' : 'Importar'}</Button>}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={downloadBullTemplate}>
                <Download size={14} className="mr-1" />
                Template
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download size={14} className="mr-1" />
                Exportar
              </Button>
              {selectedBulls.length > 0 && (
                <Button size="sm" onClick={handleAddToBotijao} className="bg-primary hover:bg-primary/90">
                  <Beaker size={14} className="mr-1" />
                  Enviar para Botijão
                </Button>
              )}
            </div>
          </div>

          {/* ── Filter Panel (Brands) ── */}
          {showFilters && (
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Brands Section */}
                  <Collapsible open={brandsOpen} onOpenChange={setBrandsOpen}>
                    <div className="flex items-center justify-between mb-3">
                      <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80">
                        <span className="font-bold text-red-600 text-sm uppercase tracking-wide">Empresas</span>
                        <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-xs">
                          {selectedBrands.size}
                        </Badge>
                        {brandsOpen ? <Minus size={14} /> : <Plus size={14} />}
                      </CollapsibleTrigger>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={selectAllBrands}>Todas</Button>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={clearAllBrands}>Limpar</Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="space-y-2">
                        {[...MAIN_BRANDS, 'Outros'].map(brand => (
                          <label key={brand} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors">
                            <Checkbox
                              checked={selectedBrands.has(brand)}
                              onCheckedChange={() => toggleBrand(brand)}
                              className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                            />
                            <span className="text-sm flex-1">{brand}</span>
                            {brandCounts[brand] != null && (
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {brandCounts[brand].toLocaleString()}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Weights Section */}
                  <div>
                    <span className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-3 block">Pesos do Score</span>
                    <div className="space-y-2">
                      {Object.entries(weights).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <label className="text-xs font-medium w-20">{key}</label>
                          <Input
                            type="number" step="0.05" min="0" max="1" value={value}
                            onChange={e => setWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                            className="h-7 text-xs"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-1">Soma: {totalWeight.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Results Count ── */}
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Resultados: {totalCount.toLocaleString()} Touros
            </h2>
            <span className="text-xs text-muted-foreground">
              {selectedBrands.size > 0 ? `Filtrado por ${selectedBrands.size} empresa(s)` : 'Todas as empresas'}
            </span>
          </div>

          {/* ── Bulls Table ── */}
          <Card>
            <ScrollArea className="h-[500px] w-full">
              <div className="min-w-[2100px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1 bg-foreground text-background text-xs">✓</th>
                      <SortableHeader column="code" label="NAAB" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="name" label="Nome" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="company" label="Empresa" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      <SortableHeader column="score" label="Score" sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      {ANIMAL_METRIC_COLUMNS.map(column => (
                        <SortableHeader key={column.key} column={column.key} label={column.label} sortConfig={bullSortConfig} onSort={handleSortBulls} className="px-2 py-1 bg-foreground text-background text-xs" />
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5 + ANIMAL_METRIC_COLUMNS.length} className="text-center py-12 text-muted-foreground">
                          Carregando touros...
                        </td>
                      </tr>
                    ) : rankedBulls.length === 0 ? (
                      <tr>
                        <td colSpan={5 + ANIMAL_METRIC_COLUMNS.length} className="text-center py-12 text-muted-foreground">
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          Nenhum touro encontrado com os filtros atuais
                        </td>
                      </tr>
                    ) : (
                      <>
                        {rankedBulls.map((bull, index) => (
                          <tr key={bull.id} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                            <td className="px-2 py-1 text-center">
                              <input type="checkbox" checked={selectedBulls.includes(bull.code)} onChange={() => handleBullToggle(bull.code)} />
                            </td>
                            <td className="px-2 py-1 font-mono text-xs font-bold">{bull.code}</td>
                            <td className="px-2 py-1 text-xs">
                              <div className="font-medium">{bull.name}</div>
                              {(bull.sire_naab || bull.mgs_naab) && (
                                <div className="text-[10px] text-muted-foreground">
                                  {[bull.sire_name || bull.sire_naab, bull.mgs_name || bull.mgs_naab, bull.mmgs_name || bull.mmgs_naab].filter(Boolean).join(' x ')}
                                </div>
                              )}
                            </td>
                            <td className="px-2 py-1 text-xs">{bull.company || '-'}</td>
                            <td className="px-2 py-1 text-center text-xs font-medium">{bull.score !== undefined ? bull.score.toFixed(0) : '-'}</td>
                            {ANIMAL_METRIC_COLUMNS.map(column => (
                              <td key={column.key} className="px-2 py-1 text-center text-xs">
                                {formatBullMetricValue(bull, column.key)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {/* Averages Row */}
                        {averages && (
                          <tr className="bg-muted font-bold border-t-2 border-foreground sticky bottom-0">
                            <td className="px-2 py-1.5"></td>
                            <td colSpan={2} className="px-2 py-1.5 text-xs">Médias da Página:</td>
                            <td className="px-2 py-1.5"></td>
                            <td className="px-2 py-1.5 text-center text-xs">
                              {bullsWithScores.length > 0
                                ? (bullsWithScores.reduce((s, b) => s + (b.score || 0), 0) / bullsWithScores.length).toFixed(0)
                                : '-'}
                            </td>
                            {ANIMAL_METRIC_COLUMNS.map(column => (
                              <td key={column.key} className="px-2 py-1.5 text-center text-xs">
                                {averages[column.key] != null ? averages[column.key]!.toFixed(column.key.includes('pct') ? 2 : 0) : '-'}
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </ScrollArea>

            {/* ── Pagination ── */}
            <div className="px-4 py-3 border-t bg-muted/40 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {totalCount > 0
                  ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} de ${totalCount.toLocaleString()}`
                  : '0 resultados'}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" disabled={page === 0}
                  onClick={() => setPage(0)}
                  className="h-7 px-2 text-xs"
                >
                  1
                </Button>
                <Button
                  variant="outline" size="icon" className="h-7 w-7" disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-xs font-medium px-2 tabular-nums">
                  Pág. {page + 1} / {totalPages || 1}
                </span>
                <Button
                  variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
                <Button
                  variant="outline" size="sm" disabled={page >= totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                  className="h-7 px-2 text-xs"
                >
                  {totalPages || 1}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BullSearchPage;
