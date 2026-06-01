# REGLAS ANDROID HEADER — NO MODIFICAR

## ⛔ PROHIBIDO TOCAR — Configuración Android/status-bar

El header de Android está resuelto y funciona correctamente.
**NO cambiar esta lógica bajo ningún concepto.**

---

### Cómo funciona (FIJO — no tocar):

Android usa `overlaysWebView: true` + `setBackgroundColor('#00000000')` para que
el WebView se extienda bajo la status bar del sistema.
La variable CSS `--app-statusbar-top` se lee dinámicamente desde
`env(safe-area-inset-top)` que Capacitor expone tras activar el overlay.

### Valores FIJOS en `App.tsx`:

**viewPadding.top (Android):**
```
top: device.isMobile ? 'calc(var(--app-statusbar-top, 0px) + 44px + 8px)' : '60px'
```

**Header paddingTop:**
```
paddingTop: device.isMobile ? 'var(--app-statusbar-top, 0px)' : '0px'
```

**useEffect — leer safe-area real (NO hardcodear 24px):**
```ts
} else if (isAndroid) {
  const tryRead = (attempt: number) => {
    const safeTop = readSafeTop();
    if (safeTop > 0) {
      document.documentElement.style.setProperty('--app-statusbar-top', `${safeTop}px`);
    } else if (attempt < 5) {
      setTimeout(() => tryRead(attempt + 1), 80);
    } else {
      document.documentElement.style.setProperty('--app-statusbar-top', '24px');
    }
  };
  tryRead(0);
}
```

**useEffect — StatusBar (re-leer tras activar overlay):**
```ts
StatusBar.setOverlaysWebView({ overlay: true });
StatusBar.setBackgroundColor({ color: '#00000000' });
// Luego re-leer env(safe-area-inset-top) con readAndSet(0)
```

---

## ⛔ NUNCA hacer:
- Hardcodear `24px` para `--app-statusbar-top` en Android
- Cambiar `overlaysWebView` a `false` en Android
- Cambiar `setBackgroundColor` a un color opaco en Android
- Eliminar el mecanismo de reintento `tryRead` / `readAndSet`
- Cambiar `44px` del header
- Cambiar `64px` del tab bar

## ✅ Si hay problema de layout en Android:
- Buscar la causa en OTRO lugar (z-index, overflow, flex)
- NO tocar `--app-statusbar-top` ni el header ni `overlaysWebView`

## 📦 Para compilar nueva APK:
```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
# APK en: android\app\build\outputs\apk\debug\app-debug.apk
```
