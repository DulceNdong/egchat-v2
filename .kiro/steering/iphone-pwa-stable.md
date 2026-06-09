# VERSIÓN ESTABLE iPhone PWA — NO MODIFICAR

## Estado guardado: 9 Junio 2026

La app funciona correctamente en iPhone IPA (Capacitor) en este commit:
- Git: master branch, commit 96f3f2c
- Bundle principal: ~831 kB (con code splitting)
- Keyboard: resize = native (setResizeMode en AppInit)

## ✅ Chat — configuración que funciona (NO tocar):

### Layout del chat (App.tsx)
- `chat-view-container` → `position: fixed`, `bottom: 0`, altura actualizada por `visualViewport`
- `chat-messages-scroll` → `flex: 1`, `justifyContent: 'flex-end'` (mensajes pegados al fondo)
- `paddingBottom` mensajes → `calc(env(safe-area-inset-bottom, 0px) + 72px)` en móvil
- `paddingTop` mensajes → `88px` en móvil (espacio para header fijo)
- `#chat-input-bar` → `position: fixed`, `bottom: 0`, `background: #d1d3d9` (gris teclado iOS)

### Teclado iOS (App.tsx)
- `Keyboard.setResizeMode({ mode: 'native' })` — WebView se redimensiona solo
- Listener `keyboardWillShow` / `keyboardWillHide` → solo hace scroll al fondo (NO translateY, NO maxHeight)
- `visualViewport` handler → actualiza `--vv-height`, `--keyboard-offset`, height del container + scroll al fondo en 3 intentos (rAF + 100ms + 250ms)
- Scroll al abrir chat → 3 intentos escalonados: 50ms, 150ms, 350ms

### Colores del chat
- Fondo mensajes: `linear-gradient(160deg,#f0fdf9 0%,#f5f3ff 50%,#fdf2f8 100%)`
- Input bar: `#d1d3d9` (mismo gris que teclado iOS nativo)
- Burbuja propia: verde claro `linear-gradient(135deg,#e8f5e9,#f0fdf4)`
- Burbuja ajena: `#ffffff`

## ⛔ NO TOCAR NUNCA:
- `viewPadding.top = 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)'`
- `viewPadding.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'`
- Header `paddingTop: 'env(safe-area-inset-top, 44px)'`
- Header height: 44px
- Tab bar height: 64px
- `vite.config.ts` (code splitting configurado)
- `capacitor.config.ts` → `Keyboard.resize: 'native'`
- `src/AppInit.ts` → `Keyboard.setResizeMode({ mode: 'native' })`
- `justifyContent: 'flex-end'` en chat-messages-scroll — elimina el espacio vacío bajo los mensajes
- `#d1d3d9` en input bar — NO volver a `#f0f2f5`

## 📦 Para compilar nueva IPA (desde Mac):
```bash
cd /Users/bernardo/egchat-v2
git pull origin master
npm run build
xattr -w com.apple.xcode.CreatedByBuildSystem true ios/App/build  # si da error de clean
npx cap sync ios
open ios/App/App.xcworkspace
# En Xcode: seleccionar iPhone → Cmd+R
```

## Backend (Neon):
- GET /api/chats usa globalPool con SQL directo (bypass pg-client joins)
- POST /api/chats/private usa globalPool directo
- Tablas faltantes se crean al arrancar (call_sessions, spaces, stories, etc.)
