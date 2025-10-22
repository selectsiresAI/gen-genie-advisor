"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { HelpButton } from "@/components/help/HelpButton";
import { HelpHint } from "@/components/help/HelpHint";

interface AGLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  farmName?: string;
  activeStep?: number; // Step atual (0-6 correspondendo aos 7 steps)
}
export default function AGLayout({
  children,
  onBack,
  farmName,
  activeStep = 0
}: AGLayoutProps) {
  // Mapear step atual para contexto de ajuda específico
  const helpContext = activeStep >= 0 && activeStep <= 6 
    ? `auditoria-step${activeStep + 1}` 
    : "auditoria";
  
  return <div className="min-h-screen bg-background">
      <HelpButton context={helpContext} />
      
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-3">
          {onBack && <Button variant="ghost" onClick={onBack} className="mr-2 bg-slate-300 hover:bg-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Auditoria Genética{farmName ? ` — ${farmName}` : ""}</h1>
            <HelpHint content="Análise completa do rebanho em 7 passos: parentesco, top parents, quartis, progressão, comparação e benchmark" />
          </div>
          <p className="text-sm text-muted-foreground">7 passos sequenciais</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <Card className="p-4" data-tour="auditoria:resultados">{children}</Card>
      </div>
    </div>;
}