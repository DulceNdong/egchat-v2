// Fondos de chat — paridad catálogo App.tsx (subset RN con gradientes)
export type WallpaperCategory = 'crystal' | 'static' | 'dynamic' | 'none';

export interface ChatWallpaperDef {
  id: string;
  label: string;
  category: WallpaperCategory;
  colors: string[];
  locations?: number[];
  live?: boolean;
}

export const DEFAULT_WALLPAPER_ID = 'default';

export const CHAT_WALLPAPERS: ChatWallpaperDef[] = [
  { id: 'none', label: 'Sin fondo', category: 'none', colors: ['#f0fdf9', '#f5f3ff', '#fdf2f8'] },
  { id: 'default', label: 'EGCHAT', category: 'crystal', colors: ['#f0fdf9', '#f5f3ff', '#fdf2f8'] },
  { id: 'crystal-mint', label: 'Menta Cristal', category: 'crystal', colors: ['#e0fdf4', '#a7f3d0', '#d1fae5'] },
  { id: 'crystal-sky', label: 'Cielo Suave', category: 'crystal', colors: ['#eff6ff', '#bfdbfe', '#e0f2fe'] },
  { id: 'crystal-rose', label: 'Rosa Pétalo', category: 'crystal', colors: ['#fff1f2', '#fecdd3', '#fce7f3'] },
  { id: 'crystal-lavender', label: 'Lavanda', category: 'crystal', colors: ['#f5f3ff', '#ddd6fe', '#f0e6ff'] },
  { id: 'crystal-aqua', label: 'Aqua Cristal', category: 'crystal', colors: ['#ecfeff', '#a5f3fc', '#e0f7fa'] },
  { id: 'static-malabo', label: 'Malabo Noche', category: 'static', colors: ['#020617', '#1e1b4b', '#0f172a'] },
  { id: 'static-ocean', label: 'Océano Atlántico', category: 'static', colors: ['#0c4a6e', '#0284c7', '#38bdf8'] },
  { id: 'static-sunset', label: 'Atardecer GQ', category: 'static', colors: ['#1e3a5f', '#ea580c', '#fef3c7'] },
  { id: 'dyn-rain-malabo', label: 'Lluvia Malabo', category: 'dynamic', colors: ['#0a0a1a', '#1a2a4a', '#0d1b2a'], live: true },
  { id: 'dyn-maritime', label: 'Paseo Marítimo', category: 'dynamic', colors: ['#0c4a6e', '#0369a1', '#0ea5e9'], live: true },
];

export const getWallpaper = (id: string) =>
  CHAT_WALLPAPERS.find(w => w.id === id) ?? CHAT_WALLPAPERS.find(w => w.id === 'default')!;
