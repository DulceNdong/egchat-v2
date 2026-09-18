# Tareas: Despliegue e Infraestructura

## Fase 1 — Docker y CI/CD
- [ ] **T-01** Crear `Dockerfile` para el servidor Node.js
- [ ] **T-02** Crear `docker-compose.yml` para desarrollo local (API + PostgreSQL + Redis)
- [ ] **T-03** Crear `.github/workflows/deploy.yml` — pipeline CI/CD completo
- [ ] **T-04** Configurar GitHub Secrets: RENDER_API_KEY, SUPABASE_URL, etc.

## Fase 2 — Servidor de actualizaciones (Tauri)
- [ ] **T-05** Crear `server/update-server/` con Express para servir `latest.json`
- [ ] **T-06** Estructura: `/updates/{app}/{platform}/{arch}/latest.json`
- [ ] **T-07** Script para publicar nuevas versiones con firma digital

## Fase 3 — Monitorización
- [ ] **T-08** Añadir `/health` endpoint al servidor con estado de DB, Redis y proveedores KYC
- [ ] **T-09** Configurar Sentry para error tracking
- [ ] **T-10** Configurar UptimeRobot para monitoring (gratis hasta 50 monitores)

## Fase 4 — Backups
- [ ] **T-11** Script `scripts/backup-db.sh` — backup Supabase diario vía `pg_dump`
- [ ] **T-12** Script `scripts/restore-db.sh` — restauración con verificación
- [ ] **T-13** Configurar retención de backups: 30 días
