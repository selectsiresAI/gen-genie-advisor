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

// Colunas específicas para Nexus 1
const NEXUS1_COLUMNS = [
  'ID Fazenda', 'Nome', 'HHP$®', 'TPI', 'NM$', 'CM$', 'FM$', 'GM$', 'F SAV', 'PTAM', 'CFP',
  'PTAF', 'PTAF%', 'PTAP', 'PTAP%', 'PL', 'DPR', 'LIV', 'SCS', 'MAST', 'MET', 'RP', 'DA',
  'KET', 'MF', 'PTAT', 'UDC', 'FLC', 'SCE', 'DCE', 'SSB', 'DSB', 'H LIV', 'CCR', 'HCR',
  'FI', 'GL', 'EFC', 'BWC', 'STA', 'STR', 'DFM', 'RUA', 'RLS', 'RTP', 'FTL', 'RW', 'RLR',
  'FTA', 'FLS', 'FUA', 'RUH', 'RUW', 'UCL', 'UDP', 'FTP', 'RFI'
];

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

const Nexus1GenomicPrediction: React.FC<Nexus1GenomicPredictionProps> = ({ onBack }) => {
  const { toast } = useToast();
  
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
  
  // Estados para busca de touros
  const [naabSearch, setNaabSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingBulls, setSearchingBulls] = useState(false);
  const [selectedBullsFromSearch, setSelectedBullsFromSearch] = useState<any[]>([]);
  
  // Filtros para fêmeas do banco
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(['donor', 'inter', 'recipient']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['bezerra', 'novilha', 'primipara', 'secundipara', 'multipara']);

  // Função para calcular predições genômicas
  const calculateGenomicPrediction = (femalePTA: number, bullPTA: number): number => {
    return ((femalePTA + bullPTA) / 2) * 0.93;
  };

  const parsePTAValue = (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (normalized === '') {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  // Parse de arquivos
  const parseFile = useCallback(async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let data: any[];
          
          if (file.name.toLowerCase().endsWith('.xlsx')) {
            const wb = read(new Uint8Array(e.target?.result as ArrayBuffer), { type: 'array' });
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
    const validBullIds = bullSource === 'upload'
      ? selectedBullIds.filter(id => id.trim() !== '')
      : [];

    if (bullSource === 'upload') {
      if (bulls.length === 0) {
        toast({
          title: 'Dados insuficientes',
          description: 'Carregue touros antes de calcular',
          variant: 'destructive'
        });
        return;
      }
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
        const femalePTAValues: Record<string, number | null> = {};
        PTA_COLUMNS.forEach(pta => {
          femalePTAValues[pta] = parsePTAValue(female[pta]);
        });

        const handlePredictionForBull = (bull: Bull, bullIndex: number) => {
          const predictions: Record<string, number> = {};

          PTA_COLUMNS.forEach(pta => {
            const femalePTA = femalePTAValues[pta];
            const bullPTA = parsePTAValue(bull[pta]);

            if (femalePTA !== null && bullPTA !== null) {
              predictions[pta] = calculateGenomicPrediction(femalePTA, bullPTA);
            }
          });

          results.push({
            female,
            bull,
            predictions,
            bullNumber: bullIndex + 1
          });
        };

        if (bullSource === 'upload') {
          validBullIds.forEach((bullId, index) => {
            const bull = bullsToUse.find(b => b['ID Fazenda'] === bullId || b['Nome'] === bullId);

            if (!bull) {
              console.warn(`Touro ${bullId} não encontrado`);
              return;
            }

            handlePredictionForBull(bull, index);
          });
        } else {
          bullsToUse.forEach((bull, index) => {
            handlePredictionForBull(bull, index);
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

    const exportData = predictions.map(result => {
      const row: Record<string, string> = {
        'ID Fazenda Fêmea': String(result.female['ID Fazenda'] || result.female['Nome'] || ''),
        'Nome Fêmea': String(result.female['Nome'] || ''),
        'ID Touro': String(result.bull['ID Fazenda'] || result.bull['Nome'] || ''),
        'Nome Touro': String(result.bull['Nome'] || ''),
        'Acasalamento': `Touro ${result.bullNumber}`
      };

      PTA_COLUMNS.forEach(pta => {
        const value = result.predictions[pta];
        row[pta] = typeof value === 'number' ? value.toFixed(2) : '—';
      });

      return row;
    });

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
      const { data, error } = await supabase
        .rpc('search_bulls', { 
          q: naabSearch.trim(),
          limit_count: 20 
        });

      if (error) throw error;

      setSearchResults(data || []);
      
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhum touro encontrado',
          description: 'Não foi encontrado nenhum touro com esse NAAB',
          variant: 'destructive'  
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
    if (selectedBullsFromSearch.find(b => b.bull_id === bull.bull_id)) {
      toast({
        title: 'Touro já selecionado',
        description: 'Este touro já foi adicionado à seleção',
        variant: 'destructive'
      });
      return;
    }

    setSelectedBullsFromSearch(prev => [...prev, bull]);
    toast({
      title: 'Touro adicionado',
      description: `${bull.name} foi adicionado à seleção`
    });
  };

  // Remover touro da seleção
  const removeBullFromSearch = (bullId: string) => {
    setSelectedBullsFromSearch(prev => prev.filter(b => b.bull_id !== bullId));
  };

  // Converter touros selecionados para formato esperado
  const convertSelectedBulls = () => {
    return selectedBullsFromSearch.map(bull => ({
      'ID Fazenda': bull.code,
      'Nome': bull.name,
      'HHP$®': parsePTAValue(bull.ptas?.hhp_dollar),
      'TPI': parsePTAValue(bull.ptas?.tpi),
      'NM$': parsePTAValue(bull.ptas?.nm_dollar),
      'CM$': parsePTAValue(bull.ptas?.cm_dollar),
      'FM$': parsePTAValue(bull.ptas?.fm_dollar),
      'GM$': parsePTAValue(bull.ptas?.gm_dollar),
      'F SAV': parsePTAValue(bull.ptas?.f_sav),
      'PTAM': parsePTAValue(bull.ptas?.ptam),
      'CFP': parsePTAValue(bull.ptas?.cfp),
      'PTAF': parsePTAValue(bull.ptas?.ptaf),
      'PTAF%': parsePTAValue(bull.ptas?.ptaf_pct),
      'PTAP': parsePTAValue(bull.ptas?.ptap),
      'PTAP%': parsePTAValue(bull.ptas?.ptap_pct),
      'PL': parsePTAValue(bull.ptas?.pl),
      'DPR': parsePTAValue(bull.ptas?.dpr),
      'LIV': parsePTAValue(bull.ptas?.liv),
      'SCS': parsePTAValue(bull.ptas?.scs),
      'MAST': parsePTAValue(bull.ptas?.mast),
      'MET': parsePTAValue(bull.ptas?.met),
      'RP': parsePTAValue(bull.ptas?.rp),
      'DA': parsePTAValue(bull.ptas?.da),
      'KET': parsePTAValue(bull.ptas?.ket),
      'MF': parsePTAValue(bull.ptas?.mf),
      'PTAT': parsePTAValue(bull.ptas?.ptat),
      'UDC': parsePTAValue(bull.ptas?.udc),
      'FLC': parsePTAValue(bull.ptas?.flc),
      'SCE': parsePTAValue(bull.ptas?.sce),
      'DCE': parsePTAValue(bull.ptas?.dce),
      'SSB': parsePTAValue(bull.ptas?.ssb),
      'DSB': parsePTAValue(bull.ptas?.dsb),
      'H LIV': parsePTAValue(bull.ptas?.h_liv),
      'CCR': parsePTAValue(bull.ptas?.ccr),
      'HCR': parsePTAValue(bull.ptas?.hcr),
      'FI': parsePTAValue(bull.ptas?.fi),
      'GL': parsePTAValue(bull.ptas?.gl),
      'EFC': parsePTAValue(bull.ptas?.efc),
      'BWC': parsePTAValue(bull.ptas?.bwc),
      'STA': parsePTAValue(bull.ptas?.sta),
      'STR': parsePTAValue(bull.ptas?.str),
      'DFM': parsePTAValue(bull.ptas?.dfm),
      'RUA': parsePTAValue(bull.ptas?.rua),
      'RLS': parsePTAValue(bull.ptas?.rls),
      'RTP': parsePTAValue(bull.ptas?.rtp),
      'FTL': parsePTAValue(bull.ptas?.ftl),
      'RW': parsePTAValue(bull.ptas?.rw),
      'RLR': parsePTAValue(bull.ptas?.rlr),
      'FTA': parsePTAValue(bull.ptas?.fta),
      'FLS': parsePTAValue(bull.ptas?.fls),
      'FUA': parsePTAValue(bull.ptas?.fua),
      'RUH': parsePTAValue(bull.ptas?.ruh),
      'RUW': parsePTAValue(bull.ptas?.ruw),
      'UCL': parsePTAValue(bull.ptas?.ucl),
      'UDP': parsePTAValue(bull.ptas?.udp),
      'FTP': parsePTAValue(bull.ptas?.ftp),
      'RFI': parsePTAValue(bull.ptas?.rfi)
    }));
  };
  const loadFemalesFromDatabase = async () => {
    if (selectedClassifications.length === 0 || selectedCategories.length === 0) {
      toast({
        title: 'Filtros obrigatórios',
        description: 'Selecione ao menos uma classificação e uma categoria',
        variant: 'destructive'
      });
      return;
    }

    setLoadingDatabase(true);
    try {
      // Buscar fazenda do usuário atual
      const { data: userFarms, error: userError } = await supabase
        .from('user_farms')
        .select('farm_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (userError) throw userError;
      
      if (!userFarms || userFarms.length === 0) {
        toast({
          title: 'Nenhuma fazenda encontrada',
          description: 'Você precisa estar associado a uma fazenda',
          variant: 'destructive'
        });
        return;
      }

      const farmIds = userFarms.map(f => f.farm_id);

      const { data, error } = await supabase
        .from('females_denorm')
        .select('*')
        .in('segmentation_class', selectedClassifications as ('donor' | 'inter' | 'recipient')[])
        .not('segmentation_class', 'is', null)
        .in('farm_id', farmIds);

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

      // Filtrar por categoria usando a categoria automática
      const getAutomaticCategory = (birthDate: string | null, parityOrder: number | null) => {
        if (!birthDate) return 'indefinida';
        
        const birth = new Date(birthDate);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                           (today.getMonth() - birth.getMonth());
        
        if (ageInMonths < 12) return 'bezerra';
        if (ageInMonths < 24 || !parityOrder || parityOrder === 0) return 'novilha';
        if (parityOrder === 1) return 'primipara';
        if (parityOrder === 2) return 'secundipara';
        return 'multipara';
      };

      const filteredFemales = data.filter(female => {
        const category = getAutomaticCategory(female.birth_date, female.parity_order);
        return selectedCategories.includes(category);
      });

      // Converter para formato esperado pelo Nexus
      const convertedFemales = filteredFemales.map(female => ({
        'ID Fazenda': female.identifier || female.name,
        'Nome': female.name,
        'HHP$®': parsePTAValue(female.hhp_dollar),
        'TPI': parsePTAValue(female.tpi),
        'NM$': parsePTAValue(female.nm_dollar),
        'CM$': parsePTAValue(female.cm_dollar),
        'FM$': parsePTAValue(female.fm_dollar),
        'GM$': parsePTAValue(female.gm_dollar),
        'F SAV': parsePTAValue(female.f_sav),
        'PTAM': parsePTAValue(female.ptam),
        'CFP': parsePTAValue(female.cfp),
        'PTAF': parsePTAValue(female.ptaf),
        'PTAF%': parsePTAValue(female.ptaf_pct),
        'PTAP': parsePTAValue(female.ptap),
        'PTAP%': parsePTAValue(female.ptap_pct),
        'PL': parsePTAValue(female.pl),
        'DPR': parsePTAValue(female.dpr),
        'LIV': parsePTAValue(female.liv),
        'SCS': parsePTAValue(female.scs),
        'MAST': parsePTAValue(female.mast),
        'MET': parsePTAValue(female.met),
        'RP': parsePTAValue(female.rp),
        'DA': parsePTAValue(female.da),
        'KET': parsePTAValue(female.ket),
        'MF': parsePTAValue(female.mf),
        'PTAT': parsePTAValue(female.ptat),
        'UDC': parsePTAValue(female.udc),
        'FLC': parsePTAValue(female.flc),
        'SCE': parsePTAValue(female.sce),
        'DCE': parsePTAValue(female.dce),
        'SSB': parsePTAValue(female.ssb),
        'DSB': parsePTAValue(female.dsb),
        'H LIV': parsePTAValue(female.h_liv),
        'CCR': parsePTAValue(female.ccr),
        'HCR': parsePTAValue(female.hcr),
        'FI': parsePTAValue(female.fi),
        'GL': parsePTAValue(female.gl),
        'EFC': parsePTAValue(female.efc),
        'BWC': parsePTAValue(female.bwc),
        'STA': parsePTAValue(female.sta),
        'STR': parsePTAValue(female.str),
        'DFM': parsePTAValue(female.dfm),
        'RUA': parsePTAValue(female.rua),
        'RLS': parsePTAValue(female.rls),
        'RTP': parsePTAValue(female.rtp),
        'FTL': parsePTAValue(female.ftl),
        'RW': parsePTAValue(female.rw),
        'RLR': parsePTAValue(female.rlr),
        'FTA': parsePTAValue(female.fta),
        'FLS': parsePTAValue(female.fls),
        'FUA': parsePTAValue(female.fua),
        'RUH': parsePTAValue(female.ruh),
        'RUW': parsePTAValue(female.ruw),
        'UCL': parsePTAValue(female.ucl),
        'UDP': parsePTAValue(female.udp),
        'FTP': parsePTAValue(female.ftp),
        'RFI': parsePTAValue(female.rfi)
      }));

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
  const canProceedToStep3 = (bullSource === 'upload' ? bulls.length > 0 : selectedBullsFromSearch.length > 0);

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
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
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
        Passo {currentStep} de 3: {
          currentStep === 1 ? 'Escolher Fêmeas' :
          currentStep === 2 ? 'Escolher Touros' :
          'Calcular Predições'
        }
      </div>
    </div>
  );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Nexus 1: Predição Genômica
          </h2>
          <p className="text-muted-foreground">
            Baseado em dados genômicos completos - Fórmula: ((PTA Fêmea + PTA Touro) / 2) × 0,93
          </p>
        </div>
      </div>

      {/* Indicador de Passos */}
      {renderStepIndicator()}

      {/* Passo 1: Escolher Fêmeas */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Passo 1: Escolher Fêmeas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Fonte de Dados */}
            <div className="flex gap-4">
              <Button
                variant={dataSource === 'upload' ? 'default' : 'outline'}
                onClick={() => setDataSource('upload')}
                className="flex-1"
              >
                <FileUp className="w-4 h-4 mr-2" />
                Upload de Arquivo
              </Button>
              <Button
                variant={dataSource === 'database' ? 'default' : 'outline'}
                onClick={() => setDataSource('database')}
                className="flex-1"
              >
                <Database className="w-4 h-4 mr-2" />
                Fêmeas Segmentadas
              </Button>
            </div>

            {dataSource === 'upload' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="female-upload">Carregar arquivo (.xlsx, .csv)</Label>
                  <Input
                    id="female-upload"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFemaleUpload}
                    className="mt-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Classificações</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { value: 'donor', label: 'Doadora' },
                      { value: 'inter', label: 'Intermediária' },
                      { value: 'recipient', label: 'Receptora' }
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${value}`}
                          checked={selectedClassifications.includes(value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClassifications([...selectedClassifications, value]);
                            } else {
                              setSelectedClassifications(selectedClassifications.filter(c => c !== value));
                            }
                          }}
                        />
                        <Label htmlFor={`class-${value}`} className="text-sm">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Categorias</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { value: 'bezerra', label: 'Bezerra' },
                      { value: 'novilha', label: 'Novilha' },
                      { value: 'primipara', label: 'Primípara' },
                      { value: 'secundipara', label: 'Secundípara' },
                      { value: 'multipara', label: 'Multípara' }
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${value}`}
                          checked={selectedCategories.includes(value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, value]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== value));
                            }
                          }}
                        />
                        <Label htmlFor={`cat-${value}`} className="text-sm">
                          {label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={loadFemalesFromDatabase} 
                  disabled={loadingDatabase}
                  className="w-full"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {loadingDatabase ? 'Carregando...' : 'Carregar Fêmeas'}
                </Button>
              </div>
            )}

            {females.length > 0 && (
              <div className="space-y-2">
                <Badge variant="secondary">
                  {females.length} fêmeas carregadas
                </Badge>
                <div className="flex justify-end">
                  <Button onClick={nextStep} disabled={!canProceedToStep2}>
                    Próximo Passo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Passo 2: Escolher Touros */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Passo 2: Escolher Touros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Fonte de Touros */}
            <div className="flex gap-4">
              <Button
                variant={bullSource === 'upload' ? 'default' : 'outline'}
                onClick={() => setBullSource('upload')}
                className="flex-1"
              >
                <FileUp className="w-4 h-4 mr-2" />
                Upload de Arquivo
              </Button>
              <Button
                variant={bullSource === 'search' ? 'default' : 'outline'}
                onClick={() => setBullSource('search')}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                Buscar por NAAB
              </Button>
            </div>

            {bullSource === 'upload' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bull-upload">Carregar arquivo (.xlsx, .csv)</Label>
                  <Input
                    id="bull-upload"
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleBullUpload}
                    className="mt-1"
                  />
                </div>
                {bulls.length > 0 && (
                  <Badge variant="secondary">
                    {bulls.length} touros carregados
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground">
                  Arquivo deve conter as colunas: ID Fazenda, Nome e todos os PTAs necessários
                </p>

                {bulls.length > 0 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bull-count">Número de touros por fêmea</Label>
                      <Select value={selectedBulls.toString()} onValueChange={(value) => updateSelectedBulls(parseInt(value))}>
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
                      {selectedBullIds.map((bullId, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="min-w-[80px]">Touro {index + 1}:</Label>
                          <Select 
                            value={bullId} 
                            onValueChange={(value) => {
                              const newIds = [...selectedBullIds];
                              newIds[index] = value;
                              setSelectedBullIds(newIds);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um touro" />
                            </SelectTrigger>
                            <SelectContent>
                              {bulls.map((bull, bullIndex) => (
                                <SelectItem key={bullIndex} value={bull['ID Fazenda'] || bull['Nome']}>
                                  {bull['Nome']} - {bull['ID Fazenda']}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Busca por NAAB */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código NAAB do touro"
                    value={naabSearch}
                    onChange={(e) => setNaabSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchBullsByNAAB()}
                  />
                  <Button onClick={searchBullsByNAAB} disabled={searchingBulls}>
                    <Search className="w-4 h-4 mr-2" />
                    {searchingBulls ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>

                {/* Resultados da busca */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Resultados da Busca:</Label>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {searchResults.map((bull) => (
                        <div key={bull.bull_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{bull.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {bull.code} | TPI: {bull.ptas?.tpi || 'N/A'} | NM$: {bull.ptas?.nm_dollar || 'N/A'}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => addBullFromSearch(bull)}
                            disabled={selectedBullsFromSearch.find(b => b.bull_id === bull.bull_id)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Touros selecionados */}
                {selectedBullsFromSearch.length > 0 && (
                  <div className="space-y-2">
                    <Label>Touros Selecionados ({selectedBullsFromSearch.length}):</Label>
                    <div className="space-y-2">
                      {selectedBullsFromSearch.map((bull) => (
                        <div key={bull.bull_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{bull.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {bull.code} | TPI: {bull.ptas?.tpi || 'N/A'} | NM$: {bull.ptas?.nm_dollar || 'N/A'}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeBullFromSearch(bull.bull_id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
        </Card>
      )}

      {/* Passo 3: Calcular Predições */}
      {currentStep === 3 && (
        <Card>
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
                  {bullSource === 'upload' 
                    ? `${bulls.length} touros carregados via arquivo` 
                    : `${selectedBullsFromSearch.length} touros selecionados por NAAB`
                  }
                </p>
              </div>
            </div>

            {/* Botão de cálculo */}
            <Button 
              onClick={calculatePredictions} 
              disabled={isCalculating}
              className="w-full"
              size="lg"
            >
              <Calculator className="w-4 h-4 mr-2" />
              {isCalculating ? 'Calculando...' : 'Calcular Predições Genômicas'}
            </Button>

            {/* Resultados */}
            {predictions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Resultados das Predições</h4>
                  <Button onClick={exportResults} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(groupedPredictions).map(([femaleKey, femalePredictions]) => (
                    <div key={femaleKey} className="space-y-2">
                      <h5 className="font-semibold">
                        Fêmea: {femalePredictions[0].female['Nome']} ({femaleKey})
                      </h5>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Touro</TableHead>
                              <TableHead>Acasalamento</TableHead>
                              {PTA_COLUMNS.slice(0, 5).map(pta => (
                                <TableHead key={pta}>{pta}</TableHead>
                              ))}
                              <TableHead>...</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {femalePredictions.map((pred, index) => (
                              <TableRow key={index}>
                                <TableCell>{pred.bull['Nome']}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">Touro {pred.bullNumber}</Badge>
                                </TableCell>
                                {PTA_COLUMNS.slice(0, 5).map(pta => (
                                  <TableCell key={pta}>
                                    {pred.predictions[pta]?.toFixed(2) || '—'}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
                                    +{PTA_COLUMNS.length - 5} PTAs
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-start">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Passo Anterior
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Nexus1GenomicPrediction;