import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ValidationPanelProps {
  requiredMissing: string[];
  pendingAliases: string[];
  reviewRequested: boolean;
  authorized: boolean;
  canAuthorize: boolean;
  onRequestReview: () => void;
  onAuthorize: () => void;
}

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  requiredMissing,
  pendingAliases,
  reviewRequested,
  authorized,
  canAuthorize,
  onRequestReview,
  onAuthorize,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Validação</CardTitle>
        <CardDescription>Checklist para liberar o download padronizado.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Pendências</h4>
          {pendingAliases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alias aguardando definição.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pendingAliases.map((alias) => (
                <Badge key={alias} variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40">
                  {alias}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-semibold">Obrigatórios</h4>
          {requiredMissing.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos os campos essenciais foram preenchidos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {requiredMissing.map((key) => (
                <Badge key={key} variant="outline" className="bg-destructive/10 text-destructive">
                  Faltando {key}
                </Badge>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-2">
          <Button onClick={onRequestReview} disabled={reviewRequested} className="w-full">
            {reviewRequested ? 'Revisão solicitada' : 'Solicitar revisão técnica'}
          </Button>
          <Button onClick={onAuthorize} disabled={!canAuthorize || authorized} variant="secondary" className="w-full">
            {authorized ? 'Autorizado' : 'Autorizar ajustes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationPanel;
