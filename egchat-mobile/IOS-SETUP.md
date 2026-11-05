# 🍎 Configuración iOS para EGCHAT

## ❌ Problema actual

La app no se abre en otros dispositivos iOS porque:

1. **No hay firma de código configurada** - El proyecto necesita certificados de Apple Developer
2. **No hay perfiles de aprovisionamiento** - iOS requiere autorización para instalar apps fuera del App Store
3. **El build local falla** - Errores: "No Account for Team" y "No profiles for 'com.egchat.app'"

---

## ✅ Solución: Usar EAS Build (Compilación en la nube)

**NO necesitas compilar en tu Mac.** Expo puede compilar la app en la nube y manejar todos los certificados automáticamente.

### Paso 1: Requisitos previos

#### 1.1. Cuenta de Apple Developer
- Ve a https://developer.apple.com/programs/
- Suscríbete ($99 USD/año)
- Anota tu **Team ID** (aparecerá en la cuenta)

#### 1.2. Instalar EAS CLI
```bash
npm install -g eas-cli
eas login
```

---

### Paso 2: Primera compilación iOS

```bash
cd egchat-mobile

# Compilar para iOS (distribución interna)
eas build --profile preview --platform ios
```

**Durante el primer build, EAS te preguntará:**

1. ✅ **"Generate a new Apple Distribution Certificate?"** → Responde `Yes`
2. ✅ **"Generate a new Apple Provisioning Profile?"** → Responde `Yes`
3. 🔑 Te pedirá tu **Apple ID** y **contraseña** (de tu cuenta de Developer)
4. 📱 Te pedirá **registrar dispositivos** (UDIDs de los iPhones donde quieres instalar)

**EAS se encarga de TODO:** certificados, perfiles, firma, compilación.

---

### Paso 3: Registrar dispositivos iOS (para preview)

Para que otros iPhones puedan instalar la app, necesitas sus UDIDs:

#### Opción A: Obtener UDID desde el iPhone
1. Conecta el iPhone a un Mac
2. Abre **Finder** → selecciona el iPhone
3. Haz clic en el texto debajo del nombre del dispositivo para ver el UDID
4. Copia el número

#### Opción B: Desde Expo (más fácil)
1. Ve a https://expo.dev/accounts/reddington120/devices
2. Envía el link a los usuarios
3. Ellos abren el link en Safari (iPhone) → "Permitir" → obtiene el UDID automáticamente

#### Registrar el UDID
```bash
eas device:create
```
O agrégalos manualmente en https://developer.apple.com/account/resources/devices

---

### Paso 4: Instalar el IPA en dispositivos

Una vez compilado el build:

1. **Descarga el IPA** desde expo.dev (te llega un link)
2. **Comparte el IPA** por correo/Drive/AirDrop
3. **Instala en el iPhone:**
   - Abre el link en **Safari** (no Chrome)
   - Descarga el archivo
   - Aparecerá en **Ajustes → General → VPN y gestión de dispositivos**
   - Toca "Confiar en [tu nombre de developer]"

**Alternativa:** Usa **Apple Configurator 2** (Mac) para instalar el IPA por cable.

---

## 🚀 Método RECOMENDADO: TestFlight

Si quieres distribuir a muchos usuarios SIN necesitar UDIDs:

### 1. Compilar para producción
```bash
eas build --profile production --platform ios
```

### 2. Subir a App Store Connect
```bash
eas submit --platform ios
```

### 3. Agregar testers en TestFlight
1. Ve a https://appstoreconnect.apple.com
2. Selecciona tu app → **TestFlight**
3. Agrega **testers internos** (tu equipo) o **externos** (cualquier persona)
4. Los testers descargan **TestFlight** de la App Store
5. Reciben un código/invitación y pueden instalar tu app

**Ventajas:**
- ✅ Sin límite de dispositivos
- ✅ No necesitas UDIDs
- ✅ Actualizaciones automáticas
- ✅ Feedback integrado

**Desventaja:**
- ⏱️ Primera revisión de Apple toma 1-2 días (solo la primera vez)

---

## 🔧 Solución de problemas

### Error: "No credentials configured"
```bash
eas credentials
# Selecciona iOS → Set up new credentials → Sigue el wizard
```

### Error: "Device not registered"
Agrega el UDID del dispositivo:
```bash
eas device:create
```
Luego recompila el build.

### Error: "Certificate expired"
```bash
eas credentials
# iOS → Distribution Certificate → Remove → Rebuild
```

### Ver estado de builds
```bash
eas build:list
```

---

## 📋 Checklist de configuración iOS

- [ ] Cuenta de Apple Developer activa ($99/año)
- [ ] `eas-cli` instalado globalmente
- [ ] Configuración iOS en `eas.json` (ya está ✅)
- [ ] Primera compilación: `eas build --profile preview --platform ios`
- [ ] Certificados generados por EAS (automático en primer build)
- [ ] UDIDs de dispositivos registrados (para preview/development)
- [ ] IPA descargado e instalado en dispositivo
- [ ] Confianza en certificado desde Ajustes del iPhone

---

## 🎯 Próximos pasos

1. **Para testing rápido con amigos/equipo:**
   - Usa **preview** + registra sus UDIDs
   - Comparte el IPA

2. **Para distribución a usuarios finales:**
   - Usa **TestFlight** (método profesional)
   - Eventualmente publica en App Store

3. **Para desarrollo activo:**
   - Usa **development** profile
   - Incluye `expo-dev-client` para hot reload

---

## 📞 Ayuda adicional

- Documentación EAS: https://docs.expo.dev/build/introduction/
- Certificados iOS: https://docs.expo.dev/app-signing/app-credentials/
- TestFlight: https://developer.apple.com/testflight/
