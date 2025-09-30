import type { DetectionRow, InventoryRow, PreviewRow } from '@/lib/conversion/types';
import { normalizeAlias } from '@/lib/conversion/normalize';

interface PreviewRequestBody {
  rows?: PreviewRow[];
  detections?: DetectionRow[];
  inventory?: InventoryRow[];
  selections?: Record<string, string>;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as PreviewRequestBody;
    const rows = body.rows ?? [];
    const detections = body.detections ?? [];
    const selections = body.selections ?? {};

    const preview = rows.map((row) => {
      const after: Record<string, unknown> = {};
      for (const detection of detections) {
        const canonical = selections[detection.alias_original] ?? detection.suggested;
        if (!canonical) continue;
        after[canonical] = row.before[detection.alias_original];
      }
      return { before: row.before, after } satisfies PreviewRow;
    });

    const summary = {
      total_rows: preview.length,
      unique_aliases: detections.map((row) => normalizeAlias(row.alias_original)).length,
    };

    return Response.json({ data: preview, summary });
  } catch (error) {
    console.error('[api/conversion/preview] error', error);
    return Response.json({ error: 'Erro inesperado ao gerar prévia.' }, { status: 500 });
  }
}
