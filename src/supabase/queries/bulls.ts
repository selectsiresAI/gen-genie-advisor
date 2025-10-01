import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type BullsDenormRow = Database['public']['Views']['bulls_denorm']['Row'];

const SELECT_COLUMNS = [
  'id',
  'code',
  'name',
  'company',
  'hhp_dollar',
  'tpi',
  'nm_dollar',
  'cm_dollar',
  'fm_dollar',
  'gm_dollar',
  'f_sav',
  'ptam',
  'cfp',
  'ptaf',
  'ptaf_pct',
  'ptap',
  'ptap_pct',
  'pl',
  'dpr',
  'liv',
  'scs',
  'mast',
  'met',
  'rp',
  'da',
  'ket',
  'mf',
  'ptat',
  'udc',
  'flc',
  'sce',
  'dce',
  'ssb',
  'dsb',
  'h_liv',
  'ccr',
  'hcr',
  'fi',
  'bwc',
  'sta',
  'str',
  'dfm',
  'rua',
  'rls',
  'rtp',
  'ftl',
  'rw',
  'rlr',
  'fta',
  'fls',
  'fua',
  'ruh',
  'ruw',
  'ucl',
  'udp',
  'ftp',
  'rfi',
  'gfi'
] as const;

export type BullsDenormSelection = Pick<BullsDenormRow, typeof SELECT_COLUMNS[number]>;

const selectionQuery = SELECT_COLUMNS.join(', ');

const escapeIlike = (value: string) => value.replace(/[%_]/g, (match) => `\\${match}`);

type BullTable = 'bulls_denorm' | 'bulls';

const BULL_TABLES: readonly BullTable[] = ['bulls_denorm', 'bulls'];

async function fetchBullFrom(table: BullTable, code: string) {
  const { data, error } = await supabase
    .from(table)
    .select(selectionQuery)
    .eq('code', code)
    .order('updated_at', { ascending: false, nullsLast: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      const fallback = await supabase
        .from(table)
        .select(selectionQuery)
        .eq('code', code)
        .limit(1);

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      return (fallback.data?.[0] ?? null) as BullsDenormSelection | null;
    }

    throw new Error(error.message);
  }

  return data as unknown as BullsDenormSelection | null;
}

export async function getBullByNaab(naab: string): Promise<BullsDenormSelection | null> {
  const normalized = naab.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  for (const table of BULL_TABLES) {
    const bull = await fetchBullFrom(table, normalized);
    if (bull) {
      return bull;
    }
  }

  return null;
}

export async function searchBulls(term: string, limit = 10): Promise<BullsDenormSelection[]> {
  const normalized = term.trim();

  if (!normalized) {
    return [];
  }

  const escaped = escapeIlike(normalized);
  const codePattern = `${escaped.toUpperCase()}%`;
  const namePattern = `%${escaped}%`;

  const denormPromise = supabase
    .from('bulls_denorm')
    .select(selectionQuery)
    .or(
      `code.ilike.${codePattern},name.ilike.${namePattern}`
    )
    .order('code', { ascending: true, nullsFirst: false })
    .limit(limit * 2);

  const bullsPromise = supabase
    .from('bulls')
    .select(selectionQuery)
    .or(
      `code.ilike.${codePattern},name.ilike.${namePattern}`
    )
    .order('code', { ascending: true, nullsFirst: false })
    .limit(limit * 2);

  const [denormResult, bullsResult] = await Promise.all([denormPromise, bullsPromise]);

  if (denormResult.error && bullsResult.error) {
    throw new Error(denormResult.error.message || bullsResult.error.message);
  }

  if (denormResult.error) {
    console.warn('Erro ao buscar em bulls_denorm:', denormResult.error);
  }

  if (bullsResult.error) {
    console.warn('Erro ao buscar em bulls:', bullsResult.error);
  }

  const seenCodes = new Set<string>();
  const normalizedUpper = normalized.toUpperCase();
  const normalizedLower = normalized.toLowerCase();

  const pushRecord = (
    record: BullsDenormSelection | null | undefined,
    accumulator: BullsDenormSelection[]
  ) => {
    if (!record) {
      return;
    }

    const code = record.code?.toUpperCase();

    if (!code || seenCodes.has(code)) {
      return;
    }

    seenCodes.add(code);
    accumulator.push(record);
  };

  const addRecords = (records: unknown[] | null | undefined, accumulator: BullsDenormSelection[]) => {
    if (!records) {
      return;
    }

    for (const record of records) {
      pushRecord(record as BullsDenormSelection, accumulator);
    }
  };

  const combined: BullsDenormSelection[] = [];
  addRecords(denormResult.data, combined);
  addRecords(bullsResult.data, combined);

  if (!seenCodes.has(normalizedUpper)) {
    try {
      const exactMatch = await getBullByNaab(normalizedUpper);
      pushRecord(exactMatch, combined);
    } catch (error) {
      console.warn('Erro ao buscar correspondência exata de touro:', error);
    }
  }

  const rankRecord = (bull: BullsDenormSelection) => {
    const code = bull.code?.toUpperCase() ?? '';
    const name = bull.name?.toLowerCase() ?? '';

    if (code === normalizedUpper) return 0;
    if (code.startsWith(normalizedUpper)) return 1;
    if (name.includes(normalizedLower)) return 2;
    return 3;
  };

  combined.sort((a, b) => {
    const rankDifference = rankRecord(a) - rankRecord(b);
    if (rankDifference !== 0) {
      return rankDifference;
    }

    return (a.code ?? '').localeCompare(b.code ?? '');
  });

  return combined.slice(0, limit);
}
