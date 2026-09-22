# Tareas: Despliegue e Infraestructura

## Fase 1 — Docker y CI/CD
- [x] **T-01** Crear `Dockerfile` para el servidor Node.js
- [x] **T-02** Crear `docker-compose.yml` para desarrollo local (API + PostgreSQL + Redis)
- [x] **T-03** Crear `.github/workflows/deploy.yml` — pipeline CI/CD completo
- [x] **T-04** Configurar GitHub Secrets: RENDER_API_KEY, SUPABASE_URL, etc.

## Fase 2 — Servidor de actualizaciones (Tauri)
- [x] **T-05** Crear `server/update-server/` con Express para servir `latest.json`
- [x] **T-06** Estructura: `/updates/{app}/{platform}/{arch}/latest.json`
- [x] **T-07** Script para publicar nuevas versiones con firma digital

## Fase 3 — Monitorización
- [x] **T-08** Añadir `/health` endpoint al servidor con estado de DB, Redis y proveedores KYC
- [x] **T-09** Configurar Sentry para error tracking
- [x] **T-10** Configurar UptimeRobot para monitoring (gratis hasta 50 monitores)

## Fase 4 — Backups
- [x] **T-11** Script `scripts/backup-db.sh` — backup Supabase diario vía `pg_dump`
- [x] **T-12** Script `scripts/restore-db.sh` — restauración con verificación
- [x] **T-13** Configurar retención de backups: 30 días
