import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FetchFemalesByFarmParams {
  farmId: string;
  pageSize?: number;
  offset?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export interface FetchFemalesByFarmResult<T = FemalePublicRecord> {
  data: T[] | null;
  error: PostgrestError | null;
  hasMore: boolean;
  nextCursor: string | null;
}

export type FemalePublicRecord = Record<string, any> & {
  created_at?: string | null;
};

export async function fetchFemalesByFarmRPC<
  T extends FemalePublicRecord = FemalePublicRecord,
>({
  farmId,
  pageSize = 50,
  offset = 0,
  cursor,
  signal,
}: FetchFemalesByFarmParams): Promise<FetchFemalesByFarmResult<T>> {
  if (!UUID_REGEX.test(farmId)) {
    return {
      data: null,
      error: {
        message: 'Invalid farmId format. Expected a UUID.',
        details: null,
        hint: null,
        code: 'invalid_uuid',
      },
      hasMore: false,
      nextCursor: null,
    };
  }

  try {
    const limit = Math.max(pageSize, 1);
    let query = supabase.rpc('females_public_by_farm', {
      farm_uuid: farmId,
    });

    if (signal) {
      query = query.abortSignal(signal);
    }

    query = query.order('created_at', { ascending: true });

    let response;

    if (cursor) {
      response = await query.gt('created_at', cursor).limit(limit + 1);
    } else {
      const rangeEnd = offset + limit - 1;
      response = await query.range(offset, rangeEnd);
    }

    const { data, error } = response as unknown as {
      data: T[] | null;
      error: PostgrestError | null;
    };

    if (error) {
      console.error('Erro RPC ao buscar fêmeas:', error);
      return {
        data: null,
        error,
        hasMore: false,
        nextCursor: null,
      };
    }

    if (!data) {
      return {
        data: null,
        error: null,
        hasMore: false,
        nextCursor: null,
      };
    }

    let females = data;
    let hasMore = false;

    if (cursor) {
      if (females.length > limit) {
        hasMore = true;
        females = females.slice(0, limit);
      }
    } else {
      hasMore = females.length === limit;
    }

    const lastItem = females[females.length - 1];
    const nextCursor = lastItem?.created_at ?? null;

    return {
      data: females,
      error: null,
      hasMore,
      nextCursor,
    };
  } catch (cause) {
    console.error('Erro inesperado ao buscar fêmeas:', cause);
    return {
      data: null,
      error: {
        message: cause instanceof Error ? cause.message : 'Unknown error',
        details: null,
        hint: null,
        code: 'unexpected_error',
      },
      hasMore: false,
      nextCursor: null,
    };
  }
}

