/**
 * Hook para geolocalización automática con React Native + Expo
 * Detecta la ubicación actual y obtiene el nombre de la ciudad
 */
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
}

interface UseGeolocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCityName = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Usar reverse geocoding de Expo Location
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        // Priorizar: city > subregion > region > country
        return address.city || 
               address.subregion || 
               address.region || 
               address.country || 
               'Mi ciudad';
      }
      
      // Fallback usando OpenStreetMap como backup
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      
      return data?.address?.city || 
             data?.address?.town || 
             data?.address?.village || 
             data?.address?.county || 
             'Mi ciudad';
    } catch {
      return 'Mi ciudad';
    }
  };

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Pedir permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permiso de ubicación denegado');
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      
      // Obtener nombre de la ciudad
      const city = await getCityName(latitude, longitude);

      setLocation({ latitude, longitude, city });
    } catch (err: any) {
      setError(err.message || 'Error obteniendo ubicación');
      console.log('Error de geolocalización:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-detectar ubicación al montar el componente
  useEffect(() => {
    requestLocation();
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
};