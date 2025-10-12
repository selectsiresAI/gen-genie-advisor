import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Search, Plus, Upload, Download, TrendingUp, Trash2, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FemaleUploadModal from './FemaleUploadModal';
import { useHerdStore } from '@/hooks/useHerdStore';
import { fetchFemalesDenormByFarm, isCompleteFemaleRow, type CompleteFemaleDenormRow } from '@/supabase/queries/females';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { t } from '@/lib/i18n';
import { TutorialButtons } from "@/features/tutorial/TutorialButtons";
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
  const getAutomaticCategory = (birthDate?: string, parityOrder?: number) => {
    if (!birthDate) return 'Indefinida';
    const birth = new Date(birthDate);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

    // Bezerras - até 90 dias pós nascimento e ordem de parto 0 ou null
    if (daysDiff <= 90 && (!parityOrder || parityOrder === 0)) {
      return 'Bezerra';
    }

    // Novilhas - de 91 dias após nascimento até primeiro parto (ordem de parto 0 ou null)
    if (daysDiff > 90 && (!parityOrder || parityOrder === 0)) {
      return 'Novilha';
    }

    // Primípara - ordem de parto 1
    if (parityOrder === 1) {
      return 'Primípara';
    }

    // Secundípara - ordem de parto 2
    if (parityOrder === 2) {
      return 'Secundípara';
    }

    // Multípara - ordem de parto 3 ou maior
    if (parityOrder && parityOrder >= 3) {
      return 'Multípara';
    }
    return 'Indefinida';
  };
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
    const counts = {
      total: females.length,
      bezerras: 0,
      novilhas: 0,
      primiparas: 0,
      secundiparas: 0,
      multiparas: 0
    };
    females.forEach(female => {
      const category = getAutomaticCategory(female.birth_date, female.parity_order);
      switch (category) {
        case 'Bezerra':
          counts.bezerras++;
          break;
        case 'Novilha':
          counts.novilhas++;
          break;
        case 'Primípara':
          counts.primiparas++;
          break;
        case 'Secundípara':
          counts.secundiparas++;
          break;
        case 'Multípara':
          counts.multiparas++;
          break;
      }
    });
    return counts;
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
  const visibleFemaleIds = useMemo(() => filteredFemales.map(female => female.id), [filteredFemales]);
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
    if (filteredFemales.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há fêmeas para exportar.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV with all columns from females_denorm
    const headers = ['ID Fazenda', 'Nome', 'ID CDCB', 'Identificador', 'Data Nascimento', 'Ordem de Parto', 'Categoria', 'Fonte', 'Pai NAAB', 'Avô Materno NAAB', 'BisAvô Materno NAAB', 'HHP$', 'TPI', 'NM$', 'CM$', 'FM$', 'GM$', 'F SAV', 'PTAM', 'CFP', 'PTAF', 'PTAF%', 'PTAP', 'PTAP%', 'PL', 'DPR', 'LIV', 'SCS', 'MAST', 'MET', 'RP', 'DA', 'KET', 'MF', 'PTAT', 'UDC', 'FLC', 'SCE', 'DCE', 'SSB', 'DSB', 'H LIV', 'CCR', 'HCR', 'FI', 'GL', 'EFC', 'BWC', 'STA', 'STR', 'DFM', 'RUA', 'RLS', 'RTP', 'FTL', 'RW', 'RLR', 'FTA', 'FLS', 'FUA', 'RUH', 'RUW', 'UCL', 'UDP', 'FTP', 'RFI', 'Beta-Casein', 'Kappa-Casein', 'GFI', 'Criado Em', 'Atualizado Em'];
    const csvData = filteredFemales.map(female => [farm.farm_id, female.name, female.cdcb_id || '', female.identifier || '', female.birth_date ? formatDate(female.birth_date) : '', female.parity_order || '', getAutomaticCategory(female.birth_date, female.parity_order), female.fonte || '', female.sire_naab || '', female.mgs_naab || '', female.mmgs_naab || '', female.hhp_dollar || '', female.tpi || '', female.nm_dollar || '', female.cm_dollar || '', female.fm_dollar || '', female.gm_dollar || '', female.f_sav || '', female.ptam || '', female.cfp || '', female.ptaf || '', female.ptaf_pct || '', female.ptap || '', female.ptap_pct || '', female.pl || '', female.dpr || '', female.liv || '', female.scs || '', female.mast || '', female.met || '', female.rp || '', female.da || '', female.ket || '', female.mf || '', female.ptat || '', female.udc || '', female.flc || '', female.sce || '', female.dce || '', female.ssb || '', female.dsb || '', female.h_liv || '', female.ccr || '', female.hcr || '', female.fi || '', female.gl || '', female.efc || '', female.bwc || '', female.sta || '', female.str || '', female.dfm || '', female.rua || '', female.rls || '', female.rtp || '', female.ftl || '', female.rw || '', female.rlr || '', female.fta || '', female.fls || '', female.fua || '', female.ruh || '', female.ruw || '', female.ucl || '', female.udp || '', female.ftp || '', female.rfi || '', female.beta_casein || '', female.kappa_casein || '', female.gfi || '', formatDate(female.created_at), female.updated_at ? formatDate(female.updated_at) : '']);

    // Convert to CSV format
    const csvContent = [headers.join(','), ...csvData.map(row => row.map(cell => {
      // Escape commas and quotes in cell content
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebanho_${farm.farm_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Exportação concluída",
      description: `${filteredFemales.length} fêmeas exportadas com sucesso!`
    });
  };
  return <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onBack} className="mr-2 bg-slate-200 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-xl font-semibold">{farm.farm_name} - Rebanho</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {onNavigateToCharts}
            <TutorialButtons slug="rebanho" />
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
                  <CardTitle className="flex items-center gap-3 text-sm uppercase tracking-wide text-slate-50 font-bold">
                    {stat.icon ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
                          {stat.icon}
                        </span> : <span className={`h-2.5 w-2.5 rounded-full ${stat.indicatorColor || 'bg-white/60'}`}></span>}
                    {stat.label}
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
          <div className="flex gap-4 items-center" data-tour="rebanho:header.filtro">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Buscar por nome ou identificação..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ano nascimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-years">Todos os anos</SelectItem>
                {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Table */}
          <div data-tour="rebanho:tabela.femeas">
            <Card>
            <CardHeader>
              <CardTitle>Lista do Rebanho</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando rebanho...</p>
                </div> : filteredFemales.length === 0 ? <div className="text-center py-8">
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
                      <span className="text-sm font-medium">
                        {t('herd.selected.count', {
                      count: selectedFemales.length
                    })}
                      </span>
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
                  <ScrollArea className="h-[600px] w-full rounded-md border">
                    <div className="w-full overflow-x-auto pb-4">
                      <table className="w-full table-auto border-collapse">
                        <thead className="sticky top-0 z-20 bg-foreground text-background [&>tr>th]:whitespace-nowrap [&>tr>th]:min-w-max [&>tr>th]:align-middle [&>tr>th]:px-3 [&>tr>th]:py-2 [&>tr>th]:text-left [&>tr>th]:text-xs [&>tr>th]:font-semibold [&>tr>th]:tracking-tight">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <input type="checkbox" ref={selectAllCheckboxRef} checked={allVisibleSelected} onChange={handleSelectAll} className="h-4 w-4" />
                                Selecionar
                              </div>
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">ID Fazenda</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Nome</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">ID CDCB / Identificador</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Pai</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Avô Materno</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Bisavô Materno</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Data de Nascimento</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Ordem de Parto</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Categoria</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Fonte</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">HHP$®</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">TPI</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">NM$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">CM$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FM$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">GM$</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">F SAV</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PTAM</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">CFP</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PTAF</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PTAF%</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PTAP</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PTAP%</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PL</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">DPR</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">LIV</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">SCS</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">MAST</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">MET</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RP</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">DA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">KET</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">MF</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">PTAT</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">UDC</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FLC</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">SCE</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">DCE</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">SSB</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">DSB</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">H LIV</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">CCR</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">HCR</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FI</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">GL</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">EFC</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">BWC</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">STA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">STR</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">DFM</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RUA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RLS</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RTP</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FTL</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RW</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RLR</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FTA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FLS</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FUA</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RUH</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RUW</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">UCL</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">UDP</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">FTP</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">RFI</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Beta-Casein</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">Kappa-Casein</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap">GFI</th>
                          </tr>
                        </thead>
                      <tbody className="[&>tr>td]:border [&>tr>td]:px-3 [&>tr>td]:py-2 [&>tr>td]:text-xs [&>tr>td]:whitespace-nowrap [&>tr>td]:align-middle">
                        {filteredFemales.map(female => {
                          const fonteDisplay = getFonteDisplay(female.fonte);
                          return <tr key={female.id} className="hover:bg-muted/50">
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">
                              <input type="checkbox" checked={selectedFemales.includes(female.id)} onChange={() => handleSelectFemale(female.id)} className="mr-1" />
                            </td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{farm.farm_id}</td>
                            <td className="border px-3 py-2 text-xs font-medium whitespace-nowrap">{female.name}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.cdcb_id || female.identifier || '-'}</td>
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
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.hhp_dollar ? Number(female.hhp_dollar).toFixed(0) : '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.tpi || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.nm_dollar || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.cm_dollar || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.fm_dollar || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.gm_dollar || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.f_sav || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ptam || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.cfp || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ptaf || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ptaf_pct || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ptap || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ptap_pct || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.pl || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.dpr || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.liv || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.scs || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.mast || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.met || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rp || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.da || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ket || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.mf || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ptat || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.udc || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.flc || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.sce || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.dce || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ssb || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.dsb || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.h_liv || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ccr || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.hcr || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.fi || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.gl || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.efc || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.bwc || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.sta || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.str || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.dfm || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rua || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rls || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rtp || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ftl || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rw || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rlr || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.fta || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.fls || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.fua || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ruh || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ruw || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ucl || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.udp || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.ftp || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.rfi || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.beta_casein || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.kappa_casein || '-'}</td>
                            <td className="border px-3 py-2 text-xs whitespace-nowrap">{female.gfi || '-'}</td>
                            </tr>;
                        })}
                      </tbody>
                      </table>
                    </div>
                  </ScrollArea>
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