# Deploy unificado — un push, app + backend

## Cómo funciona ahora

```
git push origin mobile   (o ./scripts/push-all.sh "tu mensaje")
         │
         ▼
  GitHub Actions (rama mobile)
         │
         ├── 1. Sync server/ → repo egchat-api (main)
         │        └── Render auto-deploy (~3-5 min)
         │
         ├── 2. Build + deploy egchat-mobile → Vercel
         │
         └── 3. Verifica /health + rutas djangue en Render
```

**Un solo push** a la rama `mobile` despliega **app y backend**.

---

## Comando rápido (local)

```bash
chmod +x scripts/push-all.sh
./scripts/push-all.sh "feat: mi cambio"
```

Este script:
1. Commitea y pushea `server/` → `DulceNdong/egchat-api`
2. Actualiza el puntero del submodule en `egchat-v2`
3. Pushea `egchat-v2` → dispara GitHub Actions

---

## Secretos necesarios en GitHub

En **egchat-v2** → Settings → Secrets → Actions:

| Secret | Para qué |
|--------|----------|
| `EGCHAT_API_SYNC_TOKEN` | PAT con permiso `repo` para pushear a `egchat-api` |
| `RENDER_DEPLOY_HOOK` | (opcional) URL del deploy hook de Render |
| `VERCEL_TOKEN` | Deploy app web |
| `VERCEL_ORG_ID` | Deploy app web |
| `VERCEL_PROJECT_ID` | Deploy app web |
| `EXPO_PUBLIC_SUPABASE_URL` | Build app |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Build app |

### Crear EGCHAT_API_SYNC_TOKEN

1. https://github.com/settings/tokens → Generate new token (classic)
2. Scope: `repo`
3. Copiar → pegar en GitHub Secrets como `EGCHAT_API_SYNC_TOKEN`

---

## URLs de producción

| Servicio | URL |
|----------|-----|
| **Backend API** | https://egchat-api-xlxj.onrender.com |
| **App web** | Vercel (proyecto egchat-mobile) |
| **Base de datos** | Supabase `fqfxtjnfhvpggssbymdn` |

---

## Estructura de repos

```
EGCHAT_NATIVA (egchat-v2, rama mobile)
├── egchat-mobile/     → App → Vercel
├── server/            → Backend → sync → egchat-api → Render
└── egchat-api/        → ⚠️ COPIA VIEJA — no usar, ignorar
```

Render despliega desde **`DulceNdong/egchat-api`**, no desde `egchat-v2/egchat-api/`.

---

## Verificar deploy manualmente

```bash
curl -s https://egchat-api-xlxj.onrender.com/health
cd server && node verify-deploy.js
```

401 en rutas = ✅ existe | 404 = ❌ falta deploy

---

## Base de datos

Las tablas SQL **no van por Git**. Ejecutar en Supabase cuando haya cambios:

- `djangue_tables_only.sql` — tablas Mi Djangue
- `server/new_features_schema.sql` — otras features

Dashboard: https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/sql/new
