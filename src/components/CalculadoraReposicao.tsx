import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { GeneticCalculatorProvider } from "@/providers/GeneticCalculatorContext";
import {
  Phase1Growth,
  Phase2Conception,
  Phase3Strategy,
  Phase4Projections,
  Phase5Doses,
  Phase6ROI,
  Phase7Summary,
} from "@/components/calculator";

const FASES = [
  { id: 1, title: "Variáveis de crescimento" },
  { id: 2, title: "Dados de concepção" },
  { id: 3, title: "Estratégia genética" },
  { id: 4, title: "Projeções de inseminação" },
  { id: 5, title: "Doses necessárias" },
  { id: 6, title: "Retorno sobre investimento" },
  { id: 7, title: "Finalizar" },
];

function CalculadoraContent() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [useReferenceNumbers, setUseReferenceNumbers] = useState(false);

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

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 1:
        return (
          <Phase1Growth
            useReferenceNumbers={useReferenceNumbers}
            setUseReferenceNumbers={setUseReferenceNumbers}
          />
        );
      case 2:
        return (
          <Phase2Conception
            useReferenceNumbers={useReferenceNumbers}
            setUseReferenceNumbers={setUseReferenceNumbers}
          />
        );
      case 3:
        return <Phase3Strategy />;
      case 4:
        return <Phase4Projections />;
      case 5:
        return <Phase5Doses />;
      case 6:
        return <Phase6ROI />;
      case 7:
        return <Phase7Summary />;
      default:
        return (
          <Phase1Growth
            useReferenceNumbers={useReferenceNumbers}
            setUseReferenceNumbers={setUseReferenceNumbers}
          />
        );
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
              <div
                className={`font-medium ${
                  currentPhase === fase.id ? "text-destructive" : ""
                }`}
              >
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

export default function CalculadoraReposicao() {
  return (
    <GeneticCalculatorProvider>
      <CalculadoraContent />
    </GeneticCalculatorProvider>
  );
}
