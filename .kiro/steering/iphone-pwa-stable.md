# VERSIÓN ESTABLE iPhone PWA — NO MODIFICAR

## Estado guardado: 9 Junio 2026 — 14:30

La app funciona correctamente en iPhone IPA (Capacitor) en este commit:
- Git: master branch, commit 2444e8c
- Bundle principal: ~831 kB (con code splitting)
- Keyboard: resize = native (capacitor.config.ts + AppInit.ts)

---

## ✅ Chat (NO tocar — funciona perfecto):

### Layout mensajes (App.tsx línea ~5605)
- `chat-messages-scroll` → `flex: 1`, `justifyContent: 'flex-end'` (mensajes pegados al fondo)
- `paddingBottom` → `calc(env(safe-area-inset-bottom, 0px) + 72px)` en móvil
- `paddingTop` → `88px` en móvil

### Input bar chat (App.tsx línea ~6583)
- `#chat-input-bar` → `position: fixed`, `bottom: 0`
- `background: device.isMobile ? '#d1d3d9' : '#f0f2f5'` (gris teclado iOS)
- **NO cambiar el color ni el position**

### Teclado iOS — keyboard listener (App.tsx línea ~822)
- `keyboardWillShow` → `visibility: hidden` en tab bar + scroll al fondo del chat
- `keyboardWillHide` → `visibility: visible` en tab bar + scroll al fondo del chat
- Tab bar identificado con `data-bottom-nav="true"`
- **NO añadir translateY ni maxHeight al chat**

---

## ✅ Lista de mensajes / Tab bar (NO tocar — funciona perfecto):

### Tab bar (App.tsx línea ~5240)
- `data-bottom-nav="true"` en el div del tab bar
- Cuando sube el teclado → `visibility: hidden` (invisible pero no se mueve)
- Cuando baja el teclado → `visibility: visible`
- Resultado: el tab bar NO aparece flotando encima del teclado

---

## ⛔ NO TOCAR NUNCA:
- `viewPadding.top = 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)'`
- `viewPadding.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'`
- Header `paddingTop: 'env(safe-area-inset-top, 44px)'`
- Header height: 44px
- Tab bar height: 64px
- `capacitor.config.ts` → `Keyboard.resize: 'none'` (config base)
- `src/AppInit.ts` → `Keyboard.setResizeMode({ mode: 'none' })` (runtime)
- `App.tsx` → `Keyboard.setResizeMode({ mode: 'native' })` (override en useEffect)
- `justifyContent: 'flex-end'` en chat-messages-scroll
- `#d1d3d9` en input bar del chat
- `data-bottom-nav="true"` en tab bar
- `visibility: hidden/visible` en keyboardWillShow/Hide

---

## 📦 Para compilar nueva IPA (desde Mac):
```bash
cd /Users/bernardo/egchat-v2
git stash          # si hay cambios locales sin commitear
git pull origin master
npm run build
npx cap sync ios
# En Xcode: Shift+Cmd+K (Clean) → Cmd+R (Run con iPhone conectado)
```

## Backend (Neon):
- GET /api/chats usa globalPool con SQL directo
- POST /api/chats/private usa globalPool directo
