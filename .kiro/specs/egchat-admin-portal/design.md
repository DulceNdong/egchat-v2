# EGCHAT Admin Portal — Technical Design

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    EGCHAT ADMIN PORTAL                          │
│                  admin.egchat.gq (Vercel)                       │
├─────────────────────────────────────────────────────────────────┤
│  React SPA  │  Vite  │  TailwindCSS  │  Recharts  │  Zustand   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS + JWT
┌──────────────────────────▼──────────────────────────────────────┐
│                  ADMIN API (Render - Node.js)                    │
│  Express + JWT auth + RBAC middleware + Rate limiting            │
│  /api/admin/* — separado del API principal de EGCHAT             │
└───┬──────────────────────┬───────────────────────┬──────────────┘
    │                      │                       │
    ▼                      ▼                       ▼
Supabase DB          Redis Cache            SSE Stream
(datos reales)       (métricas TTL)         (tiempo real)
```

---

## Stack Tecnológico

### Frontend Admin
- **Framework**: React 19 + Vite
- **Estilos**: TailwindCSS v4
- **Gráficas**: Recharts
- **Estado**: Zustand (store por módulo)
- **Auth**: JWT en httpOnly cookie
- **Tiempo real**: EventSource (SSE)
- **Deploy**: Vercel (subdominio admin.egchat.gq)

### Backend Admin API
- **Runtime**: Node.js + Express (mismo Render, nueva ruta /api/admin)
- **Auth**: JWT + TOTP (2FA con speakeasy)
- **RBAC**: middleware por ruta
- **Cache**: Redis (Upstash free tier)
- **Rate limiting**: express-rate-limit

### Base de Datos
- **Principal**: Supabase (ya existente)
- **Tablas nuevas**: admin_users, admin_roles, admin_audit_log, admin_sessions, admin_alerts
- **Views**: métricas pre-agregadas (materialized views)

---

## Modelo de Datos

### Tabla: admin_users
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,           -- 2FA secret
  role TEXT NOT NULL CHECK (role IN (
    'super_admin','operations','support','finance','security','auditor'
  )),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  failed_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: admin_sessions
```sql
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,   -- hash del JWT (no el token)
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabla: admin_audit_log (append-only)
```sql
CREATE TABLE admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,       -- 'user.block', 'role.change', 'export.wallet'
  resource_type TEXT,         -- 'user', 'transaction', 'chat'
  resource_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  result TEXT CHECK (result IN ('success','failure')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: INSERT only, no UPDATE, no DELETE
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON admin_audit_log FOR INSERT WITH CHECK (true);
```

### Tabla: admin_alerts
```sql
CREATE TABLE admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT CHECK (severity IN ('critical','warning','info')),
  module TEXT,                -- 'security','wallet','infra'
  title TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES admin_users(id),
  resolved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Views de Métricas

```sql
-- Usuarios activos últimas 24h
CREATE VIEW v_active_users_24h AS
SELECT 
  COUNT(DISTINCT user_id) as count,
  DATE_TRUNC('hour', created_at) as hour
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour ORDER BY hour;

-- Volumen wallet hoy
CREATE VIEW v_wallet_volume_today AS
SELECT
  COUNT(*) as tx_count,
  SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as volume_xaf,
  COUNT(CASE WHEN status='failed' THEN 1 END) as failed_count,
  ROUND(COUNT(CASE WHEN status='completed' THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(*),0) * 100, 2) as success_rate
FROM transactions
WHERE created_at > DATE_TRUNC('day', NOW());

-- Seguridad: logins fallidos última hora
CREATE VIEW v_failed_logins_1h AS
SELECT
  ip_address,
  COUNT(*) as attempts,
  MAX(created_at) as last_attempt
FROM admin_audit_log
WHERE action='auth.login_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY attempts DESC;
```

---

## Estructura de Carpetas

```
egchat-admin/                 ← Proyecto separado
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx   ← Navegación por rol
│   │   │   ├── Header.tsx    ← Usuario activo + logout
│   │   │   └── AlertBanner.tsx
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── MetricCard.tsx
│   │   └── common/
│   │       ├── DataTable.tsx
│   │       ├── ExportButton.tsx
│   │       └── StatusBadge.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard/
│   │   │   ├── Operational.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── Wallet.tsx
│   │   │   ├── Security.tsx
│   │   │   ├── Infrastructure.tsx
│   │   │   ├── SQLiteSync.tsx
│   │   │   └── Audit.tsx
│   │   └── Admin/
│   │       └── UserManagement.tsx
│   ├── stores/
│   │   ├── authStore.ts      ← JWT + rol + 2FA state
│   │   ├── alertsStore.ts    ← Alertas en tiempo real
│   │   └── metricsStore.ts   ← Cache de métricas
│   ├── hooks/
│   │   ├── useSSE.ts         ← EventSource wrapper
│   │   ├── useMetrics.ts     ← Polling + SSE métricas
│   │   └── usePermission.ts  ← Check RBAC en componentes
│   ├── api/
│   │   └── adminClient.ts    ← Fetch wrapper con JWT
│   └── utils/
│       ├── rbac.ts           ← Permisos por rol
│       └── formatters.ts     ← XAF, fechas, bytes
├── package.json
└── vite.config.ts
```

---

## API Endpoints Admin

### Autenticación
```
POST /api/admin/auth/login          → { token, requireTotp }
POST /api/admin/auth/totp/verify    → { token }
POST /api/admin/auth/logout
GET  /api/admin/auth/me             → { admin, role, permissions }
```

### Métricas (SSE para tiempo real)
```
GET  /api/admin/stream              → SSE stream de eventos
GET  /api/admin/metrics/operational → KPIs generales
GET  /api/admin/metrics/chat        → Métricas chat
GET  /api/admin/metrics/wallet      → Métricas financieras
GET  /api/admin/metrics/security    → Alertas seguridad
GET  /api/admin/metrics/infra       → Estado servicios
GET  /api/admin/metrics/sqlite-sync → Estado sync
```

### Acciones
```
POST /api/admin/security/block-ip   → { ip, duration, reason }
POST /api/admin/security/block-user → { userId, reason }
GET  /api/admin/audit/log           → { page, filters }
GET  /api/admin/audit/export        → CSV/JSON/PDF
POST /api/admin/users               → Crear admin user
PUT  /api/admin/users/:id/role      → Cambiar rol
DELETE /api/admin/users/:id         → Desactivar (soft delete)
```

---

## RBAC Middleware

```typescript
// middleware/rbac.ts
const PERMISSIONS: Record<string, Record<string, string[]>> = {
  super_admin: { '*': ['read','write','delete'] },
  operations:  { 
    operational: ['read','write'], chat: ['read','write'],
    infrastructure: ['read','write'], sqlite_sync: ['read','write'],
    wallet: ['read'], security: ['read'], audit: ['read']
  },
  support:     { chat: ['read','write'], operational: ['read'] },
  finance:     { wallet: ['read','write'], audit: ['read'] },
  security:    { security: ['read','write'], audit: ['read','write'] },
  auditor:     { '*': ['read'] },
};

export const requirePermission = (module: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.admin;
    const perms = PERMISSIONS[role];
    const allowed = perms?.['*']?.includes(action) || 
                    perms?.[module]?.includes(action);
    if (!allowed) {
      auditLog(req, `access.denied.${module}`, 'failure');
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    next();
  };
};
```

---

## SSE (Server-Sent Events) — Tiempo Real

```typescript
// routes/stream.ts
app.get('/api/admin/stream', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendMetrics = async () => {
    const metrics = await getAggregatedMetrics();
    res.write(`data: ${JSON.stringify({ type: 'metrics', ...metrics })}\n\n`);
  };

  const interval = setInterval(sendMetrics, 30_000);
  sendMetrics(); // enviar inmediatamente

  // Suscribir a alertas en tiempo real
  alertEmitter.on('alert', (alert) => {
    res.write(`data: ${JSON.stringify({ type: 'alert', ...alert })}\n\n`);
  });

  req.on('close', () => clearInterval(interval));
});
```

---

## Plan de Implementación (Tasks)

### Sprint 1 — Base (1 semana)
1. Crear proyecto `egchat-admin` separado con Vite + React + Tailwind
2. Crear tablas en Supabase: admin_users, admin_sessions, admin_audit_log
3. Implementar auth: login + 2FA + JWT + logout
4. Implementar RBAC middleware
5. Crear layout con sidebar dinámico por rol
6. Deploy en Vercel como subdominio

### Sprint 2 — Dashboards Core (1 semana)
7. Dashboard Operacional con métricas reales
8. Dashboard Chat
9. Dashboard Wallet
10. SSE stream para actualizaciones en tiempo real

### Sprint 3 — Seguridad y Auditoría (3 días)
11. Dashboard Seguridad con bloqueo de IPs/usuarios
12. Dashboard Auditoría con export
13. Sistema de alertas

### Sprint 4 — Infraestructura y SQLite (3 días)
14. Dashboard Infraestructura (ping a servicios externos)
15. Dashboard Sincronización SQLite
16. Gestión de usuarios admin

---

## Escalabilidad — Decisiones de Arquitectura

### 100 → 10.000 usuarios
- Añadir `EXPLAIN ANALYZE` a queries lentas → indexes
- Redis (Upstash) para cachear métricas agregadas 30s TTL
- Paginación cursor-based en audit log

### 10.000 → 100.000 usuarios
- Supabase read replica para queries del admin portal
- Materialized views que se refrescan cada 5 minutos
- CDN para assets del portal

### 100.000 → 1.000.000 usuarios
- Separar admin API en microservicio independiente
- ClickHouse para analytics (queries de millones de filas en <1s)
- Kafka para stream de eventos de auditoría
- Horizontal scaling del admin API
