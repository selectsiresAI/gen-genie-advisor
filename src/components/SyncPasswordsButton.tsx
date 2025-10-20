import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Key } from "lucide-react";

export function SyncPasswordsButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);

    try {
      const { data, error } = await supabase.functions.invoke('sync-temp-passwords');

      if (error) {
        throw error;
      }

      const { successCount, errorCount, total } = data;

      toast({
        title: "Senhas Sincronizadas!",
        description: `${successCount} de ${total} senhas sincronizadas com sucesso. ${errorCount > 0 ? `${errorCount} falharam.` : ''}`,
      });

      console.log('Resultado completo:', data);

    } catch (error: any) {
      console.error('Erro ao sincronizar senhas:', error);
      toast({
        title: "Erro ao Sincronizar",
        description: error.message || "Ocorreu um erro ao sincronizar as senhas.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isSyncing}
      variant="outline"
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <Key className="h-4 w-4" />
          Sincronizar Senhas
        </>
      )}
    </Button>
  );
}
