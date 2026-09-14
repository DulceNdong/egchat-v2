# Spec: Base de Datos KYC/AML — EGChat Monedero Digital

**Versión:** 1.0  
**Fecha:** 2026-09  
**Cumplimiento:** COBAC R-2023/01 · CEMAC N°02/24 · Ley N°2/2008 GQ  
**Socio bancario:** BANGE (Banco Nacional de Guinea Ecuatorial)  
**Retención de datos:** 10 años (obligatorio COBAC)

---

## 1. Diagnóstico — Qué existe vs. qué falta

| Tabla spec | Archivo actual | Estado |
|---|---|---|
| `users` (status KYC) | `supabase_schema.sql` + `kyc_tables.sql` | ✅ Existe — columnas KYC añadidas |
| `kyc_applications` | `kyc_tables.sql` → `kyc_verifications` | ⚠️ Incompleta — falta `session_id`, `risk_score`, `bank_decision`, `bank_notes` |
| `kyc_personal_data` | Dentro de `kyc_verifications` | ⚠️ No separada — spec exige tabla propia |
| `kyc_documents` | `kyc_tables.sql` | ⚠️ Incompleta — falta `ocr_confidence`, `face_match_score`, `liveness_passed` |
| `kyc_screening_results` | — | ❌ No existe |
| `kyc_audit_log` (INMUTABLE) | Parcial en `kyc_status_history` | ❌ No existe con semántica INMUTABLE |
| `admin_users` | — | ❌ No existe |
| `transactions` AML | `supabase_schema.sql` | ⚠️ Falta `flagged`, `flag_reason`, `currency` |
| `suspicious_activity_reports` | — | ❌ No existe |

---

## 2. Requisitos

### 2.1 Funcionales
- R1: Registro de solicitudes KYC con estados bien definidos y trazabilidad completa
- R2: Separación de datos personales (`kyc_personal_data`) para principio de minimización
- R3: Almacenamiento seguro de documentos con métricas OCR/biometría
- R4: Screening automático contra listas OFAC, UE, ONU y PEP
- R5: Log de auditoría INMUTABLE — ninguna fila puede modificarse o eliminarse
- R6: Dos perfiles de administrador: empresa propia (full) y BANGE (solo lectura + decisión)
- R7: Monitorización AML de transacciones con flag manual/automático
- R8: Informes de operaciones sospechosas (SAR) hacia ANIF en formato SIF 1.0
- R9: Retención de todos los datos durante mínimo 10 años (COBAC)

### 2.2 No funcionales
- Cifrado AES-256 en reposo para URLs de documentos y selfies
- Índices en todos los campos de búsqueda frecuente
- Triggers automáticos para `updated_at`
- Migraciones versionadas con Alembic
- Compatible con PostgreSQL 14+ y Supabase

---

## 3. Diagrama ER (texto)

```
users (ya existe)
  │
  ├──< kyc_applications (1:1 por usuario activo)
  │       │
  │       ├──< kyc_personal_data (1:1)
  │       ├──< kyc_documents (1:N)
  │       ├──< kyc_screening_results (1:N)
  │       ├──< kyc_audit_log (1:N, INMUTABLE)
  │       └──< suspicious_activity_reports (1:N)
  │
  └──< transactions (1:N)
         └── flagged → suspicious_activity_reports

admin_users (independiente)
  ├── entity: OUR_COMPANY | BANGE
  └── role: SUPER_ADMIN | COMPLIANCE_OFFICER | ANALYST | BANK_VIEWER
       │
       ├── reviews kyc_applications (reviewed_by FK)
       └── creates suspicious_activity_reports (reported_by FK)
```

---

## 4. Modelo de datos detallado

### 4.1 Enum Values

```
kyc_applications.status:
  IN_PROGRESS → PENDING_REVIEW → AUTO_APPROVED
                              └→ MANUAL_REVIEW → APPROVED
                                              └→ REJECTED
                                              └→ BLOCKED

kyc_applications.risk_level: LOW | MEDIUM | HIGH
kyc_applications.bank_decision: APPROVED | REJECTED | PENDING

admin_users.role: SUPER_ADMIN | COMPLIANCE_OFFICER | ANALYST | BANK_VIEWER
admin_users.entity: OUR_COMPANY | BANGE

kyc_screening_results.screening_type: SANCTIONS | PEP | ADVERSE_MEDIA
transactions.type: P2P | P2M | TOPUP | WITHDRAWAL
suspicious_activity_reports.status: DRAFT | SENT_TO_ANIF | ACKNOWLEDGED
```

### 4.2 Cifrado
Campos que se almacenan cifrados (AES-256 via pgcrypto o capa aplicación):
- `kyc_documents.front_image_url`
- `kyc_documents.back_image_url`  
- `kyc_documents.selfie_url`
- `kyc_personal_data.phone`
- `kyc_personal_data.email`

---

## 5. Tareas de implementación

- [x] T1: `kyc_tables.sql` — estructura base (kyc_verifications, kyc_status_history, kyc_documents básico)
- [ ] T2: `admin_users` con roles y entidades
- [ ] T3: Ampliar `kyc_verifications` → `kyc_applications` (session_id, risk_score, bank_decision)
- [ ] T4: `kyc_personal_data` separada
- [ ] T5: Ampliar `kyc_documents` (ocr_confidence, face_match_score, liveness_passed)
- [ ] T6: `kyc_screening_results`
- [ ] T7: `kyc_audit_log` INMUTABLE con trigger anti-DML
- [ ] T8: Ampliar `transactions` para AML
- [ ] T9: `suspicious_activity_reports`
- [ ] T10: Índices + constraints + triggers en todas las nuevas tablas
- [ ] T11: Migración Alembic `008_kyc_aml_complete.py`

---

## 6. Archivo de migración

`server/migrations/008_kyc_aml_complete.sql` — contiene todos los ALTER + CREATE
`server/migrations/008_kyc_aml_complete.py`  — wrapper Alembic equivalente

---

## 7. Notas de cumplimiento

- **Art. 12 COBAC R-2023/01**: identificación obligatoria antes de activar monedero
- **Art. 23 COBAC R-2023/01**: conservación de documentos 10 años mínimo
- **CEMAC N°02/24**: screening contra listas internacionales antes de cada operación >500 XAF
- **Ley N°2/2008 GQ Art. 8**: obligación de reporte a ANIF dentro de 72h de detección
- **FATF Recommendation 10**: debida diligencia del cliente (CDD) documentada
