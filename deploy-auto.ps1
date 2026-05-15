# deploy-auto.ps1 — Deploy a Vercel via GitHub Actions
# Uso: powershell -ExecutionPolicy Bypass -File deploy-auto.ps1

$ErrorActionPreference = "Continue"

# 1. Verificar si hay cambios sin commitear
git add -A
$diff = git diff --cached --quiet 2>&1
if ($LASTEXITCODE -eq 0) {
    # No hay cambios staged — verificar si hay commits sin pushear
    $unpushed = git log origin/master..HEAD --oneline 2>&1
    if (-not $unpushed) {
        Write-Host "Sin cambios, no se hace deploy"
        exit 0
    }
    # Hay commits sin pushear — hacer push directamente
    Write-Host "Hay commits sin pushear, haciendo push..."
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error en git push"
        exit 1
    }
    Write-Host "Deploy completado. GitHub Actions ejecutara el build en Vercel en ~2-3 minutos."
    Write-Host "Ver progreso en: https://github.com/DulceNdong/egchat-v2/actions"
    exit 0
}

# 2. Commit y push
git commit -m "deploy: auto build and push"
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en git push"
    exit 1
}

Write-Host "Deploy completado. GitHub Actions ejecutara el build en Vercel en ~2-3 minutos."
Write-Host "Ver progreso en: https://github.com/DulceNdong/egchat-v2/actions"
