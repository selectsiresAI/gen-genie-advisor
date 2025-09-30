import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DetectionRow } from '@/lib/conversion/types';

interface ValidationPanelProps {
  rows: DetectionRow[];
  selections: Record<string, string>;
  requiredMissing: string[];
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({ rows, selections, requiredMissing }) => {
  const { stats, unmappedAliases } = useMemo(() => {
    const counts: Record<string, number> = {
      mapped: 0,
      unmapped: 0,
      exact: 0,
      regex: 0,
      fuzzy: 0,
    };

    const pending: string[] = [];

    rows.forEach((row) => {
      const chosen = selections[row.alias_original] ?? row.suggested;
      if (chosen) {
        counts.mapped++;
      } else {
        counts.unmapped++;
        pending.push(row.alias_original);
      }
      counts[row.method] = (counts[row.method] ?? 0) + 1;
    });

    return { stats: counts, unmappedAliases: pending };
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

        {requiredMissing.length > 0 ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <h4 className="font-semibold text-destructive text-sm">Colunas obrigatórias pendentes</h4>
            <p className="text-xs text-destructive/80">
              Ajuste o mapeamento para as chaves canônicas abaixo antes de gerar o arquivo para o Rebanho.
            </p>
            <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-destructive">
              {requiredMissing.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
            Todas as colunas obrigatórias estão cobertas pelo mapeamento selecionado.
          </div>
        )}

        {unmappedAliases.length > 0 && (
          <div className="rounded-md border p-3">
            <h4 className="font-semibold text-sm">Aliases sem mapeamento</h4>
            <p className="text-xs text-muted-foreground">
              Esses cabeçalhos permanecerão como estão até que um mapeamento seja selecionado.
            </p>
            <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground space-y-1">
              {unmappedAliases.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          </div>
        )}

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
