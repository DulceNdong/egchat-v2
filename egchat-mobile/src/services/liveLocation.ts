// ══════════════════════════════════════════════════════════════════
// liveLocation — compartir ubicación en tiempo real en el chat
// Actualiza la posición cada N segundos y envía al chat
// ══════════════════════════════════════════════════════════════════
import * as Location from 'expo-location';
import { chatAPI, getToken, getApiBase } from '../api';

export interface LiveLocationSession {
  chatId: string;
  stop: () => void;
  isActive: boolean;
}

const INTERVAL_MS = 5000; // cada 5 segundos
const active: Map<string, ReturnType<typeof setInterval>> = new Map();

/**
 * Inicia el envío de ubicación en vivo en un chat.
 * Envía un mensaje de tipo "live_location" cada INTERVAL_MS.
 * Retorna una función stop() para detenerlo.
 */
export async function startLiveLocation(
  chatId: string,
  onUpdate?: (coords: { lat: number; lng: number }) => void
): Promise<LiveLocationSession> {
  // Pedir permisos
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se necesitan permisos de ubicación para compartir tu posición');
  }

  // Detener sesión previa si existía
  stopLiveLocation(chatId);

  const sendLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      onUpdate?.({ lat: latitude, lng: longitude });

      // Enviar al chat como mensaje de tipo location con live:true
      await chatAPI.sendMessage(chatId, {
        type: 'live_location',
        text: `📍 Ubicación en vivo\nlat:${latitude.toFixed(6)},lng:${longitude.toFixed(6)}`,
        file_url: `geo:${latitude},${longitude}?live=true`,
      });
    } catch { /* silencioso */ }
  };

  // Enviar inmediatamente
  sendLocation();

  const timer = setInterval(sendLocation, INTERVAL_MS);
  active.set(chatId, timer);

  return {
    chatId,
    isActive: true,
    stop: () => stopLiveLocation(chatId),
  };
}

/** Detiene el envío de ubicación en vivo */
export function stopLiveLocation(chatId: string) {
  const timer = active.get(chatId);
  if (timer) {
    clearInterval(timer);
    active.delete(chatId);
    // Notificar al chat que se detuvo
    chatAPI.sendMessage(chatId, {
      type: 'location',
      text: '📍 Ubicación en vivo finalizada',
    }).catch(() => {});
  }
}

/** Verifica si hay una sesión activa para un chat */
export function isLiveLocationActive(chatId: string): boolean {
  return active.has(chatId);
}

/** Parsea las coordenadas de un mensaje live_location */
export function parseLiveLocationCoords(text: string): { lat: number; lng: number } | null {
  const match = text.match(/lat:([-\d.]+),lng:([-\d.]+)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
}

/** Parsea coordenadas de un geo: URI */
export function parseGeoUri(uri: string): { lat: number; lng: number } | null {
  const match = uri.match(/geo:([-\d.]+),([-\d.]+)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
}
