#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# setup-ios-modules.sh
# Copia los módulos nativos Swift a ios/EGChat/ después de prebuild
# Ejecutar desde egchat-mobile/ una sola vez por cada expo prebuild
#
# Uso:
#   chmod +x scripts/setup-ios-modules.sh
#   ./scripts/setup-ios-modules.sh
# ══════════════════════════════════════════════════════════════════

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
SRC="$ROOT/ios-native-modules"
DEST="$ROOT/ios/EGChat"

# ── Verificar que existe la carpeta iOS ───────────────────────────
if [ ! -d "$DEST" ]; then
  echo "❌ No se encontró $DEST"
  echo "   Ejecuta primero: npx expo prebuild --platform ios"
  exit 1
fi

echo "📦 Copiando módulos nativos Swift a $DEST..."

# ── Módulos principales ───────────────────────────────────────────
MODULES=(
  "EGChatCallModule.swift"
  "EGChatCallModule.m"
  "EGChatLiveActivity.swift"
  "EGChatNotificationService.swift"
  "EGChatRichNotification.swift"
  "EGChatShareModule.swift"
  "EGChatShortcuts.swift"
  "EGChatAudioRecorder.swift"
  "EGChatFaceFilter.swift"
  "EGChatPushKitModule.swift"
  "EGChatWidgetModule.swift"
)

for MODULE in "${MODULES[@]}"; do
  if [ -f "$SRC/$MODULE" ]; then
    cp "$SRC/$MODULE" "$DEST/$MODULE"
    echo "  ✅ $MODULE"
  else
    echo "  ⚠️  $MODULE — no encontrado en ios-native-modules/ (ignorado)"
  fi
done

# ── Carpeta para extensiones ──────────────────────────────────────
NOTIF_EXT="$ROOT/ios/EGChatNotifService"
WIDGET_EXT="$ROOT/ios/EGChatWidget"

if [ ! -d "$NOTIF_EXT" ]; then
  mkdir -p "$NOTIF_EXT"
  cp "$SRC/EGChatNotificationService.swift" "$NOTIF_EXT/NotificationService.swift" 2>/dev/null || true
  echo "  📁 Creada extensión EGChatNotifService/"
fi

if [ ! -d "$WIDGET_EXT" ]; then
  mkdir -p "$WIDGET_EXT"
  echo "  📁 Creada carpeta EGChatWidget/ (añadir en Xcode manualmente)"
fi

# ── Recordatorio de pasos manuales en Xcode ───────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "✅ Módulos copiados. Próximos pasos en Xcode:"
echo ""
echo "1. Abrir: open ios/EGChat.xcworkspace"
echo ""
echo "2. Target EGChat → Signing & Capabilities:"
echo "   - Team: tu equipo Apple Developer"
echo "   - + Push Notifications"
echo "   - + Background Modes:"
echo "       ✓ Audio, AirPlay, and Picture in Picture"
echo "       ✓ Background fetch"
echo "       ✓ Remote notifications"
echo "       ✓ Voice over IP"
echo "       ✓ Background processing"
echo "   - + Associated Domains (applinks:egchat-app.vercel.app)"
echo ""
echo "3. Añadir archivos Swift al proyecto:"
echo "   - Seleccionar todos los .swift en ios/EGChat/"
echo "   - Add Files to 'EGChat' → Target: EGChat ✓"
echo ""
echo "4. Crear Notification Service Extension:"
echo "   - File → New → Target → Notification Service Extension"
echo "   - Nombre: EGChatNotifService"
echo "   - Copiar ios/EGChatNotifService/NotificationService.swift"
echo "   - Añadir App Group: group.com.reddington120.egchat"
echo ""
echo "5. Crear Widget Extension:"
echo "   - File → New → Target → Widget Extension"
echo "   - Nombre: EGChatWidget"
echo "   - Incluir Live Activity: ✓"
echo "   - Copiar EGChatLiveActivity.swift al target"
echo ""
echo "6. Build: Cmd+B"
echo "══════════════════════════════════════════════════════"
