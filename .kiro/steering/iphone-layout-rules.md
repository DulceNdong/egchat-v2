# REGLAS IPHONE — NO MODIFICAR

## ⛔ PROHIBIDO TOCAR — Configuración iPhone/safe-area

La app corre en **iPhone con overlaysWebView: false**.

### Valores FIJOS — NO cambiar nunca:

```
viewPadding.top = 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)'
viewPadding.bottom = 'calc(64px + env(safe-area-inset-bottom, 0px) + 16px)'
```

### Header fijo:
```
paddingTop: device.isMobile ? 'env(safe-area-inset-top, 44px)' : '0px'
height: 44px (barra de iconos)
```

### Mensajería:
```
paddingTop: device.isMobile ? 'calc(env(safe-area-inset-top, 0px) + 44px + 8px)' : '8px'
```

### Tab bar:
```
height: 64px fija
zIndex: 1000
```

## ⛔ NUNCA hacer:
- Cambiar `env(safe-area-inset-top, 0px)` a otro valor
- Cambiar `44px` del header
- Cambiar `64px` del tab bar
- Añadir o quitar `env(safe-area-inset-top)` del viewPadding
- Cambiar el fallback de safe-area-inset-top

## ✅ Si hay problema de layout:
- Buscar la causa en OTRO lugar (z-index, overflow, flex)
- NO tocar viewPadding ni el header
