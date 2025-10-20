import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function StagingMigrationButton() {
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const handleMigrateBulls = async () => {
    setIsMigrating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      let totalInserted = 0;
      let totalUpdated = 0;
      let remaining = 1;

      // Processar em batches até acabar
      while (remaining > 0) {
        const response = await fetch(
          `https://gzvweejdtycxzxrjplpc.supabase.co/functions/v1/import-bulls/auto-commit`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Batch processed:', data);
        
        totalInserted += data.inserted || 0;
        totalUpdated += data.updated || 0;
        remaining = data.remaining || 0;

        // Atualizar progresso
        toast({
          title: 'Processando...',
          description: `${totalInserted} inseridos, ${totalUpdated} atualizados. ${remaining} restantes.`,
          duration: 2000
        });

        // Se ainda tem registros, continua no próximo loop
        if (remaining === 0) break;
      }

      toast({
        title: 'Migração concluída!',
        description: `${totalInserted} touros inseridos, ${totalUpdated} atualizados.`,
        duration: 5000
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Erro na migração',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Button onClick={handleMigrateBulls} disabled={isMigrating} variant="outline">
      {isMigrating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Migrando touros...
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          Migrar Touros
        </>
      )}
    </Button>
  );
}
