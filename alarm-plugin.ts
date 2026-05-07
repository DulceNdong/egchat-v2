/**
 * alarm-plugin.ts
 * Wrapper TypeScript para el plugin nativo AlarmPlugin de Capacitor.
 * Permite programar alarmas que superan el modo Doze de Android.
 *
 * Uso:
 *   import { scheduleAlarm, cancelAlarm } from './alarm-plugin';
 *
 *   // Alarma en 60 segundos
 *   await scheduleAlarm({ triggerTimeInMillis: Date.now() + 60_000 });
 *
 *   // Alarma con datos de chat
 *   await scheduleAlarm({
 *     triggerTimeInMillis: Date.now() + 30_000,
 *     title: 'Recordatorio',
 *     body: 'Tienes un mensaje pendiente',
 *     chatId: 'uuid-del-chat',
 *     alarmId: 42,
 *   });
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ScheduleAlarmOptions {
  /** Tiempo de disparo en milisegundos desde epoch Unix (Date.now() + offset) */
  triggerTimeInMillis: number;
  /** Título de la notificación cuando suene la alarma */
  title?: string;
  /** Cuerpo de la notificación */
  body?: string;
  /** ID del chat al que navegar al tocar la notificación */
  chatId?: string;
  /** ID único de la alarma — permite cancelarla después. Auto-generado si no se pasa */
  alarmId?: number;
}

export interface ScheduleAlarmResult {
  scheduled: boolean;
  alarmId: number;
  triggerAt: number;
}

export interface CancelAlarmOptions {
  alarmId: number;
}

export interface CancelAlarmResult {
  cancelled: boolean;
  alarmId: number;
}

export interface AlarmPluginInterface {
  scheduleAlarm(options: ScheduleAlarmOptions): Promise<ScheduleAlarmResult>;
  cancelAlarm(options: CancelAlarmOptions): Promise<CancelAlarmResult>;
}

// ── Registro del plugin nativo ────────────────────────────────────────────────

const NativeAlarmPlugin = registerPlugin<AlarmPluginInterface>('AlarmPlugin');

// ── Funciones exportadas ──────────────────────────────────────────────────────

/**
 * scheduleAlarm()
 * Programa una alarma nativa que supera el modo Doze de Android.
 * En web/iOS no hace nada (no-op seguro).
 *
 * @param options - Opciones de la alarma
 * @returns Resultado con alarmId y tiempo de disparo
 */
export async function scheduleAlarm(
  options: ScheduleAlarmOptions
): Promise<ScheduleAlarmResult | null> {
  // Solo funciona en Android nativo
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    console.log('[AlarmPlugin] No es Android nativo — scheduleAlarm ignorado.');
    return null;
  }

  if (!options.triggerTimeInMillis || options.triggerTimeInMillis <= Date.now()) {
    console.warn('[AlarmPlugin] triggerTimeInMillis debe ser en el futuro.');
    return null;
  }

  try {
    const result = await NativeAlarmPlugin.scheduleAlarm(options);
    console.log(`[AlarmPlugin] Alarma programada — id:${result.alarmId} en ${new Date(result.triggerAt).toLocaleTimeString()}`);
    return result;
  } catch (error) {
    console.error('[AlarmPlugin] Error al programar alarma:', error);
    return null;
  }
}

/**
 * cancelAlarm()
 * Cancela una alarma previamente programada por su ID.
 * En web/iOS no hace nada.
 */
export async function cancelAlarm(
  options: CancelAlarmOptions
): Promise<CancelAlarmResult | null> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return null;
  }

  try {
    const result = await NativeAlarmPlugin.cancelAlarm(options);
    console.log(`[AlarmPlugin] Alarma ${result.alarmId} cancelada.`);
    return result;
  } catch (error) {
    console.error('[AlarmPlugin] Error al cancelar alarma:', error);
    return null;
  }
}

/**
 * scheduleMessageReminder()
 * Atajo para programar un recordatorio de mensaje no leído.
 * Se dispara X minutos después si el usuario no ha abierto el chat.
 *
 * @param chatId   - ID del chat
 * @param sender   - Nombre del remitente
 * @param delayMs  - Retraso en ms (por defecto 5 minutos)
 */
export async function scheduleMessageReminder(
  chatId: string,
  sender: string,
  delayMs = 5 * 60 * 1000
): Promise<ScheduleAlarmResult | null> {
  return scheduleAlarm({
    triggerTimeInMillis: Date.now() + delayMs,
    title: `💬 ${sender}`,
    body: 'Tienes mensajes sin leer',
    chatId,
    // alarmId basado en chatId para poder cancelarlo cuando el usuario abra el chat
    alarmId: Math.abs(chatId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)),
  });
}

/**
 * cancelMessageReminder()
 * Cancela el recordatorio de un chat específico (cuando el usuario lo abre).
 */
export async function cancelMessageReminder(chatId: string): Promise<void> {
  const alarmId = Math.abs(chatId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  await cancelAlarm({ alarmId });
}
