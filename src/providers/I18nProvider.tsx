import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, getLocale, setLocale as setI18nLocale } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    // Detect browser language on first load if no stored preference
    if (!localStorage.getItem('locale')) {
      const browserLang = navigator.language;
      if (browserLang.startsWith('en')) {
        setLocale('en-US');
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