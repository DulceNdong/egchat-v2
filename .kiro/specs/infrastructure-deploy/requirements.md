# Spec 7: Despliegue e Infraestructura

## Arquitectura actual (Render + Supabase)
- **Backend API**: Node.js/Express en Render (ya desplegado)
- **Base de datos**: Supabase (PostgreSQL)
- **Almacenamiento**: Supabase Storage + Cloudinary
- **CDN**: Cloudflare (a configurar)

## Entornos

| Entorno | URL | Rama |
|---------|-----|------|
| Development | localhost:5000 | feature/* |
| Staging | egchat-api-staging.onrender.com | develop |
| Production | egchat-api-xlxj.onrender.com | main |

## CI/CD Pipeline (GitHub Actions)

```
Push → Lint → Tests → Build Docker → Push Registry → Deploy Staging → Tests integración → Aprobar → Deploy Producción
```

## Health Check

`GET /health` devuelve:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "db": "connected",
  "kycProvider": "mock",
  "amlProvider": "mock",
  "uptime": 12345
}
```

## Backups

- PostgreSQL: `pg_dump` diario via Supabase scheduled backups
- Retención: 30 días
- Point-in-time recovery: habilitado en Supabase Pro
- RTO: 4 horas | RPO: 1 hora

## Servidor de actualizaciones Tauri

- Endpoint: `https://egchat-api-xlxj.onrender.com/updates/{app}/{platform}/{arch}`
- Archivo `latest.json` con versión, notas y URL de descarga firmada
- Integrado en el mismo servidor Render (sin coste adicional)

## Monitoring

- **UptimeRobot** (gratis): ping cada 5 min a `/health`
- **Sentry**: error tracking en Node.js
- **Render Metrics**: CPU, RAM, latencia p95
