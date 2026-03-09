import { supabase } from "@/integrations/supabase/client";

export async function importTechniciansFromCSV(csvContent: string) {
  const { data, error } = await supabase.functions.invoke('import-farm-technicians', {
    body: { csvText: csvContent }
  });

  if (error) {
    console.error("Import error:", error);
    throw error;
  }

  return data;
}

// Auto-execute removido para evitar erros durante carregamento inicial
// A importação de técnicos agora deve ser feita manualmente se necessário
