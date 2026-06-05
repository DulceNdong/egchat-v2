# EGCHAT Admin Portal — Requirements

## Overview

Portal administrativo centralizado para monitoreo, operaciones y auditoría de la super app EGCHAT (Guinea Ecuatorial). Accesible en `admin.egchat.gq`.

---

## 1. Control de Acceso por Roles (RBAC)

### Roles y Permisos

| Módulo | Super Admin | Operaciones | Soporte | Finanzas | Seguridad | Auditor |
|--------|:-----------:|:-----------:|:-------:|:--------:|:---------:|:-------:|
| Operacional | ✅ RW | ✅ RW | ✅ R | ❌ | ✅ R | ✅ R |
| Chat | ✅ RW | ✅ RW | ✅ RW | ❌ | ✅ R | ✅ R |
| Wallet | ✅ RW | ✅ R | ❌ | ✅ RW | ✅ R | ✅ R |
| Seguridad | ✅ RW | ✅ R | ❌ | ❌ | ✅ RW | ✅ R |
| Infraestructura | ✅ RW | ✅ RW | ✅ R | ❌ | ✅ R | ✅ R |
| SQLite Sync | ✅ RW | ✅ RW | ✅ R | ❌ | ✅ R | ✅ R |
| Auditoría | ✅ RW | ✅ R | ❌ | ✅ R | ✅ RW | ✅ R |
| Gestión Admins | ✅ RW | ❌ | ❌ | ❌ | ❌ | ❌ |

**R** = Solo lectura | **RW** = Lectura y escritura

### User Stories — Autenticación y Roles

**REQ-AUTH-1**: Como administrador, quiero iniciar sesión con email + contraseña + 2FA (TOTP) para acceder al portal de forma segura.
- Criterio: Login fallido bloquea la cuenta tras 5 intentos en 10 minutos
- Criterio: 2FA es obligatorio para Super Admin y Seguridad
- Criterio: Sesión expira tras 8 horas de inactividad

**REQ-AUTH-2**: Como Super Admin, quiero crear/editar/desactivar cuentas de admin con roles específicos.
- Criterio: No se puede eliminar la última cuenta Super Admin
- Criterio: Cambio de rol genera entrada en log de auditoría

**REQ-AUTH-3**: Como usuario del portal, quiero ver solo los módulos que corresponden a mi rol.
- Criterio: Intento de acceso a módulo no autorizado devuelve 403 y genera alerta de seguridad

---

## 2. Dashboard Operacional

**REQ-OPS-1**: Como Operaciones, quiero ver métricas globales en tiempo real.
- KPIs: usuarios activos (1min/5min/1h), nuevos registros (hoy/7d/30d), sesiones activas
- Criterio: Datos se refrescan automáticamente cada 30 segundos
- Criterio: Alerta visual si usuarios activos cae >20% en 5 minutos

**REQ-OPS-2**: Como Operaciones, quiero ver el estado de salud de todos los servicios.
- Servicios: API Render, Supabase DB, Vercel CDN, Servicio Push
- Criterio: Estado: ✅ OK | ⚠️ Degradado | ❌ Caído
- Criterio: Notificación push si algún servicio cae

**REQ-OPS-3**: Como Operaciones, quiero ver gráficas de tendencia de los últimos 7/30/90 días.
- Métricas: DAU, MAU, retención, churn rate

---

## 3. Dashboard Chat

**REQ-CHAT-1**: Como Soporte, quiero monitorear el volumen de mensajes en tiempo real.
- Métricas: mensajes/minuto, mensajes/hora, pico del día
- Chats privados vs grupales
- Criterio: Alerta si mensajes/minuto cae a 0 durante horario pico (8h-22h)

**REQ-CHAT-2**: Como Soporte, quiero ver el estado de las llamadas VoIP activas.
- Métricas: llamadas activas, duración promedio, tasa de error de conexión WebRTC
- Distribución: audio vs video, exitosas vs fallidas
- Criterio: Llamadas con duración >2h se marcan como anomalía

**REQ-CHAT-3**: Como Soporte, quiero buscar y ver chats reportados.
- Filtros: por usuario, fecha, tipo de reporte
- Criterio: Búsqueda devuelve resultados en <2 segundos

**REQ-CHAT-4**: Como Soporte, quiero ver métricas de latencia de mensajes.
- P50, P95, P99 de latencia de entrega
- Criterio: Alerta si P95 supera 3 segundos

---

## 4. Dashboard Wallet

**REQ-WALLET-1**: Como Finanzas, quiero ver el volumen de transacciones en tiempo real.
- Métricas: XAF enviados hoy, transacciones completadas, transacciones fallidas
- Tasa de éxito, monto promedio por transacción
- Criterio: Alerta si tasa de fallo supera el 5%

**REQ-WALLET-2**: Como Finanzas, quiero ver el balance agregado del sistema.
- Total en circulación, fondos en custodia, reservas
- Criterio: Balance cuadra con suma de wallets individuales (validación diaria)

**REQ-WALLET-3**: Como Finanzas, quiero detectar transacciones sospechosas.
- Reglas: >5 transacciones en 1 minuto desde mismo usuario, monto inusual (>3σ de la media)
- Criterio: Transacción sospechosa genera alerta en Dashboard Seguridad automáticamente

**REQ-WALLET-4**: Como Finanzas, quiero exportar reportes en CSV/PDF.
- Filtros: rango de fechas, tipo de transacción, estado
- Criterio: Exportación de 1M registros completa en <60 segundos

---

## 5. Dashboard Seguridad

**REQ-SEC-1**: Como Seguridad, quiero ver intentos de login fallidos en tiempo real.
- Métricas: intentos fallidos/hora, IPs más frecuentes, cuentas objetivo
- Criterio: >10 intentos desde misma IP en 5 minutos genera alerta crítica

**REQ-SEC-2**: Como Seguridad, quiero ver tokens JWT activos y expirados anómalamente.
- Lista de tokens activos por usuario, tiempo restante
- Criterio: Token activo desde >2 ubicaciones geográficas distintas genera alerta

**REQ-SEC-3**: Como Seguridad, quiero bloquear IPs o usuarios desde el portal.
- Bloqueo temporal (1h/24h/7d) o permanente
- Criterio: Bloqueo entra en vigor en <30 segundos
- Criterio: Acción queda registrada en auditoría con motivo

**REQ-SEC-4**: Como Seguridad, quiero ver un mapa de calor de actividad geográfica.
- Actividad por país/ciudad en tiempo real
- Criterio: Actividad desde país no habitual genera alerta

---

## 6. Dashboard Infraestructura

**REQ-INFRA-1**: Como Operaciones, quiero ver el estado de todos los servicios cloud.
- Render: CPU%, RAM%, requests/s, latencia P99
- Supabase: conexiones activas, query time, storage usado
- Vercel: CDN hit rate, edge locations, bandwidth
- Criterio: Datos actualizados cada 60 segundos

**REQ-INFRA-2**: Como Operaciones, quiero ver alertas de capacidad.
- Criterio: Alerta si CPU Render >80% por 5 minutos
- Criterio: Alerta si Supabase connections >80% del límite
- Criterio: Alerta si storage Supabase >85%

**REQ-INFRA-3**: Como Operaciones, quiero ver el historial de incidentes.
- Lista de incidentes con: fecha, duración, impacto, resolución
- Criterio: MTTR (Mean Time to Recovery) calculado automáticamente

**REQ-INFRA-4**: Como Operaciones, quiero ver logs del servidor en tiempo real.
- Filtros: nivel (error/warn/info), servicio, rango de tiempo
- Criterio: Stream de logs con latencia <5 segundos

---

## 7. Dashboard Sincronización SQLite

**REQ-SYNC-1**: Como Operaciones, quiero ver el estado de sincronización offline por dispositivo.
- Métricas: dispositivos con sync pendiente, conflictos activos, última sync exitosa
- Criterio: Dispositivo sin sync >24h se marca como crítico

**REQ-SYNC-2**: Como Operaciones, quiero ver y resolver conflictos de sincronización.
- Lista de conflictos con: tipo, datos en conflicto, timestamp
- Opciones: mantener local, mantener servidor, merge manual
- Criterio: Resolución de conflicto propaga en <60 segundos

**REQ-SYNC-3**: Como Operaciones, quiero estadísticas de uso offline.
- % de usuarios que usan modo offline, frecuencia de sync, tamaño de datos locales
- Criterio: Datos segmentados por versión de app y SO

---

## 8. Dashboard Auditoría

**REQ-AUD-1**: Como Auditor, quiero ver un log completo e inmutable de todas las acciones admin.
- Campos: timestamp, admin_id, acción, recurso afectado, IP, resultado
- Criterio: Log no puede ser modificado ni eliminado (append-only)
- Criterio: Toda acción de escritura en el portal genera entrada de auditoría

**REQ-AUD-2**: Como Auditor, quiero filtrar y buscar en el log de auditoría.
- Filtros: admin, rango de fechas, tipo de acción, recurso
- Criterio: Búsqueda devuelve resultados en <3 segundos para 10M registros

**REQ-AUD-3**: Como Auditor, quiero exportar el log en formato firmado digitalmente.
- Formatos: CSV, JSON, PDF
- Criterio: Firma digital verifica integridad del export

**REQ-AUD-4**: Como Super Admin, quiero recibir alertas de acciones críticas.
- Acciones críticas: eliminación masiva, cambio de permisos, acceso a datos sensibles
- Criterio: Alerta llega en <30 segundos por email y push

---

## 9. Arquitectura de Escalabilidad

### Fase 1 — 100 usuarios (Actual)
- Monolito React + API Express en Render (free tier)
- Supabase Free (base de datos + auth)
- Sin caché
- Polling cada 30s para métricas en tiempo real

### Fase 2 — 10.000 usuarios
- Redis Cache para métricas agregadas (TTL 30s)
- Indexes en tablas de auditoría y transacciones
- Paginación en todas las listas
- WebSocket SSE para actualizaciones en tiempo real (reemplaza polling)

### Fase 3 — 100.000 usuarios
- Read replicas en Supabase para queries pesadas
- CDN para assets del portal (Vercel Edge)
- Queue de eventos para procesamiento asíncrono de métricas
- Dashboards con datos pre-agregados (materialized views)

### Fase 4 — 1.000.000 usuarios
- Microservicios: servicio de métricas separado
- Event streaming (Kafka/Redpanda) para ingesta de eventos
- Data warehouse separado (Supabase Analytics o ClickHouse)
- API Gateway con rate limiting por rol
- Multi-region deployment

---

## 10. Requisitos No Funcionales

**REQ-NFR-1**: El portal debe cargar en <3 segundos en conexión 3G.
**REQ-NFR-2**: Todos los endpoints del portal requieren autenticación JWT.
**REQ-NFR-3**: Comunicación exclusivamente HTTPS/WSS.
**REQ-NFR-4**: El portal es responsive (desktop first, funcional en tablet).
**REQ-NFR-5**: Datos sensibles (tokens, passwords) nunca aparecen en logs.
**REQ-NFR-6**: Disponibilidad objetivo: 99.5% mensual.
**REQ-NFR-7**: El portal soporta español como idioma principal.
