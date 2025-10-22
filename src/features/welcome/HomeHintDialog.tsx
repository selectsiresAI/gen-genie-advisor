"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Bug, Star, Sparkles } from "lucide-react";
import { useAGFilters } from "@/features/auditoria/store";
function useTenantId(): string | null {
  const filters = useAGFilters();
  const farmId = filters?.farmId;

  if (import.meta.env.MODE !== "production") {
    console.debug("HomeHint tenantId", farmId);
  }

  if (typeof farmId === "string" && farmId.length > 0) return farmId;
  if (typeof farmId === "number" && Number.isFinite(farmId)) return String(farmId);
  return null;
}

function storageKey(userId: string | null, tenantId: string | null) {
  return `toolss:homehint:dismissed:${userId ?? "anon"}:${tenantId ?? "na"}`;
}

type HomeHintDialogProps = {
  userId?: string | null;
};

export default function HomeHintDialog({ userId = null }: HomeHintDialogProps) {
  const tenantId = useTenantId();

  const key = useMemo(() => storageKey(userId, tenantId), [userId, tenantId]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dismissed = localStorage.getItem(key) === "true";
      if (!dismissed) setOpen(true);
    } catch (error) {
      console.warn("HomeHintDialog: unable to access localStorage", error);
    }
  }, [key]);

  function closeDialog() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, "true");
      } catch (error) {
        console.warn("HomeHintDialog: unable to persist preference", error);
      }
    }
    setOpen(false);
  }

  function handleStartTutorial() {
    closeDialog();
    // Tutorial será implementado futuramente
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) {
        closeDialog();
      } else {
        setOpen(true);
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Bem-vindo à Plataforma!
          </DialogTitle>
          <DialogDescription>
            Estamos aqui para ajudar você a aproveitar ao máximo todas as funcionalidades.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="flex gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Central de Ajuda</h4>
              <p className="text-sm text-muted-foreground">
                Acesse FAQs contextuais, guias e vídeos tutoriais pelo botão vermelho no canto inferior direito.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Bug className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Reporte de Erros</h4>
              <p className="text-sm text-muted-foreground">
                Encontrou um bug? Use o botão laranja flutuante para nos avisar rapidamente.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Avalie a Plataforma</h4>
              <p className="text-sm text-muted-foreground">
                Sua opinião é importante! Compartilhe feedback sobre aparência, gráficos e usabilidade.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={closeDialog}
            className="flex-1"
          >
            Entendi
          </Button>
          <Button 
            onClick={handleStartTutorial}
            className="flex-1"
          >
            Iniciar Tutorial
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dica de reset manual (dev): localStorage.removeItem(storageKey("<userId>","<tenantId>"));
