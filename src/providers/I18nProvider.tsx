import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, getLocale, setLocale as setI18nLocale } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Persist the context across HMR reloads so provider and consumer always
// share the same Context instance (otherwise useContext returns undefined
// after a hot-reload and useI18n throws "must be used within I18nProvider").
const __GLOBAL_I18N_KEY = '__LOVABLE_I18N_CONTEXT__';
const __globalScope = globalThis as unknown as Record<string, unknown>;
const I18nContext: React.Context<I18nContextType | undefined> =
  (__globalScope[__GLOBAL_I18N_KEY] as React.Context<I18nContextType | undefined>) ||
  (__globalScope[__GLOBAL_I18N_KEY] = createContext<I18nContextType | undefined>(undefined));
I18nContext.displayName = 'I18nContext';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    // Detect browser language on first load if no stored preference
    if (!localStorage.getItem('locale')) {
      const browserLang = navigator.language;
      if (browserLang.startsWith('en')) {
        setLocale('en-US');
      } else if (browserLang.startsWith('es')) {
        setLocale('es');
      } else {
        setLocale('pt-BR');
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}