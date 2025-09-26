const translations = {
  "pt-BR": {
    "actions.delete": "Excluir",
    "actions.cancel": "Cancelar",
    "herd.delete.confirm.title": "Excluir animal(is)",
    "herd.delete.confirm.message": "Tem certeza que deseja excluir permanentemente o(s) animal(is) selecionado(s)? Esta ação não pode ser desfeita.",
    "herd.selected.count": "{{count}} selecionado{{plural}}",
    "nexus2.back": "Voltar",
    "nexus2.title": "Nexus 2: Predição por Pedigrê",
    "nexus2.subtitle": "Baseado no pedigrê - Pai (57%) + Avô Materno (28%) + Bisavô Materno (15%)",
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
    "nexus2.batch.upload.helper": "Envie arquivo .csv ou .xlsx com colunas naab_pai, naab_avo_materno, naab_bisavo_materno.",
    "nexus2.batch.actions.reset": "Limpar arquivo",
    "nexus2.batch.actions.process": "Calcular PTAs em lote",
    "nexus2.batch.actions.processing": "Calculando...",
    "nexus2.batch.actions.exportResultsXlsx": "Exportar resultados (.xlsx)",
    "nexus2.batch.actions.exportResultsCsv": "Exportar resultados (.csv)",
    "nexus2.batch.actions.exportErrorsXlsx": "Exportar erros (.xlsx)",
    "nexus2.batch.actions.exportErrorsCsv": "Exportar erros (.csv)",
    "nexus2.batch.error.emptyRow": "Linha vazia",
    "nexus2.batch.error.duplicateInRow": "NAAB duplicado na mesma linha",
    "nexus2.batch.error.duplicateRow": "Duplicado com linhas:",
    "nexus2.batch.preview.validCount": "{{count}} linha{{plural}} válida{{plural}}",
    "nexus2.batch.preview.invalidCount": "{{count}} linha{{plural}} inválida{{plural}}",
    "nexus2.batch.preview.line": "Linha",
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
    "nexus2.batch.toast.exportSuccess": "Exportação concluída!"
  }
} as const;

type Locale = keyof typeof translations;
const defaultLocale: Locale = "pt-BR";

type TranslationKey = keyof typeof translations[typeof defaultLocale];

type TranslationOptions = {
  count?: number;
};

export function t(
  key: TranslationKey,
  options: TranslationOptions = {},
  locale: Locale = defaultLocale
): string {
  const template = translations[locale]?.[key] ?? key;

  if (options.count !== undefined) {
    const formattedCount = new Intl.NumberFormat(locale).format(options.count);
    const pluralSuffix = options.count === 1 ? "" : "s";

    return template
      .replace("{{count}}", formattedCount)
      .replace("{{plural}}", pluralSuffix);
  }

  return template;
}

export type { TranslationKey };
