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

  const { data, error } = await supabase
    .from('bulls_denorm')
    .select(selectionQuery, { head: false, count: 'exact' })
    .ilike('code', normalized)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw new Error(error.message);
  }

  return data as unknown as BullsDenormSelection | null;
}

export async function searchBulls(term: string, limit = 10): Promise<BullsDenormSelection[]> {
  const normalized = term.trim();

  if (!normalized) {
    return [];
  }

  const escaped = escapeIlike(normalized);
  const codePattern = `${escaped.toUpperCase()}%`;
  const namePattern = `%${escaped}%`;

  const { data, error } = await supabase
    .from('bulls_denorm')
    .select(selectionQuery, { head: false, count: 'exact' })
    .or(
      `code.ilike.${codePattern},name.ilike.${namePattern}`
    )
    .order('code', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as BullsDenormSelection[]) ?? [];
}
