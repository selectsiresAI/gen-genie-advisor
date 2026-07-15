import { useState, useCallback } from 'react';
import { getLocale } from '@/lib/i18n';

export type ReportType =
  | 'herd_summary'
  | 'segmentation'
  | 'auditoria_step1'
  | 'auditoria_step2'
  | 'auditoria_step3'
  | 'auditoria_step4'
  | 'auditoria_step5'
  | 'auditoria_step6'
  | 'auditoria_step7'
  | 'nexus3';

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

const getDefaultReports = (): ReportSelection[] => {
  const loc = getLocale();
  const isEn = loc === 'en-US';
  const isEs = loc === 'es';
  const l = (pt: string, en: string, es: string) => isEs ? es : isEn ? en : pt;
  return [
    { type: 'herd_summary', enabled: true, label: l('Resumo do Rebanho', 'Herd Summary', 'Resumen del Rebaño'), description: l('Total de animais, distribuição por categoria', 'Total animals, distribution by category', 'Total de animales, distribución por categoría') },
    { type: 'segmentation', enabled: false, label: l('Segmentação', 'Segmentation', 'Segmentación'), description: l('Classificação Superior/Intermediário/Inferior', 'Superior/Intermediate/Inferior classification', 'Clasificación Superior/Intermedio/Inferior') },
    { type: 'auditoria_step1', enabled: false, label: l('Auditoria - Parentesco', 'Audit - Kinship', 'Auditoría - Parentesco'), description: l('Análise de parentesco e consanguinidade', 'Kinship and inbreeding analysis', 'Análisis de parentesco y consanguinidad') },
    { type: 'auditoria_step2', enabled: false, label: l('Auditoria - Top Parents', 'Audit - Top Parents', 'Auditoría - Top Parents'), description: l('Principais pais do rebanho', 'Main parents of the herd', 'Principales padres del rebaño') },
    { type: 'auditoria_step3', enabled: false, label: l('Auditoria - Quartis Overview', 'Audit - Quartiles Overview', 'Auditoría - Cuartiles'), description: l('Visão geral por quartis', 'Quartile overview', 'Visión general por cuartiles') },
    { type: 'auditoria_step4', enabled: false, label: l('Auditoria - Progressão', 'Audit - Progression', 'Auditoría - Progresión'), description: l('Progressão genética ao longo do tempo', 'Genetic progression over time', 'Progresión genética a lo largo del tiempo') },
    { type: 'auditoria_step5', enabled: false, label: l('Auditoria - Comparação', 'Audit - Comparison', 'Auditoría - Comparación'), description: l('Comparação por categoria', 'Comparison by category', 'Comparación por categoría') },
    { type: 'auditoria_step6', enabled: false, label: l('Auditoria - Quartis Índices', 'Audit - Quartile Indices', 'Auditoría - Índices por Cuartiles'), description: l('Análise de quartis por índices', 'Quartile analysis by indices', 'Análisis de cuartiles por índices') },
    { type: 'auditoria_step7', enabled: false, label: l('Auditoria - Distribuição', 'Audit - Distribution', 'Auditoría - Distribución'), description: l('Distribuição de PTAs', 'PTA distribution', 'Distribución de PTAs') },
  ];
};

const DEFAULT_CONFIG: GeneralReportConfig = {
  orientation: 'landscape',
  includeCover: true,
  includeIndex: true,
  includePageNumbers: true,
  includeDateTime: true,
};

export function useGeneralReport() {
  const [state, setState] = useState<GeneralReportState>({
    reports: getDefaultReports(),
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
      reports: getDefaultReports(),
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
