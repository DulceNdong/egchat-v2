import { r as reactExports } from "./react-core-B1rSPtcn.js";
function useGPS(options = {}) {
  const {
    watch = false,
    highAccuracy = true,
    timeout = 1e4,
    onUpdate,
    reverseGeocode = false
  } = options;
  const [position, setPosition] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const watchIdRef = reactExports.useRef(null);
  const lastCityFetch = reactExports.useRef(null);
  const fetchCity = reactExports.useCallback(async (lat, lng) => {
    if (lastCityFetch.current) {
      const dlat = Math.abs(lat - lastCityFetch.current.lat);
      const dlng = Math.abs(lng - lastCityFetch.current.lng);
      if (dlat < 0.02 && dlng < 0.02) return "";
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      lastCityFetch.current = { lat, lng };
      return data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || "";
    } catch {
      return "";
    }
  }, []);
  const handlePosition = reactExports.useCallback(async (pos) => {
    const { latitude: lat, longitude: lng, accuracy, heading, speed } = pos.coords;
    const newPos = { lat, lng, accuracy, heading, speed, timestamp: pos.timestamp };
    if (reverseGeocode) {
      const city = await fetchCity(lat, lng);
      if (city) newPos.city = city;
    }
    setPosition(newPos);
    setLoading(false);
    setError(null);
    onUpdate?.(newPos);
  }, [reverseGeocode, fetchCity, onUpdate]);
  const handleError = reactExports.useCallback((err) => {
    const messages = {
      1: "Permiso de ubicación denegado. Actívalo en ajustes del navegador.",
      2: "Ubicación no disponible. Verifica que el GPS esté activado.",
      3: "Tiempo de espera agotado. Intenta de nuevo."
    };
    setError(messages[err.code] || "Error de geolocalización");
    setLoading(false);
  }, []);
  const requestPosition = reactExports.useCallback(() => {
    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalización");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: highAccuracy,
      timeout,
      maximumAge: 5e3
    });
  }, [handlePosition, handleError, highAccuracy, timeout]);
  reactExports.useEffect(() => {
    if (!navigator.geolocation) {
      setError("Tu dispositivo no soporta geolocalización");
      return;
    }
    setLoading(true);
    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        { enableHighAccuracy: highAccuracy, timeout, maximumAge: 2e3 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 1e4
      });
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watch, highAccuracy, timeout]);
  return { position, error, loading, requestPosition };
}
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export {
  distanceKm as d,
  useGPS as u
};
