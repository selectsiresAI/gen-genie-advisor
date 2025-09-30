import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ValidationPanelProps {
  requiredMissing: string[];
  pendingAliases: string[];
  reviewRequested: boolean;
  authorized: boolean;
  onRequestReview: () => void;
  onAuthorize: () => void;
  canAuthorize: boolean;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  requiredMissing,
  pendingAliases,
  reviewRequested,
  authorized,
  onRequestReview,
  onAuthorize,
  canAuthorize,
}) => {
  const totalPendencias = requiredMissing.length + pendingAliases.length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Pendências para revisão</CardTitle>
        <CardDescription>
          Detectamos automaticamente as colunas que precisam de atenção antes de liberar o ajuste do Rebanho.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <Badge variant={totalPendencias === 0 ? 'default' : 'destructive'}>
            {totalPendencias === 0 ? 'Sem pendências' : `${totalPendencias} pendência(s)`}
          </Badge>
          {authorized ? (
            <span className="text-xs text-emerald-600">Ajustes autorizados pelo técnico.</span>
          ) : reviewRequested ? (
            <span className="text-xs text-muted-foreground">Aguardando autorização do técnico.</span>
          ) : (
            <span className="text-xs text-muted-foreground">Solicite revisão técnica antes de prosseguir.</span>
          )}
        </div>

        {requiredMissing.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <h4 className="font-semibold text-destructive text-sm">Obrigatórias ausentes</h4>
            <p className="text-xs text-destructive/80">
              O sistema não encontrou as chaves canônicas abaixo. Ajuste os aliases para padronizar o arquivo.
            </p>
            <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-destructive">
              {requiredMissing.map((key) => (
                <li key={key}>{key}</li>
              ))}
            </ul>
          </div>
        )}

        {pendingAliases.length > 0 && (
          <div className="rounded-md border p-3">
            <h4 className="font-semibold text-sm">Aliases fora do padrão</h4>
            <p className="text-xs text-muted-foreground">
              Ajuste manualmente esses cabeçalhos antes de solicitar a autorização técnica.
            </p>
            <ul className="mt-2 list-disc pl-4 space-y-1 text-sm text-muted-foreground">
              {pendingAliases.map((alias) => (
                <li key={alias}>{alias}</li>
              ))}
            </ul>
          </div>
        )}

        {totalPendencias === 0 && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
            Todas as colunas obrigatórias e aliases foram padronizados. Aguardando autorização técnica.
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button variant="outline" onClick={onRequestReview} disabled={reviewRequested}>
            {reviewRequested ? 'Revisão solicitada' : 'Solicitar revisão técnica'}
          </Button>
          <Button onClick={onAuthorize} disabled={!canAuthorize || authorized}>
            {authorized ? 'Ajustes autorizados' : 'Autorizar ajustes e liberar download'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationPanel;
