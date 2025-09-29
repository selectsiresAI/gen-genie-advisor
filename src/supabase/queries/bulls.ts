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

export async function getBullByNaab(naab: string): Promise<BullsDenormSelection | null> {
  const normalized = naab.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const denormResult = await supabase
    .from('bulls_denorm')
    .select(selectionQuery)
    .ilike('code', normalized)
    .maybeSingle();

  if (denormResult.error && denormResult.error.code !== 'PGRST116') {
    throw new Error(denormResult.error.message);
  }

  const denormBull = denormResult.data as unknown as BullsDenormSelection | null;
  if (denormBull) {
    return denormBull;
  }

  const bullsResult = await supabase
    .from('bulls')
    .select(selectionQuery)
    .ilike('code', normalized)
    .maybeSingle();

  if (bullsResult.error) {
    if (bullsResult.error.code === 'PGRST116') {
      return null;
    }

    throw new Error(bullsResult.error.message);
  }

  return bullsResult.data as unknown as BullsDenormSelection | null;
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
    .limit(limit);

  const bullsPromise = supabase
    .from('bulls')
    .select(selectionQuery)
    .or(
      `code.ilike.${codePattern},name.ilike.${namePattern}`
    )
    .order('code', { ascending: true, nullsFirst: false })
    .limit(limit);

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

  const addRecords = (records: unknown[] | null | undefined, accumulator: BullsDenormSelection[]) => {
    if (!records) {
      return;
    }

    for (const record of records) {
      const bull = record as BullsDenormSelection;
      const code = bull.code?.toUpperCase();

      if (!code || seenCodes.has(code)) {
        continue;
      }

      seenCodes.add(code);
      accumulator.push(bull);
    }
  };

  const combined: BullsDenormSelection[] = [];
  addRecords(denormResult.data, combined);
  addRecords(bullsResult.data, combined);

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
