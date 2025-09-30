import React from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { InventoryRow, PreviewRow } from '@/lib/conversion/types';

export interface UploadResult {
  headers: string[];
  inventory: InventoryRow[];
  previewRows: PreviewRow[];
  fileName: string;
}

interface UploadStepProps {
  onUploadComplete: (result: UploadResult) => void;
}

const MAX_PREVIEW_ROWS = 20;

function extractHeadersFromSheet(sheet: XLSX.WorkSheet): string[] {
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });
  const [headerRow] = json;
  if (!Array.isArray(headerRow)) {
    return [];
  }
  return headerRow
    .map((cell) => (typeof cell === 'string' ? cell : cell != null ? String(cell) : ''))
    .filter(Boolean);
}

function buildPreviewRows(sheet: XLSX.WorkSheet, headers: string[]): PreviewRow[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  return rows.slice(0, MAX_PREVIEW_ROWS).map((row) => ({
    before: headers.reduce<Record<string, unknown>>((acc, header) => {
      acc[header] = row[header];
      return acc;
    }, {}),
    after: {},
  }));
}

const UploadStep: React.FC<UploadStepProps> = ({ onUploadComplete }) => {
  const { toast } = useToast();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const inventory: InventoryRow[] = [];
      const headerSet = new Set<string>();
      let previewRows: PreviewRow[] = [];

      workbook.SheetNames.forEach((sheetName, index) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;

        const headers = extractHeadersFromSheet(sheet);
        headers.forEach((header) => headerSet.add(header));
        inventory.push({
          sheet: sheetName,
          columns: headers.join(', '),
        });

        if (index === 0) {
          previewRows = buildPreviewRows(sheet, headers);
        }
      });

      const headers = Array.from(headerSet);
      if (headers.length === 0) {
        throw new Error('Nenhum cabeçalho foi encontrado no arquivo fornecido.');
      }

      onUploadComplete({
        headers,
        inventory,
        previewRows,
        fileName: file.name,
      });

      toast({
        title: 'Arquivo processado',
        description: `${file.name} carregado com ${headers.length} colunas distintas`,
      });
    } catch (error) {
      console.error('Erro ao ler arquivo', error);
      toast({
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Não foi possível interpretar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload e Detecção</CardTitle>
        <CardDescription>
          Envie um arquivo CSV ou XLSX para detectar automaticamente aliases e inventariar as abas/colunas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="conversion-file">Arquivo CSV/XLSX</Label>
          <Input id="conversion-file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} />
          <p className="text-sm text-muted-foreground">
            O arquivo não será enviado ao servidor neste passo. Todo processamento é feito localmente (dry-run).
          </p>
        </div>
        <Separator />
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Inventário automático de abas e colunas.</p>
          <p>• Normalização de aliases e pré-validação com regex e fuzzy matching.</p>
          <p>• Pré-visualização limitada às primeiras 20 linhas da primeira aba.</p>
        </div>
        <Button variant="outline" type="button" onClick={() => document.getElementById('conversion-file')?.click()}>
          Selecionar arquivo
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadStep;
