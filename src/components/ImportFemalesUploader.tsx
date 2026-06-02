'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken, getEdgeUrl, supabase } from '@/lib/edge';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  farmId?: string;
  onSuccess?: (batchId?: string) => void;
};

export default function ImportFemalesUploader({ farmId, onSuccess }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileRef = React.useRef<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState('');
  const [progress, setProgress] = React.useState<string>('');
  const { toast } = useToast();
  const { t } = useTranslation();

  function toastSuccess(message: string) {
    toast({ title: t("femaleImport.uploadComplete"), description: message });
  }

  function toastError(message: string) {
    toast({ title: t("files.uploadError"), description: message, variant: 'destructive' });
  }

  function toastInfo(message: string) {
    toast({ title: t("femaleImport.title"), description: message });
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const f = event.target.files?.[0] ?? null;
    fileRef.current = f;
    setFileName(f?.name ?? '');
  }

  async function convertXlsxToCsv(file: File): Promise<File> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new Error('Empty .xlsx file - no sheets found.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const headerRows = XLSX.utils.sheet_to_json<(string | null)[]>(worksheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: null,
    });
    const headerRow = headerRows[0] ?? [];
    const hasIdentifier = headerRow.some((header) =>
      typeof header === 'string' && header.trim().toLowerCase() === 'identifier',
    );

    if (!hasIdentifier) {
      throw new Error(`${t("femaleImport.missingColumn")} "identifier".`);
    }

    // Force date columns to ISO format (YYYY-MM-DD) so the edge function can parse them
    const csv = XLSX.utils.sheet_to_csv(worksheet, { dateNF: 'yyyy-mm-dd' });
    const blob = new Blob([csv], { type: 'text/csv' });
    const newName = file.name.replace(/\.(xlsx|xls|xlsm)$/i, '.csv');
    return new File([blob], newName, { type: 'text/csv' });
  }

  // Max rows per chunk sent to the edge function. Stays well under the
  // server-side cap (5000) to leave headroom for retries and concurrent users.
  const CHUNK_SIZE = 1500;

  function splitCsv(csv: string): { headerLine: string; dataLines: string[] } {
    const stripped = csv.charCodeAt(0) === 0xFEFF ? csv.slice(1) : csv;
    const lines = stripped.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return { headerLine: lines[0] ?? '', dataLines: lines.slice(1) };
  }

  function buildChunkFile(headerLine: string, chunk: string[], baseName: string, idx: number, total: number): File {
    const csv = [headerLine, ...chunk].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const suffix = total > 1 ? `.part${idx + 1}of${total}.csv` : '.csv';
    const name = baseName.replace(/\.csv$/i, suffix);
    return new File([blob], name, { type: 'text/csv' });
  }

  async function sendChunk(file: File, token: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (farmId) formData.append('farm_id', farmId);

    const response = await fetch(getEdgeUrl('import-females/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${text || 'upload failed'}`);
    }
    return response.json().catch(() => ({}));
  }

  async function handleSubmit() {
    if (!fileRef.current) {
      toastError(t("femaleImport.invalidFormat"));
      return;
    }

    setLoading(true);
    setProgress('');

    try {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshData?.session?.access_token) {
        toastError(t("femaleImport.sessionExpired"));
        setLoading(false);
        return;
      }
      const token = refreshData.session.access_token;

      let uploadFile = fileRef.current;
      if (/\.(xlsx|xls|xlsm)$/i.test(uploadFile.name)) {
        uploadFile = await convertXlsxToCsv(uploadFile);
      } else if (!/\.csv$/i.test(uploadFile.name)) {
        toastError(t("femaleImport.invalidFormat"));
        setLoading(false);
        return;
      }

      const csvText = await uploadFile.text();
      const { headerLine, dataLines } = splitCsv(csvText);

      if (!headerLine || dataLines.length === 0) {
        toastError(t("femaleImport.invalidFormat"));
        setLoading(false);
        return;
      }

      // Build chunks
      const chunks: string[][] = [];
      for (let i = 0; i < dataLines.length; i += CHUNK_SIZE) {
        chunks.push(dataLines.slice(i, i + CHUNK_SIZE));
      }

      let totalInserted = 0;
      let totalValidationErrors = 0;
      let totalInsertErrors = 0;
      let totalDuplicatesRemoved = 0;
      let lastBatchId: string | undefined;
      const failedChunks: number[] = [];

      for (let idx = 0; idx < chunks.length; idx++) {
        setProgress(`${idx + 1}/${chunks.length} (${chunks[idx].length} ${t("femaleImport.femalesImported") || 'rows'})`);
        const chunkFile = buildChunkFile(headerLine, chunks[idx], uploadFile.name, idx, chunks.length);
        try {
          const payload = await sendChunk(chunkFile, token);
          totalInserted += payload?.inserted || 0;
          totalValidationErrors += payload?.validation_errors || 0;
          totalInsertErrors += payload?.insert_errors || 0;
          totalDuplicatesRemoved += payload?.duplicates_removed || 0;
          if (payload?.import_batch_id) lastBatchId = payload.import_batch_id;
        } catch (err) {
          console.error(`Chunk ${idx + 1} failed`, err);
          failedChunks.push(idx + 1);
        }
      }

      const summaryParts: string[] = [];
      summaryParts.push(`${totalInserted} ${t("femaleImport.femalesImported")}`);
      if (totalDuplicatesRemoved > 0) summaryParts.push(`${totalDuplicatesRemoved} duplicates removed`);
      if (totalValidationErrors > 0) summaryParts.push(`${totalValidationErrors} rows skipped`);
      if (chunks.length > 1) summaryParts.push(`${chunks.length} chunks`);

      if (totalInserted === 0 && (totalInsertErrors > 0 || failedChunks.length > 0)) {
        toastError(`${t("femaleImport.uploadFailed")} ${failedChunks.length} chunk(s) failed, ${totalInsertErrors} ${t("femaleImport.insertErrors")}.`);
      } else if (failedChunks.length > 0 || totalInsertErrors > 0) {
        toastInfo(`${t("femaleImport.partialUpload")} ${summaryParts.join(', ')}. Failed chunks: ${failedChunks.join(', ') || 'none'}.`);
      } else {
        toastSuccess(`${t("femaleImport.uploadComplete")} ${summaryParts.join(', ')}.`);
      }

      if (lastBatchId) {
        const commitResponse = await fetch(getEdgeUrl('import-females/commit'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ import_batch_id: lastBatchId, farm_id: farmId }),
        });
        if (!commitResponse.ok) {
          const commitText = await commitResponse.text().catch(() => '');
          console.error('Commit falhou', commitResponse.status, commitText);
        }
      }

      if (typeof onSuccess === 'function') onSuccess(lastBatchId);
    } catch (error: any) {
      if (error?.name === 'NotReadableError' || String(error).includes('NotReadableError')) {
        toastError(t("femaleImport.notReadable"));
      } else if (error?.message?.includes('identifier')) {
        toastError(`${t("femaleImport.missingColumn")} "identifier".`);
      } else if (error instanceof TypeError) {
        toastError(t("femaleImport.corsError"));
      } else {
        console.error(error);
        toastError(`${t("common.unexpectedError")} ${error?.message || t("common.unknown")}`);
      }
    } finally {
      setLoading(false);
      setProgress('');
    }
  }


  return (
    <div className="space-y-3">
      <Label className="text-sm">
        {t("femaleImport.invalidFormat")} — <b>identifier</b>
      </Label>
      <Input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm,.csv"
        onChange={onFileChange}
        disabled={loading}
      />
      {fileName ? (
        <div className="text-xs opacity-80">{fileName}</div>
      ) : null}
      <Button
        disabled={loading || !fileRef.current}
        onClick={handleSubmit}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("files.uploading")}{progress ? ` — ${progress}` : ''}
          </>
        ) : (
          t("herd.import")
        )}
      </Button>
    </div>
  );
}
