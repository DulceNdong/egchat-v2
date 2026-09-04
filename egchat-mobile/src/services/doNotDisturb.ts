// ══════════════════════════════════════════════════════════════════
// doNotDisturb — Modo No Molestar programado
// Silencia todas las notificaciones entre horaInicio y horaFin
// ══════════════════════════════════════════════════════════════════
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'egchat_dnd_settings';

export interface DNDSettings {
  enabled: boolean;
  startHour: number;   // 0-23
  startMin: number;
  endHour: number;
  endMin: number;
  allowCalls: boolean; // permitir llamadas urgentes
  days: number[];      // 0=Dom, 1=Lun, ..., 6=Sab
}

const DEFAULTS: DNDSettings = {
  enabled: false,
  startHour: 22, startMin: 0,
  endHour: 8,   endMin: 0,
  allowCalls: true,
  days: [0, 1, 2, 3, 4, 5, 6], // todos los días
};

export async function getDNDSettings(): Promise<DNDSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch { return DEFAULTS; }
}

export async function saveDNDSettings(settings: DNDSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}

/** Comprueba si ahora mismo el DND está activo */
export function isDNDActive(settings: DNDSettings): boolean {
  if (!settings.enabled) return false;
  const now = new Date();
  const day = now.getDay();
  if (!settings.days.includes(day)) return false;

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = settings.startHour * 60 + settings.startMin;
  const endMins = settings.endHour * 60 + settings.endMin;

  if (startMins <= endMins) {
    // Mismo día: ej. 09:00 → 18:00
    return nowMins >= startMins && nowMins < endMins;
  } else {
    // Cruza medianoche: ej. 22:00 → 08:00
    return nowMins >= startMins || nowMins < endMins;
  }
}

export function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
