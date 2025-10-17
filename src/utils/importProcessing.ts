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

async function fetchBullsByNaabsMultiColumn(
  supabase: SupabaseClient,
  naabs: string[],
  lookupChunkSize = 200
): Promise<Map<string, any>> {
  const cleaned = Array.from(new Set(naabs.filter(Boolean).map(s => s.toString().trim())));
  const resultMap = new Map<string, any>();
  if (cleaned.length === 0) return resultMap;

  const chunks = chunkArray(cleaned, lookupChunkSize);
  for (const chunk of chunks) {
    // prepare three queries (one per column) and execute in parallel
    const q1 = supabase.from('bulls').select('id, code, name, sire_naab, mgs_naab, mmgs_naab').in('sire_naab', chunk);
    const q2 = supabase.from('bulls').select('id, code, name, sire_naab, mgs_naab, mmgs_naab').in('mgs_naab', chunk);
    const q3 = supabase.from('bulls').select('id, code, name, sire_naab, mgs_naab, mmgs_naab').in('mmgs_naab', chunk);

    const [r1, r2, r3] = await Promise.all([q1, q2, q3]);

    const responses = [r1, r2, r3];
    for (const res of responses) {
      if (res.error) {
        console.error('fetchBullsByNaabsMultiColumn error', res.error);
        throw res.error;
      }
      (res.data || []).forEach((row: any) => {
        ['sire_naab', 'mgs_naab', 'mmgs_naab'].forEach((col) => {
          const key = (row[col] || '').toString().trim();
          if (key && !resultMap.has(key)) {
            resultMap.set(key, row);
          }
        });
      });
    }
  }

  return resultMap;
}

async function upsertStagingRowsSupabase(
  supabase: SupabaseClient,
  rows: any[],
  writeChunkSize = 100
) {
  if (!rows || rows.length === 0) return;
  const chunks = chunkArray(rows, writeChunkSize);
  for (const c of chunks) {
    const payload = c.map((r: any) => ({
      import_batch_id: r.import_batch_id ?? null,
      uploader_user_id: r.uploader_user_id ?? null,
      row_number: r.row_number ?? null,
      raw_row: r.raw_row ?? {},
      mapped_row: r.mapped_row ?? null,
      is_valid: r.is_valid ?? false,
      errors: r.errors ?? [],
    }));

    const { error } = await supabase.from('bulls_import_staging').insert(payload);
    if (error) {
      console.error('upsertStagingRowsSupabase error', error);
      throw error;
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

  const globalCache = new Map<string, any>();
  const rowChunks = chunkArray(normalizedRows, writeBatchSize);
  let processed = 0;

  for (const rowsChunk of rowChunks) {
    // collect NAABs not in cache
    const naabsToFetch: string[] = [];
    for (const r of rowsChunk) {
      const candidates = [
        r.sire_naab?.toString().trim(),
        r.mgs_naab?.toString().trim(),
        r.mmgs_naab?.toString().trim(),
        r.naab?.toString().trim(),
      ].filter(Boolean) as string[];

      for (const naab of candidates) {
        if (!globalCache.has(naab)) {
          globalCache.set(naab, undefined);
          naabsToFetch.push(naab);
        }
      }
    }

    if (naabsToFetch.length > 0) {
      const fetchedMap = await fetchBullsByNaabsMultiColumn(supabase, naabsToFetch, lookupChunkSize);
      for (const naab of naabsToFetch) {
        if (fetchedMap.has(naab)) globalCache.set(naab, fetchedMap.get(naab));
        else globalCache.set(naab, null);
      }
    }

    const mappedRows = rowsChunk.map((r) => {
      const candidates = [
        { col: 'sire_naab', val: r.sire_naab?.toString().trim() },
        { col: 'mgs_naab', val: r.mgs_naab?.toString().trim() },
        { col: 'mmgs_naab', val: r.mmgs_naab?.toString().trim() },
        { col: 'naab', val: r.naab?.toString().trim() },
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

    processed += rowsChunk.length;
    if (options?.progressCallback) options.progressCallback(processed, totalRows);
  }

  return { processed, total: totalRows };
}
