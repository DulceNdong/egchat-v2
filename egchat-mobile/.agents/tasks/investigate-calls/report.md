# Investigación: Llamadas que no llegan al destinatario

## Respuesta directa

Las llamadas no llegan porque **los módulos nativos de Android (`EGChatCallModule.kt`, `EGChatFirebaseMessagingService.kt`, `CallActionReceiver.kt`, `CallForegroundService.kt`) existen solamente en el subdirectorio interno `egchat-v2/egchat-mobile/android/` y NO están presentes en el directorio real del proyecto `egchat-mobile/android/app/src/main/java/com/egchat/app/`**. El build del APK que llega a los dispositivos no incluye estos módulos, de modo que en Android no existe receptor de FCM para llamadas entrantes ni módulo nativo para mostrar notificaciones de pantalla completa. En iOS el problema puede ser diferente: depende de si `SERVICE_TOKEN` y las credenciales APNs (`APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`) están configuradas en el backend Render y en la Edge Function de Supabase.

---

## Flujo esperado vs. flujo real

### Flujo esperado (diseño)

```
Caller pulsa "llamar"
  → CallManager.startCall()
      → callAPI.offer() → backend guarda call_sessions
      → callAPI.sendVoipPush() → POST /api/push/voip-call
  → Backend /api/push/voip-call
      → llama Edge Function deliver-call-push
  → Edge Function deliver-call-push
      → get_call_delivery_tokens (Supabase RPC)
      → iOS: sendAPNsVoIPPush() → APNs VoIP → PushKit despierta app
      → Android: sendFCMCallPush() → FCM data-only → FirebaseMessagingService procesa
  → Receptor recibe evento nativo
      → iOS: EGChatPushKitModule.didReceiveIncomingPushWith() → CallKit UI
      → Android: EGChatFirebaseMessagingService.onMessageReceived() → notificación full-screen
  → JS en receptor recibe evento
      → callManager.registerIncoming()
      → Router navega a /call/[callId] con role=callee
```

### Flujo real (lo que ocurre)

**En Android:**
- El APK compilado no tiene `EGChatFirebaseMessagingService`, `EGChatCallModule`, `CallActionReceiver` ni `CallForegroundService` — están solo en `egchat-v2/egchat-mobile/android/`, que es una copia duplicada ignorada por el sistema de build.
- `MainApplication.kt` no registra ningún paquete personalizado (solo `PackageList(this).packages` autolinker estándar, que no incluye estos módulos).
- FCM llega pero no hay ningún servicio que lo procese → el SO descarta la notificación o muestra una alerta genérica vacía.
- `NativeCallKit.getAndClearPendingCall()` en `notifications.ts` llama a `EGChatCallModule.getAndClearPendingCall()`, que retornará `null` o lanzará error porque el módulo no existe en el build → la llamada pendiente nunca se consume.

**En iOS (posiblemente):**
- `EGChatCallModule.swift` y `EGChatPushKitModule.swift` **sí existen** en `ios/EGCHAT/` y están bien escritos.
- El problema probable es que la Edge Function `deliver-call-push` falla porque `SERVICE_TOKEN` o las credenciales APNs no están configuradas en Supabase Dashboard → el backend cae al fallback Expo Push estándar.
- La fallback Expo Push usa `ExponentPushToken[...]` que requiere un build EAS con `projectId` registrado. Si el APK/IPA fue compilado con Xcode directo (sin EAS, como se menciona en la conversación del usuario), `Notifications.getExpoPushTokenAsync()` falla y en su lugar se obtiene el token nativo `deviceToken`, que **no es compatible con la Expo Push API** (`exp.host`).
- Resultado: ni el token VoIP ni el token Expo funcionan → no hay push → no hay llamada entrante.

---

## Evidencia detallada

### 1. Android: módulos nativos ausentes del build real

**Módulos que existen solo en la copia duplicada (`egchat-v2/egchat-mobile/android/`) y NO en el directorio de build (`egchat-mobile/android/`):**

| Archivo | Función |
|---|---|
| `com/egchat/app/modules/EGChatCallModule.kt` | Muestra notificación de llamada full-screen, emite eventos JS `callAnswered`/`callRejected`/`callEnded`, expone `getAndClearPendingCall()` |
| `com/egchat/app/services/EGChatFirebaseMessagingService.kt` | Recibe FCM data-only messages, guarda `pending_call` en SharedPreferences, despierta la app |
| `com/egchat/app/modules/CallActionReceiver.kt` | (referenciado desde EGChatCallModule) — BroadcastReceiver para botones de notificación |
| `com/egchat/app/services/CallForegroundService.kt` | (referenciado desde EGChatCallModule) — mantiene llamada activa en background |

**Prueba directa:**
```
# Estos archivos EXISTEN:
egchat-mobile/egchat-v2/egchat-mobile/android/app/src/main/java/com/egchat/app/modules/EGChatCallModule.kt
egchat-mobile/egchat-v2/egchat-mobile/android/app/src/main/java/com/egchat/app/services/EGChatFirebaseMessagingService.kt

# Estos archivos NO EXISTEN en el build real:
egchat-mobile/android/app/src/main/java/com/egchat/app/  ← solo contiene MainActivity.kt y MainApplication.kt
```

**`MainApplication.kt` (build real) — sin paquetes personalizados:**
```kotlin
// egchat-mobile/android/app/src/main/java/com/egchat/app/MainApplication.kt
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // add(MyReactNativePackage())
    }
```
→ `EGChatCallModule` no es autolinkeable (no tiene `package.json` como módulo npm), por tanto nunca se registra.

**`AndroidManifest.xml` (build real)** no declara:
- `<service android:name=".services.EGChatFirebaseMessagingService">` con `RECEIVE` intent de FCM
- `<receiver android:name=".modules.CallActionReceiver">`
- `<service android:name=".services.CallForegroundService">`

→ Aunque los archivos existieran, el servicio FCM no se activaría.

**Consecuencia en tiempo de ejecución:**
```typescript
// src/native/CallKit.ts
const { EGChatCallModule } = NativeModules;
const isAvailable = !!EGChatCallModule && Platform.OS !== 'web';
// isAvailable = false en el APK real → todas las funciones son no-ops
```

```typescript
// src/notifications.ts — consumePendingCall()
const { NativeCallKit } = await import('./native/CallKit');
const nativeJson = await NativeCallKit.getAndClearPendingCall();
// Retorna null siempre → la llamada pendiente nunca se recupera
```

### 2. iOS: fallo en la cadena de entrega push

**Ruta crítica — `/api/push/voip-call` en el backend:**
```javascript
// egchat-api/index.js — líneas 5592-5610
const edgeFnUrl = process.env.SUPABASE_URL
  ? `${process.env.SUPABASE_URL}/functions/v1/deliver-call-push`
  : null;

if (!edgeFnUrl || !process.env.SERVICE_TOKEN) {
  console.warn('[voip-call] Edge Function no configurada — usando fallback Expo Push');
  await sendPushToUser(targetUserId, { ... });
  return res.json({ voipPushSent: false, expoPushSent: true, fallback: true });
}
```

El `.env` del backend **tiene `SUPABASE_URL`** pero `SERVICE_TOKEN` no fue confirmado. Si `SERVICE_TOKEN` no está en las variables de entorno de Render, el backend cae al fallback `sendPushToUser`, que envía Expo Push estándar (no VoIP).

**Fallo del token en builds sin EAS:**
```typescript
// src/notifications.ts — registerForPushNotifications()
try {
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId ...
  });
  expoPushToken = tokenData.data;  // "ExponentPushToken[...]"
} catch (e) {
  // Expo push token requires EAS registration. Falls back to native device token.
  const nativeToken = await Notifications.getDevicePushTokenAsync();
  expoPushToken = nativeToken.data as string;  // APNs device token hex bruto
}
```

Si el build fue hecho con Xcode sin EAS, `getExpoPushTokenAsync` lanza excepción y se usa el APNs device token bruto. Este token se guarda con `tokenType = 'fcm'` (o `'apns'`):
```typescript
// src/notifications.ts
const isExpoToken = expoPushToken.startsWith('ExponentPushToken');
const tokenType   = isExpoToken ? 'expo' : (Platform.OS === 'ios' ? 'apns' : 'fcm');
// → tokenType = 'apns' para iOS sin EAS
```

Pero la Edge Function busca tokens con `token_type = 'voip'` (no `'apns'`) para iOS. El token APNs device token bruto NO es un token VoIP PushKit — son canales separados en Apple. Así, `get_call_delivery_tokens` retorna `voipTokens = []` para este dispositivo → `no_registered_tokens` → no se entrega ningún push.

**El token VoIP viene de PushKit, no de expo-notifications:**
```typescript
// app/_layout.tsx
PushKit.register();
pushTokenCleanup.current = PushKit.onTokenUpdated(async (voipToken) => {
  const { syncVoIPTokenWithServer } = await import('../src/notifications');
  await syncVoIPTokenWithServer(voipToken);  // POST /api/push/register-voip-token
});
```
→ Si el módulo nativo `EGChatPushKitModule` no está cargado (ej. Expo Go, o build que no incluyó la compilación nativa), `PushKit.register()` es no-op y el token VoIP nunca se registra.

### 3. Señalización WebRTC: polling funciona pero solo si el receptor está en la app

Incluso si el push llegara, el flujo de señalización WebRTC usa polling HTTP sobre el backend Render:

```typescript
// CallManager.ts — _startPoll() — POLL_FAST_ANDROID = 1400ms
this._pollingTimer = setInterval(async () => {
  const s = await callAPI.get(this._session!.callId);
  // caller: espera answer y callee ICE candidates
  // callee: espera ICE candidates del caller
}, INTERVAL);
```

Supabase Realtime está configurado para `call_sessions` (estado) y `call_signals` (ICE/SDP) como complemento al polling. Esto funciona correctamente **si y solo si el callee ha ejecutado `acceptCall()`**, lo que requiere primero haber llegado a la pantalla `/call/[callId]` — que requiere recibir el push.

### 4. `sendVoipPush` se llama demasiado pronto (race condition)

```typescript
// CallManager.ts — startCall()
const offer = await pc.createOffer({});
await pc.setLocalDescription(offer);
this._setPcState('connecting');

callAPI.sendVoipPush({ targetUserId, callId, callType, offer: pc.localDescription }).catch(() => {});

// ... glare detection ...
await callAPI.offer({ callId, offer: pc.localDescription, targetUserId, type: callType });
```

`sendVoipPush` se llama **antes** de `callAPI.offer()`. El receptor puede recibir el push y hacer `acceptCall()` antes de que `call_sessions` tenga el offer registrado. El callee llama `_fetchOfferWithRetry()` (hasta 6 intentos × 3s = 18s) para recuperar el offer, lo que introduce latencia innecesaria. En casos de red lenta esto puede hacer que el callee expire antes de obtener el offer.

---

## Conclusiones

### Causa raíz principal (Android)

Los módulos nativos de Android **nunca se incorporaron al build real de `egchat-mobile/`**. El directorio `egchat-mobile/android/app/src/main/java/com/egchat/app/` solo tiene `MainActivity.kt` y `MainApplication.kt`. Sin `EGChatFirebaseMessagingService`, FCM llega al dispositivo pero nadie lo procesa para activar la UI de llamada.

### Causa raíz secundaria (iOS y Android)

El backend solo usa la Edge Function si `SERVICE_TOKEN` está configurado en Render. Si no lo está, usa `sendPushToUser` que envía Expo Push estándar. Para builds compilados directamente con Xcode (sin EAS), el token registrado es un APNs device token bruto, incompatible con la Expo Push API. El token VoIP real viene de PushKit (`EGChatPushKitModule`) y puede no estar registrado si el módulo nativo no está activo.

---

## Recomendaciones (sin tocar código)

### Fix 1 (CRÍTICO — Android): Copiar los módulos nativos al directorio correcto

Copiar todos los archivos de `egchat-mobile/egchat-v2/egchat-mobile/android/app/src/main/java/com/egchat/app/` al directorio real `egchat-mobile/android/app/src/main/java/com/egchat/app/`:

- `modules/EGChatCallModule.kt`
- `modules/CallActionReceiver.kt` (inferido como existente, referenciado por EGChatCallModule)
- `services/EGChatFirebaseMessagingService.kt`
- `services/CallForegroundService.kt`

Registrar `EGChatCallModule` en `MainApplication.kt`:
```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
      add(EGChatCallPackage())  // o registrar directamente el módulo
    }
```

Actualizar `AndroidManifest.xml` para declarar el servicio FCM:
```xml
<service
  android:name=".services.EGChatFirebaseMessagingService"
  android:exported="false">
  <intent-filter>
    <action android:name="com.google.firebase.MESSAGING_EVENT" />
  </intent-filter>
</service>
<receiver android:name=".modules.CallActionReceiver" android:exported="false">
  <intent-filter>
    <action android:name="com.egchat.app.CALL_ANSWER"/>
    <action android:name="com.egchat.app.CALL_REJECT"/>
    <action android:name="com.egchat.app.CALL_END"/>
  </intent-filter>
</receiver>
```

### Fix 2 (CRÍTICO — Backend): Configurar `SERVICE_TOKEN` en Render

Agregar la variable de entorno `SERVICE_TOKEN` en el dashboard de Render del backend `egchat-api`. Debe coincidir exactamente con el valor del secret `SERVICE_TOKEN` configurado en Supabase Dashboard → Edge Functions → Secrets.

### Fix 3 (CRÍTICO — iOS): Configurar credenciales APNs en Supabase Edge Functions

En Supabase Dashboard → Project → Edge Functions → Secrets, verificar que existen:
- `APNS_KEY_P8` — contenido del `.p8` sin headers
- `APNS_KEY_ID` — 10 caracteres (ej. `ABC1234567`)
- `APNS_TEAM_ID` — 10 caracteres del Apple Developer Program
- `APNS_BUNDLE_ID` — `com.jallzstores.egchat`
- `APNS_ENV` — `production` (o `sandbox` para TestFlight)
- `FCM_SERVICE_ACCOUNT_JSON` — JSON completo del Service Account de Firebase
- `FCM_PROJECT_ID` — ID del proyecto Firebase (ej. `egchat-4efe7`)

### Fix 4 (CRÍTICO — iOS): Verificar que la Edge Function `deliver-call-push` está desplegada

```bash
cd egchat-mobile
npx supabase functions deploy deliver-call-push
```

Si no está desplegada, todas las llamadas iOS fallan aunque las credenciales estén configuradas.

### Fix 5 (Recomendado): Ejecutar la migración SQL de tokens

El archivo `egchat-mobile/supabase-device-tokens-migration.sql` debe ejecutarse en Supabase SQL Editor para crear:
- Columnas `token_type`, `is_active`, `failure_count` en `expo_push_tokens`
- Tabla `push_delivery_log`
- RPCs `get_call_delivery_tokens`, `mark_token_failed`, `register_device_token`

Sin esta migración, la Edge Function `deliver-call-push` falla en el paso 5 (`get_call_delivery_tokens` devuelve error) y no entrega ningún push.

### Fix 6 (Menor): Reordenar `sendVoipPush` después de `callAPI.offer()`

En `CallManager.ts → startCall()`, mover `callAPI.sendVoipPush()` para que se ejecute después de `callAPI.offer()`:
```typescript
await callAPI.offer({ callId, offer: pc.localDescription, targetUserId, type: callType });
// Ahora el offer está en la DB antes de que el callee lo intente leer
callAPI.sendVoipPush({ ... }).catch(() => {});
```

---

## Prioridad de fixes

| # | Fix | Impacto | Plataforma |
|---|---|---|---|
| 1 | Copiar módulos nativos Android al directorio correcto | Llama = funciona en Android | Android |
| 2 | `SERVICE_TOKEN` en Render | Edge Function se activa | Ambas |
| 3 | Credenciales APNs/FCM en Supabase Secrets | VoIP push funciona en iOS | iOS |
| 4 | Deploy Edge Function deliver-call-push | Push se entrega | Ambas |
| 5 | SQL migration para RPCs de tokens | Edge Function funciona | Ambas |
| 6 | Reordenar sendVoipPush después de offer | Menos latencia/fallos | Ambas |
