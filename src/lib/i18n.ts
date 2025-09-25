const translations = {
  "pt-BR": {
    "actions.delete": "Excluir",
    "actions.cancel": "Cancelar",
    "herd.delete.confirm.title": "Excluir animal(is)",
    "herd.delete.confirm.message": "Tem certeza que deseja excluir permanentemente o(s) animal(is) selecionado(s)? Esta ação não pode ser desfeita.",
    "herd.selected.count": "{{count}} selecionado{{plural}}"
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
