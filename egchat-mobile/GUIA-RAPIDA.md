# 🚀 Guía Rápida - Configuración EAS

## ✅ Lo que YA está listo

He actualizado automáticamente:

1. ✅ **eas.json** - Team ID corregido a `XU6YD7ZJ2K`
2. ✅ **app.json** - Team ID agregado: `XU6YD7ZJ2K`
3. ✅ **Scripts de automatización** creados
4. ✅ **Archivos de credenciales** verificados

---

## 🎯 Lo que DEBES hacer ahora (2 opciones)

### Opción A: Automático (Recomendado) ⚡

```bash
cd egchat-mobile
./complete-eas-setup.sh
```

Este script:
- ✅ Verifica todo automáticamente
- ✅ Te guía paso a paso
- ✅ Abre el menú de EAS cuando estés listo

---

### Opción B: Manual 👨‍💻

En el menú actual de EAS CLI que tienes abierto:

#### 1. Configurar Push Notifications

```
? What do you want to do?
→ Push Notifications: Manage your Apple Push Notifications Key
```

Luego:
```
→ Upload a new push key
```

Ingresa:
- **Key ID:** `RCYN4AG5PM`
- **Team ID:** `XU6YD7ZJ2K`
- **Archivo:** `.secrets/AuthKey_RCYN4AG5PM.p8`

#### 2. Verificar Build Credentials

```
? What do you want to do?
→ Build Credentials: Manage everything needed to build your project
```

Verifica que veas:
- ✅ Distribution Certificate: `3F8BB637607A483A0EA9B8EE53788872`
- ✅ Provisioning Profiles: activos y válidos
- ✅ Apple Team: `XU6YD7ZJ2K`

#### 3. (Opcional) App Store Connect API

```
? What do you want to do?
→ App Store Connect: Manage your API Key
```

Esto permite subidas automáticas a TestFlight.

---

## 🔍 Verificar que todo funciona

Después de configurar, ejecuta:

```bash
cd egchat-mobile

# Verificar configuración
./verify-apns-config.sh

# Ver estado de credenciales
eas credentials

# Build de prueba
eas build --platform ios --profile testflight
```

---

## 📋 Checklist final

- [ ] Push Notifications Key subido
- [ ] Build Credentials verificados (certificados OK)
- [ ] App Store Connect API configurado (opcional)
- [ ] `./verify-apns-config.sh` ejecutado sin errores
- [ ] Build de TestFlight exitoso

---

## 🆘 Si algo falla

### Error: "No push key found"
```bash
eas credentials --platform ios
# Selecciona: Push Notifications Key > Upload
```

### Error: "Invalid team ID"
Verifica que ambos archivos tengan `XU6YD7ZJ2K`:
- `app.json`
- `eas.json`

### Error: "Bundle identifier mismatch"
Debe ser: `com.jallzstores.egchat` en `app.json`

### Ver logs detallados
```bash
eas build:list
eas build:view [BUILD_ID]
```

---

## 📝 Información importante

**Apple Team:** XU6YD7ZJ2K (JALLZ STORES PTY LTD)  
**Bundle ID:** com.jallzstores.egchat  
**Push Key ID:** RCYN4AG5PM  
**Certificado expira:** 22 Oct 2027

---

## 🚀 Siguiente paso recomendado

```bash
cd egchat-mobile
./complete-eas-setup.sh
```

Este script te guiará por todo el proceso de forma interactiva.

---

## 💡 Archivos importantes creados

1. **CONFIGURACION-COMPLETA-EAS.md** - Guía detallada completa
2. **complete-eas-setup.sh** - Script de configuración automatizado
3. **setup-push.sh** - Script específico para push notifications
4. **verify-apns-config.sh** - Verificación de configuración (actualizado)
5. **GUIA-RAPIDA.md** - Este archivo

¿Necesitas ayuda con algún paso específico? 🤔
