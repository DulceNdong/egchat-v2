#!/bin/bash
# publish-update.sh — Publica una nueva versión para auto-update Tauri
# Uso: ./scripts/publish-update.sh bange 1.0.1 "Descripción de cambios"

set -e

APP=${1:?"App requerida: bange | empresa"}
VERSION=${2:?"Versión requerida: e.g. 1.0.1"}
NOTES=${3:-"Nueva versión disponible"}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

BUNDLE_DIR="$ROOT/apps/desktop-$APP/src-tauri/target/release/bundle"
UPDATES_DIR="$ROOT/server/public/downloads"
mkdir -p "$UPDATES_DIR"

echo "📦 Publicando $APP v$VERSION..."

# Firmar los instaladores con la clave privada de Tauri
# La clave privada DEBE estar en TAURI_PRIVATE_KEY
if [ -z "$TAURI_PRIVATE_KEY" ]; then
  echo "⚠️  TAURI_PRIVATE_KEY no configurada — los instaladores no estarán firmados"
fi

# Copiar instaladores al directorio público
for platform in msi nsis dmg deb AppImage; do
  find "$BUNDLE_DIR" -name "*.$platform" 2>/dev/null | while read file; do
    filename="$(basename "$file")"
    cp "$file" "$UPDATES_DIR/$filename"
    echo "  ✅ $filename copiado"
  done
done

# Actualizar latest.json en el servidor
curl -s -X PATCH \
  "${API_BASE_URL:-https://egchat-api-xlxj.onrender.com}/admin/updates/$APP" \
  -H "Authorization: Bearer ${ADMIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"version\": \"$VERSION\", \"notes\": \"$NOTES\", \"pub_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
  2>/dev/null && echo "  ✅ latest.json actualizado" || echo "  ⚠️  No se pudo actualizar latest.json (endpoint no configurado)"

echo ""
echo "🎉 $APP v$VERSION publicado"
echo "   Las apps recibirán la actualización en su próximo inicio"
