// ══════════════════════════════════════════════════════════════════
// LanguageContext — Idioma global reactivo para toda la app
// Persiste en AsyncStorage y dispara re-renders al cambiar
// ══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCfgString, setCfg } from '../services/settingsPrefs';
import { setLanguage, type Lang } from '../translations';

const LANG_KEY = 'cfg_app_language';

// Mapa de código corto ('es','fr','en') → Lang ('ES','FR','EN')
const codeToLang: Record<string, Lang> = {
  es: 'ES',
  fr: 'FR',
  en: 'EN',
};

interface LanguageContextType {
  /** Código corto: 'es' | 'fr' | 'en' */
  language: string;
  /** Cambia el idioma, persiste en AsyncStorage y actualiza translations.ts */
  changeLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  changeLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<string>('es');

  // Cargar idioma guardado al arrancar
  useEffect(() => {
    getCfgString(LANG_KEY, 'es').then((stored) => {
      const code = stored || 'es';
      setLangState(code);
      // Sincronizar con el singleton de translations.ts
      setLanguage((codeToLang[code] || 'ES') as Lang);
    });
  }, []);

  const changeLanguage = useCallback((code: string) => {
    const lang = (codeToLang[code] || 'ES') as Lang;
    setLangState(code);
    // Actualizar el singleton de translations.ts para que t() use el idioma correcto
    setLanguage(lang);
    // Persistir en AsyncStorage
    setCfg(LANG_KEY, code);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook para consumir el idioma en cualquier componente */
export function useLanguage() {
  return useContext(LanguageContext);
}
