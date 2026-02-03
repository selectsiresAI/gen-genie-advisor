import React, { Suspense } from 'react';
import { ReportSelection, ReportType } from '@/hooks/useGeneralReport';

interface ReportSectionRendererProps {
  farmId: string;
  farmName: string;
  selectedReports: ReportSelection[];
}

// Placeholder components for each report type
// These will be replaced with actual report content
const SectionPlaceholder = ({ 
  type, 
  title, 
  farmName 
}: { 
  type: ReportType; 
  title: string; 
  farmName: string;
}) => (
  <div 
    data-report-section={type}
    className="bg-white p-8 min-h-[600px] flex flex-col"
  >
    <div className="border-b-2 border-red-500 pb-2 mb-6">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{farmName}</p>
    </div>
    
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <p className="text-lg">Conteúdo do relatório: {title}</p>
        <p className="text-sm mt-2">Este é um placeholder - o conteúdo real será carregado dinamicamente</p>
      </div>
    </div>
    
    <div className="mt-auto pt-4 border-t text-xs text-gray-400 text-center">
      Gerado por ToolSS - Select Sires
    </div>
  </div>
);

// Herd Summary Section
const HerdSummarySection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="herd_summary" title="Resumo do Rebanho" farmName={farmName} />
);

// Segmentation Section
const SegmentationSection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="segmentation" title="Segmentação do Rebanho" farmName={farmName} />
);

// Auditoria Sections
const AuditoriaStep1Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step1" title="Auditoria - Análise de Parentesco" farmName={farmName} />
);

const AuditoriaStep2Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step2" title="Auditoria - Top Parents" farmName={farmName} />
);

const AuditoriaStep3Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step3" title="Auditoria - Quartis Overview" farmName={farmName} />
);

const AuditoriaStep4Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step4" title="Auditoria - Progressão Genética" farmName={farmName} />
);

const AuditoriaStep5Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step5" title="Auditoria - Comparação por Categoria" farmName={farmName} />
);

const AuditoriaStep6Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step6" title="Auditoria - Quartis por Índices" farmName={farmName} />
);

const AuditoriaStep7Section = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="auditoria_step7" title="Auditoria - Distribuição de PTAs" farmName={farmName} />
);

// Other Sections
const BotijaoSection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="botijao" title="Botijão Virtual" farmName={farmName} />
);

const ProjecaoSection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="projecao" title="Projeção Genética" farmName={farmName} />
);

const TrendsSection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="trends" title="Gráficos de Tendência" farmName={farmName} />
);

const MetasSection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="metas" title="Metas Genéticas" farmName={farmName} />
);

const NexusSection = ({ farmId, farmName }: { farmId: string; farmName: string }) => (
  <SectionPlaceholder type="nexus" title="Nexus - Predições Genéticas" farmName={farmName} />
);

// Map of report types to their components
const SECTION_COMPONENTS: Record<ReportType, React.FC<{ farmId: string; farmName: string }>> = {
  herd_summary: HerdSummarySection,
  segmentation: SegmentationSection,
  auditoria_step1: AuditoriaStep1Section,
  auditoria_step2: AuditoriaStep2Section,
  auditoria_step3: AuditoriaStep3Section,
  auditoria_step4: AuditoriaStep4Section,
  auditoria_step5: AuditoriaStep5Section,
  auditoria_step6: AuditoriaStep6Section,
  auditoria_step7: AuditoriaStep7Section,
  botijao: BotijaoSection,
  projecao: ProjecaoSection,
  trends: TrendsSection,
  metas: MetasSection,
  nexus: NexusSection,
};

export default function ReportSectionRenderer({
  farmId,
  farmName,
  selectedReports,
}: ReportSectionRendererProps) {
  return (
    <div className="space-y-8">
      {selectedReports.map((report) => {
        const SectionComponent = SECTION_COMPONENTS[report.type];
        
        if (!SectionComponent) {
          console.warn(`No component found for report type: ${report.type}`);
          return null;
        }

        return (
          <Suspense 
            key={report.type} 
            fallback={
              <div data-report-section={report.type} className="p-8 bg-gray-100 animate-pulse">
                Carregando {report.label}...
              </div>
            }
          >
            <SectionComponent farmId={farmId} farmName={farmName} />
          </Suspense>
        );
      })}
    </div>
  );
}
