import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { ReportSelection, GeneralReportConfig } from "@/hooks/useGeneralReport";

export interface GenerateReportOptions {
  farmName: string;
  farmOwner: string;
  userName: string;
  reports: ReportSelection[];
  config: GeneralReportConfig;
  onProgress: (progress: number, message: string) => void;
}

interface PageInfo {
  title: string;
  pageNumber: number;
}

const REPORT_LABELS: Record<string, string> = {
  herd_summary: 'Resumo do Rebanho',
  segmentation: 'Segmentação',
  auditoria_step1: 'Auditoria - Parentesco',
  auditoria_step2: 'Auditoria - Top Parents',
  auditoria_step3: 'Auditoria - Quartis Overview',
  auditoria_step4: 'Auditoria - Progressão',
  auditoria_step5: 'Auditoria - Comparação',
  auditoria_step6: 'Auditoria - Quartis Índices',
  auditoria_step7: 'Auditoria - Distribuição',
  botijao: 'Botijão Virtual',
  projecao: 'Projeção Genética',
  trends: 'Gráficos de Tendência',
  metas: 'Metas Genéticas',
  nexus: 'Nexus Predições',
};

async function captureElement(el: HTMLElement, scale: number = 2): Promise<HTMLCanvasElement> {
  // Hide tooltips during capture
  const tooltips = document.querySelectorAll<HTMLElement>(".recharts-tooltip-wrapper");
  const hiddenTooltips: Array<{ element: HTMLElement; display: string }> = [];
  
  tooltips.forEach((tooltip) => {
    hiddenTooltips.push({ element: tooltip, display: tooltip.style.display });
    tooltip.style.display = "none";
  });

  try {
    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) return false;
        if (element.dataset?.pdfIgnore === "true") return true;
        if (element.classList.contains("pdf-ignore")) return true;
        return false;
      },
    });
    return canvas;
  } finally {
    hiddenTooltips.forEach(({ element, display }) => {
      element.style.display = display;
    });
  }
}

function addCoverPage(
  doc: jsPDF,
  farmName: string,
  farmOwner: string,
  userName: string,
  includeDateTime: boolean
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(239, 68, 68); // red-500
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO GERAL', centerX, 40, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Análise Genética Consolidada', centerX, 55, { align: 'center' });
  
  // Farm info section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(farmName, centerX, 120, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Proprietário: ${farmOwner}`, centerX, 135, { align: 'center' });
  
  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(centerX - 60, 150, centerX + 60, 150);
  
  // Footer info
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Preparado por: ${userName}`, centerX, pageHeight - 40, { align: 'center' });
  
  if (includeDateTime) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Gerado em: ${dateStr} às ${timeStr}`, centerX, pageHeight - 30, { align: 'center' });
  }
  
  // ToolSS branding
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Powered by ToolSS - Select Sires', centerX, pageHeight - 15, { align: 'center' });
}

function addIndexPage(doc: jsPDF, pages: PageInfo[]): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ÍNDICE', margin, 30);
  
  // Divider
  doc.setDrawColor(239, 68, 68);
  doc.setLineWidth(2);
  doc.line(margin, 35, margin + 40, 35);
  
  // Index items
  let y = 55;
  const lineHeight = 12;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  pages.forEach((page, index) => {
    if (y > pageHeight - 30) {
      doc.addPage();
      y = 30;
    }
    
    const number = `${index + 1}.`;
    const title = page.title;
    const pageNum = page.pageNumber.toString();
    
    // Number
    doc.setTextColor(239, 68, 68);
    doc.text(number, margin, y);
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin + 12, y);
    
    // Dots
    const titleWidth = doc.getTextWidth(title);
    const pageNumWidth = doc.getTextWidth(pageNum);
    const dotsStart = margin + 12 + titleWidth + 5;
    const dotsEnd = pageWidth - margin - pageNumWidth - 5;
    
    doc.setTextColor(180, 180, 180);
    let dotX = dotsStart;
    while (dotX < dotsEnd) {
      doc.text('.', dotX, y);
      dotX += 3;
    }
    
    // Page number
    doc.setTextColor(100, 100, 100);
    doc.text(pageNum, pageWidth - margin, y, { align: 'right' });
    
    y += lineHeight;
  });
}

function addPageNumber(doc: jsPDF, pageNum: number, totalPages: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Página ${pageNum} de ${totalPages}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
}

function addSectionTitle(doc: jsPDF, title: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  
  // Background bar
  doc.setFillColor(245, 245, 245);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Red accent
  doc.setFillColor(239, 68, 68);
  doc.rect(0, 0, 5, 25, 'F');
  
  // Title text
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 17);
}

export async function generateGeneralReport(
  options: GenerateReportOptions,
  containerRef: HTMLElement | null
): Promise<Blob | null> {
  const { farmName, farmOwner, userName, reports, config, onProgress } = options;
  
  if (!containerRef) {
    console.error('Container ref is null');
    return null;
  }

  const selectedReports = reports.filter(r => r.enabled);
  if (selectedReports.length === 0) {
    console.warn('No reports selected');
    return null;
  }

  const orientation = config.orientation === 'landscape' ? 'l' : 'p';
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  
  const pageTracker: PageInfo[] = [];
  let currentPage = 1;
  
  // Calculate starting page for content
  let contentStartPage = 1;
  if (config.includeCover) contentStartPage++;
  if (config.includeIndex) contentStartPage++;

  onProgress(5, 'Preparando documento...');

  // Add cover page
  if (config.includeCover) {
    addCoverPage(doc, farmName, farmOwner, userName, config.includeDateTime);
    doc.addPage();
    currentPage++;
  }

  // Reserve space for index (will be filled later)
  const indexPageNumber = config.includeIndex ? currentPage : -1;
  if (config.includeIndex) {
    doc.addPage();
    currentPage++;
  }

  // Process each selected report
  const totalReports = selectedReports.length;
  
  for (let i = 0; i < selectedReports.length; i++) {
    const report = selectedReports[i];
    const progressPercent = 10 + Math.floor((i / totalReports) * 80);
    onProgress(progressPercent, `Gerando ${report.label}...`);

    // Find the rendered section in the container
    const sectionId = `report-section-${report.type}`;
    const sectionEl = containerRef.querySelector(`[data-report-section="${report.type}"]`) as HTMLElement;
    
    if (!sectionEl) {
      console.warn(`Section not found for report: ${report.type}`);
      continue;
    }

    // Capture the section
    try {
      const canvas = await captureElement(sectionEl, 2);
      const imgData = canvas.toDataURL('image/png');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentTop = 30;
      
      // Calculate image dimensions
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - contentTop - margin - 15; // Leave space for page number
      const ratio = canvas.height / canvas.width;
      
      let imgW = maxW;
      let imgH = imgW * ratio;
      
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH / ratio;
      }

      // Add section title
      addSectionTitle(doc, report.label);
      
      // Add image
      const xOffset = (pageWidth - imgW) / 2;
      doc.addImage(imgData, 'PNG', xOffset, contentTop, imgW, imgH);
      
      // Track page info
      pageTracker.push({
        title: report.label,
        pageNumber: currentPage,
      });
      
      // Add page number if enabled
      if (config.includePageNumbers) {
        // Will be added in final pass
      }
      
      // Add new page for next report (except for last one)
      if (i < selectedReports.length - 1) {
        doc.addPage();
        currentPage++;
      }
    } catch (error) {
      console.error(`Error capturing section ${report.type}:`, error);
    }

    // Small delay to prevent UI freezing
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  onProgress(90, 'Finalizando documento...');

  // Go back and add index page
  if (config.includeIndex && indexPageNumber > 0) {
    doc.setPage(indexPageNumber);
    addIndexPage(doc, pageTracker);
  }

  // Add page numbers
  if (config.includePageNumbers) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      // Skip cover page
      if (config.includeCover && i === 1) continue;
      addPageNumber(doc, i, totalPages);
    }
  }

  onProgress(100, 'Concluído!');

  // Return as blob
  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
