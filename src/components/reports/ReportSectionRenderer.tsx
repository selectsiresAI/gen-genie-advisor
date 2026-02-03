import React, { useEffect, useState } from 'react';
import { ReportSelection, ReportType } from '@/hooks/useGeneralReport';
import { useAGFilters } from '@/features/auditoria/store';

// Import actual step components for interactive use
import Step1Parentesco from '@/features/auditoria/steps/Step1Parentesco';
import Step2TopParents from '@/features/auditoria/steps/Step2TopParents';
import Step7QuartisIndices from '@/features/auditoria/steps/Step7QuartisIndices';

// Import simplified report sections
import HerdSummarySectionContent from './sections/HerdSummarySection';
import SegmentationSectionContent from './sections/SegmentationSection';
import AuditoriaStep3Section from './sections/AuditoriaStep3Section';
import AuditoriaStep5Section from './sections/AuditoriaStep5Section';
import AuditoriaStep6Section from './sections/AuditoriaStep6Section';
import AuditoriaStep7Section from './sections/AuditoriaStep7Section';

interface ReportSectionRendererProps {
  farmId: string;
  farmName: string;
  selectedReports: ReportSelection[];
}

// Section wrapper for PDF capture with consistent styling
function SectionWrapper({ 
  type, 
  title, 
  children 
}: { 
  type: ReportType; 
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div 
      data-report-section={type}
      className="bg-background p-6 min-h-[600px]"
      style={{ pageBreakInside: 'avoid' }}
    >
      <div className="border-b-2 border-primary pb-2 mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      
      <div className="report-content">
        {children}
      </div>
    </div>
  );
}

// Placeholder for sections not yet implemented
function PlaceholderSection({ title, farmName }: { title: string; farmName: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium">{title}</p>
        <p className="text-sm mt-2">{farmName}</p>
        <p className="text-xs mt-4 opacity-60">
          Conteúdo será renderizado aqui
        </p>
      </div>
    </div>
  );
}

// Herd Summary Section - using real component
function HerdSummarySection({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="herd_summary" title="Resumo do Rebanho">
      <HerdSummarySectionContent farmId={farmId} farmName={farmName} />
    </SectionWrapper>
  );
}

// Segmentation Section - using real component
function SegmentationSection({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="segmentation" title="Segmentação do Rebanho">
      <SegmentationSectionContent farmId={farmId} farmName={farmName} />
    </SectionWrapper>
  );
}

// Auditoria Step 1 - Parentesco (uses interactive component)
function AuditoriaStep1SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  const setFarmId = useAGFilters(state => state.setFarmId);
  
  useEffect(() => {
    setFarmId(farmId);
  }, [farmId, setFarmId]);

  return (
    <SectionWrapper type="auditoria_step1" title="Auditoria - Análise de Parentesco">
      <Step1Parentesco />
    </SectionWrapper>
  );
}

// Auditoria Step 2 - Top Parents (uses interactive component)
function AuditoriaStep2SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  const setFarmId = useAGFilters(state => state.setFarmId);
  
  useEffect(() => {
    setFarmId(farmId);
  }, [farmId, setFarmId]);

  return (
    <SectionWrapper type="auditoria_step2" title="Auditoria - Top Parents">
      <Step2TopParents />
    </SectionWrapper>
  );
}

// Auditoria Step 3 - Quartis Overview (uses SIMPLIFIED report component)
function AuditoriaStep3SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="auditoria_step3" title="Auditoria - Quartis Overview">
      <AuditoriaStep3Section farmId={farmId} farmName={farmName} />
    </SectionWrapper>
  );
}

// Auditoria Step 4 - Progressão (uses SIMPLIFIED report component - AuditoriaStep5Section)
function AuditoriaStep4SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="auditoria_step4" title="Auditoria - Progressão Genética">
      <AuditoriaStep5Section farmId={farmId} farmName={farmName} />
    </SectionWrapper>
  );
}

// Auditoria Step 5 - Comparação (uses SIMPLIFIED report component - AuditoriaStep6Section)
function AuditoriaStep5SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="auditoria_step5" title="Auditoria - Comparação por Categoria">
      <AuditoriaStep6Section farmId={farmId} farmName={farmName} />
    </SectionWrapper>
  );
}

// Auditoria Step 6 - Quartis Índices (uses interactive component)
function AuditoriaStep6SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  const setFarmId = useAGFilters(state => state.setFarmId);
  
  useEffect(() => {
    setFarmId(farmId);
  }, [farmId, setFarmId]);

  return (
    <SectionWrapper type="auditoria_step6" title="Auditoria - Quartis por Índices">
      <Step7QuartisIndices />
    </SectionWrapper>
  );
}

// Auditoria Step 7 - Distribuição (uses SIMPLIFIED report component)
function AuditoriaStep7SectionWrapper({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="auditoria_step7" title="Auditoria - Distribuição de PTAs">
      <AuditoriaStep7Section farmId={farmId} farmName={farmName} />
    </SectionWrapper>
  );
}

// Other Sections (placeholders for now)
function BotijaoSection({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="botijao" title="Botijão Virtual">
      <PlaceholderSection title="Inventário de Doses" farmName={farmName} />
    </SectionWrapper>
  );
}

function ProjecaoSection({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="projecao" title="Projeção Genética">
      <PlaceholderSection title="Plano de Acasalamento e ROI" farmName={farmName} />
    </SectionWrapper>
  );
}

function MetasSection({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="metas" title="Metas Genéticas">
      <PlaceholderSection title="Metas vs Valores Atuais" farmName={farmName} />
    </SectionWrapper>
  );
}

function NexusSection({ farmId, farmName }: { farmId: string; farmName: string }) {
  return (
    <SectionWrapper type="nexus" title="Nexus - Predições Genéticas">
      <PlaceholderSection title="Predições Genômicas/Pedigree" farmName={farmName} />
    </SectionWrapper>
  );
}

// Map of report types to their components
const SECTION_COMPONENTS: Record<ReportType, React.FC<{ farmId: string; farmName: string }>> = {
  herd_summary: HerdSummarySection,
  segmentation: SegmentationSection,
  auditoria_step1: AuditoriaStep1SectionWrapper,
  auditoria_step2: AuditoriaStep2SectionWrapper,
  auditoria_step3: AuditoriaStep3SectionWrapper,
  auditoria_step4: AuditoriaStep4SectionWrapper,
  auditoria_step5: AuditoriaStep5SectionWrapper,
  auditoria_step6: AuditoriaStep6SectionWrapper,
  auditoria_step7: AuditoriaStep7SectionWrapper,
  botijao: BotijaoSection,
  projecao: ProjecaoSection,
  metas: MetasSection,
  nexus: NexusSection,
};

export default function ReportSectionRenderer({
  farmId,
  farmName,
  selectedReports,
}: ReportSectionRendererProps) {
  const [mounted, setMounted] = useState(false);
  
  // Set farmId in the audit store on mount
  const setFarmId = useAGFilters(state => state.setFarmId);
  
  useEffect(() => {
    setFarmId(farmId);
    // Give time for data to load
    const timer = setTimeout(() => setMounted(true), 500);
    return () => clearTimeout(timer);
  }, [farmId, setFarmId]);

  if (!mounted) {
    return (
      <div className="p-8 text-center">
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {selectedReports.map((report) => {
        const SectionComponent = SECTION_COMPONENTS[report.type];
        
        if (!SectionComponent) {
          console.warn(`No component found for report type: ${report.type}`);
          return null;
        }

        return (
          <SectionComponent 
            key={report.type} 
            farmId={farmId} 
            farmName={farmName} 
          />
        );
      })}
    </div>
  );
}
