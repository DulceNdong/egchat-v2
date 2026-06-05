import { useEffect, useRef } from 'react';
import { useAlertsStore } from '../stores/alertsStore';

const API = import.meta.env.VITE_ADMIN_API_URL || 'https://egchat-api.onrender.com';

function getToken(): string {
  try {
    const s = JSON.parse(localStorage.getItem('egchat-admin-auth') || '{}');
    return s?.state?.token || '';
  } catch { return ''; }
}

export function useSSE(onMetrics?: (data: any) => void) {
  const addAlert = useAlertsStore((s) => s.addAlert);
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connect = () => {
      const token = getToken();
      if (!token) return;

      const url = `${API}/api/admin/stream?_t=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'alert') addAlert(data);
          if (data.type === 'metrics' && onMetrics) onMetrics(data);
        } catch {}
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Reconexión exponencial: 5s, 10s, 20s
        retryRef.current = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, []);
}
