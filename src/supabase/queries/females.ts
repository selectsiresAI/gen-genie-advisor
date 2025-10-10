import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PostgrestError } from "@supabase/supabase-js";

export type FemaleDenormRow = Database["public"]["Tables"]["females_denorm"]["Row"];

export type CompleteFemaleDenormRow = FemaleDenormRow & {
  id: string;
  name: string;
  farm_id: string;
  created_at: string;
};

export interface FetchFemalesDenormOptions {
  pageSize?: number;
  select?: string;
  order?: {
    column: keyof FemaleDenormRow | string;
    ascending?: boolean;
    nullsFirst?: boolean;
  };
  signal?: AbortSignal;
}

const DEFAULT_PAGE_SIZE = 1000;
const FEMALE_SOURCE_CONFIGS = [
  {
    source: "females_public_by_farm_view",
    transform: (row: FemaleDenormRow) => row,
  },
  {
    source: "females_denorm",
    transform: (row: FemaleDenormRow) => row,
  },
  {
    source: "females",
    transform: mapBaseFemaleToDenorm,
  },
] as const;

type FemaleSourceConfig = typeof FEMALE_SOURCE_CONFIGS[number];
type FemaleSourceTable = FemaleSourceConfig["source"];

type FemaleSourceRowMap = {
  females_public_by_farm_view: FemaleDenormRow;
  females_denorm: FemaleDenormRow;
  females: Database["public"]["Tables"]["females"]["Row"];
};

function normalizeFarmId(farmId: string | number | null | undefined): string | null {
  if (farmId === null || farmId === undefined) {
    return null;
  }

  if (typeof farmId === "number") {
    return String(farmId);
  }

  const trimmed = String(farmId).trim();
  return trimmed.length ? trimmed : null;
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  const abortReason = (signal as unknown as { reason?: unknown })?.reason;
  const error = abortReason instanceof Error
    ? abortReason
    : new Error("The request was aborted");

  if (error.name !== "AbortError") {
    error.name = "AbortError";
  }

  throw error;
}

export function isCompleteFemaleRow(
  row: FemaleDenormRow | null | undefined
): row is CompleteFemaleDenormRow {
  return Boolean(
    row &&
      row.id &&
      row.name &&
      row.farm_id &&
      row.created_at
  );
}

export async function fetchFemalesDenormByFarm(
  farmId: string | number,
  options: FetchFemalesDenormOptions = {}
): Promise<FemaleDenormRow[]> {
  const normalizedFarmId = normalizeFarmId(farmId);
  if (!normalizedFarmId) {
    return [];
  }

  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);
  const selectColumns = options.select ?? "*";
  const order = options.order ?? { column: "id", ascending: true as const };
  const signal = options.signal;

  let lastError: PostgrestError | Error | null = null;

  for (let index = 0; index < FEMALE_SOURCE_CONFIGS.length; index += 1) {
    const { source, transform } = FEMALE_SOURCE_CONFIGS[index];
    const isLastSource = index === FEMALE_SOURCE_CONFIGS.length - 1;
    try {
      const rows = await fetchFemalesFromSource({
        source,
        normalizedFarmId,
        pageSize,
        selectColumns,
        order,
        signal,
      });

      const denormRows = rows.map(transform);

      if (denormRows.length === 0 && !isLastSource) {
        continue;
      }

      return denormRows;
    } catch (error) {
      if (shouldFallbackToNextSource(error)) {
        lastError = error as PostgrestError | Error;
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

interface FetchFemalesFromSourceArgs<TSource extends FemaleSourceTable> {
  source: TSource;
  normalizedFarmId: string;
  pageSize: number;
  selectColumns: string;
  order: FetchFemalesDenormOptions["order"];
  signal?: AbortSignal;
}

async function fetchFemalesFromSource<TSource extends FemaleSourceTable>({
  source,
  normalizedFarmId,
  pageSize,
  selectColumns,
  order,
  signal,
}: FetchFemalesFromSourceArgs<TSource>): Promise<FemaleSourceRowMap[TSource][]> {
  const rows: FemaleSourceRowMap[TSource][] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    throwIfAborted(signal);

    const from = page * pageSize;
    const to = from + pageSize - 1;

    const effectiveSelect = source === "females" ? "*" : selectColumns;

    let query = supabase
      .from<FemaleSourceRowMap[TSource]>(source)
      .select(effectiveSelect)
      .eq("farm_id", normalizedFarmId);

    if (order?.column) {
      query = query.order(order.column as string, {
        ascending: order.ascending ?? true,
        nullsFirst: order.nullsFirst ?? false,
      });
    }

    query = query.range(from, to);

    const { data, error } = await query;

    throwIfAborted(signal);

    if (error) {
      throw error;
    }

    const pageData = Array.isArray(data)
      ? (data as FemaleSourceRowMap[TSource][])
      : [];
    rows.push(...pageData);

    hasMore = pageData.length === pageSize;
    page += 1;
  }

  return rows;
}

function mapBaseFemaleToDenorm(
  row: Database["public"]["Tables"]["females"]["Row"]
): FemaleDenormRow {
  const { ptas: _ptas, ...rest } = row;

  return {
    ...rest,
    last_prediction_confidence: null,
    last_prediction_date: null,
    last_prediction_method: null,
    last_prediction_value: null,
    segmentation_class: null,
    segmentation_score: null,
  };
}

function shouldFallbackToNextSource(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = (error as PostgrestError).message ?? (error as Error).message;

  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("permission denied") ||
    normalized.includes("does not exist") ||
    normalized.includes("relation") && normalized.includes("does not exist") ||
    normalized.includes("unknown table") ||
    normalized.includes("not exist")
  );
}
