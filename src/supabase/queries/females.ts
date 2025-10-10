import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

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

  const rows: FemaleDenormRow[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    throwIfAborted(signal);

    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("females_denorm")
      .select(selectColumns)
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

    const pageData = Array.isArray(data) ? (data as FemaleDenormRow[]) : [];
    rows.push(...pageData);

    hasMore = pageData.length === pageSize;
    page += 1;
  }

  return rows;
}
