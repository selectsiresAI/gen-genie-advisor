import { createClient } from "@supabase/supabase-js";

type FemaleRow = Record<string, unknown>;

type BatchResult = {
  batch: number;
  total: number;
  inserted: number;
  updated: number;
  error?: string;
};

const MAX_ROWS = 10_000;
const CHUNK_SIZE = 500;
const CONCURRENCY = 3;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function json<ResponseType>(body: ResponseType, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  let payload: {
    farmId?: string;
    rows?: FemaleRow[];
    onConflict?: string;
    targetTable?: string;
  } = {};

  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isNaN(contentLength) && contentLength > 20 * 1024 * 1024) {
      return json({ error: "Payload maior que o limite de 20MB" }, 413);
    }
  }

  try {
    payload = await req.json();
  } catch (error) {
    return json({ error: "Corpo da requisição inválido" }, 400);
  }

  const { farmId, rows, onConflict = "farm_id,identifier", targetTable = "females" } = payload ?? {};

  if (!farmId || !Array.isArray(rows)) {
    return json({ error: "farmId e rows são obrigatórios" }, 400);
  }

  if (rows.length === 0) {
    return json({ total_received: 0, total_success: 0, total_batches: 0, chunk_size: CHUNK_SIZE, batch_results: [], errors: [] });
  }

  if (rows.length > MAX_ROWS) {
    return json({ error: `Máximo de ${MAX_ROWS} linhas por operação. Divida o arquivo.` }, 400);
  }

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
                .filter((value): value is string => value !== null)
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

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, () => worker())
  );

  const orderedResults = batchResults
    .filter(Boolean)
    .sort((a, b) => a.batch - b.batch);

  return json({
    total_received: rows.length,
    total_success: totalInserted + totalUpdated,
    total_batches: batches.length,
    chunk_size: CHUNK_SIZE,
    inserted: totalInserted,
    updated: totalUpdated,
    batch_results: orderedResults,
    errors,
  });
}
