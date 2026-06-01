# VERSIÓN ESTABLE iPhone PWA — NO MODIFICAR

## Estado guardado: 1 Junio 2026

La app funciona correctamente en iPhone PWA en este commit:
- Git: master branch, commit 9bfef82
- Bundle principal: 1,452 kB (con code splitting)
- SW versión: egchat-push-v20260602

## ⛔ NO TOCAR NUNCA:
- viewPadding.top = 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)'
- viewPadding.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'
- Header paddingTop: 'env(safe-area-inset-top, 44px)'
- Header height: 44px
- Tab bar height: 64px
- vite.config.ts (code splitting configurado)
- sw.js versión

## Problema a resolver: barra de chat sube con el teclado en iPhone PWA
- La barra de input del chat se mueve cuando aparece el teclado
- Solución: usar CSS `position: fixed` + `env(keyboard-inset-height)` o
  Visual Viewport API para anclar la barra al fondo de la pantalla visible
