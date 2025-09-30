import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CONFIDENCE_BADGE_MAP } from '@/lib/conversion/constants';
import type { DetectionRow } from '@/lib/conversion/types';

interface DetectionTableProps {
  rows: DetectionRow[];
  onExportJson?: () => void;
  title?: string;
  description?: string;
  limit?: number;
  showExport?: boolean;
  defaultMethod?: 'all' | DetectionRow['method'];
}

const DEFAULT_LIMIT = 200;

function getConfidenceVariant(score: number) {
  if (score >= CONFIDENCE_BADGE_MAP.high) return 'default';
  if (score >= CONFIDENCE_BADGE_MAP.medium) return 'secondary';
  return 'destructive';
}

const DetectionTable: React.FC<DetectionTableProps> = ({
  rows,
  onExportJson,
  title = 'Sugestões de Mapeamento (primeiros 200)',
  description = 'Ajuste filtros ou exporte o JSON com os resultados da detecção para revisão.',
  limit = DEFAULT_LIMIT,
  showExport = true,
  defaultMethod = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState<'all' | DetectionRow['method']>(defaultMethod);
  const [showAll, setShowAll] = useState(false);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = row.alias_original.toLowerCase().includes(search.toLowerCase());
      const matchesMethod = method === 'all' || row.method === method;
      return matchesSearch && matchesMethod;
    });
  }, [rows, search, method]);

  const displayRows = showAll ? filteredRows : filteredRows.slice(0, limit);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {showExport && (
          <Button variant="outline" size="sm" onClick={onExportJson} disabled={rows.length === 0}>
            Baixar JSON
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="detection-search">Buscar alias</Label>
            <Input
              id="detection-search"
              placeholder="Filtrar por alias original"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={(value) => setMethod(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="regex">Regex</SelectItem>
                <SelectItem value="fuzzy">Fuzzy</SelectItem>
                <SelectItem value="unmapped">Unmapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => setShowAll((prev) => !prev)} disabled={filteredRows.length <= limit}>
              {showAll ? `Mostrar primeiros ${limit}` : 'Ver todos'} ({filteredRows.length})
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[420px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias Original</TableHead>
                <TableHead>Sugestão (canônica)</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Ocorrências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row) => (
                <TableRow key={row.alias_original}>
                  <TableCell className="font-medium">{row.alias_original}</TableCell>
                  <TableCell>{row.suggested || '—'}</TableCell>
                  <TableCell className="capitalize">{row.method}</TableCell>
                  <TableCell>
                    <Badge variant={getConfidenceVariant(row.score)}>
                      {row.score ? row.score.toFixed(2) : '0.00'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.occurrences.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.occurrences.map((occurrence) => (
                          <Badge key={occurrence} variant="outline">
                            {occurrence}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {displayRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum alias encontrado com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DetectionTable;
