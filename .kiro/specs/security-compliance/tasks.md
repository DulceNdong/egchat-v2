# Tareas: Seguridad y Cumplimiento

## Fase 1 — Cifrado y autenticación
- [x] **T-01** Crear `server/middleware/encryption.js` — AES-256-GCM + URLs firmadas (5 min)
- [x] **T-02** Crear `server/middleware/twoFactor.js` — TOTP con `speakeasy`
- [x] **T-03** Actualizar `server/middleware/auth.js` — refresh token + revocación
- [x] **T-04** Crear `server/middleware/rateLimit.js` — 100 req/min por IP, 20 req/min por usuario
- [ ] **T-05** Añadir cifrado pgcrypto a columnas phone y email en `kyc_personal_data`

## Fase 2 — Roles y guards
- [ ] **T-06** Actualizar `server/middleware/roles.js` con los 5 roles completos
- [ ] **T-07** Aplicar guards a todos los endpoints KYC según tabla de permisos
- [x] **T-08** Endpoint `POST /api/admin/2fa/setup` — generar QR TOTP
- [x] **T-09** Endpoint `POST /api/admin/2fa/verify` — verificar código TOTP

## Fase 3 — Motor AML
- [x] **T-10** Crear `server/aml/rules.js` — 5 reglas de alerta configurables
- [x] **T-11** Crear `server/aml/monitor.js` — cron job cada hora con `node-cron`
- [x] **T-12** Crear `server/aml/sarBuilder.js` — payload SIF 1.0 para ANIF
- [x] **T-13** Endpoint `POST /api/aml/sar` — crear SAR manualmente
- [x] **T-14** Endpoint `GET /api/aml/alerts` — listar alertas pendientes

## Fase 4 — Re-screening automático
- [ ] **T-15** Cron job diario: re-screening de clientes de alto riesgo (cada 6 meses)
- [ ] **T-16** Cron job diario: re-screening de clientes de riesgo medio (cada 12 meses)
- [ ] **T-17** Actualización diaria de listas de sanciones OFAC/UE/ONU

## Fase 5 — Auditoría y exportación
- [x] **T-18** Endpoint `GET /api/audit/export` — exportar `kyc_audit_log` a CSV/PDF con filtros de fecha
- [x] **T-19** Middleware `auditLogger.js` — loguear automáticamente cada request sensible
- [ ] **T-20** Verificar que el trigger de `kyc_audit_log` INMUTABLE funciona (test de intento de UPDATE)
- [ ] **T-21** Ejecutar `kluster_code_review_auto` sobre todos los archivos de seguridad
