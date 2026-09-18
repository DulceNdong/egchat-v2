# Spec 6: Seguridad y Cumplimiento Normativo

## Contexto
Capa de seguridad para el sistema KYC de EGCHAT/BANGE. Cumple: COBAC R-2023/01, CEMAC N°02/24, Ley N°2/2008 GQ, Ley N°1/2016 Protección Datos, formato SIF 1.0 para ANIF.

---

## RF-01 — Cifrado

| Dato | Algoritmo | Gestión de claves |
|------|-----------|-------------------|
| Documentos de identidad | AES-256-GCM | AWS KMS / Vault |
| Selfies biométricas | AES-256-GCM | AWS KMS / Vault |
| Datos personales (phone, email) | Cifrado columna PostgreSQL (pgcrypto) | Clave simétrica en Vault |
| Tránsito | TLS 1.3 obligatorio | Certificado Let's Encrypt |
| URLs documentos | URLs firmadas HMAC-SHA256 | Expiran en 5 minutos |

## RF-02 — Autenticación y Autorización

- Usuarios finales: JWT (access 15 min, refresh 30 días)
- Admin: JWT + 2FA TOTP obligatorio (Google Authenticator / Authy)
- Roles: SUPER_ADMIN, COMPLIANCE_OFFICER, COMPLIANCE_OFFICER_BANGE, ANALYST_BANGE, BANK_VIEWER
- Guards en cada ruta y a nivel de componente React

## RF-03 — Auditoría

- Tabla `kyc_audit_log` INMUTABLE (solo INSERT, nunca UPDATE/DELETE) — ya creada en migración 008
- Cada acción registra: user_id, admin_id, action, ip_address, user_agent, details (JSON)
- Retención: 10 años (COBAC Art. 23)
- Exportable a CSV/PDF para auditoría COBAC

## RF-04 — Screening

- Sanciones: OFAC, UE, ONU — actualización diaria automática
- PEP: listas internacionales + lista local GQ
- Re-screening: alto riesgo cada 6 meses, medio riesgo cada 12 meses
- Adverse media: Fase 2

## RF-05 — Monitorización AML

Reglas de alerta:
- Transacción > 2.000.000 FCFA
- Más de 10 transacciones/día del mismo usuario
- Structuring: múltiples transacciones < umbral en < 24h
- Transacciones hacia jurisdicciones de alto riesgo (lista FATF)
- Inactividad > 90 días seguida de actividad repentina

Cada alerta se investiga en < 24h. Si se confirma: crear SAR y enviar a ANIF.

## RF-06 — Reportes ANIF (SIF 1.0)

Campos obligatorios del formulario SAR:
- Entidad reportante, persona involucrada, descripción operación, motivo sospecha, documentación adjunta
- Plazo: oportuno, sin demora
- Confidencialidad: prohibido tipping-off

## RF-07 — Retención y Eliminación

| Dato | Retención | Eliminación |
|------|-----------|-------------|
| Expedientes KYC | 10 años desde cierre relación | Shredding digital |
| Transacciones | 10 años | Shredding digital |
| Logs auditoría | 10 años | No eliminables |
| Documentos identidad | 10 años | Shredding digital |

## RF-08 — Gestión de Incidentes

Protocolo: Detección → Contención → Erradicación → Recuperación → Notificación
- Notificación a BANGE: < 24h
- Notificación a ANIF: < 72h (si aplica)
- Notificación a usuarios afectados
- Post-mortem obligatorio
