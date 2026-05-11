import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  FileText, 
  Download, 
  Settings2, 
  Loader2,
  BarChart3,
  Target,
  Beaker,
  TrendingUp,
  Package,
  Users,
  PieChart
} from 'lucide-react';
import { useGeneralReport, ReportType } from '@/hooks/useGeneralReport';
import { generateGeneralReport, downloadPDF } from '@/lib/pdf/generateGeneralReport';
import { useFileStore } from '@/hooks/useFileStore';
import { useToast } from '@/hooks/use-toast';
import ReportSectionRenderer from './ReportSectionRenderer';

interface GeneralReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  farmName: string;
  farmOwner: string;
  userName: string;
}

const REPORT_ICONS: Record<string, React.ReactNode> = {
  herd_summary: <Users className="h-4 w-4" />,
  segmentation: <PieChart className="h-4 w-4" />,
  auditoria_step1: <BarChart3 className="h-4 w-4" />,
  auditoria_step2: <BarChart3 className="h-4 w-4" />,
  auditoria_step3: <BarChart3 className="h-4 w-4" />,
  auditoria_step4: <TrendingUp className="h-4 w-4" />,
  auditoria_step5: <TrendingUp className="h-4 w-4" />,
  auditoria_step6: <BarChart3 className="h-4 w-4" />,
  auditoria_step7: <BarChart3 className="h-4 w-4" />,
};

const REPORT_GROUPS = [
  {
    id: 'herd',
    title: 'Dados do Rebanho',
    types: ['herd_summary', 'segmentation'] as ReportType[],
  },
  {
    id: 'auditoria',
    title: 'Auditoria Genética (7 Etapas)',
    types: [
      'auditoria_step1',
      'auditoria_step2',
      'auditoria_step3',
      'auditoria_step4',
      'auditoria_step5',
      'auditoria_step6',
      'auditoria_step7',
    ] as ReportType[],
  },
];

export default function GeneralReportModal({
  open,
  onOpenChange,
  farmId,
  farmName,
  farmOwner,
  userName,
}: GeneralReportModalProps) {
  const {
    reports,
    config,
    isGenerating,
    progress,
    progressMessage,
    toggleReport,
    toggleAllAuditoria,
    updateConfig,
    setProgress,
    setGenerating,
    getSelectedReports,
    getEstimatedPages,
    reset,
  } = useGeneralReport();

  const [showRenderer, setShowRenderer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addReport } = useFileStore();
  const { toast } = useToast();

  const handleSelectAllAuditoria = () => {
    const auditoriaReports = reports.filter(r => r.type.startsWith('auditoria_'));
    const allSelected = auditoriaReports.every(r => r.enabled);
    toggleAllAuditoria(!allSelected);
  };

  const handleSelectAllGroup = (groupTypes: ReportType[]) => {
    const groupReports = reports.filter(r => groupTypes.includes(r.type));
    const allSelected = groupReports.every(r => r.enabled);
    groupReports.forEach(r => {
      if (allSelected && r.enabled) toggleReport(r.type);
      if (!allSelected && !r.enabled) toggleReport(r.type);
    });
  };

  const handleGenerate = useCallback(async () => {
    const selectedReports = getSelectedReports();
    if (selectedReports.length === 0) {
      toast({
        title: 'Nenhum relatório selecionado',
        description: 'Selecione pelo menos um relatório para gerar o PDF.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setShowRenderer(true);

    // Wait for renderer to mount and render charts (needs time for async data fetching)
    setProgress(5, 'Carregando dados dos relatórios...');
    await new Promise(resolve => setTimeout(resolve, 3500));

    try {
      const blob = await generateGeneralReport(
        {
          farmName,
          farmOwner,
          userName,
          reports: selectedReports,
          config,
          onProgress: setProgress,
        },
        containerRef.current
      );

      if (blob) {
        const date = new Date().toISOString().split('T')[0];
        const filename = `Relatorio_Geral_${farmName.replace(/\s+/g, '_')}_${date}.pdf`;

        downloadPDF(blob, filename);

        addReport({
          name: filename,
          type: 'general_report' as any,
          sourceId: farmId,
          data: {
            farmName,
            farmOwner,
            selectedReports: selectedReports.map(r => r.type),
            generatedAt: new Date().toISOString(),
          },
          metadata: {
            createdAt: new Date().toISOString(),
            size: blob.size,
            description: `Relatório geral consolidado - ${selectedReports.length} seções`,
          },
          fileBlob: blob,
        });

        toast({
          title: 'Relatório gerado com sucesso!',
          description: 'O arquivo foi baixado e salvo na Pasta de Arquivos.',
        });

        setTimeout(() => {
          onOpenChange(false);
          reset();
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Ocorreu um erro durante a geração. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setShowRenderer(false);
    }
  }, [
    farmId,
    farmName,
    farmOwner,
    userName,
    config,
    getSelectedReports,
    setGenerating,
    setProgress,
    addReport,
    toast,
    onOpenChange,
    reset,
  ]);

  const selectedCount = getSelectedReports().length;
  const estimatedPages = getEstimatedPages();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Gerar Relatório Geral
            </DialogTitle>
            <DialogDescription>
              {farmName} - Selecione os relatórios para incluir no PDF consolidado
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-medium">{progressMessage || 'Gerando relatório...'}</p>
                <Progress value={progress} className="w-64" />
                <p className="text-sm text-muted-foreground">{progress}%</p>
              </div>
            </div>
          ) : (
            <>
              {/*
                Usar scroll nativo aqui (mais “descobrível” que o ScrollArea em telas pequenas)
                para o usuário perceber que existem mais opções (ex: 7 etapas da Auditoria).
              */}
              <div className="flex-1 max-h-[50vh] overflow-y-auto pr-4">
                <Accordion 
                  type="multiple" 
                  defaultValue={['herd', 'auditoria', 'analysis']}
                  className="w-full"
                >
                  {REPORT_GROUPS.map(group => {
                    const groupReports = reports.filter(r => group.types.includes(r.type));
                    const selectedInGroup = groupReports.filter(r => r.enabled).length;
                    const allSelected = groupReports.every(r => r.enabled);
                    const isAuditoria = group.id === 'auditoria';
                    const isOther = group.id === 'analysis';

                    return (
                      <AccordionItem key={group.id} value={group.id} className="border rounded-lg mb-2 px-1">
                        <AccordionTrigger className="hover:no-underline py-3 px-2">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-left">{group.title}</div>
                              {isOther && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Projeções, Metas, Tendências, Nexus e Botijão
                                </div>
                              )}
                            </div>
                            {selectedInGroup > 0 && (
                              <Badge variant="default" className="text-xs">
                                {selectedInGroup}/{groupReports.length}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 px-2">
                          {/* Botão Selecionar Todos */}
                          <div className="flex items-center justify-between pb-3 mb-3 border-b">
                            <span className="text-sm text-muted-foreground">
                              {isAuditoria ? 'Selecionar todas as etapas' : 'Selecionar todos'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => isAuditoria ? handleSelectAllAuditoria() : handleSelectAllGroup(group.types)}
                            >
                              {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                            </Button>
                          </div>
                          
                          {/* Lista de relatórios individuais */}
                          <div className="space-y-1">
                            {/* Dica visual para auditoria em telas pequenas */}
                            {isAuditoria && groupReports.length > 3 && (
                              <div className="text-xs text-muted-foreground pb-1">
                                Role para ver todas as 7 etapas.
                              </div>
                            )}

                            {groupReports.map((report, idx) => (
                              <label
                                key={report.type}
                                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                              >
                                <Checkbox
                                  checked={report.enabled}
                                  onCheckedChange={() => toggleReport(report.type)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{REPORT_ICONS[report.type]}</span>
                                    <span className="font-medium text-sm">
                                      {isAuditoria ? `Etapa ${idx + 1} — ${report.label.replace(/^Auditoria\s+-\s+/i, '')}` : report.label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {report.description}
                                  </p>
                                </div>
                              </label>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 className="h-4 w-4" />
                  Opções do PDF
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Orientação</Label>
                    <RadioGroup
                      value={config.orientation}
                      onValueChange={(v) => updateConfig({ orientation: v as 'landscape' | 'portrait' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="landscape" />
                        <Label htmlFor="landscape" className="font-normal cursor-pointer">
                          Paisagem
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portrait" id="portrait" />
                        <Label htmlFor="portrait" className="font-normal cursor-pointer">
                          Retrato
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Opções</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.includeCover}
                          onCheckedChange={(c) => updateConfig({ includeCover: !!c })}
                        />
                        <span className="text-sm">Incluir Capa</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.includeIndex}
                          onCheckedChange={(c) => updateConfig({ includeIndex: !!c })}
                        />
                        <span className="text-sm">Incluir Índice</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.includePageNumbers}
                          onCheckedChange={(c) => updateConfig({ includePageNumbers: !!c })}
                        />
                        <span className="text-sm">Numerar Páginas</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <span>
                    {selectedCount} relatório{selectedCount !== 1 ? 's' : ''} selecionado{selectedCount !== 1 ? 's' : ''}
                  </span>
                  <span>~{estimatedPages} páginas estimadas</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || selectedCount === 0}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Gerar PDF Consolidado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden renderer for PDF capture */}
      {showRenderer && (
        <div
          ref={containerRef}
          // Importante: NÃO usar visibility/opacity aqui, senão o html2canvas captura em branco.
          className="fixed left-[-9999px] top-0 w-[1200px] bg-background"
          style={{ pointerEvents: 'none' }}
        >
          <ReportSectionRenderer
            farmId={farmId}
            farmName={farmName}
            selectedReports={getSelectedReports()}
          />
        </div>
      )}
    </>
  );
}
