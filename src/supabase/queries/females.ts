import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { PostgrestError } from "@supabase/supabase-js";

// CRÍTICO: females_denorm é uma VIEW que pode retornar campos nullable
// mesmo que a tabela base tenha valores. Nunca exija created_at como obrigatório aqui!
export type FemaleDenormRow = Database["public"]["Views"]["females_denorm"]["Row"];

// IMPORTANTE: CompleteFemaleDenormRow valida APENAS os campos essenciais
// para operações de UI. Campos como created_at, updated_at podem ser null
// na view mesmo que existam na tabela base females.
export type CompleteFemaleDenormRow = FemaleDenormRow & {
  id: string;
  name: string;
  farm_id: string;
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
const FEMALE_SOURCE_TABLES = [
  "females_public_by_farm_view",
  "females_denorm",
] as const;

type FemaleSourceTable = typeof FEMALE_SOURCE_TABLES[number];

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

/**
 * Valida se uma linha da view females_denorm tem os campos MÍNIMOS necessários
 * para renderização na UI.
 * 
 * ATENÇÃO: NÃO adicione validação de created_at ou updated_at aqui!
 * A view females_denorm pode retornar esses campos como null mesmo quando
 * existem na tabela base. Adicionar essa validação causará perda de dados
 * na UI (linhas serão filtradas incorretamente).
 * 
 * Campos validados (APENAS os essenciais para operação):
 * - id: identificador único do animal
 * - name: nome do animal (obrigatório para listagens)
 * - farm_id: vínculo com a fazenda (obrigatório para RLS)
 * 
 * @param row - Linha da view females_denorm
 * @returns true se a linha possui os campos mínimos necessários
 */
export function isCompleteFemaleRow(
  row: FemaleDenormRow | null | undefined
): row is CompleteFemaleDenormRow {
  return Boolean(
    row &&
      row.id &&
      row.name &&
      row.farm_id
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

  for (let index = 0; index < FEMALE_SOURCE_TABLES.length; index += 1) {
    const source = FEMALE_SOURCE_TABLES[index];
    const isLastSource = index === FEMALE_SOURCE_TABLES.length - 1;
    try {
      const rows = await fetchFemalesFromSource({
        source,
        normalizedFarmId,
        pageSize,
        selectColumns,
        order,
        signal,
      });

      if (rows.length === 0 && !isLastSource) {
        continue;
      }

      return rows;
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

interface FetchFemalesFromSourceArgs {
  source: FemaleSourceTable;
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

    let query = supabase
      .from(source)
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

    const pageData = Array.isArray(data) ? (data as unknown as FemaleDenormRow[]) : [];
    rows.push(...pageData);

    hasMore = pageData.length === pageSize;
    page += 1;
  }

  return rows;
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
