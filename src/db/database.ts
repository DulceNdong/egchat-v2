/**
 * database.ts  —  Motor SQLite cifrado para EGCHAT
 *
 * Seguridad:
 *  - iOS:     SQLCipher (AES-256) vía @capacitor-community/sqlite
 *  - Android: SQLCipher (AES-256) vía @capacitor-community/sqlite
 *  - Web:     Sin cifrado — solo para desarrollo local
 *
 * Correcciones v3.1:
 *  - Passphrase lazy (evita llamar navigator antes de que el DOM esté listo)
 *  - Llaves balanceadas en _initNativeEncrypted
 *  - Migración automática sin cifrar → cifrada
 *
 * Patrón Singleton — una sola conexión compartida.
 */

import { Capacitor } from '@capacitor/core';
import { DB_NAME, DB_VERSION, CREATE_TABLES } from './schema';

// Importación dinámica de SQLite — evita error de resolución de módulo
// en el WebView de iOS/Android antes de que el bridge de Capacitor esté listo
let CapacitorSQLite: any;
let SQLiteConnection: any;

async function loadSQLite() {
  if (CapacitorSQLite) return;
  const mod = await import('@capacitor-community/sqlite');
  CapacitorSQLite = mod.CapacitorSQLite;
  SQLiteConnection = mod.SQLiteConnection;
}

// ── Nombres de base de datos ──────────────────────────────────────
const DB_PLAIN     = 'egchat_offline_v1';   // legacy sin cifrar
const DB_ENCRYPTED = 'egchat_secure_v1';    // nueva con cifrado

// Passphrase lazy — se calcula la primera vez (evita navigator en module-level)
let _passphrase: string | null = null;
function getPassphrase(): string {
  if (_passphrase) return _passphrase;
  const SECRET = 'egchat_db_2026_xaf';
  try {
    const hint = navigator.userAgent.replace(/[^a-z0-9]/gi, '').slice(0, 16);
    _passphrase = `${SECRET}_${hint}`;
  } catch {
    _passphrase = SECRET;
  }
  return _passphrase;
}

// ── Estado interno ────────────────────────────────────────────────
let sqliteConn: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null       = null;
let isInitialized = false;
let initPromise: Promise<void> | null   = null;

// ── Inicialización ────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  if (initPromise)   return initPromise;
  initPromise = _doInit();
  return initPromise;
}

async function _doInit(): Promise<void> {
  try {
    await loadSQLite();
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      await _initWeb();
    } else {
      await _initNativeEncrypted();
    }
    await _runMigrations();
    isInitialized = true;
    console.log('[DB] ✅ Inicializada. Plataforma:', platform);
  } catch (err) {
    console.error('[DB] Error de inicialización:', err);
    initPromise = null;
    throw err;
  }
}

async function _initNativeEncrypted(): Promise<void> {
  sqliteConn = new SQLiteConnection(CapacitorSQLite);

  // Migrar DB sin cifrar si existe
  await _migrateIfNeeded(sqliteConn);

  const consistency = await sqliteConn.checkConnectionsConsistency();
  const isConn      = (await sqliteConn.isConnection(DB_ENCRYPTED, false)).result;

  if (consistency.result && isConn) {
    db = await sqliteConn.retrieveConnection(DB_ENCRYPTED, false);
  } else {
    db = await sqliteConn.createConnection(
      DB_ENCRYPTED,
      true,        // encrypted
      'secret',    // encryption mode (SQLCipher)
      DB_VERSION,
      false        // not read-only
    );
  }
  await db.open();
}

async function _migrateIfNeeded(conn: SQLiteConnection): Promise<void> {
  try {
    const exists         = (await conn.isDatabase(DB_PLAIN)).result;
    if (!exists) return;

    const alreadyMigrated = (await conn.isDatabase(DB_ENCRYPTED)).result;
    if (alreadyMigrated) {
      try { await conn.deleteDatabase(DB_PLAIN); } catch {}
      return;
    }

    console.log('[DB] 🔄 Migrando DB sin cifrar → cifrada...');

    // Intentar migración tabla a tabla
    await _exportImportMigration(conn);

    try { await conn.deleteDatabase(DB_PLAIN); } catch {}
    console.log('[DB] ✅ Migración completada');
  } catch (err) {
    console.warn('[DB] ⚠️ Migración omitida — sync desde servidor:', err);
  }
}

async function _exportImportMigration(conn: SQLiteConnection): Promise<void> {
  let oldDb: SQLiteDBConnection | null = null;
  let newDb: SQLiteDBConnection | null = null;
  const pass = getPassphrase();

  try {
    oldDb = await conn.createConnection(DB_PLAIN, false, 'no-encryption', DB_VERSION, false);
    await oldDb.open();
    newDb = await conn.createConnection(DB_ENCRYPTED, true, 'secret', DB_VERSION, false);
    await newDb.open();

    for (const sql of CREATE_TABLES) {
      try { await newDb.execute(sql); } catch {}
    }

    const tables = ['users','contacts','conversations','messages',
                    'wallet_balance','wallet_transactions','settings'];
    for (const table of tables) {
      try {
        const rows = await oldDb.query(`SELECT * FROM ${table}`);
        if (!rows.values?.length) continue;
        for (const row of rows.values) {
          const cols         = Object.keys(row);
          const vals         = Object.values(row);
          const placeholders = cols.map(() => '?').join(',');
          try {
            await newDb.run(
              `INSERT OR IGNORE INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`,
              vals as any[]
            );
          } catch {}
        }
      } catch {}
    }
  } finally {
    try { if (oldDb) await conn.closeConnection(DB_PLAIN, false); }     catch {}
    try { if (newDb) await conn.closeConnection(DB_ENCRYPTED, false); } catch {}
  }
}

async function _initWeb(): Promise<void> {
  sqliteConn = new SQLiteConnection(CapacitorSQLite);
  try {
    await customElements.whenDefined('jeep-sqlite');
    const jeepEl = document.querySelector('jeep-sqlite');
    if (jeepEl) await sqliteConn.initWebStore();
  } catch {
    console.warn('[DB] Web: jeep-sqlite no disponible');
  }
  const isConn = (await sqliteConn.isConnection(DB_PLAIN, false)).result;
  if (isConn) {
    db = await sqliteConn.retrieveConnection(DB_PLAIN, false);
  } else {
    db = await sqliteConn.createConnection(DB_PLAIN, false, 'no-encryption', DB_VERSION, false);
  }
  await db.open();
}

async function _runMigrations(): Promise<void> {
  if (!db) throw new Error('[DB] Sin conexión activa');
  for (const sql of CREATE_TABLES) {
    await db.execute(sql);
  }
}

// ── API pública ───────────────────────────────────────────────────

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  await _ensureReady();
  try {
    const r = await db!.query(sql, params);
    return r.values ?? [];
  } catch (err) {
    console.error('[DB] query error:', sql, err);
    throw err;
  }
}

export async function run(
  sql: string,
  params: any[] = []
): Promise<{ changes: number; lastId?: number }> {
  await _ensureReady();
  try {
    const r = await db!.run(sql, params);
    return { changes: r.changes?.changes ?? 0, lastId: r.changes?.lastId };
  } catch (err) {
    console.error('[DB] run error:', sql, err);
    throw err;
  }
}

export async function transaction(
  statements: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  await _ensureReady();
  try {
    await db!.beginTransaction();
    for (const { sql, params = [] } of statements) {
      await db!.run(sql, params);
    }
    await db!.commitTransaction();
  } catch (err) {
    try { await db!.rollbackTransaction(); } catch {}
    throw err;
  }
}

export async function executeBatch(
  statements: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  await _ensureReady();
  try {
    const set = statements.map(s => ({ statement: s.sql, values: s.params ?? [] }));
    await db!.executeSet(set);
  } catch (err) {
    console.error('[DB] executeBatch error:', err);
    throw err;
  }
}

export function isDatabaseReady(): boolean { return isInitialized; }

export async function closeDatabase(): Promise<void> {
  if (!isInitialized || !sqliteConn) return;
  const name = Capacitor.getPlatform() === 'web' ? DB_PLAIN : DB_ENCRYPTED;
  try { await sqliteConn.closeConnection(name, false); } catch {}
  db            = null;
  isInitialized = false;
  initPromise   = null;
}

async function _ensureReady(): Promise<void> {
  if (!isInitialized) await initDatabase();
  if (!db) throw new Error('[DB] Base de datos no disponible');
}
