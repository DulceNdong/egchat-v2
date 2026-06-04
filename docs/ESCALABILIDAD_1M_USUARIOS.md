# 📈 Plan de Escalabilidad — 1 Millón de Usuarios

## Arquitectura Actual (hasta ~10K usuarios)

```
Usuario → Vercel (web) → Render (backend) → Supabase (DB)
               ↓
         Capacitor App (iOS/Android)
```

**Limitaciones actuales:**
- Render free tier duerme tras 15min → keep-alive cada 14min
- Supabase free: 500MB DB, 2GB storage, 50K MAU
- Sin CDN para archivos estáticos

---

## Escalabilidad por Fases

### Fase A: 10K → 100K usuarios

**Cambios necesarios:**

| Componente | Cambio | Costo estimado |
|---|---|---|
| Render | Upgrade a Starter ($7/mes) | Bajo |
| Supabase | Pro plan ($25/mes) | Bajo |
| Archivos | Supabase Storage → Cloudflare R2 | Muy bajo |
| CDN | Cloudflare Free → Pro | Bajo |
| Monitoring | Añadir Sentry Basic | ~$26/mes |

**Cambios en código:**
```typescript
// Eliminar keep-alive (ya no hace falta con plan pago)
// setInterval(keepAlive, 14 * 60 * 1000) → ELIMINAR

// Añadir CDN prefix para archivos
const CDN_BASE = 'https://cdn.egchat.app';
const fileUrl = `${CDN_BASE}/avatars/${userId}.webp`;
```

---

### Fase B: 100K → 500K usuarios

**Infraestructura:**
```
                    ┌─── Cloudflare CDN ───┐
Usuario ──────────► │   Static Assets      │
                    └──────────────────────┘
                              ↓
                    ┌─── Load Balancer ────┐
                    │   (Railway/Fly.io)   │
                    └──────┬───────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         API Server   API Server   API Server
              └────────────┼────────────┘
                           │
              ┌────────────▼────────────┐
              │    Supabase (Primary)   │
              │    + Read Replica       │
              └─────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Redis (Upstash)       │
              │   - Session cache       │
              │   - Rate limiting       │
              │   - Online status       │
              └─────────────────────────┘
```

**Cambios en código:**
```typescript
// WebSocket en lugar de polling
const ws = new WebSocket('wss://api.egchat.app/ws');
ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  if (type === 'new_message') SyncManager.handleIncomingMessage(data);
  if (type === 'chat_updated') SyncManager.handleChatUpdate(data);
};

// Redis para presence (usuarios online)
// Mover lógica de polling al WebSocket
```

---

### Fase C: 500K → 1M+ usuarios

**Kubernetes + Multi-región:**
```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: egchat-api
spec:
  replicas: 10          # Autoescala 3-20 según carga
  selector:
    matchLabels:
      app: egchat-api
```

**Sharding de mensajes:**
```sql
-- Particionar mensajes por fecha
CREATE TABLE messages_2026_01 PARTITION OF messages
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Índice por shard para evitar full scans
CREATE INDEX idx_msg_shard ON messages(conversation_id, created_at)
  WHERE created_at >= '2026-01-01';
```

**Message Queue para operaciones asíncronas:**
```
Pago → API → RabbitMQ → Worker → Supabase → Notificación Push
              (no bloquea la respuesta HTTP)
```

---

## Tabla de Escalabilidad SQLite Local

SQLite local **no es un cuello de botella** — escala infinitamente porque:
- Cada usuario tiene su propia base de datos local
- Sin conexiones compartidas
- Rendimiento típico: 100K operaciones/segundo

| Mensajes en SQLite | Tiempo de carga | Memoria |
|---|---|---|
| 1,000 | ~5ms | ~2MB |
| 10,000 | ~20ms | ~15MB |
| 100,000 | ~80ms | ~120MB |
| 1,000,000 | ~400ms (con paginación: ~20ms) | Variable |

**Recomendación:** Mantener paginación de 50 mensajes por página.

---

## KPIs de Monitoreo a 1M usuarios

| Métrica | Target |
|---|---|
| Tiempo de respuesta API p95 | < 200ms |
| Error rate | < 0.1% |
| Uptime | 99.9% (8h downtime/año) |
| Sync success rate | > 99.5% |
| Push delivery rate | > 95% |
| Arranque app | < 2s |
| SQLite read latency | < 50ms |

---

## Estimación de Costos a 1M MAU

| Servicio | Costo mensual estimado |
|---|---|
| Backend (Kubernetes, 3 zonas) | ~$500 |
| Supabase Team | ~$599 |
| Redis (Upstash) | ~$100 |
| Cloudflare CDN | ~$200 |
| Storage (Cloudflare R2) | ~$150 |
| Monitoring (Datadog) | ~$300 |
| **Total** | **~$1,850/mes** |

Equivale a **$0.0019 por usuario activo** mensual.
