import { createClient } from "@supabase/supabase-js";

type FemaleRow = Record<string, unknown>;

type BatchResult = {
  batch: number;
  total: number;
  inserted: number;
  updated: number;
  error?: string;
};

export const MAX_ROWS = 10_000;
export const CHUNK_SIZE = 500;
export const CONCURRENCY = 3;

export type FemaleImportPayload = {
  farmId?: string;
  rows?: FemaleRow[];
  onConflict?: string;
  targetTable?: string;
};

export type FemaleImportResponse = {
  status: number;
  body: {
    error?: string;
    total_received?: number;
    total_success?: number;
    total_batches?: number;
    chunk_size?: number;
    inserted?: number;
    updated?: number;
    batch_results?: BatchResult[];
    errors?: Array<{ batch: number; message: string }>;
  };
};

const ERROR_MISSING_ENV =
  "Configuração do Supabase ausente. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.";

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

export async function handleFemaleImport(
  payload: FemaleImportPayload,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FemaleImportResponse> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[females/import] Variáveis de ambiente do Supabase ausentes");
    return { status: 500, body: { error: ERROR_MISSING_ENV } };
  }

  if (!payload || typeof payload !== "object") {
    return { status: 400, body: { error: "Payload inválido" } };
  }

  const { farmId, rows, onConflict = "farm_id,identifier", targetTable = "females" } = payload;

  if (!farmId || !Array.isArray(rows)) {
    return { status: 400, body: { error: "farmId e rows são obrigatórios" } };
  }

  if (rows.length === 0) {
    return {
      status: 200,
      body: {
        total_received: 0,
        total_success: 0,
        total_batches: 0,
        chunk_size: CHUNK_SIZE,
        inserted: 0,
        updated: 0,
        batch_results: [],
        errors: [],
      },
    };
  }

  if (rows.length > MAX_ROWS) {
    return {
      status: 400,
      body: { error: `Máximo de ${MAX_ROWS} linhas por operação. Divida o arquivo.` },
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const normalizedRows = rows.map((row) => ({ farm_id: farmId, ...row }));
  const conflictColumns = onConflict
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const canTrackIdentifierUpdates =
    conflictColumns.length === 2 && conflictColumns.includes("farm_id") && conflictColumns.includes("identifier");

  const batches = chunk(normalizedRows, CHUNK_SIZE);
  const batchResults: BatchResult[] = new Array(batches.length);
  const errors: Array<{ batch: number; message: string }> = [];

  let totalInserted = 0;
  let totalUpdated = 0;
  let pointer = 0;

  async function worker() {
    while (pointer < batches.length) {
      const currentIndex = pointer++;
      const currentBatch = batches[currentIndex];

      let insertedCount = currentBatch.length;
      let updatedCount = 0;

      if (canTrackIdentifierUpdates) {
        const identifiers = currentBatch
          .map((row) => {
            const value = (row as Record<string, unknown>).identifier;
            if (typeof value === "string" && value.trim() !== "") return value.trim();
            return null;
          })
          .filter((value): value is string => value !== null);

        const uniqueIdentifiers = Array.from(new Set(identifiers));

        if (uniqueIdentifiers.length > 0) {
          const { data: existing, error: selectError } = await supabase
            .from(targetTable)
            .select("identifier", { head: false })
            .eq("farm_id", farmId)
            .in("identifier", uniqueIdentifiers);

          if (!selectError && Array.isArray(existing)) {
            const existingSet = new Set(
              existing
                .map((row) => {
                  const identifierValue = (row as Record<string, unknown>).identifier;
                  return typeof identifierValue === "string" ? identifierValue.trim() : null;
                })
                .filter((value): value is string => value !== null),
            );

            insertedCount = 0;
            updatedCount = 0;

            currentBatch.forEach((row) => {
              const identifierValue = (row as Record<string, unknown>).identifier;
              const normalizedIdentifier =
                typeof identifierValue === "string" && identifierValue.trim() !== ""
                  ? identifierValue.trim()
                  : null;

              if (normalizedIdentifier && existingSet.has(normalizedIdentifier)) {
                updatedCount += 1;
              } else {
                insertedCount += 1;
                if (normalizedIdentifier) existingSet.add(normalizedIdentifier);
              }
            });
          }
        }
      }

      const { error, status } = await supabase
        .from(targetTable)
        .upsert(currentBatch, {
          onConflict,
          ignoreDuplicates: false,
          returning: "minimal",
        });

      if (error) {
        const message = `${status ?? ""} - ${error.message}`.trim();
        errors.push({ batch: currentIndex + 1, message });
        batchResults[currentIndex] = {
          batch: currentIndex + 1,
          total: currentBatch.length,
          inserted: 0,
          updated: 0,
          error: message,
        };
      } else {
        totalInserted += insertedCount;
        totalUpdated += updatedCount;
        batchResults[currentIndex] = {
          batch: currentIndex + 1,
          total: currentBatch.length,
          inserted: insertedCount,
          updated: updatedCount,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => worker()));

  const orderedResults = batchResults.filter(Boolean).sort((a, b) => a.batch - b.batch);

  return {
    status: 200,
    body: {
      total_received: rows.length,
      total_success: totalInserted + totalUpdated,
      total_batches: batches.length,
      chunk_size: CHUNK_SIZE,
      inserted: totalInserted,
      updated: totalUpdated,
      batch_results: orderedResults,
      errors,
    },
  };
}
