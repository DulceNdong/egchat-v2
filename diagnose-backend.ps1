# Script de diagnóstico para el error del backend EGCHAT (PowerShell)
Write-Host "🔍 Diagnosticando error de sintaxis en index.js línea 878..." -ForegroundColor Cyan

# Verificar si existe el archivo
if (!(Test-Path "index.js")) {
    Write-Host "❌ El archivo index.js no existe en el directorio actual" -ForegroundColor Red
    Write-Host "📂 Directorio actual: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "📁 Archivos en este directorio:" -ForegroundColor Yellow
    Get-ChildItem -Name
    exit 1
}

Write-Host "✅ Archivo index.js encontrado" -ForegroundColor Green

# Mostrar la línea problemática y contexto
Write-Host ""
Write-Host "📋 Línea 878 y contexto:" -ForegroundColor Magenta
Get-Content index.js | Select-Object -Index (877..884)  # PowerShell usa índices base 0

Write-Host ""
Write-Host "🔍 Verificando sintaxis básica..." -ForegroundColor Cyan

# Verificar caracteres en la línea problemática
Write-Host "Caracteres en la línea 878:" -ForegroundColor Yellow
$line878 = Get-Content index.js | Select-Object -Index 877
$line878 | Format-Hex

Write-Host ""
Write-Host "🔧 Posibles soluciones:" -ForegroundColor Green
Write-Host "1. Cambiar 'const updates: any = {};' por 'const updates = {};' (quitar tipo TypeScript)" -ForegroundColor White
Write-Host "2. Verificar que no haya caracteres invisibles" -ForegroundColor White
Write-Host "3. Asegurarse de que el archivo esté guardado con encoding UTF-8" -ForegroundColor White

Write-Host ""
Write-Host "💡 El error sugiere que el código está escrito en TypeScript pero se ejecuta como JavaScript" -ForegroundColor Cyan
Write-Host "   Node.js no entiende la sintaxis de tipos de TypeScript" -ForegroundColor Cyan