import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProjecaoGenetica from "./ProjecaoGenetica";
import CalculadoraReposicao from "./CalculadoraReposicao";
export default function PlanoApp({
  onBack
}: {
  onBack: () => void;
}) {
  const [activeSubmenu, setActiveSubmenu] = useState<"projecao" | "calculadora" | null>(null);
  if (activeSubmenu === "projecao") {
    return <div className="min-h-screen">
        <div className="p-4 border-b bg-background">
          <Button variant="outline" onClick={() => setActiveSubmenu(null)} className="bg-gray-200 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Menu Plano
          </Button>
        </div>
        <ProjecaoGenetica />
      </div>;
  }
  if (activeSubmenu === "calculadora") {
    return <div className="min-h-screen">
        <div className="p-4 border-b bg-background">
          <Button variant="outline" onClick={() => setActiveSubmenu(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Menu Plano
          </Button>
        </div>
        <CalculadoraReposicao />
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
          <h1 className="text-3xl font-bold text-center mb-2">Plano</h1>
          <p className="text-center text-muted-foreground">
            Escolha uma das funcionalidades abaixo para começar
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Projeção Genética */}
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <span className="text-2xl">🧬</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Projeção Genética</h3>
                <p className="text-gray-600 text-sm">
                  Sistema avançado de simulação genética para bovinos. 
                  Calcule predições de performance e ROI baseado em dados reprodutivos.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  
                  Análise de PTAs e índices genéticos
                </div>
                <div className="flex items-center gap-2">
                  
                  Cálculos de ROI em tempo real
                </div>
                <div className="flex items-center gap-2">
                  
                  Gráficos e relatórios detalhados
                </div>
              </div>
              <Button onClick={() => setActiveSubmenu("projecao")} className="w-full bg-red-700 hover:bg-red-600">
                Acessar Projeção Genética
              </Button>
            </div>
          </div>

          {/* Calculadora de Reposição */}
          <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border border-gray-200">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-red-50">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Calculadora de Reposição</h3>
                <p className="text-gray-600 text-sm">
                  Ferramenta completa para planejamento de reposição de rebanho. 
                  7 fases de análise desde crescimento até retorno do investimento.
                </p>
              </div>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  
                  7 fases de planejamento estruturado
                </div>
                <div className="flex items-center gap-2">
                  
                  Estratégia genética customizável
                </div>
                <div className="flex items-center gap-2">
                  
                  Análise de investimentos e retornos
                </div>
              </div>
              <Button onClick={() => setActiveSubmenu("calculadora")} className="w-full bg-red-700 hover:bg-red-600">
                Acessar Calculadora de Reposição
              </Button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-2">Sistema Integrado de Planejamento</h3>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              O módulo Plano oferece duas ferramentas complementares para otimização genética e 
              planejamento de rebanho. Use ambas para uma estratégia completa de melhoramento genético.
            </p>
          </div>
        </div>
      </div>
    </div>;
}