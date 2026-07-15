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
  TrendingUp,
  Users,
  PieChart,
  Sparkles
} from 'lucide-react';
import { useGeneralReport, ReportType } from '@/hooks/useGeneralReport';
import { generateGeneralReport, downloadPDF } from '@/lib/pdf/generateGeneralReport';
import { useFileStore } from '@/hooks/useFileStore';
import { useToast } from '@/hooks/use-toast';
import ReportSectionRenderer from './ReportSectionRenderer';
import { useTranslation } from "@/hooks/useTranslation";

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
  nexus3: <Sparkles className="h-4 w-4" />,
};

const REPORT_GROUPS = [
  {
    id: 'herd',
    title: 'Dados do Rebanho',
    titleEn: 'Herd Data',
    titleEs: 'Datos del Rebaño',
    types: ['herd_summary', 'segmentation'] as ReportType[],
  },
  {
    id: 'auditoria',
    title: 'Auditoria Genética (7 Etapas)',
    titleEn: 'Genetic Audit (7 Steps)',
    titleEs: 'Auditoría Genética (7 Pasos)',
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
  {
    id: 'nexus',
    title: 'Nexus 3',
    titleEn: 'Nexus 3',
    titleEs: 'Nexus 3',
    types: ['nexus3'] as ReportType[],
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
    updateConfig,
    setProgress,
    setGenerating,
    getSelectedReports,
    getEstimatedPages,
    reset,
  } = useGeneralReport();

  const { locale } = useTranslation();
  const isEn = locale === "en-US";
  const isEs = locale === "es";
  const [showRenderer, setShowRenderer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { addReport } = useFileStore();
  const { toast } = useToast();

  const handleGenerate = useCallback(async () => {
    const selectedReports = getSelectedReports();
    if (selectedReports.length === 0) {
      toast({
        title: isEs ? 'Ningún informe seleccionado' : isEn ? 'No report selected' : 'Nenhum relatório selecionado',
        description: isEs ? 'Seleccione al menos un informe para generar el PDF.' : isEn ? 'Select at least one report to generate the PDF.' : 'Selecione pelo menos um relatório para gerar o PDF.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setShowRenderer(true);

    // Wait for renderer to mount and render charts (needs time for async data fetching)
    setProgress(5, isEs ? 'Cargando datos de los informes...' : isEn ? 'Loading report data...' : 'Carregando dados dos relatórios...');
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
            description: isEs ? `Informe general consolidado - ${selectedReports.length} secciones` : isEn ? `Consolidated general report - ${selectedReports.length} sections` : `Relatório geral consolidado - ${selectedReports.length} seções`,
          },
          fileBlob: blob,
        });

        toast({
          title: isEs ? '¡Informe generado exitosamente!' : isEn ? 'Report generated successfully!' : 'Relatório gerado com sucesso!',
          description: isEs ? 'El archivo se descargó y se guardó en la carpeta de Archivos.' : isEn ? 'The file has been downloaded and saved to the Files folder.' : 'O arquivo foi baixado e salvo na Pasta de Arquivos.',
        });

        setTimeout(() => {
          onOpenChange(false);
          reset();
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: isEs ? 'Error al generar informe' : isEn ? 'Error generating report' : 'Erro ao gerar relatório',
        description: isEs ? 'Ocurrió un error durante la generación. Intente nuevamente.' : isEn ? 'An error occurred during generation. Please try again.' : 'Ocorreu um erro durante a geração. Tente novamente.',
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
              {isEs ? "Generar Informe General" : isEn ? "Generate General Report" : "Gerar Relatório Geral"}
            </DialogTitle>
            <DialogDescription>
              {farmName} - {isEs ? "Seleccione los informes para incluir en el PDF consolidado" : isEn ? "Select reports to include in the consolidated PDF" : "Selecione os relatórios para incluir no PDF consolidado"}
            </DialogDescription>
          </DialogHeader>

          {isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-medium">{progressMessage || (isEs ? 'Generando informe...' : isEn ? 'Generating report...' : 'Gerando relatório...')}</p>
                <Progress value={progress} className="w-64" />
                <p className="text-sm text-muted-foreground">{progress}%</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 max-h-[50vh] overflow-y-auto pr-4">
                <Accordion 
                  type="multiple" 
                  defaultValue={['herd', 'auditoria']}
                  className="w-full"
                >
                  {REPORT_GROUPS.map(group => {
                    const groupReports = reports.filter(r => group.types.includes(r.type));
                    const selectedInGroup = groupReports.filter(r => r.enabled).length;
                    const isAuditoria = group.id === 'auditoria';

                    return (
                      <AccordionItem key={group.id} value={group.id} className="border rounded-lg mb-2 px-1">
                        <AccordionTrigger className="hover:no-underline py-3 px-2">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-left">{isEs ? (group as any).titleEs : isEn ? (group as any).titleEn : group.title}</div>
                            </div>
                            {selectedInGroup > 0 && (
                              <Badge variant="default" className="text-xs">
                                {selectedInGroup}/{groupReports.length}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 px-2">
                          <div className="space-y-1">
                            {isAuditoria && groupReports.length > 3 && (
                              <div className="text-xs text-muted-foreground pb-1">
                                {isEs ? "Desplácese para ver los 7 pasos." : isEn ? "Scroll to see all 7 steps." : "Role para ver todas as 7 etapas."}
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
                                      {isAuditoria ? `${isEs ? "Paso" : isEn ? "Step" : "Etapa"} ${idx + 1} — ${report.label.replace(/^Auditoria\s+-\s+/i, '')}` : report.label}
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
                  {isEs ? "Opciones del PDF" : isEn ? "PDF Options" : "Opções do PDF"}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isEs ? "Orientación" : isEn ? "Orientation" : "Orientação"}</Label>
                    <RadioGroup
                      value={config.orientation}
                      onValueChange={(v) => updateConfig({ orientation: v as 'landscape' | 'portrait' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="landscape" />
                        <Label htmlFor="landscape" className="font-normal cursor-pointer">
                          {isEs ? "Horizontal" : isEn ? "Landscape" : "Paisagem"}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portrait" id="portrait" />
                        <Label htmlFor="portrait" className="font-normal cursor-pointer">
                          {isEs ? "Vertical" : isEn ? "Portrait" : "Retrato"}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>{isEs ? "Opciones" : isEn ? "Options" : "Opções"}</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.includeCover}
                          onCheckedChange={(c) => updateConfig({ includeCover: !!c })}
                        />
                        <span className="text-sm">{isEs ? "Incluir Portada" : isEn ? "Include Cover" : "Incluir Capa"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.includeIndex}
                          onCheckedChange={(c) => updateConfig({ includeIndex: !!c })}
                        />
                        <span className="text-sm">{isEs ? "Incluir Índice" : isEn ? "Include Index" : "Incluir Índice"}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={config.includePageNumbers}
                          onCheckedChange={(c) => updateConfig({ includePageNumbers: !!c })}
                        />
                        <span className="text-sm">{isEs ? "Numerar Páginas" : isEn ? "Page Numbers" : "Numerar Páginas"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <span>
                    {isEs
                      ? `${selectedCount} informe${selectedCount !== 1 ? 's' : ''} seleccionado${selectedCount !== 1 ? 's' : ''}`
                      : isEn
                      ? `${selectedCount} report${selectedCount !== 1 ? 's' : ''} selected`
                      : `${selectedCount} relatório${selectedCount !== 1 ? 's' : ''} selecionado${selectedCount !== 1 ? 's' : ''}`}
                  </span>
                  <span>~{estimatedPages} {isEs ? "páginas estimadas" : isEn ? "estimated pages" : "páginas estimadas"}</span>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
              {isEs ? "Cancelar" : isEn ? "Cancel" : "Cancelar"}
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || selectedCount === 0}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEs ? "Generando..." : isEn ? "Generating..." : "Gerando..."}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {isEs ? "Generar PDF Consolidado" : isEn ? "Generate Consolidated PDF" : "Gerar PDF Consolidado"}
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
