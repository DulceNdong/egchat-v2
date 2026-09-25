/**
 * BeacShield — Escudo oficial de la BEAC (Banque des États de l'Afrique Centrale)
 * Representación SVG del antílope en círculo dorado, símbolo del Franco CFA (XAF).
 */
import React from 'react';
import Svg, {
  Circle, Ellipse, Path, G, Line, Rect,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export function BeacShield({ size = 48 }: Props) {
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* ── Fondo del círculo ── */}
      <Circle cx="50" cy="50" r="47" fill="#fffbf0" />

      {/* ── Borde dorado exterior ── */}
      <Circle cx="50" cy="50" r="47" fill="none" stroke="#C9952A" strokeWidth="3.5" />
      {/* ── Borde interior decorativo ── */}
      <Circle cx="50" cy="50" r="42" fill="none" stroke="#C9952A" strokeWidth="1" strokeDasharray="2,3" />

      {/* ══════════════════════════════════════
          ANTÍLOPE — silueta estilizada BEAC
          Cabeza mirando a la izquierda, cuernos curvos hacia atrás
          ══════════════════════════════════════ */}
      <G fill="#C9952A">
        {/* Cuerno izquierdo largo y curvo */}
        <Path d="M 38 20 C 30 14, 20 10, 18 20 C 22 18, 28 22, 35 30 Z" />
        {/* Cuerno derecho */}
        <Path d="M 44 19 C 40 10, 32 8, 28 14 C 32 14, 38 18, 42 26 Z" />

        {/* Cabeza del antílope */}
        <Path d="M 32 30 C 26 28, 20 32, 22 40 C 24 46, 30 48, 36 46
                  C 42 44, 44 40, 42 34 C 40 29, 36 28, 32 30 Z" />

        {/* Detalle del ojo */}
        <Circle cx="27" cy="36" r="2" fill="#fffbf0" />
        <Circle cx="27" cy="36" r="1" fill="#8B6914" />

        {/* Hocico / nariz */}
        <Path d="M 22 40 C 20 42, 20 46, 22 47 C 24 48, 26 46, 24 44 Z" />

        {/* Cuello */}
        <Path d="M 36 46 C 34 50, 36 56, 40 58
                  C 44 56, 46 50, 44 46
                  C 42 44, 38 44, 36 46 Z" />

        {/* Pecho / cuerpo frontal */}
        <Path d="M 36 56 C 30 58, 26 64, 28 72
                  C 34 74, 44 74, 50 72
                  C 54 70, 56 64, 54 58
                  C 50 56, 42 54, 36 56 Z" />

        {/* Lomo trasero */}
        <Path d="M 50 58 C 58 56, 66 58, 68 66
                  C 66 72, 58 74, 52 72 Z" />

        {/* Pata delantera izquierda */}
        <Path d="M 32 72 C 30 76, 29 82, 30 86 C 32 87, 34 87, 34 86
                  C 34 82, 34 76, 34 72 Z" />

        {/* Pata delantera derecha */}
        <Path d="M 40 73 C 40 77, 40 83, 41 87 C 43 88, 45 87, 44 86
                  C 43 82, 42 76, 42 73 Z" />

        {/* Pata trasera izquierda */}
        <Path d="M 54 72 C 52 76, 52 82, 53 86 C 55 87, 57 87, 57 85
                  C 56 81, 55 76, 56 72 Z" />

        {/* Pata trasera derecha */}
        <Path d="M 62 70 C 62 74, 63 80, 64 84 C 66 85, 68 84, 67 83
                  C 66 79, 64 74, 63 70 Z" />

        {/* Cola pequeña */}
        <Path d="M 68 62 C 72 60, 76 58, 77 62 C 74 64, 70 64, 68 62 Z" />

        {/* Hierba / suelo estilizado bajo el animal */}
        <Path d="M 18 86 C 22 82, 22 86, 26 83 C 26 87, 30 84, 32 87
                  C 34 84, 36 87, 40 84 C 40 88, 44 85, 48 87
                  C 50 84, 54 87, 58 84 C 58 88, 62 85, 66 87
                  C 68 84, 72 87, 76 84 C 78 88, 80 85, 82 87
                  L 82 90 L 18 90 Z"
              opacity="0.7" />

        {/* Líneas de hierba individuales */}
        <Line x1="24" y1="90" x2="22" y2="80" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="30" y1="90" x2="29" y2="79" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="36" y1="90" x2="35" y2="81" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="46" y1="90" x2="45" y2="80" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="60" y1="90" x2="59" y2="81" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="68" y1="90" x2="67" y2="80" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="76" y1="90" x2="75" y2="82" stroke="#C9952A" strokeWidth="1.5" strokeLinecap="round" />
      </G>
    </Svg>
  );
}
