import type { InventoryRow } from '@/lib/conversion/types';

interface InventoryRequestBody {
  sheets?: Array<{ name: string; columns: string[] }>;
  inventory?: InventoryRow[];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as InventoryRequestBody;
    if (Array.isArray(body.inventory)) {
      return Response.json({ data: body.inventory });
    }

    if (!Array.isArray(body.sheets) || body.sheets.length === 0) {
      return Response.json({ error: 'Nenhum inventário informado.' }, { status: 400 });
    }

    const inventory: InventoryRow[] = body.sheets.map((sheet) => ({
      sheet: sheet.name,
      columns: sheet.columns.join(', '),
    }));

    return Response.json({ data: inventory });
  } catch (error) {
    console.error('[api/conversion/inventory] error', error);
    return Response.json({ error: 'Erro inesperado ao gerar inventário.' }, { status: 500 });
  }
}
