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
  sire_naab?: string;
  mgs_naab?: string;
  ptas?: any;
  created_at: string;
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
      const { data, error } = await supabase
        .from('females')
        .select('*')
        .eq('farm_id', farm.farm_id)
        .order('created_at', { ascending: false });

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
            <Button variant="outline">
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
                          <td className="border px-2 py-1 text-xs">{female.identifier || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{[female.sire_naab, female.mgs_naab].filter(Boolean).join('/') || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.birth_date ? formatDate(female.birth_date) : '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.hhp_dollar || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.tpi || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.nm_dollar || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.cm_dollar || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.fm_dollar || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.gm_dollar || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.f_sav || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ptam || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.cfp || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ptaf || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ptaf_pct || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ptap || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ptap_pct || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.pl || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.dpr || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.liv || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.scs || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.mast || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.met || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rp || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.da || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ket || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.mf || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ptat || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.udc || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.flc || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.sce || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.dce || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ssb || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.dsb || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.h_liv || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ccr || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.hcr || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.fi || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.gl || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.efc || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.bwc || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.sta || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.str || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.dfm || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rua || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rls || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rtp || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ftl || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rw || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rlr || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.fta || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.fls || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.fua || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ruh || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ruw || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ucl || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.udp || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.ftp || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.rfi || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.beta_casein || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.kappa_casein || '-'}</td>
                          <td className="border px-2 py-1 text-xs">{female.ptas?.gfi || '-'}</td>
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
        onClose={() => {
          setShowUploadModal(false);
          loadFemales(); // Reload data after upload
        }}
        farmId={farm.farm_id}
        farmName={farm.farm_name}
      />
    </div>
  );
};

export default HerdPage;