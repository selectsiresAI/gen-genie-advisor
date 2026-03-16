import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function jsonResponse(_req: Request, body: Record<string, unknown>, status = 200) {
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
  client_id: string;
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
  // Replace comma with dot for Brazilian decimal format (0,02 -> 0.02)
  const numStr = typeof value === 'number' ? String(value) : String(value).replace(',', '.');
  const num = parseFloat(numStr);
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  return num;
}

function validateDate(value: unknown): string | null {
  if (!value) return null;
  const dateStr = String(value).trim();
  
  // Handle Excel serial date numbers (e.g., 45678 = days since 1900-01-01)
  if (/^\d{4,5}$/.test(dateStr)) {
    const excelSerial = parseInt(dateStr, 10);
    // Excel epoch: 1899-12-30 (accounting for Excel's leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + excelSerial * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Brazilian format: dd/mm/yyyy or dd-mm-yyyy
  const brMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Brazilian format with 2-digit year: dd/mm/yy
  const brMatch2 = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/);
  if (brMatch2) {
    const [, day, month, yearShort] = brMatch2;
    const yearNum = parseInt(yearShort);
    // Assume 00-30 = 2000-2030, 31-99 = 1931-1999
    const year = yearNum <= 30 ? 2000 + yearNum : 1900 + yearNum;
    const date = new Date(year, parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // American format: mm/dd/yyyy (common in some exports)
  const usMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    // Only use US format if month > 12 or if BR format already failed
    if (parseInt(month) > 12 || parseInt(day) <= 12) {
      // Already tried BR, skip US if day could be month
    } else {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  // ISO format: yyyy-mm-dd or yyyy/mm/dd
  const isoMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  // Text month formats: "Jan 15, 2024", "15 Jan 2024", "January 15, 2024"
  const monthNames: Record<string, number> = {
    'jan': 0, 'janeiro': 0, 'january': 0,
    'feb': 1, 'fev': 1, 'fevereiro': 1, 'february': 1,
    'mar': 2, 'março': 2, 'march': 2,
    'apr': 3, 'abr': 3, 'abril': 3, 'april': 3,
    'may': 4, 'mai': 4, 'maio': 4,
    'jun': 5, 'junho': 5, 'june': 5,
    'jul': 6, 'julho': 6, 'july': 6,
    'aug': 7, 'ago': 7, 'agosto': 7, 'august': 7,
    'sep': 8, 'set': 8, 'setembro': 8, 'september': 8,
    'oct': 9, 'out': 9, 'outubro': 9, 'october': 9,
    'nov': 10, 'novembro': 10, 'november': 10,
    'dec': 11, 'dez': 11, 'dezembro': 11, 'december': 11,
  };
  
  const textMatch = dateStr.toLowerCase().match(/(\d{1,2})\s*(?:de\s+)?([a-záêíóú]+)(?:\s*(?:de|,)\s*)?(\d{4})/i);
  if (textMatch) {
    const [, day, monthStr, year] = textMatch;
    const monthNum = monthNames[monthStr.toLowerCase().substring(0, 3)];
    if (monthNum !== undefined) {
      const date = new Date(parseInt(year), monthNum, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  // Fallback: try native Date parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
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
    client_id: farmId,
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

  // PTA numeric fields — must match actual DB column names in `females` table
  const ptaFields = [
    'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
    'f_sav', 'pta_milk', 'cfp', 'pta_fat', 'pta_fat_pct', 'pta_protein', 'pta_protein_pct',
    'pta_pl', 'pta_dpr', 'pta_livability', 'pta_scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf_num',
    'pta_ptat', 'pta_udc', 'pta_flc', 'pta_sce', 'pta_sire_sce', 'ssb', 'dsb', 'h_liv',
    'pta_ccr', 'pta_hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str_num', 'dfm', 'rua',
    'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp',
    'ftp', 'rfi', 'gfi', 'pta_bdc'
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

  // Column name mapping: CSV header (lowercase) → DB column name
  const columnMapping: Record<string, string> = {
    // Dollar indices
    'hhp$': 'hhp_dollar',
    'nm$': 'nm_dollar',
    'cm$': 'cm_dollar',
    'fm$': 'fm_dollar',
    'gm$': 'gm_dollar',
    // Production PTAs
    'ptam': 'pta_milk',
    'ptaf': 'pta_fat',
    'ptaf%': 'pta_fat_pct',
    'ptap': 'pta_protein',
    'ptap%': 'pta_protein_pct',
    // Health/fertility PTAs
    'scs': 'pta_scs',
    'pl': 'pta_pl',
    'dpr': 'pta_dpr',
    'liv': 'pta_livability',
    'ccr': 'pta_ccr',
    'hcr': 'pta_hcr',
    // Type/conformation
    'ptat': 'pta_ptat',
    'udc': 'pta_udc',
    'flc': 'pta_flc',
    'str': 'str_num',
    'mf': 'mf_num',
    'bd': 'pta_bdc',
    // Calving
    'sce': 'pta_sce',
    'dce': 'pta_sire_sce',
    // Spaces / special chars
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
    return jsonResponse(req, { error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse(req, { error: "Missing authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    console.error("Missing Supabase environment variables");
    return jsonResponse(req, { error: "Server configuration error" }, 500);
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
    return jsonResponse(req, { error: "Unauthorized" }, 401);
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
        return jsonResponse(req, { error: "Arquivo inválido" }, 400);
      }

      if (!farmIdParam) {
        return jsonResponse(req, { error: "farm_id é obrigatório" }, 400);
      }

      const farmId = String(farmIdParam);

      // Check farm access - any user with farm access can import
      const { data: farmAccess } = await supabase
        .from('user_farms')
        .select('role')
        .eq('client_id', farmId)
        .eq('user_id', user.id)
        .single();

      if (!farmAccess) {
        return jsonResponse(req, { error: 'Permissão negada: acesso insuficiente à fazenda' }, 403);
      }

      // Read and parse CSV
      const csvContent = await file.text();
      const parsedRecords = parseCSV(csvContent);

      if (parsedRecords.length === 0) {
        return jsonResponse(req, { error: "Arquivo CSV vazio ou inválido" }, 400);
      }

      if (parsedRecords.length > 5000) {
        return jsonResponse(req, { error: "Muitos registros. Máximo 5000 por upload." }, 413);
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
            onConflict: 'client_id,identifier',
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

      return jsonResponse(req, {
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
      return jsonResponse(req, { error: "Erro ao processar upload", message: String(error) }, 500);
    }
  }

  if (action === "commit") {
    try {
      const { import_batch_id: importBatchId, farm_id: farmId } = await req.json();

      if (!importBatchId) {
        return jsonResponse(req, { error: "import_batch_id é obrigatório" }, 400);
      }

      console.log(`Commit confirmado para batch ${importBatchId}`);

      return jsonResponse(req, { status: "completed", import_batch_id: importBatchId });
    } catch (error) {
      console.error("Commit handler error", error);
      return jsonResponse(req, { error: "Erro ao processar commit" }, 500);
    }
  }

  return jsonResponse(req, { error: "Not found" }, 404);
});
