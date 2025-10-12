import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableCell, TableBody, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Calculator, ArrowLeft, Users, Target, Database, FileUp, Search, Plus, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { read, utils, writeFileXLSX } from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useHerdStore } from '@/hooks/useHerdStore';
import { TutorialButtons } from "@/features/tutorial/TutorialButtons";

// Colunas específicas para Nexus 1
const NEXUS1_COLUMNS = ['ID Fazenda', 'Nome', 'HHP$®', 'TPI', 'NM$', 'CM$', 'FM$', 'GM$', 'F SAV', 'PTAM', 'CFP', 'PTAF', 'PTAF%', 'PTAP', 'PTAP%', 'PL', 'DPR', 'LIV', 'SCS', 'MAST', 'MET', 'RP', 'DA', 'KET', 'MF', 'PTAT', 'UDC', 'FLC', 'SCE', 'DCE', 'SSB', 'DSB', 'H LIV', 'CCR', 'HCR', 'FI', 'GL', 'EFC', 'BWC', 'STA', 'STR', 'DFM', 'RUA', 'RLS', 'RTP', 'FTL', 'RW', 'RLR', 'FTA', 'FLS', 'FUA', 'RUH', 'RUW', 'UCL', 'UDP', 'FTP', 'RFI'];

// PTAs que devem ser calculados (excluindo colunas de identificação)
const PTA_COLUMNS = NEXUS1_COLUMNS.slice(2); // Remove 'ID Fazenda' e 'Nome'

interface Female {
  [key: string]: any;
}
interface Bull {
  [key: string]: any;
}
interface PredictionResult {
  female: Female;
  bull: Bull;
  predictions: Record<string, number>;
  bullNumber: number; // 1, 2, ou 3
}
interface Nexus1GenomicPredictionProps {
  onBack: () => void;
}
const Nexus1GenomicPrediction: React.FC<Nexus1GenomicPredictionProps> = ({
  onBack
}) => {
  const {
    toast
  } = useToast();
  const currentFarmId = useHerdStore(state => state.selectedHerdId);

  // Estados principais
  const [currentStep, setCurrentStep] = useState(1);
  const [dataSource, setDataSource] = useState<'upload' | 'database'>('upload');
  const [bullSource, setBullSource] = useState<'upload' | 'search'>('upload');
  const [females, setFemales] = useState<Female[]>([]);
  const [bulls, setBulls] = useState<Bull[]>([]);
  const [selectedBulls, setSelectedBulls] = useState<number>(1); // 1, 2 ou 3 touros
  const [selectedBullIds, setSelectedBullIds] = useState<string[]>(['']);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loadingDatabase, setLoadingDatabase] = useState(false);
  const [lastFarmId, setLastFarmId] = useState<string | null>(null);

  // Estados para busca de touros
  const [naabSearch, setNaabSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingBulls, setSearchingBulls] = useState(false);
  const [selectedBullsFromSearch, setSelectedBullsFromSearch] = useState<any[]>([]);

  // Filtros para fêmeas do banco
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(['donor', 'inter', 'recipient']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['bezerra', 'novilha', 'primipara', 'secundipara', 'multipara']);

  // Função para calcular predições genômicas
  // Fórmula: ((PTA_Fêmea + PTA_Touro) / 2) × 0,93
  // 
  // VALIDAÇÃO DOS DADOS DE EXEMPLO:
  // Fêmea 10: HHP=500, TPI=2100, NM=350, PTAM=1200, PTAF=40
  // Fêmea 11: HHP=300, TPI=1800, NM=250, PTAM=800, PTAF=20
  // Touro A: HHP=800, TPI=2500, NM=500, PTAM=2000, PTAF=60
  // Touro B: HHP=200, TPI=1900, NM=300, PTAM=1500, PTAF=30
  // 
  // Resultados esperados (2 casas decimais):
  // F10 × A: HHP 604,50 · TPI 2139,00 · NM 395,25 · PTAM 1488,00 · PTAF 46,50
  // F10 × B: HHP 325,50 · TPI 1860,00 · NM 302,25 · PTAM 1255,50 · PTAF 32,55
  // F11 × A: HHP 511,50 · TPI 1999,50 · NM 348,75 · PTAM 1302,00 · PTAF 37,20
  // F11 × B: HHP 232,50 · TPI 1720,50 · NM 255,75 · PTAM 1069,50 · PTAF 23,25
  const calculateGenomicPrediction = (femalePTA: number, bullPTA: number): number => {
    const result = (femalePTA + bullPTA) / 2 * 0.93;
    console.log(`Predição: Fêmea PTA=${femalePTA}, Touro PTA=${bullPTA}, Resultado=${result.toFixed(2)}`);
    return result;
  };

  // Parse de arquivos
  const parseFile = useCallback(async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          let data: any[];
          if (file.name.toLowerCase().endsWith('.xlsx')) {
            const wb = read(new Uint8Array(e.target?.result as ArrayBuffer), {
              type: 'array'
            });
            const ws = wb.Sheets[wb.SheetNames[0]];
            data = utils.sheet_to_json(ws);
          } else if (file.name.toLowerCase().endsWith('.csv')) {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const obj: any = {};
              headers.forEach((h, i) => obj[h] = values[i] || '');
              return obj;
            });
          } else {
            reject(new Error('Formato não suportado. Use .xlsx ou .csv'));
            return;
          }
          resolve(data);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo'));
        }
      };
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }, []);

  // Upload de fêmeas
  const handleFemaleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseFile(file);
      setFemales(data);
      toast({
        title: 'Fêmeas carregadas',
        description: `${data.length} fêmeas carregadas com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
    e.target.value = '';
  };

  // Upload de touros
  const handleBullUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await parseFile(file);
      setBulls(data);
      toast({
        title: 'Touros carregados',
        description: `${data.length} touros carregados com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
    e.target.value = '';
  };

  // Calcular predições (atualizado para trabalhar com os dois tipos de touros)
  const calculatePredictions = () => {
    if (females.length === 0) {
      toast({
        title: 'Dados insuficientes',
        description: 'Carregue fêmeas antes de calcular',
        variant: 'destructive'
      });
      return;
    }
    let bullsToUse: Bull[] = [];
    if (bullSource === 'upload') {
      if (bulls.length === 0) {
        toast({
          title: 'Dados insuficientes',
          description: 'Carregue touros antes de calcular',
          variant: 'destructive'
        });
        return;
      }
      const validBullIds = selectedBullIds.filter(id => id.trim() !== '');
      if (validBullIds.length === 0) {
        toast({
          title: 'Touros não selecionados',
          description: 'Selecione pelo menos um touro para acasalamento',
          variant: 'destructive'
        });
        return;
      }
      bullsToUse = bulls;
    } else {
      if (selectedBullsFromSearch.length === 0) {
        toast({
          title: 'Touros não selecionados',
          description: 'Selecione pelo menos um touro para acasalamento',
          variant: 'destructive'
        });
        return;
      }
      bullsToUse = convertSelectedBulls();
    }
    setIsCalculating(true);
    try {
      const results: PredictionResult[] = [];
      females.forEach(female => {
        if (bullSource === 'upload') {
          const validBullIds = selectedBullIds.filter(id => id.trim() !== '');
          validBullIds.forEach((bullId, index) => {
            const bull = bullsToUse.find(b => b['ID Fazenda'] === bullId || b['Nome'] === bullId);
            if (!bull) {
              console.warn(`Touro ${bullId} não encontrado`);
              return;
            }
            const predictions: Record<string, number> = {};

            // Calcular predições para cada PTA
            PTA_COLUMNS.forEach(pta => {
              const femalePTA = parseFloat(female[pta]) || 0;
              const bullPTA = parseFloat(bull[pta]) || 0;
              if (!isNaN(femalePTA) && !isNaN(bullPTA)) {
                predictions[pta] = calculateGenomicPrediction(femalePTA, bullPTA);
              }
            });
            results.push({
              female,
              bull,
              predictions,
              bullNumber: index + 1
            });
          });
        } else {
          // Usar touros da busca
          const convertedBulls = convertSelectedBulls();
          console.log('Touros convertidos para cálculo:', convertedBulls);
          convertedBulls.forEach((bull, index) => {
            console.log(`Calculando predições para fêmea ${female['Nome']} x touro ${bull['Nome']}`);
            const predictions: Record<string, number> = {};

            // Calcular predições para cada PTA
            PTA_COLUMNS.forEach(pta => {
              const femalePTA = parseFloat(female[pta]) || 0;
              const bullPTA = parseFloat(bull[pta]) || 0;
              console.log(`${pta}: Fêmea=${femalePTA}, Touro=${bullPTA}`);
              if (!isNaN(femalePTA) && !isNaN(bullPTA)) {
                predictions[pta] = calculateGenomicPrediction(femalePTA, bullPTA);
              }
            });
            results.push({
              female,
              bull,
              predictions,
              bullNumber: index + 1
            });
          });
        }
      });
      setPredictions(results);
      toast({
        title: 'Predições calculadas',
        description: `${results.length} predições geradas com sucesso`
      });
    } catch (error) {
      toast({
        title: 'Erro no cálculo',
        description: 'Erro ao calcular predições',
        variant: 'destructive'
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Exportar resultados
  const exportResults = () => {
    if (predictions.length === 0) return;
    const exportData = predictions.map(result => ({
      'ID Fazenda Fêmea': result.female['ID Fazenda'] || result.female['Nome'],
      'Nome Fêmea': result.female['Nome'],
      'ID Touro': result.bull['ID Fazenda'] || result.bull['Nome'],
      'Nome Touro': result.bull['Nome'],
      'Acasalamento': `Touro ${result.bullNumber}`,
      ...result.predictions
    }));
    const ws = utils.json_to_sheet(exportData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Predições Nexus 1');
    writeFileXLSX(wb, 'Predicoes_Nexus1.xlsx');
    toast({
      title: 'Exportação concluída',
      description: 'Arquivo exportado com sucesso'
    });
  };

  // Buscar touros por NAAB
  const searchBullsByNAAB = async () => {
    if (!naabSearch.trim()) {
      toast({
        title: 'Digite um NAAB',
        description: 'Digite o código NAAB para buscar touros',
        variant: 'destructive'
      });
      return;
    }
    setSearchingBulls(true);
    try {
      // Buscar diretamente na view bulls_denorm_member que contém todos os dados necessários
      const {
        data,
        error
      } = await supabase.from('bulls_denorm_member').select('*').or(`code.ilike.%${naabSearch.trim()}%,name.ilike.%${naabSearch.trim()}%`).limit(20);
      if (error) throw error;
      console.log('Touros encontrados no banco:', data);
      setSearchResults(data || []);
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhum touro encontrado',
          description: 'Não foi encontrado nenhum touro com esse NAAB',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Touros encontrados',
          description: `${data.length} touros encontrados`
        });
      }
    } catch (error) {
      console.error('Erro ao buscar touros:', error);
      toast({
        title: 'Erro na busca',
        description: 'Erro ao buscar touros no banco de dados',
        variant: 'destructive'
      });
    } finally {
      setSearchingBulls(false);
    }
  };

  // Adicionar touro selecionado da busca
  const addBullFromSearch = (bull: any) => {
    if (selectedBullsFromSearch.find(b => b.id === bull.id)) {
      toast({
        title: 'Touro já selecionado',
        description: 'Este touro já foi adicionado à seleção',
        variant: 'destructive'
      });
      return;
    }
    console.log('Adicionando touro à seleção:', bull);
    setSelectedBullsFromSearch(prev => [...prev, bull]);
    toast({
      title: 'Touro adicionado',
      description: `${bull.name} foi adicionado à seleção`
    });
  };

  // Remover touro da seleção
  const removeBullFromSearch = (bullId: string) => {
    setSelectedBullsFromSearch(prev => prev.filter(b => b.id !== bullId));
  };

  // Converter touros selecionados para formato esperado
  const convertSelectedBulls = () => {
    console.log('Convertendo touros selecionados:', selectedBullsFromSearch);
    return selectedBullsFromSearch.map(bull => {
      const converted = {
        'ID Fazenda': bull.code,
        'Nome': bull.name,
        'HHP$®': bull.hhp_dollar || 0,
        'TPI': bull.tpi || 0,
        'NM$': bull.nm_dollar || 0,
        'CM$': bull.cm_dollar || 0,
        'FM$': bull.fm_dollar || 0,
        'GM$': bull.gm_dollar || 0,
        'F SAV': bull.f_sav || 0,
        'PTAM': bull.ptam || 0,
        'CFP': bull.cfp || 0,
        'PTAF': bull.ptaf || 0,
        'PTAF%': bull.ptaf_pct || 0,
        'PTAP': bull.ptap || 0,
        'PTAP%': bull.ptap_pct || 0,
        'PL': bull.pl || 0,
        'DPR': bull.dpr || 0,
        'LIV': bull.liv || 0,
        'SCS': bull.scs || 0,
        'MAST': bull.mast || 0,
        'MET': bull.met || 0,
        'RP': bull.rp || 0,
        'DA': bull.da || 0,
        'KET': bull.ket || 0,
        'MF': bull.mf || 0,
        'PTAT': bull.ptat || 0,
        'UDC': bull.udc || 0,
        'FLC': bull.flc || 0,
        'SCE': bull.sce || 0,
        'DCE': bull.dce || 0,
        'SSB': bull.ssb || 0,
        'DSB': bull.dsb || 0,
        'H LIV': bull.h_liv || 0,
        'CCR': bull.ccr || 0,
        'HCR': bull.hcr || 0,
        'FI': bull.fi || 0,
        'BWC': bull.bwc || 0,
        'STA': bull.sta || 0,
        'STR': bull.str || 0,
        'DFM': bull.dfm || 0,
        'RUA': bull.rua || 0,
        'RLS': bull.rls || 0,
        'RTP': bull.rtp || 0,
        'FTL': bull.ftl || 0,
        'RW': bull.rw || 0,
        'RLR': bull.rlr || 0,
        'FTA': bull.fta || 0,
        'FLS': bull.fls || 0,
        'FUA': bull.fua || 0,
        'RUH': bull.ruh || 0,
        'RUW': bull.ruw || 0,
        'UCL': bull.ucl || 0,
        'UDP': bull.udp || 0,
        'FTP': bull.ftp || 0,
        'RFI': bull.rfi || 0
      };
      console.log(`Touro convertido: ${bull.name} - TPI: ${converted.TPI}, NM$: ${converted['NM$']}`);
      return converted;
    });
  };
  const resetStateForFarmChange = useCallback(() => {
    setFemales([]);
    setPredictions([]);
    setCurrentStep(1);
    setSelectedBulls(1);
    setSelectedBullIds(['']);
    setSelectedBullsFromSearch([]);
  }, []);
  useEffect(() => {
    if (!currentFarmId) {
      if (lastFarmId !== null) {
        setLastFarmId(null);
      }
      resetStateForFarmChange();
      return;
    }
    if (lastFarmId && lastFarmId !== currentFarmId) {
      resetStateForFarmChange();
      toast({
        title: 'Seleção de rebanho atualizada',
        description: 'As seleções anteriores foram limpas porque você alterou o rebanho.'
      });
    }
    if (lastFarmId !== currentFarmId) {
      setLastFarmId(currentFarmId);
    }
  }, [currentFarmId, lastFarmId, resetStateForFarmChange, toast]);
  const loadFemalesFromDatabase = async () => {
    if (selectedClassifications.length === 0 || selectedCategories.length === 0) {
      toast({
        title: 'Filtros obrigatórios',
        description: 'Selecione ao menos uma classificação e uma categoria',
        variant: 'destructive'
      });
      return;
    }
    if (!currentFarmId) {
      toast({
        title: 'Selecione um rebanho',
        description: 'Escolha um rebanho no dashboard antes de carregar as fêmeas segmentadas.',
        variant: 'destructive'
      });
      return;
    }
    setLoadingDatabase(true);
    try {
      // Buscar fêmeas com segmentação através de join
      const {
        data,
        error
      } = await supabase.from('female_segmentations').select(`
          *,
          females (
            id,
            name,
            identifier,
            farm_id,
            birth_date,
            parity_order,
            hhp_dollar,
            tpi,
            nm_dollar,
            cm_dollar,
            fm_dollar,
            gm_dollar,
            f_sav,
            ptam,
            cfp,
            ptaf,
            ptaf_pct,
            ptap,
            ptap_pct,
            pl,
            dpr,
            liv,
            scs,
            mast,
            met,
            rp,
            da,
            ket,
            mf,
            ptat,
            udc,
            flc,
            sce,
            dce,
            ssb,
            dsb,
            h_liv,
            ccr,
            hcr,
            fi,
            gl,
            efc,
            bwc,
            sta,
            str,
            dfm,
            rua,
            rls,
            rtp,
            ftl,
            rw,
            rlr,
            fta,
            fls,
            fua,
            ruh,
            ruw,
            ucl,
            udp,
            ftp,
            rfi,
            gfi
          )
        `).in('class', selectedClassifications as ('donor' | 'inter' | 'recipient')[]).eq('farm_id', currentFarmId);
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma fêmea encontrada',
          description: 'Não há fêmeas segmentadas com os filtros selecionados. Execute a segmentação primeiro na página de Segmentação.',
          variant: 'destructive'
        });
        setFemales([]);
        return;
      }
      const sanitizedSegmentations = (data ?? []).filter(segmentation => {
        const segmentationFarmMatches = segmentation?.farm_id === currentFarmId;
        const femaleFarmMatches = segmentation?.females?.farm_id ? segmentation.females.farm_id === currentFarmId : true;
        return segmentationFarmMatches && femaleFarmMatches;
      });
      if (sanitizedSegmentations.length === 0) {
        toast({
          title: 'Nenhuma fêmea disponível',
          description: 'As fêmeas segmentadas encontradas não pertencem ao rebanho selecionado.',
          variant: 'destructive'
        });
        setFemales([]);
        return;
      }
      if ((data?.length ?? 0) > sanitizedSegmentations.length) {
        toast({
          title: 'Fêmeas ajustadas',
          description: 'Algumas fêmeas foram desconsideradas por pertencerem a outro rebanho.'
        });
      }

      // Filtrar por categoria usando a categoria automática
      const getAutomaticCategory = (birthDate: string | null, parityOrder: number | null) => {
        if (!birthDate) return 'indefinida';
        const birth = new Date(birthDate);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (ageInMonths < 12) return 'bezerra';
        if (ageInMonths < 24 || !parityOrder || parityOrder === 0) return 'novilha';
        if (parityOrder === 1) return 'primipara';
        if (parityOrder === 2) return 'secundipara';
        return 'multipara';
      };
      const filteredFemales = sanitizedSegmentations.filter(segmentation => {
        const femaleData = segmentation.females;
        if (!femaleData) return false;
        const category = getAutomaticCategory(femaleData.birth_date, femaleData.parity_order);
        return selectedCategories.includes(category);
      });

      // Converter para formato esperado pelo Nexus
      const convertedFemales = filteredFemales.map(segmentation => {
        const femaleData = segmentation.females;
        return {
          'ID Fazenda': femaleData.identifier || femaleData.name,
          'Nome': femaleData.name,
          'HHP$®': femaleData.hhp_dollar || 0,
          'TPI': femaleData.tpi || 0,
          'NM$': femaleData.nm_dollar || 0,
          'CM$': femaleData.cm_dollar || 0,
          'FM$': femaleData.fm_dollar || 0,
          'GM$': femaleData.gm_dollar || 0,
          'F SAV': femaleData.f_sav || 0,
          'PTAM': femaleData.ptam || 0,
          'CFP': femaleData.cfp || 0,
          'PTAF': femaleData.ptaf || 0,
          'PTAF%': femaleData.ptaf_pct || 0,
          'PTAP': femaleData.ptap || 0,
          'PTAP%': femaleData.ptap_pct || 0,
          'PL': femaleData.pl || 0,
          'DPR': femaleData.dpr || 0,
          'LIV': femaleData.liv || 0,
          'SCS': femaleData.scs || 0,
          'MAST': femaleData.mast || 0,
          'MET': femaleData.met || 0,
          'RP': femaleData.rp || 0,
          'DA': femaleData.da || 0,
          'KET': femaleData.ket || 0,
          'MF': femaleData.mf || 0,
          'PTAT': femaleData.ptat || 0,
          'UDC': femaleData.udc || 0,
          'FLC': femaleData.flc || 0,
          'SCE': femaleData.sce || 0,
          'DCE': femaleData.dce || 0,
          'SSB': femaleData.ssb || 0,
          'DSB': femaleData.dsb || 0,
          'H LIV': femaleData.h_liv || 0,
          'CCR': femaleData.ccr || 0,
          'HCR': femaleData.hcr || 0,
          'FI': femaleData.fi || 0,
          'GL': femaleData.gl || 0,
          'EFC': femaleData.efc || 0,
          'BWC': femaleData.bwc || 0,
          'STA': femaleData.sta || 0,
          'STR': femaleData.str || 0,
          'DFM': femaleData.dfm || 0,
          'RUA': femaleData.rua || 0,
          'RLS': femaleData.rls || 0,
          'RTP': femaleData.rtp || 0,
          'FTL': femaleData.ftl || 0,
          'RW': femaleData.rw || 0,
          'RLR': femaleData.rlr || 0,
          'FTA': femaleData.fta || 0,
          'FLS': femaleData.fls || 0,
          'FUA': femaleData.fua || 0,
          'RUH': femaleData.ruh || 0,
          'RUW': femaleData.ruw || 0,
          'UCL': femaleData.ucl || 0,
          'UDP': femaleData.udp || 0,
          'FTP': femaleData.ftp || 0,
          'RFI': femaleData.rfi || 0
        };
      });
      setFemales(convertedFemales);
      toast({
        title: 'Fêmeas carregadas',
        description: `${convertedFemales.length} fêmeas carregadas do banco de dados`
      });
    } catch (error) {
      console.error('Erro ao carregar fêmeas:', error);
      toast({
        title: 'Erro ao carregar',
        description: 'Erro ao carregar fêmeas do banco de dados',
        variant: 'destructive'
      });
    } finally {
      setLoadingDatabase(false);
    }
  };

  // Navegação entre passos
  const canProceedToStep2 = females.length > 0;
  const canProceedToStep3 = bullSource === 'upload' ? bulls.length > 0 : selectedBullsFromSearch.length > 0;
  const nextStep = () => {
    if (currentStep === 1 && canProceedToStep2) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedToStep3) {
      setCurrentStep(3);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Renderizar indicador de passos
  const renderStepIndicator = () => <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          1
        </div>
        <div className={`h-px w-16 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          2
        </div>
        <div className={`h-px w-16 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          3
        </div>
      </div>
      <div className="ml-6 text-sm text-muted-foreground">
        Passo {currentStep} de 3: {currentStep === 1 ? 'Escolher Fêmeas' : currentStep === 2 ? 'Escolher Touros' : 'Calcular Predições'}
      </div>
    </div>;
  const updateSelectedBulls = (count: number) => {
    setSelectedBulls(count);
    const newSelection = Array(count).fill('').map((_, i) => selectedBullIds[i] || '');
    setSelectedBullIds(newSelection);
  };

  // Filtrar resultados por fêmea para exibição
  const groupedPredictions = useMemo(() => {
    const groups: Record<string, PredictionResult[]> = {};
    predictions.forEach(pred => {
      const key = pred.female['ID Fazenda'] || pred.female['Nome'];
      if (!groups[key]) groups[key] = [];
      groups[key].push(pred);
    });
    return groups;
  }, [predictions]);
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Nexus 1: Predição Genômica
          </h2>
          <p className="text-muted-foreground">
            Baseado em dados genômicos completos - Fórmula: ((PTA Fêmea + PTA Touro) / 2) × 0,93
          </p>
        </div>
        <div className="ml-auto">
          <TutorialButtons slug="nexus" />
        </div>
      </div>

      {/* Indicador de Passos */}
      {renderStepIndicator()}

      {/* Passo 1: Escolher Fêmeas */}
      {currentStep === 1 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Passo 1: Escolher Fêmeas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Fonte de Dados */}
            <div className="flex gap-4">
              <Button variant={dataSource === 'upload' ? 'default' : 'outline'} onClick={() => setDataSource('upload')} className="flex-1">
                <FileUp className="w-4 h-4 mr-2" />
                Upload de Arquivo
              </Button>
              <Button variant={dataSource === 'database' ? 'default' : 'outline'} onClick={() => setDataSource('database')} className="flex-1 bg-gray-300 hover:bg-gray-200">
                <Database className="w-4 h-4 mr-2" />
                Fêmeas Segmentadas
              </Button>
            </div>

            {dataSource === 'upload' ? <div className="space-y-4">
                <div>
                  <Label htmlFor="female-upload">Carregar arquivo (.xlsx, .csv)</Label>
                  <Input id="female-upload" type="file" accept=".xlsx,.csv" onChange={handleFemaleUpload} className="mt-1" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                </p>
              </div> : <div className="space-y-4">
                <div>
                  {currentFarmId ? <Badge variant="outline">Rebanho ativo: {currentFarmId}</Badge> : <p className="text-sm text-muted-foreground">
                      Selecione um rebanho no dashboard para habilitar a listagem de fêmeas segmentadas.
                    </p>}
                </div>
                <div>
                  <Label className="text-sm font-medium">Classificações</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[{
                value: 'donor',
                label: 'Doadora'
              }, {
                value: 'inter',
                label: 'Intermediária'
              }, {
                value: 'recipient',
                label: 'Receptora'
              }].map(({
                value,
                label
              }) => <div key={value} className="flex items-center space-x-2">
                        <Checkbox id={`class-${value}`} checked={selectedClassifications.includes(value)} onCheckedChange={checked => {
                  if (checked) {
                    setSelectedClassifications([...selectedClassifications, value]);
                  } else {
                    setSelectedClassifications(selectedClassifications.filter(c => c !== value));
                  }
                }} />
                        <Label htmlFor={`class-${value}`} className="text-sm">
                          {label}
                        </Label>
                      </div>)}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Categorias</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[{
                value: 'bezerra',
                label: 'Bezerra'
              }, {
                value: 'novilha',
                label: 'Novilha'
              }, {
                value: 'primipara',
                label: 'Primípara'
              }, {
                value: 'secundipara',
                label: 'Secundípara'
              }, {
                value: 'multipara',
                label: 'Multípara'
              }].map(({
                value,
                label
              }) => <div key={value} className="flex items-center space-x-2">
                        <Checkbox id={`cat-${value}`} checked={selectedCategories.includes(value)} onCheckedChange={checked => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, value]);
                  } else {
                    setSelectedCategories(selectedCategories.filter(c => c !== value));
                  }
                }} />
                        <Label htmlFor={`cat-${value}`} className="text-sm">
                          {label}
                        </Label>
                      </div>)}
                  </div>
                </div>

                <Button onClick={loadFemalesFromDatabase} disabled={loadingDatabase || !currentFarmId} className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  {loadingDatabase ? 'Carregando...' : 'Carregar Fêmeas'}
                </Button>
              </div>}

            {females.length > 0 && <div className="space-y-2">
                <Badge variant="secondary">
                  {females.length} fêmeas carregadas
                </Badge>
                <div className="flex justify-end">
                  <Button onClick={nextStep} disabled={!canProceedToStep2}>
                    Próximo Passo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>}
          </CardContent>
        </Card>}

      {/* Passo 2: Escolher Touros */}
      {currentStep === 2 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Passo 2: Escolher Touros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Fonte de Touros */}
            <div className="flex gap-4">
              <Button variant={bullSource === 'upload' ? 'default' : 'outline'} onClick={() => setBullSource('upload')} className="flex-1">
                <FileUp className="w-4 h-4 mr-2" />
                Upload de Arquivo
              </Button>
              <Button variant={bullSource === 'search' ? 'default' : 'outline'} onClick={() => setBullSource('search')} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Buscar por NAAB
              </Button>
            </div>

            {bullSource === 'upload' ? <div className="space-y-4">
                <div>
                  <Label htmlFor="bull-upload">Carregar arquivo (.xlsx, .csv)</Label>
                  <Input id="bull-upload" type="file" accept=".xlsx,.csv" onChange={handleBullUpload} className="mt-1" />
                </div>
                {bulls.length > 0 && <Badge variant="secondary">
                    {bulls.length} touros carregados
                  </Badge>}
                <p className="text-sm text-muted-foreground">
                  Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                </p>

                {bulls.length > 0 && <div className="space-y-4">
                    <div>
                      <Label htmlFor="bull-count">Número de touros por fêmea</Label>
                      <Select value={selectedBulls.toString()} onValueChange={value => updateSelectedBulls(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 touro</SelectItem>
                          <SelectItem value="2">2 touros</SelectItem>
                          <SelectItem value="3">3 touros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Selecionar Touros</Label>
                      {selectedBullIds.map((bullId, index) => <div key={index} className="flex items-center gap-2">
                          <Label className="min-w-[80px]">Touro {index + 1}:</Label>
                          <Select value={bullId} onValueChange={value => {
                  const newIds = [...selectedBullIds];
                  newIds[index] = value;
                  setSelectedBullIds(newIds);
                }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um touro" />
                            </SelectTrigger>
                            <SelectContent>
                              {bulls.map((bull, bullIndex) => <SelectItem key={bullIndex} value={bull['ID Fazenda'] || bull['Nome']}>
                                  {bull['Nome']} - {bull['ID Fazenda']}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>)}
                    </div>
                  </div>}
              </div> : <div className="space-y-4">
                {/* Busca por NAAB */}
                <div className="flex gap-2">
                  <Input placeholder="Digite o código NAAB do touro" value={naabSearch} onChange={e => setNaabSearch(e.target.value)} onKeyPress={e => e.key === 'Enter' && searchBullsByNAAB()} />
                  <Button onClick={searchBullsByNAAB} disabled={searchingBulls}>
                    <Search className="w-4 h-4 mr-2" />
                    {searchingBulls ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>

                {/* Resultados da busca */}
                {searchResults.length > 0 && <div className="space-y-2">
                    <Label>Resultados da Busca:</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                       {searchResults.map(bull => <div key={bull.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{bull.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {bull.code} | TPI: {bull.tpi || 'N/A'} | NM$: {bull.nm_dollar || 'N/A'}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => addBullFromSearch(bull)} disabled={selectedBullsFromSearch.find(b => b.id === bull.id)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>)}
                    </div>
                  </div>}

                {/* Touros selecionados */}
                {selectedBullsFromSearch.length > 0 && <div className="space-y-2">
                    <Label>Touros Selecionados ({selectedBullsFromSearch.length}):</Label>
                    <div className="space-y-2">
                      {selectedBullsFromSearch.map(bull => <div key={bull.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{bull.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {bull.code} | TPI: {bull.tpi || 'N/A'} | NM$: {bull.nm_dollar || 'N/A'}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => removeBullFromSearch(bull.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>)}
                    </div>
                  </div>}
              </div>}

            {/* Navegação */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Passo Anterior
              </Button>
              <Button onClick={nextStep} disabled={!canProceedToStep3}>
                Próximo Passo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>}

      {/* Passo 3: Calcular Predições */}
      {currentStep === 3 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Passo 3: Calcular Predições
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Fêmeas</h4>
                <p className="text-sm text-muted-foreground">
                  {females.length} fêmeas carregadas via {dataSource === 'upload' ? 'arquivo' : 'banco segmentado'}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Touros</h4>
                <p className="text-sm text-muted-foreground">
                  {bullSource === 'upload' ? `${bulls.length} touros carregados via arquivo` : `${selectedBullsFromSearch.length} touros selecionados por NAAB`}
                </p>
              </div>
            </div>

            {/* Botão de cálculo */}
            <Button onClick={calculatePredictions} disabled={isCalculating} className="w-full" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              {isCalculating ? 'Calculando...' : 'Calcular Predições Genômicas'}
            </Button>

            {/* Resultados */}
            {predictions.length > 0 && <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Resultados das Predições</h4>
                  <Button onClick={exportResults} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(groupedPredictions).map(([femaleKey, femalePredictions]) => <div key={femaleKey} className="space-y-2">
                      <h5 className="font-semibold">
                        Fêmea: {femalePredictions[0].female['Nome']} ({femaleKey})
                      </h5>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Touro</TableHead>
                              <TableHead>Acasalamento</TableHead>
                              {PTA_COLUMNS.slice(0, 5).map(pta => <TableHead key={pta}>{pta}</TableHead>)}
                              <TableHead>...</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {femalePredictions.map((pred, index) => <TableRow key={index}>
                                <TableCell>{pred.bull['Nome']}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">Touro {pred.bullNumber}</Badge>
                                </TableCell>
                                {PTA_COLUMNS.slice(0, 5).map(pta => <TableCell key={pta}>
                                    {pred.predictions[pta]?.toFixed(2) || '—'}
                                  </TableCell>)}
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    +{PTA_COLUMNS.length - 5} PTAs
                                  </span>
                                </TableCell>
                              </TableRow>)}
                          </TableBody>
                        </Table>
                      </div>
                    </div>)}
                </div>
              </div>}

            {/* Navegação */}
            <div className="flex justify-start">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Passo Anterior
              </Button>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default Nexus1GenomicPrediction;