# Instalación IT — EGCHAT Desktop KYC

## BANGE KYC Admin

1. Instalar el MSI firmado en los equipos autorizados:
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/deploy-bange-gpo.ps1 `
     -InstallerPath "\\server-bange\software\egchat\BANGE-KYC-Admin_1.0.0_x64.msi"
   ```
2. Verificar salida del log en `C:\Logs\EGChat-Install\install.log`.
3. Confirmar conectividad con `https://egchat-api-xlxj.onrender.com/health`.
4. Configurar actualización automática con manifiestos servidos desde:
   - `https://egchat-api-xlxj.onrender.com/updates/bange/{{target}}/latest.json`
   - `https://egchat-api-xlxj.onrender.com/updates/empresa/{{target}}/latest.json`

## Firma y publicación

1. Generar claves Tauri con `tauri signer generate`.
2. Guardar `TAURI_PRIVATE_KEY` y `TAURI_KEY_PASSWORD` como secrets de GitHub.
3. Publicar binarios firmados con `server/scripts/publish-update.sh`.
4. Auditar instalaciones con `GET /updates/audit/log` en el servicio de updates.

## Monitorización

- UptimeRobot: monitor HTTPS `/health` cada 5 minutos.
- Sentry: configurar `SENTRY_DSN` y opcional `SENTRY_TRACES_SAMPLE_RATE` en Render.
