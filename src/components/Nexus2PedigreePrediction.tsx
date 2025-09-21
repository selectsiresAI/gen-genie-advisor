import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator } from 'lucide-react';
import PedigreePredictor from './PedigreePredictor';

interface Nexus2PedigreePredictionProps {
  onBack: () => void;
}

const Nexus2PedigreePrediction: React.FC<Nexus2PedigreePredictionProps> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6" />
            Nexus 2: Predição por Pedigrê
          </h2>
          <p className="text-muted-foreground">
            Baseado no pedigrê - Pai (57%) + Avô Materno (28%) + Bisavô Materno (15%)
          </p>
        </div>
      </div>

      {/* Conteúdo do PedigreePredictor */}
      <PedigreePredictor />
    </div>
  );
};

export default Nexus2PedigreePrediction;