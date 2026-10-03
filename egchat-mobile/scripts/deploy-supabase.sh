#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# EGChat — deploy-supabase.sh
# Ejecuta las migraciones SQL en Supabase y despliega las Edge Functions.
#
# PREREQUISITOS:
#   1. npm install -g supabase         (Supabase CLI)
#   2. supabase login                  (autenticarse)
#   3. Copiar .env.example → .env.local y rellenar todos los valores
#   4. Ejecutar: bash scripts/deploy-supabase.sh
#
# USO:
#   bash scripts/deploy-supabase.sh            # todo
#   bash scripts/deploy-supabase.sh --sql-only  # solo migraciones
#   bash scripts/deploy-supabase.sh --fn-only   # solo Edge Functions
# ══════════════════════════════════════════════════════════════════

set -e

PROJECT_REF="fqfxtjnfhvpggssbymdn"
SUPABASE_URL="https://fqfxtjnfhvpggssbymdn.supabase.co"

# Colores
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ── Cargar variables de entorno ───────────────────────────────────
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
  ok "Variables cargadas desde .env.local"
elif [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
  warn "Usando .env — copia .env.example a .env.local con los valores reales"
else
  err "No se encontró .env.local ni .env. Copia .env.example y rellénalo."
fi

# ── Verificar SUPABASE_SERVICE_ROLE_KEY ──────────────────────────
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  err "SUPABASE_SERVICE_ROLE_KEY no está definida. Añádela a .env.local"
fi

SQL_ONLY=false
FN_ONLY=false
for arg in "$@"; do
  [ "$arg" = "--sql-only" ] && SQL_ONLY=true
  [ "$arg" = "--fn-only"  ] && FN_ONLY=true
done

# ══════════════════════════════════════════════════════════════════
# PARTE 1 — MIGRACIONES SQL
# ══════════════════════════════════════════════════════════════════
run_sql() {
  local FILE="$1"
  local LABEL="$2"
  if [ ! -f "$FILE" ]; then
    warn "Archivo no encontrado: $FILE — saltando"
    return
  fi
  echo "→ Ejecutando: $LABEL"
  # Usar la API REST de Supabase para ejecutar SQL
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(cat "$FILE" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | head -n -1)

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    ok "$LABEL ejecutado"
  else
    warn "$LABEL devolvió HTTP $HTTP_CODE — verificar manualmente en Supabase Dashboard"
    echo "  Respuesta: $BODY"
    echo ""
    echo "  Si exec_sql no está disponible, ejecutar manualmente:"
    echo "  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
    echo "  Archivo: $FILE"
  fi
}

if [ "$FN_ONLY" = false ]; then
  echo ""
  echo "══════════════════════════════════════"
  echo "  PASO 1: Migraciones SQL"
  echo "══════════════════════════════════════"

  # Orden correcto: primero la migración de llamadas (crea tablas y RPCs),
  # luego la de tokens de dispositivo.
  run_sql "supabase-calls-migration.sql"       "Migración sistema de llamadas"
  run_sql "supabase-device-tokens-migration.sql" "Migración tokens de dispositivo"
fi

# ══════════════════════════════════════════════════════════════════
# PARTE 2 — EDGE FUNCTIONS
# ══════════════════════════════════════════════════════════════════
if [ "$SQL_ONLY" = false ]; then
  echo ""
  echo "══════════════════════════════════════"
  echo "  PASO 2: Deploy Edge Functions"
  echo "══════════════════════════════════════"

  # Verificar Supabase CLI
  if ! command -v supabase &> /dev/null; then
    warn "Supabase CLI no encontrado. Instalando..."
    npm install -g supabase || err "No se pudo instalar Supabase CLI"
  fi

  # Vincular proyecto si no está vinculado
  if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "→ Vinculando proyecto Supabase..."
    cd supabase && supabase link --project-ref "$PROJECT_REF" && cd ..
  fi

  echo "→ Deploy: deliver-call-push"
  supabase functions deploy deliver-call-push \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt \
    && ok "deliver-call-push desplegada" \
    || warn "deliver-call-push falló — verificar manualmente"

  echo "→ Deploy: register-device-token"
  supabase functions deploy register-device-token \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt \
    && ok "register-device-token desplegada" \
    || warn "register-device-token falló — verificar manualmente"
fi

echo ""
echo "══════════════════════════════════════"
ok "Deploy completado"
echo ""
echo "PRÓXIMO PASO: configurar secrets de las Edge Functions"
echo "Ejecutar: bash scripts/set-supabase-secrets.sh"
echo "══════════════════════════════════════"
