# Investigación: Flujo de Llamadas EGChat — Por Qué el Caller No Detecta el Answer

**Fecha:** Investigación estática — sin modificar código  
**Archivos analizados:** `server/index.js`, `useWebRTC.ts`, `egchat-mobile/src/call/CallManager.ts`, `egchat-mobile/src/call/callSupabase.ts`, `egchat-mobile/src/api.ts`, `egchat-mobile/app/_layout.tsx`, `egchat-mobile/src/hooks/useChatStream.ts`

---

## RESUMEN EJECUTIVO

El caller (quien inicia) no detecta que el callee aceptó por **una causa raíz primaria** y **cuatro causas secundarias** que agravan el problema:

**Causa raíz (Bug #1):** El endpoint `POST /api/call/answer` del servidor guarda el answer en Supabase pero **nunca llama `emitToUser()`** para enviar el evento SSE `call_answered` al caller. El caller móvil (iOS) tiene código listo para recibir ese evento (`onCallAnsweredSSE` en `CallManager.ts` + handler en `_layout.tsx`), pero el servidor nunca lo emite. Resultado: el caller depende 100% del polling periódico (900ms–2000ms en iOS), no hay notificación push de "fui aceptado".

---

## EVIDENCIA CON CITAS DE CÓDIGO

### Bug #1 — El servidor no emite SSE `call_answered` (CAUSA RAÍZ)

**`server/index.js` líneas 5910–5916:**
```javascript
app.post('/api/call/answer', auth, async (req, res) => {
  const { callId, answer } = req.body;
  const { data } = await supabase.from('call_sessions').select('call_id')
    .eq('call_id', callId).eq('ended', false).single();
  if (!data) return res.status(404).json({ error: 'Llamada no encontrada' });
  await supabase.from('call_sessions')
    .update({ answer: JSON.stringify(answer), updated_at: new Date().toISOString() })
    .eq('call_id', callId);
  res.json({ ok: true });
  // ❌ NO HAY emitToUser() aquí
});
```

El servidor tiene la función `emitToUser()` (línea 148) y la usa para ~25 tipos de eventos (mensajes, presencia, wallets, etc.). Para llamadas **no la usa en absoluto** en los endpoints de señalización.

**`egchat-mobile/app/_layout.tsx` líneas 499–501** — El cliente iOS espera ese evento que nunca llega:
```typescript
if (event.type === 'call_answered' && event.callId) {
  callManager.onCallAnsweredSSE(event.callId);  // nunca se ejecuta
}
```

**`egchat-mobile/src/hooks/useChatStream.ts` — Tipo `StreamEvent`** — El tipo TypeScript no incluye `call_answered` ni `call_ended` en el union type (línea 12–17), lo que indica que estos eventos nunca fueron implementados en el servidor y se agregaron solo del lado del cliente:
```typescript
type StreamEvent = {
  type: 'new_message' | 'chat_updated' | 'connected' | 'heartbeat' | 'typing' | 'read'
       | 'sync_message' | 'session_revoked' | 'wallet_updated' | 'presence'
       | 'transfer_received' | 'transfer_pending' | 'transfer_accepted' | 'transfer_cancelled'
       | 'message_deleted'
       | 'group_call_participant_joined' | 'group_call_participant_left'
       // ❌ 'call_answered' y 'call_ended' NO están en la union type
```

**Consecuencia directa:** El caller no detiene el tono de marcación hasta que el polling lo detecta (900ms–2000ms en iOS). En esa ventana de tiempo el callee ya aceptó y empieza la negociación ICE desde su lado, pero el caller aún no aplicó el answer a la PeerConnection.

---

### Bug #2 — El servidor no tiene los endpoints que el cliente nativo llama

El `callAPI` en `egchat-mobile/src/api.ts` llama endpoints que **no existen en `server/index.js`**:

| Endpoint llamado por el cliente | ¿Existe en server? | Efecto |
|---|---|---|
| `POST /api/call/reject` | ❌ No | `rejectCall()` en CallManager recibe error silencioso |
| `POST /api/call/cancel` | ❌ No | `cancelCall()` no notifica al callee |
| `POST /api/call/connected` | ❌ No | `markConnected()` falla silenciosamente |
| `POST /api/calls/claim` | ❌ No | `claimCall()` falla — guard de doble-aceptación no funciona |

La falta de `/api/call/cancel` es especialmente grave: cuando el caller cuelga mientras el callee sigue timbrando, el callee **nunca recibe la notificación**. El callee depende del polling para detectar que la llamada ya no existe (`ended: true`).

**`egchat-mobile/src/api.ts` líneas 604–639:**
```typescript
reject: (callId: string) =>
  post<...>('/api/call/reject', { callId }),       // ❌ 404
cancel: (callId: string) =>
  post<...>('/api/call/cancel', { callId }),       // ❌ 404  
markConnected: (callId: string) =>
  post<...>('/api/call/connected', { callId }),    // ❌ 404
claimCall: (callId: string) =>
  post<...>('/api/calls/claim', { callId }),       // ❌ 404
```

---

### Bug #3 — El servidor no emite SSE `call_ended` tampoco

Por el mismo problema que Bug #1, cuando el callee rechaza o el caller cancela, el otro lado **no recibe notificación SSE**. El cliente tiene:

```typescript
// _layout.tsx línea 503-504
if (event.type === 'call_ended' && event.callId) {
  callManager.onCallEndedSSE(event.callId);  // nunca se ejecuta
}
```

Y en `CallManager.ts`:
```typescript
onCallEndedSSE(callId: string): void {
  // ...
  this.endCall();
}
```

Sin el SSE, ambos lados dependen del polling para detectar fin de llamada.

---

### Bug #4 — Race condition: ICE llega antes del answer, ICE da 404

**`server/index.js` líneas 5919–5933** — El endpoint `/api/call/ice` hace un SELECT de `call_sessions` primero:

```javascript
app.post('/api/call/ice', auth, async (req, res) => {
  const { callId, candidate, role } = req.body;
  const { data } = await supabase.from('call_sessions')
    .select('caller_candidates, callee_candidates')
    .eq('call_id', callId).single();
  if (!data) return res.status(404).json({ error: 'Llamada no encontrada' });  // ← 404 ACÁ
  // ...
```

El orden de eventos es:
1. iOS acepta → llama `/api/call/answer` (guarda answer)
2. iOS empieza a recolectar ICE candidates y llama `/api/call/ice`
3. Pero si el `callId` no existe todavía en `call_sessions` (Supabase propagation delay), el ICE da 404

Adicionalmente, en la web (`useWebRTC.ts`) hay un delay artificial de 500ms antes de enviar el answer:
```typescript
// useWebRTC.ts — startCall() y answerCall()
await new Promise(r => setTimeout(r, 500));
await sigFetch('/call/offer', 'POST', ...);
// y luego:
await new Promise(r => setTimeout(r, 500));
await sigFetch('/call/answer', 'POST', ...);
```

Esto crea una ventana de 500ms donde los ICE candidates llegan antes que el answer, generando 404s en `/api/call/ice` y perdiendo candidatos ICE críticos.

---

### Bug #5 — `offerVersion` no existe en la respuesta del servidor

El `CallManager.ts` del callee (iOS) espera `s.offerVersion` para detectar ICE restarts:

**`CallManager.ts` línea 1118:**
```typescript
const serverOfferVersion: number = s.offerVersion ?? 1;
if (
  this._pc &&
  this._isValidSdp(s.offer) &&
  serverOfferVersion > this._appliedOfferVersion &&
  this._connectedOnce
) { ... }
```

Pero el endpoint `GET /api/call/:callId` del servidor **nunca devuelve `offerVersion`**:

```javascript
// server/index.js líneas 5937-5950
res.json({
  offer: JSON.parse(data.offer || 'null'),
  answer: data.answer ? JSON.parse(data.answer) : null,
  callerCandidates: JSON.parse(data.caller_candidates || '[]'),
  calleeCandidates: JSON.parse(data.callee_candidates || '[]'),
  type: data.type,
  callerId: data.caller_id,
  targetUserId: data.target_user_id,
  ended: data.ended,
  // ❌ NO hay offerVersion
});
```

El fallback `?? 1` hace que `serverOfferVersion` siempre sea 1, y como `_appliedOfferVersion` empieza en 0, el callee intentará aplicar el offer inicial otra vez durante un ICE restart en lugar del nuevo offer, rompiendo la renegociación.

---

## FLUJO COMPLETO CON BUGS MARCADOS

```
CALLER (iOS/Web)                   SERVIDOR                      CALLEE (iOS/Web)
─────────────────                  ─────────────────             ──────────────────
startCall()
  → POST /api/call/offer  ────────→ guarda en Supabase
  ← ok                             → VoIP Push/FCM  ──────────→ registerIncoming()
  
  (tono marcando)                                               startRingtone()

  startPoll('caller','fast')                                    
  [cada 900ms poll GET /call/id]                               
                                                               acceptCall()
                                                                 → POST /api/call/answer ──→ guarda answer en Supabase
  poll: ¿hay answer?  ────────────→ SELECT call_sessions       ← ok
  ← { answer: null }  ←────────────  [Supabase puede tardar  
                                       50-300ms en ser         ❌ NO emitToUser(callerId,{type:'call_answered'})
  (siguiente poll en 900ms)             consistente]           
                                                               → POST /api/call/ice × N  → guarda ICE (puede dar 404
                                                               ← ok/404                    si callId no encontrado)

  poll: ¿hay answer?  ────────────→ SELECT call_sessions
  ← { answer: {...} }  ←───────────  [ahora visible]

  ✅ setRemoteDescription(answer)
  startPoll('caller','slow')
  [cada 2000ms]

  ← calleeCandidates             GET /call/id incluye ICE
  ICE negotiation...

  onconnectionstatechange='connected'
  → POST /api/call/connected    ←─── ❌ 404 — endpoint no existe
  ← 404 (ignorado)
```

**Ventana de fallo:** Entre el momento en que el callee acepta y el próximo ciclo de polling del caller (hasta 900ms en iOS fast-poll, 2000ms en slow-poll), el caller sigue mostrando "timbrando" aunque la llamada ya fue aceptada. Si en ese intervalo los ICE candidates del callee llegaron al servidor pero el caller aún no aplicó el answer, el caller rechaza los candidatos ICE con error "can't add ICE candidate before remote description".

---

## FLUJO WEB vs iOS — Diferencia adicional

La web (`useWebRTC.ts`) usa **polling de 1000ms** con `answerSet` como variable local del closure. La condición de aplicar el answer es:

```typescript
// useWebRTC.ts — línea ~350
if (!answerSet && session.answer && p.signalingState === 'have-local-offer') {
  await p.setRemoteDescription(new RTCSessionDescription(session.answer));
  answerSet = true;
}
```

Esto es equivalente a lo que hace `CallManager.ts`. La diferencia es que la web hace polling cada 1000ms sin distinción de fase rápida/lenta, por lo que la ventana de detección máxima es 1000ms (vs 900ms en iOS fase rápida).

**Ambas plataformas comparten el mismo problema raíz** — ninguna recibe el SSE `call_answered` porque el servidor no lo emite.

---

## CONCLUSIONES

| # | Problema | Gravedad | Causa |
|---|---|---|---|
| 1 | Servidor no emite `call_answered` ni `call_ended` via SSE | 🔴 CRÍTICO | Falta `emitToUser()` en `/api/call/answer` y rutas de fin |
| 2 | Endpoints `/reject`, `/cancel`, `/connected`, `/claim` no existen | 🔴 CRÍTICO | No implementados en servidor |
| 3 | ICE candidates pueden dar 404 antes de que exista la sesión | 🟠 ALTO | Race condition: ICE llega antes que `ended=false` se propaga |
| 4 | `offerVersion` no incluido en respuesta del servidor | 🟠 ALTO | ICE restart del caller no se detecta correctamente en callee |
| 5 | `call_answered` / `call_ended` no están en el type union de `useChatStream` | 🟡 MEDIO | El event handler en _layout.tsx funciona (TypeScript usa `any` ahí) pero es un síntoma de que nunca se terminó |

---

## RECOMENDACIONES DE CORRECCIÓN

### Fix #1 — Crítico: Emitir SSE desde `/api/call/answer`

```javascript
// server/index.js — reemplazar el endpoint /api/call/answer
app.post('/api/call/answer', auth, async (req, res) => {
  const { callId, answer } = req.body;
  const { data } = await supabase
    .from('call_sessions')
    .select('call_id, caller_id')       // ← añadir caller_id
    .eq('call_id', callId)
    .eq('ended', false)
    .single();
  if (!data) return res.status(404).json({ error: 'Llamada no encontrada' });
  
  await supabase.from('call_sessions')
    .update({ answer: JSON.stringify(answer), updated_at: new Date().toISOString() })
    .eq('call_id', callId);

  // ✅ AÑADIR: Notificar al caller via SSE para que aplique el answer inmediatamente
  if (data.caller_id) {
    emitToUser(String(data.caller_id), {
      type: 'call_answered',
      callId,
      ts: Date.now(),
    });
  }

  res.json({ ok: true });
});
```

### Fix #2 — Crítico: Implementar los endpoints faltantes

```javascript
// Rechazar llamada (callee)
app.post('/api/call/reject', auth, async (req, res) => {
  const { callId } = req.body;
  const { data } = await supabase.from('call_sessions')
    .select('caller_id').eq('call_id', callId).single();
  await supabase.from('call_sessions')
    .update({ ended: true, status: 'rejected', updated_at: new Date().toISOString() })
    .eq('call_id', callId);
  if (data?.caller_id) {
    emitToUser(String(data.caller_id), { type: 'call_ended', callId, reason: 'rejected', ts: Date.now() });
  }
  res.json({ ok: true });
});

// Cancelar llamada (caller)
app.post('/api/call/cancel', auth, async (req, res) => {
  const { callId } = req.body;
  const { data } = await supabase.from('call_sessions')
    .select('target_user_id').eq('call_id', callId).single();
  await supabase.from('call_sessions')
    .update({ ended: true, updated_at: new Date().toISOString() })
    .eq('call_id', callId);
  if (data?.target_user_id) {
    emitToUser(String(data.target_user_id), { type: 'call_ended', callId, reason: 'cancelled', ts: Date.now() });
  }
  res.json({ ok: true });
});

// Marcar como conectado
app.post('/api/call/connected', auth, async (req, res) => {
  const { callId } = req.body;
  await supabase.from('call_sessions')
    .update({ connected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('call_id', callId);
  res.json({ ok: true });
});

// Reclamar llamada (anti doble-aceptación)
app.post('/api/calls/claim', auth, async (req, res) => {
  const { callId } = req.body;
  const { data } = await supabase.from('call_sessions')
    .select('callee_claimed').eq('call_id', callId).eq('ended', false).single();
  if (!data) return res.status(404).json({ error: 'Llamada no encontrada' });
  if (data.callee_claimed) return res.json({ alreadyAccepted: true });
  await supabase.from('call_sessions')
    .update({ callee_claimed: true, updated_at: new Date().toISOString() })
    .eq('call_id', callId);
  res.json({ alreadyAccepted: false });
});
```

> Nota: `callee_claimed` requiere una nueva columna `BOOLEAN DEFAULT false` en `call_sessions`.

### Fix #3 — Emitir SSE también desde DELETE `/api/call/:callId`

```javascript
app.delete('/api/call/:callId', auth, async (req, res) => {
  const { callId } = req.params;
  // Obtener participantes antes de borrar
  const { data } = await supabase.from('call_sessions')
    .select('caller_id, target_user_id')
    .eq('call_id', callId).single();
  
  await supabase.from('call_sessions')
    .update({ ended: true, updated_at: new Date().toISOString() })
    .eq('call_id', callId);

  // ✅ Notificar a ambos participantes
  const reason = req.query.reason || 'normal';
  if (data?.caller_id)      emitToUser(String(data.caller_id),      { type: 'call_ended', callId, reason, ts: Date.now() });
  if (data?.target_user_id) emitToUser(String(data.target_user_id), { type: 'call_ended', callId, reason, ts: Date.now() });

  setTimeout(async () => {
    await supabase.from('call_sessions').delete().eq('call_id', callId);
  }, 15000);
  res.json({ ok: true });
});
```

### Fix #4 — Añadir `offerVersion` a la respuesta de polling

```javascript
app.get('/api/call/:callId', auth, async (req, res) => {
  const { data } = await supabase.from('call_sessions').select('*')
    .eq('call_id', req.params.callId).single();
  if (!data) return res.status(404).json({ error: 'Llamada no encontrada' });
  res.json({
    offer: JSON.parse(data.offer || 'null'),
    answer: data.answer ? JSON.parse(data.answer) : null,
    callerCandidates: JSON.parse(data.caller_candidates || '[]'),
    calleeCandidates: JSON.parse(data.callee_candidates || '[]'),
    type: data.type,
    callerId: data.caller_id,
    targetUserId: data.target_user_id,
    ended: data.ended,
    offerVersion: data.offer_version ?? 1,  // ✅ AÑADIR
  });
});
```

Y en el upsert del offer añadir incremento de versión:
```javascript
// En POST /api/call/offer — al hacer el upsert, incluir:
offer_version: supabase.raw('COALESCE(offer_version, 0) + 1')
```

### Fix #5 — Añadir los tipos SSE faltantes en `useChatStream.ts`

```typescript
type StreamEvent = {
  type: 'new_message' | 'chat_updated' | 'connected' | 'heartbeat' | 'typing' | 'read'
       | 'sync_message' | 'session_revoked' | 'wallet_updated' | 'presence'
       | 'transfer_received' | 'transfer_pending' | 'transfer_accepted' | 'transfer_cancelled'
       | 'message_deleted'
       | 'group_call_participant_joined' | 'group_call_participant_left'
       | 'group_call_offer' | 'group_call_answer' | 'group_call_ice'
       | 'call_answered'    // ✅ AÑADIR
       | 'call_ended';      // ✅ AÑADIR
  // ...
  callId?: string;          // ✅ AÑADIR
  reason?: string;          // ✅ AÑADIR
```

---

## PRIORIDAD DE IMPLEMENTACIÓN

1. **Fix #1** — Emitir SSE `call_answered` desde `/api/call/answer` → resuelve el bug principal
2. **Fix #3** — Emitir SSE `call_ended` desde DELETE → resuelve "callee sigue timbrando cuando caller cuelga"
3. **Fix #2** — Implementar `/reject`, `/cancel`, `/connected`, `/claim` → resuelve notificaciones bidireccionales
4. **Fix #4** — Añadir `offerVersion` → resuelve reconexión tras cambio de red
5. **Fix #5** — Tipos TypeScript → cosmético, no afecta runtime

Los fixes #1 y #3 son ediciones de ~5 líneas cada uno y resuelven el 80% del problema reportado.
