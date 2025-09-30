import React, { useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DetectionRow, PreviewRow } from '@/lib/conversion/types';

interface PreviewBeforeAfterProps {
  rows: PreviewRow[];
  detections: DetectionRow[];
  selections: Record<string, string>;
  onDownload: () => void;
  downloadDisabled?: boolean;
  requiredMissing: string[];
  statusMessage: string;
}

const PreviewBeforeAfter: React.FC<PreviewBeforeAfterProps> = ({
  rows,
  detections,
  selections,
  onDownload,
  downloadDisabled,
  requiredMissing,
  statusMessage,
}) => {
  const previewRows = useMemo(() => {
    return rows.slice(0, 5).map((row) => {
      const after: Record<string, unknown> = {};
      for (const detection of detections) {
        const canonical = selections[detection.alias_original] || detection.suggested;
        if (!canonical) continue;
        after[canonical] = row.before[detection.alias_original];
      }
      return { before: row.before, after };
    });
  }, [rows, detections, selections]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Preview &amp; Download</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">Revise o resultado final antes de exportar.</p>
        {previewRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregue um arquivo para visualizar a prévia.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold">Antes</h4>
              <PreviewTable rows={previewRows.map((row) => row.before)} />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Depois</h4>
              <PreviewTable rows={previewRows.map((row) => row.after)} />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm">{statusMessage}</p>
          {requiredMissing.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requiredMissing.map((item) => (
                <Badge key={item} variant="outline" className="bg-destructive/10 text-destructive">
                  Falta {item}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onDownload} disabled={downloadDisabled}>
          Baixar planilha padronizada
        </Button>
      </CardFooter>
    </Card>
  );
};

interface PreviewTableProps {
  rows: Array<Record<string, unknown> | undefined>;
}

const PreviewTable: React.FC<PreviewTableProps> = ({ rows }) => {
  if (!rows.length) return <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>;
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row ?? {}).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  return (
    <div className="overflow-auto rounded border">
      <table className="w-full min-w-[280px] text-xs">
        <thead className="bg-muted/40">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-2 py-1 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="odd:bg-muted/20">
              {headers.map((header) => (
                <td key={header} className="px-2 py-1">
                  {(row ?? {})[header] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewBeforeAfter;
