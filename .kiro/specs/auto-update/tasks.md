# Tareas: Sistema de Auto-Actualización

## Fase 1 — Servidor de actualizaciones
- [x] **T-01** Crear `server/routes/updates.js` — endpoints para servir `latest.json`
- [x] **T-02** Estructura: `GET /updates/:app/:platform/:arch/latest.json`
- [x] **T-03** Crear `scripts/publish-update.sh` — firma y publica nueva versión
- [x] **T-04** Registrar ruta en `index.js`

## Fase 2 — Integración Tauri
- [x] **T-05** Añadir `tauri-plugin-updater` a cada app desktop
- [x] **T-06** Configurar `endpoints` en `tauri.conf.json` de cada app
- [x] **T-07** Generar par de claves `tauri signer generate` y guardar privkey en Vault
- [x] **T-08** Implementar diálogo de actualización en React

## Fase 3 — Rollback
- [ ] **T-09** Guardar binario anterior en disco antes de instalar actualización
- [ ] **T-10** Si la app falla 3 veces al iniciar, restaurar versión anterior automáticamente

## Fase 4 — Notificaciones
- [x] **T-11** Notificación email al admin cuando hay nueva versión disponible
- [x] **T-12** Log de auditoría: quién actualizó, cuándo, desde qué versión
