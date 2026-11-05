# 🔧 Solucionar problemas de instalación en TestFlight

## 🎯 Problema: Un tester no puede instalar EGCHAT en su iPhone

---

## 📋 Checklist de diagnóstico

Pregúntale al tester **en qué paso está fallando**:

### ✅ Paso 1: ¿Recibió el email de TestFlight?
- [ ] **SÍ** → Pasa al Paso 2
- [ ] **NO** → Ver solución A

### ✅ Paso 2: ¿Tiene la app TestFlight instalada?
- [ ] **SÍ** → Pasa al Paso 3
- [ ] **NO** → Debe instalarla: https://apps.apple.com/app/testflight/id899247664

### ✅ Paso 3: ¿Puede ver EGCHAT en TestFlight?
- [ ] **SÍ** → Pasa al Paso 4
- [ ] **NO** → Ver solución B

### ✅ Paso 4: ¿Al hacer clic en "Instalar" qué pasa?
- [ ] **No pasa nada** → Ver solución C
- [ ] **Error "No se puede instalar"** → Ver solución D
- [ ] **Error "Esta app no está disponible"** → Ver solución E
- [ ] **Se instala pero no abre** → Ver solución F

---

## 🔧 Soluciones

### Solución A: No recibió el email de invitación

**Causa:** Email incorrecto, spam, o invitación expirada.

**Acciones:**

1. **Verificar que el email está correctamente invitado:**
   - App Store Connect → EGCHAT → TestFlight
   - Haz clic en el grupo "EB" (o el grupo correspondiente)
   - Verifica que el email del tester aparece en la lista
   - Si no está, agrégalo: **"+" → Agregar testers**

2. **Revisar carpeta de spam:**
   - El tester debe buscar email de `no-reply@email.apple.com`
   - Asunto: "You're invited to test [EGCHAT]"

3. **Reenviar invitación:**
   - En la lista de testers, busca al tester
   - Haz clic en **"..." → Reenviar invitación**

4. **Usar enlace público (más confiable):**
   - TestFlight → Grupo "EB"
   - **Enlace público** → Activar (si no está activo)
   - Copiar el enlace
   - Enviarlo por **WhatsApp/Telegram** al tester
   - El tester debe abrirlo en **Safari** (no Chrome)

---

### Solución B: No ve EGCHAT en TestFlight

**Causa:** No aceptó la invitación o el código expiró.

**Acciones:**

1. **Abrir el email de invitación en el iPhone:**
   - El tester debe buscar el email de Apple
   - Hacer clic en **"View in TestFlight"** o **"Start Testing"**
   - Esto abrirá la app TestFlight

2. **Si el email no funciona, usar código de invitación:**
   - En App Store Connect, ve al grupo del tester
   - Copia el **código de invitación** o **enlace público**
   - Envíalo al tester
   - El tester abre TestFlight → **"Redeem"** → Pega el código

3. **Si no aparece nada:**
   - El tester debe cerrar y reabrir TestFlight
   - Si persiste, eliminar y reinstalar TestFlight

---

### Solución C: Botón "Instalar" no funciona

**Causa:** Problema de conexión o espacio insuficiente.

**Acciones:**

1. **Verificar conexión a Internet:**
   - Conectar a Wi-Fi (recomendado)
   - O usar datos móviles con buena señal

2. **Verificar espacio disponible:**
   - Ajustes → General → Almacenamiento del iPhone
   - Necesita al menos 500 MB libres
   - Liberar espacio si es necesario

3. **Reintentar:**
   - Cerrar TestFlight completamente
   - Reiniciar el iPhone
   - Abrir TestFlight → Instalar EGCHAT

---

### Solución D: Error "No se puede instalar"

**Causa:** Versión de iOS incompatible o restricciones.

**Acciones:**

1. **Verificar versión de iOS:**
   - Ajustes → General → Información → Versión de software
   - EGCHAT requiere iOS 13.0 o superior
   - Si es menor, debe actualizar el iPhone

2. **Verificar restricciones:**
   - Ajustes → Tiempo de uso → Restricciones de contenido
   - Asegurarse que "Instalar apps" está permitido

3. **Verificar que el dispositivo no tiene restricciones de empresa:**
   - Si es un iPhone de empresa (MDM), puede estar bloqueado
   - Contactar al administrador IT

4. **Intentar desde otra red:**
   - Algunas redes corporativas bloquean TestFlight
   - Cambiar a datos móviles o Wi-Fi personal

---

### Solución E: Error "Esta app no está disponible"

**Causa:** El tester no está en la lista, la invitación expiró, o el build caducó.

**Acciones:**

1. **Verificar que el tester está invitado:**
   - App Store Connect → EGCHAT → TestFlight → Grupo EB
   - Buscar el email del tester en la lista
   - Si no está, agregarlo

2. **Verificar que la invitación está activa:**
   - Las invitaciones expiran en 90 días
   - En la lista de testers, revisar el estado
   - Si dice "Invitación expirada", reenviar

3. **Verificar que el build no caducó:**
   - Los builds de TestFlight expiran en 90 días
   - En la captura que mostraste, dice "Caduca en 90 días"
   - Si ya expiró, necesitas subir un nuevo build

4. **Generar nuevo enlace público:**
   - TestFlight → Grupo → Enlace público → Desactivar y reactivar
   - Enviar el nuevo enlace al tester

---

### Solución F: La app se instala pero no abre

**Causa:** Certificado de developer no confiado o problema de firma.

**Acciones:**

1. **Confiar en el certificado de developer:**
   - Ajustes → General → VPN y gestión de dispositivos
   - Buscar el perfil de developer
   - Hacer clic en él
   - Hacer clic en **"Confiar en [nombre del developer]"**

2. **Si no aparece ningún perfil:**
   - Eliminar la app
   - Reinstalar desde TestFlight
   - Intentar abrir nuevamente

3. **Si la app crashea al abrir:**
   - Conectar el iPhone a un Mac
   - Abrir **Console.app** (Consola)
   - Ver los logs de crash
   - Enviarnos el reporte de crash

---

## 🚀 Solución rápida: Usar enlace público

**La forma MÁS CONFIABLE de invitar testers:**

### En App Store Connect:

1. TestFlight → Selecciona el grupo "EB"
2. Busca **"Enlace público"** o **"Public Link"**
3. Actívalo si no está activado
4. Copia el enlace (algo como: `https://testflight.apple.com/join/XXXXXXXX`)

### Envía al tester:

```
Hola,

Para instalar EGCHAT en tu iPhone:

1. Abre este enlace en Safari (iPhone):
   [PEGA EL ENLACE AQUÍ]

2. Haz clic en "Start Testing"

3. Si te pide instalar TestFlight, acéptalo:
   https://apps.apple.com/app/testflight/id899247664

4. Una vez en TestFlight, verás EGCHAT

5. Haz clic en "Instalar"

6. Abre EGCHAT y prueba

¡Cualquier problema, avísame!
```

---

## 📱 Requisitos mínimos para instalar

**Verifica que el tester cumple:**

- ✅ iPhone con iOS 13.0 o superior
- ✅ Conexión a Internet (Wi-Fi o datos)
- ✅ Al menos 500 MB de espacio libre
- ✅ Apple ID activo
- ✅ TestFlight instalado
- ✅ Sin restricciones de MDM/empresa

---

## 🔍 Casos especiales

### Tester en China
- TestFlight puede no estar disponible en China continental
- **Solución:** Cambiar región de App Store o usar VPN

### iPhone con jailbreak
- TestFlight puede no funcionar correctamente
- **Solución:** Restaurar iPhone a estado original

### Apple ID sin método de pago
- Algunos Apple ID sin tarjeta pueden tener restricciones
- **Solución:** Agregar método de pago (aunque sea gratis)

### Beta llena (10,000 testers)
- TestFlight tiene límite de 10,000 testers externos
- **Solución:** Crear nuevo grupo o eliminar testers inactivos

---

## 📊 Tabla de diagnóstico rápido

| Síntoma | Causa probable | Solución rápida |
|---------|----------------|-----------------|
| No recibe email | Spam / Email incorrecto | Enviar enlace público |
| No ve app en TestFlight | No aceptó invitación | Reenviar link público |
| Botón instalar no funciona | Sin espacio / Sin internet | Liberar espacio / Cambiar red |
| Error "No disponible" | No está invitado | Verificar lista de testers |
| App no abre | Certificado no confiado | Ajustes → Confiar perfil |
| Crashea al abrir | Bug en la app | Ver logs de crash |

---

## 🆘 Si nada funciona

### Plan B: Build Ad-Hoc (preview profile)

Si TestFlight sigue sin funcionar, puedes distribuir un IPA directo:

```bash
cd egchat-mobile

# Build con perfil preview (Ad-Hoc)
eas build --profile preview --platform ios
```

**Requisitos:**
- Necesitas el UDID del dispositivo del tester
- Máximo 100 dispositivos

**Cómo obtener el UDID:**
```bash
eas device:create
# Envía el link al tester, se registra automáticamente
```

---

## 📞 Información para el tester

**Envía este mensaje al tester con problemas:**

```
Hola, para ayudarte a instalar EGCHAT necesito que me digas:

1. ¿Recibiste un email de Apple/TestFlight? (Sí/No)

2. ¿Tienes la app TestFlight instalada? (Sí/No)
   Si no: https://apps.apple.com/app/testflight/id899247664

3. ¿Qué versión de iOS tienes?
   (Ajustes → General → Información → Versión)

4. ¿En qué paso exacto falla?
   - No veo EGCHAT en TestFlight
   - Veo EGCHAT pero no se instala
   - Se instala pero no abre
   - Otro: [describe el problema]

5. ¿Aparece algún mensaje de error? ¿Cuál?

Con esa información podré ayudarte mejor.
```

---

## ✅ Checklist final

- [ ] Tester está en la lista de invitados (App Store Connect)
- [ ] Tester recibió el email o el enlace público
- [ ] Tester tiene TestFlight instalado
- [ ] Tester tiene iOS 13.0 o superior
- [ ] Tester tiene espacio suficiente (500+ MB)
- [ ] Tester tiene conexión a Internet
- [ ] Build no expiró (< 90 días)
- [ ] Tester aceptó la invitación
- [ ] Tester confió en el certificado (si aplica)

---

## 🔗 Links útiles

- TestFlight en App Store: https://apps.apple.com/app/testflight/id899247664
- Soporte TestFlight: https://developer.apple.com/testflight/
- Guía para testers: https://testflight.apple.com/
