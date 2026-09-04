#!/bin/bash
# Push unificado: server (backend) + egchat-v2 (app) en un solo comando
# Uso: ./scripts/push-all.sh "mensaje del commit"

set -e

MSG="${1:-chore: sync app + backend}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${EGCHAT_BRANCH:-mobile}"

echo "🚀 Push unificado EGCHAT"
echo "   Repo raíz: $ROOT"
echo "   Rama app:  $BRANCH"
echo ""

# 1. Backend — server/ es repo independiente (egchat-api)
if [ -d "$ROOT/server/.git" ]; then
  echo "1️⃣  Backend (server/ → egchat-api)..."
  cd "$ROOT/server"

  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "$MSG"
    git push origin main
    echo "   ✅ egchat-api pusheado"
  else
    echo "   ℹ️  Sin cambios en server/"
  fi

  # 2. Actualizar puntero del submodule en egchat-v2
  echo ""
  echo "2️⃣  Actualizando submodule en egchat-v2..."
  cd "$ROOT"
  git add server
  if git diff --staged --quiet; then
    echo "   ℹ️  Submodule ya actualizado"
  else
    git commit -m "chore: update server submodule — $MSG"
    echo "   ✅ Puntero submodule actualizado"
  fi
else
  echo "1️⃣  Backend (server/ integrado en monorepo)..."
  cd "$ROOT"
  if [ -n "$(git status --porcelain server/)" ]; then
    git add server/
    git commit -m "$MSG" || true
  fi
fi

# 3. App + submodule → egchat-v2 (dispara GitHub Actions)
echo ""
echo "3️⃣  App (egchat-v2 → rama $BRANCH)..."
cd "$ROOT"

OTHER_CHANGES=$(git status --porcelain | grep -v '^.. server$' || true)
if [ -n "$OTHER_CHANGES" ] || [ -n "$(git log origin/$BRANCH..HEAD 2>/dev/null)" ]; then
  git add -A
  git diff --staged --quiet || git commit -m "$MSG"
  git push origin "$BRANCH"
  echo "   ✅ egchat-v2 pusheado → GitHub Actions despliega todo"
else
  echo "   ℹ️  Sin cambios pendientes en egchat-v2"
  git push origin "$BRANCH" 2>/dev/null || true
fi

echo ""
echo "✅ Listo. GitHub Actions hará:"
echo "   • Sync server/ → egchat-api"
echo "   • Deploy backend en Render"
echo "   • Deploy app en Vercel"
echo ""
echo "   👉 https://github.com/DulceNdong/egchat-v2/actions"
