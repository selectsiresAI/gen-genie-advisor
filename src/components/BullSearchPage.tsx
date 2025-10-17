import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Search, Upload, Download, Beaker } from "lucide-react";
import { TutorialButtons } from "@/features/tutorial/TutorialButtons";
import SortableHeader from '@/components/animals/SortableHeader';
import { ANIMAL_METRIC_COLUMNS } from '@/constants/animalMetrics';
import { useAnimalTableSort } from '@/hooks/useAnimalTableSort';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { processNormalizedRowsInBatchesMultiColumn } from '@/utils/importProcessing';
import type { NormalizedRow } from '@/utils/importProcessing';
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
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadBulls();
  }, []);
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
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const generateImportBatchId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return `import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    };

    let importBatchId: string | null = null;
    let importSummary: { processed: number; total: number; valid: number; invalid: number } | null = null;

    try {
      setLoading(true);
      toast({
        title: "Upload iniciado",
        description: "Processando arquivo de touros..."
      });

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        throw authError;
      }
      const userId = authData?.user?.id;
      if (!userId) {
        throw new Error("Usuário não autenticado.");
      }

      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        toast({
          title: "Erro no arquivo",
          description: "Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados.",
          variant: "destructive"
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        return row;
      });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const normalizedRows: NormalizedRow[] = [];
      importBatchId = generateImportBatchId();
      const startedAt = new Date().toISOString();

      const normalizeString = (value: any) => {
        if (value === undefined || value === null) return null;
        const str = String(value).trim();
        return str.length > 0 ? str : null;
      };

      const extractPedigreeNames = (row: Record<string, any>) => {
        const rawPedigree = normalizeString(row.pedigree || row.Pedigre || row.Pedigree);
        const pedigreeParts = rawPedigree
          ? rawPedigree
              .split(/[xX/\\>-]/)
              .map(part => part.trim())
              .filter(Boolean)
          : [];

        const getCandidate = (...candidates: (string | null | undefined)[]) => {
          for (const candidate of candidates) {
            const normalized = normalizeString(candidate);
            if (normalized) {
              return normalized;
            }
          }
          return null;
        };

        const sireName = getCandidate(
          row.sire_name,
          row['sire_name'],
          row['Sire Name'],
          row['SireName'],
          row['Nome Pai'],
          row['Pai'],
          pedigreeParts[0]
        );

        const mgsName = getCandidate(
          row.mgs_name,
          row['mgs_name'],
          row['Maternal Grandsire'],
          row['Avô Materno'],
          row['Avo Materno'],
          row['MaternalGrandSire'],
          pedigreeParts[1]
        );

        const mmgsName = getCandidate(
          row.mmgs_name,
          row['mmgs_name'],
          row['Maternal Great Grandsire'],
          row['Bisavô Materno'],
          row['Bisavo Materno'],
          row['MaternalGreatGrandSire'],
          pedigreeParts[2]
        );

        return {
          sireName,
          mgsName,
          mmgsName
        };
      };

      for (const [index, row] of rows.entries()) {
        try {
          const { sireName, mgsName, mmgsName } = extractPedigreeNames(row);

          const resolvedCode = normalizeString(
            row.code || row.NAAB || row.Code || row.naab || row['NAAB Code'] || row['Código'] || row['codigo']
          );
          const resolvedSireNaab = normalizeString(row.sire_naab || row.sire || row.Sire || row['Sire NAAB']);
          const resolvedMgsNaab = normalizeString(row.mgs_naab || row.mgs || row.MGS || row['MGS NAAB']);
          const resolvedMmgsNaab = normalizeString(row.mmgs_naab || row.mmgs || row.MMGS || row['MMGS NAAB']);

          const normalizedRow: NormalizedRow = {
            import_batch_id: importBatchId,
            uploader_user_id: userId,
            row_number: index + 1,
            original_row: row,
            sire_name: sireName,
            mgs_name: mgsName,
            mmgs_name: mmgsName
          };
          if (resolvedCode) normalizedRow.naab = resolvedCode;
          if (resolvedSireNaab) normalizedRow.sire_naab = resolvedSireNaab;
          if (resolvedMgsNaab) normalizedRow.mgs_naab = resolvedMgsNaab;
          if (resolvedMmgsNaab) normalizedRow.mmgs_naab = resolvedMmgsNaab;
          normalizedRows.push(normalizedRow);

          const bullData: any = {
            code: resolvedCode || row.code || row.NAAB || row.Code,
            name: row.name || row.Nome || row.Name,
            registration: row.registration || row.Registro || row.Registration || null,
            birth_date: row.birth_date || row['Data de Nascimento'] || row.BirthDate || null,
            company: row.company || row.Empresa || row.Company || null,
            sire_naab: resolvedSireNaab,
            mgs_naab: resolvedMgsNaab,
            mmgs_naab: resolvedMmgsNaab,
            sire_name: sireName,
            mgs_name: mgsName,
            mmgs_name: mmgsName,
            beta_casein: row.beta_casein || row['Beta-Caseina'] || row.BetaCasein || null,
            kappa_casein: row.kappa_casein || row['Kappa-Caseina'] || row.KappaCasein || null,
            hhp_dollar: parseFloat(row.hhp_dollar || row['HHP$®'] || row.HHP) || null,
            tpi: parseFloat(row.tpi || row.TPI) || null,
            nm_dollar: parseFloat(row.nm_dollar || row['NM$'] || row.NM) || null,
            cm_dollar: parseFloat(row.cm_dollar || row['CM$'] || row.CM) || null,
            fm_dollar: parseFloat(row.fm_dollar || row['FM$'] || row.FM) || null,
            gm_dollar: parseFloat(row.gm_dollar || row['GM$'] || row.GM) || null,
            f_sav: parseFloat(row.f_sav || row['F SAV'] || row.FSAV) || null,
            ptam: parseFloat(row.ptam || row.PTAM) || null,
            cfp: parseFloat(row.cfp || row.CFP) || null,
            ptaf: parseFloat(row.ptaf || row.PTAF) || null,
            ptaf_pct: parseFloat(row.ptaf_pct || row['PTAF%'] || row.PTAF_PCT) || null,
            ptap: parseFloat(row.ptap || row.PTAP) || null,
            ptap_pct: parseFloat(row.ptap_pct || row['PTAP%'] || row.PTAP_PCT) || null,
            pl: parseFloat(row.pl || row.PL) || null,
            dpr: parseFloat(row.dpr || row.DPR) || null,
            liv: parseFloat(row.liv || row.LIV) || null,
            scs: parseFloat(row.scs || row.SCS) || null,
            mast: parseFloat(row.mast || row.MAST) || null,
            met: parseFloat(row.met || row.MET) || null,
            rp: parseFloat(row.rp || row.RP) || null,
            da: parseFloat(row.da || row.DA) || null,
            ket: parseFloat(row.ket || row.KET) || null,
            mf: parseFloat(row.mf || row.MF) || null,
            ptat: parseFloat(row.ptat || row.PTAT) || null,
            udc: parseFloat(row.udc || row.UDC) || null,
            flc: parseFloat(row.flc || row.FLC) || null,
            sce: parseFloat(row.sce || row.SCE) || null,
            dce: parseFloat(row.dce || row.DCE) || null,
            ssb: parseFloat(row.ssb || row.SSB) || null,
            dsb: parseFloat(row.dsb || row.DSB) || null,
            h_liv: parseFloat(row.h_liv || row['H LIV'] || row.HLIV) || null,
            ccr: parseFloat(row.ccr || row.CCR) || null,
            hcr: parseFloat(row.hcr || row.HCR) || null,
            fi: parseFloat(row.fi || row.FI) || null,
            bwc: parseFloat(row.bwc || row.BWC) || null,
            sta: parseFloat(row.sta || row.STA) || null,
            str: parseFloat(row.str || row.STR) || null,
            dfm: parseFloat(row.dfm || row.DFM) || null,
            rua: parseFloat(row.rua || row.RUA) || null,
            rls: parseFloat(row.rls || row.RLS) || null,
            rtp: parseFloat(row.rtp || row.RTP) || null,
            ftl: parseFloat(row.ftl || row.FTL) || null,
            rw: parseFloat(row.rw || row.RW) || null,
            rlr: parseFloat(row.rlr || row.RLR) || null,
            fta: parseFloat(row.fta || row.FTA) || null,
            fls: parseFloat(row.fls || row.FLS) || null,
            fua: parseFloat(row.fua || row.FUA) || null,
            ruh: parseFloat(row.ruh || row.RUH) || null,
            ruw: parseFloat(row.ruw || row.RUW) || null,
            ucl: parseFloat(row.ucl || row.UCL) || null,
            udp: parseFloat(row.udp || row.UDP) || null,
            ftp: parseFloat(row.ftp || row.FTP) || null,
            rfi: parseFloat(row.rfi || row.RFI) || null,
            gfi: parseFloat(row.gfi || row.GFI) || null
          };

          if (row.id && typeof row.id === 'string' && row.id.trim() !== '') {
            bullData.id = row.id.trim();
          } else {
            bullData.id = null;
          }

          if (!bullData.code) {
            errors.push(`Linha ${index + 2} ignorada: código (NAAB) não encontrado`);
            errorCount++;
            continue;
          }

          const { error } = await supabase.from('bulls').upsert(bullData, {
            onConflict: 'code',
            ignoreDuplicates: false
          });
          if (error) {
            console.error('Error inserting bull:', error);
            errors.push(`Erro no touro ${bullData.code}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (rowError) {
          console.error('Error processing row:', rowError);
          errors.push(`Erro na linha ${index + 2}: ${rowError instanceof Error ? rowError.message : rowError}`);
          errorCount++;
        }
      }

      if (normalizedRows.length > 0 && importBatchId) {
        importSummary = await processNormalizedRowsInBatchesMultiColumn(supabase, normalizedRows, {
          lookupChunkSize: 200,
          writeBatchSize: 100,
          progressCallback: (processed, total) => {
            console.debug(`Resolved ${processed}/${total} NAABs during import batch ${importBatchId}`);
          }
        });

        const { error: logError } = await supabase.from('bulls_import_log').insert({
          import_batch_id: importBatchId,
          uploader_user_id: userId,
          total_rows: importSummary.total,
          valid_rows: importSummary.valid,
          invalid_rows: importSummary.invalid,
          started_at: startedAt,
          committed_at: new Date().toISOString(),
          meta: {
            file_name: file.name,
            success_count: successCount,
            error_count: errorCount
          }
        });
        if (logError) {
          throw logError;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import concluído",
          description: `${successCount} touros importados com sucesso${errorCount > 0 ? `. ${errorCount} erros encontrados.` : '.'}`
        });

        await loadBulls();
      }

      if (errors.length > 0 && errors.length <= 5) {
        toast({
          title: "Erros encontrados",
          description: errors.slice(0, 3).join('; '),
          variant: "destructive"
        });
      } else if (errors.length > 5) {
        toast({
          title: `Múltiplos erros (${errors.length})`,
          description: "Verifique o formato do arquivo CSV",
          variant: "destructive"
        });
      }

      if (importSummary) {
        toast({
          title: "Validação de NAABs concluída",
          description: `${importSummary.valid} registro(s) válido(s) e ${importSummary.invalid} registro(s) com pendências.`,
          variant: importSummary.invalid > 0 ? "destructive" : "default"
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: "Falha ao processar o arquivo CSV",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };
  const handleExport = () => {
    if (rankedBulls.length === 0) return;
    const csvData = rankedBulls.map(bull => ({
      NAAB: bull.code,
      Nome: bull.name,
      'Data Nascimento': bull.birth_date || '',
      'HHP$': bull.hhp_dollar || 0,
      TPI: bull.tpi || 0,
      'NM$': bull.nm_dollar || 0,
      'CM$': bull.cm_dollar || 0,
      'FM$': bull.fm_dollar || 0,
      'GM$': bull.gm_dollar || 0,
      Score: bull.score?.toFixed(0) || 0
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0]);
    const csvContent = [headers.join(','), ...csvData.map(row => Object.values(row).join(','))].join('\n');

    // Download file
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banco-touros-${farm.farm_name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV foi baixado com sucesso!"
    });
  };
  return <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button variant="ghost" onClick={onBack} className="mr-4 bg-slate-200 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold">{farm.farm_name} - Busca de Touros</h1>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline">{rankedBulls.length} touros disponíveis</Badge>
            <TutorialButtons slug="touros" />
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Weight Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Pesos - Índice Personalizado</CardTitle>
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
            </CardContent>
          </Card>

          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar touros por NAAB, nome ou parentesco" className="pl-10" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            </div>
            
            <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as empresas</SelectItem>
                {empresas.slice(1).map(empresa => <SelectItem key={empresa} value={empresa}>{empresa}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ano nascimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-years">Todos os anos</SelectItem>
                {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <label className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span className="text-slate-950">
                    <Upload size={16} className="mr-2" />
                    Importar CSV
                  </span>
                </Button>
                <input type="file" accept=".csv" onChange={handleUpload} className="hidden" />
              </label>

              <Button variant="outline" onClick={downloadBullTemplate} title="Baixar template completo de touros para Supabase" className="bg-gray-200 hover:bg-gray-100">
                <Download size={16} className="mr-2" />
                Template Touros
              </Button>
              
              <Button onClick={handleExport}>
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
            
            <Badge variant="secondary">
              Selecionados: {selectedBulls.length}
            </Badge>
            
            {selectedBulls.length > 0 && <Button onClick={handleAddToBotijao} className="bg-primary hover:bg-primary/90">
                <Beaker size={16} className="mr-2" />
                Enviar para Botijão Virtual
              </Button>}
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