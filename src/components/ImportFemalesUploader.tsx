'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAccessToken, getEdgeUrl, supabase } from '@/lib/edge';

type Props = {
  farmId?: string;
  onSuccess?: (batchId?: string) => void;
};

export default function ImportFemalesUploader({ farmId, onSuccess }: Props) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fileRef = React.useRef<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fileName, setFileName] = React.useState('');
  const { toast } = useToast();

  function toastSuccess(message: string) {
    toast({ title: 'Sucesso', description: message });
  }

  function toastError(message: string) {
    toast({ title: 'Erro no upload', description: message, variant: 'destructive' });
  }

  function toastInfo(message: string) {
    toast({ title: 'Importação de Fêmeas', description: message });
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
      throw new Error('Arquivo .xlsx sem planilhas.');
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
      throw new Error('Planilha sem coluna obrigatória: "identifier".');
    }

    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv' });
    const newName = file.name.replace(/\.(xlsx|xls)$/i, '.csv');
    return new File([blob], newName, { type: 'text/csv' });
  }

  async function handleSubmit() {
    if (!fileRef.current) {
      toastError('Selecione um arquivo .xlsx ou .csv.');
      return;
    }

    setLoading(true);

    try {
      await supabase.auth.getSession();

      let uploadFile = fileRef.current;

      if (/\.(xlsx|xls)$/i.test(uploadFile.name)) {
        uploadFile = await convertXlsxToCsv(uploadFile);
      } else if (!/\.csv$/i.test(uploadFile.name)) {
        toastError('Formato inválido. Use .xlsx ou .csv.');
        setLoading(false);
        return;
      }

      const clone = new File([
        await uploadFile.arrayBuffer(),
      ], uploadFile.name, { type: uploadFile.type || 'text/csv' });

      const token = await getAccessToken();

      if (!token) {
        toastError('Sessão inválida. Faça login novamente.');
        setLoading(false);
        return;
      }

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
        console.warn('Falha ao interpretar resposta do upload', parseError);
      }

      const batchId = payload?.import_batch_id;
      const inserted = payload?.inserted || 0;
      const validationErrors = payload?.validation_errors || 0;
      const insertErrors = payload?.insert_errors || 0;

      if (insertErrors > 0 || validationErrors > 0) {
        toastError(`Processamento concluído com avisos: ${inserted} inseridos, ${validationErrors} erros de validação, ${insertErrors} erros de inserção.`);
      } else {
        toastSuccess(`Upload concluído! ${inserted} fêmeas importadas com sucesso.`);
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
          console.warn('Commit falhou', commitResponse.status, commitText);
        }
      }

      if (typeof onSuccess === 'function') {
        onSuccess(batchId);
      }
    } catch (error: any) {
      if (error?.name === 'NotReadableError' || String(error).includes('NotReadableError')) {
        toastError('Não foi possível ler o arquivo (NotReadableError). Selecione novamente e mantenha o modal aberto durante o upload.');
      } else if (error?.message?.includes('identifier')) {
        toastError('Planilha sem coluna obrigatória: "identifier".');
      } else if (error instanceof TypeError) {
        toastError('Não foi possível contatar a Edge Function (CORS/URL).');
      } else {
        console.error(error);
        toastError('Erro inesperado ao processar o arquivo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm">
        Modelos aceitos: .xlsx ou .csv. A planilha deve conter ao menos a coluna <b>identifier</b>.
      </Label>
      <Input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onFileChange}
        disabled={loading}
      />
      {fileName ? (
        <div className="text-xs opacity-80">Selecionado: {fileName}</div>
      ) : null}
      <Button
        disabled={loading || !fileRef.current}
        onClick={handleSubmit}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar'
        )}
      </Button>
    </div>
  );
}
