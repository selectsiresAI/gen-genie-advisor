import { NEXUS2_PTA_KEYS } from '@/constants/nexus2Ptas';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type BullsDenormRow = Database['public']['Views']['bulls_denorm']['Row'];

const BASE_SELECT_COLUMNS = ['id', 'code', 'name', 'company'] as const;

const SELECT_COLUMNS = [...BASE_SELECT_COLUMNS, ...NEXUS2_PTA_KEYS] as const;

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
    .select(selectionQuery)
    .ilike('code', normalized)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }

    throw new Error(error.message);
  }

  return (data as BullsDenormSelection | null) ?? null;
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
    .select(selectionQuery)
    .or(
      `code.ilike.${codePattern},name.ilike.${namePattern}`
    )
    .order('code', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as BullsDenormSelection[] | null) ?? [];
}
