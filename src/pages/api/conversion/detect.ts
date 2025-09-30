import { detectAliasesFromHeaders } from '@/lib/conversion/detect';
import type { DetectionRow, InventoryRow } from '@/lib/conversion/types';

interface DetectRequestBody {
  headers?: string[];
  inventory?: InventoryRow[];
  limit?: number;
  all?: boolean;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as DetectRequestBody;
    const headers = body.headers ?? [];
    if (!Array.isArray(headers) || headers.length === 0) {
      return Response.json({ error: 'headers é obrigatório' }, { status: 400 });
    }

    let results = detectAliasesFromHeaders(headers, { inventory: body.inventory });

    if (!body.all) {
      const limit = body.limit && body.limit > 0 ? body.limit : 200;
      results = results.slice(0, limit);
    }

    const response: { data: DetectionRow[]; total: number } = {
      data: results,
      total: results.length,
    };

    return Response.json(response);
  } catch (error) {
    console.error('[api/conversion/detect] error', error);
    return Response.json({ error: 'Erro inesperado ao processar detecção.' }, { status: 500 });
  }
}
