import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  predictions: Record<string, number | null>;
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

  const parsePTAValue = (value: any): number | null => {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const normalizedValue = typeof value === 'string'
      ? value.replace(',', '.').trim()
      : value;

    const numericValue = typeof normalizedValue === 'number'
      ? normalizedValue
      : parseFloat(normalizedValue);

    return Number.isFinite(numericValue) ? numericValue : null;
  };

  const formatPredictionValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '—';
    }

    return value.toFixed(2);
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
  const hasCalculatedRef = useRef(false);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    hasCalculatedRef.current = false;
  }, []);

  const calculatePredictions = useCallback((showFeedback = true) => {
    if (females.length === 0) {
      clearPredictions();
      if (showFeedback) {
        toast({
          title: 'Dados insuficientes',
          description: 'Carregue fêmeas antes de calcular',
          variant: 'destructive'
        });
      }
      return;
    }

    let bullEntries: { bull: Bull; bullNumber: number }[] = [];

    if (bullSource === 'upload') {
      if (bulls.length === 0) {
        clearPredictions();
        if (showFeedback) {
          toast({
            title: 'Dados insuficientes',
            description: 'Carregue touros antes de calcular',
            variant: 'destructive'
          });
        }
        return;
      }

      const validBullIds = selectedBullIds.map(id => id.trim()).filter(Boolean);

      if (validBullIds.length === 0) {
        clearPredictions();
        if (showFeedback) {
          toast({
            title: 'Touros não selecionados',
            description: 'Selecione pelo menos um touro para acasalamento',
            variant: 'destructive'
          });
        }
        return;
      }

      bullEntries = validBullIds
        .map((bullId, index) => {
          const bull = bulls.find(b => b['ID Fazenda'] === bullId || b['Nome'] === bullId);
          if (!bull) {
            if (showFeedback) {
              toast({
                title: 'Touro não encontrado',
                description: `Não foi possível localizar o touro ${bullId} no arquivo carregado`,
                variant: 'destructive'
              });
            }
            return null;
          }

          return { bull, bullNumber: index + 1 };
        })
        .filter((entry): entry is { bull: Bull; bullNumber: number } => entry !== null);

      if (bullEntries.length === 0) {
        clearPredictions();
        return;
      }
    } else {
      if (selectedBullsFromSearch.length === 0) {
        clearPredictions();
        if (showFeedback) {
          toast({
            title: 'Touros não selecionados',
            description: 'Selecione pelo menos um touro para acasalamento',
            variant: 'destructive'
          });
        }
        return;
      }

      const convertedBulls = convertSelectedBulls();

      bullEntries = convertedBulls.map((bull, index) => ({
        bull,
        bullNumber: index + 1
      }));

      if (bullEntries.length === 0) {
        clearPredictions();
        return;
      }
    }

    setIsCalculating(true);

    try {
      const results: PredictionResult[] = [];

      females.forEach(female => {
        bullEntries.forEach(({ bull, bullNumber }) => {
          const predictions: Record<string, number | null> = {};

          PTA_COLUMNS.forEach(pta => {
            const femalePTA = parsePTAValue(female[pta]);
            const bullPTA = parsePTAValue(bull[pta]);

            if (femalePTA !== null && bullPTA !== null) {
              predictions[pta] = calculateGenomicPrediction(femalePTA, bullPTA);
            } else {
              predictions[pta] = null;
            }
          });

          results.push({
            female,
            bull,
            predictions,
            bullNumber
          });
        });
      });

      setPredictions(results);
      hasCalculatedRef.current = true;

      if (showFeedback) {
        toast({
          title: 'Predições calculadas',
          description: `${results.length} predições geradas com sucesso`
        });
      }
    } catch (error) {
      console.error('Erro ao calcular predições:', error);
      clearPredictions();
      if (showFeedback) {
        toast({
          title: 'Erro no cálculo',
          description: 'Erro ao calcular predições',
          variant: 'destructive'
        });
      }
    } finally {
      setIsCalculating(false);
    }
  }, [bullSource, bulls, clearPredictions, convertSelectedBulls, females, selectedBullIds, selectedBullsFromSearch, toast]);

  useEffect(() => {
    if (!hasCalculatedRef.current) return;
    calculatePredictions(false);
  }, [calculatePredictions, females, bulls, selectedBullIds, selectedBullsFromSearch, bullSource]);

  // Exportar resultados
  const exportResults = () => {
    if (predictions.length === 0) return;

    const exportData = predictions.map(result => {
      const row: Record<string, string | number> = {
        'ID Fazenda Fêmea': result.female['ID Fazenda'] || result.female['Nome'] || '',
        'Nome Fêmea': result.female['Nome'] || '',
        'Classificação Fêmea': result.female['Classificação'] || '',
        'ID Touro': result.bull['ID Fazenda'] || result.bull['Nome'] || '',
        'Nome Touro': result.bull['Nome'] || '',
        'Acasalamento': `Touro ${result.bullNumber}`
      };

      PTA_COLUMNS.forEach(pta => {
        const value = result.predictions[pta];
        row[pta] = value === null || value === undefined ? '—' : Number(value.toFixed(2));
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
  const convertSelectedBulls = useCallback(() => {
    return selectedBullsFromSearch.map(bull => ({
      'ID Fazenda': bull.code ?? null,
      'Nome': bull.name ?? '',
      'HHP$®': bull.ptas?.hhp_dollar ?? null,
      'TPI': bull.ptas?.tpi ?? null,
      'NM$': bull.ptas?.nm_dollar ?? null,
      'CM$': bull.ptas?.cm_dollar ?? null,
      'FM$': bull.ptas?.fm_dollar ?? null,
      'GM$': bull.ptas?.gm_dollar ?? null,
      'F SAV': bull.ptas?.f_sav ?? null,
      'PTAM': bull.ptas?.ptam ?? null,
      'CFP': bull.ptas?.cfp ?? null,
      'PTAF': bull.ptas?.ptaf ?? null,
      'PTAF%': bull.ptas?.ptaf_pct ?? null,
      'PTAP': bull.ptas?.ptap ?? null,
      'PTAP%': bull.ptas?.ptap_pct ?? null,
      'PL': bull.ptas?.pl ?? null,
      'DPR': bull.ptas?.dpr ?? null,
      'LIV': bull.ptas?.liv ?? null,
      'SCS': bull.ptas?.scs ?? null,
      'MAST': bull.ptas?.mast ?? null,
      'MET': bull.ptas?.met ?? null,
      'RP': bull.ptas?.rp ?? null,
      'DA': bull.ptas?.da ?? null,
      'KET': bull.ptas?.ket ?? null,
      'MF': bull.ptas?.mf ?? null,
      'PTAT': bull.ptas?.ptat ?? null,
      'UDC': bull.ptas?.udc ?? null,
      'FLC': bull.ptas?.flc ?? null,
      'SCE': bull.ptas?.sce ?? null,
      'DCE': bull.ptas?.dce ?? null,
      'SSB': bull.ptas?.ssb ?? null,
      'DSB': bull.ptas?.dsb ?? null,
      'H LIV': bull.ptas?.h_liv ?? null,
      'CCR': bull.ptas?.ccr ?? null,
      'HCR': bull.ptas?.hcr ?? null,
      'FI': bull.ptas?.fi ?? null,
      'GL': bull.ptas?.gl ?? null,
      'EFC': bull.ptas?.efc ?? null,
      'BWC': bull.ptas?.bwc ?? null,
      'STA': bull.ptas?.sta ?? null,
      'STR': bull.ptas?.str ?? null,
      'DFM': bull.ptas?.dfm ?? null,
      'RUA': bull.ptas?.rua ?? null,
      'RLS': bull.ptas?.rls ?? null,
      'RTP': bull.ptas?.rtp ?? null,
      'FTL': bull.ptas?.ftl ?? null,
      'RW': bull.ptas?.rw ?? null,
      'RLR': bull.ptas?.rlr ?? null,
      'FTA': bull.ptas?.fta ?? null,
      'FLS': bull.ptas?.fls ?? null,
      'FUA': bull.ptas?.fua ?? null,
      'RUH': bull.ptas?.ruh ?? null,
      'RUW': bull.ptas?.ruw ?? null,
      'UCL': bull.ptas?.ucl ?? null,
      'UDP': bull.ptas?.udp ?? null,
      'FTP': bull.ptas?.ftp ?? null,
      'RFI': bull.ptas?.rfi ?? null
    }));
  }, [selectedBullsFromSearch]);
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
        .from('female_segmentations')
        .select(`
          *,
          female:females_denorm(*)
        `)
        .in('class', selectedClassifications as ('donor' | 'inter' | 'recipient')[])
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

      const filteredFemales = (data || []).filter(segmentation => {
        const female = (segmentation as any).female;
        if (!female) return false;

        const category = getAutomaticCategory(female.birth_date, female.parity_order);
        return selectedCategories.includes(category);
      });

      if (filteredFemales.length === 0) {
        toast({
          title: 'Nenhuma fêmea encontrada',
          description: 'Não há fêmeas segmentadas com os filtros selecionados.',
          variant: 'destructive'
        });
        setFemales([]);
        return;
      }

      // Converter para formato esperado pelo Nexus
      const convertedFemales = filteredFemales.map(segmentation => {
        const female = (segmentation as any).female || {};

        return {
          'ID Fazenda': female.identifier || female.name || '',
          'Nome': female.name || '',
          'Classificação': segmentation.class,
          'HHP$®': female.hhp_dollar ?? null,
          'TPI': female.tpi ?? null,
          'NM$': female.nm_dollar ?? null,
          'CM$': female.cm_dollar ?? null,
          'FM$': female.fm_dollar ?? null,
          'GM$': female.gm_dollar ?? null,
          'F SAV': female.f_sav ?? null,
          'PTAM': female.ptam ?? null,
          'CFP': female.cfp ?? null,
          'PTAF': female.ptaf ?? null,
          'PTAF%': female.ptaf_pct ?? null,
          'PTAP': female.ptap ?? null,
          'PTAP%': female.ptap_pct ?? null,
          'PL': female.pl ?? null,
          'DPR': female.dpr ?? null,
          'LIV': female.liv ?? null,
          'SCS': female.scs ?? null,
          'MAST': female.mast ?? null,
          'MET': female.met ?? null,
          'RP': female.rp ?? null,
          'DA': female.da ?? null,
          'KET': female.ket ?? null,
          'MF': female.mf ?? null,
          'PTAT': female.ptat ?? null,
          'UDC': female.udc ?? null,
          'FLC': female.flc ?? null,
          'SCE': female.sce ?? null,
          'DCE': female.dce ?? null,
          'SSB': female.ssb ?? null,
          'DSB': female.dsb ?? null,
          'H LIV': female.h_liv ?? null,
          'CCR': female.ccr ?? null,
          'HCR': female.hcr ?? null,
          'FI': female.fi ?? null,
          'GL': female.gl ?? null,
          'EFC': female.efc ?? null,
          'BWC': female.bwc ?? null,
          'STA': female.sta ?? null,
          'STR': female.str ?? null,
          'DFM': female.dfm ?? null,
          'RUA': female.rua ?? null,
          'RLS': female.rls ?? null,
          'RTP': female.rtp ?? null,
          'FTL': female.ftl ?? null,
          'RW': female.rw ?? null,
          'RLR': female.rlr ?? null,
          'FTA': female.fta ?? null,
          'FLS': female.fls ?? null,
          'FUA': female.fua ?? null,
          'RUH': female.ruh ?? null,
          'RUW': female.ruw ?? null,
          'UCL': female.ucl ?? null,
          'UDP': female.udp ?? null,
          'FTP': female.ftp ?? null,
          'RFI': female.rfi ?? null
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
              onClick={() => calculatePredictions()}
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
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fêmea</TableHead>
                        <TableHead>ID Fêmea</TableHead>
                        <TableHead>Classificação</TableHead>
                        <TableHead>Touro</TableHead>
                        <TableHead>Acasalamento</TableHead>
                        {PTA_COLUMNS.map(pta => (
                          <TableHead key={pta}>{pta}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {predictions.map((pred, index) => (
                        <TableRow
                          key={`${pred.female['ID Fazenda'] || pred.female['Nome'] || index}-${pred.bull['ID Fazenda'] || pred.bull['Nome'] || index}-${index}`}
                        >
                          <TableCell>{pred.female['Nome'] || '—'}</TableCell>
                          <TableCell>{pred.female['ID Fazenda'] || '—'}</TableCell>
                          <TableCell>{pred.female['Classificação'] || '—'}</TableCell>
                          <TableCell>{pred.bull['Nome'] || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Touro {pred.bullNumber}</Badge>
                          </TableCell>
                          {PTA_COLUMNS.map(pta => (
                            <TableCell key={pta}>{formatPredictionValue(pred.predictions[pta])}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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