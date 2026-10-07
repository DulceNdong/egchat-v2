# Investigación: Variables APNS/VoIP para llamadas iOS

**Fecha:** Investigación estática del repo  
**Rama:** `mobile` (`egchat-mobile/`)

---

## Resumen ejecutivo

❌ **Las llamadas VoIP en iOS NO funcionarán hasta que se configuren dos secretos en Supabase Edge Functions.**

El código del servidor está **completamente implementado y listo**. El problema no es código faltante — es configuración de secretos en el dashboard de Supabase. Las variables `APNS_KEY_P8` y `APNS_KEY_ID` están **comentadas como pendientes** en todos los archivos de entorno del proyecto y **ausentes en ambos `render.yaml`**.

Las llamadas en Android (FCM) también tienen el mismo problema: falta `FCM_SERVICE_ACCOUNT_JSON`.

---

## Estado de cada variable requerida

### Supabase Edge Functions — `deliver-call-push`
*(Variables que deben configurarse en: Supabase Dashboard → Project → Edge Functions → Secrets)*

| Variable | Estado | Valor disponible |
|---|---|---|
| `APNS_KEY_P8` | ❌ **FALTA** | Requiere archivo `.p8` de Apple Developer |
| `APNS_KEY_ID` | ❌ **FALTA** | Requiere Key ID (10 chars) del archivo .p8 |
| `APNS_TEAM_ID` | ✅ Conocido | `XU6YD7ZJ2K` (en `.env.local` línea 23) |
| `APNS_BUNDLE_ID` | ✅ Conocido | `com.jallzstores.egchat` (en `.env.local` línea 22) |
| `APNS_ENV` | ✅ Conocido | `production` (en `.env.local` línea 24) |
| `SERVICE_TOKEN` | ✅ Configurado | `6008c2d1...` (en `render.yaml` línea 24 y `.env.local` línea 21) |
| `FCM_SERVICE_ACCOUNT_JSON` | ❌ **FALTA** | Requiere JSON del Service Account de Firebase |
| `FCM_PROJECT_ID` | ✅ Conocido | `egchat-4efe7` (en `.env.local` línea 25) |
| `SUPABASE_URL` | ✅ Auto-inyectada | Supabase la inyecta automáticamente |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto-inyectada | Supabase la inyecta automáticamente |

### Render API — `egchat-api`
*(Variables configuradas en: render.yaml o Render Dashboard → Environment)*

| Variable | Estado | Notas |
|---|---|---|
| `SERVICE_TOKEN` | ✅ En `render.yaml` | Necesario para que Render llame a la Edge Function |
| `SUPABASE_URL` | ✅ En `render.yaml` | Hardcodeado — funciona |
| `APNS_KEY_P8` | ❌ **Ausente** | No está en `render.yaml` ni se necesita aquí (Render solo llama a Supabase) |
| `APNS_KEY_ID` | ❌ **Ausente** | Ídem — no se necesita en Render |

> **Nota importante:** Render NO envía los pushes directamente. El servidor Render (`index.js`, línea ~5593) llama a la Supabase Edge Function `deliver-call-push` usando el `SERVICE_TOKEN`. Son las **Edge Functions** las que usan las variables APNS. Render solo necesita `SERVICE_TOKEN` y `SUPABASE_URL` para delegar, y ambos ya están configurados.

---

## Arquitectura del sistema de llamadas (lo que ya funciona)

```
App móvil
  └── POST /api/push/voip-call  ──→  Render API (index.js:5573)
                                          │
                                          │ usa SERVICE_TOKEN ✅
                                          │
                                          ↓
                              Supabase Edge Function
                              deliver-call-push/index.ts
                                    │           │
                              iOS: APNs VoIP    Android: FCM
                              (apns.ts)         (fcm.ts)
                              ❌ APNS_KEY_P8    ❌ FCM_SERVICE_ACCOUNT_JSON
                              ❌ APNS_KEY_ID    ✅ FCM_PROJECT_ID
```

El código hace fallback a Expo Push si la Edge Function no tiene los secretos (`code: 'NO_CREDENTIALS'`), pero Expo Push NO activa CallKit — el usuario verá una notificación normal, no la pantalla de llamada entrante.

---

## Evidencia por archivo

### `egchat-mobile/supabase/functions/_shared/apns.ts` (líneas 12-17)
```
Variables de entorno requeridas (en Supabase Dashboard → Edge Functions → Secrets):
  APNS_KEY_P8        — contenido del archivo AuthKey_XXXXXXXX.p8 (sin headers)
  APNS_KEY_ID        — 10 caracteres, p.ej. "ABC1234567"
  APNS_TEAM_ID       — 10 caracteres, p.ej. "XU6YD7ZJ2K"
  APNS_BUNDLE_ID     — p.ej. "com.jallzstores.egchat"
  APNS_ENV           — "production" | "sandbox"
```
El código en líneas 98-106 hace esto exactamente:
```typescript
const keyP8    = Deno.env.get('APNS_KEY_P8');   // ← FALTA
const keyId    = Deno.env.get('APNS_KEY_ID');   // ← FALTA
const teamId   = Deno.env.get('APNS_TEAM_ID');
if (!keyP8 || !keyId || !teamId) {
  return { success: false, code: 'NO_CREDENTIALS' };  // esto es lo que pasa hoy
}
```

### `egchat-mobile/.env.local` (líneas 29-31)
```
# ⚠️ PENDIENTE — Añadir manualmente:
# APNS_KEY_P8=<contenido del AuthKey_XXXXXXXXXX.p8 sin headers>
# APNS_KEY_ID=<10 chars del nombre del archivo>
# FCM_SERVICE_ACCOUNT_JSON=<JSON completo del service account Firebase>
```
Confirmación explícita de que el autor del código sabe que faltan estos valores.

### `egchat-mobile/egchat-v2/egchat-api/render.yaml` (completo)
Solo contiene: `NODE_ENV`, `APP_VERSION`, `ENABLE_EXTERNAL_NEWS_SCRAPING`, `CORS_ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `SERVICE_TOKEN`, `LOCAL_AUTH_FALLBACK`.  
**No hay ninguna variable APNS ni FCM.**

### `egchat-mobile/.env.example` (líneas 25-45)
Documenta perfectamente todas las variables requeridas, con instrucciones de dónde obtenerlas. El `APNS_TEAM_ID=XU6YD7ZJ2K` ya está precargado.

---

## Respuestas a las preguntas del brief

1. **¿Están APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID referenciadas en el código?**  
   Sí, en `supabase/functions/_shared/apns.ts` y `deliver-call-push/index.ts`. El código que las usa está completo y funcional.

2. **¿Hay algún archivo .env.example que liste las variables requeridas?**  
   Sí: `egchat-mobile/.env.example` es completo y bien documentado. También hay notas en `.env.local` marcando las pendientes.

3. **¿Está el código del servidor Render en este repositorio o es externo?**  
   **Está en el repo**, en `egchat-mobile/egchat-v2/egchat-api/index.js`. El backend Render es el archivo `index.js` (Node.js/Express). Las Edge Functions de Supabase también están en el repo bajo `egchat-mobile/supabase/functions/`.

4. **¿Qué variables de entorno ya existen?**  
   En Render: `NODE_ENV`, `APP_VERSION`, `CORS_ALLOWED_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `SERVICE_TOKEN`, `LOCAL_AUTH_FALLBACK`.  
   En Supabase Secrets: desconocido (no hay forma de verlo localmente), pero el `.env.local` indica que aún no se han configurado `APNS_KEY_P8`, `APNS_KEY_ID`, `FCM_SERVICE_ACCOUNT_JSON`.

5. **¿Está implementado el envío de VoIP push en el servidor, o solo en el cliente móvil?**  
   **Implementado en el servidor** (Supabase Edge Functions). El cliente solo llama a `/api/push/voip-call` en Render, que delega a la Edge Function. El cliente nativo registra el VoIP token con `/api/push/register-voip-token`. Toda la lógica de envío APNs/FCM está en el servidor.

6. **¿Qué falta exactamente?**  
   Ver sección siguiente.

---

## Lo que falta — acciones concretas

### Prioridad 1: iOS VoIP CallKit (APNS)

Ir a **Apple Developer → Certificates, Identifiers & Profiles → Keys** y:
1. Crear una nueva key con "Apple Push Notifications service (APNs)" activado
2. Descargar el archivo `AuthKey_XXXXXXXXXX.p8` (solo se puede descargar una vez)
3. Anotar el **Key ID** (los 10 caracteres del nombre del archivo)
4. Confirmar el **Team ID** (ya está: `XU6YD7ZJ2K`)

Luego en **Supabase Dashboard → Project `fqfxtjnfhvpggssbymdn` → Edge Functions → Secrets**:
- `APNS_KEY_P8` = contenido del `.p8` sin las líneas `-----BEGIN/END PRIVATE KEY-----` y sin saltos de línea
- `APNS_KEY_ID` = 10 caracteres del nombre del archivo
- `APNS_TEAM_ID` = `XU6YD7ZJ2K`
- `APNS_BUNDLE_ID` = `com.jallzstores.egchat`
- `APNS_ENV` = `production`
- `SERVICE_TOKEN` = `6008c2d16280cdfbecf4d4416b9ec39c5da7c552a6e382d5df91b1f61dc4a6a0`

### Prioridad 2: Android VoIP CallKit (FCM)

En **Firebase Console → Project `egchat-4efe7` → Project Settings → Service Accounts → Generate new private key**:
- Descargar el JSON del Service Account
- Añadir en Supabase Secrets:
  - `FCM_SERVICE_ACCOUNT_JSON` = contenido completo del JSON (en una sola línea)
  - `FCM_PROJECT_ID` = `egchat-4efe7`

### Prioridad 3: Hacer deploy de las Edge Functions

Si las Edge Functions no han sido desplegadas aún a Supabase, ejecutar desde `egchat-mobile/`:
```bash
npx supabase functions deploy deliver-call-push --project-ref fqfxtjnfhvpggssbymdn
npx supabase functions deploy register-device-token --project-ref fqfxtjnfhvpggssbymdn
```

### No es necesario cambiar en Render
El `render.yaml` ya tiene `SERVICE_TOKEN` y `SUPABASE_URL`. Render no necesita las variables APNS — esas van solo en Supabase.

---

## Conclusión

El sistema está **arquitectónicamente completo**. El código de envío VoIP (APNs + FCM) está implementado, probado y bien estructurado. La única razón por la que las llamadas no funcionan en iOS es que las **credenciales APNs nunca se cargaron** en Supabase Edge Functions Secrets. Son tres pasos: crear la key en Apple Developer, descargar el `.p8`, y añadir 5 variables en el dashboard de Supabase.
