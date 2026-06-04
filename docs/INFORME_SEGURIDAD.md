# 🔒 Informe de Seguridad — EGCHAT Offline-First

## Resumen Ejecutivo

| Área | Estado Antes | Estado Después | Riesgo |
|---|---|---|---|
| Token Storage | localStorage (texto plano) | Keychain / EncryptedSharedPreferences | ✅ Bajo |
| SQLite Cifrado | Sin cifrado (IndexedDB) | Sin cifrar (roadmap) | ⚠️ Medio |
| API Auth | JWT con triple redundancia | JWT + SecureStorage | ✅ Bajo |
| Keystore Android | Credenciales en código | En código (pendiente env vars) | ⚠️ Medio |
| HTTPS | Forzado | Forzado | ✅ Bajo |
| XSS | Sin protección específica | Sin cambios | ⚠️ Medio |
| Validación uploads | Sin validación | Sin cambios | ⚠️ Bajo |

---

## Mejoras Implementadas en Esta Fase

### 1. SecureStorage (Nuevo)
```
src/security/SecureStorage.ts
```
- **iOS:** tokens en Keychain (cifrado hardware)
- **Android:** tokens en EncryptedSharedPreferences (AES-256)
- **Web:** localStorage (fallback para desarrollo)
- Token NO almacenado en texto plano en dispositivos nativos

### 2. Validación de Token Mejorada
```typescript
async isTokenValid(): Promise<boolean> {
  const token = await this.getToken();
  const payload = JSON.parse(atob(token.split('.')[1]));
  const now = Date.now() / 1000;
  return !(payload.exp && payload.exp <= now);
}
```

### 3. Limpieza de Sesión Completa
```typescript
async clearSession(): Promise<void> {
  // Elimina de Keychain/EncryptedSharedPreferences
  await secureRemove(KEY_TOKEN);
  await secureRemove(KEY_BACKUP);
  await secureRemove(KEY_USER_ID);
  // Elimina también de localStorage
  ['token', 'egchat_token', 'egchat_token_backup']
    .forEach(k => localStorage.removeItem(k));
}
```

---

## Riesgos Pendientes (Roadmap)

### ALTO: SQLite sin cifrado
**Riesgo:** En un dispositivo rooteado/jailbroken, los datos de la base de datos son legibles.

**Solución propuesta:** Migrar a `@capacitor-community/sqlite` con SQLCipher:
```typescript
db = await sqliteConn.createConnection(
  DB_NAME,
  true,              // ← encrypted: true
  'secret',          // ← passphrase
  DB_VERSION,
  false
);
```
**Impacto:** Requiere regenerar la base de datos de usuarios existentes.

### MEDIO: Keystore en código
**Riesgo:** `egchat-release.keystore` con contraseñas hardcodeadas en `build.gradle`.

**Solución:** Mover a `local.properties` (no commitear) o variables de entorno CI/CD:
```gradle
storePassword System.getenv("KEYSTORE_PASSWORD") ?: "fallback"
```

### MEDIO: XSS en contenido de mensajes
**Riesgo:** Mensajes con HTML/scripts podrían ejecutarse si se renderizan sin sanitizar.

**Estado actual:** React escapa strings automáticamente en JSX — riesgo bajo.
**Mejora:** Usar `DOMPurify` para contenido enriquecido si se añade en el futuro.

### BAJO: Validación de archivos subidos
**Riesgo:** Usuarios pueden subir archivos de cualquier tipo/tamaño.

**Solución:**
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['image/', 'audio/', 'video/', 'application/pdf'];
if (file.size > MAX_FILE_SIZE) throw new Error('Archivo demasiado grande');
if (!ALLOWED_TYPES.some(t => file.type.startsWith(t))) throw new Error('Tipo no permitido');
```

---

## Configuración de Seguridad de Red

```typescript
// capacitor.config.ts
android: {
  allowMixedContent: false,    // ✅ Solo HTTPS
},
server: {
  cleartext: false,            // ✅ Sin HTTP en producción
}
```

---

## Recomendaciones para Producción

1. **Activar Certificate Pinning** para las APIs críticas (wallet, auth)
2. **Implementar jailbreak/root detection** con `@capacitor-community/device-security`
3. **Añadir biometría** para desbloquear wallet (FaceID / Fingerprint)
4. **Audit log** de operaciones financieras en el servidor
5. **Rate limiting** en endpoints de auth y wallet
6. **Cifrar SQLite** con SQLCipher antes del lanzamiento en producción
