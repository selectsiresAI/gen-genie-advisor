import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export function StagingMigrationButton() {
  const [isMigrating, setIsMigrating] = useState(false);
  const {
    toast
  } = useToast();
  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const {
        data: session
      } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const response = await fetch(`https://gzvweejdtycxzxrjplpc.supabase.co/functions/v1/migrate-staging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na migração');
      }
      const result = await response.json();
      console.log('📊 Migration completed:', result);

      // Build summary message
      const summary = [`✅ Profiles: ${result.results.profiles.inserted} novos, ${result.results.profiles.updated} atualizados, ${result.results.profiles.errors} erros`, `✅ Farms: ${result.results.farms.inserted} novas, ${result.results.farms.updated} atualizadas, ${result.results.farms.errors} erros`, `✅ Females: ${result.results.females.inserted} novas, ${result.results.females.updated} atualizadas, ${result.results.females.errors} erros`].join('\n');

      // Display passwords if any were generated
      if (result.passwords && result.passwords.length > 0) {
        const passwordsList = result.passwords.map((p: {
          email: string;
          password: string;
        }) => `${p.email}: ${p.password}`).join('\n');
        console.log('🔑 Senhas geradas para novos usuários:\n', passwordsList);
        toast({
          title: `Migração concluída! ${result.passwords.length} senhas geradas`,
          description: `Log ID: ${result.log_id}. Verifique o console para as senhas.`,
          duration: 15000
        });

        // Show alert with passwords for easy copying
        alert(`MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n\n` + `Log ID: ${result.log_id}\n\n` + `${summary}\n\n` + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` + `SENHAS GERADAS PARA NOVOS USUÁRIOS:\n` + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` + `${passwordsList}\n\n` + `⚠️ IMPORTANTE: Copie estas senhas e envie para os usuários via email.\n` + `As senhas também estão disponíveis no console do navegador.`);
      } else {
        toast({
          title: 'Migração concluída com sucesso!',
          description: `Log ID: ${result.log_id}. Nenhuma senha nova foi gerada.`,
          duration: 10000
        });
        alert(`MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n\n` + `Log ID: ${result.log_id}\n\n` + `${summary}\n\n` + `Nenhuma senha nova foi gerada (todos os usuários já existiam).`);
      }
    } catch (error) {
      console.error('❌ Migration error:', error);
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
  return;
}