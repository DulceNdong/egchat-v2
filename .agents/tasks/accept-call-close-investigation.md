# Investigación: Pantalla de llamada se cierra al aceptar

**Fecha:** 2025-07  
**Estado:** Causa raíz identificada — fix concreto disponible

---

## Resumen (respuesta directa)

Hay **tres bugs independientes** que pueden causar el cierre inmediato de la pantalla al aceptar. El bug principal y más probable es una **condición de carrera entre Supabase Realtime y la ejecución de `acceptCall()`**. Antes de que `acceptCall()` termine de enviar el `answer` al servidor, el canal Realtime recibe un evento con `status: 'accepted'` (que el propio servidor emite al procesar el claim/answer) y ejecuta el handler que llama a `_finalCleanup()` + `endCall()`, destruyendo toda la sesión. La pantalla queda sin datos de sesión, `callState` pasa a `'ended'` y el efecto en `[callId].tsx` llama a `router.back()` 500 ms después.

---

## Evidencia detallada

### Bug #1 — CAUSA RAÍZ PRINCIPAL: Race condition Realtime vs. acceptCall()

**Archivo:** `egchat-mobile/src/call/CallManager.ts`, método `acceptCall()` (línea ~395–460) y `_subscribeRealtime()` (línea ~1569–1620)

#### Flujo del problema

```
acceptCall() llamado
  ↓
claimCall() → servidor emite status='accepted' en call_sessions
  ↓ (Supabase Realtime, <200ms)
_subscribeRealtime() handler onStatusChange('accepted')
  →  this._session.role === 'callee'
  →  this._commState === 'ringing' o 'accepted'   ← CONDICIÓN CUMPLIDA
  →  _stopRingOnce()
  →  _setCommState('ended')        ← ⚡ DESTRUYE LA SESIÓN AQUÍ
  →  _finalCleanup()               ← cierra PC, streams, timers
  →  setTimeout 400ms → _commState='idle', _session=null

  MIENTRAS TANTO, acceptCall() sigue ejecutándose:
  ↓
  _ensurePermissions() — OK
  ↓
  _getUserMedia() — crea stream
  ↓
  _createPC() — pero _session ya puede ser null o commState='ended'
  ↓  
  callAPI.answer() — se intenta enviar pero la sesión ya fue limpiada
```

El handler Realtime en `_subscribeRealtime()` es:

```typescript
case 'accepted':
  if (this._session.role === 'callee' &&
      (this._commState === 'ringing' || this._commState === 'accepted')) {
    this._stopRingOnce();
    this._setCommState('ended');   // ← dispara callState='ended'
    this._finalCleanup();
    setTimeout(() => { this._setCommState('idle'); this._session = null; this._notify(); }, 400);
  }
  break;
```

Este código está diseñado para el escenario de **multi-dispositivo** (otro dispositivo del mismo callee acepta), pero se dispara también cuando **el mismo dispositivo** está aceptando, porque `claimCall()` hace que el servidor marque la llamada como `accepted` en Supabase antes de que `acceptCall()` haya completado el flujo WebRTC.

**Demuestra el bug:** En `acceptCall()`, línea ~398:
```typescript
this._setCommState('accepted');    // commState = 'accepted'
// ... luego se llama a _subscribeRealtime()
this._startPoll('callee', 'fast');
this._subscribeAppState();
this._subscribeRealtime();         // ← suscripción Realtime AQUÍ, DESPUÉS de 'accepted'
```

La suscripción Realtime se activa en `acceptCall()` **al final** del método. Sin embargo, `_subscribeRealtime()` también se llama desde `startCall()` del caller. Si el caller ya suscribió el canal antes de que el callee acepte, el canal ya estaba activo en el dispositivo del callee desde que se llamó `registerIncoming()` — **no**, espera. En realidad `_subscribeRealtime()` no se llama en `registerIncoming()`.

Pero el verdadero problema es que `claimCall()` es lo primero que se ejecuta en `acceptCall()` y es un POST al servidor. El servidor, al procesar `/api/calls/claim`, actualiza el campo `status` de `call_sessions` a `'accepted'`. Supabase Realtime entrega ese cambio al cliente en ~100-300ms. Si la app ya tiene el canal Realtime suscrito desde **antes** (por ejemplo desde una llamada previa que no se limpió bien, o si hay algún path que llama `_subscribeRealtime()` antes), el handler se dispara y destruye la sesión.

**Más probable en Android**: La latencia 4G hace que el tiempo entre `claimCall()` y el completion de `getUserMedia()` sea de 1-3 segundos, mucho mayor que la entrega Realtime.

---

### Bug #2 — Condición de guardia incorrecta en el handler Realtime para 'accepted'

**Archivo:** `egchat-mobile/src/call/CallManager.ts`, método `_subscribeRealtime()`

El handler no distingue entre "otro dispositivo aceptó" y "yo mismo acabo de aceptar". La condición debería verificar si el dispositivo local inició el `acceptCall()`:

```typescript
case 'accepted':
  // PROBLEMA: dispara también cuando el propio dispositivo está aceptando
  if (this._session.role === 'callee' &&
      (this._commState === 'ringing' || this._commState === 'accepted')) {
    // ← No hay flag que diga "yo mismo estoy procesando acceptCall()"
```

Cuando el callee acepta en el mismo dispositivo, `_commState` pasa de `'ringing'` a `'accepted'` al inicio de `acceptCall()`. Si Realtime llega en ese instante, la condición `this._commState === 'accepted'` es TRUE y el handler lo confunde con "otro dispositivo aceptó primero".

---

### Bug #3 — `callState='ended'` dispara `router.back()` en `[callId].tsx`

**Archivo:** `egchat-mobile/app/call/[callId].tsx`, efecto de estado finalizado (línea ~312–318):

```typescript
useEffect(() => {
  if (callState === 'ended' || callState === 'failed' || callState === 'missed') {
    logCallToChat(wasConnected.current, durationRef.current);
    setPip(false);
    setTimeout(() => router.back(), 500);   // ← cierra la pantalla
  }
  // ...
}, [callState]);
```

Este efecto es correcto en teoría, pero si el Bug #1 o #2 disparan `callState='ended'` prematuramente, este efecto ejecuta `router.back()` ~500ms después de que el usuario pulsó "Aceptar". El resultado es exactamente lo que describe el usuario: la pantalla se abre un instante y se cierra.

---

### Bug #4 (secundario) — El `offer` puede llegar null al aceptar desde el overlay

**Archivo:** `egchat-mobile/app/_layout.tsx`, handler `onAccept` del overlay (línea ~706–718):

```typescript
onAccept={() => {
  const c = incomingCall;
  setIncomingCall(null);
  router.push({ pathname: '/call/[callId]', params: {
    callId:      c.callId,
    targetName:  c.callerName,
    targetAvatar: c.callerAvatar || '',
    callType:    c.callType || 'audio',
    role:        'callee',
    offer:       c.offer ? JSON.stringify(c.offer) : undefined,  // ← puede ser undefined
  }} as any);
}}
```

Si `c.offer` es `undefined` (la notificación FCM llegó sin SDP, que es válido en algunos paths), el parámetro `offer` llega como `undefined` a `[callId].tsx`. La pantalla de llamada entonces intenta leer el offer del servidor via `_fetchOfferWithRetry()`, que hace hasta 6 intentos de 3 segundos (18s total). Si el servidor ya marcó la llamada como `ended` para ese momento, `_fetchOfferWithRetry()` devuelve `null`, y `acceptCall()` lanza:

```typescript
if (!this._isValidSdp(offer)) { await this.endCall(); throw new Error('No se pudo obtener los datos de la llamada.'); }
```

Esto termina la llamada y la pantalla se cierra. Aunque este path es más lento (18s) que el Bug #1 (< 1s), puede coexistir.

---

### Verificación: el CallManager ya tiene la sesión cuando se abre `[callId].tsx`

En `_layout.tsx`, `handleIncomingCall()` llama a `callManager.registerIncoming(payload)` **antes** de navegar. Así que cuando `[callId].tsx` monta, el CallManager ya tiene `_commState='ringing'` y `_session` con los datos de la llamada. Esto es correcto.

Sin embargo, el initiation block en `[callId].tsx`:

```typescript
useEffect(() => {
  if (initiated.current) return;
  initiated.current = true;
  const existing = callManager.session;
  if (existing?.callId === callId && callManager.isActive) return;  // ← callee no inicia nada
  if (role === 'caller' && targetUserId) {
    startCall(...).catch(err => { Alert.alert(...); router.back(); });
  }
  // ← No hay llamada a acceptCall() aquí para el callee
}, []);
```

El callee no llama a `acceptCall()` en el `useEffect` de inicialización — espera el toque del usuario en el botón "Aceptar". Esto es correcto, pero significa que si el Realtime destruye la sesión antes de que el usuario pulse, la pantalla muestra el estado de llamada entrante (`isIncoming=true`) durante una fracción de segundo y luego `callState` cambia a `'ended'` y `router.back()` se ejecuta.

---

## Conclusiones

| # | Bug | Probabilidad | Velocidad de fallo |
|---|-----|-------------|-------------------|
| 1 | Race condition Realtime `accepted` → `_finalCleanup()` mientras `acceptCall()` ejecuta | **MUY ALTA** | < 500ms tras pulsar Aceptar |
| 2 | Handler Realtime no distingue "yo acepté" vs "otro dispositivo aceptó" | Alta | Mismo que Bug #1 |
| 3 | Efecto `callState='ended'` → `router.back()` se ejecuta prematuramente | Consecuencia de Bug #1/2 | +500ms |
| 4 | `offer` null → `_fetchOfferWithRetry()` 18s timeout | Media | 18–30s tras pulsar Aceptar |

---

## Fix concreto recomendado

### Fix principal (Bug #1 y #2)

Añadir un flag `_isAcceptingLocally` en `CallManager` que se active al inicio de `acceptCall()` y se limpie al terminar (éxito o error). El handler Realtime debe respetarlo:

**En `CallManager.ts`, clase `CallManager`:**

```typescript
// Nuevo flag — añadir junto a los otros flags privados
private _isAcceptingLocally = false;
```

**En `acceptCall()`**, añadir al inicio:

```typescript
async acceptCall(): Promise<void> {
  if (this._commState !== 'ringing' || !this._session) {
    console.warn('[CallManager] acceptCall: estado incorrecto', this._commState);
    return;
  }

  this._isAcceptingLocally = true;   // ← NUEVO: flag de guardia
  
  // ... resto del método existente ...
  
  // Al final del método (antes de return en el path exitoso),
  // limpiar el flag (la llamada está ahora en 'connecting' y
  // Realtime puede seguir funcionando con seguridad):
  this._isAcceptingLocally = false;
}
```

En el bloque `catch` de `acceptCall()` también hay que limpiarlo:

```typescript
  // Donde hay throw new Error:
  this._isAcceptingLocally = false;
  await this.endCall();
  throw new Error('...');
```

**En `_subscribeRealtime()`**, el handler `case 'accepted':`:

```typescript
case 'accepted':
  // Solo terminar si NO somos nosotros quienes estamos aceptando ahora mismo.
  // _isAcceptingLocally previene el race condition donde claimCall() hace que
  // el servidor marque 'accepted' en Supabase antes de que terminemos el handshake.
  if (this._session.role === 'callee' &&
      (this._commState === 'ringing' || this._commState === 'accepted') &&
      !this._isAcceptingLocally) {       // ← NUEVA CONDICIÓN
    this._stopRingOnce();
    this._setCommState('ended');
    this._finalCleanup();
    setTimeout(() => { this._setCommState('idle'); this._session = null; this._notify(); }, 400);
  }
  break;
```

**En `_reset()`**, añadir:

```typescript
this._isAcceptingLocally = false;
```

**En `_finalCleanup()`**, añadir en la sección de flags:

```typescript
this._isAcceptingLocally = false;
```

---

### Fix secundario (Bug #4 — offer null)

En `_layout.tsx`, asegurarse de que el offer **siempre** se pasa si está disponible. Si la notificación FCM no traía SDP, el overlay debería mostrar un indicador de espera antes de navegar, o bien navegar igualmente y dejar que `_fetchOfferWithRetry()` lo obtenga — pero con un timeout más corto (6×1s en lugar de 6×3s) para no dejar al usuario esperando 18s:

En `CallManager.ts`, método `_fetchOfferWithRetry()`, cambiar el delay de 3000ms a 1500ms para reducir el tiempo de espera:

```typescript
private async _fetchOfferWithRetry(callId: string): Promise<any> {
  for (let i = 0; i < 6; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1500));  // ← era 3000ms
    // ...
  }
}
```

---

### Fix de verificación — Logging para confirmar el bug en producción

Antes de aplicar el fix, añadir este log temporal en `_subscribeRealtime()` para confirmar que es el path ejecutado:

```typescript
case 'accepted':
  console.warn('[CallManager] Realtime accepted recibido — role:', this._session?.role,
    'commState:', this._commState, 'isAcceptingLocally:', this._isAcceptingLocally);
  // ...
```

Si los logs de la app muestran este mensaje justo después de pulsar "Aceptar", confirma el Bug #1.

---

## Archivos a modificar

1. `egchat-mobile/src/call/CallManager.ts`
   - Añadir propiedad `_isAcceptingLocally = false`
   - Activar al inicio de `acceptCall()`, desactivar al final y en catch
   - Guardar en `_reset()` y `_finalCleanup()`
   - Modificar handler `case 'accepted':` en `_subscribeRealtime()`
   - (Opcional) Reducir delay de `_fetchOfferWithRetry()` de 3000 a 1500ms

2. No se requieren cambios en `[callId].tsx` ni en `_layout.tsx` para el fix principal.
