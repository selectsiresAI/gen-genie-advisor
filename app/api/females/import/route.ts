import { handleFemaleImport } from "../../../../src/server/females/import-handler";

function json<ResponseType>(body: ResponseType, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const MAX_PAYLOAD_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isNaN(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "Payload maior que o limite de 20MB" }, 413);
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    return json({ error: "Corpo da requisição inválido" }, 400);
  }

  const result = await handleFemaleImport(payload ?? {});
  return json(result.body, result.status);
}
