const translations = {
  "pt-BR": {
    "actions.delete": "Excluir",
    "actions.cancel": "Cancelar",
    "herd.delete.confirm.title": "Excluir animal(is)",
    "herd.delete.confirm.message": "Tem certeza que deseja excluir permanentemente o(s) animal(is) selecionado(s)? Esta ação não pode ser desfeita.",
    "herd.selected.count": "{{count}} selecionado{{plural}}",
    "nexus2.back": "Voltar",
    "nexus2.title": "Nexus 2: Predição por Pedigree",
    "nexus2.subtitle": "Baseado no pedigree - Pai (57%) + Avô Materno (28%) + Bisavô Materno (15%)",
    "nexus2.tabs.individual": "Predição Individual",
    "nexus2.tabs.batch": "Processamento em Lote",
    "nexus2.naab.placeholder": "Digite o código NAAB",
    "nexus2.naab.confirm": "Confirmar",
    "nexus2.naab.loading": "Carregando...",
    "nexus2.naab.noResults": "Nenhum touro encontrado",
    "nexus2.error.requiredSire": "NAAB do Pai é obrigatório",
    "nexus2.error.sireNotFound": "NAAB do Pai não encontrado",
    "nexus2.error.requiredMgs": "NAAB do Avô Materno é obrigatório",
    "nexus2.error.mgsNotFound": "NAAB do Avô Materno não encontrado",
    "nexus2.error.requiredMmgs": "NAAB do Bisavô Materno é obrigatório",
    "nexus2.error.mmgsNotFound": "NAAB do Bisavô Materno não encontrado",
    "nexus2.individual.naab.sire": "NAAB do Pai",
    "nexus2.individual.naab.mgs": "NAAB do Avô Materno",
    "nexus2.individual.naab.mmgs": "NAAB do Bisavô Materno",
    "nexus2.individual.actions.calculate": "Calcular PTAs",
    "nexus2.individual.actions.calculating": "Calculando...",
    "nexus2.individual.actions.clear": "Limpar",
    "nexus2.individual.toast.success": "Predição individual calculada com sucesso!",
    "nexus2.individual.toast.error": "Não foi possível calcular a predição individual.",
    "nexus2.individual.result.ready": "Predição pronta",
    "nexus2.summary.title": "Touros Selecionados",
    "nexus2.summary.empty": "Confirme um touro para visualizar os detalhes.",
    "nexus2.results.title": "PTAs previstas",
    "nexus2.results.description": "Aplica fórmula Pai 57% + Avô Materno 28% + Bisavô Materno 15%",
    "nexus2.results.trait": "PTA",
    "nexus2.results.sire": "Pai",
    "nexus2.results.mgs": "Avô Materno",
    "nexus2.results.mmgs": "Bisavô Materno",
    "nexus2.results.prediction": "Predição",
    "nexus2.batch.upload.button": "Enviar planilha",
    "nexus2.batch.upload.loading": "Processando...",
    "nexus2.batch.upload.helper": "Envie arquivo .csv ou .xlsx com colunas ID_Fazenda, Nome, Data_de_Nascimento, naab_pai, naab_avo_materno e naab_bisavo_materno.",
    "nexus2.batch.actions.reset": "Limpar arquivo",
    "nexus2.batch.actions.process": "Calcular PTAs em lote",
    "nexus2.batch.actions.processing": "Calculando...",
    "nexus2.batch.actions.exportResultsXlsx": "Exportar resultados (.xlsx)",
    "nexus2.batch.actions.exportResultsCsv": "Exportar resultados (.csv)",
    "nexus2.batch.actions.exportErrorsXlsx": "Exportar erros (.xlsx)",
    "nexus2.batch.actions.exportErrorsCsv": "Exportar erros (.csv)",
    "nexus2.batch.actions.sendToHerd": "Enviar direto para o rebanho",
    "nexus2.batch.actions.sendingToHerd": "Enviando...",
    "nexus2.batch.actions.exportMissingNaabs": "Exportar NAABs ausentes",
    "nexus2.batch.error.emptyRow": "Linha vazia",
    "nexus2.batch.error.duplicateInRow": "NAAB duplicado na mesma linha",
    "nexus2.batch.error.duplicateRow": "Duplicado com linhas:",
    "nexus2.batch.preview.validCount": "{{count}} linha{{plural}} válida{{plural}}",
    "nexus2.batch.preview.invalidCount": "{{count}} linha{{plural}} inválida{{plural}}",
    "nexus2.batch.preview.line": "Linha",
    "nexus2.batch.preview.farmId": "ID Fazenda",
    "nexus2.batch.preview.name": "Nome",
    "nexus2.batch.preview.birthDate": "Data de Nascimento",
    "nexus2.batch.preview.status": "Status",
    "nexus2.batch.preview.errors": "Erros",
    "nexus2.batch.preview.empty": "Envie um arquivo para visualizar o preview das linhas.",
    "nexus2.batch.status.valid": "Válida",
    "nexus2.batch.status.invalid": "Inválida",
    "nexus2.batch.results.title": "Resultados calculados",
    "nexus2.batch.toast.uploadSuccess": "Planilha carregada com sucesso!",
    "nexus2.batch.toast.uploadError": "Não foi possível processar o arquivo enviado.",
    "nexus2.batch.toast.noValid": "Nenhuma linha válida para calcular.",
    "nexus2.batch.toast.processSuccess": "Predições em lote calculadas!",
    "nexus2.batch.toast.processError": "Erro ao calcular as predições em lote.",
    "nexus2.batch.toast.noResultsToExport": "Não há resultados calculados para exportar.",
    "nexus2.batch.toast.noErrorsToExport": "Não há erros para exportar.",
    "nexus2.batch.toast.exportSuccess": "Exportação concluída!",
    "nexus2.batch.toast.noMissingNaabs": "Não há NAABs ausentes para exportar.",
    "nexus2.batch.toast.exportMissingNaabsSuccess": "Lista de NAABs exportada!",
    "nexus2.batch.toast.exportMissingNaabsDescription": "{{count}} código{{plural}} exportado{{plural}}.",
    "nexus2.batch.toast.noFarmSelected": "Selecione um rebanho para enviar as predições.",
    "nexus2.batch.toast.noResultsToSend": "Não há resultados calculados para enviar.",
    "nexus2.batch.toast.sendSuccess": "Resultados enviados para o rebanho!",
    "nexus2.batch.toast.sendSuccessDescription": "{{count}} fêmea{{plural}} atualizada{{plural}} com sucesso.",
    "nexus2.batch.toast.sendError": "Erro ao enviar para o rebanho."
  },
  "en-US": {
    "actions.delete": "Delete",
    "actions.cancel": "Cancel",
    "herd.delete.confirm.title": "Delete animal(s)",
    "herd.delete.confirm.message": "Are you sure you want to permanently delete the selected animal(s)? This action cannot be undone.",
    "herd.selected.count": "{{count}} selected",
    "nexus2.back": "Back",
    "nexus2.title": "Nexus 2: Pedigree Prediction",
    "nexus2.subtitle": "Based on pedigree - Sire (57%) + Maternal Grandsire (28%) + Maternal Great-Grandsire (15%)",
    "nexus2.tabs.individual": "Individual Prediction",
    "nexus2.tabs.batch": "Batch Processing",
    "nexus2.naab.placeholder": "Enter NAAB code",
    "nexus2.naab.confirm": "Confirm",
    "nexus2.naab.loading": "Loading...",
    "nexus2.naab.noResults": "No bull found",
    "nexus2.error.requiredSire": "Sire NAAB is required",
    "nexus2.error.sireNotFound": "Sire NAAB not found",
    "nexus2.error.requiredMgs": "Maternal Grandsire NAAB is required",
    "nexus2.error.mgsNotFound": "Maternal Grandsire NAAB not found",
    "nexus2.error.requiredMmgs": "Maternal Great-Grandsire NAAB is required",
    "nexus2.error.mmgsNotFound": "Maternal Great-Grandsire NAAB not found",
    "nexus2.individual.naab.sire": "Sire NAAB",
    "nexus2.individual.naab.mgs": "Maternal Grandsire NAAB",
    "nexus2.individual.naab.mmgs": "Maternal Great-Grandsire NAAB",
    "nexus2.individual.actions.calculate": "Calculate PTAs",
    "nexus2.individual.actions.calculating": "Calculating...",
    "nexus2.individual.actions.clear": "Clear",
    "nexus2.individual.toast.success": "Individual prediction calculated successfully!",
    "nexus2.individual.toast.error": "Could not calculate individual prediction.",
    "nexus2.individual.result.ready": "Prediction ready",
    "nexus2.summary.title": "Selected Bulls",
    "nexus2.summary.empty": "Confirm a bull to view details.",
    "nexus2.results.title": "Predicted PTAs",
    "nexus2.results.description": "Applies formula Sire 57% + MGS 28% + MMGS 15%",
    "nexus2.results.trait": "PTA",
    "nexus2.results.sire": "Sire",
    "nexus2.results.mgs": "MGS",
    "nexus2.results.mmgs": "MMGS",
    "nexus2.results.prediction": "Prediction",
    "nexus2.batch.upload.button": "Upload spreadsheet",
    "nexus2.batch.upload.loading": "Processing...",
    "nexus2.batch.upload.helper": "Upload .csv or .xlsx file with columns ID_Fazenda, Nome, Data_de_Nascimento, naab_pai, naab_avo_materno and naab_bisavo_materno.",
    "nexus2.batch.actions.reset": "Clear file",
    "nexus2.batch.actions.process": "Calculate PTAs in batch",
    "nexus2.batch.actions.processing": "Calculating...",
    "nexus2.batch.actions.exportResultsXlsx": "Export results (.xlsx)",
    "nexus2.batch.actions.exportResultsCsv": "Export results (.csv)",
    "nexus2.batch.actions.exportErrorsXlsx": "Export errors (.xlsx)",
    "nexus2.batch.actions.exportErrorsCsv": "Export errors (.csv)",
    "nexus2.batch.actions.sendToHerd": "Send directly to herd",
    "nexus2.batch.actions.sendingToHerd": "Sending...",
    "nexus2.batch.actions.exportMissingNaabs": "Export missing NAABs",
    "nexus2.batch.error.emptyRow": "Empty row",
    "nexus2.batch.error.duplicateInRow": "Duplicate NAAB in same row",
    "nexus2.batch.error.duplicateRow": "Duplicate with rows:",
    "nexus2.batch.preview.validCount": "{{count}} valid row{{plural}}",
    "nexus2.batch.preview.invalidCount": "{{count}} invalid row{{plural}}",
    "nexus2.batch.preview.line": "Line",
    "nexus2.batch.preview.farmId": "Farm ID",
    "nexus2.batch.preview.name": "Name",
    "nexus2.batch.preview.birthDate": "Birth Date",
    "nexus2.batch.preview.status": "Status",
    "nexus2.batch.preview.errors": "Errors",
    "nexus2.batch.preview.empty": "Upload a file to preview rows.",
    "nexus2.batch.status.valid": "Valid",
    "nexus2.batch.status.invalid": "Invalid",
    "nexus2.batch.results.title": "Calculated results",
    "nexus2.batch.toast.uploadSuccess": "Spreadsheet loaded successfully!",
    "nexus2.batch.toast.uploadError": "Could not process uploaded file.",
    "nexus2.batch.toast.noValid": "No valid rows to calculate.",
    "nexus2.batch.toast.processSuccess": "Batch predictions calculated!",
    "nexus2.batch.toast.processError": "Error calculating batch predictions.",
    "nexus2.batch.toast.noResultsToExport": "No calculated results to export.",
    "nexus2.batch.toast.noErrorsToExport": "No errors to export.",
    "nexus2.batch.toast.exportSuccess": "Export completed!",
    "nexus2.batch.toast.noMissingNaabs": "No missing NAABs to export.",
    "nexus2.batch.toast.exportMissingNaabsSuccess": "NAAB list exported!",
    "nexus2.batch.toast.exportMissingNaabsDescription": "{{count}} code{{plural}} exported.",
    "nexus2.batch.toast.noFarmSelected": "Select a herd to send predictions.",
    "nexus2.batch.toast.noResultsToSend": "No calculated results to send.",
    "nexus2.batch.toast.sendSuccess": "Results sent to herd!",
    "nexus2.batch.toast.sendSuccessDescription": "{{count}} female{{plural}} updated successfully.",
    "nexus2.batch.toast.sendError": "Error sending to herd."
  }
} as const;

export type Locale = keyof typeof translations;
const defaultLocale: Locale = "pt-BR";

type TranslationKey = keyof typeof translations[typeof defaultLocale];

type TranslationOptions = {
  count?: number;
};

// Locale management
let currentLocale: Locale = defaultLocale;

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored && (stored === 'pt-BR' || stored === 'en-US')) {
      currentLocale = stored;
    }
  }
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

export function t(
  key: TranslationKey,
  options: TranslationOptions = {},
  locale?: Locale
): string {
  const activeLocale = locale || getLocale();
  const template = translations[activeLocale]?.[key] ?? translations[defaultLocale][key] ?? key;

  if (options.count !== undefined) {
    const formattedCount = new Intl.NumberFormat(activeLocale).format(options.count);
    const pluralSuffix = activeLocale === 'pt-BR' ? (options.count === 1 ? "" : "s") : (options.count === 1 ? "" : "s");

    return template
      .replace("{{count}}", formattedCount)
      .replace("{{plural}}", pluralSuffix);
  }

  return template;
}

export type { TranslationKey };
