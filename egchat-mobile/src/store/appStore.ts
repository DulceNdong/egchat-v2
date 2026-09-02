/**
 * appStore.ts — Estado global mínimo para datos que NO deben
 * reiniciarse al cambiar de pestaña:
 *   - Clima (temperatura, ciudad, condición)
 *   - Notificaciones in-app (campanita)
 *
 * Patrón: módulo singleton con listeners → cero dependencias externas.
 */
import type { WeatherCondition } from '../components/EGChatHeader';
import { Platform } from 'react-native';

// Importar expo-location solo para plataformas nativas
let Location: any = null;
if (Platform.OS !== 'web') {
  try {
    Location = require('expo-location');
  } catch {
    // expo-location no disponible
  }
}

// ── Tipos ─────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'message' | 'call' | 'system' | 'payment';
  title: string;
  body: string;
  time: string;
  read: boolean;
  chatId?: string;
}

export interface WeatherState {
  temp: number;
  city: string;
  condition: WeatherCondition;
  fetchedAt: number; // timestamp — evita re-fetch innecesario
}

export interface AppState {
  weather: WeatherState;
  notifications: AppNotification[];
}

// ── Estado inicial ─────────────────────────────────────────────────
const state: AppState = {
  weather: {
    temp: 24,
    city: 'Detectando ubicación...',
    condition: 'cloudy',
    fetchedAt: 0,
  },
  notifications: [
    {
      id: 'welcome',
      type: 'system',
      title: '💬 Bienvenido a EGCHAT',
      body: 'Tu cuenta está activa y lista para usar',
      time: 'Ahora',
      read: false,
    },
    {
      id: 'e2e',
      type: 'system',
      title: '🔒 Cifrado E2E activado',
      body: 'Todos tus mensajes están cifrados',
      time: 'Hoy',
      read: false,
    },
  ],
};

// ── Listeners ──────────────────────────────────────────────────────
type Listener = () => void;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach(fn => fn());

export const subscribe = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getState = (): AppState => state;

// ── Acciones de clima ──────────────────────────────────────────────
const WEATHER_TTL = 10 * 60 * 1000; // 10 minutos

// Variables para geolocalización
let currentLatitude: number | null = null;
let currentLongitude: number | null = null;

// Mapeo de ciudades con sus códigos provinciales de Guinea Ecuatorial
const EQUATORIAL_GUINEA_CITIES: Record<string, string> = {
  // Bioko Norte (BN)
  'malabo': 'BN-MALABO',
  'rebola': 'BN-REBOLA',
  'baney': 'BN-BANEY',
  
  // Bioko Sur (BS) 
  'luba': 'BS-LUBA',
  'ureca': 'BS-URECA',
  
  // Wele-Nzas (WN)
  'mongomo': 'WN-MONGOMO',
  'añisoc': 'WN-AÑISOC',
  'anisoc': 'WN-AÑISOC',
  'akonibe': 'WN-AKONIBE',
  'nsork': 'WN-NSORK',
  
  // Kié-Ntem (KN) 
  'ebebiyin': 'KN-EBEBIYIN',
  'ebibeyin': 'KN-EBEBIYIN',
  'ebebiyín': 'KN-EBEBIYIN',
  'ebibiyin': 'KN-EBEBIYIN',
  'micomeseng': 'KN-MICOMESENG',
  'nsang': 'KN-NSANG',
  
  // Centro Sur (CS)
  'evinayong': 'CS-EVINAYONG',
  'acurenam': 'CS-ACURENAM',
  'niefang': 'CS-NIEFANG',
  
  // Litoral (LI)
  'bata': 'LI-BATA',
  'mbini': 'LI-MBINI',
  'cogo': 'LI-COGO',
  'acalayong': 'LI-ACALAYONG',
  
  // Annobón (AN)
  'san antonio de palé': 'AN-SAN ANTONIO DE PALÉ',
  'palé': 'AN-PALÉ',
  'pale': 'AN-PALÉ',
};

const getCityCodeFromName = (cityName: string): string => {
  const normalizedName = cityName.toLowerCase().trim();
  
  // Buscar coincidencia exacta
  if (EQUATORIAL_GUINEA_CITIES[normalizedName]) {
    return EQUATORIAL_GUINEA_CITIES[normalizedName];
  }
  
  // Mapeo especial para provincias que detecta la API
  const provinceMapping: Record<string, string> = {
    'provincia de kie-ntem': 'KN-EBEBIYIN',
    'kie-ntem': 'KN-EBEBIYIN',
    'kié-ntem': 'KN-EBEBIYIN',
    'provincia de wele-nzas': 'WN-MONGOMO',
    'wele-nzas': 'WN-MONGOMO',
    'wele nzas': 'WN-MONGOMO',
    'provincia de bioko norte': 'BN-MALABO',
    'bioko norte': 'BN-MALABO',
    'provincia de bioko sur': 'BS-LUBA',
    'bioko sur': 'BS-LUBA',
    'provincia de centro sur': 'CS-EVINAYONG',
    'centro sur': 'CS-EVINAYONG',
    'provincia del litoral': 'LI-BATA',
    'litoral': 'LI-BATA',
    'provincia de annobón': 'AN-PALÉ',
    'annobon': 'AN-PALÉ',
    'annobón': 'AN-PALÉ',
  };
  
  // Verificar mapeo de provincias
  if (provinceMapping[normalizedName]) {
    return provinceMapping[normalizedName];
  }
  
  // Buscar coincidencia parcial en provincias
  for (const [province, code] of Object.entries(provinceMapping)) {
    if (normalizedName.includes(province) || province.includes(normalizedName)) {
      return code;
    }
  }
  
  // Buscar coincidencia parcial en ciudades
  for (const [city, code] of Object.entries(EQUATORIAL_GUINEA_CITIES)) {
    if (normalizedName.includes(city) || city.includes(normalizedName)) {
      return code;
    }
  }
  
  // Si no se encuentra, devolver formato por defecto pero más limpio
  const cleanName = cityName.replace(/provincia\s+de\s+/i, '').replace(/\s+/g, '-').toUpperCase();
  return `EG-${cleanName}`;
};

const getCityName = async (latitude: number, longitude: number): Promise<string> => {
  try {
    let detectedCityName = '';
    
    // Para React Native nativo, usar expo-location si está disponible
    if (Platform.OS !== 'web' && Location) {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        detectedCityName = address.city || 
                          address.subregion || 
                          address.region || 
                          address.country || 
                          'Ciudad desconocida';
        console.log('[Geolocation] Ciudad detectada con Expo:', detectedCityName);
      }
    }
    
    // Fallback usando OpenStreetMap si no se obtuvo con expo-location
    if (!detectedCityName) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`
      );
      const data = await response.json();
      
      detectedCityName = data?.address?.city || 
                        data?.address?.town || 
                        data?.address?.village || 
                        data?.address?.county || 
                        'Ciudad desconocida';
      
      console.log('[Geolocation] Ciudad detectada con OpenStreetMap:', detectedCityName, 'para coordenadas:', latitude, longitude);
    }
    
    // Convertir el nombre de ciudad al formato con código provincial
    const cityCode = getCityCodeFromName(detectedCityName);
    console.log('[Geolocation] Código de ciudad generado:', cityCode);
    
    return cityCode;
  } catch (error) {
    console.log('[Geolocation] Error obteniendo nombre de ciudad:', error);
    return 'BN-MALABO'; // Fallback a Malabo con código correcto
  }
};

const fetchWeatherForLocation = async (latitude: number, longitude: number, city?: string) => {
  console.log('[Weather] Obteniendo clima para:', latitude, longitude, city ? `(ciudad: ${city})` : '');
  
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
    );
    const data = await res.json();
    const t = Math.round(data?.current_weather?.temperature ?? 24);
    const code = data?.current_weather?.weathercode ?? 0;
    let condition: WeatherCondition = 'cloudy';
    if (code === 0) condition = 'sunny';
    else if (code >= 51) condition = 'rain';

    // Si no se proporciona ciudad, obtenerla
    const cityName = city || await getCityName(latitude, longitude);
    
    console.log('[Weather] Clima obtenido:', { temp: t, city: cityName, condition });
    
    state.weather = { 
      temp: t, 
      city: cityName, 
      condition, 
      fetchedAt: Date.now() 
    };
    notify();
  } catch (error) {
    console.log('[Weather] Error obteniendo clima:', error);
    // mantener valor anterior
  }
};

export const initializeLocation = async () => {
  console.log('[Geolocation] Inicializando ubicación...');
  
  try {
    let latitude: number;
    let longitude: number;
    
    if (Platform.OS === 'web') {
      // Para web, usar navigator.geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 // siempre posición fresca
        });
      });
      
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      console.log('[Geolocation] Ubicación obtenida (web):', latitude, longitude);
      
    } else {
      // Para React Native nativo
      if (!Location) {
        throw new Error('expo-location not available');
      }
      
      // Pedir permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permiso de ubicación denegado');
      }

      // Obtener ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      latitude = location.coords.latitude;
      longitude = location.coords.longitude;
      console.log('[Geolocation] Ubicación obtenida (nativo):', latitude, longitude);
    }

    currentLatitude = latitude;
    currentLongitude = longitude;
    
    // Obtener clima para la ubicación actual
    await fetchWeatherForLocation(latitude, longitude);
    
  } catch (error) {
    console.log('[Geolocation] Error inicializando ubicación:', error);
    // Fallback a Malabo si hay error de permisos o GPS no disponible
    currentLatitude = 3.75;
    currentLongitude = 8.78;
    await fetchWeatherForLocation(currentLatitude, currentLongitude, 'BN-MALABO');
  }
};

export const fetchWeatherIfStale = async () => {
  const now = Date.now();
  if (now - state.weather.fetchedAt < WEATHER_TTL) return; // ya está fresco

  // Si tenemos coordenadas, usar esas. Si no, inicializar ubicación
  if (currentLatitude && currentLongitude) {
    await fetchWeatherForLocation(currentLatitude, currentLongitude);
  } else {
    await initializeLocation();
  }
};

// ── Acciones de notificaciones ─────────────────────────────────────
export const addNotification = (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
  const notif: AppNotification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: 'Ahora',
    read: false,
  };
  // Evitar duplicados por chatId+mensaje reciente (ventana 5s)
  const dup = state.notifications.find(
    x => x.chatId === notif.chatId && Date.now() - parseInt(x.id.split('-')[0] || '0') < 5000,
  );
  if (dup) return;

  state.notifications = [notif, ...state.notifications].slice(0, 50); // máx 50
  notify();
};

export const markAllRead = () => {
  state.notifications = state.notifications.map(n => ({ ...n, read: true }));
  notify();
};

export const clearAllNotifications = () => {
  state.notifications = [];
  notify();
};

export const removeNotification = (id: string) => {
  state.notifications = state.notifications.filter(n => n.id !== id);
  notify();
};

export const unreadCount = () => state.notifications.filter(n => !n.read).length;

// ── Función de debug para probar geolocalización manualmente ──────
if (typeof window !== 'undefined') {
  (window as any).testGeolocation = async () => {
    console.log('[DEBUG] Iniciando prueba manual de geolocalización...');
    await initializeLocation();
    console.log('[DEBUG] Estado actual del clima:', state.weather);
  };
  
  (window as any).getWeatherState = () => {
    console.log('[DEBUG] Estado actual del clima:', state.weather);
    return state.weather;
  };
}
