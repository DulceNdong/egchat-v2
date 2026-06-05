# EGCHAT Admin Portal — Implementation Tasks

## Sprint 1 — Fundación

- [ ] 1. Crear proyecto `egchat-admin` con Vite + React + TailwindCSS + TypeScript
  - Estructura de carpetas según design.md
  - Configurar Vite con proxy a admin API
  - Configurar alias de paths (@components, @pages, @stores)

- [ ] 2. Crear tablas en Supabase
  - admin_users (con RBAC roles)
  - admin_sessions
  - admin_audit_log (append-only con RLS)
  - admin_alerts
  - Views de métricas (v_active_users_24h, v_wallet_volume_today)

- [ ] 3. Implementar autenticación en backend
  - POST /api/admin/auth/login con bcrypt
  - POST /api/admin/auth/totp/verify con speakeasy
  - Middleware JWT para rutas protegidas
  - Función auditLog() para registrar todas las acciones

- [ ] 4. Implementar RBAC middleware
  - Tabla de permisos por rol (ver design.md)
  - requirePermission(module, action) middleware
  - Respuesta 403 con log de auditoría en acceso denegado

- [ ] 5. Crear Login page con 2FA
  - Formulario email + password
  - Segunda pantalla TOTP si rol lo requiere
  - Manejo de cuenta bloqueada por intentos fallidos

- [ ] 6. Crear Layout principal con sidebar
  - Sidebar dinámico según rol (solo módulos permitidos)
  - Header con usuario activo + notificación de alertas + logout
  - AlertBanner para alertas críticas en tiempo real

- [ ] 7. Deploy en Vercel como subdominio admin.egchat.gq
  - Configurar dominio en Vercel
  - Variables de entorno: VITE_ADMIN_API_URL

## Sprint 2 — Dashboards Core

- [ ] 8. Dashboard Operacional
  - MetricCards: usuarios activos, nuevos registros, sesiones
  - Gráfica LineChart: tendencia 7/30/90 días
  - StatusBadge de servicios (API, DB, CDN, Push)
  - Auto-refresh cada 30s

- [ ] 9. Dashboard Chat
  - Métricas: mensajes/min, chats activos, llamadas VoIP
  - Distribución: privados vs grupales, audio vs video
  - Tabla de chats reportados con búsqueda
  - Latencia P50/P95/P99

- [ ] 10. Dashboard Wallet
  - KPIs: volumen XAF, tx completadas, tx fallidas, tasa éxito
  - BarChart: volumen por día últimos 30 días
  - Tabla transacciones sospechosas con alertas
  - ExportButton CSV/PDF con filtros de fecha

- [ ] 11. SSE stream para tiempo real
  - GET /api/admin/stream endpoint
  - useSSE() hook en frontend
  - alertsStore con Zustand para alertas en tiempo real
  - Reconexión automática si se corta el stream

## Sprint 3 — Seguridad y Auditoría

- [ ] 12. Dashboard Seguridad
  - Lista logins fallidos/hora con IPs
  - Mapa calor actividad geográfica (opcional: simple tabla por país)
  - Formulario bloqueo IP/usuario con duración y motivo
  - Alerta automática si >10 intentos desde misma IP en 5min

- [ ] 13. Dashboard Auditoría
  - DataTable con paginación cursor-based
  - Filtros: admin, fecha, acción, recurso
  - ExportButton con firma digital (hash SHA-256 del contenido)
  - Visualización de old_value vs new_value en diff

- [ ] 14. Sistema de alertas
  - AlertBanner en header para alertas críticas
  - Panel de alertas con opción resolver
  - Notificación email al Super Admin para acciones críticas

## Sprint 4 — Infraestructura, SQLite y Gestión

- [ ] 15. Dashboard Infraestructura
  - Ping periódico a: Render /health, Supabase /rest/v1/, Vercel
  - Métricas simuladas (CPU%, RAM%) vía /api/admin/metrics/infra
  - Historial de incidentes con MTTR calculado
  - Stream de logs en tiempo real (últimas 100 líneas)

- [ ] 16. Dashboard Sincronización SQLite
  - Consulta a tabla de sync_status (si existe) o crear
  - Lista dispositivos con pendientes/conflictos
  - Panel resolución de conflictos: local vs server
  - Estadísticas: % usuarios offline, tamaño datos locales

- [ ] 17. Gestión de Usuarios Admin (solo Super Admin)
  - Tabla de admins activos con rol y último login
  - Formulario crear admin con asignación de rol
  - Botón cambiar rol (con confirmación + auditoría)
  - Botón desactivar (soft delete, no eliminar)
  - Setup 2FA con QR code para nuevo admin

## Llamar a kluster_code_review_auto al finalizar cada sprint
