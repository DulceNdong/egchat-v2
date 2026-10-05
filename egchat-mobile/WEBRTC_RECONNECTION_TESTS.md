# WebRTC — Pruebas de reconexión ante cambios de red

> Versión: v2 (reconexión robusta)  
> Archivos clave: `src/call/CallManager.ts`, `src/call/callSupabase.ts`

---

## Flujo de estados esperado

```
connected
  ↓ (red cae o cambia)
reconnecting          ← UI debe mostrar "Reconectando…"
  ↓ (ICE restart exitoso)
connected             ← llamada continúa sin intervención del usuario

Si falla tras 4 intentos:
reconnecting → failed → ended → idle
```

---

## Escenarios de prueba

### Dispositivos requeridos
- **Dispositivo A** (caller): iPhone o Android con SIM y Wi-Fi
- **Dispositivo B** (callee): igual

Usa **Flipper** o `adb logcat` / Console.app para ver los logs `[CallManager]`.

---

### Escenario 1 — Wi-Fi → 4G/5G (durante llamada activa)

**Pasos:**
1. Iniciar llamada entre A y B. Esperar `connected`.
2. En el dispositivo A: desactivar Wi-Fi desde Ajustes (sin activar modo avión).
3. Observar logs y UI.

**Comportamiento esperado:**
- `[CallManager] NetInfo: cambio de tipo de red — restart ICE proactivo`
- commState → `reconnecting` en ~0-1s (antes de que WebRTC lo detecte)
- `[CallManager] ICE restart en Xms (intento 1/4)`
- ICE restart offer enviado al servidor
- Callee recibe nuevo offer, genera answer
- commState → `connected` en 5-15s
- Audio continúa (posible corte de 2-5s durante el cambio)

**Qué buscar en logs:**
```
[CallManager] NetInfo: cambio de tipo de red
[CallManager] ICE restart en ...ms (intento 1/4)
[CallManager] ICE restart offer enviado
[CallManager] Callee: nuevo offer v2 (restart)
[CallManager] Callee: answer de restart enviado
```

---

### Escenario 2 — 4G/5G → Wi-Fi

**Pasos:**
1. Iniciar llamada con Wi-Fi **desactivado** (solo datos móviles). Esperar `connected`.
2. Activar Wi-Fi en Ajustes durante la llamada.
3. Observar logs y UI.

**Comportamiento esperado:** igual que Escenario 1 pero en sentido inverso.

---

### Escenario 3 — Pérdida total de Internet (modo avión)

**Pasos:**
1. Llamada activa entre A y B. Esperar `connected`.
2. Activar **modo avión** en dispositivo A durante 10s.
3. Desactivar modo avión.
4. Observar recuperación.

**Comportamiento esperado:**
- `[CallManager] NetInfo: sin red — reconnecting anticipado`
- commState → `reconnecting` inmediatamente
- Durante modo avión: intentos 1, 2 (con backoff 2s, 4s) — ambos fallan silenciosamente
- Al salir del modo avión: `[CallManager] NetInfo: red recuperada — restart ICE proactivo`
- ICE restart exitoso → `connected`

**Nota:** Si el modo avión dura más de 20s (ICE_RESTART_TIMEOUT_MS), el intento en curso falla pero se lanza uno nuevo al detectar red recuperada via NetInfo.

---

### Escenario 4 — Pérdida total sin recuperación

**Pasos:**
1. Llamada activa. Esperar `connected`.
2. Activar modo avión en **ambos** dispositivos simultáneamente.
3. Mantener modo avión >90s.

**Comportamiento esperado:**
- Intentos 1-4 con backoff 2s/4s/8s/16s
- Tras intento 4: commState → `failed` → `ended`
- UI muestra pantalla de llamada terminada
- `_finalCleanup()` ejecutado: streams parados, PC cerrada, timers cancelados

---

### Escenario 5 — Cambio de red durante vídeo

**Pasos:**
1. Llamada de vídeo activa. Esperar `connected` con vídeo visible.
2. Cambiar de Wi-Fi a 4G en dispositivo A.
3. Observar si el vídeo se recupera.

**Comportamiento esperado:**
- Igual que Escenario 1
- Vídeo puede congelarse durante reconexión
- Al reconectar, vídeo reanuda automáticamente (no se requiere reactivar cámara)
- `_isCamOff` no debe cambiar durante el proceso

---

### Escenario 6 — Múltiples cambios rápidos (ping-pong Wi-Fi/4G)

**Pasos:**
1. Llamada activa.
2. Cambiar Wi-Fi ↔ 4G cada 5s, 3 veces seguidas.

**Comportamiento esperado:**
- `_iceRestartPending` evita lanzar múltiples restarts simultáneos
- Solo un restart activo a la vez
- No se acumulan timers ni PeerConnections duplicadas
- Eventualmente `connected` o `failed` (no estado indefinido)

---

### Escenario 7 — App a segundo plano durante llamada

**Pasos:**
1. Llamada activa.
2. Presionar Home (app a background).
3. Esperar 30s.
4. Volver a la app.

**Comportamiento esperado:**
- Audio continúa en background (AVAudioSession `playAndRecord`)
- Al volver: si ICE está `disconnected` → restart automático
- Audio y vídeo se recuperan
- `_applyAudioRoute()` restaura la ruta correcta (altavoz/auricular según preferencia)

---

### Escenario 8 — Supabase Realtime cae durante llamada

**Pasos:**
1. Llamada activa.
2. Simular caída de Realtime: desactivar Wi-Fi 5s y reactivar (sin cambiar 4G → los datos siguen, pero el WS de Supabase se corta).

**Comportamiento esperado:**
- `[callSupabase] CHANNEL_ERROR call-state:... — reintento 1/3 en 1000ms`
- Canal se resuscribe automáticamente
- Estado de llamada sigue sincronizado
- El polling HTTP sigue funcionando durante la caída de Realtime (backup)

---

## Configuración de logs útiles

Añadir temporalmente para debug (quitar en producción):

```typescript
// En CallManager.ts — ya incluidos en __DEV__
[CallManager] ICE restart en Xms (intento N/4)
[CallManager] ICE restart offer enviado
[CallManager] Callee: nuevo offer vN (restart)
[CallManager] Callee: answer de restart enviado
[CallManager] ICE restart timeout — fallo
[CallManager] NetInfo: cambio de tipo de red
[CallManager] NetInfo: sin red
[CallManager] NetInfo: red recuperada
[CallManager] iOS inactive — interrupción probable
[CallManager] Ruta audio → Speaker/Receiver/Bluetooth
```

---

## Métricas de éxito

| Escenario | Tiempo máx. reconexión | Tasa éxito esperada |
|---|---|---|
| Wi-Fi → 4G | 15s | >90% |
| 4G → Wi-Fi | 15s | >90% |
| Modo avión <20s | 20s tras recuperar red | >85% |
| Modo avión >60s | — (ended) | N/A |
| App background 30s | 10s al volver | >95% |
| Cambio durante vídeo | 20s | >85% |

---

## Valores configurables (CallManager.ts)

```typescript
const ICE_DISCONNECTED_BASE_MS = 2_000;  // base backoff
const ICE_RESTART_TIMEOUT_MS   = 20_000; // timeout por intento
const RECONNECT_MAX            = 4;      // intentos máximos
```

Para redes muy lentas (zonas rurales), aumentar `ICE_RESTART_TIMEOUT_MS` a 30_000.
