import { useState, useCallback } from 'react';

export type ReportType =
  | 'herd_summary'
  | 'segmentation'
  | 'auditoria_step1'
  | 'auditoria_step2'
  | 'auditoria_step3'
  | 'auditoria_step4'
  | 'auditoria_step5'
  | 'auditoria_step6'
  | 'auditoria_step7';

export interface ReportSelection {
  type: ReportType;
  enabled: boolean;
  label: string;
  description: string;
  config?: Record<string, any>;
}

export interface GeneralReportConfig {
  orientation: 'landscape' | 'portrait';
  includeCover: boolean;
  includeIndex: boolean;
  includePageNumbers: boolean;
  includeDateTime: boolean;
}

export interface GeneralReportState {
  reports: ReportSelection[];
  config: GeneralReportConfig;
  isGenerating: boolean;
  progress: number;
  progressMessage: string;
}

const DEFAULT_REPORTS: ReportSelection[] = [
  { type: 'herd_summary', enabled: true, label: 'Resumo do Rebanho', description: 'Total de animais, distribuição por categoria' },
  { type: 'segmentation', enabled: false, label: 'Segmentação', description: 'Classificação Superior/Intermediário/Inferior' },
  { type: 'auditoria_step1', enabled: false, label: 'Auditoria - Parentesco', description: 'Análise de parentesco e consanguinidade' },
  { type: 'auditoria_step2', enabled: false, label: 'Auditoria - Top Parents', description: 'Principais pais do rebanho' },
  { type: 'auditoria_step3', enabled: false, label: 'Auditoria - Quartis Overview', description: 'Visão geral por quartis' },
  { type: 'auditoria_step4', enabled: false, label: 'Auditoria - Progressão', description: 'Progressão genética ao longo do tempo' },
  { type: 'auditoria_step5', enabled: false, label: 'Auditoria - Comparação', description: 'Comparação por categoria' },
  { type: 'auditoria_step6', enabled: false, label: 'Auditoria - Quartis Índices', description: 'Análise de quartis por índices' },
  { type: 'auditoria_step7', enabled: false, label: 'Auditoria - Distribuição', description: 'Distribuição de PTAs' },
];

const DEFAULT_CONFIG: GeneralReportConfig = {
  orientation: 'landscape',
  includeCover: true,
  includeIndex: true,
  includePageNumbers: true,
  includeDateTime: true,
};

export function useGeneralReport() {
  const [state, setState] = useState<GeneralReportState>({
    reports: DEFAULT_REPORTS,
    config: DEFAULT_CONFIG,
    isGenerating: false,
    progress: 0,
    progressMessage: '',
  });

  const toggleReport = useCallback((type: ReportType) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => 
        r.type === type ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  }, []);

  const setReportConfig = useCallback((type: ReportType, config: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => 
        r.type === type ? { ...r, config } : r
      ),
    }));
  }, []);

  const toggleAllAuditoria = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => 
        r.type.startsWith('auditoria_') ? { ...r, enabled } : r
      ),
    }));
  }, []);

  const updateConfig = useCallback((updates: Partial<GeneralReportConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  }, []);

  const setProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({
      ...prev,
      progress,
      progressMessage: message,
    }));
  }, []);

  const setGenerating = useCallback((isGenerating: boolean) => {
    setState(prev => ({
      ...prev,
      isGenerating,
      progress: isGenerating ? 0 : prev.progress,
      progressMessage: isGenerating ? '' : prev.progressMessage,
    }));
  }, []);

  const getSelectedReports = useCallback(() => {
    return state.reports.filter(r => r.enabled);
  }, [state.reports]);

  const getEstimatedPages = useCallback(() => {
    const selected = getSelectedReports();
    let pages = 0;
    
    // Cover + Index
    if (state.config.includeCover) pages += 1;
    if (state.config.includeIndex) pages += 1;
    
    // Each report section
    selected.forEach(r => {
      if (r.type === 'herd_summary') pages += 1;
      else if (r.type === 'segmentation') pages += 2;
      else if (r.type.startsWith('auditoria_')) pages += 1;
    });
    
    return pages;
  }, [state.reports, state.config, getSelectedReports]);

  const reset = useCallback(() => {
    setState({
      reports: DEFAULT_REPORTS,
      config: DEFAULT_CONFIG,
      isGenerating: false,
      progress: 0,
      progressMessage: '',
    });
  }, []);

  return {
    ...state,
    toggleReport,
    setReportConfig,
    toggleAllAuditoria,
    updateConfig,
    setProgress,
    setGenerating,
    getSelectedReports,
    getEstimatedPages,
    reset,
  };
}
