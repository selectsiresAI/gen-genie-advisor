import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

export const ImportTechniciansButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsLoading(true);
    
    try {
      // Read CSV file from public folder
      const response = await fetch('/clientes_202510160827.csv');
      const csvText = await response.text();

      // Call edge function
      const { data, error } = await supabase.functions.invoke('import-farm-technicians', {
        body: { csvText }
      });

      if (error) throw error;

      const results = data.results;
      
      toast({
        title: 'Importação concluída!',
        description: `✅ ${results.success} vínculos criados\n⏭️ ${results.skipped} já existentes\n❌ ${results.errors.length} erros`,
        duration: 5000
      });

      if (results.errors.length > 0) {
        console.log('Erros de importação:', results.errors);
      }

    } catch (error) {
      console.error('Error importing technicians:', error);
      toast({
        title: 'Erro na importação',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Importando...
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          Importar Técnicos
        </>
      )}
    </Button>
  );
};
