import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type BullsDenormRow = Database['public']['Views']['bulls_denorm']['Row'];

const SELECT_COLUMNS = [
  'id',
  'code',
  'name',
  'sire_naab',
  'mgs_naab',
  'mmgs_naab',
  'sire_name',
  'mgs_name',
  'mmgs_name',
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

const normalizeNaabCode = (naab: string): string => {
  // Remove espaços, hífens e converte para uppercase
  let normalized = naab.trim().replace(/[\s-]/g, '').toUpperCase();
  
  // Remove zeros à esquerda antes das letras (007HO -> 7HO, 011HO -> 11HO)
  // Mantém zeros após as letras (7HO00001 permanece 7HO00001)
  normalized = normalized.replace(/^0+([1-9]\d*[A-Z]+)/, '$1');
  normalized = normalized.replace(/^0+([A-Z]+)/, '$1');
  
  return normalized;
};

export async function getBullByNaab(naab: string): Promise<BullsDenormSelection | null> {
  const normalized = normalizeNaabCode(naab);

  if (!normalized) {
    return null;
  }

  // A função RPC agora retorna os dados completos diretamente
  const { data, error } = await supabase
    .rpc('get_bull_by_naab', { naab: normalized })
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data || !(data as any).found) {
    return null;
  }

  // Mapear os dados do RPC para o formato esperado
  const { bull_id, found, ...bullData } = data as any;
  return { id: bull_id, ...bullData } as BullsDenormSelection;
}

export async function searchBulls(term: string, limit = 10): Promise<BullsDenormSelection[]> {
  const normalized = term.trim();

  if (!normalized) {
    return [];
  }

  // A função RPC agora retorna os dados completos diretamente
  const { data, error } = await supabase
    .rpc('search_bulls', { q: normalized, limit_count: limit });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Mapear os dados do RPC para o formato esperado
  return data.map((bull: any) => {
    const { bull_id, ...bullData } = bull;
    return { id: bull_id, ...bullData } as unknown as BullsDenormSelection;
  });
}
