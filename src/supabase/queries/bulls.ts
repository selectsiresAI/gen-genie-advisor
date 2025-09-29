import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type BullsDenormRow = Database['public']['Views']['bulls_denorm']['Row'];
export type BullsTableRow = Database['public']['Tables']['bulls']['Row'];

const SELECT_COLUMNS = [
  'id',
  'code',
  'name',
  'company',
  'registration',
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
export type BullsSelection = BullsDenormSelection | Pick<BullsTableRow, typeof SELECT_COLUMNS[number]>;

const selectionQuery = SELECT_COLUMNS.join(', ');

const escapeIlike = (value: string) => value.replace(/[%_]/g, (match) => `\\${match}`);

const removeDiacritics = (value: string) =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const TABLES_WITH_FARM_FILTER = new Set<BullsTable>(['bulls_denorm', 'bulls']);

interface QueryOptions {
  farmId?: string;
}

interface SearchOptions extends QueryOptions {
  limit?: number;
}

type BullsTable = 'bulls_denorm' | 'bulls';

async function executeSearch(
  table: BullsTable,
  term: string,
  { farmId, limit = 25 }: SearchOptions
) {
  const trimmed = term.trim();

  if (!trimmed) {
    return { data: [] as BullsSelection[], error: null as Error | null };
  }

  const escaped = escapeIlike(removeDiacritics(trimmed));
  const upperEscaped = escaped.toUpperCase();

  const patterns = [
    `code.ilike.${upperEscaped}`,
    `code.ilike.${upperEscaped}%`,
    `code.ilike.%${upperEscaped}%`,
    `name.ilike.%${escaped}%`,
    `registration.ilike.%${escaped}%`
  ];

  const buildQuery = () => {
    let query = supabase
      .from(table)
      .select(selectionQuery)
      .or(patterns.join(','))
      .limit(limit * 3); // Fetch extra rows for ranking

    if (farmId && TABLES_WITH_FARM_FILTER.has(table)) {
      query = query.eq('farm_id', farmId);
    }

    return query;
  };

  let { data, error } = await buildQuery();

  if (error && farmId && error.message.includes('column')) {
    ({ data, error } = await supabase
      .from(table)
      .select(selectionQuery)
      .or(patterns.join(','))
      .limit(limit * 3));
  }

  return { data: (data ?? []) as BullsSelection[], error };
}

const rankMatches = (term: string, bulls: BullsSelection[]) => {
  const normalizedTerm = removeDiacritics(term.trim().toUpperCase());

  const scored = bulls.map((bull) => {
    const code = removeDiacritics((bull.code ?? '').toUpperCase());
    const name = removeDiacritics((bull.name ?? '').toUpperCase());
    const registry = removeDiacritics((bull.registration ?? '').toUpperCase());

    let score = 0;

    if (code === normalizedTerm) score += 1000;
    else if (code.startsWith(normalizedTerm)) score += 800;
    else if (code.includes(normalizedTerm)) score += 600;

    if (name === normalizedTerm) score += 400;
    else if (name.startsWith(normalizedTerm)) score += 300;
    else if (name.includes(normalizedTerm)) score += 200;

    if (registry === normalizedTerm) score += 150;
    else if (registry.startsWith(normalizedTerm)) score += 120;
    else if (registry.includes(normalizedTerm)) score += 100;

    return { score, bull };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (a.bull.name ?? '').localeCompare(b.bull.name ?? ''))
    .map(({ bull }) => bull);
};

export async function getBullByNaab(
  naab: string,
  options: QueryOptions = {}
): Promise<BullsSelection | null> {
  const normalized = naab.trim();

  if (!normalized) {
    return null;
  }

  const searchTerm = removeDiacritics(normalized.toUpperCase());

  const { data: denormData, error: denormError } = await executeSearch('bulls_denorm', searchTerm, {
    ...options,
    limit: 1
  });

  if (denormError) {
    throw new Error(denormError.message);
  }

  if (denormData.length > 0) {
    return denormData[0];
  }

  const { data: bullsData, error: bullsError } = await executeSearch('bulls', searchTerm, {
    ...options,
    limit: 1
  });

  if (bullsError) {
    throw new Error(bullsError.message);
  }

  return bullsData.length > 0 ? bullsData[0] : null;
}

export async function searchBulls(
  term: string,
  options: SearchOptions = {}
): Promise<BullsSelection[]> {
  const trimmed = term.trim();

  if (!trimmed) {
    return [];
  }

  const { limit = 25 } = options;

  const { data: denormData, error: denormError } = await executeSearch('bulls_denorm', trimmed, options);

  if (denormError) {
    throw new Error(denormError.message);
  }

  let ranked = rankMatches(trimmed, denormData);

  if (ranked.length === 0) {
    const { data: bullsData, error: bullsError } = await executeSearch('bulls', trimmed, options);

    if (bullsError) {
      throw new Error(bullsError.message);
    }

    ranked = rankMatches(trimmed, bullsData);
  }

  const unique = new Map<string, BullsSelection>();
  ranked.forEach((bull) => {
    if (!bull.code) return;
    const key = bull.code.toUpperCase();
    if (!unique.has(key)) {
      unique.set(key, bull);
    }
  });

  return Array.from(unique.values()).slice(0, limit);
}
