# Design Document — EGChat Mobile Paridad

## Overview

Este documento describe la arquitectura de componentes React Native, hooks personalizados, flujos de navegación con Expo Router y patrones de integración con el backend para cerrar las 9 brechas de paridad funcional de la app nativa EGChat (`egchat-mobile/`). Todos los cambios se implementan exclusivamente dentro de `egchat-mobile/`, siguiendo los patrones establecidos en el código existente.

---

## Architecture

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | React Native 0.81 + TypeScript |
| Navegación | Expo Router v6 (Stack + Modal) |
| Estilos | `StyleSheet` nativo + `useThemeContext` / `DarkColors` |
| Estado local | `useState` / `useRef` / `useCallback` en componentes y hooks |
| Estado de sesión | Hook `useWebRTC` para llamadas; `useState` local para el resto |
| API | `src/api.ts` — cliente HTTP con token `SecureStore`, reintentos y timeout |
| Notificaciones | `Toast` (`src/components/Toast.tsx`) |
| Navegación global | Expo Router `router.push / router.back / router.replace` |

### Principios de diseño aplicados

1. **Paridad web**: cada brecha replica el comportamiento de la versión web de referencia.
2. **Patrones existentes**: se sigue el mismo modelo `Screen + StyleSheet + useThemeContext` que usan `ocio.tsx`, `servicios-diarios.tsx` y `apuestas.tsx`.
3. **Sin clientes HTTP alternativos**: todo usa el `request()` interno de `src/api.ts`.
4. **Expo Router para toda navegación**: rutas ya declaradas en `app/_layout.tsx`, sin crear nuevas a menos que sea imprescindible.
5. **Dark mode**: todas las pantallas leen `isDark` de `useThemeContext` y aplican `C = isDark ? DarkColors : Colors`.
6. **Toast para feedback**: errores y confirmaciones usan `toast.error / toast.success / toast.info` de `src/components/Toast`.

---

## Components and Interfaces

### Req 1 — LIA-25

#### Archivos involucrados

```
egchat-mobile/
  app/(tabs)/index.tsx          ← añadir botón/tab LIA-25
  src/components/LIAScreen.tsx  ← nuevo componente (Modal fullscreen)
  src/api.ts                    ← liaAPI.chat ya existe
```

#### LIAScreen — estructura interna

```
LIAScreen (Modal fullscreen)
  ├── Header (título + botón cerrar)
  ├── ScrollView / FlatList  ← historial de mensajes
  │   └── LIAMessageBubble  ← burbuja user / burbuja lia
  ├── LoadingIndicator       ← visible mientras isLoading=true
  ├── ErrorBanner            ← visible cuando error != null
  └── InputBar               ← TextInput + botón enviar
```

#### Hook: `useLIA`

```typescript
// src/hooks/useLIA.ts
interface LIAMessage { role: 'user' | 'assistant'; content: string }

function useLIA() {
  const [history, setHistory] = useState<LIAMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async (text: string) => {
    // 1. Añadir mensaje usuario al historial
    // 2. setIsLoading(true), setError(null)
    // 3. await liaAPI.chat(text, history)
    // 4. Añadir respuesta al historial
    // 5. Manejar error → setError(message)
    // 6. setIsLoading(false)
  }

  return { history, isLoading, error, send }
}
```

El historial vive en un módulo-level store (ref fuera del componente) para persistir entre montajes en la misma sesión, cumpliendo el requisito 1.7.


---

### Req 2 — Stories

#### Archivos involucrados

```
egchat-mobile/
  app/stories.tsx              ← ya existe, ampliar con gaps restantes
  src/utils/storyParser.ts     ← ya existe parseStoriesResponse
```

#### StoryViewer — flujo de datos

```
StoriesScreen
  ├── state: groups[], myGroup, uploading, viewingGroup, activeTab
  ├── loadStories()  → storiesAPI.getAll() + authAPI.me()
  ├── uploadStory(uri) → storiesAPI.create() → loadStories()
  ├── deleteStory(id)  → storiesAPI.delete() → loadStories()
  ├── markViewed(group) → storiesAPI.registerView(storyId)
  │     + setGroups(map seen=true)
  └── StoryViewer (Modal)
        ├── state: groupIdx, storyIdx, progress (Animated.Value)
        ├── startProgress() → Animated.timing(5000ms) → goNext()
        ├── goNext() — avanza historia o grupo o cierra
        ├── goPrev() — retrocede historia o grupo
        └── Touch zones (left 1/3 = prev, right 2/3 = next)
```

#### Clasificación de tabs

```typescript
// Invariante de clasificación (Req 2.10)
const recentGroups = groups.filter(g => !g.seen)
const seenGroups   = groups.filter(g => g.seen)
```

La clasificación se actualiza al llamar `markViewed` dentro de `StoryViewer.onStoryView`.

---

### Req 3 — ImageViewer

#### Archivos involucrados

```
egchat-mobile/
  src/components/ImageViewer.tsx         ← nuevo componente
  src/components/chat/ChatMessageBubble.tsx ← añadir onOpenImage handler
```

#### ImageViewer — diseño del componente

```typescript
// Props
interface ImageViewerProps {
  visible: boolean
  images: string[]       // URIs
  initialIndex?: number
  onClose: () => void
}
```

#### Gestos

| Gesto | Librería | Acción |
|---|---|---|
| Pinch | `react-native-gesture-handler` PinchGestureHandler | scale ∈ [1, 4] |
| Swipe vertical | PanResponder `dy > 80` | cerrar con Animated fade-out |
| Swipe horizontal | FlatList `pagingEnabled` | navegar entre imágenes |

```
ImageViewer (Modal, statusBarTranslucent)
  ├── FlatList horizontal pagingEnabled ← una imagen por página
  │   └── PinchGestureHandler
  │       └── Animated.Image (scale transform)
  ├── CloseButton (top-right, posición absoluta)
  ├── PanResponder (overlay, captura swipe vertical)
  └── ErrorState (onError del Image) + RetryButton
```

El cierre por swipe usa `Animated.timing` de opacidad y `onAnimationEnd → onClose()`.

---

### Req 4 — Video Calls

#### Archivos involucrados

```
egchat-mobile/
  app/call/[callId].tsx         ← ya existe, corregir gaps
  src/hooks/useWebRTC.ts        ← ya completo con HAS_NATIVE_MEDIA
  app/_layout.tsx               ← IncomingCallModal via Alert (ya existe)
```

#### Flujo de permisos (Req 4.2 / 4.3)

```typescript
// En startCallNative / answerCallNative (useWebRTC.ts)
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'

const requestMediaPermissions = async (type: 'audio' | 'video') => {
  const perms = type === 'video'
    ? [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.ANDROID.RECORD_AUDIO]
    : [PERMISSIONS.ANDROID.RECORD_AUDIO]

  for (const perm of perms) {
    const result = await request(perm)
    if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
      throw new Error('PERMISSION_DENIED')
    }
  }
}
```

> **Nota**: `react-native-permissions` no está en `package.json`. La implementación alternativa usa `PermissionsAndroid` de React Native core (ya disponible) para Android y `expo-camera` / `expo-av` para iOS, evitando nuevas dependencias.

#### Layout PiP (Req 4.4)

```typescript
// Posición localPip en call/[callId].tsx
localPip: {
  position: 'absolute',
  right: 16,
  top: insets.top + 80,  // esquina superior derecha
  width: 90,
  height: 120,
  borderRadius: 12,
  overflow: 'hidden',
  zIndex: 10,
}
```

Este estilo ya existe en `call/[callId].tsx` y cumple exactamente el requisito.

#### IncomingCallModal — flujo en _layout.tsx

```
pollIncoming() polling cada 2s
  → onIncoming(call) callback
    → Alert.alert (ya implementado)
      → Aceptar → router.push /call/[callId] con role='callee'
      → Rechazar → no action
```

El `IncomingCallModal` como `Modal` nativo superpuesto está implementado en `call/[callId].tsx` cuando `role === 'callee' && callState === 'idle'`.


---

### Req 5 — OcioScreen

#### Archivos involucrados

```
egchat-mobile/
  app/ocio.tsx    ← ya existe, verificar/completar gaps
```

#### Arquitectura actual (ya implementada)

`ocio.tsx` ya tiene la estructura correcta con `CATEGORIES` (4 categorías), navegación interna por `selected` state, botón de llamada con `Linking.openURL('tel:...')` y soporte `useThemeContext`. Los gaps son:
- Verificar que el botón de llamada se **oculta** cuando `phone === ''` (ya cumplido: `{item.phone ? <CallBtn> : null}`).
- Añadir el conteo de establecimientos en la tarjeta de categoría (ya cumplido: `cat.items.length` establecimientos).

No se requieren cambios estructurales significativos.

---

### Req 6 — CEMAC

#### Archivos involucrados

```
egchat-mobile/
  app/cemac.tsx          ← ya existe, verificar gaps
  src/data/cemacData.ts  ← RATES, T, COUNTRIES, SERVICES, etc.
```

#### Flujo de conversión de divisas (Req 6.7)

```typescript
// Cálculo local, sin backend (src/data/cemacData.ts: RATES)
const convertResult = useMemo(() => {
  const n = parseFloat(amt)
  if (!n || fromCur === toCur) return null
  if (fromCur === 'XAF') return (n * (RATES[toCur] || 0)).toFixed(4)
  if (toCur === 'XAF')   return (n / (RATES[fromCur] || 1)).toFixed(0)
  return (n * (RATES[toCur] || 0) / (RATES[fromCur] || 1)).toFixed(4)
}, [amt, fromCur, toCur])
```

Este código ya existe en `cemac.tsx` y es correcto.

#### Flujo de transferencia (Req 6.4 / 6.5 / 6.6)

```
TransferModal
  ├── Validar: name.trim() && account.trim() && amount > 0 && amount <= balance
  │   └── KO → toast.error, no enviar
  └── OK → cemacAPI.createTransfer(data)
        ├── éxito → toast.success + cerrar modal + recargar balance
        └── error → toast.error
```

#### Multi-idioma (Req 6.8)

El objeto `T[lang]` de `cemacData.ts` provee todos los textos. El `lang` state se setea al seleccionar un país (default 'ES'). Todos los textos de la UI usan `t.fieldName` en lugar de literales.

---

### Req 7 — Apuestas

#### Archivos involucrados

```
egchat-mobile/
  app/apuestas.tsx       ← ya existe, verificar gaps
  src/data/apuestasData.ts
```

#### Cálculo de ganancia potencial en tiempo real (Req 7.4)

```typescript
// Reactivo: se recalcula en cada keystroke de stake
const totalStake  = betSlip.reduce((s, b) => s + (parseInt(b.stake) || 0), 0)
const totalPayout = betSlip.reduce((s, b) =>
  s + Math.floor((parseInt(b.stake) || 0) * b.odds), 0)
```

Estos valores se muestran en el `BetSlipModal` y en el `slipFab`. El cálculo ya está implementado en `apuestas.tsx`.

#### Validación de saldo (Req 7.5 / 7.6)

```typescript
const placeBets = () => {
  if (totalStake <= 0 || totalStake > balance) {
    Alert.alert('Error', 'Saldo insuficiente o importe inválido')
    return   // no procesar
  }
  // simular resultado, actualizar balance, toast
}
```

#### Flujo Casino / Lotería

```
Casino:
  playCasino()
    ├── Validar: amount >= minBet && amount <= balance
    │   └── KO → Alert.alert
    └── OK → random multiplier → setBalance, setCasinoRes

Lotería:
  playLottery(price)
    ├── Verificar: price <= balance
    │   └── KO → Alert.alert
    └── OK → random prize → setBalance, toast
```

---

### Req 8 — MiTaxi

#### Archivos involucrados

```
egchat-mobile/
  app/mitaxi.tsx                      ← ya existe, verificar gaps
  src/components/mitaxi/MiTaxiMap.tsx ← ya existe
  src/data/mitaxiPlaces.ts            ← MALABO_CENTER, MITAXI_PLACE_NAMES, findPlaceCoords
```

#### Flujo GPS (Req 8.1 / 8.2 / 8.3)

```typescript
const initGps = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== 'granted') {
    applyUserCoords(MALABO_CENTER)  // Req 8.3: fallback Malabo
    return
  }
  const pos = await Location.getCurrentPositionAsync(...)
  applyUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })

  // Req 8.12: watch con distanceInterval=25m
  gpsWatchRef.current = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
    update => applyUserCoords({ ... })
  )
}
```

#### Autocomplete de lugares (Req 8.4)

```typescript
useEffect(() => {
  const timer = setTimeout(async () => {
    const q = text.trim().toLowerCase()
    const filtered = MITAXI_PLACE_NAMES
      .filter(p => p.toLowerCase().includes(q))
      .slice(0, 6)
    setSuggestions(filtered)
  }, 350)   // ≤ 350ms de debounce
  return () => clearTimeout(timer)
}, [text])
```

#### Validación de saldo (Req 8.8)

```typescript
if (balance < selected.price) {
  Alert.alert('Saldo insuficiente', 'Recarga tu monedero para pedir el viaje.')
  return
}
```


---

### Req 9 — ServiciosDiarios

#### Archivos involucrados

```
egchat-mobile/
  app/servicios-diarios.tsx   ← ya existe, verificar gaps
  src/data/serviciosDiarios.ts
```

La pantalla ya implementa: 3 tabs (Restaurantes, Vuelos, Gasolineras), cambio de tab sin recargar, datos por establecimiento, `Linking.openURL('tel:...')` y soporte de tema. Los gaps son:

- Verificar que el tab activo usa `Colors.accent` como color de borde inferior y texto (ya implementado: `tabActive: { borderBottomColor: Colors.accent }` y `tabTextActive: { color: Colors.accent }`).
- Confirmar que todos los establecimientos muestran nombre, descripción, precio orientativo y botón de llamada.

---

## Navigation Architecture

### Estructura de rutas (Expo Router)

Todas las rutas ya están declaradas en `app/_layout.tsx`. Las pantallas de servicios usan `presentation: 'modal'`:

```
app/
  _layout.tsx               ← Stack root con todas las rutas registradas
  (tabs)/                   ← Home Dashboard con bottom nav
  (auth)/                   ← Login / Register
  stories.tsx               ← presentation: 'modal'
  ocio.tsx                  ← presentation: 'modal'
  cemac.tsx                 ← presentation: 'modal'
  apuestas.tsx              ← presentation: 'modal'
  mitaxi.tsx                ← presentation: 'modal'
  servicios-diarios.tsx     ← presentation: 'modal'
  call/[callId].tsx         ← presentation: 'fullScreenModal', gestureEnabled: false
```

### Apertura de pantallas

```typescript
// Desde cualquier pantalla
router.push('/stories')
router.push('/ocio')
router.push('/cemac')
router.push('/apuestas')
router.push('/mitaxi')
router.push('/servicios-diarios')

// LIA-25 (Modal dentro de (tabs)/index.tsx)
setShowLIA(true)   // no requiere nueva ruta

// ImageViewer (Modal dentro del chat)
setImageViewerVisible(true)
```

---

## Data Models

### LIA-25

```typescript
interface LIAMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Módulo-level store para persistir en sesión (Req 1.6 / 1.7)
let liaSessionHistory: LIAMessage[] = []
```

### Stories

```typescript
// Ya definido en src/utils/storyParser.ts
interface StoryGroup {
  userId: string
  userName: string
  userAvatar?: string
  avatarColor: string
  storyId: string
  stories: Story[]
  seen: boolean
  views: number
}

interface Story {
  id: string
  media_url: string
  created_at: string
  caption?: string
  type?: 'image' | 'video'
}
```

### ImageViewer

```typescript
interface ImageViewerState {
  visible: boolean
  images: string[]
  currentIndex: number
  scale: number          // ∈ [1, 4]
  isLoading: boolean
  hasError: boolean
}
```

### VideoCall

```typescript
// Ya definido en src/hooks/useWebRTC.ts
type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

interface CallSession {
  callId: string
  callType: 'audio' | 'video'
  role: 'caller' | 'callee'
  targetUserId: string
  targetName: string
  targetAvatar?: string
  offer?: RTCSessionDescriptionInit
}
```

### MiTaxi

```typescript
// Ya definido en src/data/mitaxiPlaces.ts
interface MapCoord { latitude: number; longitude: number }

type TaxiStep = 'form' | 'searching' | 'matched' | 'riding' | 'rating'

interface DriverInfo {
  name: string
  rating: number
  plate: string
  vehicle: string
  initials: string
}
```

---

## Error Handling

### Estrategia transversal

| Escenario | Manejo |
|---|---|
| Error de red (fetch) | `src/api.ts` reintenta hasta 3 veces con backoff exponencial |
| Timeout (GET: 25s, POST: 40s) | `AbortController` → error amigable |
| 401 Unauthorized | `onUnauthorized()` → `router.replace('/(auth)/login')` |
| Error de negocio (4xx) | `toast.error(message)` en el componente |
| Permisos denegados (cámara, ubicación) | `Alert.alert` con enlace a ajustes del sistema |
| Subida de story fallida | `Alert.alert` sin modificar la lista |
| Transferencia CEMAC fallida | `toast.error` sin cerrar el modal |
| Imagen no cargable en ImageViewer | Estado `hasError` → mensaje + botón retry |
| WebRTC `connectionState: failed` | `endCallInternal()` → navegar atrás |

### LIA-25 — error específico

```typescript
catch (err: any) {
  const msg = err.message || 'No se pudo conectar con LIA-25. Inténtalo de nuevo.'
  setError(msg)
  // El botón "Reintentar" llama a send(lastMessage) preservando el historial
}
```


---

## Styling Patterns

### Patrón base para todas las pantallas

```typescript
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme'
import { useThemeContext } from '../src/theme/ThemeContext'
import { DarkColors } from '../src/theme/darkMode'

export default function SomeScreen() {
  const { isDark } = useThemeContext()
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      {/* ... */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Usar Colors.* para valores por defecto (modo claro)
  // Sobreescribir con C.* inline para soporte dark mode
})
```

### Tab activa con acento

```typescript
// Patrón de servicios-diarios.tsx (Req 9.6)
tabActive: {
  borderBottomWidth: 2,
  borderBottomColor: Colors.accent,  // #07C160
},
tabTextActive: {
  color: Colors.accent,
},
```

### Gradiente del header (LIA-25, calls)

```typescript
import { LinearGradient } from 'expo-linear-gradient'

<LinearGradient
  colors={[Colors.gradientStart, Colors.gradientEnd]}  // #00C8A0 → #00B4E6
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.header}
/>
```

---

## New Files Summary

| Archivo | Propósito |
|---|---|
| `src/hooks/useLIA.ts` | Lógica de conversación LIA-25: historial, send, loading, error |
| `src/components/LIAScreen.tsx` | Modal de conversación con LIA-25 |
| `src/components/ImageViewer.tsx` | Visor de imágenes con pinch-zoom, swipe y navegación |

### Archivos modificados

| Archivo | Cambios |
|---|---|
| `app/(tabs)/index.tsx` o pantalla principal | Añadir punto de entrada a LIA-25 |
| `src/components/chat/ChatMessageBubble.tsx` | Conectar `onOpenImage` con `ImageViewer` |
| `app/stories.tsx` | Verificar y completar gaps (tab clasificación, registerView, delete) |
| `app/call/[callId].tsx` | Verificar permisos, PiP sizing, ICE sending |
| `app/ocio.tsx` | Verificar ocultamiento de botón sin teléfono |
| `app/cemac.tsx` | Verificar flujo de transferencia y conversión |
| `app/apuestas.tsx` | Verificar cálculo en tiempo real y validaciones |
| `app/mitaxi.tsx` | Verificar GPS watch y validación de saldo |
| `app/servicios-diarios.tsx` | Verificar tab activa con Colors.accent |

---

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe cumplirse en todas las ejecuciones válidas del sistema — esencialmente, una afirmación formal sobre lo que el software debe hacer. Las propiedades sirven de puente entre las especificaciones legibles por humanos y las garantías de corrección verificables automáticamente.*

### Property 1: LIA — ningún mensaje expone clave de API

*Para cualquier* mensaje de texto enviado a LIA-25, la petición construida por `liaAPI.chat` no debe incluir ningún campo `api_key`, `apiKey`, `openai_key` ni cabecera `Authorization` con clave en texto plano dentro del cuerpo JSON, dado que la clave reside únicamente en el backend.

**Validates: Requirements 1.2**

---

### Property 2: LIA — el historial crece monotónicamente

*Para cualquier* secuencia de N mensajes enviados a LIA-25 dentro de una sesión, el historial en memoria tras N envíos exitosos contiene exactamente 2×N entradas (un par user/assistant por intercambio).

**Validates: Requirements 1.6**

---

### Property 3: LIA — errores siempre producen mensaje no vacío y acción de reintento

*Para cualquier* respuesta de error (código HTTP 4xx/5xx o AbortError por timeout) del endpoint `/api/lia/chat`, el estado `error` del hook `useLIA` es una cadena no vacía y el componente `LIAScreen` renderiza un elemento interactivo de reintento.

**Validates: Requirements 1.5**

---

### Property 4: Stories — subida exitosa actualiza el listado

*Para cualquier* URI de media válida, después de que `storiesAPI.create` responda con éxito y se invoque `loadStories()`, la lista de historias contiene al menos una entrada más que antes de la subida.

**Validates: Requirements 2.1**

---

### Property 5: Stories — error de subida no modifica el listado

*Para cualquier* error arrojado por `storiesAPI.create`, el número de historias en la lista permanece invariante al valor previo a la llamada.

**Validates: Requirements 2.3**

---

### Property 6: StoryViewer — avance automático tras 5000 ms

*Para cualquier* grupo de historias con al menos una historia, el índice de historia activo avanza en 1 (o el visor se cierra si es la última) tras transcurrir `STORY_DURATION` (5000 ms) sin interacción del usuario.

**Validates: Requirements 2.5**

---

### Property 7: StoryViewer — navegación táctil mantiene índice en rango válido

*Para cualquier* estado `(groupIdx, storyIdx, groups)`, un toque izquierdo produce `storyIdx' ≥ 0` y un toque derecho produce `storyIdx' ≤ group.stories.length - 1`, nunca saliendo del rango de índices válidos.

**Validates: Requirements 2.6, 2.7**

---

### Property 8: StoryViewer — registerView se llama para cada historia visualizada

*Para cualquier* historia con `storyId` no nulo que sea mostrada por `StoryViewer`, `storiesAPI.registerView(storyId)` se invoca exactamente una vez al abrirse ese grupo.

**Validates: Requirements 2.8**

---

### Property 9: Stories — clasificación Recientes/Vistos es exhaustiva y mutuamente excluyente

*Para cualquier* lista de grupos de historias, la unión de `recentGroups` y `seenGroups` es igual al conjunto total de grupos, y la intersección es vacía (ningún grupo aparece en ambas pestañas).

**Validates: Requirements 2.10**

---

### Property 10: ImageViewer — escala siempre en [1, 4]

*Para cualquier* gesto de pinch con factor de escala S, el valor de escala aplicado a la imagen es `clamp(S, 1, 4)`, nunca fuera del intervalo.

**Validates: Requirements 3.2**

---

### Property 11: ImageViewer — swipe vertical mayor de 80 px siempre cierra el visor

*Para cualquier* gesto de desplazamiento vertical con `dy > 80`, el estado `visible` del `ImageViewer` pasa a `false`.

**Validates: Requirements 3.3**

---

### Property 12: ImageViewer — navegación horizontal mantiene índice en rango

*Para cualquier* array de N imágenes (N > 1), el índice activo tras un swipe horizontal permanece siempre en `[0, N-1]`.

**Validates: Requirements 3.6**

---

### Property 13: VideoCall — mute toggle es idempotente en el track de audio

*Para cualquier* estado inicial de silencio `isMuted₀`, después de llamar a `toggleMute()` el nuevo estado es `!isMuted₀` y `audioTrack.enabled === !isMuted₀`.

**Validates: Requirements 4.6**

---

### Property 14: VideoCall — camera toggle es idempotente en el track de video

*Para cualquier* estado inicial `isCamOff₀`, después de `toggleCamera()` el nuevo estado es `!isCamOff₀` y `videoTrack.enabled === !isCamOff₀`.

**Validates: Requirements 4.7**

---

### Property 15: VideoCall — colgar libera todos los tracks

*Para cualquier* llamada activa con `localStream` no nulo, después de `endCall()` todos los `MediaStreamTrack` de `localStream` tienen `enabled = false` y `callState === 'ended'`.

**Validates: Requirements 4.12**

---

### Property 16: Ocio y ServiciosDiarios — llamada telefónica invoca Linking con formato tel:

*Para cualquier* establecimiento cuyo campo `phone` sea una cadena no vacía, pulsar el botón de llamada invoca `Linking.openURL` con un argumento de la forma `tel:{phone}`.

**Validates: Requirements 5.4, 9.4**

---

### Property 17: CEMAC — conversión de divisas es matemáticamente correcta

*Para cualquier* cantidad `n > 0` y par de monedas `(fromCur, toCur)` distintas, el resultado de conversión es `n * RATES[toCur] / RATES[fromCur]` con precisión numérica estándar de JavaScript.

**Validates: Requirements 6.7**

---

### Property 18: CEMAC — transferencia con saldo insuficiente o formulario incompleto no llama al backend

*Para cualquier* estado de formulario donde `amount > balance` o cualquier campo requerido esté vacío, `cemacAPI.createTransfer` no es invocado.

**Validates: Requirements 6.6**

---

### Property 19: Apuestas — ganancia potencial total es la suma de productos importe×cuota

*Para cualquier* cupón de apuestas con N selecciones, cada una con `stake_i` e `odds_i`, el `totalPayout` mostrado es `∑ floor(stake_i * odds_i)`.

**Validates: Requirements 7.4**

---

### Property 20: Apuestas — apuesta con totalStake > saldo no modifica el saldo

*Para cualquier* estado donde `totalStake > balance` o `totalStake <= 0`, la acción de apostar no modifica `balance` y no ejecuta la simulación de resultado.

**Validates: Requirements 7.6**

---

### Property 21: MiTaxi — sugerencias de lugares son subconjunto filtrado de MITAXI_PLACE_NAMES

*Para cualquier* cadena de búsqueda `q`, el array `suggestions` es un subconjunto de `MITAXI_PLACE_NAMES` donde cada elemento contiene `q` como subcadena (case-insensitive), limitado a 6 resultados.

**Validates: Requirements 8.4**

---

### Property 22: MiTaxi — precio de vehículo > saldo impide solicitar viaje

*Para cualquier* tipo de vehículo `v` con `v.price > balance`, pulsar el botón de pedir viaje no invoca `taxiAPI.requestRide`.

**Validates: Requirements 8.8**

---

### Property 23: ServiciosDiarios — tab activa siempre resaltada con Colors.accent

*Para cualquier* tab seleccionada `t`, el indicador visual de esa tab (borde inferior y texto) usa `Colors.accent`, y ninguna otra tab usa ese mismo color de acento en su indicador.

**Validates: Requirements 9.6**


---

## Testing Strategy

### Enfoque dual: tests de ejemplo + tests de propiedades

Cada brecha de paridad se cubre con dos capas complementarias:

1. **Tests de ejemplo** (unit/integration): verifican comportamientos específicos con datos concretos — estado de carga, navegación, renderizado de errores, permisos denegados, layout de PiP.

2. **Tests de propiedades** (property-based): verifican invariantes universales para cualquier entrada generada — cálculos matemáticos, validaciones de rango, integridad de estado, filtrado de colecciones.

### Herramienta recomendada

- **fast-check** para TypeScript/React Native: generación de arbitrarios para strings, numbers, arrays y objetos.
- Tests de ejemplo con **Jest** + `@testing-library/react-native`.

### Configuración de tests de propiedad

```typescript
// Mínimo 100 iteraciones por propiedad
import * as fc from 'fast-check'

test('Property N: descripción', () => {
  fc.assert(
    fc.property(fc.string(), fc.array(fc.anything()), (msg, history) => {
      // verificar invariante
    }),
    { numRuns: 100 }
  )
})
```

### Tag de trazabilidad

Cada test de propiedad lleva el tag:

```
Feature: egchat-mobile-paridad, Property {N}: {texto de la propiedad}
```

### Prioridad de cobertura

| Brecha | Tests de ejemplo | Tests de propiedad |
|---|---|---|
| LIA-25 | Carga, respuesta, error, historial | Props 1, 2, 3 |
| Stories | Upload UI, delete UI | Props 4, 5, 6, 7, 8, 9 |
| ImageViewer | Modal visible, botón cierre | Props 10, 11, 12 |
| Video Calls | Permisos, PiP layout, incoming modal | Props 13, 14, 15 |
| Ocio | Categorías, sin teléfono | Prop 16 |
| CEMAC | Tabs, balance, transfer modal | Props 17, 18 |
| Apuestas | Slip UI, casino, lotería | Props 19, 20 |
| MiTaxi | GPS fallback, driver info | Props 21, 22 |
| ServiciosDiarios | 3 tabs, datos completos | Prop 23 |
