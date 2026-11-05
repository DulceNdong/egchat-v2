/**
 * WeatherProvider - Componente que inicializa la geolocalización y clima automático
 * Se debe usar en el root de la app para funcionar correctamente
 */
import { useEffect } from 'react';
import { initializeLocation, fetchWeatherIfStale } from '../store/appStore';

interface WeatherProviderProps {
  children: React.ReactNode;
}

export const WeatherProvider: React.FC<WeatherProviderProps> = ({ children }) => {
  useEffect(() => {
    // Inicializar ubicación y clima al montar
    initializeLocation();

    // Refrescar clima cada 10 minutos
    const interval = setInterval(() => {
      fetchWeatherIfStale();
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};