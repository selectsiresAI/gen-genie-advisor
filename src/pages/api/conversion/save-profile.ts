import type { DetectionRow } from '@/lib/conversion/types';

interface SaveProfileRequestBody {
  profileName?: string;
  scope?: 'global' | 'private';
  mappings?: DetectionRow[];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SaveProfileRequestBody;
    if (!body.profileName) {
      return Response.json({ error: 'profileName é obrigatório' }, { status: 400 });
    }
    if (!body.scope) {
      return Response.json({ error: 'scope é obrigatório' }, { status: 400 });
    }
    if (!Array.isArray(body.mappings) || body.mappings.length === 0) {
      return Response.json({ error: 'mappings deve conter ao menos um item' }, { status: 400 });
    }

    return Response.json({ ok: true, profile: { name: body.profileName, scope: body.scope, total: body.mappings.length } });
  } catch (error) {
    console.error('[api/conversion/save-profile] error', error);
    return Response.json({ error: 'Erro inesperado ao salvar perfil.' }, { status: 500 });
  }
}
