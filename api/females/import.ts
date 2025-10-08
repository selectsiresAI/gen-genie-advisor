import type { IncomingMessage } from "http";
import type { ServerResponse } from "http";
import { handleFemaleImport } from "../../src/server/females/import-handler";

const MAX_PAYLOAD_BYTES = 20 * 1024 * 1024;

type VercelRequest = IncomingMessage & {
  method?: string;
  headers: IncomingMessage["headers"] & { "content-length"?: string };
};

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function sendJson(res: VercelResponse, status: number, body: unknown) {
  res.status(status);
  res.setHeader("Content-Type", "application/json");
  res.json(body);
}

async function readRequestBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;

    req.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > MAX_PAYLOAD_BYTES) {
        reject(Object.assign(new Error("Payload maior que o limite de 20MB"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", (error) => reject(error));
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não suportado" });
  }

  const contentLengthHeader = req.headers["content-length"];
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isNaN(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
      return sendJson(res, 413, { error: "Payload maior que o limite de 20MB" });
    }
  }

  let rawBody = "";
  try {
    rawBody = await readRequestBody(req);
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const status = Number((error as { status?: number }).status) || 400;
      return sendJson(res, status, { error: (error as Error).message });
    }
    console.error("[females/import] Erro ao ler o corpo da requisição", error);
    return sendJson(res, 400, { error: "Corpo da requisição inválido" });
  }

  if (!rawBody) {
    return sendJson(res, 400, { error: "Corpo da requisição inválido" });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    return sendJson(res, 400, { error: "Corpo da requisição inválido" });
  }

  const result = await handleFemaleImport(payload ?? {});
  return sendJson(res, result.status, result.body);
}
