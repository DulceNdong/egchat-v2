/**
 * schema.ts
 * Esquema completo SQLite para EGCHAT Offline-First.
 * Tablas: users, contacts, conversations, messages,
 *         wallet_balance, wallet_transactions,
 *         notifications, settings, file_cache, sync_queue
 */

export const DB_NAME    = 'egchat_offline_v1';
export const DB_VERSION = 1;

// Sentencias de creación de tablas (orden: sin FK primero)
export const CREATE_TABLES: string[] = [

  // ── USUARIOS ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    phone        TEXT UNIQUE NOT NULL,
    full_name    TEXT,
    avatar_url   TEXT,
    email        TEXT,
    bio          TEXT,
    region       TEXT,
    created_at   INTEGER,
    updated_at   INTEGER,
    synced       INTEGER NOT NULL DEFAULT 0
  )`,

  // ── CONTACTOS ─────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS contacts (
    id                TEXT PRIMARY KEY,
    user_id           TEXT NOT NULL,
    contact_user_id   TEXT NOT NULL,
    nickname          TEXT,
    blocked           INTEGER NOT NULL DEFAULT 0,
    favorite          INTEGER NOT NULL DEFAULT 0,
    created_at        INTEGER,
    updated_at        INTEGER,
    synced            INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_contacts_fav  ON contacts(user_id, favorite)`,

  // ── CONVERSACIONES ────────────────────────────────
  `CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY,
    type            TEXT NOT NULL DEFAULT 'individual',
    title           TEXT,
    avatar_url      TEXT,
    last_message    TEXT,
    last_message_at INTEGER,
    unread_count    INTEGER NOT NULL DEFAULT 0,
    archived        INTEGER NOT NULL DEFAULT 0,
    favorite        INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER,
    updated_at      INTEGER,
    synced          INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_conv_updated ON conversations(last_message_at DESC)`,

  // ── PARTICIPANTES ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS conversation_participants (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member',
    joined_at       INTEGER,
    UNIQUE(conversation_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_part_conv ON conversation_participants(conversation_id)`,

  // ── MENSAJES ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    server_id       TEXT,
    conversation_id TEXT NOT NULL,
    sender_id       TEXT NOT NULL,
    text            TEXT,
    type            TEXT NOT NULL DEFAULT 'text',
    file_url        TEXT,
    file_name       TEXT,
    file_size       INTEGER,
    thumbnail_url   TEXT,
    image_url       TEXT,
    audio_url       TEXT,
    video_url       TEXT,
    call_type       TEXT,
    call_status     TEXT,
    call_duration   INTEGER,
    reply_to        TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      INTEGER NOT NULL,
    synced          INTEGER NOT NULL DEFAULT 0,
    retries         INTEGER NOT NULL DEFAULT 0,
    deleted_for_me  INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_msg_conv   ON messages(conversation_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_msg_synced ON messages(synced, status)`,
  `CREATE INDEX IF NOT EXISTS idx_msg_server ON messages(server_id)`,

  // ── WALLET BALANCE ────────────────────────────────
  `CREATE TABLE IF NOT EXISTS wallet_balance (
    user_id      TEXT PRIMARY KEY,
    balance      REAL NOT NULL DEFAULT 0,
    currency     TEXT NOT NULL DEFAULT 'XAF',
    last_updated INTEGER,
    synced       INTEGER NOT NULL DEFAULT 0
  )`,

  // ── WALLET TRANSACTIONS ───────────────────────────
  `CREATE TABLE IF NOT EXISTS wallet_transactions (
    id            TEXT PRIMARY KEY,
    server_id     TEXT,
    user_id       TEXT NOT NULL,
    type          TEXT NOT NULL,
    amount        REAL NOT NULL,
    balance_after REAL,
    description   TEXT,
    reference     TEXT,
    status        TEXT NOT NULL DEFAULT 'pending',
    method        TEXT,
    destination   TEXT,
    created_at    INTEGER NOT NULL,
    synced        INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id, created_at DESC)`,

  // ── NOTIFICACIONES ────────────────────────────────
  `CREATE TABLE IF NOT EXISTS notifications (
    id         TEXT PRIMARY KEY,
    server_id  TEXT,
    user_id    TEXT NOT NULL,
    type       TEXT NOT NULL,
    title      TEXT,
    body       TEXT,
    data       TEXT,
    read       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    synced     INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read, created_at DESC)`,

  // ── CONFIGURACIÓN ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at INTEGER
  )`,

  // ── CACHÉ DE ARCHIVOS ─────────────────────────────
  `CREATE TABLE IF NOT EXISTS file_cache (
    url           TEXT PRIMARY KEY,
    local_path    TEXT NOT NULL,
    size          INTEGER,
    mime_type     TEXT,
    downloaded_at INTEGER,
    last_accessed INTEGER,
    access_count  INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS idx_file_accessed ON file_cache(last_accessed)`,

  // ── COLA DE SINCRONIZACIÓN ────────────────────────
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id           TEXT PRIMARY KEY,
    entity_type  TEXT NOT NULL,
    entity_id    TEXT NOT NULL,
    action       TEXT NOT NULL,
    payload      TEXT,
    priority     INTEGER NOT NULL DEFAULT 0,
    retries      INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    last_attempt INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sync_priority ON sync_queue(priority DESC, created_at)`,
];
