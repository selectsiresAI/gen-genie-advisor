import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dna, Calculator, ArrowRight, TrendingUp, FileSpreadsheet } from 'lucide-react';

interface NexusEntryPageProps {
  onSelectMethod: (method: 'nexus1' | 'nexus2') => void;
}

const NexusEntryPage: React.FC<NexusEntryPageProps> = ({ onSelectMethod }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Nexus - Sistema de Predição Genética
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Escolha o método de predição genética baseado nos dados disponíveis para seu rebanho
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Nexus 1 - Predição Genômica */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Dna className="w-8 h-8 text-primary" />
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
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">
                💡 Ideal quando você possui dados genômicos completos das fêmeas
              </p>
            </div>
            <Button 
              onClick={() => onSelectMethod('nexus1')} 
              className="w-full"
              size="lg"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Usar Nexus 1
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Nexus 2 - Predição por Pedigrê */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Calculator className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl">Nexus 2: Predição por Pedigrê</CardTitle>
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
                <li>• Pesos: Pai (57%) + Avô Mat. (28%) + Bisavô Mat. (15%)</li>
                <li>• Integração com banco de touros</li>
                <li>• Upload de planilhas para processamento em lote</li>
              </ul>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-700 font-medium">
                💡 Ideal quando você tem apenas informações de pedigrê
              </p>
            </div>
            <Button 
              onClick={() => onSelectMethod('nexus2')} 
              className="w-full"
              size="lg"
              variant="secondary"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Usar Nexus 2
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
    </div>
  );
};

export default NexusEntryPage;