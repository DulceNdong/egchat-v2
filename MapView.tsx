// MapView.tsx — Componente de mapa reutilizable con MapTiler SDK (web, todos los dispositivos)
import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';

// API Key de MapTiler — gratis en cloud.maptiler.com
const MAPTILER_KEY = 'bg3FUa7es7Qn1TITIWjO';

maptilersdk.config.apiKey = MAPTILER_KEY;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
  icon?: 'car' | 'pin' | 'user' | 'destination';
  popup?: string;
}

export interface MapRoute {
  from: [number, number]; // [lng, lat]
  to: [number, number];
  color?: string;
  width?: number;
}

interface MapViewProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  route?: MapRoute | null;
  style?: 'streets' | 'satellite' | 'hybrid' | 'topo';
  height?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  interactive?: boolean;
}

// Malabo, Guinea Ecuatorial como centro por defecto
const DEFAULT_CENTER: [number, number] = [8.7735, 3.7520];
const DEFAULT_ZOOM = 13;

const MapView: React.FC<MapViewProps> = ({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  route = null,
  style = 'streets',
  height = '100%',
  onMapClick,
  onMarkerClick,
  interactive = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<Map<string, maptilersdk.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);

  const styleUrl = {
    streets: maptilersdk.MapStyle.STREETS,
    satellite: maptilersdk.MapStyle.SATELLITE,
    hybrid: maptilersdk.MapStyle.HYBRID,
    topo: maptilersdk.MapStyle.TOPO,
  }[style];

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: styleUrl,
      center,
      zoom,
      interactive,
      attributionControl: false,
    });

    map.current.on('load', () => setMapLoaded(true));

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lat, e.lngLat.lng);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Actualizar centro/zoom
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.flyTo({ center, zoom, duration: 800 });
  }, [center[0], center[1], zoom, mapLoaded]);

  // Gestionar marcadores
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Eliminar marcadores viejos
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    // Añadir nuevos marcadores
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 36px; height: 36px; border-radius: 50%;
        background: ${marker.color || '#00c8a0'};
        border: 3px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: 16px;
        transition: transform 0.15s;
      `;

      // Icono según tipo
      const icons: Record<string, string> = {
        car: '🚕', pin: '📍', user: '👤', destination: '🏁'
      };
      el.textContent = icons[marker.icon || 'pin'] || '📍';

      el.onmouseenter = () => { el.style.transform = 'scale(1.2)'; };
      el.onmouseleave = () => { el.style.transform = 'scale(1)'; };

      const m = new maptilersdk.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat]);

      if (marker.popup) {
        m.setPopup(new maptilersdk.Popup({ offset: 25 }).setHTML(
          `<div style="font-size:13px;font-weight:600;padding:4px 8px">${marker.popup}</div>`
        ));
      }

      if (onMarkerClick) {
        el.onclick = () => onMarkerClick(marker);
      }

      m.addTo(map.current!);
      markersRef.current.set(marker.id, m);
    });
  }, [markers, mapLoaded]);

  // Dibujar ruta
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Eliminar ruta anterior
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    if (!route) return;

    // Obtener ruta real via OSRM (gratuito, sin API key)
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${route.from[0]},${route.from[1]};${route.to[0]},${route.to[1]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        const geometry = data.routes?.[0]?.geometry;
        if (!geometry || !map.current) return;

        map.current.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry }
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': route.color || '#00c8a0',
            'line-width': route.width || 5,
            'line-opacity': 0.85,
          }
        });

        // Ajustar vista para mostrar toda la ruta
        const coords = geometry.coordinates;
        const bounds = coords.reduce(
          (b: maptilersdk.LngLatBounds, c: [number,number]) => b.extend(c),
          new maptilersdk.LngLatBounds(coords[0], coords[0])
        );
        map.current.fitBounds(bounds, { padding: 60, duration: 1000 });
      } catch {
        // Fallback: línea recta si OSRM falla
        if (!map.current) return;
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature', properties: {},
            geometry: { type: 'LineString', coordinates: [route.from, route.to] }
          }
        });
        map.current.addLayer({
          id: 'route-line', type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': route.color || '#00c8a0', 'line-width': route.width || 5 }
        });
      }
    };

    fetchRoute();
  }, [route, mapLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      {!mapLoaded && (
        <div style={{
          position: 'absolute', inset: 0, background: '#e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '8px'
        }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #00c8a0', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Cargando mapa...</span>
        </div>
      )}
    </div>
  );
};

export default MapView;
