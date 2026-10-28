# 🚨 Diagnóstico: Llamadas No Llegan en Build 122

**Fecha**: 28 Oct 2026  
**Problema**: Build 122 (iOS) no recibe llamadas entrantes  
**Backend**: Render LIVE (rama `main`)  
**Frontend**: Build 122 (rama `mobile`)

---

## 🔍 Problema Identificado

###  Desincronización Frontend-Backend

**Build 122** fue compilado desde rama `mobile`:
```bash
git show e80131be  # Commit del build 122
# Rama: mobile
# Código: src/notifications.ts línea 267
```

**Backend en Render** corre desde rama `main`:
```bash
# Commit: 21f20515
# egchat-api/index.js línea 5443
```

### Diferencias Críticas

La rama `mobile` tiene diferencias en `egchat-api/index.js` que NO están en `main`:
- Sintaxis TypeScript (`as string`, `:any`)
- Posibles diferencias en push notification logic

---

## 🧪 Diagnóstico Paso a Paso

### 1. Verificar Tabla `expo_push_tokens`

El backend en main usa esta tabla para buscar tokens push:

```javascript
// egchat-api/index.js línea 5443
const { data: expoSubs } = await supabase
  .from('expo_push_tokens')
  .select('token')
  .eq('user_id', userId);
```

**¿Existe la tabla?**
```sql
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'expo_push_tokens'
);
```

**¿Tiene tokens registrados?**
```sql
SELECT COUNT(*) FROM public.expo_push_tokens;
SELECT user_id, token, platform, created_at 
FROM public.expo_push_tokens 
LIMIT 5;
```

### 2. Verificar Registro de Token

**Build 122 ejecuta** al hacer login (`src/hooks/useAuth.ts línea 61`):
```typescript
registerForPushNotifications()
```

**Esto llama** (`src/notifications.ts línea 287`):
```typescript
await fetch(`${API_BASE}/api/push/register-expo-token`, {
  method: 'POST',
  body: JSON.stringify({
    expoPushToken,
    platform: 'ios',
    tokenType: 'expo'
  })
})
```

**El servidor debe** (`egchat-api/index.js línea 5520`):
```javascript
app.post('/api/push/register-expo-token', auth, async (req, res) => {
  // Insertar token en expo_push_tokens
  await supabase.from('expo_push_tokens').upsert(...)
})
```

---

## 📊 Logs Críticos a Revisar

### Frontend (Build 122)

Buscar en Xcode Console.app estos logs:

```
[Push] Iniciando registro. Platform: ios, projectId: 1cf45e7c-dc1f-47e7-88bd-72b70fa4c1c5
[Push] ExponentPushToken obtenido: ...xxxxxxxxxxx
[Push] Token APNs nativo: ...xxxxxxxxxxx
[Push] Tokens obtenidos — expo: true, fcm: false, apns: true
[Push] Enviando token al servidor (expo/ios): ...xxxxxxxx
[Push] ✅ Token registrado en servidor correctamente
```

Si falta "✅ Token registrado", el POST falló.

### Backend (Render)

Ver logs en: https://dashboard.render.com/web/srv-xxx/logs

Buscar:
```
POST /api/push/register-expo-token
[Push] Token registrado para user_id=xxx platform=ios
```

Si NO aparece, el endpoint no está recibiendo la request.

### Render - Cuando alguien llama

Buscar:
```
[call/offer] Push notification sent to userId=xxx
[call/offer] Expo push batch sent (1 messages)
```

Si NO aparece, el push no se está enviando.

---

## 🔧 Soluciones Posibles

### Opción 1: Merge Mobile → Main (RIESGOSO)

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA
git checkout main
git merge mobile
# Resolver conflictos
git push origin main
```

**Problema**: Muchos conflictos potenciales.

### Opción 2: Cherry-pick Push Logic (RECOMENDADO)

```bash
git checkout main
# Identificar commits de push en mobile
git log mobile --oneline --grep="push"
# Cherry-pick solo esos commits
git cherry-pick <commit-hash>
git push origin main
```

### Opción 3: Build desde Main (RÁPIDO)

```bash
# Hacer build iOS desde rama main en vez de mobile
cd egchat-mobile
git checkout main
npx eas build --profile testflight --platform ios --non-interactive
```

**Problema**: Main puede no tener todos los fixes de mobile.

### Opción 4: Verificar Tabla en Supabase

Si la tabla `expo_push_tokens` no existe o está vacía:

```sql
-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.expo_push_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  token_type TEXT DEFAULT 'expo' CHECK (token_type IN ('expo', 'fcm', 'apns', 'voip')),
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  device_id TEXT,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user ON expo_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_active ON expo_push_tokens(user_id, is_active, token_type) WHERE is_active = TRUE;
```

---

## 🎯 Test Inmediato

### 1. Verificar Token Registrado

```bash
# En Supabase SQL Editor:
SELECT * FROM expo_push_tokens 
WHERE user_id = '<tu-user-id>' 
ORDER BY created_at DESC 
LIMIT 1;
```

Debería mostrar un token reciente (hoy).

### 2. Test Manual de Push

```javascript
// En Render logs o Postman
POST https://egchat-api-xlxj.onrender.com/api/call/offer
Authorization: Bearer <token-valido>
{
  "callId": "test-123",
  "offer": {"type": "offer", "sdp": "..."},
  "targetUserId": "<user-id-destinatario>",
  "type": "audio"
}
```

Ver si aparece en Render logs:
```
[call/offer] Push notification sent to userId=xxx
```

### 3. Verificar Endpoint Existe

```bash
curl -X POST https://egchat-api-xlxj.onrender.com/api/push/register-expo-token \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"expoPushToken":"ExponentPushToken[test]","platform":"ios","tokenType":"expo"}'
```

Debería retornar 200 OK.

---

## 🚀 Acción Recomendada AHORA

1. **Verificar tabla en Supabase**:
   ```sql
   SELECT COUNT(*) FROM expo_push_tokens;
   ```

2. **Si NO existe la tabla**: Ejecutar SQL de creación arriba

3. **Si SÍ existe pero vacía**: El build 122 no está registrando tokens
   - Problema: Endpoint `/api/push/register-expo-token` puede no estar en main
   - Solución: Cherry-pick ese endpoint desde mobile a main

4. **Verificar logs Render**: ¿Aparece el POST del token?

5. **Rebuild si es necesario**: Si main no tiene el endpoint, hacer build desde main después de arreglarlo

---

## 📝 Checklist Debug

- [ ] Tabla `expo_push_tokens` existe en Supabase
- [ ] Endpoint `/api/push/register-expo-token` responde 200
- [ ] Build 122 ejecuta `registerForPushNotifications()` al login
- [ ] Logs frontend muestran "✅ Token registrado"
- [ ] Logs Render muestran POST recibido
- [ ] Tokens aparecen en tabla expo_push_tokens
- [ ] Cuando alguien llama, Render muestra "Push sent"
- [ ] El destinatario recibe notificación push

---

## 🔥 Quick Fix

Si urge y no hay tiempo para debug extenso:

**Rebuild build 123 desde main**:
```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA
git checkout main
cd egchat-mobile
npx eas build --profile testflight --platform ios --non-interactive
```

Esperar 5 min → Subir a TestFlight → Probar de nuevo.

Esto asegura 100% sync frontend-backend.
