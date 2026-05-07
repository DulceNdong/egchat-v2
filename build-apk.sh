#!/usr/bin/env bash
# build-apk.sh
# Script de compilación de APK de producción para EGCHAT (macOS/Linux/CI)
#
# Uso:
#   bash build-apk.sh                → build completo
#   bash build-apk.sh --skip-web     → solo sync + APK
#   bash build-apk.sh --skip-sync    → solo APK
#   bash build-apk.sh --aab          → genera AAB (Play Store)
#   bash build-apk.sh --help-sign    → instrucciones de firma

set -euo pipefail

# ── Colores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m';  BOLD='\033[1m';   RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✔${RESET}  $1"; }
err()  { echo -e "  ${RED}✘${RESET}  $1"; exit 1; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
info() { echo -e "  ${CYAN}▶${RESET}  $1"; }
sep()  { echo "───────────────────────────────────────────────────────"; }

# ── Argumentos ────────────────────────────────────────────────────────────────
SKIP_WEB=false; SKIP_SYNC=false; BUILD_AAB=false; HELP_SIGN=false
for arg in "$@"; do
  case $arg in
    --skip-web)  SKIP_WEB=true  ;;
    --skip-sync) SKIP_SYNC=true ;;
    --aab)       BUILD_AAB=true ;;
    --help-sign) HELP_SIGN=true ;;
  esac
done

TASK=$([ "$BUILD_AAB" = true ] && echo "bundleRelease" || echo "assembleRelease")
EXT=$([ "$BUILD_AAB" = true ] && echo "aab" || echo "apk")

# ── Configuración ─────────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID="$ROOT/android"
DIST_APK="$ROOT/dist-apk"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
DATE=$(date +%Y%m%d)

sep
echo -e "${BOLD}${CYAN}  EGCHAT — Build APK v$VERSION ($DATE)${RESET}"
sep

# ── Verificaciones previas ────────────────────────────────────────────────────
[ -f "$ROOT/capacitor.config.ts" ] || err "No se encontró capacitor.config.ts"
[ -d "$ANDROID" ]                  || err "La carpeta android/ no existe. Ejecuta: npx cap add android"
command -v java &>/dev/null        || err "Java no encontrado. Instala JDK 17+"
[ -f "$ANDROID/gradlew" ]          || err "gradlew no encontrado en android/"
chmod +x "$ANDROID/gradlew"

ok "Verificaciones previas OK."
mkdir -p "$DIST_APK"
sep

# ── Paso 1: Build web ─────────────────────────────────────────────────────────
if [ "$SKIP_WEB" = false ]; then
  echo -e "\n${BOLD}[1/4] Build web (npm run build)${RESET}"
  info "npm run build"
  npm run build
  ok "Build web completado."
else
  warn "[1/4] Build web omitido (--skip-web)"
fi

# ── Paso 2: Cap copy ──────────────────────────────────────────────────────────
if [ "$SKIP_SYNC" = false ]; then
  echo -e "\n${BOLD}[2/4] Copiar assets (npx cap copy android)${RESET}"
  info "npx cap copy android"
  npx cap copy android
  ok "Assets copiados."
else
  warn "[2/4] Cap copy omitido (--skip-sync)"
fi

# ── Paso 3: Cap sync ──────────────────────────────────────────────────────────
if [ "$SKIP_SYNC" = false ]; then
  echo -e "\n${BOLD}[3/4] Sincronizar plugins (npx cap sync android)${RESET}"
  info "npx cap sync android"
  npx cap sync android
  ok "Plugins sincronizados."
else
  warn "[3/4] Cap sync omitido (--skip-sync)"
fi

# ── Paso 4: Gradle ───────────────────────────────────────────────────────────
echo -e "\n${BOLD}[4/4] Compilar ${EXT^^} con Gradle ($TASK)${RESET}"
warn "Este paso puede tardar 3-10 minutos la primera vez..."
info "gradlew $TASK --no-daemon"
cd "$ANDROID"
./gradlew "$TASK" --no-daemon
cd "$ROOT"
ok "Gradle completado."

# ── Paso 5: Copiar APK ────────────────────────────────────────────────────────
echo -e "\n${BOLD}[5/5] Copiar ${EXT^^} a dist-apk/${RESET}"

OUTPUT_DIR="$ANDROID/app/build/outputs/$([ "$BUILD_AAB" = true ] && echo "bundle/release" || echo "apk/release")"
APK_PATH=$(find "$OUTPUT_DIR" -name "*release*.$EXT" 2>/dev/null | head -1)

# Búsqueda más amplia si no se encontró
if [ -z "$APK_PATH" ]; then
  APK_PATH=$(find "$ANDROID/app/build/outputs" -name "*.$EXT" 2>/dev/null | head -1)
fi

[ -n "$APK_PATH" ] || err "${EXT^^} no encontrado en $OUTPUT_DIR"
ok "${EXT^^} encontrado: $APK_PATH"

DEST_NAME="egchat-v${VERSION}-${DATE}-release.${EXT}"
cp "$APK_PATH" "$DIST_APK/$DEST_NAME"

sep
ok "${EXT^^} copiado a: dist-apk/$DEST_NAME"
sep

echo -e "
${GREEN}${BOLD}  ✔ Build completado exitosamente${RESET}

  Archivo : dist-apk/$DEST_NAME
  Versión : $VERSION
  Fecha   : $DATE

${YELLOW}  ⚠ Este APK NO está firmado para producción.${RESET}
  Ejecuta: bash build-apk.sh --help-sign  para ver instrucciones.
"

# ── Instrucciones de firma ────────────────────────────────────────────────────
if [ "$HELP_SIGN" = true ]; then
  echo -e "${BOLD}${CYAN}
═══════════════════════════════════════════════════════
  GUÍA DE FIRMA DE APK CON KEYSTORE
═══════════════════════════════════════════════════════${RESET}

${BOLD}PASO 1 — Crear el keystore (solo la primera vez)${RESET}
  keytool -genkey -v \\
    -keystore egchat-release.keystore \\
    -alias egchat \\
    -keyalg RSA -keysize 2048 -validity 10000

  Guarda el .keystore en lugar seguro (NUNCA en Git).

${BOLD}PASO 2 — Firmar el APK${RESET}
  jarsigner -verbose \\
    -sigalg SHA256withRSA -digestalg SHA-256 \\
    -keystore egchat-release.keystore \\
    dist-apk/$DEST_NAME egchat

${BOLD}PASO 3 — Optimizar con zipalign${RESET}
  zipalign -v 4 \\
    dist-apk/$DEST_NAME \\
    dist-apk/egchat-v${VERSION}-signed.apk

${BOLD}PASO 4 — Verificar la firma${RESET}
  apksigner verify --verbose dist-apk/egchat-v${VERSION}-signed.apk

${BOLD}ALTERNATIVA — Firma automática via Gradle (recomendado)${RESET}
  Añade en android/app/build.gradle dentro de android {}:

  signingConfigs {
    release {
      storeFile     file(System.getenv('KEYSTORE_PATH') ?: 'egchat-release.keystore')
      storePassword System.getenv('KEYSTORE_PASS') ?: ''
      keyAlias      System.getenv('KEY_ALIAS')     ?: 'egchat'
      keyPassword   System.getenv('KEY_PASS')      ?: ''
    }
  }

  Luego ejecuta:
  KEYSTORE_PATH=./egchat-release.keystore \\
  KEYSTORE_PASS=tu_password \\
  KEY_ALIAS=egchat \\
  KEY_PASS=tu_password \\
  bash build-apk.sh

${YELLOW}  ⚠ NUNCA subas el .keystore ni las contraseñas a Git.${RESET}
${CYAN}═══════════════════════════════════════════════════════${RESET}
"
fi
