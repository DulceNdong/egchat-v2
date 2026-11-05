/**
 * Iconos SVG profesionales para Mini-Apps
 * Estilo: línea fina, sin relleno, sin fondo
 */
import React from 'react';
import Svg, { Path, Rect, Circle, Line, Polyline, Polygon } from 'react-native-svg';

interface Props { color: string; size?: number; }

const s = (size = 28) => ({ width: size, height: size });

export function MiniAppIcon({ name, color, size = 28 }: Props & { name: string }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const d = s(size);

  switch (name) {
    case 'djangue': return (
      <Svg {...d} viewBox="0 0 24 24">
        {/* Grupo de personas con símbolo de moneda = tanda/caja grupal */}
        <Circle {...p} cx="9" cy="7" r="3"/>
        <Path {...p} d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/>
        <Circle {...p} cx="17" cy="8" r="2.5"/>
        <Path {...p} d="M20 19c0-2-1.8-3.5-4-3.5"/>
        <Path {...p} d="M17 4v4M15 6h4"/>
      </Svg>
    );
    case 'taxi': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Path {...p} d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
        <Circle {...p} cx="7.5" cy="17" r="2.5"/>
        <Circle {...p} cx="16.5" cy="17" r="2.5"/>
        <Path {...p} d="M7 9h10"/>
      </Svg>
    );
    case 'shield': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <Path {...p} d="M9 12l2 2 4-4"/>
      </Svg>
    );
    case 'bank': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Rect {...p} x="3" y="9" width="18" height="11" rx="1"/>
        <Path {...p} d="M3 9l9-6 9 6"/>
        <Line {...p} x1="7" y1="9" x2="7" y2="20"/>
        <Line {...p} x1="12" y1="9" x2="12" y2="20"/>
        <Line {...p} x1="17" y1="9" x2="17" y2="20"/>
      </Svg>
    );
    case 'cart': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Path {...p} d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <Line {...p} x1="3" y1="6" x2="21" y2="6"/>
        <Path {...p} d="M16 10a4 4 0 0 1-8 0"/>
      </Svg>
    );
    case 'government': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Path {...p} d="M3 22V11M21 22V11M12 22V11"/>
        <Path {...p} d="M2 11h20"/>
        <Path {...p} d="M2 7l10-5 10 5"/>
        <Line {...p} x1="6" y1="11" x2="6" y2="22"/>
        <Line {...p} x1="18" y1="11" x2="18" y2="22"/>
      </Svg>
    );
    case 'trophy': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Path {...p} d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
        <Path {...p} d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <Path {...p} d="M4 22h16"/>
        <Path {...p} d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <Path {...p} d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <Path {...p} d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
      </Svg>
    );
    case 'star': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Polygon {...p} points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </Svg>
    );
    case 'map': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <Circle {...p} cx="12" cy="10" r="3"/>
      </Svg>
    );
    case 'zap': return (
      <Svg {...d} viewBox="0 0 24 24">
        <Polygon {...p} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </Svg>
    );
    default: return (
      <Svg {...d} viewBox="0 0 24 24">
        <Rect {...p} x="3" y="3" width="18" height="18" rx="3"/>
        <Path {...p} d="M9 12h6M12 9v6"/>
      </Svg>
    );
  }
}

// Exportar el componente anchor que faltaba
export function AnchorIcon({ color = '#fff', size = 28 }: { color: string; size?: number }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...p} cx="12" cy="5" r="3"/>
      <Path {...p} d="M12 8v13M5 12H2a10 10 0 0 0 20 0h-3"/>
    </Svg>
  );
}
