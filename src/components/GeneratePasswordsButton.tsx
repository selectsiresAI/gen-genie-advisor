import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";

interface PasswordResult {
  email: string;
  password: string;
  success: boolean;
  error?: string;
}

export function GeneratePasswordsButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-passwords');

      if (error) {
        throw error;
      }

      const { successful, failed, results } = data;

      // Criar arquivo CSV com os resultados
      const csvContent = [
        'Email,Senha,Status',
        ...results.map((r: PasswordResult) => 
          `${r.email},${r.password},${r.success ? 'OK' : `Erro: ${r.error}`}`
        )
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `senhas_geradas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Senhas Geradas com Sucesso!",
        description: `${successful} senhas geradas. ${failed > 0 ? `${failed} falharam.` : ''} Arquivo CSV baixado.`,
      });

    } catch (error: any) {
      console.error('Erro ao gerar senhas:', error);
      toast({
        title: "Erro ao Gerar Senhas",
        description: error.message || "Ocorreu um erro ao gerar as senhas.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando Senhas...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Gerar Senhas para Todos os Usuários
        </>
      )}
    </Button>
  );
}
