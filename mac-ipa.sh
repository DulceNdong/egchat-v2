#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# mac-ipa.sh — Clonar + build + IPA completo desde cero en Mac
# Uso: bash mac-ipa.sh
# ══════════════════════════════════════════════════════════════════
set -e

# ── CONFIG ────────────────────────────────────────────────────────
REPO="https://github.com/DulceNdong/egchat-v2.git"
DIR="egchat-v2"
BUNDLE_ID="com.egchat.app"
SCHEME="App"
WORKSPACE="ios/App/App.xcworkspace"
EXPORT_DIR="IPA_OUTPUT"

# Colores
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}  ✅ $1${NC}"; }
info() { echo -e "${YELLOW}  ▶ $1${NC}"; }
fail() { echo -e "${RED}  ❌ $1${NC}"; exit 1; }

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         EGCHAT — Mac IPA Builder v1.0                   ║"
echo "║         clone → npm build → cap sync → pod → IPA        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. VERIFICAR HERRAMIENTAS ─────────────────────────────────────
info "Verificando herramientas..."
command -v git         >/dev/null 2>&1 || fail "git no encontrado"
command -v node        >/dev/null 2>&1 || fail "node no encontrado  → brew install node@20"
command -v npm         >/dev/null 2>&1 || fail "npm no encontrado   → brew install node@20"
command -v pod         >/dev/null 2>&1 || fail "CocoaPods no encontrado → brew install cocoapods"
command -v xcodebuild  >/dev/null 2>&1 || fail "xcodebuild no encontrado → instalar Xcode desde App Store"

NODE_MAJOR=$(node -e "console.log(parseInt(process.version.slice(1)))")
[ "$NODE_MAJOR" -lt 18 ] && fail "Node.js 18+ requerido (tienes $(node --version))"

echo "  node:       $(node --version)"
echo "  npm:        $(npm --version)"
echo "  CocoaPods:  $(pod --version)"
echo "  Xcode:      $(xcodebuild -version | head -1)"
echo ""

# ── 2. CLONAR O ACTUALIZAR ────────────────────────────────────────
if [ -d "$DIR" ]; then
  info "Carpeta $DIR ya existe — actualizando con git pull..."
  cd "$DIR"
  git pull origin master
  ok "git pull completado"
else
  info "Clonando $REPO..."
  git clone "$REPO" "$DIR"
  cd "$DIR"
  ok "Clone completado"
fi
echo ""

# ── 3. INSTALAR DEPENDENCIAS NPM ─────────────────────────────────
info "Instalando dependencias npm..."
npm install --legacy-peer-deps
ok "npm install completado"
echo ""

# ── 4. BUILD FRONTEND ────────────────────────────────────────────
info "Compilando frontend (Vite build)..."
npm run build
ok "Build completado → dist/"
echo ""

# ── 5. CAPACITOR SYNC ────────────────────────────────────────────
info "Sincronizando Capacitor iOS..."
npx cap sync ios
ok "cap sync completado"
echo ""

# ── 6. COCOAPODS ─────────────────────────────────────────────────
info "Instalando CocoaPods (puede tardar 5-10 min la primera vez)..."
cd ios/App
pod install --repo-update
cd ../..
ok "pod install completado"
echo ""

# ── 7. DETECTAR TEAM ID ──────────────────────────────────────────
info "Buscando Team ID de Apple Developer..."
TEAM_ID=$(security find-certificate -a -c "iPhone Developer" \
  ~/Library/Keychains/login.keychain-db 2>/dev/null \
  | grep "alis" | head -1 | grep -oE '\([A-Z0-9]{10}\)' | tr -d '()' || true)

if [ -z "$TEAM_ID" ]; then
  TEAM_ID=$(security find-certificate -a -c "Apple Development" \
    ~/Library/Keychains/login.keychain-db 2>/dev/null \
    | grep "alis" | head -1 | grep -oE '\([A-Z0-9]{10}\)' | tr -d '()' || true)
fi

if [ -z "$TEAM_ID" ]; then
  echo ""
  echo -e "${YELLOW}  ⚠️  No se detectó Team ID automáticamente.${NC}"
  echo -e "  Abre Xcode → Settings → Accounts para ver tu Team ID"
  echo -e "  O corre: security find-identity -v -p codesigning"
  echo ""
  read -p "  Introduce tu TEAM_ID (10 caracteres, ej: AB12CD34EF): " TEAM_ID
  [ -z "$TEAM_ID" ] && fail "Team ID es obligatorio para generar IPA"
else
  ok "Team ID detectado: $TEAM_ID"
fi
echo ""

# ── 8. CREAR ExportOptions.plist ─────────────────────────────────
info "Creando ExportOptions.plist (Ad Hoc)..."
cat > ExportOptions.plist << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>ad-hoc</string>
  <key>teamID</key>
  <string>${TEAM_ID}</string>
  <key>compileBitcode</key>
  <false/>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>thinning</key>
  <string>&lt;none&gt;</string>
  <key>signingStyle</key>
  <string>automatic</string>
</dict>
</plist>
PLIST
ok "ExportOptions.plist creado"
echo ""

# ── 9. ARCHIVE ────────────────────────────────────────────────────
ARCHIVE_PATH="build/EGCHAT.xcarchive"
info "Generando Archive (2-5 min)..."
mkdir -p build

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE="Automatic" \
  archive \
  | grep -E "(error:|warning:|Build succeeded|Archive succeeded|FAILED)" || true

# Verificar que el archive se creó
if [ ! -d "$ARCHIVE_PATH" ]; then
  echo ""
  echo -e "${RED}  ❌ Archive falló. Ver log completo con:${NC}"
  echo "  xcodebuild -workspace $WORKSPACE -scheme $SCHEME -configuration Release -destination 'generic/platform=iOS' -archivePath $ARCHIVE_PATH archive 2>&1 | tee build/xcode.log"
  exit 1
fi
ok "Archive creado en $ARCHIVE_PATH"
echo ""

# ── 10. EXPORTAR IPA ──────────────────────────────────────────────
info "Exportando IPA..."
mkdir -p "$EXPORT_DIR"

xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist ExportOptions.plist \
  | grep -E "(error:|Export succeeded|FAILED)" || true

IPA_FILE=$(find "$EXPORT_DIR" -name "*.ipa" 2>/dev/null | head -1)

if [ -z "$IPA_FILE" ]; then
  echo ""
  echo -e "${YELLOW}  ⚠️  IPA no generado automáticamente.${NC}"
  echo "  Esto suele pasar sin cuenta de Apple Developer pagada."
  echo "  Abre Xcode con: open $WORKSPACE"
  echo "  Luego: Product → Archive → Distribute App"
else
  ok "IPA generado: $IPA_FILE"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ COMPLETADO                                           ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Archive:  $ARCHIVE_PATH"
[ -n "$IPA_FILE" ] && echo "║  IPA:      $IPA_FILE"
echo "║                                                          ║"
echo "║  Para instalar en dispositivo:                          ║"
echo "║  → AirDrop el .ipa al iPhone                            ║"
echo "║  → O usar Apple Configurator 2 desde Mac                ║"
echo "║  → O subir a TestFlight desde Xcode Organizer           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
