import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ArrowLeft, ArrowRight, Download, Info } from "lucide-react";

interface CalculadoraData {
  // Fase 1 - Variáveis de crescimento
  taxaDescarte: number;
  novilhasReferencias: number;
  abortoEmVetustas: number;
  novilhasDe2a12meses: number;
  vacasInseminadasPorMesAtualmente: number;
  novilhasInsemedas: number;
  novilhasInseminadasPorMes: number;
  intervaloEntrePartos: number;
  morteDoRebanhoDesejado: number;
  tamanhoRebanhoDesejado: number;
  novilhasPrecisas: number;
  novilhasElegivelReproducao: number;
  vacasPrenhesPorMesAtualmente: number;

  // Fase 2 - Dados de Concepção
  concepcaoVacas: {
    semenSexado: number;
    convencional: number;
    corte: number;
    embrioes: number;
    embrioesSexado: number;
  };
  concepcaoNovilhas: {
    semenSexado: number;
    convencional: number;
    corte: number;
    embrioes: number;
    embrioesSexado: number;
  };

  // Fase 3 - Estratégia Genética
  novilhas: {
    top: number;
    meio: number;
    inferior: number;
    valorGeneticoMae: number;
    servicoPrimeiro: 'Sêmen sexado' | 'Sêmen convencional' | 'Sêmen de Corte';
    servicoSegundo: 'Sêmen sexado' | 'Sêmen convencional' | 'Sêmen de Corte';
    servicoTerceiro: 'Sêmen sexado' | 'Sêmen convencional' | 'Sêmen de Corte';
  };
  grupoLactacao: {
    top: number;
    meio: number;
    inferior: number;
    valorGeneticoMae: number;
    servicoPrimeiro: 'Sêmen sexado' | 'Sêmen convencional' | 'Sêmen de Corte';
    servicoSegundo: 'Sêmen sexado' | 'Sêmen convencional' | 'Sêmen de Corte';
    servicoTerceiro: 'Sêmen sexado' | 'Sêmen convencional' | 'Sêmen de Corte';
  };

  // Fase 4-7 - Dados calculados
  projecoes?: any;
  investimentos?: any;
  resultados?: any;
}

const defaultData: CalculadoraData = {
  taxaDescarte: 20,
  novilhasReferencias: 3,
  abortoEmVetustas: 15,
  novilhasDe2a12meses: 7.5,
  vacasInseminadasPorMesAtualmente: 330,
  novilhasInsemedas: 40,
  novilhasInseminadasPorMes: 733,
  intervaloEntrePartos: 12.80,
  morteDoRebanhoDesejado: 23.00,
  tamanhoRebanhoDesejado: 1400,
  novilhasPrecisas: 363,
  novilhasElegivelReproducao: 733,
  vacasPrenhesPorMesAtualmente: 143,

  concepcaoVacas: {
    semenSexado: 35,
    convencional: 39,
    corte: 30,
    embrioes: 0,
    embrioesSexado: 40,
  },

  concepcaoNovilhas: {
    semenSexado: 55,
    convencional: 70,
    corte: 60,
    embrioes: 45,
    embrioesSexado: 45,
  },

  novilhas: {
    top: 100,
    meio: 0,
    inferior: 0,
    valorGeneticoMae: 0,
    servicoPrimeiro: 'Sêmen sexado',
    servicoSegundo: 'Sêmen sexado',
    servicoTerceiro: 'Sêmen convencional',
  },

  grupoLactacao: {
    top: 30,
    meio: 50,
    inferior: 20,
    valorGeneticoMae: 0,
    servicoPrimeiro: 'Sêmen sexado',
    servicoSegundo: 'Sêmen convencional',
    servicoTerceiro: 'Sêmen convencional',
  },
};

const FASES = [
  { id: 1, title: "Variáveis de crescimento" },
  { id: 2, title: "Dados de concepção" },
  { id: 3, title: "Estratégia genética" },
  { id: 4, title: "Projeções de inseminação" },
  { id: 5, title: "Doses necessárias" },
  { id: 6, title: "Retorno sobre investimento" },
  { id: 7, title: "Finalizar" },
];

export default function CalculadoraReposicao() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [data, setData] = useState<CalculadoraData>(defaultData);
  const [useReferenceNumbers, setUseReferenceNumbers] = useState(false);

  useEffect(() => {
    // Calcular dados automaticamente quando necessário
    if (currentPhase >= 4) {
      calcularProjecoes();
    }
  }, [data, currentPhase]);

  const calcularProjecoes = () => {
    // Cálculos para as fases 4-7
    const projecoesPorTrimestre = {
      vacas: {
        inseminacoes: 2559,
        trimestre: 640,
        mensal: 213,
        atualizada: 330,
        diferenca: 117,
      },
      novilhas: {
        inseminacoes: 1241,
        trimestre: 310,
        mensal: 103,
        atualizada: 63,
        diferenca: -40,
      },
      total: {
        inseminacoes: 3800,
        trimestre: 950,
        mensal: 316,
        atualizada: 393,
        diferenca: 77,
      }
    };

    // Doses necessárias
    const dosesNecessarias = {
      anual: {
        sexado: 1370,
        convencional: 1849,
        corte: 581,
      },
      mensal: {
        sexado: 114,
        convencional: 154,
        corte: 48,
      },
      semanal: {
        sexado: 26,
        convencional: 36,
        corte: 11,
      }
    };

    // Investimentos e retornos
    const investimentos = {
      custosPorDose: {
        sexado: 200.00,
        convencional: 50.00,
        corte: 20.00,
      },
      investimentoTotal: 378070.00,
      animaisVendidos: [
        { tipo: 'Machos de leite', numero: 401, valorAnimal: 100.00, valorTotal: 40100.00, retorno: 0 },
        { tipo: 'Machos de corte', numero: 72, valorAnimal: 400.00, valorTotal: 28800.00, retorno: 0 },
        { tipo: 'Fêmeas de corte', numero: 72, valorAnimal: 500.00, valorTotal: 36000.00, retorno: 0 },
      ],
      totalVendas: 104900.00,
      retornoSobreInvestimento: -273170.00,
      novilhasNascidas: 481,
      valorNovilhaNascimento: 2000.00,
      valorTotalNovilhas: 962000.00,
      investimentoSemen: 567.02,
    };

    setData(prev => ({
      ...prev,
      projecoes: projecoesPorTrimestre,
      investimentos,
    }));
  };

  const nextPhase = () => {
    if (currentPhase < 7) {
      setCurrentPhase(currentPhase + 1);
    }
  };

  const prevPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    }
  };

  const renderFase1 = () => (
    <TooltipProvider>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Fase 1 - Variáveis de crescimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="use-reference"
              checked={useReferenceNumbers}
              onCheckedChange={(checked) => setUseReferenceNumbers(checked === true)}
            />
            <Label htmlFor="use-reference">Usar números referência</Label>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label>Taxa de descarte</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Referência: 20-25%</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={useReferenceNumbers ? 22.5 : data.taxaDescarte}
                onChange={(e) => setData({...data, taxaDescarte: Number(e.target.value)})}
                className="mt-1"
                disabled={useReferenceNumbers}
              />
            </div>
            <div>
              <Label>Novilhas referenciais</Label>
              <Input
                type="number"
                value={data.novilhasReferencias}
                onChange={(e) => setData({...data, novilhasReferencias: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Aborto em vetustas</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Referência: 10-20%</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={useReferenceNumbers ? 15 : data.abortoEmVetustas}
                onChange={(e) => setData({...data, abortoEmVetustas: Number(e.target.value)})}
                className="mt-1"
                disabled={useReferenceNumbers}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Novilhas de 2 a 12 meses</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Referência: 5-10%</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={useReferenceNumbers ? 7.5 : data.novilhasDe2a12meses}
                onChange={(e) => setData({...data, novilhasDe2a12meses: Number(e.target.value)})}
                className="mt-1"
                disabled={useReferenceNumbers}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label>Intervalo entre partos</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Referência: 12-13 meses</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={useReferenceNumbers ? 12.5 : data.intervaloEntrePartos}
                onChange={(e) => setData({...data, intervaloEntrePartos: Number(e.target.value)})}
                className="mt-1"
                disabled={useReferenceNumbers}
              />
            </div>
            <div>
              <Label>Novilhas mortas e vendidas após nasc. até o parto</Label>
              <Input
                type="number"
                value={data.novilhasInsemedas}
                onChange={(e) => setData({...data, novilhasInsemedas: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Investidas de novilhas</Label>
              <Input
                type="number"
                value={data.novilhasInsemedas}
                onChange={(e) => setData({...data, novilhasInsemedas: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Novilhas inseminadas por mês atualmente</Label>
              <Input
                type="number"
                value={data.vacasPrenhesPorMesAtualmente}
                onChange={(e) => setData({...data, vacasPrenhesPorMesAtualmente: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Número total de vacas lactantes e falnestes</Label>
              <Input
                type="number"
                value={data.novilhasInsemedas}
                onChange={(e) => setData({...data, novilhasInsemedas: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label>Mortes do primeiro parto</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Referência: 20-25%</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                value={useReferenceNumbers ? 22.5 : data.morteDoRebanhoDesejado}
                onChange={(e) => setData({...data, morteDoRebanhoDesejado: Number(e.target.value)})}
                className="mt-1"
                disabled={useReferenceNumbers}
              />
            </div>
            <div>
              <Label>Tamanho do rebanho desejado</Label>
              <Input
                type="number"
                value={data.tamanhoRebanhoDesejado}
                onChange={(e) => setData({...data, tamanhoRebanhoDesejado: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Novilhas precisas</Label>
              <Input
                type="number"
                value={data.novilhasPrecisas}
                onChange={(e) => setData({...data, novilhasPrecisas: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Novilhas elegíveis para reprodução nos próximos 12 meses</Label>
              <Input
                type="number"
                value={data.novilhasElegivelReproducao}
                onChange={(e) => setData({...data, novilhasElegivelReproducao: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Vacas prenhas por mês atualmente</Label>
              <Input
                type="number"
                value={data.vacasPrenhesPorMesAtualmente}
                onChange={(e) => setData({...data, vacasPrenhesPorMesAtualmente: Number(e.target.value)})}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );

  const renderFase2 = () => (
    <TooltipProvider>
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Fase 2 - Dados de concepção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="use-reference-phase2"
              checked={useReferenceNumbers}
              onCheckedChange={(checked) => setUseReferenceNumbers(checked === true)}
            />
            <Label htmlFor="use-reference-phase2">Usar números referência</Label>
          </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Taxa de concepção em vacas</h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Convencional</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Referência: 35-45%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useReferenceNumbers ? 40 : data.concepcaoVacas.convencional}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoVacas: {...data.concepcaoVacas, convencional: Number(e.target.value)}
                  })}
                  className="mt-1"
                  disabled={useReferenceNumbers}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label>Corte</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Referência: 30-40%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useReferenceNumbers ? 35 : data.concepcaoVacas.corte}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoVacas: {...data.concepcaoVacas, corte: Number(e.target.value)}
                  })}
                  className="mt-1"
                  disabled={useReferenceNumbers}
                />
              </div>
              <div>
                <Label>Embriões</Label>
                <Input
                  type="number"
                  value={data.concepcaoVacas.embrioes}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoVacas: {...data.concepcaoVacas, embrioes: Number(e.target.value)}
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Embrião sexado</Label>
                <Input
                  type="number"
                  value={data.concepcaoVacas.embrioesSexado}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoVacas: {...data.concepcaoVacas, embrioesSexado: Number(e.target.value)}
                  })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Taxa de concepção em novilhas</h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Label>Sêmen Sexado</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Referência: 50-60%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useReferenceNumbers ? 55 : data.concepcaoNovilhas.semenSexado}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoNovilhas: {...data.concepcaoNovilhas, semenSexado: Number(e.target.value)}
                  })}
                  className="mt-1"
                  disabled={useReferenceNumbers}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label>Convencional</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Referência: 65-75%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useReferenceNumbers ? 70 : data.concepcaoNovilhas.convencional}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoNovilhas: {...data.concepcaoNovilhas, convencional: Number(e.target.value)}
                  })}
                  className="mt-1"
                  disabled={useReferenceNumbers}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label>Corte</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Referência: 55-65%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={useReferenceNumbers ? 60 : data.concepcaoNovilhas.corte}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoNovilhas: {...data.concepcaoNovilhas, corte: Number(e.target.value)}
                  })}
                  className="mt-1"
                  disabled={useReferenceNumbers}
                />
              </div>
              <div>
                <Label>Embriões</Label>
                <Input
                  type="number"
                  value={data.concepcaoNovilhas.embrioes}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoNovilhas: {...data.concepcaoNovilhas, embrioes: Number(e.target.value)}
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Embrião sexado</Label>
                <Input
                  type="number"
                  value={data.concepcaoNovilhas.embrioesSexado}
                  onChange={(e) => setData({
                    ...data,
                    concepcaoNovilhas: {...data.concepcaoNovilhas, embrioesSexado: Number(e.target.value)}
                  })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );

  const renderFase3 = () => (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            3
          </span>
          Fase 3 - Estratégia genética
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Novilhas */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Novilhas</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-destructive">Top (100%)</span>
                <span className="text-sm font-medium">Meio (0%)</span>
                <span className="text-sm font-medium">Inferior (0%)</span>
              </div>
              
              <div className="relative">
                <Slider
                  value={[data.novilhas.top]}
                  onValueChange={([value]) => {
                    const meio = Math.max(0, 100 - value);
                    setData({
                      ...data,
                      novilhas: {
                        ...data.novilhas,
                        top: value,
                        meio: meio,
                        inferior: 0
                      }
                    });
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="absolute top-full mt-2 w-full flex justify-center">
                  <span className="bg-foreground text-background px-2 py-1 rounded text-xs">100%</span>
                </div>
              </div>

              <div>
                <Label>Valor genético da Mãe</Label>
                <Input
                  type="number"
                  value={data.novilhas.valorGeneticoMae}
                  onChange={(e) => setData({
                    ...data,
                    novilhas: {...data.novilhas, valorGeneticoMae: Number(e.target.value)}
                  })}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>1º serviço</Label>
                  <Select 
                    value={data.novilhas.servicoPrimeiro}
                    onValueChange={(value: any) => setData({
                      ...data,
                      novilhas: {...data.novilhas, servicoPrimeiro: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sêmen sexado">Sêmen sexado</SelectItem>
                      <SelectItem value="Sêmen convencional">Sêmen convencional</SelectItem>
                      <SelectItem value="Sêmen de Corte">Sêmen de Corte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>2º serviço</Label>
                  <Select 
                    value={data.novilhas.servicoSegundo}
                    onValueChange={(value: any) => setData({
                      ...data,
                      novilhas: {...data.novilhas, servicoSegundo: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sêmen sexado">Sêmen sexado</SelectItem>
                      <SelectItem value="Sêmen convencional">Sêmen convencional</SelectItem>
                      <SelectItem value="Sêmen de Corte">Sêmen de Corte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>3º serviço</Label>
                  <Select 
                    value={data.novilhas.servicoTerceiro}
                    onValueChange={(value: any) => setData({
                      ...data,
                      novilhas: {...data.novilhas, servicoTerceiro: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sêmen sexado">Sêmen sexado</SelectItem>
                      <SelectItem value="Sêmen convencional">Sêmen convencional</SelectItem>
                      <SelectItem value="Sêmen de Corte">Sêmen de Corte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Grupo em lactação */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Grupo em lactação</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-destructive">Top (30%)</span>
                <span className="text-sm font-medium">Meio (50%)</span>
                <span className="text-sm font-medium">Inferior (20%)</span>
              </div>
              
              <div className="relative">
                <Slider
                  value={[data.grupoLactacao.top]}
                  onValueChange={([value]) => {
                    const remaining = 100 - value;
                    const meio = Math.min(50, remaining);
                    const inferior = remaining - meio;
                    
                    setData({
                      ...data,
                      grupoLactacao: {
                        ...data.grupoLactacao,
                        top: value,
                        meio: meio,
                        inferior: inferior
                      }
                    });
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="absolute top-full mt-2 w-full flex justify-center">
                  <span className="bg-foreground text-background px-2 py-1 rounded text-xs">30%</span>
                </div>
              </div>

              <div>
                <Label>Valor genético da Mãe</Label>
                <Input
                  type="number"
                  value={data.grupoLactacao.valorGeneticoMae}
                  onChange={(e) => setData({
                    ...data,
                    grupoLactacao: {...data.grupoLactacao, valorGeneticoMae: Number(e.target.value)}
                  })}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>1º serviço</Label>
                  <Select 
                    value={data.grupoLactacao.servicoPrimeiro}
                    onValueChange={(value: any) => setData({
                      ...data,
                      grupoLactacao: {...data.grupoLactacao, servicoPrimeiro: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sêmen sexado">Sêmen sexado</SelectItem>
                      <SelectItem value="Sêmen convencional">Sêmen convencional</SelectItem>
                      <SelectItem value="Sêmen de Corte">Sêmen de Corte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>2º serviço</Label>
                  <Select 
                    value={data.grupoLactacao.servicoSegundo}
                    onValueChange={(value: any) => setData({
                      ...data,
                      grupoLactacao: {...data.grupoLactacao, servicoSegundo: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sêmen sexado">Sêmen sexado</SelectItem>
                      <SelectItem value="Sêmen convencional">Sêmen convencional</SelectItem>
                      <SelectItem value="Sêmen de Corte">Sêmen de Corte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>3º serviço</Label>
                  <Select 
                    value={data.grupoLactacao.servicoTerceiro}
                    onValueChange={(value: any) => setData({
                      ...data,
                      grupoLactacao: {...data.grupoLactacao, servicoTerceiro: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sêmen sexado">Sêmen sexado</SelectItem>
                      <SelectItem value="Sêmen convencional">Sêmen convencional</SelectItem>
                      <SelectItem value="Sêmen de Corte">Sêmen de Corte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div>
            <h4 className="text-center mb-4 font-semibold">Bezerras vivas ao nascer</h4>
            <div className="space-y-2">
              <div className="bg-blue-500 text-white p-2 rounded text-center">
                <div className="text-sm">Substituições necessárias</div>
                <div className="text-lg font-bold">467</div>
              </div>
              <div className="bg-green-500 text-white p-2 rounded text-center">
                <div className="text-sm">Substituições criadas</div>
                <div className="text-lg font-bold">801</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-center mb-4 font-semibold">Novilhas entrando no rebanho em lactação</h4>
            <div className="space-y-2">
              <div className="bg-blue-500 text-white p-2 rounded text-center">
                <div className="text-sm">Novilhas necessárias</div>
                <div className="text-lg font-bold">299</div>
              </div>
              <div className="bg-green-500 text-white p-2 rounded text-center">
                <div className="text-sm">Novilhas criadas</div>
                <div className="text-lg font-bold">481</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFase4 = () => (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            4
          </span>
          Fase 4 - Projeções de inseminação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Projeção de inseminações necessárias baseadas no uso da estratégia selecionada</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left">Inseminações projetadas</th>
                  <th className="border border-gray-300 p-2 text-left">Trimestre</th>
                  <th className="border border-gray-300 p-2 text-left">Mensal</th>
                  <th className="border border-gray-300 p-2 text-left">Inseminações atualizadas</th>
                  <th className="border border-gray-300 p-2 text-left">Diferença</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Vacas</td>
                  <td className="border border-gray-300 p-2">640</td>
                  <td className="border border-gray-300 p-2">213</td>
                  <td className="border border-gray-300 p-2">330</td>
                  <td className="border border-gray-300 p-2">117</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Novilhas</td>
                  <td className="border border-gray-300 p-2">310</td>
                  <td className="border border-gray-300 p-2">103</td>
                  <td className="border border-gray-300 p-2">63</td>
                  <td className="border border-gray-300 p-2 text-red-500">-40</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 font-semibold">950</td>
                  <td className="border border-gray-300 p-2 font-semibold">316</td>
                  <td className="border border-gray-300 p-2 font-semibold">393</td>
                  <td className="border border-gray-300 p-2 font-semibold">77</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Prenhez projetadas produzidas baseadas no uso da estratégia proposta</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left">Prenhez/ano</th>
                  <th className="border border-gray-300 p-2 text-left">Trimestre</th>
                  <th className="border border-gray-300 p-2 text-left">Mensal</th>
                  <th className="border border-gray-300 p-2 text-left">Prenhez atualizadas</th>
                  <th className="border border-gray-300 p-2 text-left">Diferença</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Vacas</td>
                  <td className="border border-gray-300 p-2">230</td>
                  <td className="border border-gray-300 p-2">77</td>
                  <td className="border border-gray-300 p-2">143</td>
                  <td className="border border-gray-300 p-2">66</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Novilhas</td>
                  <td className="border border-gray-300 p-2">179</td>
                  <td className="border border-gray-300 p-2">60</td>
                  <td className="border border-gray-300 p-2">40</td>
                  <td className="border border-gray-300 p-2 text-red-500">20</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 font-semibold">409</td>
                  <td className="border border-gray-300 p-2 font-semibold">137</td>
                  <td className="border border-gray-300 p-2 font-semibold">183</td>
                  <td className="border border-gray-300 p-2 font-semibold">46</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFase5 = () => (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            5
          </span>
          Fase 5 - Doses necessárias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Doses necessárias</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Anual</th>
                  <th className="border border-gray-300 p-2 text-center">Mensal</th>
                  <th className="border border-gray-300 p-2 text-center">Semanal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado</td>
                  <td className="border border-gray-300 p-2 text-center">1370</td>
                  <td className="border border-gray-300 p-2 text-center">114</td>
                  <td className="border border-gray-300 p-2 text-center">26</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Convencional</td>
                  <td className="border border-gray-300 p-2 text-center">1849</td>
                  <td className="border border-gray-300 p-2 text-center">154</td>
                  <td className="border border-gray-300 p-2 text-center">36</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Doses de corte</td>
                  <td className="border border-gray-300 p-2 text-center">581</td>
                  <td className="border border-gray-300 p-2 text-center">48</td>
                  <td className="border border-gray-300 p-2 text-center">11</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFase6 = () => (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            6
          </span>
          Fase 6 - Retorno sobre investimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Doses e embriões necessários */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Doses e embriões necessários</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Vacas</th>
                  <th className="border border-gray-300 p-2 text-center">Novilhas</th>
                  <th className="border border-gray-300 p-2 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado</td>
                  <td className="border border-gray-300 p-2 text-center">314</td>
                  <td className="border border-gray-300 p-2 text-center">1056</td>
                  <td className="border border-gray-300 p-2 text-center">1370</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Convencional</td>
                  <td className="border border-gray-300 p-2 text-center">1664</td>
                  <td className="border border-gray-300 p-2 text-center">185</td>
                  <td className="border border-gray-300 p-2 text-center">1849</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Conv NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões sexado</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Corte</td>
                  <td className="border border-gray-300 p-2 text-center">581</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">581</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">2559</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">1241</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">3800</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Investimento genética */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Investimento genética</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Custo/dose</th>
                  <th className="border border-gray-300 p-2 text-center">Sêmen</th>
                  <th className="border border-gray-300 p-2 text-center">Custo Genética</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 200,00</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 274.000,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Convencional</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 50,00</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 92.450,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Conv NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Sexado NxGen</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Embriões sexado</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 0,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Corte</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 20,00</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 11.620,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">R$ 378.070,00</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Animais vendidos */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Animais vendidos</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-2 text-left"></th>
                  <th className="border border-gray-300 p-2 text-center">Número</th>
                  <th className="border border-gray-300 p-2 text-center">Valor/Animal</th>
                  <th className="border border-gray-300 p-2 text-center">Valor/Total</th>
                  <th className="border border-gray-300 p-2 text-center">Retorno sobre o investimento</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Machos de leite</td>
                  <td className="border border-gray-300 p-2 text-center">401</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 100,00</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 40.100,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Machos de corte</td>
                  <td className="border border-gray-300 p-2 text-center">72</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 400,00</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 28.800,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold">Fêmeas de corte</td>
                  <td className="border border-gray-300 p-2 text-center">72</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 500,00</td>
                  <td className="border border-gray-300 p-2 text-center">R$ 36.000,00</td>
                  <td className="border border-gray-300 p-2 text-center">-</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="border border-gray-300 p-2 font-semibold">Total</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">-</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">R$ 104.900,00</td>
                  <td className="border border-gray-300 p-2 text-center font-semibold text-red-500">-R$ 273.170,00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-500 text-white p-4 rounded text-center">
            <div className="text-sm">Número de novilhas nascidas</div>
            <div className="text-2xl font-bold">481</div>
          </div>
          <div className="bg-blue-500 text-white p-4 rounded text-center">
            <div className="text-sm">Valor da novilha no nascimento</div>
            <div className="text-2xl font-bold">R$ 2.000,00</div>
          </div>
          <div className="bg-gray-500 text-white p-4 rounded text-center">
            <div className="text-sm">Valor total das novilhas</div>
            <div className="text-2xl font-bold">R$ 962.000,00</div>
          </div>
        </div>

        <div className="bg-green-500 text-white p-4 rounded text-center">
          <div className="text-sm">Investimento em sêmen por Novilhas</div>
          <div className="text-2xl font-bold">R$ 567,02</div>
        </div>
      </CardContent>
    </Card>
  );

  const renderFase7 = () => (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-4">
          <span className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
            7
          </span>
          Fase 7 - Finalizar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Botões de ação */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button variant="outline" className="text-red-500 border-red-500">
              Novo cálculo
            </Button>
            <Button variant="outline" className="text-red-500 border-red-500">
              Histórico de cálculos
            </Button>
          </div>
          <Button className="bg-red-500 hover:bg-red-600">
            <Download className="w-4 h-4 mr-2" />
            EXPORTAR
          </Button>
        </div>

        {/* Informações do cálculo */}
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-sm text-gray-600">#412 - Realizado em 17 de Setembro de 2025</p>
        </div>

        {/* Proposta de estratégia genética */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Proposta de estratégia genética</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Grupo em lactação */}
            <div>
              <h4 className="font-semibold mb-2">Grupo em lactação</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="border border-gray-300 p-2">Valor genético da Mãe</th>
                      <th className="border border-gray-300 p-2">%</th>
                      <th className="border border-gray-300 p-2">1º serviço</th>
                      <th className="border border-gray-300 p-2">2º serviço</th>
                      <th className="border border-gray-300 p-2">3º serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">Top</td>
                      <td className="border border-gray-300 p-2 text-center">30%</td>
                      <td className="border border-gray-300 p-2">Sêmen Sexado</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Meio</td>
                      <td className="border border-gray-300 p-2 text-center">50%</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Inferior</td>
                      <td className="border border-gray-300 p-2 text-center">20%</td>
                      <td className="border border-gray-300 p-2">Sêmen de Corte</td>
                      <td className="border border-gray-300 p-2">Sêmen de Corte</td>
                      <td className="border border-gray-300 p-2">Sêmen de Corte</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Deve ser = 100%
              </div>
            </div>

            {/* Novilhas */}
            <div>
              <h4 className="font-semibold mb-2">Novilhas</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-black text-white">
                      <th className="border border-gray-300 p-2">Valor genético da Mãe</th>
                      <th className="border border-gray-300 p-2">%</th>
                      <th className="border border-gray-300 p-2">1º serviço</th>
                      <th className="border border-gray-300 p-2">2º serviço</th>
                      <th className="border border-gray-300 p-2">3º serviço</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2">Top</td>
                      <td className="border border-gray-300 p-2 text-center">100%</td>
                      <td className="border border-gray-300 p-2">Sêmen Sexado</td>
                      <td className="border border-gray-300 p-2">Sêmen Sexado</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Meio</td>
                      <td className="border border-gray-300 p-2 text-center">0%</td>
                      <td className="border border-gray-300 p-2">Sêmen Sexado</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Inferior</td>
                      <td className="border border-gray-300 p-2 text-center">0%</td>
                      <td className="border border-gray-300 p-2">Sêmen Sexado</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                      <td className="border border-gray-300 p-2">Sêmen Convencional</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Deve ser = 100%
              </div>
            </div>
          </div>
        </div>

        {/* Bezerras vivas ao nascer */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Bezerras vivas ao nascer</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Novilhas necessárias</div>
              <div className="text-2xl font-bold text-blue-500">467</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Novilhas criadas</div>
              <div className="text-2xl font-bold text-green-500">801</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-8 mb-4">
            <div className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{width: '58%'}}>
              467
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{width: '100%'}}>
              801
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-sm">
            <div>
              <div className="bg-green-500 text-white p-2 rounded">
                <div>Novilhas criadas</div>
                <div className="font-bold">801</div>
              </div>
            </div>
            <div>
              <div className="bg-blue-500 text-white p-2 rounded">
                <div>Novilhas necessárias</div>
                <div className="font-bold">467</div>
              </div>
            </div>
            <div>
              <div className="bg-green-600 text-white p-2 rounded">
                <div>% Criadas e necessárias</div>
                <div className="font-bold">172%</div>
              </div>
            </div>
            <div>
              <div className="bg-gray-500 text-white p-2 rounded">
                <div>Tamanho do rebanho desejado</div>
                <div className="font-bold">1400</div>
              </div>
            </div>
          </div>
        </div>

        {/* Novilhas entrando no rebanho em lactação */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Novilhas entrando no rebanho em lactação</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">Novilhas necessárias</div>
              <div className="text-2xl font-bold text-blue-500">299</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Novilhas criadas</div>
              <div className="text-2xl font-bold text-green-500">481</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-8 mb-4">
            <div className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{width: '62%'}}>
              299
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{width: '100%'}}>
              481
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-sm">
            <div>
              <div className="bg-green-500 text-white p-2 rounded">
                <div>Novilhas criadas</div>
                <div className="font-bold">481</div>
              </div>
            </div>
            <div>
              <div className="bg-blue-500 text-white p-2 rounded">
                <div>Novilhas necessárias</div>
                <div className="font-bold">299</div>
              </div>
            </div>
            <div>
              <div className="bg-green-600 text-white p-2 rounded">
                <div>% Criadas e necessárias</div>
                <div className="font-bold">161%</div>
              </div>
            </div>
            <div>
              <div className="bg-gray-500 text-white p-2 rounded">
                <div>Tamanho do rebanho desejado</div>
                <div className="font-bold">1400</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de barras */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'Sexado', vacas: 214, novilhas: 1056 },
              { name: 'Convencional', vacas: 1664, novilhas: 185 },
              { name: 'Conv NxGen', vacas: 0, novilhas: 0 },
              { name: 'Sexado NxGen', vacas: 0, novilhas: 0 },
              { name: 'Corte', vacas: 581, novilhas: 0 }
            ]}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="vacas" fill="#3B82F6" />
              <Bar dataKey="novilhas" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 1: return renderFase1();
      case 2: return renderFase2();
      case 3: return renderFase3();
      case 4: return renderFase4();
      case 5: return renderFase5();
      case 6: return renderFase6();
      case 7: return renderFase7();
      default: return renderFase1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Progress indicators */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-center items-center space-x-2 mb-4">
          {FASES.map((fase, index) => (
            <React.Fragment key={fase.id}>
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer ${
                  currentPhase === fase.id
                    ? "bg-destructive text-destructive-foreground"
                    : currentPhase > fase.id
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
                onClick={() => setCurrentPhase(fase.id)}
              >
                {fase.id}
              </div>
              {index < FASES.length - 1 && (
                <div
                  className={`h-0.5 w-12 ${
                    currentPhase > fase.id ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex justify-center items-center space-x-8 text-xs text-gray-600">
          {FASES.map((fase) => (
            <div key={fase.id} className="text-center min-w-0">
              <div className={`font-medium ${currentPhase === fase.id ? "text-destructive" : ""}`}>
                {fase.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current phase content */}
      {renderCurrentPhase()}

      {/* Navigation buttons */}
      <div className="max-w-6xl mx-auto mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={prevPhase}
          disabled={currentPhase === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={nextPhase}
          disabled={currentPhase === 7}
          className="bg-destructive hover:bg-destructive/90"
        >
          Próximo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}