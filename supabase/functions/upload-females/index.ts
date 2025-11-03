import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  // PTA fields
  hhp_dollar?: number;
  tpi?: number;
  nm_dollar?: number;
  cm_dollar?: number;
  fm_dollar?: number;
  gm_dollar?: number;
  f_sav?: number;
  ptam?: number;
  cfp?: number;
  ptaf?: number;
  ptaf_pct?: number;
  ptap?: number;
  ptap_pct?: number;
  pl?: number;
  dpr?: number;
  liv?: number;
  scs?: number;
  // Linear traits (many fields)
  [key: string]: string | number | undefined;
}

function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Remove potentially dangerous characters
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
  // Required fields
  const name = sanitizeString(record.name);
  if (!name || name.length === 0 || name.length > 200) {
    return null;
  }

  // Build validated record
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

  // PTA numeric fields (allow negative values, reasonable ranges)
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { records, farm_id } = await req.json();

    if (!farm_id || !records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: farm_id and records array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    if (records.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Too many records. Maximum 5000 per upload.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check farm access - any user with farm access can upload
    const { data: farmAccess } = await supabase
      .from('user_farms')
      .select('role')
      .eq('farm_id', farm_id)
      .eq('user_id', user.id)
      .single();

    if (!farmAccess) {
      return new Response(
        JSON.stringify({ error: 'Permission denied: insufficient farm access' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize all records
    const validatedRecords: FemaleRecord[] = [];
    const errors: { row: number; error: string }[] = [];

    records.forEach((record, index) => {
      const validated = validateRecord(record, farm_id);
      if (validated) {
        validatedRecords.push(validated);
      } else {
        errors.push({ row: index + 1, error: 'Invalid or missing required fields' });
      }
    });

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }

    // Insert validated records in batches
    const batchSize = 500;
    let inserted = 0;
    const insertErrors: any[] = [];

    for (let i = 0; i < validatedRecords.length; i += batchSize) {
      const batch = validatedRecords.slice(i, i + batchSize);
      
      const { error: insertError, count } = await supabase
        .from('females')
        .insert(batch);

      if (insertError) {
        console.error('Insert error:', insertError);
        insertErrors.push(insertError);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Upload complete: ${inserted} records inserted, ${errors.length} validation errors, ${insertErrors.length} insert errors`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted,
        validation_errors: errors.length,
        insert_errors: insertErrors.length,
        errors: errors.slice(0, 100), // Return first 100 errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Upload function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
