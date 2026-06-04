# 🏗️ Arquitectura Offline-First — EGCHAT

**Versión:** 3.0 (Offline-First)  
**Fecha:** 4 Junio 2026

---

## Visión General

EGCHAT usa una arquitectura **Offline-First** de tres capas:

```
┌─────────────────────────────────────────────────────┐
│                     UI (React)                       │
│    Lee de SQLite → muestra inmediato → actualiza     │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
      ┌────────▼────────┐   ┌─────────▼────────┐
      │   SQLite Local  │   │   SyncManager    │
      │  (fuente local) │   │  (background)    │
      └────────┬────────┘   └─────────┬────────┘
               │                      │
               └──────────┬───────────┘
                          │
               ┌──────────▼──────────┐
               │  Backend (Render)   │
               │  + Supabase (DB)    │
               └─────────────────────┘
```

## Principio Fundamental

```
1. LEER de SQLite → mostrar en <50ms
2. SINCRONIZAR con servidor en background
3. ACTUALIZAR UI cuando llegan datos nuevos
4. ENCOLAR operaciones si no hay red
5. ENVIAR cola cuando se restaura la conexión
```

---

## Módulos Implementados

### `src/db/`
| Archivo | Responsabilidad |
|---|---|
| `schema.ts` | DDL de todas las tablas SQLite |
| `database.ts` | Motor SQLite (Singleton, nativo/web) |
| `repositories/ConversationRepository.ts` | CRUD conversaciones |
| `repositories/MessageRepository.ts` | CRUD mensajes + paginación |
| `repositories/WalletRepository.ts` | CRUD wallet + transacciones |
| `repositories/ContactRepository.ts` | CRUD contactos + búsqueda |
| `repositories/UserRepository.ts` | CRUD perfiles de usuario |
| `repositories/SettingsRepository.ts` | Key-value settings |
| `repositories/SyncQueueRepository.ts` | Cola persistente offline |

### `src/sync/`
| Archivo | Responsabilidad |
|---|---|
| `SyncManager.ts` | Orquestador principal de sincronización |
| `useSync.ts` | Hook React para estado de sync |
| `SyncIndicator.tsx` | Barra visual de estado (offline/syncing) |

### `src/hooks/`
| Archivo | Responsabilidad |
|---|---|
| `useMessages.ts` | Mensajes Offline-First con paginación |
| `useWalletOffline.ts` | Wallet con bloqueo offline de transacciones |
| `useVirtualList.ts` | Virtualización de listas (rendimiento) |

### `src/cache/`
| Archivo | Responsabilidad |
|---|---|
| `FileCache.ts` | Caché de imágenes, avatares y archivos |

### `src/security/`
| Archivo | Responsabilidad |
|---|---|
| `SecureStorage.ts` | Keychain (iOS) / EncryptedSharedPreferences (Android) |

### `src/ota/`
| Archivo | Responsabilidad |
|---|---|
| `OTAUpdater.ts` | Actualizaciones sin recompilar IPA/APK (Capgo) |

### `src/monitor/`
| Archivo | Responsabilidad |
|---|---|
| `AppMonitor.ts` | Métricas de arranque, syncs, errores, API |

### `src/AppInit.ts`
Secuencia de arranque: Monitor → SQLite → SyncManager → FileCache → OTA
