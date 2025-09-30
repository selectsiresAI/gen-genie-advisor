import React from 'react';
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
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Revisão Humana</CardTitle>
        <CardDescription>
          Ajuste manualmente a chave canônica sugerida para cada alias utilizando o combobox por linha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[420px] space-y-4">
          <div className="space-y-4 pr-4">
            {rows.map((row) => {
              const value = selected[row.alias_original] ?? row.suggested;
              return (
                <div key={row.alias_original} className="space-y-1">
                  <Label className="text-sm font-medium flex justify-between">
                    <span>{row.alias_original}</span>
                    <span className="text-xs text-muted-foreground capitalize">{row.method}</span>
                  </Label>
                  <Select value={value} onValueChange={(canonical) => onChange(row.alias_original, canonical)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar chave canônica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Manter original</SelectItem>
                      {KNOWN_CANONICAL_COLUMNS.map((column) => (
                        <SelectItem key={column.canonical_key} value={column.canonical_key}>
                          {column.canonical_key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alias detectado até o momento.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ReviewMapper;
