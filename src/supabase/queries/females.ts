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

export type FemaleSourceAttemptEvent =
  | { status: "start"; source: FemaleSource }
  | { status: "success"; source: FemaleSource; rowCount: number }
  | {
      status: "error";
      source: FemaleSource;
      error: PostgrestError | Error;
      willFallback: boolean;
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
  onSourceAttempt?: (event: FemaleSourceAttemptEvent) => void;
}

const DEFAULT_PAGE_SIZE = 1000;
const FEMALE_SOURCES = [
  { type: "rpc" as const, name: "get_females_denorm" },
  { type: "table" as const, name: "females_public_by_farm_view" },
  { type: "table" as const, name: "females_denorm" },
] as const;

export type FemaleSource = typeof FEMALE_SOURCES[number];

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
  const onSourceAttempt = options.onSourceAttempt;

  let lastError: PostgrestError | Error | null = null;

  for (let index = 0; index < FEMALE_SOURCES.length; index += 1) {
    const source = FEMALE_SOURCES[index];
    const isLastSource = index === FEMALE_SOURCES.length - 1;
    onSourceAttempt?.({ status: "start", source });
    try {
      const rows = await fetchFemalesFromSource({
        source,
        normalizedFarmId,
        pageSize,
        selectColumns,
        order,
        signal,
      });

      onSourceAttempt?.({ status: "success", source, rowCount: rows.length });

      if (rows.length === 0 && !isLastSource) {
        continue;
      }

      return rows;
    } catch (error) {
      const fallback = shouldFallbackToNextSource(error);
      onSourceAttempt?.({
        status: "error",
        source,
        error: error as PostgrestError | Error,
        willFallback: fallback && !isLastSource,
      });

      if (fallback) {
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

interface FetchFemalesFromSourceArgs {
  source: FemaleSource;
  normalizedFarmId: string;
  pageSize: number;
  selectColumns: string;
  order: FetchFemalesDenormOptions["order"];
  signal?: AbortSignal;
}

async function fetchFemalesFromSource({
  source,
  normalizedFarmId,
  pageSize,
  selectColumns,
  order,
  signal,
}: FetchFemalesFromSourceArgs): Promise<FemaleDenormRow[]> {
  const rows: FemaleDenormRow[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    throwIfAborted(signal);

    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = buildFemalesQuery({
      source,
      normalizedFarmId,
      selectColumns,
    });

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

    const pageData = Array.isArray(data) ? (data as FemaleDenormRow[]) : [];
    rows.push(...pageData);

    hasMore = pageData.length === pageSize;
    page += 1;
  }

  return rows;
}

interface BuildFemalesQueryArgs {
  source: FemaleSource;
  normalizedFarmId: string;
  selectColumns: string;
}

function buildFemalesQuery({
  source,
  normalizedFarmId,
  selectColumns,
}: BuildFemalesQueryArgs) {
  if (source.type === "rpc") {
    let query = supabase.rpc(source.name, { target_farm_id: normalizedFarmId });

    if (selectColumns && selectColumns !== "*") {
      query = query.select(selectColumns);
    }

    return query;
  }

  return supabase
    .from<FemaleDenormRow>(source.name as "females_denorm")
    .select(selectColumns)
    .eq("farm_id", normalizedFarmId);
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
    normalized.includes("could not find the function") ||
    normalized.includes("relation") && normalized.includes("does not exist") ||
    normalized.includes("unknown table") ||
    normalized.includes("not exist")
  );
}
