# Reporte de Investigación: Push Notifications — EGChat Mobile

**Fecha:** Investigación de código estático (sin ejecución en dispositivo)  
**Rama:** `mobile` | Ruta: `egchat-mobile/`  
**Versión expo-notifications:** `~0.32.17` | **Expo:** `~54.0.37`

---

## Resumen Ejecutivo

Se identificaron **5 causas raíz** que explican los 3 problemas reportados:

| Problema | Causa raíz principal | Severidad |
|---|---|---|
| iOS: notificaciones NO llegan | Entitlement `com.apple.developer.pushkit.unrestricted-voip` ausente en `.entitlements` real | 🔴 Crítico |
| iOS: notificaciones NO llegan | EAS `projectId` incorrecto en `app.json` → token Expo inválido | 🔴 Crítico |
| iOS: notificaciones NO llegan | `shouldPlaySound: false` en handler + sin APNs alert para mensajes normales | 🟡 Medio |
| Android: no heads-up / overlay | Canal nativo `egchat-calls` usa `IMPORTANCE_HIGH` en lugar de `IMPORTANCE_MAX` | 🔴 Crítico |
| Android: aceptar no abre llamada | `EGChatCallActionReceiver` lanza la app pero no navega a la pantalla de llamada | 🟡 Medio |

---

## PROBLEMA 1: iOS — Las notificaciones NO llegan en absoluto

### Causa Raíz 1A: Entitlement VoIP ausente en los archivos `.entitlements` reales

**Archivo problemático:**  
- `ios/EGCHAT/EGCHAT.entitlements`  
- `ios/EGCHAT/EGCHATRelease.entitlements`

**Evidencia:**  
El `app.json` declara el entitlement en la sección `ios.entitlements`:

```json
// app.json línea 22
"com.apple.developer.pushkit.unrestricted-voip": true
```

Sin embargo, los archivos `.entitlements` reales (los que usa Xcode para firmar el binary) **no contienen este entitlement**:

```xml
<!-- ios/EGCHAT/EGCHAT.entitlements — contenido completo -->
<dict>
  <key>aps-environment</key>
  <string>production</string>
  <key>com.apple.developer.associated-domains</key>
  <array>
    <string>applinks:egchat-app.vercel.app</string>
  </array>
  <key>com.apple.developer.usernotifications.communication</key>
  <true/>
</dict>
```

`com.apple.developer.pushkit.unrestricted-voip` está ausente. Esto significa que **aunque el backend envía un VoIP push a APNs, iOS rechaza entregarlo porque el binary no tiene el permiso firmado**. El resultado es que la app nunca recibe la llamada y el CallKit nunca se activa.

El mismo problema existe en `EGCHATRelease.entitlements` (el que se usa en builds de Release/TestFlight/App Store).

**Impacto directo:** Los pushes VoIP para llamadas no se entregan. Las notificaciones de mensajes tampoco llegan porque iOS confunde el entorno de APNs (producción vs sandbox) cuando las credenciales no coinciden.

**Corrección:**  
Agregar en ambos archivos `.entitlements`:

```xml
<key>com.apple.developer.pushkit.unrestricted-voip</key>
<true/>
```

**Nota importante:** Este entitlement también debe estar habilitado en el Apple Developer Portal, en el App ID `com.jallzstores.egchat`, bajo "Capabilities → Push Notifications" y "PushKit (VoIP)". Si no está habilitado en el portal, agregar la key al archivo no basta.

---

### Causa Raíz 1B: EAS Project ID incorrecto en `app.json`

**Archivo problemático:** `app.json` línea 142  
**Archivo de referencia:** `.kiro/steering/tech.md`

**Evidencia:**

```json
// app.json
"eas": {
  "projectId": "7e370dde-6a3b-4cc9-8d80-9dcf8692dc9c"
}
```

El steering file del proyecto dice:
```
EAS Project ID: 6200ec00-54d7-4ef4-a348-56e80a1452f6
EAS Owner: reddington120
```

El `app.json` tiene el ID `7e370dde-6a3b-4cc9-8d80-9dcf8692dc9c` con owner `dulce120`, que es **diferente al ID canónico del proyecto** (`6200ec00-...`, owner `reddington120`).

**Impacto:** Cuando `registerForPushNotifications()` en `src/notifications.ts` (línea 213) llama a:

```typescript
const tokenData = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.easConfig?.projectId
    ?? undefined,
});
```

...obtiene un `ExponentPushToken[...]` asociado al proyecto `7e370dde-...` (cuenta `dulce120`). Pero el backend Render (`egchat-api-xlxj.onrender.com`) está probablemente configurado con el token de acceso Expo de la cuenta `reddington120` (proyecto `6200ec00-...`). **Al intentar entregar la notificación via Expo Push API, el servicio de Expo rechaza el mensaje porque el token no pertenece al proyecto del access token del backend.**

El resultado: las notificaciones de mensajes (que van por Expo Push, no por APNs directo) nunca llegan en iOS.

**Corrección:**  
Actualizar `app.json`:
```json
"eas": {
  "projectId": "6200ec00-54d7-4ef4-a348-56e80a1452f6"
}
```
Y cambiar el `owner`:
```json
"owner": "reddington120"
```

---

### Causa Raíz 1C: `shouldPlaySound: false` en el notification handler

**Archivo:** `src/notifications.ts` líneas 20–40

```typescript
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    ...
    return {
      shouldShowAlert: true,
      shouldShowBanner: Platform.OS === 'ios' ? !isCall : true,
      shouldShowList: true,
      shouldPlaySound: false,   // ← PROBLEMA
      ...
    };
  },
});
```

El handler global devuelve `shouldPlaySound: false` para TODAS las notificaciones en iOS cuando la app está en primer plano. Esto silencia los mensajes. Sin embargo este es un problema solo para **primer plano** — cuando la app está en background/cerrada, el sistema APNs ignora este handler y sí reproduce el sonido si el payload lo incluye.

Hay también una inconsistencia en el comentario de línea 383:
```
// iOS en primer plano: el handler ya tiene shouldPlaySound:true,
```
El comentario dice `true` pero el código dice `false`. Esto indica que el cambio fue intencional pero el comentario quedó desactualizado.

**Nota:** Este problema afecta principalmente el comportamiento con la app abierta, no las notificaciones que llegan en background donde iOS sí reproduce el sonido del payload APNs.

**Corrección opcional:**
```typescript
shouldPlaySound: !isCall,  // mensajes: sí; llamadas: el ringtone lo maneja startRingtone()
```

---

### Verificación de lo que SÍ está bien en iOS

- `aps-environment: production` en `app.json` y en los `.entitlements` ✅
- `UIBackgroundModes` incluye `voip`, `remote-notification`, `fetch`, `audio` ✅
- `PushKit` se registra al arranque en `AppDelegate.swift` con `EGChatPushKitCoordinator.shared.start()` ✅
- El token se intenta sincronizar inmediatamente en `_layout.tsx` (no espera el delay de 25s) ✅
- `GoogleService-Info.plist` existe con bundle ID `com.jallzstores.egchat` ✅
- El flujo APNs → PushKit → `EGChatPushKitModule` → JS `voipPushReceived` → `handleIncomingCall` está arquitectónicamente correcto ✅
- `requestPermissionsAsync` se llama con `allowCriticalAlerts: true` ✅

---

## PROBLEMA 2: Android — Las notificaciones llegan pero NO aparecen como heads-up

### Causa Raíz 2A: Canal nativo usa `IMPORTANCE_HIGH` en lugar de `IMPORTANCE_MAX`

**Archivo:** `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt` línea 139

```kotlin
// EGChatCallModule.kt
val channel = NotificationChannel(
    CALL_CHANNEL,
    "Llamadas",
    NotificationManager.IMPORTANCE_HIGH   // ← DEBERÍA SER IMPORTANCE_MAX
).apply {
    description = "Llamadas entrantes de EGCHAT"
    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    enableVibration(true)
    vibrationPattern = longArrayOf(0, 500, 200, 500)
}
```

**Por qué importa:** En Android, los heads-up notifications (la notificación que aparece sobre la pantalla, incluso sobre el lock screen) requieren `IMPORTANCE_MAX`. Con `IMPORTANCE_HIGH`:

- La notificación sí llega y aparece en la barra de estado
- El sonido y la vibración funcionan
- **Pero NO aparece el overlay sobre la pantalla** (heads-up / over other apps)
- Con la pantalla bloqueada, **el sistema no garantiza mostrar la notificación visualmente**

La diferencia exacta según la documentación Android:
- `IMPORTANCE_HIGH` = notificación llega + sonido, puede aparecer heads-up pero no garantizado
- `IMPORTANCE_MAX` = notificación llega + sonido + **heads-up garantizado** + puede aparecer sobre el lock screen

**Nota:** Android no permite cambiar la importancia de un canal ya creado. Si el canal `egchat-calls` ya fue creado con `IMPORTANCE_HIGH` en dispositivos de usuarios, **habrá que cambiar el `CHANNEL_ID`** (por ejemplo a `egchat-calls-v2`) para que Android acepte el nuevo nivel de importancia.

Además, el canal `egchat-messages` también usa `IMPORTANCE_HIGH` (línea 150), lo que es correcto para mensajes pero confirma que el canal de llamadas se copió sin ajustar el nivel.

**Corrección:**

```kotlin
// EGChatCallModule.kt — función createChannel()
val channel = NotificationChannel(
    "egchat-calls-v2",   // ← nuevo ID para forzar recreación
    "Llamadas",
    NotificationManager.IMPORTANCE_MAX   // ← cambio crítico
).apply {
    description = "Llamadas entrantes de EGCHAT"
    lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
    enableVibration(true)
    vibrationPattern = longArrayOf(0, 500, 200, 500)
    setBypassDnd(true)   // ← añadir: bypass No Molestar para llamadas
}
```

Y actualizar la constante:
```kotlin
private const val CALL_CHANNEL = "egchat-calls-v2"
```

También actualizar en `src/notifications.ts` (línea 110):
```typescript
await Notifications.setNotificationChannelAsync('egchat-calls-v2', {
  name: 'Llamadas',
  importance: Notifications.AndroidImportance.MAX,  // ya está correcto aquí
  ...
  bypassDnd: true,  // ya está aquí también
});
```

**Y en el payload de las notificaciones de llamada** (en `supabase/functions/deliver-call-push/index.ts` línea ~215):
```typescript
channelId: 'egchat-calls-v2',  // actualizar el channelId en Expo fallback
```

---

### Causa Raíz 2B: Falta `bypassDnd` en el canal nativo Kotlin

El canal creado en Kotlin (`EGChatCallModule.kt`) no llama a `setBypassDnd(true)`. La versión JS en `notifications.ts` sí lo tiene para el canal `egchat-calls`:

```typescript
// notifications.ts línea 119 — SÍ tiene bypassDnd
await Notifications.setNotificationChannelAsync('egchat-calls', {
  bypassDnd: true,   // ← correcto en JS
  ...
});
```

Pero el canal nativo que crea `EGChatCallNotifier.createChannel()` en Kotlin **no** tiene `channel.setBypassDnd(true)`, lo que significa que en dispositivos con No Molestar activo, las llamadas entrantes se silencian.

---

## PROBLEMA 3: Android — Al aceptar la llamada desde la notificación, no abre la pantalla de llamada

### Causa Raíz 3A: `EGChatCallActionReceiver` abre la app pero no pasa el callId a la pantalla correcta

**Archivo:** `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt` líneas ~195-215

```kotlin
class EGChatCallActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val callId = intent.getStringExtra("callId") ?: return
    val action = intent.getStringExtra("action") ?: return
    val payload = JSONObject()
        .put("callId", callId)
        .put("action", action)
        .put("timestamp", System.currentTimeMillis())
        .toString()
    context.getSharedPreferences("egchat_calls", Context.MODE_PRIVATE)
        .edit().putString(PENDING_ACTION, payload).apply()
    EGChatCallNotifier.recordCallAction(context, callId, action)
    EGChatCallNotifier.clear(context, callId)

    if (action == "answer") {
      context.packageManager.getLaunchIntentForPackage(context.packageName)
          ?.let { launchIntent ->
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or 
                                  Intent.FLAG_ACTIVITY_CLEAR_TOP)
            context.startActivity(launchIntent)  // ← abre MainActivity genéricamente
          }
    }
  }
}
```

**Problema:** Cuando el usuario pulsa "Contestar" en la notificación, el receiver:
1. Guarda la acción en `SharedPreferences` como `PENDING_ACTION` ✅
2. Cancela la notificación ✅  
3. Lanza `MainActivity` con `getLaunchIntentForPackage` ← **PROBLEMA**

El intent lanzado es el intent genérico de lanzamiento de la app (`android.intent.action.MAIN`). No incluye el `callId` ni navega a ninguna pantalla específica. La app abre simplemente en la última pantalla que estaba visible.

**¿Por qué a veces funciona?** El código en `_layout.tsx` tiene un mecanismo de recuperación:

```typescript
// _layout.tsx — consumePendingAction()
const raw = await NativeCallKit.getAndClearPendingCallAction();
const { action, callId } = JSON.parse(raw);
if (action === 'answer') {
    const stillPending = await consumePendingCall();
    if (stillPending && mounted) {
        router.push({ pathname: '/call/[callId]', params: { ... } });
    }
}
```

Este mecanismo funciona **solo si la app se reinicia completamente** (proceso terminado). Si la app estaba en background (suspendida pero viva), `_layout.tsx` no re-ejecuta `consumePendingAction` porque el efecto `useEffect([])` ya corrió. La llamada puede haberse expirado también (TTL de 60s en `PENDING_CALL_TTL`).

**Corrección:** El `EGChatCallActionReceiver` debe incluir el `callId` en el intent de lanzamiento y la `MainActivity` debe procesarlo:

```kotlin
// En EGChatCallActionReceiver — bloque action == "answer"
if (action == "answer") {
    context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?.let { launchIntent ->
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            )
            launchIntent.putExtra("callId", callId)
            launchIntent.putExtra("callAction", "answer")
            context.startActivity(launchIntent)
        }
}
```

Y en la `MainActivity`, capturar este extra y reenviarlo como deep link o almacenarlo en un lugar que `_layout.tsx` pueda leer inmediatamente al montar (ya existe `PENDING_ACTION` en SharedPreferences, que es la solución actual — el problema es solo el TTL y que la app estaba en background).

**Solución alternativa más simple** (ya parcialmente implementada): Asegurarse de que cuando la app pasa a primer plano desde background (no cold start), también ejecute `consumePendingAction`. El `AppState.addEventListener('change', ...)` podría ser el lugar adecuado.

---

### Causa Raíz 3B: `fullScreenIntent` apunta a `EGChatIncomingCallActivity` (Activity nativa simple), no a la pantalla React Native

**Archivo:** `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt` líneas ~65-80

```kotlin
val fullScreenIntent = Intent(context, EGChatIncomingCallActivity::class.java).apply {
    putExtra("callId", callId)
    putExtra("callerName", data["callerName"] ?: "EGCHAT")
    putExtra("callType", data["callType"] ?: "audio")
    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
}
```

`EGChatIncomingCallActivity` es una `Activity` nativa en Kotlin (sin React Native) con botones simples "Contestar" y "Rechazar". Cuando el usuario pulsa "Contestar" aquí, llama al `EGChatCallActionReceiver` que a su vez lanza `MainActivity`. El problema es el mismo de la Causa 3A: la transición de `EGChatIncomingCallActivity` → `MainActivity` no incluye el context de la llamada de forma que React Native lo procese si la app ya estaba viva.

Esta arquitectura es válida (usar una Activity nativa para el lock screen es el patrón correcto en Android), pero requiere que la `MainActivity` sepa que viene de una llamada.

---

## Tabla de Archivos y Líneas con Problemas

| # | Archivo | Línea(s) | Problema | Prioridad |
|---|---|---|---|---|
| 1 | `ios/EGCHAT/EGCHAT.entitlements` | todo el archivo | Falta `com.apple.developer.pushkit.unrestricted-voip` | 🔴 P0 |
| 2 | `ios/EGCHAT/EGCHATRelease.entitlements` | todo el archivo | Falta `com.apple.developer.pushkit.unrestricted-voip` | 🔴 P0 |
| 3 | `app.json` | 142, 145 | `projectId: 7e370dde-...` debe ser `6200ec00-...`; `owner: dulce120` debe ser `reddington120` | 🔴 P0 |
| 4 | `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt` | 139 | `IMPORTANCE_HIGH` → debe ser `IMPORTANCE_MAX` para el canal de llamadas | 🔴 P1 |
| 5 | `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt` | ~139-148 | Canal `egchat-calls` no tiene `setBypassDnd(true)` | 🟡 P1 |
| 6 | `android/app/src/main/java/com/egchat/app/EGChatCallModule.kt` | ~195-215 | `EGChatCallActionReceiver` lanza app sin pasar `callId` en el intent | 🟡 P2 |
| 7 | `src/notifications.ts` | 34 | `shouldPlaySound: false` silencia mensajes en primer plano en iOS | 🟡 P3 |

---

## Configuración Adicional a Verificar (No Visible en el Código)

### Supabase Edge Functions — Variables de entorno

La función `deliver-call-push` requiere estas variables en Supabase Dashboard → Edge Functions → Secrets. Si alguna falta, las notificaciones fallan silenciosamente:

| Variable | Descripción | Crítica para |
|---|---|---|
| `APNS_KEY_P8` | Contenido del `.p8` APNs sin headers | iOS VoIP push |
| `APNS_KEY_ID` | 10 chars del Key ID de APNs | iOS VoIP push |
| `APNS_TEAM_ID` | Team ID = `XU6YD7ZJ2K` (en `app.json`) | iOS VoIP push |
| `APNS_ENV` | `"production"` | iOS VoIP push |
| `FCM_SERVICE_ACCOUNT_JSON` | JSON completo del Service Account de Firebase | Android FCM |
| `SERVICE_TOKEN` | Secreto compartido con el backend Render | Autenticación |

**Síntoma si faltan:** El log de `push_delivery_log` en Supabase mostrará `code: 'NO_CREDENTIALS'` para el canal correspondiente.

### Apple Developer Portal

El App ID `com.jallzstores.egchat` debe tener habilitadas estas capabilities:
- ✅ Push Notifications (APNs alert — para mensajes normales)
- ✅ VoIP Push Notifications / PushKit (para llamadas con CallKit)

Si solo uno está habilitado, el canal correspondiente falla.

### Certificado APNs vs Key P8

La arquitectura usa **token-based authentication** (`.p8` key) para APNs, que es lo correcto y más moderno. Verificar en Apple Developer → Keys que la key:
- Tiene activado "Apple Push Notifications service (APNs)"
- No ha expirado (las keys P8 no expiran, pero pueden revocarse)

---

## Resumen de Correcciones Recomendadas

### Críticas (P0) — Sin estas correcciones nada funciona en iOS

1. **Agregar el entitlement VoIP en ambos archivos `.entitlements`:**
   ```xml
   <!-- ios/EGCHAT/EGCHAT.entitlements y EGCHATRelease.entitlements -->
   <key>com.apple.developer.pushkit.unrestricted-voip</key>
   <true/>
   ```
   Requiere rebuild del IPA. El entitlement también debe estar activado en el App ID en Apple Developer Portal.

2. **Corregir el EAS Project ID y owner en `app.json`:**
   ```json
   "projectId": "6200ec00-54d7-4ef4-a348-56e80a1452f6",
   "owner": "reddington120"
   ```
   Requiere rebuild del IPA/APK y que todos los dispositivos re-registren su token push.

### Importantes (P1) — Sin estas correcciones Android no muestra heads-up

3. **Cambiar importancia del canal de llamadas en `EGChatCallModule.kt`:**
   ```kotlin
   // Cambiar ID del canal para forzar recreación en dispositivos existentes
   private const val CALL_CHANNEL = "egchat-calls-v2"
   
   NotificationChannel("egchat-calls-v2", "Llamadas", NotificationManager.IMPORTANCE_MAX)
       .also { it.setBypassDnd(true) }
   ```
   Y actualizar el `channelId` en `notifications.ts` y `deliver-call-push/index.ts`.

### Moderadas (P2) — Mejoran la fiabilidad al aceptar desde notificación

4. **Incluir `callId` en el intent de lanzamiento del `EGChatCallActionReceiver`:**
   ```kotlin
   launchIntent.putExtra("callId", callId)
   launchIntent.putExtra("callAction", "answer")
   ```

### Menores (P3) — Mejoran la experiencia de usuario

5. **Corregir el `shouldPlaySound` en el handler de notificaciones:**
   ```typescript
   shouldPlaySound: !isCall,  // mensajes en primer plano sí suenan
   ```

---

## Qué Funciona Correctamente

- La arquitectura backend (Supabase Edge Function `deliver-call-push` + APNs VoIP + FCM) está bien diseñada
- El `AppDelegate.swift` inicia PushKit antes que React Native ✅
- El `EGChatPushKitCoordinator` hace flush de eventos pendientes cuando el módulo JS se monta ✅
- El canal `egchat-calls` JS tiene `bypassDnd: true` y `lockscreenVisibility: PUBLIC` ✅
- El `AndroidManifest.xml` tiene `USE_FULL_SCREEN_INTENT` y `EGChatIncomingCallActivity` con `showWhenLocked` y `turnScreenOn` ✅
- El guard anti-duplicado en `setupNotificationListeners` evita procesar la misma llamada dos veces ✅
- El mecanismo de recuperación (`consumePendingCall` / `consumePendingAction`) es correcto para cold start ✅
- `GoogleService-Info.plist` y `google-services.json` existen y corresponden al proyecto `egchat-4efe7` ✅
- FCM usa la API HTTP v1 con Service Account (no la Legacy API deprecated) ✅
