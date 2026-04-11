# Script para arreglar el error de TypeScript en el backend
# Ejecutar en el directorio del backend EGCHAT

Write-Host "🔧 Aplicando solución rápida al error de TypeScript..." -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
if (!(Test-Path "index.js")) {
    Write-Host "❌ Error: index.js no encontrado. Asegúrate de estar en el directorio del backend." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Archivo index.js encontrado" -ForegroundColor Green

# Crear backup
Write-Host "📦 Creando backup del archivo original..." -ForegroundColor Yellow
Copy-Item "index.js" "index.js.backup"

# Mostrar la línea problemática antes del cambio
Write-Host "📋 Línea 878 antes del cambio:" -ForegroundColor Magenta
Get-Content index.js | Select-Object -Index 877

# Aplicar el fix: cambiar "const updates: any = {};" por "const updates = {};"
Write-Host "🔧 Aplicando corrección..." -ForegroundColor Cyan
$content = Get-Content index.js -Raw
$fixedContent = $content -replace 'const updates: any = \{\};', 'const updates = {};'
$fixedContent | Set-Content index.js -Encoding UTF8

# Verificar el cambio
Write-Host "✅ Línea 878 después del cambio:" -ForegroundColor Green
Get-Content index.js | Select-Object -Index 877

Write-Host ""
Write-Host "🎉 Corrección aplicada exitosamente!" -ForegroundColor Green
Write-Host "📝 Backup guardado como: index.js.backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Ahora puedes hacer commit y push para redeployar:" -ForegroundColor Cyan
Write-Host "   git add index.js" -ForegroundColor White
Write-Host "   git commit -m 'Fix: Remove TypeScript syntax causing deployment error'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White