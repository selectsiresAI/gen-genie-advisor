import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-application-name',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
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
    const parts = s.split(',');
    // Only treat as US thousands if: single comma, exactly 3 digits after,
    // AND integer part is 4+ digits (e.g. "1,234" "10,000")
    // Otherwise treat comma as decimal (Brazilian/European: "10,5" → "10.5")
    if (parts.length === 2 && /^\d{3}$/.test(parts[1]) && /^-?\d{4,}$/.test(parts[0])) {
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

// Map of month names (PT/EN/ES) → numeric month
const MONTH_NAMES: Record<string, number> = {
  jan: 1, janeiro: 1, january: 1, ene: 1, enero: 1,
  fev: 2, fevereiro: 2, feb: 2, february: 2, febrero: 2,
  mar: 3, marco: 3, 'março': 3, march: 3, marzo: 3,
  abr: 4, abril: 4, apr: 4, april: 4,
  mai: 5, maio: 5, may: 5, mayo: 5,
  jun: 6, junho: 6, june: 6, junio: 6,
  jul: 7, julho: 7, july: 7, julio: 7,
  ago: 8, agosto: 8, aug: 8, august: 8,
  set: 9, setembro: 9, sep: 9, sept: 9, september: 9, septiembre: 9,
  out: 10, outubro: 10, oct: 10, october: 10, octubre: 10,
  nov: 11, novembro: 11, november: 11, noviembre: 11,
  dez: 12, dezembro: 12, dec: 12, december: 12, dic: 12, diciembre: 12,
};

function toIsoSafe(year: number, month: number, day: number): string | null {
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 100) year = year <= 50 ? 2000 + year : 1900 + year;
  if (year < 1900 || year > 2100) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function validateDate(value: unknown, preferMMDD: boolean = false): string | null {
  if (value === null || value === undefined || value === '') return null;

  // Date object (xlsx can deliver real Dates when cellDates is enabled)
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().split('T')[0];
  }

  // Numeric input → Excel serial date
  if (typeof value === 'number' && isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + Math.round(value) * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
  }

  let dateStr = String(value).trim();
  if (!dateStr) return null;

  // Strip surrounding quotes/whitespace and any time component
  dateStr = dateStr.replace(/^['"]+|['"]+$/g, '').trim();
  // Keep only the date portion if there's a time/timezone after a space or "T"
  const tSplit = dateStr.split(/[T\s]/)[0];
  if (tSplit && /\d/.test(tSplit) && !/[a-zA-Z]/.test(tSplit)) {
    dateStr = tSplit;
  }
  // Normalize separators of all kinds (., /, -, spaces) — except for word-month forms handled below
  const hasMonthName = /[a-zA-Z]{3,}/.test(dateStr);

  // Pure digits → Excel serial (allow up to 6 digits to cover year 2100+)
  if (/^\d{4,6}$/.test(dateStr) && !hasMonthName) {
    const excelSerial = parseInt(dateStr, 10);
    if (excelSerial > 59 && excelSerial < 80000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const d = new Date(excelEpoch.getTime() + excelSerial * 86400000);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
  }

  // ISO YYYY-MM-DD (or with / or .)
  const isoMatch = dateStr.match(/^(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})$/);
  if (isoMatch) {
    const r = toIsoSafe(+isoMatch[1], +isoMatch[2], +isoMatch[3]);
    if (r) return r;
  }

  // DD/MM/YYYY, DD-MM-YY, DD.MM.YYYY — Brazilian/EU default for ambiguous
  const slashMatch = dateStr.match(/^(\d{1,2})[\-\/.\s](\d{1,2})[\-\/.\s](\d{2,4})$/);
  if (slashMatch) {
    const a = parseInt(slashMatch[1], 10);
    const b = parseInt(slashMatch[2], 10);
    const c = parseInt(slashMatch[3], 10);
    let day: number, month: number;
    if (a > 12) { day = a; month = b; }
    else if (b > 12) { day = b; month = a; }
    else if (preferMMDD) { month = a; day = b; }
    else { day = a; month = b; } // Ambiguous → DD/MM (PT-BR default)
    const r = toIsoSafe(c, month, day);
    if (r) return r;
  }

  // YYYY/DD/MM (rare, but try as fallback)
  const yddmm = dateStr.match(/^(\d{4})[\-\/.\s](\d{1,2})[\-\/.\s](\d{1,2})$/);
  if (yddmm) {
    const r = toIsoSafe(+yddmm[1], +yddmm[3], +yddmm[2]);
    if (r) return r;
  }

  // Word months: "12 de março de 2024", "12-mar-2024", "March 12, 2024", "12 Mar 2024"
  if (hasMonthName) {
    const cleaned = dateStr
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\s+de\s+/g, ' ')
      .replace(/,/g, ' ')
      .replace(/[\-\/.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = cleaned.split(' ');
    let day = 0, month = 0, year = 0;
    for (const p of parts) {
      if (MONTH_NAMES[p] && !month) month = MONTH_NAMES[p];
      else if (/^\d+$/.test(p)) {
        const n = parseInt(p, 10);
        if (n > 31 && !year) year = n;
        else if (!day) day = n;
        else if (!year) year = n;
      }
    }
    const r = toIsoSafe(year, month, day);
    if (r) return r;
  }

  // Last resort: native Date
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
  // Conversão exports may leave both `name` and `identifier` empty when the
  // animal is identified only by registration (cdcb_id). Fall back to it so
  // the row is not silently dropped.
  if (!name && record.cdcb_id) {
    name = sanitizeString(record.cdcb_id);
  }
  if (!name || name.length === 0 || name.length > 200) return null;

  // Nexus 2 exports include an `identifier` column but leave it blank,
  // using `name` as the animal id. Fall back to the name so the unique
  // key remains meaningful and duplicates can be detected.
  const rawIdentifier = sanitizeString(record.identifier);
  const identifier = (rawIdentifier && rawIdentifier.length > 0 ? rawIdentifier : name).substring(0, 100);

  const validated: FemaleRecord = {
    client_id: farmId,
    name,
    identifier,
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

function parseCSV(csvContent: string): { records: any[]; unmappedCols: string[] } {
  let content = csvContent;
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.trim().split('\n');
  if (lines.length < 2) return { records: [], unmappedCols: [] };

  const firstLine = lines[0];
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  const delimiter = tabs > semicolons && tabs > commas ? '\t' : semicolons > commas ? ';' : ',';

  console.log("Detected CSV delimiter: '" + delimiter + "'");

  // NOTE: 'id' is NOT forbidden because Conversão exports populate it as the animal id.
  // It is remapped to 'identifier' via columnMapping below.
  const forbiddenFields = [
    'farm_id', 'client_id', 'ptas', 'created_at', 'updated_at', 'deleted_at',
    // Mangled variants (some exporters strip "t" from headers)
    'creaed_a', 'updaed_a', 'pas',
  ];

  const columnMapping: Record<string, string> = {
    // Mangled headers (exporter stripped the letter "t")
    'birh_dae': 'birth_date',
    'birh dae': 'birth_date',
    'idenifier': 'identifier',
    'pariy_order': 'parity_order',
    'pariy order': 'parity_order',
    'caegory': 'category',
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
    // PTA fields
    'tpi': 'tpi',
    'cfp': 'cfp',
    'gl': 'gl',
    'rfi': 'rfi',
    'fi': 'fi',
    'bwc': 'bwc',
    'sta': 'sta',
    'dfm': 'dfm',
    'rua': 'rua',
    'rls': 'rls',
    'rtp': 'rtp',
    'ftl': 'ftl',
    'rw': 'rw',
    'rlr': 'rlr',
    'fta': 'fta',
    'fls': 'fls',
    'fua': 'fua',
    'ruh': 'ruh',
    'ruw': 'ruw',
    'ucl': 'ucl',
    'udp': 'udp',
    'ftp': 'ftp',
    'mast': 'mast',
    'met': 'met',
    'rp': 'rp',
    'da': 'da',
    'ket': 'ket',
    'ssb': 'ssb',
    'dsb': 'dsb',
    'gfi': 'gfi',
    // Dollar indexes
    'hhp dollar': 'hhp_dollar',
    'nm dollar': 'nm_dollar',
    'cm dollar': 'cm_dollar',
    'fm dollar': 'fm_dollar',
    'gm dollar': 'gm_dollar',
    'hhp$®': 'hhp_dollar',
    // Portuguese/Spanish/English variations
    'nome': 'name',
    'identificador': 'identifier',
    'id': 'identifier',
    // In ToolSS native sheets, "ID_Fazenda"/"farm_id" is the animal identifier
    // exported by the Conversion tool, not the destination farm selected in Rebanho.
    'farm_id': 'identifier',
    'id_fazenda': 'identifier',
    'id fazenda': 'identifier',
    'idfazenda': 'identifier',
    'brinco': 'identifier',
    'tag': 'identifier',
    'id animal': 'identifier',
    'ear tag': 'identifier',
    'animal id': 'identifier',
    'cow id': 'identifier',
    'female id': 'identifier',
    'data nascimento': 'birth_date',
    'data de nascimento': 'birth_date',
    'data_de_nascimento': 'birth_date',
    'datanascimento': 'birth_date',
    'fecha nacimiento': 'birth_date',
    'birth date': 'birth_date',
    'birth_date': 'birth_date',
    'naab pai': 'sire_naab',
    'naab_pai': 'sire_naab',
    'naabpai': 'sire_naab',
    'naab sire': 'sire_naab',
    'naab do pai': 'sire_naab',
    'sire naab': 'sire_naab',
    'sire_naab': 'sire_naab',
    'sire naab code': 'sire_naab',
    'sire code': 'sire_naab',
    'pai': 'sire_naab',
    'codigo pai': 'sire_naab',
    'naab avo': 'mgs_naab',
    'naab_avo': 'mgs_naab',
    'naab mgs': 'mgs_naab',
    'mgs naab': 'mgs_naab',
    'mgs_naab': 'mgs_naab',
    'mgs': 'mgs_naab',
    'avo materno': 'mgs_naab',
    'naab avo materno': 'mgs_naab',
    'naab_avo_materno': 'mgs_naab',
    'naabavomaterno': 'mgs_naab',
    'naab bisavo': 'mmgs_naab',
    'naab_bisavo': 'mmgs_naab',
    'naab mmgs': 'mmgs_naab',
    'mmgs naab': 'mmgs_naab',
    'mmgs_naab': 'mmgs_naab',
    'mmgs': 'mmgs_naab',
    'bisavo materno': 'mmgs_naab',
    'naab bisavo materno': 'mmgs_naab',
    'naab_bisavo_materno': 'mmgs_naab',
    'naabbisavomaterno': 'mmgs_naab',
    'categoria': 'category',
    'category': 'category',
    'paridade': 'parity_order',
    'parity': 'parity_order',
    'parity order': 'parity_order',
    'ordem parto': 'parity_order',
    'lactacao': 'parity_order',
    'cdcb': 'cdcb_id',
    'cdcb id': 'cdcb_id',
    'registration': 'cdcb_id',
    'registro': 'cdcb_id',
    'beta casein': 'beta_casein',
    'kappa casein': 'kappa_casein',
    'beta caseina': 'beta_casein',
    'kappa caseina': 'kappa_casein',
    'source': 'fonte',
    'origin': 'fonte',
    'origem': 'fonte',
    'pta milk': 'pta_milk',
    'pta fat': 'pta_fat',
    'pta protein': 'pta_protein',
    'pta type': 'pta_ptat',
    'pta scs': 'pta_scs',
    'pta pl': 'pta_pl',
    'pta dpr': 'pta_dpr',
    'pta livability': 'pta_livability',
    'pta ccr': 'pta_ccr',
    'pta hcr': 'pta_hcr',
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

  // Log which raw headers weren't mapped for debugging
  const rawCols = lines[0].split(delimiter).map((h: string) => h.trim().replace(/"/g, '').replace(/\ufeff/g, '').toLowerCase());
  const recognizedCols = new Set([...allHeaders, ...forbiddenFields]);
  const unmappedCols = rawCols.filter((h: string) => h && !recognizedCols.has(h) && !recognizedCols.has(columnMapping[h] || ''));
  if (unmappedCols.length > 0) {
    console.warn("[import-females] Unrecognized columns (passed through as-is): " + unmappedCols.join(', '));
  }

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
  return { records, unmappedCols };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) });
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
      if (file.size > 10 * 1024 * 1024) {
        return jsonResponse(req, { error: "File too large. Maximum 10MB." }, 413);
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
      const { records: parsedRecords, unmappedCols } = parseCSV(csvContent);

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
        const uniqueKey = record.identifier || (record.name + '|' + (record.birth_date || '') + '|' + (record.sire_naab || ''));
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
        unmapped_columns: unmappedCols,
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
