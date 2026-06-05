/**
 * sqlite-shim.ts
 *
 * En iOS/Android, @capacitor-community/sqlite se registra como plugin nativo
 * en window.Capacitor.Plugins.CapacitorSQLite — no como módulo ES importable.
 *
 * Este shim re-exporta lo que necesita database.ts de forma compatible
 * con el build de Vite (sin external) y el runtime de Capacitor WebView.
 */

import { Capacitor } from '@capacitor/core';

// En web: importar normalmente (jest, dev server, PWA)
// En nativo: el plugin ya está registrado por Capacitor bridge —
//   @capacitor-community/sqlite lo detecta automáticamente vía registerPlugin

let _sqlite: typeof import('@capacitor-community/sqlite') | null = null;

async function getSQLiteModule() {
  if (_sqlite) return _sqlite;
  // Importación dinámica — Vite la incluye en el bundle pero solo
  // se ejecuta cuando se llama, evitando el error de resolución en WebView
  _sqlite = await import('@capacitor-community/sqlite');
  return _sqlite;
}

export async function getCapacitorSQLite() {
  const mod = await getSQLiteModule();
  return mod.CapacitorSQLite;
}

export async function getSQLiteConnection() {
  const mod = await getSQLiteModule();
  return mod.SQLiteConnection;
}

export async function getSQLiteDBConnection() {
  const mod = await getSQLiteModule();
  return mod.SQLiteDBConnection;
}

export { Capacitor };
