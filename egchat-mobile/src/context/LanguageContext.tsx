// ══════════════════════════════════════════════════════════════════
// LanguageContext — Idioma global reactivo para toda la app
// Persiste en AsyncStorage y dispara re-renders al cambiar
// ══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getCfgString, setCfg } from '../services/settingsPrefs';
import { setLanguage, t, type Lang } from '../translations';

const LANG_KEY = 'cfg_app_language';

const codeToLang: Record<string, Lang> = {
  es: 'ES',
  fr: 'FR',
  en: 'EN',
  pt: 'PT',
};

interface LanguageContextType {
  /** Código corto: 'es' | 'fr' | 'en' | 'pt' */
  language: string;
  /** Cambia el idioma, persiste en AsyncStorage y actualiza translations.ts */
  changeLanguage: (code: string) => void;
  /** Traductor reactivo: vuelve a renderizar al cambiar de idioma. */
  translate: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  changeLanguage: () => {},
  translate: t,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<string>('es');

  // Cargar idioma guardado al arrancar
  useEffect(() => {
    getCfgString(LANG_KEY, 'es').then((stored) => {
      const code = stored || 'es';
      setLangState(code);
      setLanguage((codeToLang[code] || 'ES') as Lang);
    });
  }, []);

  const changeLanguage = useCallback((code: string) => {
    const lang = (codeToLang[code] || 'ES') as Lang;
    setLangState(code);
    setLanguage(lang);
    setCfg(LANG_KEY, code);
  }, []);

  const translate = useCallback((key: string) => t(key), [language]);
  const value = useMemo(
    () => ({ language, changeLanguage, translate }),
    [language, changeLanguage, translate],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook para consumir el idioma en cualquier componente */
export function useLanguage() {
  return useContext(LanguageContext);
}

/** Alias explícito para pantallas y componentes nuevos. */
export function useTranslation() {
  const { language, translate } = useLanguage();
  return { language, t: translate };
}
