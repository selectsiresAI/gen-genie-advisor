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
  if (typeof value === 'number') {
    if (isNaN(value)) return null;
    if (min !== undefined && value < min) return null;
    if (max !== undefined && value > max) return null;
    return value;
  }
  // String parsing: detect US format (comma=thousands, dot=decimal) vs BR (dot=thousands, comma=decimal)
  let s = String(value).trim();
  if (s === '' || s === '-' || s === '--') return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    // Use the rightmost separator as decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Ambiguous: "3,167" could be US thousands (3167) or BR decimal (3.167).
    // Heuristic: if exactly 3 digits after the comma and no other comma, assume US thousands.
    const parts = s.split(',');
    if (parts.length === 2 && /^\d{3}$/.test(parts[1])) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  }
  const num = parseFloat(s);
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  return num;
}

function validateDate(value: unknown): string | null {
  if (!value) return null;
  const dateStr = String(value).trim();

  if (/^\d{4,5}$/.test(dateStr)) {
    const excelSerial = parseInt(dateStr, 10);
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + excelSerial * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const isoMatch = dateStr.match(/^(\d{4})[\-\/](\d{1,2})[\-\/](\d{1,2})$/);
  if (isoMatch) {
    const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const slashMatch = dateStr.match(/^(\d{1,2})[\-\/.](\d{1,2})[\-\/.](\d{2,4})$/);
  if (slashMatch) {
    var a = parseInt(slashMatch[1], 10);
    var b = parseInt(slashMatch[2], 10);
    var c = parseInt(slashMatch[3], 10);
    if (c < 100) c = c <= 30 ? 2000 + c : 1900 + c;
    var day2: number, month2: number;
    if (a > 12) { day2 = a; month2 = b; }
    else if (b > 12) { day2 = b; month2 = a; }
    else { /* ambiguous → assume US format MM/DD/YY */ day2 = b; month2 = a; }
    const date = new Date(c, month2 - 1, day2);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return null;
}

function validateRecord(record: any, farmId: string): FemaleRecord | null {
  let name = sanitizeString(record.name);
  if (!name && record.identifier) {
    name = sanitizeString(record.identifier);
  }
  if (!name || name.length === 0 || name.length > 200) return null;

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

  const ptaFields = [
    'hhp_dollar', 'tpi', 'nm_dollar', 'cm_dollar', 'fm_dollar', 'gm_dollar',
    'f_sav', 'pta_milk', 'cfp', 'pta_fat', 'pta_fat_pct', 'pta_protein', 'pta_protein_pct',
    'pta_pl', 'pta_dpr', 'pta_livability', 'pta_scs', 'mast', 'met', 'rp', 'da', 'ket', 'mf_num',
    'pta_ptat', 'pta_udc', 'pta_flc', 'pta_sce', 'pta_sire_sce', 'ssb', 'dsb', 'h_liv',
    'pta_ccr', 'pta_hcr', 'fi', 'gl', 'efc', 'bwc', 'sta', 'str_num', 'dfm', 'rua',
    'rls', 'rtp', 'ftl', 'rw', 'rlr', 'fta', 'fls', 'fua', 'ruh', 'ruw', 'ucl', 'udp',
    'ftp', 'rfi', 'gfi', 'pta_bdc'
  ];

  ptaFields.forEach(function(field) {
    const value = validateNumber(record[field], -10000, 10000);
    if (value !== null) {
      validated[field] = value;
    }
  });

  return validated;
}

function parseCSV(csvContent: string): any[] {
  let content = csvContent;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  console.log("Detected CSV delimiter: '" + delimiter + "'");

  const forbiddenFields = ['id', 'farm_id', 'client_id', 'ptas', 'created_at', 'updated_at', 'deleted_at'];

  const columnMapping: Record<string, string> = {
    'hhp$': 'hhp_dollar',
    'nm$': 'nm_dollar',
    'cm$': 'cm_dollar',
    'fm$': 'fm_dollar',
    'gm$': 'gm_dollar',
    'ptam': 'pta_milk',
    'ptaf': 'pta_fat',
    'ptaf%': 'pta_fat_pct',
    'ptap': 'pta_protein',
    'ptap%': 'pta_protein_pct',
    'scs': 'pta_scs',
    'pl': 'pta_pl',
    'dpr': 'pta_dpr',
    'liv': 'pta_livability',
    'ccr': 'pta_ccr',
    'hcr': 'pta_hcr',
    'ptat': 'pta_ptat',
    'udc': 'pta_udc',
    'flc': 'pta_flc',
    'str': 'str_num',
    'mf': 'mf_num',
    'bd': 'pta_bdc',
    'sce': 'pta_sce',
    'dce': 'pta_sire_sce',
    'h liv': 'h_liv',
    'f sav': 'f_sav',
    'beta-casein': 'beta_casein',
    'kappa-casein': 'kappa_casein',
    'fonte': 'fonte',
    'tw': 'rw',
  };

  const headerLine = lines[0];
  const allHeaders: string[] = [];
  const headerIndices: number[] = [];
  let currentField = '';
  let inQuotes = false;
  let columnIndex = 0;

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      let normalized = currentField.trim().toLowerCase().replace(/\ufeff/g, '');
      normalized = columnMapping[normalized] || normalized;
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

  console.log("Parsed " + allHeaders.length + " headers");

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

    allHeaders.forEach(function(header, index) {
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

  console.log("Parsed " + records.length + " records from CSV");
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

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseClient.auth.getUser();
  var user = authData?.user;

  if (authError || !user) {
    console.error("Auth error", authError);
    return jsonResponse(req, { error: "Unauthorized" }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (action === "upload") {
    try {
      const formData = await req.formData();
      const file = formData.get("file");
      const farmIdParam = formData.get("farm_id");

      if (!file || !(file instanceof File)) {
        return jsonResponse(req, { error: "Arquivo invalido" }, 400);
      }
      if (!farmIdParam) {
        return jsonResponse(req, { error: "farm_id obrigatorio" }, 400);
      }

      const farmId = String(farmIdParam);

      const { data: farmAccess } = await supabase
        .from('user_farms')
        .select('role')
        .eq('client_id', farmId)
        .eq('user_id', user.id)
        .single();

      if (!farmAccess) {
        return jsonResponse(req, { error: 'Permissao negada' }, 403);
      }

      const csvContent = await file.text();
      const parsedRecords = parseCSV(csvContent);

      if (parsedRecords.length === 0) {
        return jsonResponse(req, { error: "Arquivo CSV vazio ou invalido" }, 400);
      }
      if (parsedRecords.length > 5000) {
        return jsonResponse(req, { error: "Maximo 5000 registros por upload" }, 413);
      }

      console.log("Processing " + parsedRecords.length + " records for farm " + farmId);

      const validatedRecords: FemaleRecord[] = [];
      const errors: { row: number; error: string }[] = [];

      parsedRecords.forEach(function(record, index) {
        const validated = validateRecord(record, farmId);
        if (validated) {
          validatedRecords.push(validated);
        } else {
          errors.push({ row: index + 1, error: 'Invalid or missing required fields' });
        }
      });

      const uniqueRecordsMap = new Map<string, FemaleRecord>();
      let duplicatesRemoved = 0;

      validatedRecords.forEach(function(record) {
        const uniqueKey = record.identifier || record.name;
        if (uniqueRecordsMap.has(uniqueKey)) duplicatesRemoved++;
        uniqueRecordsMap.set(uniqueKey, record);
      });

      const uniqueRecords = Array.from(uniqueRecordsMap.values());
      if (duplicatesRemoved > 0) console.log("Removed " + duplicatesRemoved + " duplicates");
      console.log("Processing " + uniqueRecords.length + " unique records");

      // RPC approach: handles partial unique index that .upsert() cannot
      const batchSize = 200;
      let inserted = 0;
      const insertErrors: any[] = [];

      for (let i = 0; i < uniqueRecords.length; i += batchSize) {
        const batch = uniqueRecords.slice(i, i + batchSize);
        const batchData = batch.map(function(rec) {
          const copy: any = {};
          var keys = Object.keys(rec);
          for (var k = 0; k < keys.length; k++) {
            if (keys[k] !== 'client_id') copy[keys[k]] = rec[keys[k]];
          }
          return copy;
        });

        const { data, error: rpcError } = await supabase.rpc('import_females_json', {
          p_client_id: farmId,
          p_data: batchData,
        });

        if (rpcError) {
          console.error('RPC batch error (offset ' + i + '):', rpcError);
          insertErrors.push(rpcError);
        } else {
          var count = typeof data === 'number' ? data : batch.length;
          inserted += count;
          console.log('RPC batch ' + (i / batchSize) + ': ' + count + ' rows');
        }
      }

      console.log("Upload done: " + inserted + " inserted, " + errors.length + " validation, " + insertErrors.length + " insert errors");

      if (inserted === 0 && insertErrors.length > 0) {
        return jsonResponse(req, {
          success: false,
          error: 'Database write failed',
          insert_errors: insertErrors.length,
          details: insertErrors.slice(0, 5),
        }, 500);
      }

      var importBatchId = crypto.randomUUID();

      return jsonResponse(req, {
        import_batch_id: importBatchId,
        success: true,
        inserted: inserted,
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
      const body = await req.json();
      var batchId = body.import_batch_id;
      if (!batchId) {
        return jsonResponse(req, { error: "import_batch_id required" }, 400);
      }
      console.log("Commit confirmed for batch " + batchId);
      return jsonResponse(req, { status: "completed", import_batch_id: batchId });
    } catch (error) {
      console.error("Commit handler error", error);
      return jsonResponse(req, { error: "Commit error" }, 500);
    }
  }

  return jsonResponse(req, { error: "Not found" }, 404);
});
