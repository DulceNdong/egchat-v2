# VERSIÓN ESTABLE iPhone PWA — NO MODIFICAR

## Estado guardado: 6 Junio 2026

La app funciona correctamente en iPhone IPA (Capacitor) en este commit:
- Git: master branch, commit cdd17b2
- Bundle principal: ~835 kB (con code splitting)
- Keyboard: resize = native (setResizeMode en AppInit)

## ⛔ NO TOCAR NUNCA:
- viewPadding.top = 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)'
- viewPadding.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'
- Header paddingTop: 'env(safe-area-inset-top, 44px)'
- Header height: 44px
- Tab bar height: 64px
- vite.config.ts (code splitting configurado)
- capacitor.config.ts → Keyboard.resize: 'native'
- src/AppInit.ts → Keyboard.setResizeMode({ mode: 'native' })
- chat-view-container → position: fixed, bottom: 0 (el Keyboard plugin lo ajusta)
- #chat-input-bar → position: relative (NO sticky — no funciona con overflow:hidden)

## ✅ Configuración que funciona para teclado iOS:
- capacitor.config.ts: Keyboard.resize = 'native'
- src/AppInit.ts: Keyboard.setResizeMode({ mode: 'native' }) al arrancar
- El WebView se redimensiona nativamente → input bar siempre visible sobre teclado
- Tab bar NO sube porque está fuera del chat container

## Backend (Neon):
- 37 usuarios, 107 contactos, 45 chats, 103 participantes, 752 mensajes migrados de Supabase
- GET /api/chats usa globalPool con SQL directo (bypass pg-client joins)
- POST /api/chats/private usa globalPool directo
- Tablas faltantes se crean al arrancar (call_sessions, spaces, stories, etc.)
