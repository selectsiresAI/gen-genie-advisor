import React from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { KNOWN_CANONICAL_COLUMNS } from '@/lib/conversion/constants';
import type { PreviewRow, UploadResult } from '@/lib/conversion/types';

interface UploadStepProps {
  onUploadComplete: (result: UploadResult) => void;
}

const MAX_PREVIEW_ROWS = 5;

export const UploadStep: React.FC<UploadStepProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();

  const triggerFileDialog = () => {
    const input = document.getElementById('dataset-file') as HTMLInputElement | null;
    input?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const isCsv = /\.csv$/i.test(file.name);

      let headers: string[] = [];
      let previewRows: PreviewRow[] = [];
      let primarySheetName: string | undefined;

      if (isCsv) {
        const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length === 0) throw new Error('Arquivo CSV vazio.');
        headers = lines[0].split(',').map((h) => h.trim());
        const rows = lines.slice(1).map((line) => {
          const cols = line.split(',');
          const obj: Record<string, string> = {};
          headers.forEach((header, index) => {
            obj[header] = cols[index]?.trim() ?? '';
          });
          return obj;
        });
        previewRows = rows.slice(0, MAX_PREVIEW_ROWS).map((row) => ({ before: row }));
      } else {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        primarySheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[primarySheetName];
        if (!worksheet) throw new Error('Não foi possível ler a primeira aba da planilha.');
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
        headers = Object.keys(jsonRows[0] ?? {});
        previewRows = jsonRows.slice(0, MAX_PREVIEW_ROWS).map((row) => ({ before: row }));
      }

      const result: UploadResult = {
        fileName: file.name,
        headers,
        inventory: KNOWN_CANONICAL_COLUMNS,
        previewRows,
        workbookData: arrayBuffer,
        primarySheetName,
      };

      onUploadComplete(result);
      toast({ title: 'Arquivo carregado', description: `${file.name} pronto para análise.` });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erro ao processar arquivo',
        description: error instanceof Error ? error.message : 'Não foi possível ler o arquivo.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Arquivo de Dados</CardTitle>
        <CardDescription>Envie a planilha com os cabeçalhos que deseja padronizar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dataset-file">Excel ou CSV</Label>
          <Input id="dataset-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
        </div>
        <p className="text-xs text-muted-foreground">
          O arquivo não é enviado para o servidor. O processamento é feito diretamente no navegador.
        </p>
        <Button type="button" variant="outline" onClick={triggerFileDialog}>
          Selecionar arquivo
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadStep;
export type { UploadResult };
