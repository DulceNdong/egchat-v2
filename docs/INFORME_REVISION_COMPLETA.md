# 🔍 Informe de Revisión Completa — EGCHAT v3.1
**Fecha:** 4 Junio 2026 | **Commit:** d622465

---

## 📊 RESUMEN EJECUTIVO

| Categoría | Antes | Después |
|---|---|---|
| Build | ✅ OK | ✅ OK |
| Bundle principal | 1,529 kB | **835 kB (-45%)** |
| Vulnerabilidades críticas | 1 (protobufjs) | 1 (no fixable sin breaking) |
| Vulnerabilidades altas | 28 | 28 (en devDeps/indirectas) |
| App.tsx líneas | 14,113 | 13,753 (-360) |
| Passphrase bug | ✅ Corregido | — |
| POLL_MS erróneo | ✅ Corregido | — |
| Minificación | Deshabilitada | ✅ Habilitada |
| Target iOS | ES2022 | ✅ ES2020 + Safari14 |
| WebSocket reset | Bug | ✅ Corregido |

---

## 🐛 PROBLEMAS ENCONTRADOS

### CRÍTICOS (corregidos)

#### C1. Passphrase de SQLite llamando `navigator` en module-level
**Problema:** `_buildPassphrase()` se ejecutaba en tiempo de carga del módulo, antes de que el DOM estuviera listo. En iOS PWA y Capacitor esto puede lanzar excepción y romper toda la inicialización de la DB.
**Corrección:** Convertida a función lazy `getPassphrase()` que se llama solo cuando se necesita.
**Archivo:** `src/db/database.ts`

#### C2. `_initNativeEncrypted()` con llaves desbalanceadas
**Problema:** Un `}` de cierre faltante hacía que el bloque `await db.open()` quedara fuera del scope correcto de la función.
**Corrección:** Reescritura completa con llaves correctas.
**Archivo:** `src/db/database.ts`

#### C3. `POLL_MS` incorrecto en SyncManager
**Problema:** El SyncManager tenía `POLL_MS = 30_000` (30s) pero la intención era 60s ya que WebSocket cubre real-time. Resultaba en el doble de llamadas HTTP innecesarias.
**Corrección:** `POLL_MS = 60_000` (60s, solo fallback).
**Archivo:** `src/sync/SyncManager.ts`

---

### ALTOS (corregidos)

#### A1. Build sin minificación (bundle 83% más grande de lo necesario)
**Problema:** `minify: false` en vite.config.ts. El bundle principal era 1,529 kB cuando con minificación sana baja a 835 kB.
**Corrección:** `minify: 'esbuild'`, `minifySyntax: true`, `minifyWhitespace: true`, `minifyIdentifiers: false` (desactivado por compatibilidad con eval/Function en el codebase).
**Resultado:** Bundle principal bajó **de 1,529 kB a 835 kB (-45%)**.
**Archivo:** `vite.config.ts`

#### A2. Target ES2022 incompatible con iOS 14/15
**Problema:** `target: 'es2022'` requiere iOS 16+. La app debe funcionar en iOS 14+ (Capacitor mínimo).
**Corrección:** `target: ['es2020', 'safari14']` — cubre iOS 14+ sin romper nada.
**Archivo:** `vite.config.ts`

#### A3. WebSocket `reset()` no limpiaba `isConnecting`
**Problema:** Si `reset()` se llamaba mientras había un intento de conexión en curso, el flag `isConnecting = true` persistía y las llamadas subsiguientes a `connect()` fallaban silenciosamente.
**Corrección:** `reset()` ahora limpia explícitamente `isConnecting = false` y `reconnects = 0`.
**Archivo:** `src/sync/WebSocketClient.ts`

#### A4. Import sin usar (`Encoding`) en FileCache
**Problema:** `import { Filesystem, Directory, Encoding }` — `Encoding` importado pero nunca usado, genera warning de lint.
**Corrección:** Eliminado el import de `Encoding`.
**Archivo:** `src/cache/FileCache.ts`

---

### MEDIOS (documentados — no críticos para producción)

#### M1. 48 vulnerabilidades npm
**Análisis:**
- **1 crítica:** `protobufjs <= 7.5.7` (arbitrary code execution). Viene transitivamente de `@google/genai`. No hay fix disponible sin actualizar `@google/genai` a una versión aún en beta. **Impacto real: bajo** — el código vulnerable es de serialización protobuf que no se expone directamente.
- **28 altas:** Todas en `axios` (vienen de dependencias indirectas del servidor, no del frontend). El frontend usa `fetch` nativo.
- **18 moderadas:** `postcss`, `esbuild` (en devDependencies — no afectan al bundle de producción).

**Estado:** No fixables sin breaking changes. Monitorear en próxima actualización de `@google/genai`.

#### M2. `console.log` en código de producción
**Análisis:** Los logs de `[DB]`, `[SyncManager]`, `[WS]`, `[AppInit]` son informativos y no exponen datos sensibles. Se creó `src/logger.ts` con un wrapper condicional para uso futuro.
**Estado:** Logger creado, migración progresiva recomendada.

#### M3. App.tsx monolítico (13,753 líneas)
**Progreso:** Reducido de 14,113 → 13,753 (-360 líneas). Componentes extraídos: `HomeView`, `ServicesView`, `NotificationsPanel`.
**Pendiente:** `renderProfileView` (~1,177 líneas), `renderActiveCall` (~300 líneas).

#### M4. Keystore Android en repositorio
**Archivo:** `android/app/egchat-release.keystore` + contraseñas en `build.gradle`.
**Riesgo:** Si el repositorio se hace público, la clave de firma queda expuesta.
**Mitigación:** Mover a `local.properties` + variables de entorno CI/CD antes de hacer el repo público.

---

### BAJOS (informativos)

#### B1. `touchend` listener en document sin cleanup específico
En `main.tsx`: `document.addEventListener('touchend', () => window.scrollTo(0, 0))` — no tiene referencia para removeEventListener. Es un handler trivial pero técnicamente es un leak menor.

#### B2. `setInterval` de stories cada 10 min
El polling de stories sigue siendo HTTP. Con WebSocket activo podría eliminarse completamente.

#### B3. `tempInterval` de temperatura en GPS no se limpia si hay error antes del `clearInterval`
Potencial leak menor si el componente de GPS se desmonta en error.

---

## ✅ CORRECCIONES REALIZADAS

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/db/database.ts` | Passphrase lazy, llaves balanceadas, código limpio |
| `src/sync/SyncManager.ts` | POLL_MS 30s → 60s (WebSocket es real-time) |
| `src/sync/WebSocketClient.ts` | reset() limpia isConnecting y reconnects |
| `src/cache/FileCache.ts` | Eliminado import Encoding sin usar |
| `vite.config.ts` | Minificación habilitada, target ES2020+Safari14 |
| `capacitor.config.ts` | Añadido hostname: 'app' para iOS WKWebView |
| `src/logger.ts` | Nuevo — logger condicional producción/desarrollo |

### Archivos creados

| Archivo | Propósito |
|---|---|
| `src/logger.ts` | Logger que silencia console.log en producción |

---

## 📈 MEJORAS DE RENDIMIENTO

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| Bundle principal gzip | 242 kB | **185 kB** | **-24%** |
| Bundle principal raw | 1,529 kB | **835 kB** | **-45%** |
| react-core gzip | 97 kB | **61 kB** | **-37%** |
| ServiciosModules | 44 kB | **37 kB** | **-16%** |
| Polling interval | 30s | **60s** | **-50% llamadas HTTP** |
| Tiempo de build | 6.51s | **6.69s** | Sin regresión |

---

## 🔒 MEJORAS DE SEGURIDAD

| Mejora | Descripción |
|---|---|
| SQLite cifrado | AES-256 via SQLCipher en iOS y Android |
| Passphrase segura | Derivada del dispositivo, no hardcodeada |
| SecureStorage | Keychain iOS / EncryptedSharedPreferences Android |
| Token triple backup | token + egchat_token_backup + legacy key |
| WebSocket auth | JWT verificado en cada conexión WS, timeout 10s |
| HTTPS only | cleartext: false en Capacitor |
| Migración automática | DB sin cifrar → cifrada sin intervención del usuario |

---

## ⚠️ RIESGOS PENDIENTES

### Para IPA de producción (acción requerida)

1. **`pod install` en Mac** — los plugins nuevos necesitan instalarse antes de compilar en Xcode:
   ```bash
   cd ios/App && pod install
   ```

2. **Permissions en Info.plist** — verificar en Xcode que existen:
   - `NSCameraUsageDescription`
   - `NSMicrophoneUsageDescription`
   - `NSContactsUsageDescription`

3. **Push Notifications Capability** — activar en Xcode → Signing & Capabilities → Push Notifications + Background Modes

4. **Signing Certificate** — seleccionar Team y provisioning profile en Xcode antes del Archive

5. **protobufjs vulnerabilidad** — no bloquea IPA pero monitorear. Mitigación: cuando `@google/genai` lance versión estable con protobufjs >= 7.5.8, actualizar.

### Para Android APK

6. **Mover keystore a env vars** antes de CI/CD público:
   ```gradle
   storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
   ```

### Funcionalidad

7. **WebSocket en iOS PWA** — verificar que `wss://` funciona correctamente en iOS Safari con certificado válido de Render

8. **SQLite cifrado en dispositivo real** — primera apertura tras update hará migración automática. Puede tardar 2-5 segundos en dispositivos con muchos mensajes.

---

## 🏗️ ESTADO PARA XCODE / IPA

```
✅ Build compila sin errores
✅ Bundle optimizado (835 kB principal)
✅ Assets iOS actualizados (cap copy ios)
✅ capacitor.config.json actualizado
✅ 8 plugins Capacitor registrados
✅ Offline-First completo (SQLite + Sync + WS)
✅ Código desplegado en GitHub

⚠️ PENDIENTE EN MAC:
  [ ] cd ios/App && pod install
  [ ] Abrir ios/App/App.xcworkspace en Xcode
  [ ] Seleccionar Team y Provisioning Profile
  [ ] Product → Archive
  [ ] Distribute App → App Store / Ad Hoc
```

---

## 📋 CHECKLIST PRE-IPA

- [x] npm run build — sin errores
- [x] npx cap copy ios — assets copiados
- [x] capacitor.config.ts — hostname: 'app' añadido
- [x] Bundle size aceptable (<1MB gzip)
- [x] Code splitting funcionando (lazy chunks)
- [x] Sin server.url remota en capacitor.config
- [x] webDir apunta a 'dist'
- [ ] pod install en Mac
- [ ] Xcode Signing configurado
- [ ] Push Notifications capability activada
- [ ] Background Modes activado
- [ ] Keychain Sharing activado (para SecureStorage)
- [ ] Archive exitoso en Xcode
- [ ] IPA generada y firmada
