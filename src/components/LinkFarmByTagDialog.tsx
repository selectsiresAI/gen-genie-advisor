import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LinkIcon, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LinkFarmByTagDialogProps {
  onSuccess?: () => void;
}

interface LinkedFarm {
  id: string;
  nome: string;
  owner_name?: string | null;
  farm_name?: string | null;
  email?: string | null;
  tag: string;
  femeas: number;
}

// Fase 2: técnico digita a TAG curta (cod_ssgen) fornecida pela Gabriely.
// Chama link-farm-by-tag, que resolve pelo uuid, vincula e normaliza pelo Tracker.
export function LinkFarmByTagDialog({ onSuccess }: LinkFarmByTagDialogProps) {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linked, setLinked] = useState<LinkedFarm | null>(null);

  const canSubmit = tag.trim().length >= 1 && !isLoading;

  async function handleLink() {
    if (!canSubmit) return;
    setIsLoading(true);
    setLinked(null);
    try {
      const { data, error } = await supabase.functions.invoke("link-farm-by-tag", {
        body: { tag: tag.trim() },
      });
      if (error) {
        // erro HTTP (404 tag inválida, etc.) — a mensagem vem no context
        const msg = (error as { context?: { error?: string } })?.context?.error
          ?? "Tag não encontrada. Confirme o código com a Gabriely.";
        toast.error(msg);
        return;
      }
      const farm = (data as { farm: LinkedFarm; status: string })?.farm;
      const status = (data as { status: string })?.status;
      setLinked(farm);
      if (status === "already_linked") {
        toast.info(`Você já estava vinculado a ${farm?.nome}.`);
      } else {
        toast.success(`Fazenda ${farm?.nome} vinculada!`);
      }
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error)?.message ?? "Erro ao vincular fazenda.");
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setTag("");
    setLinked(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LinkIcon className="w-4 h-4" />
          Vincular por tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular fazenda por tag</DialogTitle>
          <DialogDescription>
            Informe o código curto (tag) fornecido pela Gabriely. Os dados do cliente
            são preenchidos automaticamente a partir do cadastro oficial.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tag">Tag (código)</Label>
            <Input
              id="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLink(); }}
              placeholder="Ex.: 45"
              autoFocus
            />
          </div>

          {linked && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950">
              <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" /> {linked.nome}
              </div>
              <div className="mt-1 space-y-0.5 text-muted-foreground">
                {linked.farm_name && <div>Fazenda: {linked.farm_name}</div>}
                {linked.email && <div>E-mail: {linked.email}</div>}
                <div>Fêmeas: {linked.femeas}</div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => { setOpen(false); reset(); }}>Fechar</Button>
            <Button onClick={handleLink} disabled={!canSubmit} className="gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Vincular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LinkFarmByTagDialog;
