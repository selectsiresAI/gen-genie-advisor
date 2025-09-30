import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KNOWN_CANONICAL_COLUMNS } from '@/lib/conversion/constants';
import type { DetectionRow } from '@/lib/conversion/types';

interface ReviewMapperProps {
  rows: DetectionRow[];
  selected: Record<string, string>;
  onChange: (alias: string, canonical: string) => void;
}

const ReviewMapper: React.FC<ReviewMapperProps> = ({ rows, selected, onChange }) => {
  const canonicalOptions = useMemo(() => {
    return [...KNOWN_CANONICAL_COLUMNS].sort((a, b) => {
      const requiredSort = Number(Boolean(b.required)) - Number(Boolean(a.required));
      if (requiredSort !== 0) {
        return requiredSort;
      }
      return a.canonical_key.localeCompare(b.canonical_key);
    });
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ajustes pendentes</CardTitle>
        <CardDescription>
          Revise apenas os aliases que ainda estão fora do padrão e selecione a chave canônica adequada antes da
          autorização técnica.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px] space-y-4">
          <div className="space-y-4 pr-4">
            {rows.map((row) => {
              const value = selected[row.alias_original] ?? '';
              return (
                <div key={row.alias_original} className="space-y-1">
                  <Label className="text-sm font-medium flex justify-between">
                    <span>{row.alias_original}</span>
                    <span className="text-xs text-muted-foreground capitalize">{row.method}</span>
                  </Label>
                  {row.suggested && (
                    <p className="text-xs text-muted-foreground">Sugestão automática: {row.suggested}</p>
                  )}
                  <Select value={value} onValueChange={(canonical) => onChange(row.alias_original, canonical)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar chave canônica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Manter original</SelectItem>
                      {canonicalOptions.map((column) => (
                        <SelectItem key={column.canonical_key} value={column.canonical_key}>
                          {column.canonical_key}
                          {column.required ? ' • obrigatório' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum ajuste pendente. Tudo pronto para autorização.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ReviewMapper;
