import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DetectionRow } from '@/lib/conversion/types';

interface ValidationPanelProps {
  rows: DetectionRow[];
  selections: Record<string, string>;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ rows, selections }) => {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      mapped: 0,
      unmapped: 0,
      exact: 0,
      regex: 0,
      fuzzy: 0,
    };

    rows.forEach((row) => {
      if ((selections[row.alias_original] ?? row.suggested) && row.method !== 'unmapped') {
        counts.mapped++;
      } else {
        counts.unmapped++;
      }
      counts[row.method] = (counts[row.method] ?? 0) + 1;
    });

    return counts;
  }, [rows, selections]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Validações</CardTitle>
        <CardDescription>
          Indicadores de consistência antes de aplicar o perfil. A pré-validação considera tipo, unidade e regras gerais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Mapeados</p>
            <p className="text-xl font-semibold">{stats.mapped}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Pendentes</p>
            <p className="text-xl font-semibold">{stats.unmapped}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Detecções exatas</p>
            <p className="text-xl font-semibold">{stats.exact}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Regex / Fuzzy</p>
            <p className="text-xl font-semibold">{stats.regex + stats.fuzzy}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-base">Regras de negócio (beta)</h4>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            <li>Tipos numéricos sugeridos para indicadores PTA e índices.</li>
            <li>Percentuais automaticamente convertidos em escala 0-1 quando aplicável.</li>
            <li>Datas validadas contra o padrão ISO (yyyy-mm-dd).</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationPanel;
