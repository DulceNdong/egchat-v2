# EGChat — Sistema de Llamadas: Guía de Activación Completa

> Este documento describe todos los pasos necesarios para que el sistema de
> llamadas de audio y vídeo funcione completamente en producción.
> Sigue el orden exacto.

---

## Estado actual del código

| Componente | Estado |
|---|---|
| CallManager (singleton global) | ✅ Implementado |
| WebRTC con cola ICE y ICE restart | ✅ Implementado |
| CallKit iOS nativo | ✅ Implementado |
| PushKit iOS (VoIP push) | ✅ Implementado |
| FirebaseMessagingService Android | ✅ Implementado |
| ForegroundService Android | ✅ Implementado |
| AVAudioSession + interrupciones iOS | ✅ Implementado |
| AudioFocus Android | ✅ Implementado |
| FloatingCallBar (PiP interno) | ✅ Implementado |
| Supabase RPCs atómicas (SQL creado) | ⏳ Pendiente ejecutar |
| Edge Functions (código creado) | ⏳ Pendiente deploy |
| APNs VoIP directo | ⏳ Pendiente credenciales |
| FCM HTTP v1 | ⏳ Pendiente credenciales |
| TURN servers en producción | ⏳ Pendiente Twilio |
| EAS Build con cambios nativos | ⏳ Pendiente build |

---

## PASO 1 — Preparar variables de entorno

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile
cp .env.example .env.local
```

Abrir `.env.local` y rellenar **todos** los valores marcados con `<...>`.

### Variables críticas mínimas para funcionar:

| Variable | Dónde obtenerla |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/settings/api) |
| `JWT_SECRET` | Render Dashboard → egchat-api → Environment |
| `SERVICE_TOKEN` | Generar: `openssl rand -hex 32` |

### Variables para llamadas nativas (sin estas, usa Expo Push como fallback):

**iOS APNs VoIP:**
1. Ir a [Apple Developer → Certificates → Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Crear nueva key con "Apple Push Notifications service (APNs)"
3. Descargar `AuthKey_XXXXXXXXXX.p8`
4. Copiar el contenido (sin `-----BEGIN/END PRIVATE KEY-----`) a `APNS_KEY_P8`
5. Los 10 chars del nombre del archivo → `APNS_KEY_ID`
6. Team ID desde [Account → Membership](https://developer.apple.com/account/#/membership) → `APNS_TEAM_ID`

**Android FCM HTTP v1:**
1. Ir a [Firebase Console → egchat-4efe7 → Project Settings](https://console.firebase.google.com/project/egchat-4efe7/settings/general)
2. Pestaña "Service accounts" → "Generate new private key"
3. Pegar el JSON completo en `FCM_SERVICE_ACCOUNT_JSON`

---

## PASO 2 — Ejecutar migraciones SQL en Supabase

Las siguientes tablas y funciones **deben existir** antes de que el backend funcione:
- `call_sessions` (ampliada con `status`, `version`, `expires_at`, `connected_at`)
- `call_participants`, `call_signals`, `call_events`
- `push_delivery_log`
- RPCs: `initiate_call`, `accept_call`, `reject_call`, `cancel_call`, `end_call`, `mark_call_connected`, `expire_stale_calls`, `get_call_state`

### Opción A — Script automático (requiere Supabase CLI):

```bash
npm install -g supabase
supabase login
bash scripts/deploy-supabase.sh --sql-only
```

### Opción B — Manual en Supabase Dashboard (recomendada si hay dudas):

1. Abrir [Supabase SQL Editor](https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/sql/new)
2. Copiar y ejecutar `supabase-calls-migration.sql`
3. Verificar: no debe haber errores rojos
4. Copiar y ejecutar `supabase-device-tokens-migration.sql`
5. Verificar en [Table Editor](https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/editor) que existen las tablas nuevas

---

## PASO 3 — Configurar variables de entorno en Render

En [Render Dashboard → egchat-api → Environment](https://dashboard.render.com):

```
SERVICE_TOKEN = <mismo valor que en .env.local>
```

Si tienes Twilio para TURN servers de producción:
```
TWILIO_ACCOUNT_SID     = <account sid>
TWILIO_API_KEY_SID     = <api key sid>
TWILIO_API_KEY_SECRET  = <api key secret>
```

Sin Twilio, el endpoint `/api/turn-token` cae al fallback de OpenRelay (gratuito, sin SLA).

---

## PASO 4 — Deploy Edge Functions

### Opción A — Script automático:

```bash
bash scripts/deploy-supabase.sh --fn-only
```

### Opción B — Manual:

```bash
npm install -g supabase
supabase login
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

supabase functions deploy deliver-call-push \
  --project-ref fqfxtjnfhvpggssbymdn \
  --no-verify-jwt

supabase functions deploy register-device-push \
  --project-ref fqfxtjnfhvpggssbymdn \
  --no-verify-jwt
```

---

## PASO 5 — Configurar secrets de Edge Functions

```bash
bash scripts/set-supabase-secrets.sh
```

O manualmente en [Supabase Dashboard → Edge Functions → Secrets](https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/functions):

| Secret | Requerido |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sí |
| `SERVICE_TOKEN` | ✅ Sí |
| `JWT_SECRET` | ✅ Sí |
| `APNS_KEY_P8` | Para iOS nativo |
| `APNS_KEY_ID` | Para iOS nativo |
| `APNS_TEAM_ID` | Para iOS nativo |
| `APNS_BUNDLE_ID` | Para iOS nativo |
| `APNS_ENV` | Para iOS nativo |
| `FCM_SERVICE_ACCOUNT_JSON` | Para Android nativo |
| `FCM_PROJECT_ID` | Para Android nativo |
| `EXPO_ACCESS_TOKEN` | Opcional (fallback) |

---

## PASO 6 — EAS Build

Los siguientes archivos nativos fueron modificados y **requieren rebuild**:

**iOS:**
- `ios/EGCHAT/EGCHAT.entitlements` — pushkit entitlement añadido
- `ios/EGCHAT/EGChatCallModule.swift` — AVAudioSession observers, shared strong
- `ios/EGCHAT/EGChatPushKitModule.swift` — cola de eventos pendientes
- `ios/EGCHAT/AppDelegate.swift` — reportIncomingCallFromPush directo

**Android:**
- `android/app/src/main/AndroidManifest.xml` — FCM service + BLUETOOTH_CONNECT
- `android/.../EGChatFirebaseMessagingService.kt` — nuevo (llamadas con app cerrada)
- `android/.../CallForegroundService.kt` — AudioFocus listener real
- `android/.../MainActivity.kt` — handleCallIntent

### Build de desarrollo (para probar):

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# iOS
npx eas build --profile development --platform ios

# Android
npx eas build --profile development --platform android
```

### Build de preview (para TestFlight / distribución interna):

```bash
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
```

---

## PASO 7 — Verificar Realtime en Supabase

Las Edge Functions y el `CallManager` usan Supabase Realtime para sincronización
instantánea de estados de llamada. Verificar que está activo:

1. [Supabase Dashboard → Database → Replication](https://supabase.com/dashboard/project/fqfxtjnfhvpggssbymdn/database/replication)
2. Verificar que `call_sessions` y `call_signals` están en la publicación `supabase_realtime`
3. Si no están, ejecutar en SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE call_signals;
```

---

## PASO 8 — Pruebas en dispositivo físico

Después del build, probar en orden:

### Pruebas básicas (sin credenciales APNs/FCM):
- [ ] Llamada audio: app abierta en ambos dispositivos
- [ ] Llamada vídeo: app abierta en ambos dispositivos
- [ ] Minimizar llamada y volver al chat
- [ ] Restaurar llamada desde FloatingCallBar
- [ ] Rechazar llamada
- [ ] Cancelar llamada (antes de contestar)
- [ ] Colgar desde ambos lados

### Pruebas de background (requieren credenciales APNs/FCM):
- [ ] iOS: llamada con app completamente cerrada (PushKit + CallKit)
- [ ] Android: llamada con app cerrada (FCM + ForegroundService)
- [ ] iOS: llamada durante bloqueo de pantalla
- [ ] Android: llamada durante bloqueo de pantalla
- [ ] Llamada telefónica entrante durante llamada EGChat

### Pruebas de red:
- [ ] Pérdida de WiFi durante llamada (ICE restart automático)
- [ ] Cambio WiFi → datos móviles durante llamada
- [ ] Dos dispositivos del mismo usuario (multi-device cancel)

---

## Limitaciones conocidas del sistema operativo

| Escenario | iOS | Android |
|---|---|---|
| App cerrada por el usuario (force quit) | PushKit puede despertar la app | FCM puede no llegar en algunos OEM |
| Xiaomi/Huawei con ahorro de batería agresivo | N/A | El ForegroundService puede ser matado |
| CallKit sin credenciales APNs VoIP | No funciona | N/A |
| Bluetooth en Android 12+ sin BLUETOOTH_CONNECT | N/A | No funciona (permiso añadido) |
| Más de 1 llamada simultánea | No soportado | No soportado |

---

## Resolución de problemas comunes

**"La llamada no aparece con app cerrada en iOS"**
→ Verificar que `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID` están en Supabase secrets.
→ Verificar que `com.apple.developer.pushkit.unrestricted-development` está en el entitlement del build.

**"La llamada no aparece con app cerrada en Android"**
→ Verificar que `FCM_SERVICE_ACCOUNT_JSON` está en Supabase secrets.
→ Verificar que el dispositivo no tiene batería en modo ahorro agresivo.

**"Error 409 al aceptar llamada"**
→ Normal si dos dispositivos intentan aceptar simultáneamente. El primero gana, el segundo recibe 409.

**"Las RPCs devuelven error 404"**
→ La migración SQL no fue ejecutada. Ejecutar `supabase-calls-migration.sql` en el SQL Editor.

**"TURN no funciona / llamada solo funciona en la misma red"**
→ Configurar `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` en Render.
→ Alternativa temporal: usar OpenRelay (ya configurado como fallback).
