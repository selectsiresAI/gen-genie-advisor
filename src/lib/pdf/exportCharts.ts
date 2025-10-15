import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type ExportOptions = {
  filename: string;
  orientation?: "p" | "l"; // p=portrait, l=landscape
  unit?: "mm" | "pt";
  format?: "a4" | [number, number]; // custom
  pageMarginMm?: number; // margem em mm
  dpi?: number; // alvo de qualidade
};

function ensureVisible(el: HTMLElement) {
  if (typeof el.scrollIntoView === "function") {
    el.scrollIntoView({ behavior: "auto", block: "center", inline: "center" });
  }
}

function getElementWidth(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return el.clientWidth || rect.width || 1;
}

async function captureElement(el: HTMLElement, targetWidthPx: number) {
  const width = getElementWidth(el);
  const scale = width > 0 ? Math.min(2, targetWidthPx / width) : 1;
  const canvas = await html2canvas(el, {
    scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  return canvas;
}

export async function exportSingleChartToPDF(el: HTMLElement, opts: ExportOptions) {
  const {
    filename,
    orientation = "l",
    unit = "mm",
    format = "a4",
    pageMarginMm = 10,
    dpi = 300,
  } = opts;

  ensureVisible(el);
  await new Promise((resolve) => setTimeout(resolve, 60));

  const doc = new jsPDF({ orientation, unit, format });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const pxPerMm = dpi / 25.4;
  const maxContentWidthMm = pageWidth - pageMarginMm * 2;
  const targetWidthPx = Math.max(1, maxContentWidthMm * pxPerMm);

  const canvas = await captureElement(el, targetWidthPx);
  const imgData = canvas.toDataURL("image/png");
  const ratio = canvas.height / canvas.width;
  const maxW = pageWidth - pageMarginMm * 2;
  const maxH = pageHeight - pageMarginMm * 2;
  let w = maxW;
  let h = w * ratio;
  if (h > maxH) {
    h = maxH;
    w = h / ratio;
  }

  doc.addImage(imgData, "PNG", (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
  doc.save(filename);
}

export async function exportMultipleChartsToPDF(els: HTMLElement[], opts: ExportOptions) {
  const {
    filename,
    orientation = "l",
    unit = "mm",
    format = "a4",
    pageMarginMm = 10,
    dpi = 300,
  } = opts;

  const doc = new jsPDF({ orientation, unit, format });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const pxPerMm = dpi / 25.4;
  const maxContentWidthMm = pageWidth - pageMarginMm * 2;
  const targetWidthPx = Math.max(1, maxContentWidthMm * pxPerMm);

  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    ensureVisible(el);
    // Pequeno delay para permitir layout
    await new Promise((resolve) => setTimeout(resolve, 60));
    
    const canvas = await captureElement(el, targetWidthPx);

    const imgData = canvas.toDataURL("image/png");
    const ratio = canvas.height / canvas.width;
    const maxW = pageWidth - pageMarginMm * 2;
    const maxH = pageHeight - pageMarginMm * 2;
    let w = maxW;
    let h = w * ratio;
    if (h > maxH) {
      h = maxH;
      w = h / ratio;
    }

    if (i > 0) doc.addPage();
    doc.addImage(imgData, "PNG", (pageWidth - w) / 2, (pageHeight - h) / 2, w, h);
  }

  doc.save(filename);
}
