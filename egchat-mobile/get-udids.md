# 📱 Cómo obtener UDIDs de dispositivos iOS

Para instalar la app en iPhones (perfil preview/development), necesitas registrar los **UDIDs** de los dispositivos.

---

## Método 1: Link automático de Expo (MÁS FÁCIL) ✨

1. Inicia sesión en Expo:
```bash
eas login
```

2. Obtén el link para registrar dispositivos:
```bash
eas device:create
```

3. Expo te dará un **link único** como:
```
https://expo.dev/accounts/reddington120/devices/new?redirectUrl=...
```

4. **Envía ese link** a los usuarios por WhatsApp/Email

5. Los usuarios:
   - Abren el link en **Safari** (iPhone)
   - Tocan **"Permitir"** cuando Safari pida permiso
   - El UDID se registra automáticamente en tu cuenta de Expo

6. Recompila la app para incluir los nuevos dispositivos:
```bash
eas build --profile preview --platform ios
```

---

## Método 2: Desde Mac con el iPhone conectado

1. Conecta el iPhone al Mac con cable
2. Abre **Finder** (macOS Catalina+) o **iTunes** (macOS anterior)
3. Selecciona el iPhone en la barra lateral
4. Haz clic en el texto debajo del nombre del iPhone (donde dice "Capacidad")
5. Verás el **Número de serie** → haz clic varias veces hasta que aparezca el **UDID**
6. Clic derecho → **Copiar UDID**

---

## Método 3: Desde el iPhone directamente

### 3.1. Usando la app Shortcuts (Atajos)

1. Instala el atajo desde: https://www.icloud.com/shortcuts/25e1d86c9e2c4d8b9e3f4a5b6c7d8e9f
2. Ejecuta el atajo "Get UDID"
3. El UDID se copiará al portapapeles

### 3.2. Usando un sitio web

1. Ve a: https://get.udid.io
2. Toca **"Download Profile"**
3. Sigue las instrucciones para instalar el perfil
4. El sitio mostrará tu UDID
5. **IMPORTANTE:** Elimina el perfil después desde **Ajustes → General → VPN y gestión de dispositivos**

---

## Método 4: Desde Xcode (macOS)

1. Abre **Xcode**
2. Ve a **Window → Devices and Simulators** (⇧⌘2)
3. Conecta el iPhone por cable
4. Selecciona el dispositivo en la lista
5. El **Identifier** es el UDID
6. Clic derecho → **Copy Identifier**

---

## Registrar el UDID en Expo/Apple Developer

### Opción A: Mediante EAS CLI
```bash
eas device:create
# Pega el UDID cuando te lo pida
# Ingresa un nombre descriptivo (ej: "iPhone de Juan")
```

### Opción B: Manualmente en Apple Developer

1. Ve a https://developer.apple.com/account/resources/devices
2. Clic en **+** (Registrar nuevo dispositivo)
3. Ingresa:
   - **Platform:** iOS
   - **Device Name:** Nombre descriptivo (ej: "iPhone 13 - María")
   - **Device ID (UDID):** Pega el UDID
4. Clic en **Continue** → **Register**

---

## ⚠️ Límites y restricciones

- **Máximo 100 dispositivos iOS** por año (se reinicia cada año en la renovación de tu membresía)
- Los dispositivos se pueden **eliminar**, pero NO liberas el cupo hasta el siguiente año
- Cada UDID está atado al hardware del iPhone (si cambias de iPhone, necesitas un nuevo UDID)

---

## 🚀 Alternativa: Usa TestFlight (SIN UDIDs)

Si necesitas distribuir a **más de 100 usuarios** o quieres evitar el manejo de UDIDs:

```bash
# 1. Build de producción
eas build --profile production --platform ios

# 2. Subir a App Store Connect
eas submit --platform ios

# 3. En App Store Connect → TestFlight → Agregar testers
```

**Ventajas:**
- ✅ Sin necesidad de UDIDs
- ✅ Hasta 10,000 testers externos
- ✅ Instalación desde la app TestFlight oficial

---

## 📋 Resumen rápido

**Para 1-5 personas:** Usa Método 1 (link de Expo) → Comparte IPA
**Para 5-100 personas:** Método 1 o 2 → Distribuye IPA
**Para +100 personas:** Usa TestFlight

---

## 🔗 Links útiles

- Expo Device Management: https://expo.dev/accounts/reddington120/devices
- Apple Developer Devices: https://developer.apple.com/account/resources/devices
- Get UDID online: https://get.udid.io
- Documentación EAS: https://docs.expo.dev/build/internal-distribution/
