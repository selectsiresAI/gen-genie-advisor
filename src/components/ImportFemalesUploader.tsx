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

  async function handleSubmit() {
    if (!fileRef.current) {
      toastError(t("femaleImport.invalidFormat"));
      return;
    }

    setLoading(true);

    try {
      // Refresh session to ensure valid token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData?.session?.access_token) {
        toastError(t("femaleImport.sessionExpired"));
        setLoading(false);
        return;
      }

      // Use the fresh token from the refreshed session
      const token = refreshData.session.access_token;

      let uploadFile = fileRef.current;

      if (/\.(xlsx|xls|xlsm)$/i.test(uploadFile.name)) {
        uploadFile = await convertXlsxToCsv(uploadFile);
      } else if (!/\.csv$/i.test(uploadFile.name)) {
        toastError(t("femaleImport.invalidFormat"));
        setLoading(false);
        return;
      }

      const clone = new File([
        await uploadFile.arrayBuffer(),
      ], uploadFile.name, { type: uploadFile.type || 'text/csv' });

      const formData = new FormData();
      formData.append('file', clone);
      if (farmId) {
        formData.append('farm_id', farmId);
      }

      const url = getEdgeUrl('import-females/upload');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        toastError(`Falha no upload (${response.status}). ${text || 'Ver console.'}`);
        console.error('Upload failed', response.status, text);
        setLoading(false);
        return;
      }

      let payload: any = {};
      try {
        payload = await response.json();
      } catch (parseError) {
        // Failed to parse upload response
      }

      const batchId = payload?.import_batch_id;
      const inserted = payload?.inserted || 0;
      const validationErrors = payload?.validation_errors || 0;
      const insertErrors = payload?.insert_errors || 0;
      const duplicatesRemoved = payload?.duplicates_removed || 0;

      // Build summary message
      const summaryParts: string[] = [];
      summaryParts.push(`${inserted} ${t("femaleImport.femalesImported")}`);
      if (duplicatesRemoved > 0) summaryParts.push(`${duplicatesRemoved} duplicates removed`);
      if (validationErrors > 0) summaryParts.push(`${validationErrors} rows skipped`);

      if (insertErrors > 0 && inserted === 0) {
        toastError(`${t("femaleImport.uploadFailed")} ${insertErrors} ${t("femaleImport.insertErrors")}.`);
      } else if (insertErrors > 0) {
        toastInfo(`${t("femaleImport.partialUpload")} ${summaryParts.join(', ')}. ${insertErrors} ${t("femaleImport.insertErrors")}.`);
      } else {
        toastSuccess(`${t("femaleImport.uploadComplete")} ${summaryParts.join(', ')}.`);
      }

      // Commit the batch
      if (batchId) {
        const commitUrl = getEdgeUrl('import-females/commit');
        const commitResponse = await fetch(commitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ import_batch_id: batchId, farm_id: farmId }),
        });

        if (!commitResponse.ok) {
          const commitText = await commitResponse.text().catch(() => '');
          console.error('Commit falhou', commitResponse.status, commitText);
        }
      }

      if (typeof onSuccess === 'function') {
        onSuccess(batchId);
      }
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
            {t("files.uploading")}
          </>
        ) : (
          t("herd.import")
        )}
      </Button>
    </div>
  );
}
