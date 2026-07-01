/** Lugares de Malabo con coordenadas — paridad con MiTaxiView web */
export interface MiTaxiPlace {
  name: string;
  lat: number;
  lng: number;
  emoji?: string;
}

export const MALABO_CENTER = { latitude: 3.7523, longitude: 8.7741 };

export const MITAXI_PLACES: MiTaxiPlace[] = [
  { name: 'Aeropuerto de Malabo', lat: 3.7552, lng: 8.7087, emoji: '✈️' },
  { name: 'Hotel Bahía', lat: 3.7540, lng: 8.7810, emoji: '🏨' },
  { name: 'Mercado Central', lat: 3.7480, lng: 8.7760, emoji: '🛒' },
  { name: 'Palacio de Justicia', lat: 3.7510, lng: 8.7790, emoji: '⚖️' },
  { name: 'Universidad Nacional', lat: 3.7495, lng: 8.7680, emoji: '🎓' },
  { name: 'Hospital La Paz', lat: 3.7523, lng: 8.7741, emoji: '🏥' },
  { name: 'Playa de Malabo', lat: 3.7580, lng: 8.7850, emoji: '🏖️' },
  { name: 'Estadio de Malabo', lat: 3.7450, lng: 8.7720, emoji: '⚽' },
  { name: 'Puerto de Malabo', lat: 3.7550, lng: 8.7820, emoji: '⚓' },
  { name: 'Barrio Ela Nguema', lat: 3.7460, lng: 8.7640, emoji: '📍' },
  { name: 'Sipopo Beach', lat: 3.7700, lng: 8.7950, emoji: '🏖️' },
  { name: 'Centro Comercial Paraíso', lat: 3.7505, lng: 8.7775, emoji: '🏬' },
  { name: 'Catedral de Malabo', lat: 3.7528, lng: 8.7755, emoji: '⛪' },
  { name: 'Colegio La Salle', lat: 3.7515, lng: 8.7710, emoji: '🏫' },
  { name: 'Punta Europa', lat: 3.7620, lng: 8.7900, emoji: '📍' },
  { name: 'Hotel Impala', lat: 3.7535, lng: 8.7785, emoji: '🏨' },
  { name: 'Banco BANGE', lat: 3.7501, lng: 8.7800, emoji: '🏦' },
];

export const MITAXI_PLACE_NAMES = MITAXI_PLACES.map(p => p.name);

export type MapCoord = { latitude: number; longitude: number };

export function isCurrentLocationLabel(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.includes('ubicación actual') || t.includes('tu ubicación') || t === 'gps' || t === 'aquí';
}

export function findPlaceCoords(name: string): MapCoord | null {
  const q = name.trim().toLowerCase();
  if (!q) return null;
  const exact = MITAXI_PLACES.find(p => p.name.toLowerCase() === q);
  if (exact) return { latitude: exact.lat, longitude: exact.lng };
  const partial = MITAXI_PLACES.find(
    p => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()),
  );
  return partial ? { latitude: partial.lat, longitude: partial.lng } : null;
}
