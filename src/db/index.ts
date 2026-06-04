/**
 * src/db/index.ts
 * Punto de entrada único para toda la capa de persistencia SQLite.
 * Importar desde aquí en el resto de la app.
 */

export { initDatabase, closeDatabase, isDatabaseReady, query, run, transaction, executeBatch } from './database';
export { ConversationRepository } from './repositories/ConversationRepository';
export { MessageRepository }      from './repositories/MessageRepository';
export { WalletRepository }       from './repositories/WalletRepository';
export { ContactRepository }      from './repositories/ContactRepository';
export { UserRepository }         from './repositories/UserRepository';
export { SettingsRepository }     from './repositories/SettingsRepository';
export { SyncQueueRepository }    from './repositories/SyncQueueRepository';

export type { Conversation }      from './repositories/ConversationRepository';
export type { Message }           from './repositories/MessageRepository';
export type { WalletBalance, WalletTransaction } from './repositories/WalletRepository';
export type { Contact }           from './repositories/ContactRepository';
export type { User }              from './repositories/UserRepository';
export type { SyncQueueItem, SyncAction, EntityType } from './repositories/SyncQueueRepository';
