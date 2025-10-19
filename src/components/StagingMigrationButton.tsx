import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function StagingMigrationButton() {
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const response = await fetch(
        `https://gzvweejdtycxzxrjplpc.supabase.co/functions/v1/migrate-staging`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na migração');
      }

      const result = await response.json();
      
      // Display passwords if any were generated
      if (result.passwords && result.passwords.length > 0) {
        const passwordsList = result.passwords
          .map((p: { email: string; password: string }) => `${p.email}: ${p.password}`)
          .join('\n');
        
        console.log('🔑 Generated passwords:\n', passwordsList);
        
        toast({
          title: 'Migração concluída com senhas geradas',
          description: `Profiles: ${result.results.profiles.inserted + result.results.profiles.updated}, Farms: ${result.results.farms.inserted + result.results.farms.updated}, Females: ${result.results.females.inserted + result.results.females.updated}. Senhas no console.`,
          duration: 10000,
        });
        
        // Also show an alert with passwords
        alert(`Senhas geradas para novos usuários:\n\n${passwordsList}\n\nCopie e envie para os usuários via email.`);
      } else {
        toast({
          title: 'Migração concluída',
          description: `Profiles: ${result.results.profiles.inserted + result.results.profiles.updated}, Farms: ${result.results.farms.inserted + result.results.farms.updated}, Females: ${result.results.females.inserted + result.results.females.updated}`,
        });
      }

      console.log('Migration results:', result);
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Erro na migração',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Button
      onClick={handleMigrate}
      disabled={isMigrating}
      variant="outline"
      className="gap-2"
    >
      {isMigrating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Migrando...
        </>
      ) : (
        <>
          <Database className="h-4 w-4" />
          Migrar Staging
        </>
      )}
    </Button>
  );
}
