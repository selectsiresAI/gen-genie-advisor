import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PedigreePredictor from './PedigreePredictor';
import { Calculator, Dna } from 'lucide-react';

// Existing genomic prediction component placeholder
const GenomicPredictor: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dna className="w-5 h-5" />
          Predição Genômica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 space-y-4">
          <div className="text-lg font-semibold text-muted-foreground">
            Predição com informação genômica pronta
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Esta funcionalidade já existe no sistema atual. Use as abas "Predições por doadora" e "Listagem Consolidada" 
            para calcular predições baseadas em dados genômicos diretos de fêmeas e touros.
          </p>
          <Badge variant="outline">Funcionalidade Existente</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const NexusPredictor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Calculator className="w-6 h-6" />
          Nexus - Sistema de Predição Genética
        </h2>
        <p className="text-muted-foreground">
          Escolha o método de predição baseado nos dados disponíveis
        </p>
      </div>

      <Tabs defaultValue="pedigree" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="genomic" className="flex items-center gap-2">
            <Dna className="w-4 h-4" />
            Nexus 1: Informação Genômica
          </TabsTrigger>
          <TabsTrigger value="pedigree" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Nexus 2: Predição por Pedigrê
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="genomic" className="mt-6">
          <GenomicPredictor />
        </TabsContent>
        
        <TabsContent value="pedigree" className="mt-6">
          <PedigreePredictor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NexusPredictor;
