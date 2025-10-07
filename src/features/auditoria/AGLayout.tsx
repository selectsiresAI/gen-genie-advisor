"use client";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AGLayoutProps {
  children: ReactNode;
  onBack?: () => void;
  farmName?: string;
}

export default function AGLayout({ children, onBack, farmName }: AGLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="flex h-16 items-center px-4 gap-3">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="mr-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold">Auditoria Genética{farmName ? ` — ${farmName}` : ""}</h1>
            <p className="text-sm text-muted-foreground">7 passos sequenciais</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <Card className="p-4">{children}</Card>
      </div>
    </div>
  );
}
