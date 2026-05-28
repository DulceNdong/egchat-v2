# 🚀 EGCHAT - Configuración Android Emulator

## ✅ Lo que acabo de arreglar

1. **Actualicé `.env.development`** → Ahora apunta a `http://localhost:5000` 
2. **Mejoré detección de Android Emulator** en `api.ts` y `AuthScreen.tsx`
   - Automáticamente usa `10.0.2.2` en lugar de `localhost` cuando detecta emulator
3. **Mejor manejo de errores de conexión** → Mensajes más claros en login

---

## 📋 Pasos para que funcione

### Paso 1: Inicia el Backend

Abre **PowerShell o Terminal** y ejecuta:

```powershell
cd c:\Users\User\Desktop\EGCHAT_BACKUP_20260320\egchat-api
npm install
npm start
```

**Debes ver algo como:**
```
Server running on port 5000
CORS enabled for: localhost, 127.0.0.1, 10.0.2.2
```

### Paso 2: Verifica que el Backend está accesible

```bash
# En otra PowerShell:
curl http://localhost:5000/api/health
# Debe responder algo
```

### Paso 3: Rebuild y Deploy a Emulator

```powershell
# En la carpeta raíz del proyecto
npm run build

# O si usas APK:
npm run build:apk

# Instala en el emulator:
adb install -r dist-apk/app-debug.apk
```

### Paso 4: Abre la App en el Emulator

- Abre EGCHAT en el emulator de Android Studio
- La app automáticamente usará `10.0.2.2:5000` en lugar de `localhost`
- Intenta hacer login

---

## 🔍 Debugging

### Ver logs del app en emulator:

```bash
adb logcat | findstr "EG"
# O en Mac/Linux:
adb logcat | grep "EG"
```

### Ver logs del backend:

Deja corriendo la ventana de PowerShell del backend. Los logs estarán en la consola.

### Si siguen problemas:

1. **Verifica que el backend está corriendo:**
   ```bash
   netstat -ano | findstr :5000
   ```

2. **Verifica la conexión desde el emulator:**
   ```bash
   adb shell
   ping 10.0.2.2
   # Ctrl+C para salir
   ```

3. **Verifica credenciales de BD (Supabase):**
   - Abre `egchat-api/.env`
   - Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` están configurados correctamente

---

## 🆘 Errores Comunes

### "No autorizado" o "Credenciales incorrectas"
→ Crea una cuenta de prueba en el backend:
```bash
cd egchat-api
node create_test_user.js
# Usar ese usuario para login
```

### "Error de conexión"
→ Verifica que:
- Backend está corriendo en puerto 5000
- Firewall no bloquea puerto 5000
- Emulator tiene acceso a red

### "CORS error"
→ Verifica `egchat-api/.env`:
```
CORS_ALLOWED_ORIGINS=https://egchat-app.vercel.app,http://localhost:3001,http://localhost:3003,http://localhost:5173,http://10.0.2.2:5000
```

---

## 📱 Para Producción

Una vez que funcione en el emulator:

1. Actualiza `.env.production` con URL real del servidor
2. Ejecuta: `npm run build:apk`
3. Firma el APK con tu certificado
4. Sube a Google Play Store

