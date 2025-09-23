import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Search, Plus, Upload, Download, Filter } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FemaleUploadModal from './FemaleUploadModal';

interface Farm {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  total_females: number;
}

interface HerdPageProps {
  farm: Farm;
  onBack: () => void;
}

interface Female {
  id: string;
  name: string;
  identifier?: string;
  birth_date?: string;
  parity_order?: number;
  category?: string;
  sire_naab?: string;
  mgs_naab?: string;
  farm_id: string;
  created_at: string;
  updated_at?: string;
  cdcb_id?: string;
  mmgs_naab?: string;
  // Genetic traits from females_denorm
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
  gl?: number;
  efc?: number;
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
}

const HerdPage: React.FC<HerdPageProps> = ({ farm, onBack }) => {
  const [females, setFemales] = useState<Female[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFemales();
  }, [farm.farm_id]);

  const loadFemales = async () => {
    try {
      setLoading(true);
      // Load all females by using a high limit to override any default limits
      const { data, error } = await supabase
        .from('females_denorm')
        .select('*')
        .eq('farm_id', farm.farm_id)
        .order('created_at', { ascending: false })
        .limit(10000); // Set high limit to ensure all records are loaded

      if (error) throw error;
      setFemales(data || []);
    } catch (error) {
      console.error('Error loading females:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do rebanho",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredFemales = females.filter(female =>
    female.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (female.identifier && female.identifier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      female.category || '',
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
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold">{farm.farm_name} - Rebanho</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header with Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-5 h-5 text-primary" />
                  Total de Fêmeas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{females.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="w-5 h-5 text-primary" />
                  Filtradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredFemales.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Adicionadas Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {females.filter(f => 
                    new Date(f.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Última Adição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {females.length > 0 ? formatDate(females[0].created_at) : 'N/A'}
                </div>
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
                <div className="overflow-x-auto">
                  <table className="min-w-[2000px] w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border px-2 py-1 text-left text-xs">ID Fazenda</th>
                        <th className="border px-2 py-1 text-left text-xs">Nome</th>
                        <th className="border px-2 py-1 text-left text-xs">ID CDCB</th>
                        <th className="border px-2 py-1 text-left text-xs">Pedigre Pai/Avô Materno/BisaAvô Materno</th>
                        <th className="border px-2 py-1 text-left text-xs">Data de Nascimento</th>
                        <th className="border px-2 py-1 text-left text-xs">Ordem de Parto</th>
                        <th className="border px-2 py-1 text-left text-xs">Categoria</th>
                        <th className="border px-2 py-1 text-left text-xs">HHP$®</th>
                        <th className="border px-2 py-1 text-left text-xs">TPI</th>
                        <th className="border px-2 py-1 text-left text-xs">NM$</th>
                        <th className="border px-2 py-1 text-left text-xs">CM$</th>
                        <th className="border px-2 py-1 text-left text-xs">FM$</th>
                        <th className="border px-2 py-1 text-left text-xs">GM$</th>
                        <th className="border px-2 py-1 text-left text-xs">F SAV</th>
                        <th className="border px-2 py-1 text-left text-xs">PTAM</th>
                        <th className="border px-2 py-1 text-left text-xs">CFP</th>
                        <th className="border px-2 py-1 text-left text-xs">PTAF</th>
                        <th className="border px-2 py-1 text-left text-xs">PTAF%</th>
                        <th className="border px-2 py-1 text-left text-xs">PTAP</th>
                        <th className="border px-2 py-1 text-left text-xs">PTAP%</th>
                        <th className="border px-2 py-1 text-left text-xs">PL</th>
                        <th className="border px-2 py-1 text-left text-xs">DPR</th>
                        <th className="border px-2 py-1 text-left text-xs">LIV</th>
                        <th className="border px-2 py-1 text-left text-xs">SCS</th>
                        <th className="border px-2 py-1 text-left text-xs">MAST</th>
                        <th className="border px-2 py-1 text-left text-xs">MET</th>
                        <th className="border px-2 py-1 text-left text-xs">RP</th>
                        <th className="border px-2 py-1 text-left text-xs">DA</th>
                        <th className="border px-2 py-1 text-left text-xs">KET</th>
                        <th className="border px-2 py-1 text-left text-xs">MF</th>
                        <th className="border px-2 py-1 text-left text-xs">PTAT</th>
                        <th className="border px-2 py-1 text-left text-xs">UDC</th>
                        <th className="border px-2 py-1 text-left text-xs">FLC</th>
                        <th className="border px-2 py-1 text-left text-xs">SCE</th>
                        <th className="border px-2 py-1 text-left text-xs">DCE</th>
                        <th className="border px-2 py-1 text-left text-xs">SSB</th>
                        <th className="border px-2 py-1 text-left text-xs">DSB</th>
                        <th className="border px-2 py-1 text-left text-xs">H LIV</th>
                        <th className="border px-2 py-1 text-left text-xs">CCR</th>
                        <th className="border px-2 py-1 text-left text-xs">HCR</th>
                        <th className="border px-2 py-1 text-left text-xs">FI</th>
                        <th className="border px-2 py-1 text-left text-xs">GL</th>
                        <th className="border px-2 py-1 text-left text-xs">EFC</th>
                        <th className="border px-2 py-1 text-left text-xs">BWC</th>
                        <th className="border px-2 py-1 text-left text-xs">STA</th>
                        <th className="border px-2 py-1 text-left text-xs">STR</th>
                        <th className="border px-2 py-1 text-left text-xs">DFM</th>
                        <th className="border px-2 py-1 text-left text-xs">RUA</th>
                        <th className="border px-2 py-1 text-left text-xs">RLS</th>
                        <th className="border px-2 py-1 text-left text-xs">RTP</th>
                        <th className="border px-2 py-1 text-left text-xs">FTL</th>
                        <th className="border px-2 py-1 text-left text-xs">RW</th>
                        <th className="border px-2 py-1 text-left text-xs">RLR</th>
                        <th className="border px-2 py-1 text-left text-xs">FTA</th>
                        <th className="border px-2 py-1 text-left text-xs">FLS</th>
                        <th className="border px-2 py-1 text-left text-xs">FUA</th>
                        <th className="border px-2 py-1 text-left text-xs">RUH</th>
                        <th className="border px-2 py-1 text-left text-xs">RUW</th>
                        <th className="border px-2 py-1 text-left text-xs">UCL</th>
                        <th className="border px-2 py-1 text-left text-xs">UDP</th>
                        <th className="border px-2 py-1 text-left text-xs">FTP</th>
                        <th className="border px-2 py-1 text-left text-xs">RFI</th>
                        <th className="border px-2 py-1 text-left text-xs">Beta-Casein</th>
                        <th className="border px-2 py-1 text-left text-xs">Kappa-Casein</th>
                        <th className="border px-2 py-1 text-left text-xs">GFI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFemales.map((female) => (
                        <tr key={female.id} className="hover:bg-muted/50">
                          <td className="border px-2 py-1 text-xs">{farm.farm_id}</td>
                          <td className="border px-2 py-1 text-xs font-medium">{female.name}</td>
                          <td className="border px-2 py-1 text-xs">{female.cdcb_id || female.identifier || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{[female.sire_naab, female.mgs_naab, female.mmgs_naab].filter(Boolean).join('/') || '-'}</td>
                          <td className="border px-2 py-1 text-xs">
                            {female.birth_date ? formatDate(female.birth_date) : '-'} 
                            {female.birth_date && (
                              <span className="text-muted-foreground ml-1">
                                ({getAge(female.birth_date)})
                              </span>
                            )}
                          </td>
                          <td className="border px-2 py-1 text-xs">{female.parity_order || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.category || '-'}</td>
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
                      ))}
                    </tbody>
                  </table>
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