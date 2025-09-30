import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DetectionRow } from '@/lib/conversion/types';

interface DetectionTableProps {
  rows: DetectionRow[];
  title?: string;
  description?: string;
  showExport?: boolean;
  limit?: number;
  defaultMethod?: 'all' | 'exact' | 'regex' | 'fuzzy' | 'unmapped';
}

const methodLabels: Record<string, string> = {
  all: 'Todos',
  exact: 'Exato',
  regex: 'Regex',
  fuzzy: 'Fuzzy',
  unmapped: 'Sem sugestão',
};

const DetectionTable: React.FC<DetectionTableProps> = ({
  rows,
  title = 'Aliases detectados',
  description,
  showExport = true,
  limit = 200,
  defaultMethod = 'all',
}) => {
  const [filter, setFilter] = useState(defaultMethod);

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows.slice(0, limit);
    return rows.filter((row) => row.method === filter).slice(0, limit);
  }, [rows, filter, limit]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'conversion-detections.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Filtrar</Label>
            <Select value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(methodLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showExport && (
            <Button size="sm" variant="outline" onClick={handleExport}>
              Exportar JSON
            </Button>
          )}
        </div>
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias original</TableHead>
                <TableHead>Sugestão</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Ocorrências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    Nenhum alias encontrado para o filtro selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.alias_original}>
                    <TableCell className="font-medium">{row.alias_original}</TableCell>
                    <TableCell>
                      {row.suggested ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{row.suggested}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{methodLabels[row.method]}</Badge>
                    </TableCell>
                    <TableCell>{row.score.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.occurrences.length > 0 ? row.occurrences.join(', ') : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectionTable;
