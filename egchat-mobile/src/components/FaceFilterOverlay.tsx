/**
 * FaceFilterOverlay — Renderiza filtros AR en SVG superpuestos sobre la cámara
 * Recibe los datos de posición facial del módulo nativo y dibuja el filtro.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Ellipse, Rect, Path, Circle, G } from 'react-native-svg';
import type { FaceData, FilterId } from '../native/FaceFilter';

interface Props {
  faces: FaceData[];
  filterId: FilterId;
  width: number;
  height: number;
}

export function FaceFilterOverlay({ faces, filterId, width, height }: Props) {
  if (filterId === 'none' || faces.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {faces.map((face, i) => (
          <FaceFilter key={face.trackingId ?? i} face={face} filterId={filterId} scaleX={width} scaleY={height} />
        ))}
      </Svg>
    </View>
  );
}

function FaceFilter({ face, filterId, scaleX, scaleY }: {
  face: FaceData; filterId: FilterId; scaleX: number; scaleY: number;
}) {
  const lm  = face.landmarks;
  const fw  = face.width  * scaleX;
  const fh  = face.height * scaleY;
  const fx  = face.x      * scaleX;
  const fy  = face.y      * scaleY;
  const cx  = fx + fw / 2;
  const top = fy;

  // Escala de los elementos según tamaño de cara detectado
  const s = fw / 200;

  switch (filterId) {

    case 'glasses': {
      const lx = lm.leftEye  ? lm.leftEye.x  * scaleX : cx - fw * 0.2;
      const rx = lm.rightEye ? lm.rightEye.x * scaleX : cx + fw * 0.2;
      const ey = lm.leftEye  ? lm.leftEye.y  * scaleY : fy + fh * 0.35;
      const r  = fw * 0.16;
      return (
        <G>
          {/* Lente izquierda */}
          <Ellipse cx={lx} cy={ey} rx={r} ry={r * 0.7} fill="rgba(0,0,0,0.5)" stroke="#1a1a1a" strokeWidth={2*s}/>
          {/* Lente derecha */}
          <Ellipse cx={rx} cy={ey} rx={r} ry={r * 0.7} fill="rgba(0,0,0,0.5)" stroke="#1a1a1a" strokeWidth={2*s}/>
          {/* Puente */}
          <Path d={`M ${lx+r} ${ey} Q ${cx} ${ey-r*0.3} ${rx-r} ${ey}`} fill="none" stroke="#1a1a1a" strokeWidth={2*s}/>
          {/* Patillas */}
          <Path d={`M ${lx-r} ${ey} L ${fx-fw*0.05} ${ey+r*0.3}`} stroke="#1a1a1a" strokeWidth={2*s}/>
          <Path d={`M ${rx+r} ${ey} L ${fx+fw+fw*0.05} ${ey+r*0.3}`} stroke="#1a1a1a" strokeWidth={2*s}/>
        </G>
      );
    }

    case 'hat': {
      return (
        <G>
          {/* Base del sombrero */}
          <Rect x={fx - fw*0.1} y={top + fh*0.05} width={fw*1.2} height={fh*0.08} rx={4} fill="#1a1a1a"/>
          {/* Copa del sombrero */}
          <Rect x={fx + fw*0.15} y={top - fh*0.35} width={fw*0.7} height={fh*0.42} rx={6} fill="#1a1a1a"/>
          {/* Banda */}
          <Rect x={fx + fw*0.15} y={top - fh*0.02} width={fw*0.7} height={fh*0.06} fill="#c8a000"/>
        </G>
      );
    }

    case 'bunny_ears': {
      return (
        <G>
          {/* Oreja izquierda */}
          <Ellipse cx={cx - fw*0.22} cy={top - fh*0.3} rx={fw*0.1} ry={fh*0.22} fill="#f9a8d4"/>
          <Ellipse cx={cx - fw*0.22} cy={top - fh*0.3} rx={fw*0.055} ry={fh*0.13} fill="#fce7f3"/>
          {/* Oreja derecha */}
          <Ellipse cx={cx + fw*0.22} cy={top - fh*0.3} rx={fw*0.1} ry={fh*0.22} fill="#f9a8d4"/>
          <Ellipse cx={cx + fw*0.22} cy={top - fh*0.3} rx={fw*0.055} ry={fh*0.13} fill="#fce7f3"/>
        </G>
      );
    }

    case 'crown': {
      const cy2 = top - fh * 0.12;
      const pts = [
        [fx,         cy2 + fh*0.1],
        [fx + fw*0.2, cy2 - fh*0.12],
        [fx + fw*0.35, cy2 + fh*0.02],
        [cx,          cy2 - fh*0.18],
        [fx + fw*0.65, cy2 + fh*0.02],
        [fx + fw*0.8,  cy2 - fh*0.12],
        [fx + fw,      cy2 + fh*0.1],
      ].map(p => p.join(',')).join(' ');
      return (
        <G>
          <Path d={`M ${pts} Z`} fill="#fbbf24" stroke="#d97706" strokeWidth={2*s}/>
          <Circle cx={cx}          cy={cy2 - fh*0.18} r={fh*0.03} fill="#ef4444"/>
          <Circle cx={fx + fw*0.2} cy={cy2 - fh*0.12} r={fh*0.025} fill="#3b82f6"/>
          <Circle cx={fx + fw*0.8} cy={cy2 - fh*0.12} r={fh*0.025} fill="#10b981"/>
        </G>
      );
    }

    case 'mustache': {
      const mx = lm.nose ? lm.nose.x * scaleX : cx;
      const my = lm.nose ? lm.nose.y * scaleY + fh*0.08 : fy + fh*0.6;
      const mw = fw * 0.35;
      return (
        <G>
          <Path
            d={`M ${mx-mw} ${my} Q ${mx-mw*0.5} ${my+fh*0.06} ${mx} ${my+fh*0.02} Q ${mx+mw*0.5} ${my+fh*0.06} ${mx+mw} ${my}`}
            fill="#1a1a1a"
          />
        </G>
      );
    }

    default: return null;
  }
}
