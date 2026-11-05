/** Lugares de Malabo y Bata con coordenadas — expandido v2 */

export interface MiTaxiPlace {
  name: string;
  lat: number;
  lng: number;
  emoji?: string;
  city: 'malabo' | 'bata';
}

export const MALABO_CENTER = { latitude: 3.7523, longitude: 8.7741 };
export const BATA_CENTER   = { latitude: 1.8639, longitude: 9.7715 };

export const MITAXI_PLACES: MiTaxiPlace[] = [
  // ── MALABO ───────────────────────────────────────────────────────
  { name: 'Aeropuerto de Malabo', lat: 3.7552, lng: 8.7087, emoji: '✈️', city: 'malabo' },
  { name: 'Hotel Bahía', lat: 3.7540, lng: 8.7810, emoji: '🏨', city: 'malabo' },
  { name: 'Hotel Impala', lat: 3.7535, lng: 8.7785, emoji: '🏨', city: 'malabo' },
  { name: 'Hotel Sofitel Sipopo', lat: 3.7710, lng: 8.7960, emoji: '🏨', city: 'malabo' },
  { name: 'Mercado Central', lat: 3.7480, lng: 8.7760, emoji: '🛒', city: 'malabo' },
  { name: 'Mercado de Ela Nguema', lat: 3.7420, lng: 8.7610, emoji: '🛒', city: 'malabo' },
  { name: 'Palacio de Justicia', lat: 3.7510, lng: 8.7790, emoji: '⚖️', city: 'malabo' },
  { name: 'Universidad Nacional', lat: 3.7495, lng: 8.7680, emoji: '🎓', city: 'malabo' },
  { name: 'Hospital La Paz', lat: 3.7523, lng: 8.7741, emoji: '🏥', city: 'malabo' },
  { name: 'Hospital Universitario', lat: 3.7465, lng: 8.7670, emoji: '🏥', city: 'malabo' },
  { name: 'Clínica Santa Isabel', lat: 3.7512, lng: 8.7798, emoji: '🏥', city: 'malabo' },
  { name: 'Playa de Malabo', lat: 3.7580, lng: 8.7850, emoji: '🏖️', city: 'malabo' },
  { name: 'Sipopo Beach', lat: 3.7700, lng: 8.7950, emoji: '🏖️', city: 'malabo' },
  { name: 'Estadio de Malabo', lat: 3.7450, lng: 8.7720, emoji: '⚽', city: 'malabo' },
  { name: 'Puerto de Malabo', lat: 3.7550, lng: 8.7820, emoji: '⚓', city: 'malabo' },
  { name: 'Puerto Norte', lat: 3.7595, lng: 8.7830, emoji: '⚓', city: 'malabo' },
  { name: 'Barrio Ela Nguema', lat: 3.7460, lng: 8.7640, emoji: '📍', city: 'malabo' },
  { name: 'Barrio Campo Yaounde', lat: 3.7490, lng: 8.7700, emoji: '📍', city: 'malabo' },
  { name: 'Barrio Caracolas', lat: 3.7530, lng: 8.7770, emoji: '📍', city: 'malabo' },
  { name: 'Barrio Nuevos Ministerios', lat: 3.7560, lng: 8.7810, emoji: '📍', city: 'malabo' },
  { name: 'Centro Comercial Paraíso', lat: 3.7505, lng: 8.7775, emoji: '🏬', city: 'malabo' },
  { name: 'Centro Comercial La Gran Muralla', lat: 3.7515, lng: 8.7790, emoji: '🏬', city: 'malabo' },
  { name: 'Catedral de Malabo', lat: 3.7528, lng: 8.7755, emoji: '⛪', city: 'malabo' },
  { name: 'Basílica de la Inmaculada Concepción', lat: 3.7522, lng: 8.7748, emoji: '⛪', city: 'malabo' },
  { name: 'Colegio La Salle', lat: 3.7515, lng: 8.7710, emoji: '🏫', city: 'malabo' },
  { name: 'Colegio Español de Malabo', lat: 3.7500, lng: 8.7730, emoji: '🏫', city: 'malabo' },
  { name: 'Punta Europa', lat: 3.7620, lng: 8.7900, emoji: '📍', city: 'malabo' },
  { name: 'Banco BANGE', lat: 3.7501, lng: 8.7800, emoji: '🏦', city: 'malabo' },
  { name: 'BGFI Bank Malabo', lat: 3.7508, lng: 8.7805, emoji: '🏦', city: 'malabo' },
  { name: 'Presidencia de la República', lat: 3.7545, lng: 8.7760, emoji: '🏛️', city: 'malabo' },
  { name: 'Ministerio de Hacienda', lat: 3.7535, lng: 8.7755, emoji: '🏛️', city: 'malabo' },
  { name: 'Embajada de España', lat: 3.7518, lng: 8.7745, emoji: '🏛️', city: 'malabo' },
  { name: 'Embajada de EEUU', lat: 3.7510, lng: 8.7735, emoji: '🏛️', city: 'malabo' },
  { name: 'Plaza de la Independencia', lat: 3.7525, lng: 8.7760, emoji: '🏛️', city: 'malabo' },
  { name: 'Cámara de Representantes', lat: 3.7540, lng: 8.7750, emoji: '🏛️', city: 'malabo' },
  { name: 'Rotonda de Ela Nguema', lat: 3.7440, lng: 8.7660, emoji: '🔄', city: 'malabo' },
  { name: 'Rotonda de La Paz', lat: 3.7520, lng: 8.7740, emoji: '🔄', city: 'malabo' },
  { name: 'Zona Franca de Malabo', lat: 3.7610, lng: 8.7890, emoji: '🏭', city: 'malabo' },
  { name: 'GEPetrol Headquarters', lat: 3.7570, lng: 8.7830, emoji: '🛢️', city: 'malabo' },
  { name: 'Nuevo Malabo (Ciudad de la Paz)', lat: 3.8200, lng: 8.8500, emoji: '🏙️', city: 'malabo' },
  // ── BATA ─────────────────────────────────────────────────────────
  { name: 'Aeropuerto de Bata', lat: 1.9055, lng: 9.8058, emoji: '✈️', city: 'bata' },
  { name: 'Puerto de Bata', lat: 1.8650, lng: 9.7750, emoji: '⚓', city: 'bata' },
  { name: 'Mercado Central de Bata', lat: 1.8620, lng: 9.7700, emoji: '🛒', city: 'bata' },
  { name: 'Hospital Regional de Bata', lat: 1.8680, lng: 9.7720, emoji: '🏥', city: 'bata' },
  { name: 'Universidad de Bata', lat: 1.8700, lng: 9.7680, emoji: '🎓', city: 'bata' },
  { name: 'Estadio de Bata', lat: 1.8590, lng: 9.7730, emoji: '⚽', city: 'bata' },
  { name: 'Catedral de Bata', lat: 1.8630, lng: 9.7710, emoji: '⛪', city: 'bata' },
  { name: 'Hotel Bata', lat: 1.8640, lng: 9.7720, emoji: '🏨', city: 'bata' },
  { name: 'Hotel Sima', lat: 1.8660, lng: 9.7730, emoji: '🏨', city: 'bata' },
  { name: 'Barrio de Nkolentangan', lat: 1.8580, lng: 9.7670, emoji: '📍', city: 'bata' },
  { name: 'Barrio Ela Nguema Bata', lat: 1.8720, lng: 9.7750, emoji: '📍', city: 'bata' },
  { name: 'Playa de Bata', lat: 1.8650, lng: 9.7780, emoji: '🏖️', city: 'bata' },
  { name: 'BGFI Bank Bata', lat: 1.8635, lng: 9.7715, emoji: '🏦', city: 'bata' },
  { name: 'Delegación de Gobierno Litoral', lat: 1.8645, lng: 9.7725, emoji: '🏛️', city: 'bata' },
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

/** Distancia en km entre dos coords (fórmula de Haversine) */
export function calcDistanceKm(a: MapCoord, b: MapCoord): number {
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLng = (b.longitude - a.longitude) * Math.PI / 180;
  const hav = Math.sin(dLat / 2) ** 2
    + Math.cos(a.latitude * Math.PI / 180)
    * Math.cos(b.latitude * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}

/** Tarifas reales por tipo de vehículo (XAF/km + base) */
export const RIDE_FARES: Record<string, { base: number; perKm: number; minFare: number }> = {
  moto:    { base: 300,  perKm: 150, minFare: 500  },
  taxi:    { base: 500,  perKm: 250, minFare: 1000 },
  suv:     { base: 800,  perKm: 400, minFare: 2000 },
  vip:     { base: 1500, perKm: 700, minFare: 3500 },
  cargo:   { base: 1000, perKm: 500, minFare: 2500 },
  van:     { base: 1200, perKm: 550, minFare: 3000 },
  minivan: { base: 900,  perKm: 450, minFare: 2200 },
};

/** Calcula tarifa estimada según distancia */
export function estimateFare(rideType: string, distanceKm: number): number {
  const fare = RIDE_FARES[rideType] || RIDE_FARES.taxi;
  const total = fare.base + fare.perKm * Math.max(1, distanceKm);
  return Math.max(fare.minFare, Math.round(total / 100) * 100);
}
