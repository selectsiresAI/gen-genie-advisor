import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// Validation schema for female records
interface FemaleRecord {
  farm_id: string;
  name: string;
  identifier?: string;
  cdcb_id?: string;
  birth_date?: string;
  parity_order?: number;
  category?: string;
  sire_naab?: string;
  mgs_naab?: string;
  mmgs_naab?: string;
  beta_casein?: string;
  kappa_casein?: string;
  fonte?: string;
  [key: string]: string | number | undefined;
}

function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[<>]/g, '');
}

function validateNumber(value: unknown, min?: number, max?: number): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  return num;
}

function validateDate(value: unknown): string | null {
  if (!value) return null;
  const dateStr = String(value);
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function validateRecord(record: any, farmId: string): FemaleRecord | null {
  // Try to get name from 'name' or 'identifier' field
  let name = sanitizeString(record.name);
  if (!name && record.identifier) {
    name = sanitizeString(record.identifier);
  }
  
  if (!name || name.length === 0 || name.length > 200) {
    return null;
  }

  const validated: FemaleRecord = {
    farm_id: farmId,
    name,
    identifier: sanitizeString(record.identifier)?.substring(0, 100) || undefined,
    cdcb_id: sanitizeString(record.cdcb_id)?.substring(0, 50) || undefined,
    birth_date: validateDate(record.birth_date) || undefined,
    parity_order: validateNumber(record.parity_order, 0, 20) || undefined,
    category: sanitizeString(record.category)?.substring(0, 50) || undefined,
    sire_naab: sanitizeString(record.sire_naab)?.substring(0, 50) || undefined,
    mgs_naab: sanitizeString(record.mgs_naab)?.substring(0, 50) || undefined,
    mmgs_naab: sanitizeString(record.mmgs_naab)?.substring(0, 50) || undefined,
    beta_casein: sanitizeString(record.beta_casein)?.substring(0, 10) || undefined,
    kappa_casein: sanitizeString(record.kappa_casein)?.substring(0, 10) || undefined,
    fonte: sanitizeString(record.fonte)?.substring(0, 100) || undefined,
  };

  // PTA numeric fields
  const ptaFields = [
    'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
    'f_sav', 'ptam', 'cfp', 'ptaf', 'ptaf_pct', 'ptap', 'ptap_pct',
    'pl', 'dpr', 'liv', 'scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf',
    'ptat', 'udc', 'flc', 'sce', 'dce', 'ssb', 'dsb', 'h_liv', 'ccr', 'hcr',
    'fi', 'gl', 'efc', 'bwc', 'sta', 'str', 'dfm', 'rua', 'rls', 'rtp',
    'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp',
    'ftp', 'rfi', 'gfi'
  ];

  ptaFields.forEach(field => {
    const value = validateNumber(record[field], -10000, 10000);
    if (value !== null) {
      validated[field] = value;
    }
  });

  return validated;
}

function parseCSV(csvContent: string): any[] {
  // Remove BOM if present
  let content = csvContent;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  // Detect delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  console.log(`Detected CSV delimiter: '${delimiter}'`);

  // System-managed fields that should be completely ignored
  const forbiddenFields = ['id', 'farm_id', 'ptas', 'created_at', 'updated_at'];

  // Column name mapping for different CSV formats
  const columnMapping: Record<string, string> = {
    'hhp$': 'hhp_dollar',
    'nm$': 'nm_dollar',
    'cm$': 'cm_dollar',
    'fm$': 'fm_dollar',
    'gm$': 'gm_dollar',
    'ptaf%': 'ptaf_pct',
    'ptap%': 'ptap_pct',
    'h liv': 'h_liv',
    'f sav': 'f_sav',
    'beta-casein': 'beta_casein',
    'kappa-casein': 'kappa_casein',
    'fonte': 'fonte',
  };

  // Parse header row
  const headerLine = lines[0];
  const allHeaders: string[] = [];
  const headerIndices: number[] = []; // Track which columns to keep
  let currentField = '';
  let inQuotes = false;
  let columnIndex = 0;

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      let normalized = currentField.trim().toLowerCase().replace(/\ufeff/g, '');
      // Apply column mapping if exists
      normalized = columnMapping[normalized] || normalized;
      
      // Only include if not a forbidden field
      if (!forbiddenFields.includes(normalized)) {
        allHeaders.push(normalized);
        headerIndices.push(columnIndex);
      }
      
      currentField = '';
      columnIndex++;
    } else {
      currentField += char;
    }
  }
  if (currentField) {
    let normalized = currentField.trim().toLowerCase().replace(/\ufeff/g, '');
    normalized = columnMapping[normalized] || normalized;
    
    if (!forbiddenFields.includes(normalized)) {
      allHeaders.push(normalized);
      headerIndices.push(columnIndex);
    }
  }

  console.log(`Parsed ${allHeaders.length} headers (filtered):`, allHeaders.slice(0, 15));

  // Parse data rows
  const records: any[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    if (!line) continue;

    const allValues: string[] = [];
    currentField = '';
    inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        allValues.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField !== undefined) {
      allValues.push(currentField.trim());
    }

    const record: any = {};
    let hasData = false;

    // Only process columns that we kept from headers
    allHeaders.forEach((header, index) => {
      const columnIdx = headerIndices[index];
      const value = allValues[columnIdx]?.trim().replace(/^"|"$/g, '');
      if (value && value !== '') {
        record[header] = value;
        hasData = true;
      }
    });

    if (hasData) {
      records.push(record);
    }
  }

  console.log(`Parsed ${records.length} records from CSV`);
  return records;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const action = segments[segments.length - 1];

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error("Missing Supabase environment variables");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  // Create client with user's token for auth validation
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();

  if (authError || !user) {
    console.error("Auth error", authError);
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // Create service role client for privileged operations
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (action === "upload") {
    try {
      const formData = await req.formData();
      const file = formData.get("file");
      const farmIdParam = formData.get("farm_id");

      if (!file || !(file instanceof File)) {
        return jsonResponse({ error: "Arquivo inválido" }, 400);
      }

      if (!farmIdParam) {
        return jsonResponse({ error: "farm_id é obrigatório" }, 400);
      }

      const farmId = String(farmIdParam);

      // Check farm access - any user with farm access can import
      const { data: farmAccess } = await supabase
        .from('user_farms')
        .select('role')
        .eq('farm_id', farmId)
        .eq('user_id', user.id)
        .single();

      if (!farmAccess) {
        return jsonResponse({ error: 'Permissão negada: acesso insuficiente à fazenda' }, 403);
      }

      // Read and parse CSV
      const csvContent = await file.text();
      const parsedRecords = parseCSV(csvContent);

      if (parsedRecords.length === 0) {
        return jsonResponse({ error: "Arquivo CSV vazio ou inválido" }, 400);
      }

      if (parsedRecords.length > 5000) {
        return jsonResponse({ error: "Muitos registros. Máximo 5000 por upload." }, 413);
      }

      console.log(`Processing ${parsedRecords.length} records for farm ${farmId}`);

      // Validate and sanitize records
      const validatedRecords: FemaleRecord[] = [];
      const errors: { row: number; error: string }[] = [];

      parsedRecords.forEach((record, index) => {
        const validated = validateRecord(record, farmId);
        if (validated) {
          validatedRecords.push(validated);
        } else {
          errors.push({ row: index + 1, error: 'Campos obrigatórios inválidos ou ausentes' });
        }
      });

      // Detect and remove duplicates within the upload batch
      // Keep the last occurrence of each duplicate (by identifier or name)
      const uniqueRecordsMap = new Map<string, FemaleRecord>();
      let duplicatesRemoved = 0;

      validatedRecords.forEach((record) => {
        // Use identifier if available, otherwise use name as unique key
        const uniqueKey = record.identifier || record.name;
        
        if (uniqueRecordsMap.has(uniqueKey)) {
          duplicatesRemoved++;
        }
        
        // Always keep the latest occurrence (this will overwrite previous duplicates)
        uniqueRecordsMap.set(uniqueKey, record);
      });

      const uniqueRecords = Array.from(uniqueRecordsMap.values());

      if (duplicatesRemoved > 0) {
        console.log(`Removidas ${duplicatesRemoved} duplicatas do arquivo antes da inserção`);
      }

      console.log(`Processando ${uniqueRecords.length} registros únicos (${duplicatesRemoved} duplicatas removidas)`);

      // Insert unique records in batches with UPSERT logic
      const batchSize = 500;
      let inserted = 0;
      const insertErrors: any[] = [];

      for (let i = 0; i < uniqueRecords.length; i += batchSize) {
        const batch = uniqueRecords.slice(i, i + batchSize);
        
        const { data, error: insertError, count } = await supabase
          .from('females')
          .upsert(batch, {
            onConflict: 'farm_id,identifier',
            ignoreDuplicates: false
          })
          .select('id', { count: 'exact' });

        if (insertError) {
          console.error('Insert error:', insertError);
          insertErrors.push(insertError);
        } else {
          // Count is the number of rows affected
          const affected = count || batch.length;
          inserted += affected;
        }
      }

      console.log(`Upload concluído: ${inserted} registros processados (inseridos/atualizados), ${errors.length} erros de validação, ${insertErrors.length} erros de inserção, ${duplicatesRemoved} duplicatas removidas`);

      const importBatchId = crypto.randomUUID();

      return jsonResponse({
        import_batch_id: importBatchId,
        success: true,
        inserted,
        validation_errors: errors.length,
        insert_errors: insertErrors.length,
        duplicates_removed: duplicatesRemoved,
        errors: errors.slice(0, 100),
      });
    } catch (error) {
      console.error("Upload handler error", error);
      return jsonResponse({ error: "Erro ao processar upload", message: String(error) }, 500);
    }
  }

  if (action === "commit") {
    try {
      const { import_batch_id: importBatchId, farm_id: farmId } = await req.json();

      if (!importBatchId) {
        return jsonResponse({ error: "import_batch_id é obrigatório" }, 400);
      }

      console.log(`Commit confirmado para batch ${importBatchId}`);

      return jsonResponse({ status: "completed", import_batch_id: importBatchId });
    } catch (error) {
      console.error("Commit handler error", error);
      return jsonResponse({ error: "Erro ao processar commit" }, 500);
    }
  }

  return jsonResponse({ error: "Not found" }, 404);
});
