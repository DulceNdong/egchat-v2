# 🚀 Guía para subir EGCHAT a TestFlight

## ❌ Error actual: "Entity Not Authorized"

**Causa:** Estás logueado con una cuenta de Expo diferente a la que posee el proyecto.

**Proyecto owner:** `reddington120` (según app.json)

---

## ✅ Solución paso a paso

### 1. Verificar cuenta actual

```bash
eas whoami
```

Si no muestra `reddington120`, necesitas cambiar de cuenta.

### 2. Cambiar a la cuenta correcta

```bash
eas logout
eas login
```

Ingresa las credenciales de la cuenta **reddington120**.

### 3. Verificar que ahora estás logueado correctamente

```bash
eas whoami
# Debe mostrar: reddington120
```

### 4. Actualizar EAS CLI (recomendado)

```bash
npm install -g eas-cli
```

---

## 🔧 Opción alternativa: Cambiar el owner del proyecto

Si NO tienes acceso a la cuenta `reddington120`, puedes cambiar el owner:

### Opción A: Remover el owner actual

Edita `app.json` y elimina la línea `"owner": "reddington120"`:

```json
{
  "expo": {
    "name": "EGCHAT",
    "slug": "egchat",
    // ... resto de la configuración
    "extra": {
      "eas": {
        "projectId": "6200ec00-54d7-4ef4-a348-56e80a1452f6"
      }
    }
    // ❌ ELIMINAR esta línea:
    // "owner": "reddington120"
  }
}
```

Luego el proyecto usará tu cuenta actual de Expo.

### Opción B: Crear un proyecto completamente nuevo

Si quieres empezar desde cero con tu propia cuenta:

```bash
cd egchat-mobile

# Eliminar configuración existente
rm app.json.save 2>/dev/null

# Editar app.json y remover:
# - "owner": "reddington120"
# - El "projectId" dentro de "eas"

# Reinicializar con EAS
eas build:configure
```

EAS generará un nuevo `projectId` asociado a tu cuenta.

---

## 🚀 Una vez resuelto el problema de permisos

### Paso 1: Build de producción

```bash
cd /Users/raymonreddintone/Desktop/EGCHAT_NATIVA/egchat-mobile

# Compilar para iOS
eas build --profile production --platform ios
```

**Durante el primer build, EAS te preguntará:**
- ✅ "Generate Apple Distribution Certificate?" → **YES**
- ✅ "Generate Provisioning Profile?" → **YES**
- 🔑 Apple ID (tu cuenta de developer)
- 📧 App-Specific Password (si tienes 2FA)

### Paso 2: Monitorear el build

El build se ejecuta en la nube (demora ~15-30 minutos).

Puedes ver el progreso en:
- Terminal (muestra URL de seguimiento)
- Web: https://expo.dev/accounts/[tu-cuenta]/projects/egchat/builds

### Paso 3: Subir a App Store Connect

Una vez que el build termine exitosamente:

```bash
eas submit --platform ios
```

EAS te pedirá:
- Apple ID
- App-Specific Password (si tienes 2FA)
- Si la app no existe, EAS puede crearla automáticamente

### Paso 4: Configurar TestFlight

1. Ve a https://appstoreconnect.apple.com
2. Selecciona tu app **EGCHAT**
3. Pestaña **TestFlight**
4. **Agregar testers:**
   - **Internos:** Tu equipo (hasta 100 personas con acceso a App Store Connect)
   - **Externos:** Cualquier persona con email (hasta 10,000)

5. Los testers recibirán un email con instrucciones
6. Descargan la app **TestFlight** de la App Store
7. Instalan EGCHAT desde TestFlight

---

## 📋 Requisitos previos (Apple Developer)

### 1. Cuenta de Apple Developer activa
- Suscripción: $99 USD/año
- Regístrate en: https://developer.apple.com/programs/

### 2. App-Specific Password (si tienes 2FA)

Si tu Apple ID tiene autenticación de dos factores (recomendado):

1. Ve a https://appleid.apple.com
2. **Seguridad** → **Contraseñas de apps**
3. Genera una nueva: ej. "EAS EGCHAT"
4. Copia y guarda la contraseña (formato: `xxxx-xxxx-xxxx-xxxx`)
5. Úsala cuando `eas submit` la pida

### 3. Agreements firmados en App Store Connect

1. Ve a https://appstoreconnect.apple.com
2. Si ves banners de "Agreements" → Acéptalos
3. Completa información fiscal/bancaria (requerido para submit)

---

## 🔍 Solución de problemas

### "Entity Not Authorized"
```bash
# Verificar cuenta actual
eas whoami

# Cambiar de cuenta
eas logout
eas login
```

### "No Apple ID provided"
Edita `eas.json` y actualiza el `appleId` en la sección `submit.production.ios`:

```json
"ios": {
  "appleId": "tu-email-real@gmail.com",
  "ascAppId": "placeholder"
}
```

### "Certificate already exists"
```bash
eas credentials
# iOS → Distribution Certificate → Remove → Rebuild
```

### "App-Specific Password invalid"
- Regenera el password en https://appleid.apple.com
- Asegúrate de copiar/pegar sin espacios

### Build falla con error de firma
```bash
# Limpiar todas las credenciales y regenerar
eas credentials --platform ios
# Selecciona: Remove all credentials
# Luego vuelve a correr: eas build --profile production --platform ios
```

---

## 📊 Comparación de métodos de distribución

| Método | UDIDs | Límite | Instalación | Ideal para |
|--------|-------|--------|-------------|------------|
| **Preview (Ad-Hoc)** | ✅ Sí | 100/año | IPA manual | Testing interno |
| **TestFlight** | ❌ No | 10,000 | App TestFlight | Beta pública |
| **App Store** | ❌ No | ∞ | App Store | Producción |

---

## ✅ Checklist completo

- [ ] Cuenta de Apple Developer activa ($99/año)
- [ ] Logueado en EAS con la cuenta correcta (`eas whoami`)
- [ ] App-Specific Password generado (si usas 2FA)
- [ ] Agreements aceptados en App Store Connect
- [ ] `eas build --profile production --platform ios` ejecutado
- [ ] Build completado exitosamente (revisar en expo.dev)
- [ ] `eas submit --platform ios` ejecutado
- [ ] App aparece en App Store Connect
- [ ] TestFlight configurado con testers
- [ ] Testers reciben invitación y pueden instalar

---

## 🎯 Resumen ejecutivo

**Para resolver el error actual:**
```bash
eas whoami              # Ver cuenta actual
eas logout              # Cerrar sesión
eas login               # Entrar con reddington120
eas whoami              # Verificar: debe mostrar reddington120
```

**Para compilar y subir a TestFlight:**
```bash
npm install -g eas-cli                           # Actualizar EAS CLI
eas build --profile production --platform ios    # Compilar (15-30 min)
eas submit --platform ios                        # Subir a App Store Connect
```

**Para distribuir:**
1. App Store Connect → TestFlight → Agregar testers
2. Los testers descargan "TestFlight" de App Store
3. Instalan EGCHAT desde TestFlight

---

## 📞 Ayuda adicional

- Panel de Expo: https://expo.dev/accounts/reddington120/projects/egchat
- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer: https://developer.apple.com/account
- Documentación EAS Submit: https://docs.expo.dev/submit/introduction/
- TestFlight: https://developer.apple.com/testflight/
