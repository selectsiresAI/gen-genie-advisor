import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dna, Calendar, ArrowRight, TrendingUp, FileSpreadsheet, Users } from 'lucide-react';
import { TutorialButtons } from "@/features/tutorial/TutorialButtons";
interface NexusEntryPageProps {
  onSelectMethod: (method: 'nexus1' | 'nexus2' | 'nexus3') => void;
}
const NexusEntryPage: React.FC<NexusEntryPageProps> = ({
  onSelectMethod
}) => {
  return <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left space-y-2 md:space-y-1">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3 md:justify-start">
              <TrendingUp className="w-8 h-8 text-primary" />
              Nexus - Sistema de Predição Genética
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto md:mx-0 md:max-w-xl">
              Escolha o método de predição genética baseado nos dados disponíveis para seu rebanho
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <TutorialButtons slug="nexus" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Nexus 1 - Predição Genômica */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Dna className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">Nexus 1: Predição Genômica</CardTitle>
            <p className="text-sm text-muted-foreground">
              Baseado em dados genômicos completos de fêmeas e touros
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Características:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Upload de banco de fêmeas ou uso do rebanho</li>
                <li>• Seleção de 1, 2 ou 3 touros por fêmea</li>
                <li>• Fórmula: ((PTA Fêmea + PTA Touro) / 2) × 0,93</li>
                <li>• Múltiplas predições por fêmea</li>
                <li>• Análise de todos os PTAs disponíveis</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-rose-100">
              <p className="text-xs font-medium text-zinc-950 text-center">Ideal quando você possui dados genômicos completos das fêmeas</p>
            </div>
            <Button onClick={() => onSelectMethod('nexus1')} size="lg" className="w-full text-white bg-red-700 hover:bg-red-600">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Usar Nexus 1
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Nexus 2 - Predição por Pedigrê */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50">
              
            </div>
            <CardTitle className="text-xl">Nexus 2: Predição por Pedigree</CardTitle>
            <p className="text-sm text-muted-foreground">
              Baseado no pedigrê: Pai, Avô e Bisavô Materno
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Características:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Entrada por NAAB dos ancestrais</li>
                <li>• Predição individual ou em lote</li>
                <li>• Pai (57%) + Avô Mat. (28%) + Bisavô Mat. (15%)</li>
                <li>• Integração com banco de touros</li>
                <li>• Upload de planilhas para processamento em lote</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-red-100">
              <p className="text-xs font-medium text-slate-950 text-center">Ideal quando tem apenas informações de pedigree</p>
            </div>
            <Button onClick={() => onSelectMethod('nexus2')} size="lg" variant="secondary" className="w-full text-neutral-50 bg-red-700 hover:bg-red-600">
              <Calendar className="w-4 h-4 mr-2" />
              Usar Nexus 2
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Nexus 3 - Acasalamento em Grupos */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50">
              <Users className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl">Nexus 3: Acasalamento em Grupos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Compare médias anuais das mães e preveja o impacto dos touros escolhidos
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Características:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Seleção de trait com PTAs carregadas via Supabase</li>
                <li>• Médias das mães por ano com edição manual</li>
                <li>• Busca rápida de touros com até 3 slots</li>
                <li>• Gráfico Mães vs. Filhas com projeção Nexus</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-rose-100">
              <p className="text-xs font-medium text-zinc-950 text-center">Ideal para planejar lotes e acasalamentos coletivos</p>
            </div>
            <Button onClick={() => onSelectMethod('nexus3')} size="lg" variant="secondary" className="w-full text-neutral-50 bg-red-700 hover:bg-red-600">
              <Users className="w-4 h-4 mr-2" />
              Usar Nexus 3
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <div className="bg-muted/50 rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="font-semibold mb-2">Qual método escolher?</h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Nexus 1</strong> é mais preciso quando você possui dados genômicos completos das fêmeas do seu rebanho.
            </p>
            <p>
              <strong>Nexus 2</strong> é uma excelente alternativa quando você tem apenas as informações de pedigrê (NAABs dos ancestrais).
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default NexusEntryPage;