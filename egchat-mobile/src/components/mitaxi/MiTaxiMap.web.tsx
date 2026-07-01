import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MALABO_CENTER, MITAXI_PLACES, MapCoord } from '../../data/mitaxiPlaces';
import type { MiTaxiMapProps } from './types';

export function MiTaxiMap({
  userLocation,
  destLocation,
  driverLocation,
  accentColor = '#6366F1',
}: MiTaxiMapProps) {
  const center = userLocation ?? MALABO_CENTER;
  const bbox = useMemo(() => {
    const pts = [userLocation, destLocation, driverLocation].filter(Boolean) as MapCoord[];
    if (pts.length === 0) {
      return {
        minLng: center.longitude - 0.06,
        maxLng: center.longitude + 0.06,
        minLat: center.latitude - 0.06,
        maxLat: center.latitude + 0.06,
      };
    }
    const lats = pts.map(p => p.latitude);
    const lngs = pts.map(p => p.longitude);
    const pad = 0.015;
    return {
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
    };
  }, [center, userLocation, destLocation, driverLocation]);

  const markers = [
    userLocation && { ...userLocation, label: 'Tú', color: accentColor },
    destLocation && { ...destLocation, label: 'Destino', color: '#0F172A' },
    driverLocation && { ...driverLocation, label: 'Conductor', color: '#10B981' },
  ].filter(Boolean) as Array<MapCoord & { label: string; color: string }>;

  const embedUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.minLng}%2C${bbox.minLat}%2C${bbox.maxLng}%2C${bbox.maxLat}` +
    `&layer=mapnik&marker=${center.latitude}%2C${center.longitude}`;

  return (
    <View style={s.wrap}>
      {/* iframe solo en web */}
      {/* @ts-expect-error iframe web */}
      <iframe
        title="Mapa MiTaxi Malabo"
        src={embedUrl}
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
      <View style={s.legend} pointerEvents="none">
        <Text style={s.legendTitle}>📍 Malabo · {MITAXI_PLACES.length} lugares</Text>
        {markers.map(m => (
          <Text key={m.label} style={[s.legendItem, { color: m.color }]}>
            ● {m.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: '#e0e7ff' },
  legend: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    padding: 8,
    maxWidth: 160,
  },
  legendTitle: { fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 4 },
  legendItem: { fontSize: 10, fontWeight: '600' },
});

export default MiTaxiMap;
