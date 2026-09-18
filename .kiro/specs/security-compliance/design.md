# Diseño: Seguridad y Cumplimiento

## Arquitectura de seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE ENTRADA                             │
│  Cloudflare WAF + DDoS → TLS 1.3 → Rate Limiting (100 req/min) │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   AUTENTICACIÓN                                  │
│  JWT (15min) + Refresh (30d) + 2FA TOTP (admins)                │
│  Middleware: authenticateToken → checkRole → checkPermission     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   CIFRADO EN REPOSO                              │
│  pgcrypto (columnas PII) + AES-256-GCM (documentos/selfies)     │
│  Claves gestionadas: AWS KMS o HashiCorp Vault                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   AUDITORÍA INMUTABLE                            │
│  kyc_audit_log (INSERT only) + Loki/ELK para logs estructurados │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                   MONITORIZACIÓN AML                             │
│  Cron jobs → reglas de alerta → cola de revisión → SAR → ANIF  │
└─────────────────────────────────────────────────────────────────┘
```

## Middleware de seguridad (server/middleware/)

```
security/
├── auth.js          ← JWT verify + refresh
├── twoFactor.js     ← TOTP verify (speakeasy)
├── roles.js         ← checkRole(requiredRole)
├── rateLimit.js     ← express-rate-limit por IP + por usuario
├── encryption.js    ← AES-256-GCM + URL firmadas
└── auditLogger.js   ← log cada request sensible
```

## URLs firmadas para documentos

```javascript
// Expiran en 5 minutos
function generateSignedUrl(documentPath, expiresInSeconds = 300) {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${documentPath}:${expires}`;
  const signature = crypto.createHmac('sha256', process.env.URL_SIGNING_SECRET)
    .update(payload).digest('hex');
  return `${BASE_URL}/documents/${documentPath}?expires=${expires}&sig=${signature}`;
}
```

## Motor AML (server/aml/)

```
aml/
├── rules.js         ← Definición de reglas de alerta
├── monitor.js       ← Cron job cada hora
├── sarBuilder.js    ← Construye payload SIF 1.0
└── anifSubmitter.js ← Envío a ANIF
```

## Roles y permisos

| Rol | Crear KYC | Ver KYC | Aprobar/Rechazar | Crear SAR | Gestión admins |
|-----|-----------|---------|-----------------|-----------|----------------|
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| COMPLIANCE_OFFICER | ✅ | ✅ | ✅ | ✅ | ❌ |
| COMPLIANCE_OFFICER_BANGE | ❌ | ✅ | ✅ | ❌ | ❌ |
| ANALYST_BANGE | ❌ | ✅ | ❌ | ❌ | ❌ |
| BANK_VIEWER | ❌ | ✅ | ❌ | ❌ | ❌ |
