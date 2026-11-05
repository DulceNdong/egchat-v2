# 📱 Cómo invitar testers a EGCHAT en TestFlight

## ✅ Tu situación actual

- ✅ App compilada exitosamente
- ✅ App subida a App Store Connect
- ❌ **Falta:** Configurar TestFlight para que otros puedan instalar

---

## 🚀 Paso a paso para invitar testers

### Paso 1: Acceder a TestFlight

1. Ve a: https://appstoreconnect.apple.com
2. Haz clic en **"My Apps"**
3. Selecciona **EGCHAT**
4. Haz clic en la pestaña **"TestFlight"** (arriba, junto a "App Store")

---

### Paso 2: Verificar que el build esté listo

En la sección **"iOS Builds"**, verás tu build:

**Estados posibles:**
- 🟡 **"Processing"** → Espera 5-15 minutos (Apple está procesando)
- 🟡 **"Missing Compliance"** → Necesitas completar información de exportación
- 🟢 **"Ready to Test"** → Listo para agregar testers

**Si está en "Missing Compliance":**
1. Haz clic en el build
2. Haz clic en **"Provide Export Compliance Information"**
3. Responde las preguntas:
   - "Does your app use encryption?" → **NO** (si solo usas HTTPS)
   - Si usas videollamadas con WebRTC cifrado → **YES**, pero es exento (estándar)
4. Guarda

---

### Paso 3: Completar información de prueba (OBLIGATORIO)

Antes de invitar testers, completa esta información:

1. En **TestFlight** → barra lateral izquierda → **"Test Information"**
2. Completa los campos:

#### Beta App Information
- **Email de contacto de beta**: Tu email (ej: `soporte@egchat.com`)
- **Nombre de contacto**: Tu nombre
- **Teléfono de contacto**: Tu número

#### Test Information
- **¿Qué deben probar los testers?** (ejemplo):
  ```
  EGCHAT es una aplicación de mensajería instantánea.
  
  Funciones principales a probar:
  - Registro e inicio de sesión
  - Envío y recepción de mensajes
  - Llamadas de voz y video
  - Compartir fotos y ubicación
  - Notificaciones push
  
  Por favor reporta cualquier error o comportamiento inesperado.
  ```

#### App Privacy
- **URL de política de privacidad**: Si tienes una, agrégala. Si no, puedes usar: `https://tu-dominio.com/privacy` (temporal)

3. Haz clic en **"Save"**

---

### Paso 4A: Invitar testers INTERNOS (Sin revisión de Apple)

**Ideal para:** Tu equipo, hasta 100 personas que tienen acceso a App Store Connect.

1. **TestFlight** → **Internal Testing** (barra lateral izquierda)
2. Haz clic en **"+"** junto a "Internal Groups"
3. Nombra el grupo: `Equipo EGCHAT`
4. **Habilita Automatic Distribution** (opcional): Los nuevos builds se envían automáticamente
5. Haz clic en **"Create"**

#### Agregar testers internos:
1. Haz clic en el grupo que acabas de crear
2. **Testers** → **"+"**
3. Selecciona usuarios de tu equipo (deben tener rol en App Store Connect)
4. Haz clic en **"Add"**

**Los testers reciben un email inmediatamente** con instrucciones para instalar.

---

### Paso 4B: Invitar testers EXTERNOS (Cualquier persona - Requiere revisión)

**Ideal para:** Beta pública, usuarios finales. Hasta 10,000 testers.

1. **TestFlight** → **External Testing** (barra lateral izquierda)
2. Haz clic en **"+"** junto a "External Groups"
3. Nombra el grupo: `Beta Testers EGCHAT`
4. Haz clic en **"Create"**

#### Agregar el build al grupo:
1. Haz clic en el grupo que acabas de crear
2. Sección **"Builds"** → **"+"**
3. Selecciona el build más reciente (1.0.0 build 122)
4. Haz clic en **"Next"**

#### Completar información para revisión de Apple:
- **¿Qué deben probar los testers?** (similar al Paso 3)
- **Email de contacto**
- **Información de inicio de sesión** (si la app requiere cuenta):
  ```
  Usuario de prueba: test@egchat.com
  Contraseña: TestDemo123
  ```
- **Notas adicionales** (opcional):
  ```
  La app requiere permisos de cámara, micrófono y ubicación.
  Las llamadas de video funcionan mejor con Wi-Fi.
  ```

5. Haz clic en **"Submit for Review"**

**⏱️ Apple revisará en 1-2 días.** Te llegará un email cuando sea aprobado.

#### Agregar testers externos (después de aprobación):
1. Haz clic en el grupo
2. **Testers** → **"+"** → **"Add New Testers"**
3. Ingresa emails de los testers (uno por línea o separados por coma)
4. Haz clic en **"Add"**

**Los testers reciben un email** con instrucciones para instalar.

---

### Paso 5: Los testers instalan la app

Una vez invitados, los testers deben:

1. **Revisar su email** (buscar email de "TestFlight")
2. Hacer clic en **"View in TestFlight"** o **"Start Testing"**
3. Si no tienen TestFlight instalado:
   - Se abrirá la App Store
   - Descargar **TestFlight** (app oficial de Apple, gratis)
4. Abrir TestFlight
5. Ver **EGCHAT** en la lista de apps disponibles
6. Hacer clic en **"Install"**

---

## 🔧 Solución de problemas

### "The build is still processing"
**Solución:** Espera 5-15 minutos. Apple está procesando el build.

### "Missing Compliance"
**Solución:** 
1. Haz clic en el build
2. **"Provide Export Compliance Information"**
3. Responde "NO" a uso de cifrado (si solo usas HTTPS)

### "You must provide test information"
**Solución:** Completa **TestFlight → Test Information** (Paso 3 arriba)

### Los testers no reciben el email
**Solución:**
- Verifica que el email esté correcto
- Revisa carpeta de spam
- Copia el **Public Link** y envíalo manualmente:
  1. TestFlight → External/Internal Group
  2. **Public Link** → **Enable**
  3. Copia el link y envíalo por WhatsApp/Telegram

### "Testflight code is invalid"
**Solución:** El código expira. Genera un nuevo **Public Link** y envíalo.

---

## 📊 Comparación: Interno vs Externo

| Característica | Interno | Externo |
|----------------|---------|---------|
| **Revisión de Apple** | ❌ No | ✅ Sí (1-2 días) |
| **Límite de testers** | 100 | 10,000 |
| **Requisito** | Cuenta en ASC | Solo email |
| **Disponibilidad** | Inmediata | Después de aprobación |
| **Ideal para** | Equipo/empresa | Beta pública |

---

## 🎯 Resumen ejecutivo

**Para testing rápido (tu equipo):**
1. TestFlight → Internal Testing → Crear grupo
2. Agregar testers (deben tener rol en App Store Connect)
3. Testers reciben email → Instalan desde TestFlight

**Para distribución amplia:**
1. TestFlight → External Testing → Crear grupo
2. Submit for Review (esperar 1-2 días)
3. Agregar testers por email
4. Testers reciben email → Instalan desde TestFlight

---

## ✅ Checklist

- [ ] Build en estado "Ready to Test" (no "Processing")
- [ ] Export Compliance completado (si aplica)
- [ ] Test Information completada (email, instrucciones)
- [ ] Grupo de testers creado (Interno o Externo)
- [ ] Build agregado al grupo
- [ ] Testers invitados por email
- [ ] (Externo) Submit for Review enviado
- [ ] (Externo) Aprobación de Apple recibida
- [ ] Testers reciben email de TestFlight
- [ ] Testers instalan app TestFlight
- [ ] Testers pueden ver e instalar EGCHAT

---

## 🔗 Links útiles

- App Store Connect: https://appstoreconnect.apple.com
- Guía oficial TestFlight: https://developer.apple.com/testflight/
- Descargar TestFlight (testers): https://apps.apple.com/app/testflight/id899247664

---

## 📧 Ejemplo de email para enviar a testers

```
Hola,

Te invito a probar la versión beta de EGCHAT, nuestra nueva app de mensajería.

1. Descarga la app TestFlight de la App Store:
   https://apps.apple.com/app/testflight/id899247664

2. Abre este link en tu iPhone:
   [LINK DE TESTFLIGHT AQUÍ]

3. Acepta la invitación en TestFlight

4. Instala EGCHAT

¡Gracias por ayudarnos a mejorar la app!
Cualquier feedback es bienvenido.

Saludos,
[Tu nombre]
```
