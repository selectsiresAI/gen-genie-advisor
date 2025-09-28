import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import {
  ImporterSchema,
  SuggestedMap,
  normalizeRows,
  resolveSupabaseConfig,
  suggestMapping,
} from "@/lib/importer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type UploadPTAProps = {
  herdId: string;
  entityId?: string;
  profileId?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const nonEmpty = (value: any) => value !== undefined && value !== null && value !== "";

const createBatchId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `batch-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

function buildRowObjects(headers: string[], dataRows: any[][]) {
  return dataRows
    .map((row) => {
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? null;
      });
      return record;
    })
    .filter((record) => Object.values(record).some(nonEmpty));
}

export const UploadPTA: React.FC<UploadPTAProps> = ({
  herdId,
  entityId,
  profileId,
  supabaseUrl,
  supabaseAnonKey,
}) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<SuggestedMap>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const canonicalEntries = useMemo(
    () => Object.entries(ImporterSchema.CANONICAL_LABELS) as [string, string][],
    []
  );

  const preview = useMemo(() => {
    if (!rows.length || !headers.length) return [];
    return normalizeRows(rows.slice(0, 5), mapping, headers, {
      herdId,
      entityId,
      profileId,
      batchId: "preview",
    });
  }, [rows, headers, mapping, herdId, entityId, profileId]);

  const onFile: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setMessage("Arquivo sem abas válidas");
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const rowsArray = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];
      if (!rowsArray.length) {
        setMessage("Planilha vazia");
        return;
      }
      const headerRow = (rowsArray[0] ?? []).map((header) => String(header ?? "").trim());
      const cleanHeaders = headerRow.filter((header) => header);
      const dataRows = rowsArray.slice(1);
      const rowObjects = buildRowObjects(cleanHeaders, dataRows);
      setHeaders(cleanHeaders);
      setRows(rowObjects);
      setMapping(suggestMapping(cleanHeaders));
    } catch (error: any) {
      console.error("Falha ao ler arquivo", error);
      setMessage(error?.message ?? "Erro ao ler arquivo");
    }
  };

  const setMap = (column: string, value: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [column]: value ? (value as keyof typeof ImporterSchema.CANONICAL_LABELS) : null,
    }));
  };

  const handleImport = async () => {
    if (!herdId) {
      setMessage("Informe um herdId válido");
      return;
    }

    if (!rows.length) {
      setMessage("Nenhum dado carregado");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const config = resolveSupabaseConfig({ url: supabaseUrl, anonKey: supabaseAnonKey });
      const supabase = createClient(config.url, config.anonKey);
      const batchId = createBatchId();
      const normalized = normalizeRows(rows, mapping, headers, {
        herdId,
        entityId,
        profileId,
        batchId,
      }).map(({ import_batch_id, ...record }) => ({
        ...record,
        import_batch_id: batchId,
      }));

      if (!normalized.length) {
        setMessage("Nenhum registro válido após normalização");
        return;
      }

      const chunkSize = 500;
      for (let i = 0; i < normalized.length; i += chunkSize) {
        const chunk = normalized.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("genetic_records")
          .upsert(chunk, { onConflict: "herd_id,animal_id,cdcb_id,naab" });
        if (error) throw error;
      }

      setMessage(`Importação concluída. Registros: ${normalized.length}`);
    } catch (error: any) {
      console.error("Falha ao importar", error);
      setMessage(`Falha ao importar: ${error?.message ?? error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Importar dados genéticos (Excel/CSV)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pta-file">Arquivo</Label>
          <Input id="pta-file" type="file" accept=".xlsx,.xls,.csv" onChange={onFile} />
          {fileName && <p className="text-xs text-muted-foreground">Selecionado: {fileName}</p>}
        </div>

        {headers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Mapeamento de colunas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {headers.map((header) => (
                <div key={header} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Coluna no arquivo</div>
                    <div className="font-mono text-sm truncate" title={header}>
                      {header}
                    </div>
                  </div>
                  <div className="w-56">
                    <Select value={mapping[header] ?? ""} onValueChange={(value) => setMap(header, value || null)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o campo canônico" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">— Ignorar —</SelectItem>
                        {canonicalEntries.map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Sugestões automáticas aplicadas. Unidades em kg são convertidas para lbs.
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Prévia (5 primeiras linhas normalizadas)</h3>
            <ScrollArea className="h-40 border rounded-md">
              <pre className="text-xs p-3 whitespace-pre-wrap">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleImport} disabled={loading}>
              {loading ? "Importando…" : "Importar"}
            </Button>
            <Badge variant="secondary">Registros detectados: {rows.length}</Badge>
            {message && <Badge variant="outline">{message}</Badge>}
          </div>
        )}

        {rows.length === 0 && message && <Badge variant="outline">{message}</Badge>}
      </CardContent>
    </Card>
  );
};

export default UploadPTA;
