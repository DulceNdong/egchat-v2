# Investigación: Llamadas entrantes Android no funcionan

**Fecha:** Investigación estática — sin modificar código  
**Ruta base:** `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile/`

---

## Resumen ejecutivo

Hay **tres causas raíz independientes** que juntas impiden completamente que las llamadas funcionen en Android:

1. **[CRÍTICO] El backend desplegado en Render NO tiene firebase-admin** — las llamadas se envían únicamente vía Expo Push (JSON con campo `notification`), no como FCM data-only. Cuando la app está en background/cerrada, FCM intercepta el mensaje `notification` y nunca llega a `EGChatFirebaseMessagingService.onMessageReceived()`.

2. **[CRÍTICO] `EGChatFirebaseMessagingService` compite con el handler de Expo** — el `meta-data` `default_notification_channel_id` en el `AndroidManifest.xml` hace que el FCM SDK de Firebase maneje automáticamente cualquier mensaje con campo `notification`, sin invocar al servicio personalizado.

3. **[MAYOR] Al aceptar la llamada, `EGChatCallActionReceiver` lanza `getLaunchIntent`** — esto abre MainActivity, pero el JS tarda 15 segundos (por `androidBackgroundDelay`) en registrar el `setGlobalUserId`, lo que hace que el AppState listener que busca la pending call NO se ejecute porque `globalUserId` es `null` en ese momento.

---

## Causa raíz 1 — El backend desplegado no envía FCM data-only

### Evidencia

**Archivo desplegado en Render:** `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-api/package.json`

```json
"dependencies": {
  "@supabase/supabase-js": "^2.39.0",
  "bcryptjs": "^2.4.3",
  "busboy": "^1.6.0",
  "cors": "^2.8.5",
  "dotenv": "^17.4.1",
  "express": "^4.18.2",
  "jsonwebtoken": "^9.0.2",
  "pg": "^8.23.1",
  "twilio": "^6.0.0",
  "web-push": "^3.6.7"
}
```

**`firebase-admin` NO está en las dependencias del backend desplegado.**  
Solo existe en `server/egchat-api/package.json` (versión 2.6.0, no desplegada).

**Archivo desplegado:** `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-api/index.js`, líneas 5385–5480  
`sendPushToUser()` solo envía vía:
1. Web Push (navegador/PWA) — no aplica a Android nativo
2. Expo Push API (`https://exp.host/--/api/v2/push/send`) con un objeto que incluye:

```js
{
  to: sub.token,
  title: ...,
  body: ...,
  channelId: 'egchat-calls-v2',
  priority: 'high',
  data: { notificationType: 'incoming_call', callId: ..., callerName: ..., ... }
}
```

**El problema:** La Expo Push API convierte esto en un mensaje FCM que contiene **tanto `notification` como `data`**. Cuando la app está en background o cerrada, el Firebase Messaging SDK intercepta cualquier mensaje con campo `notification` y muestra la notificación del sistema directamente, **sin invocar `EGChatFirebaseMessagingService.onMessageReceived()`**.

Para que `onMessageReceived()` sea invocado con app en background/cerrada, el mensaje FCM debe ser **data-only** (sin campo `notification`), que es lo que hace `sendFcmPushes()` del backend `server/egchat-api/index.js` (líneas 7008–7048). Pero ese backend NO está desplegado en Render.

### Flujo actual (roto)

```
caller envía llamada
→ /api/call/offer (egchat-api/index.js línea 4822)
→ sendPushToUser() → Expo Push API
→ FCM entrega mensaje con {notification + data}
→ FCM SDK intercepta → muestra notificación estándar del sistema
→ EGChatFirebaseMessagingService.onMessageReceived() NUNCA se llama
→ EGChatCallNotifier.showIncomingCall() NUNCA se llama
→ EGChatIncomingCallActivity NUNCA se lanza
→ La pantalla de llamada entrante NO aparece
```

### Flujo correcto (no desplegado)

```
→ sendFcmPushes() → Firebase Admin SDK
→ FCM entrega mensaje data-only (sin campo notification)
→ EGChatFirebaseMessagingService.onMessageReceived() se llama
→ data["notificationType"] == "incoming_call" → showIncomingCall()
→ fullScreenIntent → EGChatIncomingCallActivity aparece
```

---

## Causa raíz 2 — El canal `default_notification_channel_id` anula el servicio FCM

### Evidencia

**Archivo:** `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile/android/app/src/main/AndroidManifest.xml`

```xml
<meta-data 
  android:name="com.google.firebase.messaging.default_notification_channel_id" 
  android:value="egchat-messages"/>
```

Este `meta-data` instruye al Firebase Messaging SDK para que, cuando procesa automáticamente mensajes con campo `notification` (app en background), use el canal `egchat-messages` para mostrarlos. **No es el problema principal**, pero confirma que el sistema está diseñado para que FCM maneje las notificaciones de mensajes sin pasar por el servicio personalizado.

El problema real es que incluso si se enviara un mensaje con campo `notification` y `data`, el SDK de FCM lo intercepta antes de que llegue a `EGChatFirebaseMessagingService`. Solo un mensaje **exclusivamente data** (`message.data` sin `message.notification`) pasa por `onMessageReceived()` cuando la app está en background.

---

## Causa raíz 3 — El `androidBackgroundDelay` de 15 segundos impide procesar la llamada al aceptar

### Evidencia

**Archivo:** `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile/app/_layout.tsx`, líneas ~765–771

```typescript
const androidBackgroundDelay = Platform.OS === 'android' ? 15000 : 0;
const realtimeStartTimer = setTimeout(() => {
  if (mounted) setGlobalUserId(String(me.id));
}, androidBackgroundDelay);
```

`setGlobalUserId()` se retrasa **15 segundos** para no saturar el hilo JS en Android de gama media/baja.

**El AppState listener** (líneas ~241–295) que procesa las llamadas pendientes al volver del background tiene una guarda:

```typescript
const sub = AppState.addEventListener('change', async (state) => {
  if (state !== 'active') return;
  if (isProcessingCallRef.current) return;
  if (!globalUserId) return;  // ← BLOQUEA si globalUserId es null
  // ...
  const pending = await consumePendingCall();
```

**Flujo del problema:**

```
usuario acepta desde la notificación (app en background ~3s)
→ EGChatCallActionReceiver.onReceive() guarda PENDING_ACTION en SharedPreferences
→ lanza getLaunchIntentForPackage() → MainActivity se abre
→ _layout.tsx monta → init() corre → setGlobalUserId se retrasa 15s
→ AppState dispara 'active' pero globalUserId === null → se salta consumePendingCall()
→ los 15s pasan → setGlobalUserId se actualiza → pero el AppState ya disparó
→ la pending call en SharedPreferences NO se consume
→ no hay navegación a /call/[callId]
→ la pantalla de llamada NO abre
```

### Nota: el flujo `consumePendingAction` inicial también falla

En `_layout.tsx` (líneas ~693–730), hay un `consumePendingAction()` que intenta leer la acción pendiente durante `init()`. Sin embargo, tiene esta condición:

```typescript
const stillPending = await consumePendingCall();
if (stillPending && mounted) { router.push(...) }
// Si ya expiró, no hacer nada — la llamada terminó
```

`consumePendingCall()` llama a `NativeCallKit.getAndClearPendingCall()` que lee `PENDING_CALL` de SharedPreferences. **Pero** en el flujo de "usuario pulsó Contestar", `EGChatCallActionReceiver` llama a `EGChatCallNotifier.clear(context, callId)` que **cancela la notificación pero no borra el PENDING_CALL de SharedPreferences**. Sin embargo, `recordCallAction()` sí actualiza el PENDING_CALL para añadirle el campo `action: "answer"`.

Por lo tanto `consumePendingCall()` devuelve el payload con `action: "answer"`, y `navigatePendingCall()` (líneas ~623–660) navega a la ruta correcta con `autoAccept: '1'`. Este flujo funciona **si** se ejecuta con el router ya listo y **antes** de que el PENDING_CALL se limpie o expire. El problema es que `navigatePendingCall()` se llama en la inicialización sin restricción de `globalUserId`, así que este flujo específico **podría funcionar** si la app estaba completamente cerrada. Sin embargo, si la app estaba en background, el `consumePendingCall()` inicial ya habrá intentado y fallado (porque la llamada llegó pero no se pulsó Contestar todavía), y cuando el usuario pulsa Contestar después, el AppState no lo recoge por el `globalUserId === null`.

---

## Causa raíz 4 — El PENDING_CALL no incluye `callerAvatar`

### Evidencia

**Backend desplegado** `/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-api/index.js`, línea 4829:

```javascript
await sendPushToUser(targetUserId, {
  title: ...,
  body: ...,
  tag: `call-${callId}`,
  callId, callerId: req.user.id, callerName,
  callType: type || 'audio', notificationType: 'incoming_call',
  // callerAvatar NO ESTÁ AQUÍ
});
```

`callerAvatar` **no se incluye** en el payload FCM del backend desplegado (en `egchat-api/index.js`). La versión en `server/egchat-api/index.js` sí la incluye (línea 6275: `callerAvatar: caller?.avatar_url || ''`).

Esto es un problema secundario: `EGChatCallNotifier.storePendingCall()` y `EGChatIncomingCallActivity` obtendrán `callerAvatar: ""`, y la pantalla de llamada del app mostrará un avatar genérico.

---

## Resumen de archivos y líneas con problemas

| Archivo | Línea | Problema |
|---|---|---|
| `egchat-api/package.json` | — | No tiene `firebase-admin` → no puede enviar FCM data-only |
| `egchat-api/index.js` | 5385–5480 | `sendPushToUser()` solo usa Expo Push (genera mensajes `notification+data`) |
| `egchat-api/index.js` | 4829–4834 | Payload de `/api/call/offer` no incluye `callerAvatar` |
| `egchat-mobile/app/_layout.tsx` | ~766–770 | `setGlobalUserId` con 15s de delay bloquea el AppState listener |
| `egchat-mobile/app/_layout.tsx` | ~254 | `if (!globalUserId) return` anula el consumePendingCall en AppState |
| `egchat-mobile/android/app/.../AndroidManifest.xml` | — | `default_notification_channel_id` no es problema en sí, pero confirma dependencia del SDK automático |

---

## Fixes concretos

### Fix 1 — Desplegar el backend correcto en Render (CRÍTICO)

**El backend `server/egchat-api/` (versión 2.6.0) ya tiene todo lo necesario:**
- `firebase-admin` en dependencias
- `sendFcmPushes()` que envía mensajes data-only
- Lógica que prioriza FCM para Android sobre Expo Push

**Pasos:**
1. Verificar que el Render service apunta a `server/egchat-api/` en lugar de `egchat-api/`
2. Configurar la variable de entorno `FIREBASE_SERVICE_ACCOUNT_JSON` en Render con el JSON del Service Account de Firebase (archivo `google-services.json` tiene el `project_id` pero el Service Account se descarga desde Firebase Console > Project Settings > Service Accounts)
3. Hacer `git push origin mobile` con `server/egchat-api/` como directorio raíz del servicio, o actualizar el `render.yaml`

**Si no se puede cambiar el backend desplegado inmediatamente**, el fix alternativo es hacer que el backend actual (`egchat-api/index.js`) envíe también un FCM data-only usando la API HTTP v1 de Firebase directamente (sin sdk), añadiendo un bloque adicional en `sendPushToUser()`.

### Fix 2 — Reducir o eliminar `androidBackgroundDelay` para llamadas (MAYOR)

**Archivo:** `egchat-mobile/app/_layout.tsx`

El delay de 15s existe para no saturar el hilo JS al arrancar. Pero bloquea el procesamiento de llamadas pendientes. La solución es separar `setGlobalUserId` del procesamiento de llamadas:

```typescript
// ANTES (roto):
const androidBackgroundDelay = Platform.OS === 'android' ? 15000 : 0;
const realtimeStartTimer = setTimeout(() => {
  if (mounted) setGlobalUserId(String(me.id));
}, androidBackgroundDelay);

// DESPUÉS (fix):
// Establecer globalUserId INMEDIATAMENTE para que el AppState listener funcione
if (mounted) setGlobalUserId(String(me.id));

// Diferir solo los servicios costosos (SSE, presencia, heartbeat)
const androidBackgroundDelay = Platform.OS === 'android' ? 15000 : 0;
// Los timers de presenceStartTimer, realtimeStartTimer, etc. mantienen el delay
// pero globalUserId ya está disponible para el AppState listener de llamadas
```

O más quirúrgicamente, cambiar la guarda del AppState listener para que use `me.id` directamente (una ref) en lugar de `globalUserId`:

```typescript
// En lugar de: if (!globalUserId) return;
// Usar una ref que se establece inmediatamente:
const userIdRef = useRef<string | null>(null);
// y en init(), antes del delay:
userIdRef.current = String(me.id);
// y en el AppState listener:
if (!userIdRef.current) return;
```

### Fix 3 — Añadir `callerAvatar` al payload de `/api/call/offer` en el backend desplegado

**Archivo:** `egchat-api/index.js`, línea 4829

```javascript
// ANTES:
await sendPushToUser(targetUserId, {
  title: ..., body: ..., tag: ...,
  callId, callerId: req.user.id, callerName,
  callType: type || 'audio', notificationType: 'incoming_call',
});

// DESPUÉS:
await sendPushToUser(targetUserId, {
  title: ..., body: ..., tag: ...,
  callId, callerId: req.user.id, callerName,
  callerAvatar: caller?.avatar_url || '',  // ← añadir esta línea
  callType: type || 'audio', notificationType: 'incoming_call',
});
```

---

## Análisis del flujo cuando la app ESTÁ ABIERTA (foreground)

Cuando la app está en primer plano, el flujo es diferente y **podría funcionar parcialmente**:

1. Expo Push llega → `setNotificationHandler` lo captura (porque la app está activa y el FCM SDK no lo intercepta automáticamente)
2. `addNotificationReceivedListener` en `notifications.ts` (línea ~265) recibe el evento con `data.notificationType === 'incoming_call'`
3. Llama a `handleIncomingCall()` en `setupNotificationListeners`
4. Que llama al callback `onCall` que viene de `_layout.tsx`
5. Que llama al `handleIncomingCall()` de `_layout.tsx` que hace `setIncomingCall(payload)`
6. `IncomingCallOverlay` aparece

**Conclusión:** Con la app abierta, el overlay SÍ debería aparecer. El hecho de que tampoco aparezca sugiere que o bien `globalUserId` aún no está establecido (el listener de notificaciones se registra 2s después del auth), o hay un problema con el deduplicado entre el `receivedSub` y `responseSub`.

---

## Conclusión final

El problema fundamental es que **el backend en producción (Render) es `egchat-api/` versión 2.5.0, que no tiene `firebase-admin`** y solo puede enviar Expo Push. Los mensajes Expo Push son mensajes FCM con campo `notification`, y Firebase los intercepta antes de que lleguen a `EGChatFirebaseMessagingService.onMessageReceived()`. Todo el código nativo Kotlin (`EGChatCallNotifier`, `EGChatIncomingCallActivity`, `EGChatCallActionReceiver`) es correcto y está bien configurado — simplemente nunca llega a ejecutarse porque la entrada (el mensaje FCM data-only) nunca llega.

El fix principal es desplegar el backend en `server/egchat-api/` (v2.6.0) con `FIREBASE_SERVICE_ACCOUNT_JSON` configurado en Render. Sin ese cambio, ningún fix en el código nativo tendrá efecto.
