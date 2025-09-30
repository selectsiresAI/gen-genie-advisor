import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import LegendBankUpload from '@/components/conversao/LegendBankUpload';
import UploadStep, { UploadResult } from '@/components/conversao/UploadStep';
import DetectionTable from '@/components/conversao/DetectionTable';
import ReviewMapper from '@/components/conversao/ReviewMapper';
import ValidationPanel from '@/components/conversao/ValidationPanel';
import PreviewBeforeAfter from '@/components/conversao/PreviewBeforeAfter';
import { detectAliasesFromHeaders } from '@/lib/conversion/detect';
import type { AliasSuggestion, DetectionRow } from '@/lib/conversion/types';
import { CONFIDENCE_BADGE_MAP, KNOWN_CANONICAL_COLUMNS, REQUIRED_CANONICAL_KEYS } from '@/lib/conversion/constants';

const ConversaoPage: React.FC = () => {
  const { toast } = useToast();
  const [legendMappings, setLegendMappings] = useState<AliasSuggestion[] | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [detections, setDetections] = useState<DetectionRow[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [reviewRequested, setReviewRequested] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const handleLegendReady = (m: AliasSuggestion[]) => {
    setLegendMappings(m);
    if (uploadResult) {
      const res = detectAliasesFromHeaders(uploadResult.headers, {
        inventory: uploadResult.inventory,
        externalMappings: m,
      });
      setDetections(res);
      const mapping = res.reduce<Record<string, string>>((acc, row) => {
        if (row.suggested && row.score >= CONFIDENCE_BADGE_MAP.medium) acc[row.alias_original] = row.suggested;
        return acc;
      }, {});
      setSelections(mapping);
      setReviewRequested(false);
      setAuthorized(false);
    }
  };

  const handleUpload = (result: UploadResult) => {
    setUploadResult(result);
    const detectionResults = detectAliasesFromHeaders(result.headers, {
      inventory: result.inventory,
      externalMappings: legendMappings ?? undefined,
    });
    setDetections(detectionResults);
    const mapping = detectionResults.reduce<Record<string, string>>((acc, row) => {
      if (row.suggested && row.score >= CONFIDENCE_BADGE_MAP.medium) acc[row.alias_original] = row.suggested;
      return acc;
    }, {});
    setSelections(mapping);
    setReviewRequested(false);
    setAuthorized(false);
  };

  const handleSelectionChange = (alias: string, canonical: string) => {
    setSelections((prev) => ({ ...prev, [alias]: canonical }));
    setAuthorized(false);
  };

  const finalMappings = useMemo(
    () => detections.map((row) => ({ ...row, chosen: selections[row.alias_original] ?? '' })),
    [detections, selections],
  );
  const pendingAliases = useMemo(
    () => finalMappings.filter((r) => !r.chosen).map((r) => r.alias_original),
    [finalMappings],
  );
  const pendingSet = useMemo(() => new Set(pendingAliases), [pendingAliases]);
  const flaggedRows = useMemo(() => detections.filter((r) => pendingSet.has(r.alias_original)), [detections, pendingSet]);

  const requiredMissing = useMemo(() => {
    const chosenSet = new Set(finalMappings.map((r) => r.chosen).filter(Boolean));
    return REQUIRED_CANONICAL_KEYS.filter((k) => !chosenSet.has(k));
  }, [finalMappings]);

  const canAuthorize = reviewRequested && requiredMissing.length === 0 && pendingAliases.length === 0;

  const handleRequestReview = () => {
    if (!uploadResult)
      return toast({ title: 'Nenhum arquivo', description: 'Envie a planilha de dados primeiro.', variant: 'destructive' });
    setReviewRequested(true);
    toast({ title: 'Revisão solicitada', description: 'Aguardando autorização técnica.' });
  };

  const handleAuthorize = () => {
    if (!reviewRequested)
      return toast({ title: 'Revisão pendente', description: 'Solicite a revisão técnica antes.', variant: 'destructive' });
    if (!canAuthorize)
      return toast({ title: 'Pendências', description: 'Resolva todas as pendências antes de autorizar.', variant: 'destructive' });
    setAuthorized(true);
    toast({ title: 'Autorizado', description: 'Download liberado.' });
  };

  const handleDownloadStandardized = () => {
    if (!uploadResult) return;
    if (!authorized) {
      toast({ title: 'Autorização pendente', description: 'Autorize os ajustes para liberar o download.', variant: 'destructive' });
      return;
    }

    const canonicalMap = new Map<string, string>();
    detections.forEach((det) => {
      const chosen = selections[det.alias_original] || (det.score >= CONFIDENCE_BADGE_MAP.medium ? det.suggested : '');
      if (chosen) canonicalMap.set(det.alias_original, chosen);
    });

    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(uploadResult.workbookData, { type: 'array' });
    } catch (e) {
      toast({ title: 'Erro ao ler planilha', description: 'Não foi possível reprocessar o arquivo.', variant: 'destructive' });
      return;
    }
    const sheetName = uploadResult.primarySheetName && wb.SheetNames.includes(uploadResult.primarySheetName)
      ? uploadResult.primarySheetName
      : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      toast({ title: 'Aba não encontrada', description: 'Não foi possível localizar a aba original.', variant: 'destructive' });
      return;
    }

    const originalRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

    const allOriginalHeaders = Object.keys(originalRows[0] ?? {});
    const renamedHeaders = allOriginalHeaders.map((h) => canonicalMap.get(h) ?? h);
    const ptaCanonical = KNOWN_CANONICAL_COLUMNS.filter((c) => c.category === 'PTA' || c.category === 'indice').map(
      (c) => c.canonical_key,
    );
    const finalHeaderSet = new Set<string>([...renamedHeaders, ...ptaCanonical]);

    const dataset = originalRows.map((row) => {
      const out: Record<string, unknown> = {};
      finalHeaderSet.forEach((h) => (out[h] = ''));
      for (const orig of allOriginalHeaders) {
        const dest = canonicalMap.get(orig) ?? orig;
        out[dest] = row[orig];
      }
      return out;
    });

    const headersArray = Array.from(finalHeaderSet);
    const outWs = dataset.length > 0
      ? XLSX.utils.json_to_sheet(dataset, { header: headersArray })
      : XLSX.utils.aoa_to_sheet([headersArray]);

    const outWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(outWb, outWs, 'Padronizado');

    const base = uploadResult.fileName.replace(/\.(csv|xlsx|xls)$/i, '') || 'dataset';
    const outName = `${base}_padronizado.xlsx`;
    XLSX.writeFile(outWb, outName);
    toast({ title: 'Arquivo gerado', description: outName });
  };

  const statusMessage = !reviewRequested
    ? 'Solicite revisão técnica para liberar o download.'
    : !authorized
    ? 'Aguardando autorização do técnico.'
    : 'Ajustes autorizados. Download disponível.';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Conversão (provisório)</h1>
        <p className="text-muted-foreground max-w-3xl">
          Envie um <b>Banco de Nomenclaturas</b> (opcional) e um <b>Arquivo de Dados</b>. O sistema propõe as conversões;
          você aprova e baixa o arquivo padronizado.
        </p>
      </div>

      <LegendBankUpload onLegendReady={handleLegendReady} />
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
              <Button
                variant="outline"
                onClick={() => {
                  const data = { file: uploadResult.fileName, generated_at: new Date().toISOString(), detections };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'conversion-detections.json';
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
              >
                Exportar detecção (JSON)
              </Button>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <DetectionTable
              rows={detections.filter((r) => !selections[r.alias_original])}
              showExport={false}
              title="Aliases fora do padrão"
              description="Revise apenas o que não teve correspondência automática ou que ficou ambíguo."
              limit={200}
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
