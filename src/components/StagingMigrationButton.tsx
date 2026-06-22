import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from "@/hooks/useTranslation";

export function StagingMigrationButton() {
  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const handleMigrateBulls = async () => {
    setIsMigrating(true);
    try {
      // Obter token atualizado
      let { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        throw new Error(isEs ? 'Sesión expirada. Inicie sesión nuevamente.' : isEn ? 'Session expired. Please log in again.' : 'Sessão expirada. Faça login novamente.');
      }
      let token = sessionData.session.access_token;
      
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalInvalid = 0;
      let remaining = 1;
      let iterations = 0;
      const MAX_ITERATIONS = 100; // Reduzido porque BATCH_SIZE aumentou

      // Processar em batches até acabar
      while (remaining > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        
        // Renovar token a cada 5 batches para evitar expiração
        if (iterations % 5 === 0) {
          const refreshResult = await supabase.auth.getSession();
          if (refreshResult.data?.session) {
            token = refreshResult.data.session.access_token;
          }
        }

        // Throttle: evitar burst de invocações no Supabase
        if (iterations > 1) {
          await new Promise(r => setTimeout(r, 500));
        }

        const response = await fetch(
          `https://odactdxpecpiyiyaqfgi.supabase.co/functions/v1/import-bulls/auto-commit`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Migration error:', response.status, errorText);
          throw new Error(isEs ? `Error en la migración: ${response.status}` : isEn ? `Migration error: ${response.status}` : `Erro na migração: ${response.status}`);
        }

        const data = await response.json();
        totalInserted += data.inserted || 0;
        totalUpdated += data.updated || 0;
        totalInvalid += data.invalid || 0;
        remaining = data.remaining || 0;

        // Se batch teve 100% de inválidos, parar para evitar loop infinito
        if (data.invalid > 0 && data.inserted === 0 && data.updated === 0) {
          toast({
            title: isEs ? 'Problema detectado' : isEn ? 'Problem detected' : 'Problema detectado',
            description: isEs ? `${totalInvalid} registros inválidos. Verifique el formato del CSV.` : isEn ? `${totalInvalid} invalid records. Check the CSV format.` : `${totalInvalid} registros inválidos. Verifique o formato do CSV.`,
            variant: 'destructive',
            duration: 8000
          });
          break;
        }

        // Atualizar progresso com % concluído
        const progressPercent = remaining > 0 
          ? Math.round(((totalInserted + totalUpdated) / (totalInserted + totalUpdated + remaining)) * 100)
          : 100;
        
        toast({
          title: isEs ? `Procesando... ${progressPercent}%` : isEn ? `Processing... ${progressPercent}%` : `Processando... ${progressPercent}%`,
          description: isEs ? `${totalInserted + totalUpdated} procesados. ${remaining} restantes.` : isEn ? `${totalInserted + totalUpdated} processed. ${remaining} remaining.` : `${totalInserted + totalUpdated} processados. ${remaining} restantes.`,
          duration: 2000
        });

        // Se ainda tem registros, continua no próximo loop
        if (remaining === 0) break;
      }

      // Verificar se atingiu limite
      if (iterations >= MAX_ITERATIONS) {
        toast({
          title: isEs ? 'Límite alcanzado' : isEn ? 'Limit reached' : 'Limite atingido',
          description: isEs ? 'Proceso interrumpido por seguridad. Ejecute nuevamente si es necesario.' : isEn ? 'Process interrupted for safety. Run again if needed.' : 'Processo interrompido por segurança. Execute novamente se necessário.',
          variant: 'destructive',
          duration: 5000
        });
      }

      toast({
        title: isEs ? 'Migración completada!' : isEn ? 'Migration complete!' : 'Migração concluída!',
        description: isEs ? `${totalInserted} toros insertados, ${totalUpdated} actualizados.` : isEn ? `${totalInserted} bulls inserted, ${totalUpdated} updated.` : `${totalInserted} touros inseridos, ${totalUpdated} atualizados.`,
        duration: 5000
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: isEs ? 'Error en la migración' : isEn ? 'Migration error' : 'Erro na migração',
        description: error instanceof Error ? error.message : (isEs ? 'Error desconocido' : isEn ? 'Unknown error' : 'Erro desconhecido'),
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
          {isEs ? "Migrando toros..." : isEn ? "Migrating bulls..." : "Migrando touros..."}
        </>
      ) : (
        <>
          <Database className="h-4 w-4 mr-2" />
          {isEs ? "Migrar Toros" : isEn ? "Migrate Bulls" : "Migrar Touros"}
        </>
      )}
    </Button>
  );
}
