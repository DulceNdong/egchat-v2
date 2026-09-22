# Tareas: Capa de Abstracción de Proveedores KYC

## Fase 1 — Infraestructura base

- [x] **T-01** Crear `server/src/kyc/providers/KYCProvider.ts` con tipos e interfaz abstracta
- [x] **T-02** Crear `server/src/kyc/providers/MockProvider.ts` — simulado con delay 800ms
- [x] **T-03** Crear `server/src/kyc/KYCProviderFactory.ts` — selección, fallback y backoff
- [x] **T-04** Crear `server/src/kyc/KYCScoringEngine.ts` — motor de scoring 0–100
- [ ] **T-05** Añadir variables de entorno al `.env.example` del servidor

## Fase 2 — Proveedores reales

- [ ] **T-06** Crear `SmileIdProvider.ts` — OCR + Face Match (Smile ID Africa API v1)
- [ ] **T-07** Crear `SumsubProvider.ts` — OCR + Face + AML (Sumsub API)
- [ ] **T-08** Crear `ComplyAdvantageProvider.ts` — Sanctions + PEP screening
- [ ] **T-09** Crear `WorldCheckProvider.ts` — Sanctions + PEP alternativo

## Fase 3 — Endpoints del servidor

- [ ] **T-10** Crear `server/src/kyc/kycRoutes.ts` con los 8 endpoints definidos en RF-07
- [x] **T-11** `POST /api/kyc/application` — crear aplicación en `kyc_verifications`
- [x] **T-12** `PUT /api/kyc/application/:id/personal` — guardar en `kyc_personal_data`
- [x] **T-13** `POST /api/kyc/application/:id/document` — OCR via proveedor, guardar en `kyc_documents`
- [x] **T-14** `POST /api/kyc/application/:id/biometric` — face match + liveness
- [x] **T-15** `POST /api/kyc/application/:id/screening` — sanctions + PEP en paralelo
- [x] **T-16** `PUT /api/kyc/application/:id/financial` — guardar datos financieros
- [x] **T-17** `POST /api/kyc/application/:id/submit` — ejecutar scoring y actualizar status
- [x] **T-18** `GET /api/kyc/application/:id/status` — estado actual
- [x] **T-19** `GET /api/kyc/application/active` — aplicación activa del usuario

## Fase 4 — Scoring y decisión automática

- [x] **T-20** Al hacer submit: llamar `calculateRiskScore()` con todos los datos acumulados
- [x] **T-21** Guardar `risk_score` en `kyc_verifications`
- [x] **T-22** Actualizar `status`: `AUTO_APPROVED` | `MANUAL_REVIEW` | `REJECTED`
- [x] **T-23** Si `AUTO_APPROVED`: actualizar `users.wallet_kyc_status = 'approved'`
- [x] **T-24** Si decisión: insertar en `kyc_audit_log` con acción `KYC_AUTO_SCORED`

## Fase 5 — Observabilidad y tests

- [ ] **T-25** Añadir logs estructurados por cada llamada a proveedor (proveedor, duración_ms, éxito)
- [ ] **T-26** Test unitario del `MockProvider` — verificar que los 4 métodos retornan datos válidos
- [ ] **T-27** Test unitario del `KYCScoringEngine` — 5 casos: aprobado, revisión, rechazado, deepfake, sanctions
- [ ] **T-28** Test de integración del `KYCProviderFactory` — verificar fallback cuando el primario falla
- [ ] **T-29** Ejecutar `kluster_code_review_auto` sobre todos los archivos del módulo kyc/
