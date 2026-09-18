# Spec 9: Sistema de Auto-Actualización

## Servidor de actualizaciones

Integrado en el servidor Render existente:
```
GET /updates/bange/windows/x86_64/latest.json
GET /updates/empresa/windows/x86_64/latest.json
GET /updates/bange/macos/aarch64/latest.json
```

Formato `latest.json`:
```json
{
  "version": "1.0.1",
  "notes": "Descripción de cambios",
  "pub_date": "2026-09-15T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "FIRMA_TAURI_BASE64",
      "url": "https://egchat-api-xlxj.onrender.com/downloads/bange-1.0.1-x64.msi"
    }
  }
}
```

## Flujo de actualización

1. Al iniciar: app consulta el endpoint `latest.json`
2. Si hay nueva versión: diálogo nativo "¿Actualizar ahora?"
3. Descarga en segundo plano con barra de progreso
4. Verificación de firma antes de instalar
5. Reinicio automático al completar

## Seguridad

- Firma digital obligatoria (clave privada en Vault, pública en `tauri.conf.json`)
- HTTPS obligatorio
- Si la firma no coincide → rechazar y alertar al admin

## Rollback automático

- Si la app falla 3 veces consecutivas al iniciar → restaurar versión anterior
- Versión anterior guardada en `%APPDATA%/egchat-backup/`
