#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# EGChat — set-supabase-secrets.sh
# Configura los secrets de las Edge Functions en Supabase.
#
# PREREQUISITOS:
#   1. supabase login
#   2. .env.local con todos los valores rellenos
#   3. Haber ejecutado deploy-supabase.sh primero
#
# USO: bash scripts/set-supabase-secrets.sh
# ══════════════════════════════════════════════════════════════════

set -e

PROJECT_REF="fqfxtjnfhvpggssbymdn"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── Cargar variables ──────────────────────────────────────────────
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
  ok "Variables cargadas desde .env.local"
else
  err "No se encontró .env.local. Copia .env.example y rellénalo."
fi

# ── Verificar Supabase CLI ────────────────────────────────────────
if ! command -v supabase &> /dev/null; then
  err "Supabase CLI no encontrado. Ejecutar: npm install -g supabase"
fi

# ── Verificar variables obligatorias ────────────────────────────
REQUIRED=(
  "SUPABASE_SERVICE_ROLE_KEY"
  "SERVICE_TOKEN"
  "JWT_SECRET"
)
for var in "${REQUIRED[@]}"; do
  if [ -z "${!var}" ]; then
    err "$var no está definida en .env.local"
  fi
done

echo ""
echo "══════════════════════════════════════"
echo "  Configurando secrets en Supabase"
echo "  Proyecto: $PROJECT_REF"
echo "══════════════════════════════════════"
echo ""

set_secret() {
  local KEY="$1"
  local VALUE="$2"
  local LABEL="${3:-$KEY}"
  if [ -z "$VALUE" ]; then
    warn "$LABEL omitido (vacío)"
    return
  fi
  supabase secrets set "$KEY=$VALUE" --project-ref "$PROJECT_REF" \
    && ok "$LABEL configurado" \
    || warn "$LABEL falló — configurar manualmente en Dashboard"
}

# ── Secrets obligatorios ──────────────────────────────────────────
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "Service Role Key"
set_secret "SERVICE_TOKEN"             "$SERVICE_TOKEN"             "Service Token (Render↔Supabase)"
set_secret "JWT_SECRET"                "$JWT_SECRET"               "JWT Secret del backend Render"

# ── APNs VoIP (iOS) ───────────────────────────────────────────────
if [ -n "$APNS_KEY_P8" ]; then
  set_secret "APNS_KEY_P8"    "$APNS_KEY_P8"    "APNs Private Key (.p8)"
  set_secret "APNS_KEY_ID"    "$APNS_KEY_ID"    "APNs Key ID"
  set_secret "APNS_TEAM_ID"   "$APNS_TEAM_ID"   "APNs Team ID"
  set_secret "APNS_BUNDLE_ID" "$APNS_BUNDLE_ID" "APNs Bundle ID"
  set_secret "APNS_ENV"       "$APNS_ENV"       "APNs Environment"
else
  warn "APNs no configurado — las llamadas iOS con app cerrada usarán Expo Push (sin CallKit)"
  echo "  Obtener el archivo .p8 en: Apple Developer → Certificates → Keys"
fi

# ── FCM (Android) ─────────────────────────────────────────────────
if [ -n "$FCM_SERVICE_ACCOUNT_JSON" ]; then
  set_secret "FCM_SERVICE_ACCOUNT_JSON" "$FCM_SERVICE_ACCOUNT_JSON" "FCM Service Account JSON"
  set_secret "FCM_PROJECT_ID"           "$FCM_PROJECT_ID"           "FCM Project ID"
else
  warn "FCM no configurado — las llamadas Android con app cerrada usarán Expo Push"
  echo "  Obtener en: Firebase Console → Project Settings → Service Accounts"
fi

# ── Expo Push (opcional) ──────────────────────────────────────────
if [ -n "$EXPO_ACCESS_TOKEN" ]; then
  set_secret "EXPO_ACCESS_TOKEN" "$EXPO_ACCESS_TOKEN" "Expo Access Token"
fi

echo ""
echo "══════════════════════════════════════"
ok "Secrets configurados"
echo ""
echo "VERIFICAR en Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/${PROJECT_REF}/functions"
echo ""
echo "TAMBIÉN añadir en Render Dashboard (egchat-api → Environment):"
echo "  SERVICE_TOKEN = (mismo valor que el de arriba)"
echo "  TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET"
echo "══════════════════════════════════════"
