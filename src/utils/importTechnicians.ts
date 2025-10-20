import { supabase } from "@/integrations/supabase/client";

export async function importTechniciansFromCSV(csvContent: string) {
  console.log("Starting technician import...");
  
  const { data, error } = await supabase.functions.invoke('import-farm-technicians', {
    body: { csvText: csvContent }
  });

  if (error) {
    console.error("Import error:", error);
    throw error;
  }

  console.log("Import result:", data);
  return data;
}

// Auto-execute on module load (runs once when app starts)
if (typeof window !== 'undefined') {
  (async () => {
    try {
      // Fetch CSV from public folder
      const response = await fetch('/clientes_202510160827.csv');
      const csvText = await response.text();
      
      // Check if already imported
      const { count } = await supabase
        .from('user_farms')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'technician');

      // Only import if no technician links exist yet
      if (!count || count === 0) {
        console.log("No technician links found. Starting import...");
        const result = await importTechniciansFromCSV(csvText);
        console.log(`Import completed: ${result.successful} successful, ${result.skipped} skipped, ${result.errors.length} errors`);
      } else {
        console.log("Technician links already exist. Skipping import.");
      }
    } catch (error) {
      console.error("Auto-import failed:", error);
    }
  })();
}
