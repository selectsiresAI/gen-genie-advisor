import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateSegmentationPDF = async (data: {
  farmName: string;
  filters: any;
  distribution: any;
  customSettings?: any;
  femalesData: any[];
  date: string;
}) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório de Segmentação', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fazenda: ${data.farmName}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Data: ${data.date}`, 20, yPosition);
  yPosition += 15;

  // Filtros aplicados
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Filtros Aplicados:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (data.filters.categories && data.filters.categories.length > 0) {
    pdf.text(`Categorias: ${data.filters.categories.join(', ')}`, 25, yPosition);
    yPosition += 6;
  }
  if (data.filters.classifications && data.filters.classifications.length > 0) {
    pdf.text(`Classificações: ${data.filters.classifications.join(', ')}`, 25, yPosition);
    yPosition += 6;
  }
  
  yPosition += 10;

  // Distribuição dos grupos
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Distribuição dos Grupos:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (data.distribution.donor) {
    pdf.text(`Doadora: ${data.distribution.donor}%`, 25, yPosition);
    yPosition += 6;
  }
  if (data.distribution.inter) {
    pdf.text(`Intermediária: ${data.distribution.inter}%`, 25, yPosition);
    yPosition += 6;
  }
  if (data.distribution.recipient) {
    pdf.text(`Receptora: ${data.distribution.recipient}%`, 25, yPosition);
    yPosition += 6;
  }

  // Custom settings se existir
  if (data.customSettings) {
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Configurações Personalizadas:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Índice Selecionado: ${data.customSettings.selectedIndex}`, 25, yPosition);
    yPosition += 6;
    
    if (data.customSettings.weights) {
      pdf.text('Pesos dos PTAs:', 25, yPosition);
      yPosition += 6;
      Object.entries(data.customSettings.weights).forEach(([pta, weight]: [string, any]) => {
        pdf.text(`  ${pta}: ${weight}%`, 30, yPosition);
        yPosition += 5;
      });
    }
  }

  // Estatísticas das fêmeas
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estatísticas:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total de Fêmeas: ${data.femalesData.length}`, 25, yPosition);
  yPosition += 6;

  const donors = data.femalesData.filter(f => f.classification === 'donor').length;
  const inter = data.femalesData.filter(f => f.classification === 'inter').length;
  const recipients = data.femalesData.filter(f => f.classification === 'recipient').length;

  pdf.text(`Doadoras: ${donors}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`Intermediárias: ${inter}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`Receptoras: ${recipients}`, 25, yPosition);

  return pdf;
};

export const generateBotijaoVirtualPDF = async (data: {
  farmName: string;
  females: any[];
  matings: any[];
  settings: any;
  date: string;
}) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório - Botijão Virtual', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fazenda: ${data.farmName}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Data: ${data.date}`, 20, yPosition);
  yPosition += 15;

  // Configurações
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Configurações:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Número de touros por fêmea: ${data.settings.bullsPerFemale || 3}`, 25, yPosition);
  yPosition += 6;
  pdf.text(`Estratégia: ${data.settings.strategy || 'Automática'}`, 25, yPosition);
  yPosition += 15;

  // Fêmeas no botijão
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Fêmeas no Botijão:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total: ${data.females.length} fêmeas`, 25, yPosition);
  yPosition += 10;

  // Lista de fêmeas (limitada para não estourar página)
  const maxFemales = Math.min(data.females.length, 20);
  for (let i = 0; i < maxFemales; i++) {
    const female = data.females[i];
    pdf.text(`${i + 1}. ${female.name} (${female.identifier})`, 25, yPosition);
    yPosition += 5;
    
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
  }

  if (data.females.length > maxFemales) {
    pdf.text(`... e mais ${data.females.length - maxFemales} fêmeas`, 25, yPosition);
    yPosition += 10;
  }

  // Acasalamentos
  if (data.matings && data.matings.length > 0) {
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Acasalamentos Planejados:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de acasalamentos: ${data.matings.length}`, 25, yPosition);
  }

  return pdf;
};

export const generateGeneticProjectionPDF = async (data: {
  farmName: string;
  geneticPlan: any;
  selectedBulls: any[];
  results: any[];
  charts: any;
  date: string;
}) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Plano de Projeção Genética', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fazenda: ${data.farmName}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Data: ${data.date}`, 20, yPosition);
  yPosition += 15;

  // Plano Genético
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Plano Genético:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (data.geneticPlan.objective) {
    pdf.text(`Objetivo: ${data.geneticPlan.objective}`, 25, yPosition);
    yPosition += 6;
  }
  if (data.geneticPlan.timeframe) {
    pdf.text(`Prazo: ${data.geneticPlan.timeframe}`, 25, yPosition);
    yPosition += 6;
  }
  if (data.geneticPlan.priorityTraits) {
    pdf.text(`Características Prioritárias: ${data.geneticPlan.priorityTraits.join(', ')}`, 25, yPosition);
    yPosition += 6;
  }
  yPosition += 10;

  // Touros Selecionados
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Touros Selecionados:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  data.selectedBulls.forEach((bull, index) => {
    pdf.text(`${index + 1}. ${bull.name} (${bull.code})`, 25, yPosition);
    yPosition += 5;
    if (bull.tpi) {
      pdf.text(`   TPI: ${bull.tpi} | NM$: ${bull.nm_dollar || 'N/A'}`, 30, yPosition);
      yPosition += 5;
    }
    yPosition += 2;
  });
  yPosition += 10;

  // Resultados
  if (data.results && data.results.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Resultados Esperados:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total de projeções: ${data.results.length}`, 25, yPosition);
    yPosition += 6;
    
    // Estatísticas resumidas
    const avgTPI = data.results.reduce((sum: number, r: any) => sum + (r.projectedTPI || 0), 0) / data.results.length;
    const avgNM = data.results.reduce((sum: number, r: any) => sum + (r.projectedNM || 0), 0) / data.results.length;
    
    pdf.text(`TPI médio projetado: ${avgTPI.toFixed(1)}`, 25, yPosition);
    yPosition += 6;
    pdf.text(`NM$ médio projetado: ${avgNM.toFixed(1)}`, 25, yPosition);
  }

  return pdf;
};

export const generatePDFBlob = async (pdf: jsPDF): Promise<Blob> => {
  return new Promise((resolve) => {
    const pdfBlob = pdf.output('blob');
    resolve(pdfBlob);
  });
};