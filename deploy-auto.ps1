# deploy-auto.ps1 — Deploy a Vercel con build local (prebuilt)
# Uso: powershell -ExecutionPolicy Bypass -File deploy-auto.ps1

$ErrorActionPreference = "Continue"

# 1. Verificar si hay cambios
git add -A
$diff = git diff --cached --quiet 2>&1
$unpushed = git log origin/master..HEAD --oneline 2>&1

if ($LASTEXITCODE -eq 0 -and -not $unpushed) {
    Write-Host "Sin cambios, no se hace deploy"
    exit 0
}

# 2. Commit si hay cambios staged
if ($LASTEXITCODE -ne 0) {
    git commit -m "deploy: auto build and push"
}

# 3. Push a GitHub
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en git push"
    exit 1
}

# 4. Build local
Write-Host "Compilando proyecto..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el build"
    exit 1
}

# 5. Preparar output para Vercel prebuilt deploy
Write-Host "Preparando deploy..."
New-Item -ItemType Directory -Force -Path ".vercel\output\static" | Out-Null
Copy-Item -Recurse -Force "dist\*" ".vercel\output\static\"

$configJson = '{"version":3,"routes":[{"src":"/sw.js","dest":"/sw.js"},{"src":"/assets/(.*)","dest":"/assets/$1"},{"src":"/(.*\\.(js|css|png|jpg|svg|ico|json|woff|woff2|ttf|webp|gif))","dest":"/$1"},{"handle":"filesystem"},{"src":"/(.*)","dest":"/index.html"}]}'
Set-Content -Path ".vercel\output\config.json" -Value $configJson

# 6. Deploy prebuilt a Vercel
Write-Host "Desplegando en Vercel..."
npx vercel deploy --prebuilt --prod --scope dulcendongs-projects
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el deploy a Vercel"
    exit 1
}

# 7. Limpiar output temporal
Remove-Item -Recurse -Force ".vercel\output" -ErrorAction SilentlyContinue

Write-Host "Deploy completado en https://egchat-v2.vercel.app"
