/**
 * AppMonitor.ts  —  FASE 11: Monitoreo
 *
 * Métricas internas para operaciones y debugging:
 *  - Tiempo de arranque
 *  - Errores JS no capturados
 *  - Sincronizaciones (ok / error / duración)
 *  - Uso de API (llamadas, fallos, latencia)
 *  - Sesiones activas
 *
 * Los datos se guardan en localStorage y se pueden consultar
 * desde la pantalla de Ajustes de la app.
 * En producción se pueden enviar a un endpoint de métricas.
 */

const STORAGE_KEY = 'egchat_monitor_v1';
const MAX_EVENTS  = 200;

// ── Tipos ─────────────────────────────────────────────────────────

export interface MonitorEvent {
  type:    string;
  ts:      number;
  payload: Record<string, any>;
}

export interface AppMetrics {
  appStartMs:         number | null;
  totalSyncs:         number;
  failedSyncs:        number;
  totalApiCalls:      number;
  failedApiCalls:     number;
  avgSyncDurationMs:  number;
  lastErrorMessage:   string | null;
  lastErrorTs:        number | null;
  sessionCount:       number;
  pendingMessages:    number;
}

// ── Estado interno ────────────────────────────────────────────────

let _startTs = Date.now();
let _metrics: AppMetrics = _loadMetrics();
let _events:  MonitorEvent[] = [];

function _loadMetrics(): AppMetrics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ..._defaultMetrics(), ...JSON.parse(raw) };
  } catch {}
  return _defaultMetrics();
}

function _defaultMetrics(): AppMetrics {
  return {
    appStartMs:        null,
    totalSyncs:        0,
    failedSyncs:       0,
    totalApiCalls:     0,
    failedApiCalls:    0,
    avgSyncDurationMs: 0,
    lastErrorMessage:  null,
    lastErrorTs:       null,
    sessionCount:      0,
    pendingMessages:   0,
  };
}

function _save(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_metrics)); } catch {}
}

function _addEvent(type: string, payload: Record<string, any> = {}): void {
  _events.push({ type, ts: Date.now(), payload });
  if (_events.length > MAX_EVENTS) _events.shift();
}

// ── API Pública ───────────────────────────────────────────────────

export const AppMonitor = {

  /** Registrar inicio de la app y calcular tiempo de arranque */
  recordAppStart(): void {
    const ms = Date.now() - _startTs;
    _metrics.appStartMs    = ms;
    _metrics.sessionCount += 1;
    _addEvent('app_start', { ms });
    _save();
    console.log(`[Monitor] App arrancó en ${ms}ms`);
  },

  /** Registrar resultado de una sincronización */
  recordSync(ok: boolean, durationMs: number): void {
    _metrics.totalSyncs++;
    if (!ok) _metrics.failedSyncs++;
    // Media móvil simple
    _metrics.avgSyncDurationMs = Math.round(
      (_metrics.avgSyncDurationMs * (_metrics.totalSyncs - 1) + durationMs)
      / _metrics.totalSyncs
    );
    _addEvent('sync', { ok, durationMs });
    _save();
  },

  /** Registrar llamada a la API */
  recordApiCall(path: string, ok: boolean, latencyMs: number): void {
    _metrics.totalApiCalls++;
    if (!ok) _metrics.failedApiCalls++;
    _addEvent('api_call', { path, ok, latencyMs });
    if (_metrics.totalApiCalls % 10 === 0) _save(); // guardar cada 10 llamadas
  },

  /** Registrar un error */
  recordError(message: string, context?: string): void {
    _metrics.lastErrorMessage = message.slice(0, 200);
    _metrics.lastErrorTs      = Date.now();
    _addEvent('error', { message: message.slice(0, 200), context });
    _save();
    console.error('[Monitor] Error:', message, context ?? '');
  },

  /** Actualizar contador de mensajes pendientes */
  setPendingMessages(count: number): void {
    _metrics.pendingMessages = count;
  },

  /** Obtener métricas actuales */
  getMetrics(): AppMetrics { return { ..._metrics }; },

  /** Obtener eventos recientes */
  getEvents(last = 50): MonitorEvent[] {
    return _events.slice(-last);
  },

  /** Limpiar todas las métricas */
  reset(): void {
    _metrics = _defaultMetrics();
    _events  = [];
    _save();
  },

  /** Inicializar listeners globales de errores */
  init(): void {
    // Errores JS globales
    window.addEventListener('error', (e) => {
      this.recordError(e.message ?? 'JS Error', e.filename);
    });
    // Promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (e) => {
      this.recordError(
        e.reason?.message ?? String(e.reason) ?? 'Unhandled rejection',
        'promise'
      );
    });
    // Registrar inicio
    this.recordAppStart();
  },

  /** Exportar reporte como texto (para pantalla de soporte) */
  exportReport(): string {
    const m = this.getMetrics();
    return [
      `=== EGCHAT Monitor Report ===`,
      `Fecha: ${new Date().toISOString()}`,
      `Arranque: ${m.appStartMs ?? '-'}ms`,
      `Sesiones: ${m.sessionCount}`,
      `Syncs OK/Fail: ${m.totalSyncs - m.failedSyncs}/${m.failedSyncs}`,
      `Sync duración media: ${m.avgSyncDurationMs}ms`,
      `API OK/Fail: ${m.totalApiCalls - m.failedApiCalls}/${m.failedApiCalls}`,
      `Mensajes pendientes: ${m.pendingMessages}`,
      m.lastErrorMessage ? `Último error: ${m.lastErrorMessage}` : '',
    ].filter(Boolean).join('\n');
  },
};
