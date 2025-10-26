import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { AlertCircle, Bug, Loader2, X } from "lucide-react";
import { z } from "zod";

const errorSchema = z.object({
  description: z.string().trim().min(10, "Descrição deve ter no mínimo 10 caracteres").max(1000),
  url: z.string().optional(),
  userAgent: z.string().optional(),
});

export function ErrorReportButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const session = useSupabaseSession();

  if (!session) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const validated = errorSchema.parse({
        description,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
      
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { error: dbError } = await supabase.from("error_reports").insert({
        description: validated.description,
        url: validated.url,
        user_agent: validated.userAgent,
        status: "new",
        user_id: user.id,
      });

      if (dbError) throw dbError;

      toast({
        title: "Erro reportado!",
        description: "Obrigado por nos ajudar a melhorar.",
      });

      setDescription("");
      setOpen(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0]?.message || "Erro de validação");
      } else {
        console.error("Erro ao enviar report:", err);
        toast({
          variant: "destructive",
          title: "Erro ao enviar",
          description:
            err instanceof Error ? err.message : "Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-110 transition-all bg-orange-500 hover:bg-orange-400 text-white border-orange-600"
            title="Reportar erro ou problema"
          >
            <Bug className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="left"
          className="w-80 p-0"
          sideOffset={10}
        >
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <h4 className="font-semibold text-sm">Reportar Problema</h4>
                  <p className="text-xs text-muted-foreground">
                    Descreva o erro ou bug encontrado
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="error-description">O que aconteceu?</Label>
              <Textarea
                id="error-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Ao clicar em exportar, a página trava..."
                rows={4}
                disabled={loading}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 caracteres
              </p>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Reporte"
                )}
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </>
  );
}
