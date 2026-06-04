# 🔄 Flujo de Sincronización — EGCHAT Offline-First

## 1. Arranque de la App

```
main.tsx
  └── initApp()
        ├── AppMonitor.init()         ← captura errores globales
        ├── initDatabase()            ← abre SQLite
        ├── initSyncManager()         ← registra listeners online/offline
        ├── FileCache.prune()         ← limpia archivos viejos (background)
        └── OTAUpdater.checkAndDownload() ← busca actualizaciones (background)
```

## 2. Usuario Abre la App (Con Red)

```
SyncManager.initSyncManager()
  └── setTimeout(fullSync, 3000)
        ├── syncConversations()  → GET /api/chats
        │     └── ConversationRepository.upsertBatch()
        ├── syncWallet(userId)   → GET /api/wallet/balance + transactions
        │     └── WalletRepository.saveBalance() + upsertBatch()
        ├── syncContacts(userId) → GET /api/contacts
        │     └── ContactRepository.upsertBatch()
        └── flushQueue()         → envía mensajes pendientes
```

## 3. Usuario Abre la App (Sin Red)

```
SyncManager detecta offline
  └── setState({ isOnline: false })
        └── SyncIndicator muestra "Sin conexión — Modo offline"

UI (useMessages, useWalletOffline)
  └── MessageRepository.getByConversation()  ← datos locales inmediatos
  └── WalletRepository.getBalance()          ← último saldo sincronizado
  └── ConversationRepository.getAll()        ← todos los chats locales
```

## 4. Envío de Mensaje Offline

```
Usuario escribe y envía mensaje
  └── useMessages.sendOffline(msg)
        ├── setMessages(prev => [...prev, msg])  ← optimistic update (instant)
        └── enqueuePendingMessage(msg)
              ├── MessageRepository.upsert({ status: 'pending', synced: 0 })
              └── Si online: flushQueue() en 500ms

flushQueue()
  └── MessageRepository.getPending()
        └── Para cada mensaje:
              ├── POST /api/chats/{id}/messages
              ├── Si OK: MessageRepository.markSynced(localId, serverId)
              └── Si error: MessageRepository.updateStatus('pending', retries++)
                    └── Backoff: 5s → 15s → 30s → 60s → 120s
```

## 5. Reconexión

```
window.addEventListener('online')
  └── handleOnline()
        ├── setState({ isOnline: true })
        ├── window.dispatchEvent('egchat-online')
        └── setTimeout(fullSync, 1500)  ← espera 1.5s para que la red se estabilice
```

## 6. Polling de Chats (Segundo plano)

```
setInterval(30s)
  └── Si online && !isSyncing:
        └── syncConversations()  ← solo chats, ligero
```

## 7. Resolución de Conflictos

**Estrategia:** Last-Write-Wins por `updated_at`

```sql
ON CONFLICT(id) DO UPDATE SET
  status = CASE
    WHEN messages.status = 'pending' THEN excluded.status
    ELSE messages.status
  END,
  synced = excluded.synced,
  server_id = COALESCE(excluded.server_id, messages.server_id)
```

Regla: los mensajes locales en estado `pending` NO se sobreescriben por el servidor.
Los mensajes ya confirmados (`synced=1`) se actualizan con el estado del servidor.

---

## Eventos Globales del Sistema

| Evento | Disparado por | Consumido por |
|---|---|---|
| `egchat-online` | SyncManager | UI components |
| `egchat-offline` | SyncManager | UI components |
| `egchat:conversations-updated` | SyncManager | App.tsx (loadChats) |
| `egchat:messages-updated` | SyncManager | useMessages |
| `egchat:wallet-updated` | SyncManager | useWalletOffline |
| `egchat:contacts-updated` | SyncManager | App.tsx (contacts) |
| `egchat:ota-update-ready` | OTAUpdater | UpdateBanner |
