import React, { useEffect, useRef, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { MALABO_CENTER, MITAXI_PLACES, MapCoord } from '../../data/mitaxiPlaces';
import type { MiTaxiMapProps } from './types';

const NEARBY_OFFSETS = [
  { dLat: 0.003, dLng: 0.002 },
  { dLat: -0.004, dLng: 0.001 },
  { dLat: 0.001, dLng: -0.003 },
  { dLat: -0.002, dLng: -0.002 },
  { dLat: 0.005, dLng: -0.001 },
];

function fitRegion(
  user: MapCoord | null,
  dest: MapCoord | null,
): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } {
  const points = [user, dest].filter(Boolean) as MapCoord[];
  if (points.length === 0) {
    return { ...MALABO_CENTER, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  }
  if (points.length === 1) {
    return { ...points[0], latitudeDelta: 0.04, longitudeDelta: 0.04 };
  }
  const lats = points.map(p => p.latitude);
  const lngs = points.map(p => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 0.012;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.03, maxLat - minLat + pad),
    longitudeDelta: Math.max(0.03, maxLng - minLng + pad),
  };
}

export function MiTaxiMap({
  userLocation,
  destLocation,
  driverLocation,
  showNearby = true,
  accentColor = '#6366F1',
}: MiTaxiMapProps) {
  const mapRef = useRef<MapView>(null);
  const region = useMemo(() => fitRegion(userLocation, destLocation), [userLocation, destLocation]);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 600);
  }, [region]);

  const routeCoords = useMemo(() => {
    if (!userLocation || !destLocation) return [];
    return [userLocation, destLocation];
  }, [userLocation, destLocation]);

  const nearby = useMemo(() => {
    const base = userLocation ?? MALABO_CENTER;
    return NEARBY_OFFSETS.map((o, i) => ({
      id: `near-${i}`,
      latitude: base.latitude + o.dLat,
      longitude: base.longitude + o.dLng,
    }));
  }, [userLocation]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        mapType={Platform.OS === 'android' ? 'none' : 'standard'}
        showsUserLocation={!!userLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
      >
        {/* OpenStreetMap — funciona sin API key de Google en Android */}
        {Platform.OS === 'android' && (
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent
          />
        )}

        {MITAXI_PLACES.map(p => (
          <Marker
            key={p.name}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={p.name}
            pinColor="#94A3B8"
            opacity={0.85}
          />
        ))}

        {userLocation && (
          <Marker coordinate={userLocation} title="Tu ubicación" pinColor={accentColor} />
        )}

        {destLocation && (
          <Marker coordinate={destLocation} title="Destino" pinColor="#0F172A" />
        )}

        {driverLocation && (
          <Marker coordinate={driverLocation} title="Conductor" pinColor="#10B981" />
        )}

        {showNearby && nearby.map(n => (
          <Marker key={n.id} coordinate={n} pinColor="#EAB308" opacity={0.7} />
        ))}

        {routeCoords.length === 2 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={accentColor}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>
    </View>
  );
}

export default MiTaxiMap;
