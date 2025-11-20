import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Search, Plus, Upload, Download, TrendingUp, Trash2, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FemaleUploadModal from './FemaleUploadModal';
import { useHerdStore } from '@/hooks/useHerdStore';
import { fetchFemalesDenormByFarm, isCompleteFemaleRow, type CompleteFemaleDenormRow } from '@/supabase/queries/females';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { t } from '@/lib/i18n';
import { HelpButton } from '@/components/help/HelpButton';
import { HelpHint } from '@/components/help/HelpHint';
import { formatPtaValue } from '@/utils/ptaFormat';

import SortableHeader from '@/components/animals/SortableHeader';
import { ANIMAL_METRIC_COLUMNS } from '@/constants/animalMetrics';
import { useAnimalTableSort } from '@/hooks/useAnimalTableSort';
import { getAutomaticCategory, calculateCategoryCounts } from '@/utils/femaleCategories';
interface Farm {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  total_females: number;
}
interface HerdPageProps {
  farm: Farm;
  onBack: () => void;
  onNavigateToCharts?: () => void;
}
type Female = CompleteFemaleDenormRow;
const HerdPage: React.FC<HerdPageProps> = ({
  farm,
  onBack,
  onNavigateToCharts
}) => {
  const [females, setFemales] = useState<Female[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedFemales, setSelectedFemales] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    toast
  } = useToast();
  const {
    setSelectedHerdId,
    setDashboardCounts
  } = useHerdStore();
  const tableRegionRef = useRef<HTMLDivElement | null>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);
  const stickyColumnVars = useMemo(() => ({
    '--herd-sticky-select-width': '4.75rem',
    '--herd-sticky-farm-width': '12.5rem',
    '--herd-sticky-name-width': '14rem',
    '--herd-sticky-select-left': '0px',
    '--herd-sticky-farm-left': 'var(--herd-sticky-select-width)',
    '--herd-sticky-name-left': 'calc(var(--herd-sticky-select-width) + var(--herd-sticky-farm-width))'
  }) as React.CSSProperties, []);
  const stickyColumnStyles = useMemo(() => ({
    select: {
      width: 'var(--herd-sticky-select-width)',
      minWidth: 'var(--herd-sticky-select-width)',
      left: 'var(--herd-sticky-select-left)'
    } as React.CSSProperties,
    farmId: {
      width: 'var(--herd-sticky-farm-width)',
      minWidth: 'var(--herd-sticky-farm-width)',
      left: 'var(--herd-sticky-farm-left)'
    } as React.CSSProperties,
    name: {
      width: 'var(--herd-sticky-name-width)',
      minWidth: 'var(--herd-sticky-name-width)',
      left: 'var(--herd-sticky-name-left)'
    } as React.CSSProperties
  }), []);
  // Importar função centralizada de categorização
  // REMOVIDO: agora usa import de femaleCategories
  const getFonteDisplay = (fonte?: string | null) => {
    if (!fonte) {
      return {
        label: '—',
        className: 'border-gray-200 bg-gray-50 text-gray-600'
      };
    }
    const normalized = fonte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    if (normalized.startsWith('genom')) {
      return {
        label: 'Genômica',
        className: 'border-green-200 bg-green-50 text-green-700'
      };
    }
    if (normalized.startsWith('pred')) {
      return {
        label: 'Predição',
        className: 'border-purple-200 bg-purple-50 text-purple-700'
      };
    }
    return {
      label: fonte,
      className: 'border-gray-200 bg-gray-50 text-gray-700'
    };
  };

  // Memoize category counts to avoid recalculating on every render
  const categoryCounts = useMemo(() => {
    return calculateCategoryCounts(females);
  }, [females]);

  // Update the herd store when counts change
  useEffect(() => {
    if (categoryCounts.total > 0) {
      const dashboardCounts = {
        "Total de Fêmeas": categoryCounts.total,
        "Bezerra": categoryCounts.bezerras,
        "Novilhas": categoryCounts.novilhas,
        "Primíparas": categoryCounts.primiparas,
        "Secundíparas": categoryCounts.secundiparas,
        "Multíparas": categoryCounts.multiparas
      };
      setSelectedHerdId(farm.farm_id);
      setDashboardCounts(dashboardCounts);
    }
  }, [categoryCounts, farm.farm_id, setSelectedHerdId, setDashboardCounts]);
  const loadFemales = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const rows = await fetchFemalesDenormByFarm(farm.farm_id, {
        order: {
          column: 'created_at',
          ascending: false
        }
      });
      const completeRows = rows.filter(isCompleteFemaleRow) as Female[];
      if (rows.length !== completeRows.length) {
        console.warn('[HerdPage] Ignored female rows missing id, name, farm_id or created_at:', rows.length - completeRows.length);
      }
      console.log(`[HerdPage] Loaded ${completeRows.length} females from females_denorm`);
      setFemales(completeRows);
    } catch (error) {
      console.error('Error loading females:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do rebanho",
        variant: "destructive"
      });
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [farm.farm_id, toast]);
  useEffect(() => {
    loadFemales();
  }, [loadFemales]);
  useEffect(() => {
    setSelectedFemales(prev => prev.filter(id => females.some(female => female.id === id)));
  }, [females]);

  // Get available birth years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    females.forEach(female => {
      if (female.birth_date) {
        years.add(new Date(female.birth_date).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [females]);
  const filteredFemales = useMemo(() => {
    return females.filter(female => {
      const matchesSearch = female.name.toLowerCase().includes(searchTerm.toLowerCase()) || female.identifier && female.identifier.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = !selectedYear || selectedYear === "all-years" || female.birth_date && new Date(female.birth_date).getFullYear().toString() === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [females, searchTerm, selectedYear]);

  const getFemaleSortValue = useCallback((female: Female, column: string) => {
    switch (column) {
      case 'farm_id':
        return farm.farm_id;
      case 'name':
        return female.name;
      case 'identifier':
        return female.identifier || '';
      case 'cdcb_identifier':
        return female.cdcb_id || '';
      case 'sire_naab':
        return female.sire_naab || '';
      case 'mgs_naab':
        return female.mgs_naab || '';
      case 'mmgs_naab':
        return female.mmgs_naab || '';
      case 'birth_date':
        return female.birth_date ? new Date(female.birth_date).getTime() : null;
      case 'parity_order':
        return female.parity_order ?? null;
      case 'category':
        return getAutomaticCategory(female.birth_date, female.parity_order);
      case 'fonte':
        return female.fonte || '';
      default:
        return (female as Record<string, unknown>)[column] ?? '';
    }
  }, [farm.farm_id, getAutomaticCategory]);

  const {
    sortedItems: sortedFemales,
    sortConfig: femaleSortConfig,
    requestSort: handleSortFemales
  } = useAnimalTableSort(filteredFemales, getFemaleSortValue);

  const visibleFemaleIds = useMemo(() => sortedFemales.map(female => female.id), [sortedFemales]);
  const selectedVisibleCount = useMemo(() => visibleFemaleIds.filter(id => selectedFemales.includes(id)).length, [visibleFemaleIds, selectedFemales]);
  const allVisibleSelected = visibleFemaleIds.length > 0 && selectedVisibleCount === visibleFemaleIds.length;
  const partiallyVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = partiallyVisibleSelected;
    }
  }, [partiallyVisibleSelected, allVisibleSelected]);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  const getAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    if (years > 0) {
      return `${years}a ${months >= 0 ? months : 12 + months}m`;
    }
    return `${months >= 0 ? months : 12 + months}m`;
  };
  const renderPedigreeCell = (code?: string | null, name?: string | null) => {
    if (!code && !name) {
      return <span>-</span>;
    }
    return <div className="flex flex-col leading-tight">
        {code && <span className="font-medium">{code}</span>}
        {name && <span className="text-[11px] text-muted-foreground">{name}</span>}
      </div>;
  };
  const formatMetricValue = (female: Female, key: string) => {
    const rawValue = (female as Record<string, unknown>)[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return '-';
    }
    if (key === 'hhp_dollar') {
      const numericValue = Number(rawValue);
      return Number.isNaN(numericValue) ? rawValue : numericValue.toFixed(0);
    }
    return rawValue as React.ReactNode;
  };
  const handleSelectFemale = (femaleId: string) => {
    setSelectedFemales(prev => prev.includes(femaleId) ? prev.filter(id => id !== femaleId) : [...prev, femaleId]);
  };
  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedFemales(prev => prev.filter(id => !visibleFemaleIds.includes(id)));
    } else {
      setSelectedFemales(prev => Array.from(new Set([...prev, ...visibleFemaleIds])));
    }
  };
  const handleConfirmDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isDeleting || selectedFemales.length === 0) {
      return;
    }
    const idsToDelete = [...selectedFemales];
    try {
      setIsDeleting(true);
      const chunkSize = 50;
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const chunk = idsToDelete.slice(i, i + chunkSize);
        const {
          error
        } = await supabase.from('females').delete().in('id', chunk).eq('farm_id', farm.farm_id);
        if (error) {
          throw error;
        }
      }
      setFemales(prev => prev.filter(female => !idsToDelete.includes(female.id)));
      setSelectedFemales([]);
      setIsDeleteDialogOpen(false);
      toast({
        title: idsToDelete.length === 1 ? 'Animal excluído' : 'Animais excluídos',
        description: idsToDelete.length === 1 ? 'O animal selecionado foi removido do rebanho.' : `${idsToDelete.length} animais foram removidos do rebanho.`
      });
      await loadFemales(false);
      setTimeout(() => {
        tableRegionRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error('Erro ao excluir animais do rebanho:', error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível excluir as fêmeas selecionadas.';
      toast({
        title: 'Erro ao excluir',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const handleExport = () => {
    if (sortedFemales.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há fêmeas para exportar.",
        variant: "destructive"
      });
      return;
    }

    // Importar XLSX para exportação
    import('xlsx').then(({ utils, writeFile }) => {
      import('@/lib/excel-date-formatter').then(({ autoFormatDateColumns }) => {
        const headers = ['Fazenda', 'Nome', 'Identificador', 'ID CDCB', 'Data Nascimento', 'Ordem de Parto', 'Categoria', 'Fonte', 'Pai NAAB', 'Avô Materno NAAB', 'BisAvô Materno NAAB', 'HHP$', 'TPI', 'NM$', 'CM$', 'FM$', 'GM$', 'F SAV', 'PTAM', 'CFP', 'PTAF', 'PTAF%', 'PTAP', 'PTAP%', 'PL', 'DPR', 'LIV', 'SCS', 'MAST', 'MET', 'RP', 'DA', 'KET', 'MF', 'PTAT', 'UDC', 'FLC', 'SCE', 'DCE', 'SSB', 'DSB', 'H LIV', 'CCR', 'HCR', 'FI', 'GL', 'EFC', 'BWC', 'STA', 'STR', 'DFM', 'RUA', 'RLS', 'RTP', 'FTL', 'RW', 'RLR', 'FTA', 'FLS', 'FUA', 'RUH', 'RUW', 'UCL', 'UDP', 'FTP', 'RFI', 'Beta-Casein', 'Kappa-Casein', 'GFI', 'Criado Em', 'Atualizado Em'];
        
        const dataRows = sortedFemales.map(female => [
          farm.farm_name, 
          female.name, 
          female.identifier || '', 
          female.fonte === 'Predição' ? '' : (female.cdcb_id || ''), 
          female.birth_date || '', // Manter como string ISO, será convertido depois
          female.parity_order || '', 
          getAutomaticCategory(female.birth_date, female.parity_order), 
          female.fonte || '', 
          female.sire_naab || '', 
          female.mgs_naab || '', 
          female.mmgs_naab || '', 
          formatPtaValue('HHP$', female.hhp_dollar), 
          formatPtaValue('TPI', female.tpi), 
          formatPtaValue('NM$', female.nm_dollar), 
          formatPtaValue('CM$', female.cm_dollar), 
          formatPtaValue('FM$', female.fm_dollar), 
          formatPtaValue('GM$', female.gm_dollar), 
          formatPtaValue('F SAV', female.f_sav), 
          formatPtaValue('PTAM', female.ptam), 
          formatPtaValue('CFP', female.cfp), 
          formatPtaValue('PTAF', female.ptaf), 
          formatPtaValue('PTAF%', female.ptaf_pct), 
          formatPtaValue('PTAP', female.ptap), 
          formatPtaValue('PTAP%', female.ptap_pct), 
          formatPtaValue('PL', female.pl), 
          formatPtaValue('DPR', female.dpr), 
          formatPtaValue('LIV', female.liv), 
          formatPtaValue('SCS', female.scs), 
          formatPtaValue('MAST', female.mast), 
          formatPtaValue('MET', female.met), 
          formatPtaValue('RP', female.rp), 
          formatPtaValue('DA', female.da),
          female.ket || '', 
          female.mf || '', 
          female.ptat || '', 
          female.udc || '', 
          female.flc || '', 
          female.sce || '', 
          female.dce || '', 
          female.ssb || '', 
          female.dsb || '', 
          female.h_liv || '', 
          female.ccr || '', 
          female.hcr || '', 
          female.fi || '', 
          female.gl || '', 
          female.efc || '', 
          female.bwc || '', 
          female.sta || '', 
          female.str || '', 
          female.dfm || '', 
          female.rua || '', 
          female.rls || '', 
          female.rtp || '', 
          female.ftl || '', 
          female.rw || '', 
          female.rlr || '', 
          female.fta || '', 
          female.fls || '', 
          female.fua || '', 
          female.ruh || '', 
          female.ruw || '', 
          female.ucl || '', 
          female.udp || '', 
          female.ftp || '', 
          female.rfi || '', 
          female.beta_casein || '', 
          female.kappa_casein || '', 
          female.gfi || '', 
          female.created_at || '', 
          female.updated_at || ''
        ]);

        // Criar worksheet
        const worksheet = utils.aoa_to_sheet([headers, ...dataRows]);
        
        // Aplicar formatação automática de datas
        autoFormatDateColumns(worksheet, headers);
        
        // Criar workbook e exportar
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Fêmeas');
        
        const fileName = `rebanho_${farm.farm_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(workbook, fileName);
        
        toast({
          title: "Exportação concluída",
          description: `${sortedFemales.length} fêmeas exportadas com sucesso!`
        });
      });
    });
  };
  return <div className="min-h-screen bg-background">
      <HelpButton context="herd" />
      
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBack} className="mr-2 bg-slate-200 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-xl font-semibold">{farm.farm_name} - Rebanho</h1>
            <HelpHint content="Gerencie todas as fêmeas da fazenda: visualize, importe, exporte e filtre dados" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {typeof onNavigateToCharts === 'function' ? null : onNavigateToCharts}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header with Category Stats */}
          <div className="grid gap-4 md:grid-cols-6" data-tour="rebanho:cards.contadores">
            {[{
            key: 'total',
            label: 'Total de Fêmeas',
            value: categoryCounts.total,
            testId: 'card-total-femeas',
            icon: <Users className="w-4 h-4" />
          }, {
            key: 'bezerras',
            label: 'Bezerras',
            value: categoryCounts.bezerras,
            testId: 'card-bezerras',
            indicatorColor: 'bg-blue-200'
          }, {
            key: 'novilhas',
            label: 'Novilhas',
            value: categoryCounts.novilhas,
            testId: 'card-novilhas',
            indicatorColor: 'bg-emerald-200'
          }, {
            key: 'primiparas',
            label: 'Primíparas',
            value: categoryCounts.primiparas,
            testId: 'card-primiparas',
            indicatorColor: 'bg-violet-200'
          }, {
            key: 'secundiparas',
            label: 'Secundíparas',
            value: categoryCounts.secundiparas,
            testId: 'card-secundiparas',
            indicatorColor: 'bg-orange-200'
          }, {
            key: 'multiparas',
            label: 'Multíparas',
            value: categoryCounts.multiparas,
            testId: 'card-multiparas',
            indicatorColor: 'bg-rose-200'
          }].map(stat => <Card key={stat.key} data-testid={stat.testId} className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-[#7F1D1D] via-[#B91C1C] to-[#EF4444] text-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                <div className="pointer-events-none absolute inset-0 opacity-80" style={{
              background: 'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 55%)'
            }} aria-hidden="true"></div>
                <CardHeader className="relative z-10 pb-1">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-50 font-bold">
                    {stat.icon && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                          {stat.icon}
                        </span>}
                    <span>{stat.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 pt-0">
                  <div className="text-4xl font-black leading-tight tracking-tight drop-shadow-sm">
                    {stat.value.toLocaleString('pt-BR')}
                  </div>
                </CardContent>
              </Card>)}
          </div>

          {/* Search and Actions */}
          <div className="flex flex-wrap gap-4 items-center" data-tour="rebanho:header.filtro">
            <div className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Buscar por nome ou identificação..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <HelpHint content="Busque por nome, número CDCB ou qualquer identificador do animal" side="bottom" />
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
              <HelpHint content="Filtre o rebanho por ano de nascimento para comparar safras" side="bottom" />
            </div>

            <div className="flex items-center gap-1">
              <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <HelpHint content="Importe dados de fêmeas via CSV ou Excel com validação automática" side="bottom" />
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <HelpHint content="Exporte todos os dados do rebanho incluindo PTAs e pedigree" side="bottom" />
            </div>
          </div>

          {/* Table */}
          <div data-tour="rebanho:tabela.femeas">
            <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Lista do Rebanho</CardTitle>
                <HelpHint content="Clique nos cabeçalhos para ordenar por PTA, pedigree ou informações de produção" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando rebanho...</p>
                </div> : sortedFemales.length === 0 ? <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {females.length === 0 ? 'Nenhuma fêmea cadastrada' : 'Nenhuma fêmea encontrada'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {females.length === 0 ? 'Comece adicionando fêmeas ao seu rebanho.' : 'Tente ajustar os filtros de busca.'}
                  </p>
                  {females.length === 0 && <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Fêmea
                    </Button>}
                </div> : <div ref={tableRegionRef} tabIndex={-1} role="region" aria-label="Tabela do rebanho" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-md">
                  {selectedFemales.length > 0 && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/70 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t('herd.selected.count', {
                      count: selectedFemales.length
                    })}
                        </span>
                        <HelpHint content="Selecione múltiplas fêmeas para aplicar ações em lote" side="bottom" />
                      </div>
                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={open => {
                    if (!isDeleting) {
                      setIsDeleteDialogOpen(open);
                    }
                  }}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting} aria-label={t('actions.delete')}>
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            {t('actions.delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <HelpHint content="Exclui definitivamente as fêmeas selecionadas. Use com cuidado" side="bottom" />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('herd.delete.confirm.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('herd.delete.confirm.message')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                              {t('actions.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {t('actions.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>}
                  <div className="relative">
                    <div className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-md border" style={stickyColumnVars}>
                      <table className="w-full min-w-[1200px] table-auto border-collapse">
                        <thead className="sticky top-0 z-40 bg-foreground text-background shadow-sm [&>tr>th]:sticky [&>tr>th]:top-0 [&>tr>th]:z-40 [&>tr>th]:whitespace-nowrap [&>tr>th]:min-w-max [&>tr>th]:align-middle [&>tr>th]:px-3 [&>tr>th]:py-2 [&>tr>th]:text-left [&>tr>th]:text-xs [&>tr>th]:font-semibold [&>tr>th]:tracking-tight [&>tr>th]:bg-foreground [&>tr>th]:text-background">
                          <tr>
                            <th className="sticky top-0 z-[60] bg-foreground text-background shadow-[6px_0_12px_-6px_rgba(15,23,42,0.45)]" style={stickyColumnStyles.select}>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" ref={selectAllCheckboxRef} checked={allVisibleSelected} onChange={handleSelectAll} className="h-4 w-4" aria-label="Selecionar todas as fêmeas visíveis" />
                            Selecionar
                            <HelpHint content="Marque para selecionar todas as fêmeas exibidas na página" side="bottom" />
                          </div>
                        </th>
                            <SortableHeader
                              column="farm_id"
                              label="Fazenda"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="sticky top-0 z-[55] bg-foreground text-background shadow-[6px_0_12px_-6px_rgba(15,23,42,0.45)] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                              style={stickyColumnStyles.farmId}
                            />
                            <SortableHeader
                              column="name"
                              label="Nome"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="sticky top-0 z-50 bg-foreground text-background shadow-[6px_0_12px_-6px_rgba(15,23,42,0.45)] px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                              style={stickyColumnStyles.name}
                            />
                            <SortableHeader
                              column="identifier"
                              label="Identificador"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="cdcb_identifier"
                              label="ID CDCB"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="sire_naab"
                              label="Pai"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="mgs_naab"
                              label="Avô Materno"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="mmgs_naab"
                              label="Bisavô Materno"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="birth_date"
                              label="Data de Nascimento"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="parity_order"
                              label="Ordem de Parto"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="category"
                              label="Categoria"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            <SortableHeader
                              column="fonte"
                              label="Fonte"
                              sortConfig={femaleSortConfig}
                              onSort={handleSortFemales}
                              className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                            />
                            {ANIMAL_METRIC_COLUMNS.map(column => (
                              <SortableHeader
                                key={column.key}
                                column={column.key}
                                label={column.label}
                                sortConfig={femaleSortConfig}
                                onSort={handleSortFemales}
                                className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap"
                              />
                            ))}
                          </tr>
                        </thead>
                      <tbody className="bg-background [&>tr>td]:border [&>tr>td]:px-3 [&>tr>td]:py-2 [&>tr>td]:text-xs [&>tr>td]:whitespace-nowrap [&>tr>td]:align-middle">
                        {sortedFemales.map(female => {
                          const fonteDisplay = getFonteDisplay(female.fonte);
                          return <tr key={female.id} className="hover:bg-muted/50">
                            <td className="sticky z-30 border bg-background px-3 py-2 text-xs whitespace-nowrap shadow-[6px_0_12px_-6px_rgba(15,23,42,0.3)]" style={stickyColumnStyles.select}>
                              <input type="checkbox" checked={selectedFemales.includes(female.id)} onChange={() => handleSelectFemale(female.id)} className="mr-1" aria-label={`Selecionar ${female.name}`} />
                            </td>
                            <td className="sticky z-20 border bg-background px-3 py-2 text-xs whitespace-nowrap shadow-[6px_0_12px_-6px_rgba(15,23,42,0.3)]" style={stickyColumnStyles.farmId}>{farm.farm_name}</td>
                            <td className="sticky z-10 border bg-background px-3 py-2 text-xs font-medium whitespace-nowrap shadow-[6px_0_12px_-6px_rgba(15,23,42,0.3)]" style={stickyColumnStyles.name}>{female.name}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.identifier || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.fonte === 'Predição' ? '-' : (female.cdcb_id || '-')}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{renderPedigreeCell(female.sire_naab)}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{renderPedigreeCell(female.mgs_naab)}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{renderPedigreeCell(female.mmgs_naab)}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">
                              {female.birth_date ? formatDate(female.birth_date) : '-'}
                              {female.birth_date && <span className="text-muted-foreground ml-1">
                                  ({getAge(female.birth_date)})
                                </span>}
                            </td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.parity_order || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">
                              <Badge variant="outline" className={getAutomaticCategory(female.birth_date, female.parity_order) === 'Bezerra' ? 'bg-blue-50 text-blue-700 border-blue-200' : getAutomaticCategory(female.birth_date, female.parity_order) === 'Novilha' ? 'bg-green-50 text-green-700 border-green-200' : getAutomaticCategory(female.birth_date, female.parity_order) === 'Primípara' ? 'bg-purple-50 text-purple-700 border-purple-200' : getAutomaticCategory(female.birth_date, female.parity_order) === 'Secundípara' ? 'bg-orange-50 text-orange-700 border-orange-200' : getAutomaticCategory(female.birth_date, female.parity_order) === 'Multípara' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}>
                                {getAutomaticCategory(female.birth_date, female.parity_order)}
                              </Badge>
                            </td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">
                              {fonteDisplay.label === '—' ? <span className="text-muted-foreground">—</span> : <Badge variant="outline" className={fonteDisplay.className}>{fonteDisplay.label}</Badge>}
                            </td>
                            {ANIMAL_METRIC_COLUMNS.map(column => (
                              <td key={column.key} className="border px-3 py-2 text-xs whitespace-nowrap">
                                {formatMetricValue(female, column.key) as React.ReactNode}
                              </td>
                            ))}
                            </tr>;
                        })}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </div>}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <FemaleUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onImportSuccess={loadFemales} farmId={farm.farm_id} farmName={farm.farm_name} />
    </div>;
};
export default HerdPage;