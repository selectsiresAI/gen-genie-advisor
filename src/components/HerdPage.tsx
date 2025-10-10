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
import {
  fetchFemalesDenormByFarm,
  isCompleteFemaleRow,
  type CompleteFemaleDenormRow,
  type FemaleSourceAttemptEvent,
} from '@/supabase/queries/females';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { t } from '@/lib/i18n';
import type { PostgrestError } from '@supabase/supabase-js';

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

const HerdPage: React.FC<HerdPageProps> = ({ farm, onBack, onNavigateToCharts }) => {
  const [females, setFemales] = useState<Female[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedFemales, setSelectedFemales] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { setSelectedHerdId, setDashboardCounts } = useHerdStore();
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

    const normalized = fonte
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

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
        "Multíparas": categoryCounts.multiparas,
      };
      
      setSelectedHerdId(farm.farm_id);
      setDashboardCounts(dashboardCounts);
    }
  }, [categoryCounts, farm.farm_id, setSelectedHerdId, setDashboardCounts]);

  const handleSourceAttempt = useCallback((event: FemaleSourceAttemptEvent) => {
    const sourceLabel = `${event.source.type}:${event.source.name}`;

    if (event.status === "start") {
      console.debug(`[HerdPage] Tentando carregar fêmeas via ${sourceLabel}`);
      return;
    }

    if (event.status === "success") {
      console.debug(
        `[HerdPage] ${sourceLabel} retornou ${event.rowCount} linha${event.rowCount === 1 ? "" : "s"}`
      );
      return;
    }

    console.error(
      `[HerdPage] ${sourceLabel} falhou${event.willFallback ? " — tentando fallback" : ""}`,
      event.error
    );
  }, []);

  const loadFemales = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }

      const rows = await fetchFemalesDenormByFarm(farm.farm_id, {
        order: { column: 'created_at', ascending: false },
        onSourceAttempt: handleSourceAttempt,
      });

      const completeRows = rows.filter(isCompleteFemaleRow) as Female[];

      if (rows.length !== completeRows.length) {
        console.warn(
          '[HerdPage] Ignored female rows missing id, name, farm_id or created_at:',
          rows.length - completeRows.length
        );
      }

      console.log(`[HerdPage] Loaded ${completeRows.length} females from females_denorm`);
      setFemales(completeRows);
    } catch (error) {
      console.error('Error loading females:', error);
      const supabaseError = error as PostgrestError | undefined;
      const descriptionMessage =
        supabaseError?.message || (error instanceof Error ? error.message : null);

      toast({
        title: "Erro",
        description:
          descriptionMessage
            ? `Erro ao carregar dados do rebanho: ${descriptionMessage}`
            : "Erro ao carregar dados do rebanho",
        variant: "destructive",
      });
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, [farm.farm_id, handleSourceAttempt, toast]);

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
      const matchesSearch = female.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (female.identifier && female.identifier.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesYear = !selectedYear || selectedYear === "all-years" || (female.birth_date &&
        new Date(female.birth_date).getFullYear().toString() === selectedYear);

      return matchesSearch && matchesYear;
    });
  }, [females, searchTerm, selectedYear]);

  const visibleFemaleIds = useMemo(
    () => filteredFemales.map(female => female.id),
    [filteredFemales]
  );

  const selectedVisibleCount = useMemo(
    () => visibleFemaleIds.filter(id => selectedFemales.includes(id)).length,
    [visibleFemaleIds, selectedFemales]
  );

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

    return (
      <div className="flex flex-col leading-tight">
        {code && <span className="font-medium">{code}</span>}
        {name && <span className="text-[11px] text-muted-foreground">{name}</span>}
      </div>
    );
  };

  const handleSelectFemale = (femaleId: string) => {
    setSelectedFemales(prev => 
      prev.includes(femaleId) 
        ? prev.filter(id => id !== femaleId)
        : [...prev, femaleId]
    );
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
        const { error } = await supabase
          .from('females')
          .delete()
          .in('id', chunk)
          .eq('farm_id', farm.farm_id);

        if (error) {
          throw error;
        }
      }

      setFemales(prev => prev.filter(female => !idsToDelete.includes(female.id)));
      setSelectedFemales([]);
      setIsDeleteDialogOpen(false);

      toast({
        title: idsToDelete.length === 1 ? 'Animal excluído' : 'Animais excluídos',
        description: idsToDelete.length === 1
          ? 'O animal selecionado foi removido do rebanho.'
          : `${idsToDelete.length} animais foram removidos do rebanho.`,
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
        variant: 'destructive',
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
        variant: "destructive",
      });
      return;
    }

    // Create CSV with all columns from females_denorm
    const headers = [
      'ID Fazenda',
      'Nome',
      'ID CDCB',
      'Identificador',
      'Data Nascimento',
      'Ordem de Parto',
      'Categoria',
      'Fonte',
      'Pai NAAB',
      'Avô Materno NAAB',
      'BisAvô Materno NAAB',
      'HHP$',
      'TPI',
      'NM$',
      'CM$',
      'FM$',
      'GM$',
      'F SAV',
      'PTAM',
      'CFP',
      'PTAF',
      'PTAF%',
      'PTAP',
      'PTAP%',
      'PL',
      'DPR',
      'LIV',
      'SCS',
      'MAST',
      'MET',
      'RP',
      'DA',
      'KET',
      'MF',
      'PTAT',
      'UDC',
      'FLC',
      'SCE',
      'DCE',
      'SSB',
      'DSB',
      'H LIV',
      'CCR',
      'HCR',
      'FI',
      'GL',
      'EFC',
      'BWC',
      'STA',
      'STR',
      'DFM',
      'RUA',
      'RLS',
      'RTP',
      'FTL',
      'RW',
      'RLR',
      'FTA',
      'FLS',
      'FUA',
      'RUH',
      'RUW',
      'UCL',
      'UDP',
      'FTP',
      'RFI',
      'Beta-Casein',
      'Kappa-Casein',
      'GFI',
      'Criado Em',
      'Atualizado Em'
    ];

    const csvData = filteredFemales.map(female => [
      farm.farm_id,
      female.name,
      female.cdcb_id || '',
      female.identifier || '',
      female.birth_date ? formatDate(female.birth_date) : '',
      female.parity_order || '',
      getAutomaticCategory(female.birth_date, female.parity_order),
      female.fonte || '',
      female.sire_naab || '',
      female.mgs_naab || '',
      female.mmgs_naab || '',
      female.hhp_dollar || '',
      female.tpi || '',
      female.nm_dollar || '',
      female.cm_dollar || '',
      female.fm_dollar || '',
      female.gm_dollar || '',
      female.f_sav || '',
      female.ptam || '',
      female.cfp || '',
      female.ptaf || '',
      female.ptaf_pct || '',
      female.ptap || '',
      female.ptap_pct || '',
      female.pl || '',
      female.dpr || '',
      female.liv || '',
      female.scs || '',
      female.mast || '',
      female.met || '',
      female.rp || '',
      female.da || '',
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
      formatDate(female.created_at),
      female.updated_at ? formatDate(female.updated_at) : ''
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => {
          // Escape commas and quotes in cell content
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
      description: `${filteredFemales.length} fêmeas exportadas com sucesso!`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 justify-between">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-xl font-semibold">{farm.farm_name} - Rebanho</h1>
          </div>
          {onNavigateToCharts && (
            <Button onClick={onNavigateToCharts} className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Ver Gráficos
            </Button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header with Category Stats */}
          <div className="grid gap-4 md:grid-cols-6">
            <Card data-testid="card-total-femeas">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-primary" />
                  Total de Fêmeas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{categoryCounts.total}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-bezerras">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Bezerras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">{categoryCounts.bezerras}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-novilhas">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Novilhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{categoryCounts.novilhas}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-primiparas">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  Primíparas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{categoryCounts.primiparas}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-secundiparas">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Secundíparas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{categoryCounts.secundiparas}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-multiparas">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  Multíparas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{categoryCounts.multiparas}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou identificação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ano nascimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-years">Todos os anos</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Fêmea
            </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Lista do Rebanho</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Carregando rebanho...</p>
                </div>
              ) : filteredFemales.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {females.length === 0 ? 'Nenhuma fêmea cadastrada' : 'Nenhuma fêmea encontrada'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {females.length === 0 
                      ? 'Comece adicionando fêmeas ao seu rebanho.'
                      : 'Tente ajustar os filtros de busca.'
                    }
                  </p>
                  {females.length === 0 && (
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeira Fêmea
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  ref={tableRegionRef}
                  tabIndex={-1}
                  role="region"
                  aria-label="Tabela do rebanho"
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary rounded-md"
                >
                  {selectedFemales.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/70 px-4 py-3">
                      <span className="text-sm font-medium">
                        {t('herd.selected.count', { count: selectedFemales.length })}
                      </span>
                      <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={(open) => {
                          if (!isDeleting) {
                            setIsDeleteDialogOpen(open);
                          }
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={isDeleting}
                            aria-label={t('actions.delete')}
                          >
                            {isDeleting ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
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
                            <AlertDialogAction
                              onClick={handleConfirmDelete}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {t('actions.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  <ScrollArea className="h-[600px] w-full rounded-md border">
                    <div className="min-w-max pb-4">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-muted">
                          <tr className="bg-muted">
                            <th className="border px-2 py-1 text-left text-xs bg-muted">
                              <input
                                type="checkbox"
                                ref={selectAllCheckboxRef}
                                checked={allVisibleSelected}
                                onChange={handleSelectAll}
                                className="mr-1"
                              />
                              Selecionar
                            </th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">ID Fazenda</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Nome</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">ID CDCB</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Pai</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Avô Materno</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Bisavô Materno</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Data de Nascimento</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Ordem de Parto</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Categoria</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Fonte</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">HHP$®</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">TPI</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">NM$</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">CM$</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FM$</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">GM$</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">F SAV</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PTAM</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">CFP</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PTAF</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PTAF%</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PTAP</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PTAP%</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PL</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">DPR</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">LIV</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">SCS</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">MAST</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">MET</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RP</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">DA</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">KET</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">MF</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">PTAT</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">UDC</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FLC</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">SCE</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">DCE</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">SSB</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">DSB</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">H LIV</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">CCR</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">HCR</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FI</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">GL</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">EFC</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">BWC</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">STA</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">STR</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">DFM</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RUA</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RLS</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RTP</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FTL</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RW</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RLR</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FTA</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FLS</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FUA</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RUH</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RUW</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">UCL</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">UDP</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">FTP</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">RFI</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Beta-Casein</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">Kappa-Casein</th>
                          <th className="border px-2 py-1 text-left text-xs bg-muted">GFI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFemales.map((female) => {
                          const fonteDisplay = getFonteDisplay(female.fonte);

                          return (
                            <tr key={female.id} className="hover:bg-muted/50">
                            <td className="border px-2 py-1 text-xs">
                              <input
                                type="checkbox"
                                checked={selectedFemales.includes(female.id)}
                                onChange={() => handleSelectFemale(female.id)}
                                className="mr-1"
                              />
                            </td>
                            <td className="border px-2 py-1 text-xs">{farm.farm_id}</td>
                            <td className="border px-2 py-1 text-xs font-medium">{female.name}</td>
                            <td className="border px-2 py-1 text-xs">{female.cdcb_id || female.identifier || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{renderPedigreeCell(female.sire_naab, female.sire_name)}</td>
                            <td className="border px-2 py-1 text-xs">{renderPedigreeCell(female.mgs_naab, female.mgs_name)}</td>
                            <td className="border px-2 py-1 text-xs">{renderPedigreeCell(female.mmgs_naab, female.mmgs_name)}</td>
                            <td className="border px-2 py-1 text-xs">
                              {female.birth_date ? formatDate(female.birth_date) : '-'} 
                              {female.birth_date && (
                                <span className="text-muted-foreground ml-1">
                                  ({getAge(female.birth_date)})
                                </span>
                              )}
                            </td>
                            <td className="border px-2 py-1 text-xs">{female.parity_order || '-'}</td>
                            <td className="border px-2 py-1 text-xs">
                              <Badge variant="outline" className={
                                getAutomaticCategory(female.birth_date, female.parity_order) === 'Bezerra' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                getAutomaticCategory(female.birth_date, female.parity_order) === 'Novilha' ? 'bg-green-50 text-green-700 border-green-200' :
                                getAutomaticCategory(female.birth_date, female.parity_order) === 'Primípara' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                getAutomaticCategory(female.birth_date, female.parity_order) === 'Secundípara' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                getAutomaticCategory(female.birth_date, female.parity_order) === 'Multípara' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }>
                                {getAutomaticCategory(female.birth_date, female.parity_order)}
                              </Badge>
                            </td>
                            <td className="border px-2 py-1 text-xs">
                              {fonteDisplay.label === '—' ? (
                                <span className="text-muted-foreground">—</span>
                              ) : (
                                <Badge variant="outline" className={fonteDisplay.className}>{fonteDisplay.label}</Badge>
                              )}
                            </td>
                            <td className="border px-2 py-1 text-xs">{female.hhp_dollar ? Number(female.hhp_dollar).toFixed(0) : '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.tpi || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.nm_dollar || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.cm_dollar || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.fm_dollar || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.gm_dollar || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.f_sav || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ptam || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.cfp || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ptaf || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ptaf_pct || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ptap || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ptap_pct || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.pl || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.dpr || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.liv || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.scs || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.mast || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.met || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rp || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.da || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ket || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.mf || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ptat || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.udc || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.flc || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.sce || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.dce || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ssb || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.dsb || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.h_liv || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ccr || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.hcr || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.fi || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.gl || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.efc || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.bwc || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.sta || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.str || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.dfm || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rua || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rls || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rtp || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ftl || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rw || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rlr || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.fta || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.fls || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.fua || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ruh || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ruw || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ucl || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.udp || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.ftp || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.rfi || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.beta_casein || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.kappa_casein || '-'}</td>
                            <td className="border px-2 py-1 text-xs">{female.gfi || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <FemaleUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImportSuccess={loadFemales}
        farmId={farm.farm_id}
        farmName={farm.farm_name}
      />
    </div>
  );
};

export default HerdPage;