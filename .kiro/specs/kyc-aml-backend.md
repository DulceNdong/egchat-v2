# Spec: Backend FastAPI KYC/AML — EGChat Monedero Digital

**Versión:** 1.0  
**Stack:** Python 3.11 · FastAPI · SQLAlchemy 2.0 · PostgreSQL (Supabase)  
**Cumplimiento:** COBAC R-2023/01 · CEMAC N°02/24 · Ley N°2/2008 GQ

---

## 1. Arquitectura de capas

```
app/
├── main.py               ← FastAPI app, lifespan, middleware CORS/logging
├── config.py             ← Settings (pydantic-settings, .env)
├── database.py           ← Engine SQLAlchemy, get_db dependency
│
├── models/               ← SQLAlchemy ORM (tablas BD)
│   ├── user.py
│   ├── admin_user.py
│   ├── kyc_application.py
│   ├── kyc_personal_data.py
│   ├── kyc_document.py
│   ├── kyc_screening.py
│   ├── kyc_audit_log.py
│   ├── transaction.py
│   └── sar.py
│
├── schemas/              ← Pydantic request/response
│   ├── kyc.py
│   ├── admin.py
│   ├── aml.py
│   └── auth.py
│
├── routers/              ← Endpoints FastAPI
│   ├── kyc.py            ← /kyc/*  (usuario)
│   ├── admin_kyc.py      ← /admin/kyc/* (revisores)
│   ├── aml.py            ← /aml/*  (transacciones + SAR)
│   ├── auth.py           ← /auth/* (admin login/logout)
│   └── webhooks.py       ← /webhooks/bange
│
├── services/             ← Lógica de negocio
│   ├── kyc_service.py    ← Orquesta submit, draft, upload
│   ├── decision_engine.py← Calcula risk_score + auto-aprueba/manda a manual
│   ├── screening.py      ← OFAC / PEP / Adverse Media
│   ├── storage.py        ← Supabase Storage (upload cifrado)
│   ├── aml_service.py    ← Flagging + SAR
│   └── notifications.py  ← Push/email al usuario tras decisión
│
├── auth/
│   ├── jwt.py            ← Crear/verificar JWT
│   ├── dependencies.py   ← get_current_admin, require_role
│   └── password.py       ← bcrypt hash/verify
│
└── core/
    ├── audit.py          ← Helper para insertar en kyc_audit_log
    ├── encryption.py     ← AES-256 para campos sensibles
    └── exceptions.py     ← HTTPException customizadas
```

---

## 2. Endpoints

### /auth (admin)
| Método | Ruta | Descripción |
|---|---|---|
| POST | /auth/login | Login admin → JWT |
| POST | /auth/logout | Invalidar sesión |
| GET  | /auth/me | Perfil del admin autenticado |

### /kyc (usuario de la app)
| Método | Ruta | Descripción |
|---|---|---|
| GET  | /kyc/status | Estado KYC del usuario autenticado |
| GET  | /kyc/draft | Recuperar borrador guardado |
| POST | /kyc/draft | Guardar borrador (pasos 1 y 2) |
| POST | /kyc/submit | Envío final con documentos y selfie |
| POST | /kyc/upload | Subir imagen de documento o selfie |
| POST | /kyc/resubmit | Reintentar tras rechazo |

### /admin/kyc (revisores)
| Método | Ruta | Descripción |
|---|---|---|
| GET  | /admin/kyc/pending | Lista KYC pendientes (paginada) |
| GET  | /admin/kyc/{id} | Detalle completo de un KYC |
| POST | /admin/kyc/{id}/review | Aprobar / rechazar / bloquear |
| POST | /admin/kyc/{id}/bank-decision | Decisión BANGE (BANK_VIEWER) |
| GET  | /admin/kyc/stats | Estadísticas dashboard |

### /aml (AML / compliance)
| Método | Ruta | Descripción |
|---|---|---|
| GET  | /aml/transactions/flagged | Transacciones flaggeadas |
| POST | /aml/transactions/{id}/flag | Flaggear transacción |
| POST | /aml/transactions/{id}/review | Marcar como revisada |
| GET  | /aml/sar | Listar SAR |
| POST | /aml/sar | Crear nuevo SAR |
| GET  | /aml/sar/{id} | Detalle SAR |
| PUT  | /aml/sar/{id} | Actualizar SAR |
| POST | /aml/sar/{id}/send | Enviar SAR a ANIF |

### /webhooks
| Método | Ruta | Descripción |
|---|---|---|
| POST | /webhooks/bange | Recibir decisión banco (HMAC firmado) |

---

## 3. Motor de decisión (risk_score)

```
Factores de riesgo (0–100):
  +10 → PEP (politically_exposed = TRUE)
  +15 → Nacionalidad en lista FATF high-risk
  +20 → Source of funds = OTHER
  +10 → Monthly income > 5M XAF sin justificación
  +25 → Match en screening SANCTIONS
  +20 → Match en screening PEP
  +10 → Match en screening ADVERSE_MEDIA
  +15 → OCR confidence < 0.70
  +20 → liveness_passed = FALSE
  +10 → Face match score < 0.75
  -10 → Documento vigente y OCR confidence > 0.90
  -5  → Face match score > 0.90

Decisión automática:
  score 0–30  → AUTO_APPROVED
  score 31–60 → MANUAL_REVIEW
  score 61+   → MANUAL_REVIEW (con alerta de alto riesgo)
  match SANCTIONS → BLOCKED directo
```

---

## 4. Roles y permisos

| Role | Puede hacer |
|---|---|
| SUPER_ADMIN | Todo |
| COMPLIANCE_OFFICER | Revisar KYC, crear SAR, ver audit log |
| ANALYST | Solo lectura + comentarios |
| BANK_VIEWER | Solo ver KYC asignados + bank-decision |

---

## 5. Seguridad

- JWT HS256 con expiración 8h (admin) / 30d (usuario app)
- HMAC-SHA256 para validar webhooks de BANGE
- AES-256 para URLs de documentos en BD (encryption.py)
- Rate limiting: 10 req/min en /kyc/upload, 5 req/min en /kyc/submit
- Audit log automático en cada acción sensible

---

## 6. Tareas implementadas

- [x] T1: Spec doc
- [x] T2: Estructura de proyecto
- [x] T3: Modelos SQLAlchemy
- [x] T4: Schemas Pydantic
- [x] T5: Auth JWT + roles
- [x] T6: Router /kyc
- [x] T7: Router /admin/kyc
- [x] T8: Motor de decisión
- [x] T9: Servicio screening
- [x] T10: Router /aml
- [x] T11: Webhook BANGE
