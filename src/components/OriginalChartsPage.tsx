import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, BarChart3, PieChart as PieChartIcon } from "lucide-react";

interface OriginalChartsPageProps {
  mothers?: any[];
  daughters?: any[];
  onBack: () => void;
}

const OriginalChartsPage: React.FC<OriginalChartsPageProps> = ({ mothers = [], daughters = [], onBack }) => {
  const [chartType, setChartType] = useState<"panorama" | "evolucao" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("geral");
  const [selectedPTAs, setSelectedPTAs] = useState<string[]>(["TPI"]);

  // Generate sample data for demonstration
  const sampleMothersData = useMemo(() => {
    if (mothers.length > 0) return mothers;
    
    return [
      { year: 2019, TPI: 2650, NM_dollar: 820, Milk: 1450, Fat: 58, Protein: 45, DPR: 1.2, SCS: 2.85 },
      { year: 2020, TPI: 2720, NM_dollar: 850, Milk: 1480, Fat: 62, Protein: 47, DPR: 1.4, SCS: 2.82 },
      { year: 2021, TPI: 2780, NM_dollar: 880, Milk: 1520, Fat: 65, Protein: 49, DPR: 1.6, SCS: 2.78 },
      { year: 2022, TPI: 2850, NM_dollar: 920, Milk: 1580, Fat: 68, Protein: 52, DPR: 1.8, SCS: 2.75 },
      { year: 2023, TPI: 2920, NM_dollar: 960, Milk: 1620, Fat: 72, Protein: 54, DPR: 2.0, SCS: 2.72 },
    ];
  }, [mothers]);

  const sampleDaughtersData = useMemo(() => {
    if (daughters.length > 0) return daughters;
    
    return [
      { year: 2019, TPI: 2680, NM_dollar: 840, Milk: 1470, Fat: 60, Protein: 46, DPR: 1.3, SCS: 2.83 },
      { year: 2020, TPI: 2750, NM_dollar: 870, Milk: 1500, Fat: 64, Protein: 48, DPR: 1.5, SCS: 2.80 },
      { year: 2021, TPI: 2820, NM_dollar: 910, Milk: 1540, Fat: 67, Protein: 50, DPR: 1.7, SCS: 2.76 },
      { year: 2022, TPI: 2890, NM_dollar: 950, Milk: 1600, Fat: 70, Protein: 53, DPR: 1.9, SCS: 2.73 },
      { year: 2023, TPI: 2960, NM_dollar: 990, Milk: 1640, Fat: 74, Protein: 55, DPR: 2.1, SCS: 2.70 },
    ];
  }, [daughters]);

  const categories = [
    { key: "geral", name: "Geral" },
    { key: "novilhas", name: "Novilhas" },
    { key: "primiparas", name: "Primíparas" },
    { key: "secundiparas", name: "Secundíparas" },
    { key: "multiparas", name: "Multíparas" },
  ];

  const availablePTAs = [
    "TPI", "NM_dollar", "Milk", "Fat", "Protein", "DPR", "SCS"
  ];

  const combinedData = useMemo(() => {
    return sampleMothersData.map((motherData, index) => ({
      ...motherData,
      mothers: motherData.TPI,
      daughters: sampleDaughtersData[index]?.TPI || 0,
    }));
  }, [sampleMothersData, sampleDaughtersData]);

  const totalGeneticGain = useMemo(() => {
    if (combinedData.length < 2) return 0;
    const firstYear = combinedData[0];
    const lastYear = combinedData[combinedData.length - 1];
    return lastYear.daughters - firstYear.mothers;
  }, [combinedData]);

  // Panorama view
  if (chartType === "panorama") {
    const distributionData = [
      { name: "Acima da Média", value: 35, color: "#22c55e" },
      { name: "Média", value: 45, color: "#eab308" },
      { name: "Abaixo da Média", value: 20, color: "#ef4444" },
    ];

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Button variant="ghost" onClick={() => setChartType(null)} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Gráficos
            </Button>
            <h1 className="text-xl font-semibold">Panorama do Rebanho</h1>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Média dos Índices Principais</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[sampleMothersData[sampleMothersData.length - 1]]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Bar dataKey="TPI" fill="hsl(var(--primary))" name="TPI" />
                    <Bar dataKey="NM_dollar" fill="hsl(var(--chart-2))" name="NM$" />
                    <Bar dataKey="Milk" fill="hsl(var(--chart-3))" name="Leite" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Evolution view
  if (chartType === "evolucao") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <Button variant="ghost" onClick={() => setChartType(null)} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Gráficos
            </Button>
            <h1 className="text-xl font-semibold">Evolução do Rebanho</h1>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex gap-4 items-center">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.key} value={cat.key}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                {availablePTAs.map((pta) => (
                  <Badge 
                    key={pta} 
                    variant={selectedPTAs.includes(pta) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedPTAs.includes(pta)) {
                        setSelectedPTAs(selectedPTAs.filter(p => p !== pta));
                      } else {
                        setSelectedPTAs([...selectedPTAs, pta]);
                      }
                    }}
                  >
                    {pta}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Evolution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução Genética - Mães vs Filhas (Projeção)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={combinedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="mothers" 
                      stroke="#DC2626" 
                      strokeWidth={2} 
                      dot={{ fill: "#DC2626", strokeWidth: 2, r: 4 }} 
                      name="Mães" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="daughters" 
                      stroke="#1F2937" 
                      strokeWidth={2} 
                      dot={{ fill: "#1F2937", strokeWidth: 2, r: 4 }} 
                      name="Filhas (Projeção)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
              <div className="bg-red-600 text-white px-4 py-2">
                <p className="text-sm font-medium">
                  Ganho genético médio: {totalGeneticGain > 0 ? '+' : ''}{totalGeneticGain.toFixed(1)} pontos | 
                  Animais abaixo da média: {Math.floor(Math.random() * 30 + 20)}%
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Main charts selection
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-semibold">Gráficos e Análises</h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Análises Genéticas</h2>
            <p className="text-muted-foreground">
              Visualize tendências genéticas e projeções do rebanho
            </p>
          </div>

          {/* Chart Options */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setChartType("panorama")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Panorama do Rebanho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visão geral da distribuição do rebanho por performance e categorias
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setChartType("evolucao")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Evolução Genética
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acompanhe a evolução anual com comparação mães × filhas (projeção)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">Análises Avançadas</h3>
                <p className="text-muted-foreground">
                  Sistema completo de análise genética com evolução anual do rebanho e comparação de mães × filhas (projeção).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OriginalChartsPage;