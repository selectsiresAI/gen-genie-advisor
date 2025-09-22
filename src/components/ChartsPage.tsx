import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp } from "lucide-react";

interface ChartsPageProps {
  mothers?: any[];
  daughters?: any[];
  onBack: () => void;
}

const ChartsPage: React.FC<ChartsPageProps> = ({ mothers = [], daughters = [], onBack }) => {
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

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {/* TPI Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência TPI por Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mothers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="TPI" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="TPI Médio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* NM$ Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência NM$ por Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mothers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="NM$" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="NM$ Médio"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Milk Production Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Produção de Leite por Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mothers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Milk" 
                      stroke="hsl(var(--chart-3))" 
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.3}
                      name="Produção de Leite"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fat and Protein Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Gordura e Proteína por Ano</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mothers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Bar dataKey="Fat" fill="hsl(var(--chart-4))" name="Gordura" />
                    <Bar dataKey="Protein" fill="hsl(var(--chart-5))" name="Proteína" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Chart (if daughters data available) */}
          {daughters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Comparação: Mães vs Filhas Projetadas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Legend />
                    <Line 
                      data={mothers}
                      type="monotone" 
                      dataKey="TPI" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="TPI Mães"
                    />
                    <Line 
                      data={daughters}
                      type="monotone" 
                      dataKey="TPI" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="TPI Filhas Projetadas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">Análises Avançadas</h3>
                <p className="text-muted-foreground">
                  {mothers.length === 0 
                    ? "Nenhum dado disponível para gráficos. Importe dados do rebanho para visualizar tendências."
                    : `Visualizando dados de ${mothers.length} anos de registros genéticos.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;