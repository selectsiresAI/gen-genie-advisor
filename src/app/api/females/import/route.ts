import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as XLSX from "xlsx";

import { supabase } from "@/integrations/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const AllowedMime = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const FemaleSchema = z.object({
  farm_id: z.string().uuid(),
  name: z.string().min(1),
  birth_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).nullable().optional(),
  sire_naab: z.string().optional().nullable(),
  mgs_naab: z.string().optional().nullable(),
  mggs_naab: z.string().optional().nullable(),
  fonte: z.enum(["Genômica", "Predição"]).optional().nullable(),
  hhp_dollar: z.number().optional().nullable(),
  tpi: z.number().optional().nullable(),
  nm_dollar: z.number().optional().nullable(),
  // ... inclua quaisquer PTAs adicionais permitidas ...
});

const ALLOWED_COLUMNS = new Set([
  "farm_id",
  "name",
  "birth_date",
  "sire_naab",
  "mgs_naab",
  "mggs_naab",
  "fonte",
  "hhp_dollar",
  "tpi",
  "nm_dollar",
  /* ... todas as PTAs permitidas ... */
]);

function sanitizeRecord(raw: Record<string, unknown>) {
  const obj: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    if (!ALLOWED_COLUMNS.has(normalizedKey)) continue;

    let sanitizedValue: unknown = value;
    if (typeof sanitizedValue === "string") {
      let trimmed = sanitizedValue.trim();
      if (trimmed === "") {
        sanitizedValue = null;
      } else if (/^-?\d+(?:[.,]\d+)?$/.test(trimmed)) {
        sanitizedValue = Number(trimmed.replace(",", "."));
      } else {
        sanitizedValue = trimmed;
      }
    }

    obj[normalizedKey] = sanitizedValue;
  }

  return obj;
}

async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  const extension = file.name?.toLowerCase() ?? "";
  const isAllowedType = AllowedMime.includes(file.type);
  const isAllowedExtension =
    extension.endsWith(".csv") ||
    extension.endsWith(".xls") ||
    extension.endsWith(".xlsx");

  if (!isAllowedType && !isAllowedExtension) {
    throw new Error("Tipo de arquivo não permitido");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (!workbook.SheetNames.length) {
    return [];
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
    blankrows: false,
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 20) {
      return NextResponse.json({ error: "Arquivo acima de 20MB" }, { status: 413 });
    }

    const rawRecords = await parseFile(file);
    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      return NextResponse.json({ error: "Arquivo sem linhas" }, { status: 400 });
    }

    const sanitized = rawRecords.map(sanitizeRecord);

    const validated = sanitized.map((record, index) => {
      const parsed = FemaleSchema.safeParse(record);
      if (!parsed.success) {
        throw new Error(`Linha ${index + 1}: ${parsed.error.issues[0].message}`);
      }
      return parsed.data;
    });

    const allowedColumns = Array.from(ALLOWED_COLUMNS);
    const toInsert = validated.map((entry) => {
      const row: Record<string, unknown> = {};
      for (const column of allowedColumns) {
        if (column in entry) {
          row[column] = entry[column as keyof typeof entry];
        }
      }
      return row;
    });

    const { error } = await supabase
      .from("females_")
      .upsert(toInsert, { onConflict: "farm_id,name" });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, inserted: toInsert.length });
  } catch (error: unknown) {
    console.error("Import females error:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao importar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
