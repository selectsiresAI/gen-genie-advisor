import { useI18n } from "@/providers/I18nProvider";
import { t as translate, TranslationKey } from "@/lib/i18n";
import { useGlossary } from "./useGlossary";

/**
 * Hook para usar traduções no React
 * Suporta translations normais e termos técnicos do glossário
 */
export function useTranslation() {
  const { locale } = useI18n();
  const { getTerm } = useGlossary();

  const t = (key: TranslationKey | string, options?: { count?: number }) => {
    // Check if it's a technical term
    if (key.startsWith('technical.')) {
      const termKey = key.replace('technical.', '');
      const term = getTerm(termKey, locale);
      if (term) return term;
    }

    // Fallback to regular translation
    return translate(key as TranslationKey, options, locale);
  };

  return { t, locale };
}