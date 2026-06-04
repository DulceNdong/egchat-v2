/**
 * logger.ts
 * Logger condicional — silencia logs en producción.
 * En desarrollo muestra todo. En producción solo warn/error.
 */

const IS_DEV = (import.meta as any).env?.DEV === true
            || (import.meta as any).env?.VITE_ENV === 'development'
            || typeof __API_URL__ === 'undefined';

declare const __API_URL__: string;

export const logger = {
  log:   (...a: any[]) => IS_DEV && console.log(...a),
  warn:  (...a: any[]) => console.warn(...a),
  error: (...a: any[]) => console.error(...a),
  info:  (...a: any[]) => IS_DEV && console.info(...a),
};
