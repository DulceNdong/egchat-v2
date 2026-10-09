# Verificación de Fixes de Notificaciones Push — EGChat Mobile

**Fecha:** 2025-07-25  
**Rama:** `mobile`  
**Directorio:** `egchat-mobile/`

---

## Resumen Ejecutivo

De los 7 puntos verificados, **4 están correctos**, **2 tienen problemas críticos**, y **1 tiene un problema menor**:

| # | Verificación | Estado | Severidad |
|---|---|---|---|
| 1 | app.json (EAS projectId, owner, entitlements) | ✅ Correcto | — |
| 2 | Archivos .entitlements iOS | ✅ Correcto | — |
| 3 | EGChatCallModule.kt (canal de llamadas) | ✅ Correcto | — |
| 4 | notifications.ts (canal egchat-calls-v2) | ✅ Correcto | — |
| 5 | Flujo AppState background → foreground (Android) | ❌ PROBLEMA | 🔴 Crítico |
| 6 | deliver-call-push: channelId en fallback Expo | ❌ PROBLEMA | 🟡 Medio |
| 7 | Render backend egchat-api/index.js channelId | ❌ PROBLEMA | 🔴 Crítico |

---

## Verificación Detallada

### 1. app.json ✅

- **EAS projectId:** `6200ec00-54d7-4ef4-a348-56e80a1452f6` ✅
- **owner:** `reddington120` ✅
- **ios.bundleIdentifier:** `com.jallzstores.egchat` ✅
- **android.package:** `com.egchat.app` ✅
- **ios.entitlements:** contiene `com.apple.developer.pushkit.unrestricted-voip: true` ✅
- **ios.entitlements:** contiene `aps-environment: production` ✅
- **expo-notifications en package.json:** `~0.32.17` ✅

> **Evidencia:** `app.json` líneas 15, 161, 167, 174; entitlements en bloque `ios.entitlements` del mismo archivo.

---

### 2. Archivos .entitlements iOS ✅

**EGCHAT.entitlements** (`ios/EGCHAT/EGCHAT.entitlements`):
- `aps-environment: production` ✅
- `com.apple.developer.pushkit.unrestricted-voip: <true/>` ✅

**EGCHATRelease.entitlements** (`ios/EGCHAT/EGCHATRelease.entitlements`):
- `aps-environment: production` ✅
- `com.apple.developer.pushkit.unrestricted-voip: <true/>` ✅

Ambos archivos tienen la misma estructura correcta.

---

### 3. EGChatCallModule.kt ✅

**Archivo:** `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt`

- **Canal ID:** `private const val CALL_CHANNEL = "egchat-calls-v2"` (línea 33) ✅
- **Importancia:** `NotificationManager.IMPORTANCE_MAX` en `createChannel()` ✅
- **bypassDnd:** `setBypassDnd(true)` en `createChannel()` ✅
- **Acción "answer":**
  ```kotlin
  launchIntent.putExtra("callId", callId)    // ✅ presente
  launchIntent.putExtra("callAction", "answer")  // ✅ presente
  ```
  Ambos extras están en `EGChatCallActionReceiver.onReceive()` cuando `action == "answer"`.

- **Otros archivos .kt con referencia a `egchat-calls` sin -v2:** No se encontraron. Solo hay 3 archivos Kotlin (`EGChatCallModule.kt`, `MainActivity.kt`, `MainApplication.kt`) y solo el primero referencia el canal, usando `egchat-calls-v2`.

---

### 4. notifications.ts ✅

**Archivo:** `src/notifications.ts`

- **Canal `egchat-calls-v2`:**
  ```typescript
  await Notifications.setNotificationChannelAsync('egchat-calls-v2', {
    importance: Notifications.AndroidImportance.MAX,  // ✅
    bypassDnd: true,  // ✅
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC, // ✅
  });
  ```
  (líneas 110–121 y 155–163)

- **shouldPlaySound en handler:** `shouldPlaySound: !isCall` (línea ~28) ✅  
  No está fijo en `false` — para mensajes normales sí reproduce sonido, para llamadas no (correcto: el ringtone lo gestiona `startRingtone()`).

- **Referencias a `egchat-calls` sin -v2 en este archivo:** Ninguna ✅

---

### 5. Flujo AppState background → foreground (Android) ❌ CRÍTICO

**Problema:** El único `AppState.addEventListener` en `_layout.tsx` es a nivel de Android UI (línea 256) y solo reinicia la barra de navegación inmersiva. **No existe ningún listener de AppState que llame `consumePendingCall()` cuando la app regresa del background al foreground.**

**Flujo actual:**
1. App está en **background** → llega FCM → `EGChatFirebaseMessagingService.onMessageReceived()` guarda la llamada en `SharedPreferences` nativas.
2. Usuario acepta desde la notificación → `EGChatCallActionReceiver` guarda la acción y lanza el `launchIntent` con `callId` y `callAction`.
3. La app vuelve al **foreground**, pero el `useEffect` inicial de `_layout.tsx` ya se ejecutó cuando la app arrancó. **`consumePendingCall()` y `consumePendingAction()` solo se llaman en el `useEffect([], [])` de mount** — no se vuelven a llamar cuando la app regresa del background.

**Consecuencia concreta:**
- Si la app estaba en background (NO cerrada, sino en segundo plano) y llegó una llamada → el usuario acepta desde la notificación → la app vuelve al foreground → **NO navega a la pantalla de llamada** porque `consumePendingCall()` ya corrió y la pantalla de `[callId].tsx` nunca se monta.

**Código afectado:** `app/_layout.tsx` — no existe un segundo `AppState.addEventListener` para procesar llamadas pendientes cuando `state === 'active'`.

**El caso de cold start (app cerrada) sí funciona** porque `consumePendingCall()` se llama en el `useEffect` inicial. El problema es solo el caso background → foreground.

**Fix requerido:** Agregar un `AppState` listener en `_layout.tsx` que, cuando `state === 'active'`, llame `consumePendingCall()` y `consumePendingAction()` para el caso Android background, con protección anti-duplicado:

```typescript
useEffect(() => {
  if (Platform.OS !== 'android') return;
  
  const sub = AppState.addEventListener('change', async (state) => {
    if (state !== 'active') return;
    // Solo procesar si hay un usuario autenticado y la app está inicializada
    if (!globalUserId) return;
    
    try {
      const pending = await consumePendingCall();
      if (pending) {
        callManager.registerIncoming({
          callId: pending.callId,
          callerName: pending.callerName,
          callerAvatar: pending.callerAvatar || '',
          callType: pending.callType || 'audio',
          offer: pending.offer ?? undefined,
        });
        router.push({ pathname: '/call/[callId]', params: {
          callId: pending.callId,
          targetName: pending.callerName,
          targetAvatar: pending.callerAvatar || '',
          callType: pending.callType || 'audio',
          role: 'callee',
          offer: pending.offer ? JSON.stringify(pending.offer) : undefined,
          autoAccept: pending.action === 'answer' ? '1' : undefined,
        }} as any);
        return;
      }
    } catch {}
    
    // También consumir acción pendiente si hubo "answer" desde la notificación
    try {
      const raw = await NativeCallKit.getAndClearPendingCallAction();
      if (!raw) return;
      const { action, callId } = JSON.parse(raw) as { action: string; callId: string };
      if (action === 'answer') {
        const stillPending = await consumePendingCall();
        if (stillPending) {
          callManager.registerIncoming({ ... });
          router.push({ ... autoAccept: '1' });
        }
      } else if (action === 'reject' || action === 'end') {
        const { callAPI } = await import('../src/api');
        callAPI.reject(callId).catch(() => {});
      }
    } catch {}
  });
  
  return () => sub.remove();
}, [globalUserId]); // re-suscribir cuando el userId esté disponible
```

---

### 6. deliver-call-push: channelId en fallback Expo ❌ MEDIO

**Archivo:** `supabase/functions/deliver-call-push/index.ts`  
**Línea:** 227

```typescript
channelId: 'egchat-calls',   // ❌ HUÉRFANA — debería ser 'egchat-calls-v2'
```

**Contexto:** Este es el bloque del fallback Expo Push (sección 6c del archivo). Cuando un token expo llega a Android via la Expo Push Service, el `channelId` que se envía en el payload es `egchat-calls`. Pero el canal que existe en el dispositivo (creado por `EGChatCallModule.kt` y `notifications.ts`) se llama `egchat-calls-v2`.

**Consecuencia:** Las notificaciones de llamada enviadas via Expo Push (fallback) en Android se publicarán en un canal inexistente. Android las degradará al canal por defecto, que tiene `IMPORTANCE_DEFAULT` en lugar de `IMPORTANCE_MAX`. Esto significa:
- Sin heads-up / overlay sobre la pantalla de bloqueo
- Sin `bypassDnd`
- Sin comportamiento de llamada entrante

**Fix:** Cambiar la línea 227 de `deliver-call-push/index.ts`:
```typescript
channelId: 'egchat-calls-v2',   // ✅
```

---

### 7. Render backend egchat-api/index.js ❌ CRÍTICO

**Archivo:** `egchat-api/index.js` (archivo del servidor Render en `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-api/`)  
**Línea:** 5430

```javascript
channelId: isCall ? 'egchat-calls' : 'egchat-messages',  // ❌ HUÉRFANA
```

**Este es el código que está corriendo en producción en Render** (el servidor principal que envía las notificaciones Expo Push para mensajes Y llamadas).

**Consecuencia idéntica al punto 6** pero más grave porque este es el canal primario de notificaciones de llamada para la mayoría de los usuarios que tienen token Expo registrado. Todos los usuarios en Android que reciben la llamada via Expo Push verán la notificación sin heads-up/overlay.

También están presentes las mismas referencias huérfanas en:
- `server/egchat-api/index.js` línea 6947
- `server/index.js` línea 6523
- `temp-deploy-clean/egchat-api/index.js` línea 6905
- `temp-deploy-clean/index.js` línea 6509

Estos últimos 4 son copias/backups, pero `egchat-api/index.js` en la raíz es el que se deploya a Render.

**Fix:** En `egchat-api/index.js` línea 5430:
```javascript
channelId: isCall ? 'egchat-calls-v2' : 'egchat-messages',  // ✅
```

---

## Referencias Huérfanas a `egchat-calls` sin -v2

Dentro de `egchat-mobile/` (el proyecto activo):

| Archivo | Línea | Contenido | Impacto |
|---|---|---|---|
| `src/pushDiagnostic.ts` | 78–79 | `channels.some(c => c.id === 'egchat-calls')` | Bajo — solo diagnóstico; siempre reportará ❌ porque el canal real es v2 |
| `supabase/functions/deliver-call-push/index.ts` | 227 | `channelId: 'egchat-calls'` | Alto — falla el fallback Expo en Android |

Fuera de `egchat-mobile/` (no tocar según reglas del proyecto, pero son relevantes para producción):

| Archivo | Línea | Contenido |
|---|---|---|
| `egchat-api/index.js` | 5430 | `channelId: 'egchat-calls'` — **servidor Render en producción** |
| `server/egchat-api/index.js` | 6947 | Misma referencia (copia) |
| `server/index.js` | 6523 | Misma referencia (copia) |
| `temp-deploy-clean/egchat-api/index.js` | 6905 | Misma referencia (copia) |
| `temp-deploy-clean/index.js` | 6509 | Misma referencia (copia) |

---

## Diagnóstico de por qué no llegan notificaciones en iOS

Todos los prerrequisitos iOS están correctos en el cliente (entitlements, app.json, PushKit). La causa más probable de que no lleguen notificaciones iOS es **externa al código revisado**:

1. **Token VoIP no registrado:** Si el dispositivo de prueba nunca llamó a `PushKit.register()` con éxito y sincronizó el token VoIP al servidor, el backend no puede enviar el push VoIP. El flujo de registro en `_layout.tsx` es correcto pero depende de que el build tenga los entitlements compilados.

2. **Build sin prebuild aplicado:** Los archivos `.entitlements` en `ios/EGCHAT/` solo tienen efecto si el build fue generado con `expo prebuild` o `eas build`. Un build anterior (sin esos entitlements compilados) no los usará aunque los archivos existan.

3. **`APNS_ENV` en Supabase:** Si `APNS_ENV=sandbox` pero se está usando un build de producción (App Store / TestFlight), el push VoIP llegará al endpoint sandbox pero el dispositivo espera producción. Verificar en Supabase Dashboard → Edge Functions → Secrets.

---

## Conclusiones y Prioridad de Fixes

### 🔴 Crítico — Hacer antes del próximo build

1. **`egchat-api/index.js` línea 5430** (Render backend): cambiar `'egchat-calls'` → `'egchat-calls-v2'`. **Este es el fix más impactante** — afecta a todos los usuarios Android con token Expo.

2. **`app/_layout.tsx`** (AppState listener para background → foreground): agregar el listener de AppState que llame `consumePendingCall()` cuando la app regresa del background. Sin esto, aceptar una llamada con la app en background no navega a la pantalla de llamada.

### 🟡 Medio — Hacer en el mismo PR

3. **`supabase/functions/deliver-call-push/index.ts` línea 227**: cambiar `'egchat-calls'` → `'egchat-calls-v2'` en el fallback Expo Push.

4. **`src/pushDiagnostic.ts` líneas 78–79**: actualizar la comprobación a `egchat-calls-v2` para que el diagnóstico sea preciso.

---

*Reporte generado por investigación de solo lectura — no se modificó ningún archivo.*
