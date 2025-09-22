import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, TrendingUp, Users, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Farm {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  total_females: number;
}

interface FarmSegmentationPageProps {
  farm: Farm;
  onBack: () => void;
}

interface Female {
  id: string;
  name: string;
  identifier?: string;
  ptas?: any;
  segmentation_class?: 'donor' | 'inter' | 'recipient';
  segmentation_score?: number;
  tpi?: number;
  nm_dollar?: number;
  birth_date?: string;
  created_at?: string;
  [key: string]: any; // For additional properties from database
}

interface SegmentationData {
  class: 'donor' | 'inter' | 'recipient';
  label: string;
  count: number;
  percentage: number;
  color: string;
  [key: string]: any; // For chart compatibility
}

const FarmSegmentationPage: React.FC<FarmSegmentationPageProps> = ({ farm, onBack }) => {
  const [females, setFemales] = useState<Female[]>([]);
  const [loading, setLoading] = useState(true);
  const [segmentationMethod, setSegmentationMethod] = useState<'tpi' | 'nm_dollar' | 'custom'>('tpi');
  const [segmentationData, setSegmentationData] = useState<SegmentationData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadFemales();
  }, [farm.farm_id]);

  useEffect(() => {
    calculateSegmentation();
  }, [females, segmentationMethod]);

  const loadFemales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('females_denorm')
        .select('*')
        .eq('farm_id', farm.farm_id);

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

  const calculateSegmentation = () => {
    if (females.length === 0) {
      setSegmentationData([]);
      return;
    }

    // Get the metric based on method
    const getMetricValue = (female: Female) => {
      switch (segmentationMethod) {
        case 'tpi':
          return female.ptas?.tpi || female.tpi || 0;
        case 'nm_dollar':
          return female.ptas?.nm_dollar || female.nm_dollar || 0;
        default:
          return female.segmentation_score || 0;
      }
    };

    // Calculate scores and sort
    const femalesWithScores = females.map(female => ({
      ...female,
      score: getMetricValue(female)
    })).sort((a, b) => (b as any).score - (a as any).score);

    // Define percentiles (top 20% = donors, middle 60% = intermediate, bottom 20% = recipients)
    const donorThreshold = Math.floor(femalesWithScores.length * 0.2);
    const intermediateThreshold = Math.floor(femalesWithScores.length * 0.8);

    // Classify animals
    const classified = femalesWithScores.map((female, index) => {
      let segClass: 'donor' | 'inter' | 'recipient';
      if (index < donorThreshold) {
        segClass = 'donor';
      } else if (index < intermediateThreshold) {
        segClass = 'inter';
      } else {
        segClass = 'recipient';
      }

      return {
        ...female,
        segmentation_class: segClass
      };
    });

    // Calculate statistics
    const counts = {
      donor: classified.filter(f => f.segmentation_class === 'donor').length,
      inter: classified.filter(f => f.segmentation_class === 'inter').length,
      recipient: classified.filter(f => f.segmentation_class === 'recipient').length,
    };

    const total = females.length;
    const data: SegmentationData[] = [
      {
        class: 'donor',
        label: 'Doadoras',
        count: counts.donor,
        percentage: Math.round((counts.donor / total) * 100),
        color: '#22c55e'
      },
      {
        class: 'inter',
        label: 'Intermediárias',
        count: counts.inter,
        percentage: Math.round((counts.inter / total) * 100),
        color: '#f59e0b'
      },
      {
        class: 'recipient',
        label: 'Receptoras',
        count: counts.recipient,
        percentage: Math.round((counts.recipient / total) * 100),
        color: '#ef4444'
      }
    ];

    setSegmentationData(data);
    setFemales(classified);
  };

  const getClassBadge = (segClass?: string) => {
    switch (segClass) {
      case 'donor':
        return <Badge className="bg-green-100 text-green-800">Doadora</Badge>;
      case 'inter':
        return <Badge className="bg-yellow-100 text-yellow-800">Intermediária</Badge>;
      case 'recipient':
        return <Badge className="bg-red-100 text-red-800">Receptora</Badge>;
      default:
        return <Badge variant="outline">Não classificada</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold">{farm.farm_name} - Segmentação</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Segmentação do Rebanho</h2>
            <p className="text-muted-foreground">
              Classifique seus animais por performance genética
            </p>
          </div>

          {/* Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Método de Segmentação</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={segmentationMethod} onValueChange={(value: any) => setSegmentationMethod(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tpi">TPI (Total Performance Index)</SelectItem>
                  <SelectItem value="nm_dollar">NM$ (Net Merit)</SelectItem>
                  <SelectItem value="custom">Índice Customizado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Calculando segmentação...</p>
            </div>
          ) : females.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma fêmea encontrada</h3>
                <p className="text-muted-foreground">
                  Adicione fêmeas ao rebanho para realizar a segmentação.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="w-5 h-5 text-primary" />
                      Total de Animais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{females.length}</div>
                  </CardContent>
                </Card>

                {segmentationData.map((data) => (
                  <Card key={data.class}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{data.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: data.color }}>
                        {data.count}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {data.percentage}% do rebanho
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Segmento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={segmentationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ label, percentage }) => `${label}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {segmentationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quantidade por Segmento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={segmentationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Bar dataKey="count" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Animals Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Animais Classificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Identificação</TableHead>
                        <TableHead>Classificação</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {females.slice(0, 20).map((female) => (
                        <TableRow key={female.id}>
                          <TableCell className="font-medium">{female.name}</TableCell>
                          <TableCell>{female.identifier || '-'}</TableCell>
                          <TableCell>{getClassBadge(female.segmentation_class)}</TableCell>
                          <TableCell>{(female as any).score?.toFixed(0) || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {segmentationMethod.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {females.length > 20 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-muted-foreground">
                        Mostrando 20 de {females.length} animais
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmSegmentationPage;