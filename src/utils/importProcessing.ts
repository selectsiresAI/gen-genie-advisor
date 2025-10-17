import { SupabaseClient } from '@supabase/supabase-js';

export type NormalizedRow = { 
  naab?: string;
  sire_naab?: string;
  mgs_naab?: string;
  mmgs_naab?: string;
  import_batch_id?: string;
  uploader_user_id?: string;
  row_number?: number;
  [k: string]: any;
};

function chunkArray<T>(arr: T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function normalizeNaab(s?: string | null): string | null {
  if (!s) return null;
  // trim, collapse whitespace, uppercase, remove non-printable
  const cleaned = s
    .toString()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // remove control chars
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  return cleaned === '' ? null : cleaned;
}

async function fetchBullsByNaabsMultiColumn(
  supabase: SupabaseClient,
  naabs: string[],
  lookupChunkSize = 200
): Promise<Map<string, any>> {
  const cleaned = Array.from(new Set(naabs.filter(Boolean).map(s => normalizeNaab(s)!)));
  const resultMap = new Map<string, any>();
  if (cleaned.length === 0) {
    console.debug('[import] no naabs to fetch');
    return resultMap;
  }

  console.debug(`[import] fetching bulls for ${cleaned.length} unique naabs (chunksize=${lookupChunkSize})`);

  const chunks = chunkArray(cleaned, lookupChunkSize);
  for (const chunk of chunks) {
    try {
      // try multi-column exact matches first
      const qSire = supabase.from('bulls').select('id, code, name, sire_naab, mgs_naab, mmgs_naab, code_normalized').in('sire_naab', chunk);
      const qMgs = supabase.from('bulls').select('id, code, name, sire_naab, mgs_naab, mmgs_naab, code_normalized').in('mgs_naab', chunk);
      const qMmgs = supabase.from('bulls').select('id, code, name, sire_naab, mgs_naab, mmgs_naab, code_normalized').in('mmgs_naab', chunk);

      const [rS, rM, rMM] = await Promise.all([qSire, qMgs, qMmgs]);

      const responses = [rS, rM, rMM];
      for (const res of responses) {
        if (res.error) {
          // surface auth/RLS errors clearly
          console.error('[import] fetch error', res.error);
          throw res.error;
        }
        (res.data || []).forEach((row: any) => {
          ['sire_naab', 'mgs_naab', 'mmgs_naab'].forEach((col) => {
            const rawVal = row[col];
            const key = normalizeNaab(rawVal);
            if (key && !resultMap.has(key)) {
              resultMap.set(key, row);
            }
          });
          // also map by code_normalized and code if present
          if (row.code_normalized) {
            const k = normalizeNaab(row.code_normalized);
            if (k && !resultMap.has(k)) resultMap.set(k, row);
          }
          if (row.code) {
            const k2 = normalizeNaab(row.code);
            if (k2 && !resultMap.has(k2)) resultMap.set(k2, row);
          }
        });
      }

      // For any remaining naabs not matched, try lookup by code/code_normalized
      const unmatched = chunk.filter(k => !resultMap.has(k));
      if (unmatched.length > 0) {
        // attempt lookup by code_normalized or code
        const qCode = await supabase
          .from('bulls')
          .select('id, code, name, sire_naab, mgs_naab, mmgs_naab, code_normalized')
          .in('code_normalized', unmatched)
          .or(`code.in.(${unmatched.map(v => `"${v}"`).join(',')})`); // fallback to code
        if (qCode.error) {
          // if .or fails due to syntax or RLS, just log and continue
          console.debug('[import] code fallback query error', qCode.error);
        } else {
          (qCode.data || []).forEach((row: any) => {
            const candidates = [
              normalizeNaab(row.code_normalized),
              normalizeNaab(row.code),
              normalizeNaab(row.sire_naab),
              normalizeNaab(row.mgs_naab),
              normalizeNaab(row.mmgs_naab),
            ].filter(Boolean) as string[];
            candidates.forEach((k) => {
              if (!resultMap.has(k)) resultMap.set(k, row);
            });
          });
        }
      }
    } catch (err) {
      console.error('[import] fetchBullsByNaabsMultiColumn exception', err);
      throw err;
    }
  }

  console.debug(`[import] fetched map size=${resultMap.size}`);
  return resultMap;
}

async function upsertStagingRowsSupabase(
  supabase: SupabaseClient,
  rows: any[],
  writeChunkSize = 100
) {
  if (!rows || rows.length === 0) {
    console.debug('[import] no rows to upsert to staging');
    return;
  }
  const chunks = chunkArray(rows, writeChunkSize);
  for (const c of chunks) {
    const payload = c.map((r: any) => {
      const rawRow = r.original_row ?? r.raw_row ?? r.raw ?? r;
      return {
        import_batch_id: r.import_batch_id ?? null,
        uploader_user_id: r.uploader_user_id ?? null,
        row_number: r.row_number ?? null,
        raw_row: rawRow ?? {},
        mapped_row: r.mapped_row ?? null,
        is_valid: r.is_valid ?? false,
        errors: r.errors ?? [],
      };
    });

    try {
      const { data, error } = await supabase.from('bulls_import_staging').insert(payload).select('id, import_batch_id, row_number, is_valid');
      if (error) {
        console.error('[import] upsertStagingRowsSupabase error', error);
        throw error;
      }
      console.debug('[import] inserted staging rows chunk', { inserted: data?.length ?? payload.length });
    } catch (err) {
      console.error('[import] upsertStagingRowsSupabase exception', err);
      throw err;
    }
  }
}

export async function processNormalizedRowsInBatchesMultiColumn(
  supabase: SupabaseClient,
  normalizedRows: NormalizedRow[],
  options?: {
    lookupChunkSize?: number;
    writeBatchSize?: number;
    progressCallback?: (processed: number, total: number) => void;
  }
) {
  const lookupChunkSize = options?.lookupChunkSize ?? 200;
  const writeBatchSize = options?.writeBatchSize ?? 100;
  const totalRows = normalizedRows.length;

  console.info(`[import] starting processing ${totalRows} rows (batch=${writeBatchSize})`);

  const globalCache = new Map<string, any>();
  const rowChunks = chunkArray(normalizedRows, writeBatchSize);
  let processed = 0;
  let validCount = 0;
  let invalidCount = 0;

  for (const rowsChunk of rowChunks) {
    // collect NAABs not in cache
    const naabsToFetch: string[] = [];
    for (const r of rowsChunk) {
      const candidates = [
        normalizeNaab(r.sire_naab),
        normalizeNaab(r.mgs_naab),
        normalizeNaab(r.mmgs_naab),
        normalizeNaab(r.naab),
      ].filter(Boolean) as string[];

      for (const naab of candidates) {
        if (!globalCache.has(naab)) {
          globalCache.set(naab, undefined);
          naabsToFetch.push(naab);
        }
      }
    }

    console.debug(`[import] chunk has ${rowsChunk.length} rows, need to fetch ${naabsToFetch.length} naabs`);

    if (naabsToFetch.length > 0) {
      const fetchedMap = await fetchBullsByNaabsMultiColumn(supabase, naabsToFetch, lookupChunkSize);
      for (const naab of naabsToFetch) {
        if (fetchedMap.has(naab)) globalCache.set(naab, fetchedMap.get(naab));
        else globalCache.set(naab, null);
      }
    }

    const mappedRows = rowsChunk.map((r) => {
      const candidates = [
        { col: 'sire_naab', val: normalizeNaab(r.sire_naab) },
        { col: 'mgs_naab', val: normalizeNaab(r.mgs_naab) },
        { col: 'mmgs_naab', val: normalizeNaab(r.mmgs_naab) },
        { col: 'naab', val: normalizeNaab(r.naab) },
      ].filter(x => x.val);

      let matchedBull: any = null;
      let matchedNaab: string | null = null;
      for (const c of candidates) {
        const val = c.val as string;
        const bull = globalCache.get(val);
        if (bull) {
          matchedBull = bull;
          matchedNaab = val;
          break;
        }
      }

      const mappedRow = matchedBull
        ? {
            bull_id: matchedBull.id,
            bull_code: matchedBull.code,
            bull_name: matchedBull.name,
            matched_on: matchedNaab,
          }
        : null;

      if (!mappedRow) {
        console.debug('[import] row not matched', { row_number: r.row_number, candidates: candidates.map(c=>c.val) });
      }

      return {
        import_batch_id: r.import_batch_id ?? null,
        uploader_user_id: r.uploader_user_id ?? null,
        row_number: r.row_number ?? null,
        raw_row: r,
        mapped_row: mappedRow,
        is_valid: !!mappedRow,
        errors: mappedRow ? [] : [{ message: 'bull_not_found', naabs: candidates.map(c => c.val) }],
      };
    });

    await upsertStagingRowsSupabase(supabase, mappedRows, writeBatchSize);

    for (const row of mappedRows) {
      if (row.is_valid) validCount += 1;
      else invalidCount += 1;
    }

    processed += rowsChunk.length;
    if (options?.progressCallback) options.progressCallback(processed, totalRows);

    console.info(`[import] processed ${processed}/${totalRows} (valid=${validCount} invalid=${invalidCount})`);
  }

  console.info('[import] finished processing', { processed, totalRows, validCount, invalidCount });

  return { processed, total: totalRows, valid: validCount, invalid: invalidCount };
}
