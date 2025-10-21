import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PedigreePredictor from './PedigreePredictor';
import NexusAppOriginal from './NexusApp';
import { Calculator, Dna } from 'lucide-react';

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
            Nexus 2: Predição por Pedigree
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="genomic" className="mt-6">
          <NexusAppOriginal />
        </TabsContent>
        
        <TabsContent value="pedigree" className="mt-6">
          <PedigreePredictor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NexusPredictor;
