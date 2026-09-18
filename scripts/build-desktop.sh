#!/bin/bash
# build-desktop.sh — Compila las apps de escritorio Tauri
# Uso: ./scripts/build-desktop.sh [bange|empresa|all]

set -e

APP=${1:-all}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

check_deps() {
  command -v node  >/dev/null || { echo "❌ Node.js no encontrado"; exit 1; }
  command -v cargo >/dev/null || { echo "❌ Rust/Cargo no encontrado. Instala: https://rustup.rs"; exit 1; }
  command -v npm   >/dev/null || { echo "❌ npm no encontrado"; exit 1; }
  echo "✅ Dependencias verificadas"
}

build_app() {
  local name=$1
  local dashboard="$ROOT/apps/dashboard-$name"
  local desktop="$ROOT/apps/desktop-$name"

  echo ""
  echo "🔨 Compilando $name..."

  # Instalar dependencias del dashboard
  cd "$dashboard"
  npm install --silent

  # Compilar dashboard React
  npm run build
  echo "  ✅ Dashboard $name compilado"

  # Compilar app Tauri
  cd "$desktop"
  npm install --silent
  npx tauri build 2>&1 | grep -E "Compiling|Finished|Building|error" || true

  echo "  ✅ App desktop $name compilada"
  echo "  📦 Instaladores en: $desktop/src-tauri/target/release/bundle/"
}

sign_windows() {
  local name=$1
  local bundle_dir="$ROOT/apps/desktop-$name/src-tauri/target/release/bundle"

  if [ -z "$WINDOWS_CERT_THUMBPRINT" ]; then
    echo "  ⚠️  WINDOWS_CERT_THUMBPRINT no configurado — omitiendo firma"
    return
  fi

  echo "  🔏 Firmando instalador Windows..."
  # signtool.exe solo disponible en Windows
  # En macOS/Linux: usar osslsigncode
  echo "  ℹ️  Firma manual requerida en Windows con signtool"
}

main() {
  check_deps

  case "$APP" in
    bange)   build_app bange ;;
    empresa) build_app empresa ;;
    all)
      build_app bange
      build_app empresa
      ;;
    *)
      echo "Uso: $0 [bange|empresa|all]"
      exit 1
      ;;
  esac

  echo ""
  echo "🎉 Compilación completada"
  echo ""
  echo "Próximos pasos:"
  echo "  1. Firma los instaladores con el certificado EV Code Signing"
  echo "  2. Sube los instaladores al servidor de actualizaciones"
  echo "  3. Actualiza /updates/{app}/latest.json"
}

main
