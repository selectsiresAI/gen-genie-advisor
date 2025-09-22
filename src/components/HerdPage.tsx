import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, Search, Plus, Upload, Download, Filter } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
            <Button variant="outline">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Identificação</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Pai (NAAB)</TableHead>
                      <TableHead>AVÔ Materno</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFemales.map((female) => (
                      <TableRow key={female.id}>
                        <TableCell className="font-medium">{female.name}</TableCell>
                        <TableCell>{female.identifier || '-'}</TableCell>
                        <TableCell>{getAge(female.birth_date)}</TableCell>
                        <TableCell>{female.sire_naab || '-'}</TableCell>
                        <TableCell>{female.mgs_naab || '-'}</TableCell>
                        <TableCell>{formatDate(female.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Ativa</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HerdPage;