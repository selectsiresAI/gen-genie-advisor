import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { KNOWN_CANONICAL_COLUMNS, CONFIDENCE_BADGE_MAP } from '@/lib/conversion/constants';
import type { DetectionRow } from '@/lib/conversion/types';

interface ReviewMapperProps {
  rows: DetectionRow[];
  selected: Record<string, string>;
  onChange: (alias: string, canonical: string) => void;
}

const ReviewMapper: React.FC<ReviewMapperProps> = ({ rows, selected, onChange }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revisão Manual</CardTitle>
        <CardDescription>Escolha a chave canônica correta para cada alias pendente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias original</TableHead>
                <TableHead>Sugestão</TableHead>
                <TableHead>Escolha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    Nenhum alias pendente de revisão.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.alias_original}>
                    <TableCell className="font-medium">{row.alias_original}</TableCell>
                    <TableCell>
                      {row.suggested ? (
                        <div className="flex items-center gap-2">
                          <span>{row.suggested}</span>
                          <Badge variant="outline">
                            {row.score >= CONFIDENCE_BADGE_MAP.high
                              ? 'Alta'
                              : row.score >= CONFIDENCE_BADGE_MAP.medium
                              ? 'Média'
                              : 'Baixa'}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={selected[row.alias_original] ?? ''}
                        onValueChange={(value) => onChange(row.alias_original, value)}
                      >
                        <SelectTrigger className="w-full min-w-[180px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem mapeamento</SelectItem>
                          {KNOWN_CANONICAL_COLUMNS.map((col) => (
                            <SelectItem key={col.canonical_key} value={col.canonical_key}>
                              {col.canonical_key} — {col.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

export default ReviewMapper;
