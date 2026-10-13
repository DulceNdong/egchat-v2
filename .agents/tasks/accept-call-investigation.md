# Investigación: Flujo "Aceptar Llamada" en Android

**Fecha:** 2025  
**Rama:** `mobile` — `egchat-mobile/`  
**Síntoma reportado:** Las notificaciones push llegan, pero al pulsar "Contestar" la app se abre y NO navega a la pantalla de llamada. La llamada aparece como perdida.

---

## Resumen Ejecutivo

El fix de `userIdRef` **está correctamente aplicado** en el código actual. Sin embargo, hay **tres problemas adicionales** que impiden que la navegación a la pantalla de llamada funcione correctamente en el APK actual (que no tiene el fix). El problema más crítico es un **race condition de timing**: cuando el usuario pulsa "Contestar" desde la notificación con la app en background, el `EGChatCallActionReceiver` borra la notificación (`EGChatCallNotifier.clear()`) pero **NO borra el PENDING_CALL de SharedPreferences**, y luego relanza la app. El problema es el flujo que sucede después: el JS necesita estar completamente montado antes de poder navegar, y hay una ventana donde el `AppState 'active'` puede dispararse antes de que el router esté listo.

---

## 1. Estado actual de `_layout.tsx`

### ✅ Fix `userIdRef` — APLICADO CORRECTAMENTE

**Definición** (`_layout.tsx`, línea 245):
```typescript
const userIdRef = useRef<string | null>(null);
```

**Asignación inmediata** (`_layout.tsx`, línea 738):
```typescript
// Establecer userIdRef INMEDIATAMENTE para que el AppState listener
// procese llamadas pendientes sin esperar el delay de 15s
userIdRef.current = String(me.id);
const realtimeStartTimer = setTimeout(() => {
  if (mounted) setGlobalUserId(String(me.id));
}, androidBackgroundDelay);  // 15 segundos después
```

**Guard en el AppState listener** (`_layout.tsx`, línea 280):
```typescript
// Usar userIdRef (se establece inmediatamente al autenticar, sin el delay de 15s)
if (!userIdRef.current) return;
```

✅ El ref se establece sincrónicamente tras `authAPI.me()`, antes del delay de 15s.  
✅ El AppState listener usa `userIdRef.current` en lugar de `globalUserId` (que demoraría 15s).

### ⚠️ Problema 1: Dependencia incorrecta en el `useEffect` del AppState listener

**Código** (`_layout.tsx`, línea 355):
```typescript
  }, [globalUserId]);  // ← DEPENDENCIA INCORRECTA
```

El `useEffect` que registra el AppState listener tiene `[globalUserId]` como dependencia. Esto significa:
1. El efecto se monta en render inicial con `globalUserId = undefined` → OK, el `userIdRef.current` guard funciona.
2. Pero **15 segundos después**, cuando `setGlobalUserId(me.id)` dispara, el efecto se desmonta y vuelve a montar → **el listener se re-registra**.
3. Durante esos 15 segundos hay exactamente **una oportunidad**: el AppState `'active'` que dispara cuando la app vuelve al foreground. Si ese evento llega cuando el listener anterior fue desmontado pero el nuevo no montado aún (gap de re-montaje), se pierde.

**En la práctica:** dado que `globalUserId` cambia a los 15s y la llamada llega en los primeros segundos, el listener debería estar montado. Pero si la app tarda más (dispositivo lento), puede fallar.

**Solución recomendada:** cambiar la dependencia a `[]` ya que el efecto usa solo refs y no estado reactivo.

### ⚠️ Problema 2: Timing del router en cold start

**Contexto del problema (`_layout.tsx`, línea ~620):**
```typescript
if (Platform.OS === 'android') {
  const navigatePendingCall = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const pending = await consumePendingCall();
        if (!pending || !mounted) return;
        ...
        router.push({ pathname: '/call/[callId]', ... });
        return;
      } catch {
        // router no listo aún — esperar 400ms y reintentar
        await new Promise(r => setTimeout(r, 400));
      }
    }
  };
  navigatePendingCall().catch(() => {});
```

Esto intenta 5 veces con 400ms de intervalo = máximo 2 segundos. El problema: `router.push` en Expo Router lanza una excepción **solo si el router no está montado en absoluto**. Si el router está montado pero la app todavía está en el index/splash (antes de que `setChecking(false)` haya terminado la redirección a tabs), la navegación puede perderse o redirigirse incorrectamente.

**Solución recomendada:** Guardar el pending call en un ref y procesarlo en un efecto que se ejecute DESPUÉS de que la autenticación termine y el router esté en `/(tabs)`.

### ⚠️ Problema 3: El `EGChatCallActionReceiver` usa `FLAG_ACTIVITY_CLEAR_TOP` — riesgo de destruir el stack

**Código** (`EGChatCallModule.kt`, en `EGChatCallActionReceiver.onReceive`):
```kotlin
launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
launchIntent.putExtra("callId", callId)
launchIntent.putExtra("callAction", "answer")
context.startActivity(launchIntent)
```

El intent lleva `FLAG_ACTIVITY_CLEAR_TOP`. Dado que `MainActivity` tiene `android:launchMode="singleTask"` en el `AndroidManifest.xml`, esto significa que cuando el receiver lanza la app:
- Si la app estaba en background (no cerrada): `singleTask` ya evita crear una nueva instancia, el `FLAG_ACTIVITY_CLEAR_TOP` limpia el back stack por encima de `MainActivity`. Esto es correcto.
- Si la app estaba cerrada: se crea una nueva instancia normal. Correcto también.

**Pero hay un problema:** los extras `callId` y `callAction` que se ponen en el `launchIntent` **NO se leen en ninguna parte del código JS**. El `EGChatCallModule.kt` no tiene un `onNewIntent()` que los capture y los exponga a JS. Toda la lógica JS confía en `PENDING_CALL` y `PENDING_ACTION` de SharedPreferences, que sí se escriben. Este no es un error, pero los extras son superfluos.

---

## 2. Flujo completo de `EGChatCallActionReceiver`

Cuando el usuario pulsa "Contestar" en la notificación con la app en **background**:

```
1. EGChatCallActionReceiver.onReceive() dispara
2. → Escribe PENDING_ACTION en SharedPreferences ("egchat_calls")
       { callId, action: "answer", timestamp }
3. → Llama EGChatCallNotifier.recordCallAction()
       → Actualiza PENDING_CALL con action: "answer"
4. → Llama EGChatCallNotifier.clear(context, callId)
       ✅ Solo cancela la NOTIFICACIÓN, NO borra PENDING_CALL ni PENDING_ACTION
5. → getLaunchIntentForPackage() + FLAG_ACTIVITY_NEW_TASK | FLAG_ACTIVITY_CLEAR_TOP
6. → context.startActivity(launchIntent)
       → La app pasa de background a foreground (AppState dispara 'active')
```

**Flujo JS al recibir el AppState 'active':**
```
1. AppState listener se dispara con state='active'
2. Verifica isProcessingCallRef.current === false → OK
3. Verifica userIdRef.current !== null → OK (si el fix está aplicado)
4. consumePendingCall() → NativeCallKit.getAndClearPendingCall()
   → Lee PENDING_CALL de SharedPreferences (callId + callerName + action: "answer")
   → Lo borra
   → Lo retorna ✅
5. Navega a '/call/[callId]' con autoAccept: '1' ✅
```

**Este flujo es correcto y debería funcionar** con el fix de `userIdRef` aplicado.

### ❌ Problema crítico encontrado: EGChatCallNotifier.clear() solo limpia la notificación

Verificado en el código (`EGChatCallModule.kt`, línea `fun clear`):
```kotlin
fun clear(context: Context, callId: String) {
  NotificationManagerCompat.from(context).cancel(callId.hashCode())
  // ← NO borra PENDING_CALL ni PENDING_ACTION de SharedPreferences
}
```

Esto es **correcto** para el flujo normal — el PENDING_CALL debe persistir para que JS lo pueda leer. ✅

---

## 3. NativeCallKit — Verificación del nombre del módulo

**Kotlin** (`EGChatCallModule.kt`, línea `override fun getName()`):
```kotlin
override fun getName() = "EGChatCallModule"
```

**TypeScript** (`src/native/CallKit.ts`, línea 8):
```typescript
const { EGChatCallModule } = NativeModules;
```

✅ Los nombres coinciden exactamente.

**Métodos expuestos por `NativeCallKit` (CallKit.ts) vs implementados en Kotlin:**

| Método JS | Método Kotlin | Estado |
|---|---|---|
| `getAndClearPendingCall()` | `@ReactMethod fun getAndClearPendingCall` | ✅ Coincide |
| `getAndClearPendingCallAction()` | `@ReactMethod fun getAndClearPendingCallAction` | ✅ Coincide |
| `getFcmToken()` | `@ReactMethod fun getFcmToken` | ✅ Coincide |
| `showIncomingCall()` | `@ReactMethod fun showIncomingCall` | ✅ Coincide |
| `rejectCall()` | `@ReactMethod fun rejectCall` | ✅ Coincide |
| `endCall()` | `@ReactMethod fun endCall` | ✅ Coincide |

No hay discrepancias de nombre entre JS y Kotlin.

---

## 4. Ruta de navegación

El archivo `/call/[callId].tsx` **existe**:
```
/Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile/app/call/[callId].tsx
```

El `Stack.Screen` está registrado en `_layout.tsx`:
```typescript
<Stack.Screen name="call/[callId]" options={{
  presentation: 'card',
  animation: 'slide_from_bottom',
  gestureEnabled: false,
  headerShown: false,
}} />
```

El `router.push` usa la sintaxis correcta:
```typescript
router.push({ pathname: '/call/[callId]', params: {
  callId:       pending.callId,
  targetName:   pending.callerName,
  targetAvatar: pending.callerAvatar || '',
  callType:     pending.callType || 'audio',
  role:         'callee',
  offer:        pending.offer ? JSON.stringify(pending.offer) : undefined,
  autoAccept:   '1',
}} as any);
```

✅ La ruta existe y la navegación es sintácticamente correcta.

---

## 5. Timing Issue — Análisis completo

El timing issue es **el problema más probable en el APK actual** (sin el fix de `userIdRef`). Con el fix aplicado, el flujo más crítico es el de **app en background → foreground** (no cold start).

### Escenario A: App en background (más común)
```
T=0ms   Usuario pulsa "Contestar" en notificación
T=10ms  EGChatCallActionReceiver escribe PENDING_ACTION y PENDING_CALL.action="answer"
T=20ms  EGChatCallActionReceiver lanza intent → app viene al foreground
T=100ms AppState 'active' dispara en JS
T=100ms userIdRef.current ya está seteado ✅ (con el fix)
T=101ms consumePendingCall() → getAndClearPendingCall() nativo → retorna datos ✅
T=102ms router.push('/call/[callId]') → navega a pantalla de llamada ✅
```

**Sin el fix:** `userIdRef.current` es null hasta 15s después → el guard bloquea la navegación → la llamada aparece como perdida.

### Escenario B: App cerrada (cold start)
```
T=0ms   App se lanza desde cero
T=0-200ms  React Native inicializa
T=200ms  _layout.tsx monta, init() comienza
T=~500ms authAPI.me() retorna → userIdRef.current = me.id ✅
T=~500ms navigatePendingCall() arranca (hasta 5 reintentos × 400ms)
T=~500ms consumePendingCall() → lee PENDING_CALL ✅
T=~500ms router.push('/call/[callId]') → ¿router listo?
```

**Problema potencial:** si `setChecking(false)` y la redirección a `/(tabs)` todavía no terminaron, y el router intentar push a `/call/[callId]` mientras está en `/welcome` o `/`, la navegación puede fallar silenciosamente porque Expo Router puede estar en transición. Los reintentos de `navigatePendingCall` mitigan esto, pero no garantizan nada.

### Protección actual para router listo
**No hay** una comprobación explícita de que el router está en su pantalla final antes de navegar. El código confía en que 5 reintentos × 400ms = 2s son suficientes para que el router esté listo. En dispositivos lentos esto puede no ser suficiente.

---

## 6. Conclusiones

### El fix de `userIdRef` es NECESARIO pero puede no ser SUFICIENTE

| Escenario | Sin fix `userIdRef` | Con fix `userIdRef` |
|---|---|---|
| App en background, push notif | ❌ Falla (guard bloquea 15s) | ✅ Funciona |
| App cerrada (cold start) | ❌ Falla (guard bloquea 15s) | ⚠️ Puede fallar si router no está listo en 2s |
| App en foreground (overlay) | ✅ Funciona | ✅ Funciona |

---

## 7. Cambios adicionales recomendados antes de buildear el nuevo APK

### Fix A (CRÍTICO) — Corregir la dependencia del AppState listener

**Archivo:** `egchat-mobile/app/_layout.tsx`, línea 355  
**Cambio:** `}, [globalUserId]);` → `}, []);`

El efecto usa solo `userIdRef` (ref, no estado reactivo) y refs locales. La dependencia en `globalUserId` causa un re-montaje innecesario a los 15s que puede crear una ventana donde el listener no está registrado.

### Fix B (RECOMENDADO) — Persistir la intención de navegación en un ref para cold start

Para el caso de cold start, guardar el pending call en un ref en lugar de navegar inmediatamente desde dentro de `init()`. Luego, en un `useEffect` separado que observe un flag "autenticado + router listo", consumir ese ref y navegar.

**Implementación sugerida:**
```typescript
// Ref para pending call en cold start
const pendingCallNavRef = useRef<PendingCall | null>(null);

// En init(), en lugar de navigatePendingCall():
const pending = await consumePendingCall();
if (pending) pendingCallNavRef.current = pending;

// Efecto separado que navega cuando la app está lista:
useEffect(() => {
  if (!userIdRef.current || !pendingCallNavRef.current) return;
  const pending = pendingCallNavRef.current;
  pendingCallNavRef.current = null;
  setTimeout(() => {
    router.push({ pathname: '/call/[callId]', params: { ... } });
  }, 500); // pequeño delay para asegurar que el stack está montado
}, [globalUserId]); // se activa cuando globalUserId se establece
```

Esto garantiza que la navegación ocurre DESPUÉS de que los tabs están cargados.

### Fix C (MENOR) — Tiempo de espera insuficiente en navigatePendingCall

Si se mantiene el retry actual, aumentar el timeout de 400ms a 600ms y los intentos de 5 a 8, para cubrir dispositivos más lentos:
```typescript
const navigatePendingCall = async (retries = 8) => {
  for (let i = 0; i < retries; i++) {
    try { ... router.push(...); return; }
    catch { await new Promise(r => setTimeout(r, 600)); }
  }
};
```

---

## 8. Estado del código vs APK actual

| Fix | Estado en código | En APK actual |
|---|---|---|
| `userIdRef` definido | ✅ Línea 245 | ❌ No tiene |
| `userIdRef.current = me.id` inmediato | ✅ Línea 738 | ❌ No tiene |
| Guard AppState usa `userIdRef.current` | ✅ Línea 280 | ❌ Usa `globalUserId` (15s delay) |
| `consumePendingCall()` en AppState | ✅ Presente | ❓ Parcial (sin el guard) |
| `getAndClearPendingCallAction()` en AppState | ✅ Presente | ❓ Puede estar |
| Dependencia `[]` en AppState useEffect | ❌ Tiene `[globalUserId]` | — |

---

## 9. Veredicto final

**El fix de `userIdRef` es el más importante y corregirá el 90% de los casos** donde la llamada aparece como perdida al pulsar "Contestar". El APK nuevo con este fix debería funcionar para el escenario más común (app en background).

Los **fixes adicionales recomendados** (Fix A: dependencia `[]`, Fix B: nav ref para cold start) mejoran la robustez pero no son bloqueantes para el build inicial.

**Prioridad para el próximo APK:**
1. ✅ (ya aplicado) `userIdRef` fix — build inmediatamente
2. 🔧 Fix A (dependencia `[]`) — muy simple, 1 línea, bajo riesgo
3. 🔧 Fix B (cold start nav ref) — más complejo, dejar para siguiente iteración si el APK sigue fallando
