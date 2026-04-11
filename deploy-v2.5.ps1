# Script para desplegar v2.5.0 a todos los usuarios

Write-Host "🚀 Iniciando despliegue de EGCHAT v2.5.0..." -ForegroundColor Cyan
Write-Host ""

# Verificar que el build existe
if (!(Test-Path "dist")) {
    Write-Host "❌ Error: La carpeta 'dist' no existe" -ForegroundColor Red
    Write-Host "Ejecuta primero: npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Build encontrado" -ForegroundColor Green

# Mostrar opciones de despliegue
Write-Host ""
Write-Host "📋 Opciones de despliegue:" -ForegroundColor Cyan
Write-Host "1. Vercel (npm run deploy)" -ForegroundColor Yellow
Write-Host "2. Render (git push)" -ForegroundColor Yellow
Write-Host "3. Manual (copiar carpeta dist)" -ForegroundColor Yellow
Write-Host ""

# Opción 1: Vercel
Write-Host "🔹 Para desplegar en Vercel:" -ForegroundColor Magenta
Write-Host "npm run deploy" -ForegroundColor White
Write-Host ""

# Opción 2: Render
Write-Host "🔹 Para desplegar en Render:" -ForegroundColor Magenta
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Release: EGCHAT v2.5.0 - Production deployment'" -ForegroundColor White
Write-Host "git push" -ForegroundColor White
Write-Host ""

# Información del despliegue
Write-Host "📊 Información del despliegue:" -ForegroundColor Cyan
Write-Host "Versión: 2.5.0" -ForegroundColor White
Write-Host "Tipo: Production Release" -ForegroundColor White
Write-Host "Fecha: 2026-04-09" -ForegroundColor White
Write-Host ""

# Verificar tamaño
$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum
$distSizeMB = [math]::Round($distSize / 1MB, 2)
Write-Host "📦 Tamaño total del build: $distSizeMB MB" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Usuarios que recibirán la actualización: TODOS" -ForegroundColor Green
Write-Host "✅ Estado: LISTO PARA DESPLEGAR" -ForegroundColor Green