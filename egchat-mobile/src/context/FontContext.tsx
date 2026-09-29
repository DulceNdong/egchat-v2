// ══════════════════════════════════════════════════════════════════
// FontContext — Tamaño y Estilo de Letra global reactivo para toda la app
// Persiste en AsyncStorage y aplica cambios live a toda la interfaz
// ══════════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FONT_SIZE_KEY = 'egchat_fontsize';
export const FONT_FAMILY_KEY = 'egchat_fontfamily';

export type FontFamilyId = 'default' | 'rounded' | 'modern' | 'classic';

interface FontContextType {
  fontScale: number;
  fontFamily: FontFamilyId;
  changeFontScale: (scale: number) => void;
  changeFontFamily: (family: FontFamilyId) => void;
}

const FontContext = createContext<FontContextType>({
  fontScale: 1,
  fontFamily: 'default',
  changeFontScale: () => {},
  changeFontFamily: () => {},
});

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<number>(1);
  const [fontFamily, setFontFamilyState] = useState<FontFamilyId>('default');

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then(val => {
      if (val) setFontScaleState(parseFloat(val) || 1);
    });
    AsyncStorage.getItem(FONT_FAMILY_KEY).then(val => {
      if (val) setFontFamilyState(val as FontFamilyId);
    });
  }, []);

  const changeFontScale = useCallback((scale: number) => {
    setFontScaleState(scale);
    AsyncStorage.setItem(FONT_SIZE_KEY, String(scale));
  }, []);

  const changeFontFamily = useCallback((family: FontFamilyId) => {
    setFontFamilyState(family);
    AsyncStorage.setItem(FONT_FAMILY_KEY, family);
  }, []);

  return (
    <FontContext.Provider value={{ fontScale, fontFamily, changeFontScale, changeFontFamily }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  return useContext(FontContext);
}
