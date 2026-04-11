# Script completo para arreglar el backend EGCHAT
Write-Host "🔧 Arreglando el backend EGCHAT automáticamente..." -ForegroundColor Cyan

# Paso 1: Clonar el repositorio
Write-Host "📥 Clonando repositorio del backend..." -ForegroundColor Yellow
if (Test-Path "egchat-api") {
    Write-Host "⚠️  El directorio egchat-api ya existe. Eliminando..." -ForegroundColor Yellow
    Remove-Item "egchat-api" -Recurse -Force
}

git clone https://github.com/DulceNdong/egchat-api.git
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al clonar el repositorio" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Repositorio clonado exitosamente" -ForegroundColor Green

# Paso 2: Entrar al directorio
Set-Location "egchat-api"

# Paso 3: Verificar que existe index.js
if (!(Test-Path "index.js")) {
    Write-Host "❌ Error: index.js no encontrado en el repositorio clonado" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# Paso 4: Mostrar la línea problemática
Write-Host "📋 Línea 878 actual:" -ForegroundColor Magenta
Get-Content index.js | Select-Object -Index 877

# Paso 5: Aplicar el fix
Write-Host "🔧 Aplicando corrección..." -ForegroundColor Cyan
$content = Get-Content index.js -Raw
$fixedContent = $content -replace 'const updates: any = \{\};', 'const updates = {};'
$fixedContent | Set-Content index.js -Encoding UTF8

# Paso 6: Verificar el cambio
Write-Host "✅ Línea 878 corregida:" -ForegroundColor Green
Get-Content index.js | Select-Object -Index 877

# Paso 7: Hacer commit y push
Write-Host "📤 Subiendo cambios al repositorio..." -ForegroundColor Yellow
git add index.js
git commit -m "Fix: Remove TypeScript syntax causing deployment error"
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 ¡Backend arreglado y subido exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Espera unos minutos para que Render redeploye automáticamente" -ForegroundColor Cyan
    Write-Host "🔍 Luego puedes probar el login en tu app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error al subir los cambios. Revisa tu conexión y permisos." -ForegroundColor Red
}

# Volver al directorio original
Set-Location ".."