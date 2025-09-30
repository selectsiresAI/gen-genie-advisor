import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import UploadStep, { UploadResult } from '@/components/conversao/UploadStep';
import DetectionTable from '@/components/conversao/DetectionTable';
import ReviewMapper from '@/components/conversao/ReviewMapper';
import ValidationPanel from '@/components/conversao/ValidationPanel';
import PreviewBeforeAfter from '@/components/conversao/PreviewBeforeAfter';
import { detectAliasesFromHeaders } from '@/lib/conversion/detect';
import type { DetectionRow } from '@/lib/conversion/types';
import { CONFIDENCE_BADGE_MAP, REQUIRED_CANONICAL_KEYS } from '@/lib/conversion/constants';

const ConversaoPage: React.FC = () => {
  const { toast } = useToast();
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [detections, setDetections] = useState<DetectionRow[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [reviewRequested, setReviewRequested] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const handleUpload = (result: UploadResult) => {
    setUploadResult(result);
    const detectionResults = detectAliasesFromHeaders(result.headers, { inventory: result.inventory });
    setDetections(detectionResults);
    const mapping = detectionResults.reduce<Record<string, string>>((acc, row) => {
      if (row.suggested && row.score >= CONFIDENCE_BADGE_MAP.medium) {
        acc[row.alias_original] = row.suggested;
      }
      return acc;
    }, {});
    setSelections(mapping);
    setReviewRequested(false);
    setAuthorized(false);
  };

  const handleExportJson = () => {
    const data = {
      file: uploadResult?.fileName ?? 'preview.csv',
      generated_at: new Date().toISOString(),
      detections,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'conversion-detections.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectionChange = (alias: string, canonical: string) => {
    setSelections((prev) => ({
      ...prev,
      [alias]: canonical,
    }));
    setAuthorized(false);
  };

  const finalMappings = useMemo(() => {
    return detections.map((row) => ({
      ...row,
      chosen: selections[row.alias_original] ?? '',
    }));
  }, [detections, selections]);

  const requiredMissing = useMemo(() => {
    const chosenSet = new Set(finalMappings.map((row) => row.chosen).filter(Boolean));
    return REQUIRED_CANONICAL_KEYS.filter((key) => !chosenSet.has(key));
  }, [finalMappings]);

  const pendingAliases = useMemo(() => {
    return finalMappings.filter((row) => !row.chosen).map((row) => row.alias_original);
  }, [finalMappings]);

  const pendingSet = useMemo(() => new Set(pendingAliases), [pendingAliases]);

  const flaggedRows = useMemo(() => {
    return detections.filter((row) => pendingSet.has(row.alias_original));
  }, [detections, pendingSet]);

  const canAuthorize = reviewRequested && requiredMissing.length === 0 && pendingAliases.length === 0;

  const statusMessage = useMemo(() => {
    if (!reviewRequested) {
      return 'Solicite revisão técnica para liberar o download.';
    }
    if (!authorized) {
      return 'Aguardando autorização do técnico.';
    }
    return 'Ajustes autorizados. Download disponível.';
  }, [reviewRequested, authorized]);

  const handleRequestReview = () => {
    if (!uploadResult) {
      toast({
        title: 'Nenhum arquivo carregado',
        description: 'Envie uma planilha antes de solicitar revisão.',
        variant: 'destructive',
      });
      return;
    }
    setReviewRequested(true);
    toast({
      title: 'Revisão solicitada',
      description: 'O técnico foi notificado para aprovar os ajustes.',
    });
  };

  const handleAuthorize = () => {
    if (!reviewRequested) {
      toast({
        title: 'Revisão pendente',
        description: 'Solicite a revisão técnica antes de autorizar.',
        variant: 'destructive',
      });
      return;
    }

    if (requiredMissing.length > 0 || pendingAliases.length > 0) {
      toast({
        title: 'Pendências encontradas',
        description: 'Resolva todas as pendências antes da autorização.',
        variant: 'destructive',
      });
      return;
    }

    setAuthorized(true);
    toast({
      title: 'Ajustes autorizados',
      description: 'Download liberado para a planilha padronizada.',
    });
  };

  const handleDownloadStandardized = () => {
    if (!uploadResult) {
      toast({
        title: 'Nenhum arquivo carregado',
        description: 'Envie uma planilha antes de gerar a versão padronizada.',
        variant: 'destructive',
      });
      return;
    }

    if (!authorized) {
      toast({
        title: 'Autorização pendente',
        description: 'O técnico precisa autorizar os ajustes antes do download.',
        variant: 'destructive',
      });
      return;
    }

    const canonicalMap = new Map<string, string>();
    Object.entries(selections).forEach(([alias, canonical]) => {
      if (canonical) {
        canonicalMap.set(alias, canonical);
      }
    });

    const canonicalHeaders = new Set<string>([...REQUIRED_CANONICAL_KEYS, ...canonicalMap.values()]);

    const dataset = (uploadResult.rows ?? []).map((row) => {
      const output: Record<string, unknown> = {};
      canonicalHeaders.forEach((key) => {
        output[key] = '';
      });
      for (const [alias, canonical] of canonicalMap.entries()) {
        output[canonical] = row[alias];
      }
      return output;
    });

    const headersArray = Array.from(canonicalHeaders);
    let worksheet: XLSX.WorkSheet;
    if (dataset.length > 0) {
      worksheet = XLSX.utils.json_to_sheet(dataset, { header: headersArray });
    } else {
      worksheet = XLSX.utils.aoa_to_sheet([headersArray]);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rebanho');

    const baseName = uploadResult.fileName.replace(/\.(csv|xlsx|xls)$/i, '') || 'dataset';
    const outputName = `${baseName}_padronizado.xlsx`;

    XLSX.writeFile(workbook, outputName);

    toast({
      title: 'Arquivo gerado',
      description: `Download iniciado para ${outputName}.`,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Conversão (provisório)</h1>
        <p className="text-muted-foreground max-w-3xl">
          Detecção automática das colunas obrigatórias do Rebanho. Ajustamos tudo que for possível e destacamos apenas o que
          precisa de atenção humana.
        </p>
      </div>

      <UploadStep onUploadComplete={handleUpload} />

      {uploadResult && (
        <div className="space-y-6">
          <Card className="border-dashed">
            <div className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">Arquivo carregado</p>
                <p className="text-lg font-semibold">{uploadResult.fileName}</p>
              </div>
              <Badge variant="secondary">{detections.length} aliases detectados</Badge>
              <Button variant="outline" onClick={handleExportJson} disabled={detections.length === 0}>
                Exportar detecção (JSON)
              </Button>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <DetectionTable
              rows={flaggedRows}
              onExportJson={handleExportJson}
              showExport={false}
              title="Aliases fora do padrão"
              description="Listamos apenas os cabeçalhos sem correspondência automática. Ajuste-os antes de solicitar autorização."
              limit={100}
              defaultMethod="all"
            />
            <ValidationPanel
              requiredMissing={requiredMissing}
              pendingAliases={pendingAliases}
              reviewRequested={reviewRequested}
              authorized={authorized}
              onRequestReview={handleRequestReview}
              onAuthorize={handleAuthorize}
              canAuthorize={canAuthorize}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReviewMapper rows={flaggedRows} selected={selections} onChange={handleSelectionChange} />
            <PreviewBeforeAfter
              rows={uploadResult.previewRows}
              detections={detections}
              selections={selections}
              onDownload={handleDownloadStandardized}
              downloadDisabled={!authorized}
              requiredMissing={requiredMissing}
              statusMessage={statusMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversaoPage;
