import React from 'react';

export interface Theme {
  id: string; name: string; preview: string;
  bg: string; bgSide: string; bgCard: string;
  border: string; text: string; textMuted: string;
  l1: string; l2: string; l3: string;
}

export const ThemeContext = React.createContext<Theme>({
  id: 'navy', name: 'Navy', preview: '#07111e',
  bg: '#050d18', bgSide: '#07111e', bgCard: '#0a1628',
  border: '#0d1e2e', text: '#c8dcea', textMuted: '#2e5070',
  l1: '#7c6fcd', l2: '#4a8fc4', l3: '#3aaa8a',
});

export function useTheme(): Theme {
  return React.useContext(ThemeContext);
}
