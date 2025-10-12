"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import type { Session } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAGFilters } from "@/features/auditoria/store";

function useSafeSession(): Session | null {
  try {
    return useSession();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("HomeHintDialog: useSession unavailable", error);
    }
    return null;
  }
}

function useTenantId(): string | null {
  const filters = useAGFilters();
  const farmId = filters?.farmId;

  if (process.env.NODE_ENV !== "production") {
    console.debug("HomeHint tenantId", farmId);
  }

  if (typeof farmId === "string" && farmId.length > 0) return farmId;
  if (typeof farmId === "number" && Number.isFinite(farmId)) return String(farmId);
  return null;
}

function storageKey(userId: string | null, tenantId: string | null) {
  return `toolss:homehint:dismissed:${userId ?? "anon"}:${tenantId ?? "na"}`;
}

export default function HomeHintDialog() {
  const session = useSafeSession();
  const userId = session?.user?.id ?? null;
  const tenantId = useTenantId();

  const key = useMemo(() => storageKey(userId, tenantId), [userId, tenantId]);
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

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
        if (dontShow) localStorage.setItem(key, "true");
      } catch (error) {
        console.warn("HomeHintDialog: unable to persist preference", error);
      }
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) {
        closeDialog();
      } else {
        setOpen(true);
      }
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao ToolSS!</DialogTitle>
          <DialogDescription>
            Em caso de dúvidas, clique no botão <strong>Tutorial</strong> no topo da página para ver um tour guiado.
            Você pode abrir o tour a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 text-sm text-muted-foreground">
          Esta mensagem aparece apenas uma vez para cada usuário/fazenda.
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            id="dontshow"
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="dontshow" className="text-sm cursor-pointer">Não mostrar novamente</label>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={closeDialog}>Ok</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Dica de reset manual (dev): localStorage.removeItem(storageKey("<userId>","<tenantId>"));
