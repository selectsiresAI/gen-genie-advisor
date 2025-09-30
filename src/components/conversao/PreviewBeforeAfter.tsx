import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DetectionRow, PreviewRow } from '@/lib/conversion/types';

interface PreviewBeforeAfterProps {
  rows: PreviewRow[];
  detections: DetectionRow[];
  selections: Record<string, string>;
}

const PreviewBeforeAfter: React.FC<PreviewBeforeAfterProps> = ({ rows, detections, selections }) => {
  const preview = useMemo(() => {
    return rows.map((row) => {
      const after: Record<string, unknown> = {};
      for (const detection of detections) {
        const canonical = selections[detection.alias_original] ?? detection.suggested;
        if (!canonical) continue;
        after[canonical] = row.before[detection.alias_original];
      }
      return { before: row.before, after };
    });
  }, [rows, detections, selections]);

  const beforeHeaders = useMemo(() => {
    if (preview.length === 0) return [] as string[];
    return Object.keys(preview[0].before);
  }, [preview]);

  const afterHeaders = useMemo(() => {
    if (preview.length === 0) return [] as string[];
    return Array.from(
      new Set(
        preview.flatMap((row) => Object.keys(row.after)),
      ),
    );
  }, [preview]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Prévia Antes/Depois</CardTitle>
        <CardDescription>
          Amostra de até 20 linhas comparando os cabeçalhos originais com a projeção após o mapeamento escolhido.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Antes</h4>
          <div className="rounded-md border max-h-[320px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {beforeHeaders.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, index) => (
                  <TableRow key={`before-${index}`}>
                    {beforeHeaders.map((header) => (
                      <TableCell key={header} className="text-xs">
                        {row.before[header] as string | number | null | undefined}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {preview.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={beforeHeaders.length || 1} className="text-center text-muted-foreground">
                      Nenhuma prévia disponível.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Depois</h4>
          <div className="rounded-md border max-h-[320px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {afterHeaders.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, index) => (
                  <TableRow key={`after-${index}`}>
                    {afterHeaders.map((header) => (
                      <TableCell key={header} className="text-xs">
                        {row.after[header] as string | number | null | undefined}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {preview.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={afterHeaders.length || 1} className="text-center text-muted-foreground">
                      Nenhuma prévia disponível.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreviewBeforeAfter;
