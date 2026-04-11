# EGCHAT v2.5.0 - Despliegue Automático para Todos los Usuarios (PowerShell)
# Este script se ejecuta automáticamente después de cada cambio

Write-Host "=== EGCHAT v2.5.0 - DESPLIEGUE AUTOMÁTICO ===" -ForegroundColor Green
Write-Host "Iniciando proceso de actualización global..." -ForegroundColor Yellow

# 1. Limpiar cache y build anterior
Write-Host "1. Limpiando cache y build anterior..." -ForegroundColor Blue
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }

# 2. Instalar dependencias
Write-Host "2. Instalando dependencias..." -ForegroundColor Blue
npm install

# 3. Build de producción
Write-Host "3. Generando build de producción..." -ForegroundColor Blue
npm run build

# 4. Desplegar a Vercel automáticamente
Write-Host "4. Desplegando a Vercel para todos los usuarios..." -ForegroundColor Blue
npm run deploy

# 5. Verificar despliegue
Write-Host "5. Verificando despliegue..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "https://egchat-app.vercel.app" -UseBasicParsing
    if ($response.Content -match "EGCHAT v2.5.0") {
        Write-Host "¡Despliegue exitoso!" -ForegroundColor Green
    } else {
        Write-Host "Error en despliegue" -ForegroundColor Red
    }
} catch {
    Write-Host "Error verificando despliegue" -ForegroundColor Red
}

# 6. Notificar estado
Write-Host "=== DESPLIEGUE COMPLETADO ===" -ForegroundColor Green
Write-Host "Todos los usuarios ahora tienen la última versión en:" -ForegroundColor Yellow
Write-Host "https://egchat-app.vercel.app" -ForegroundColor Cyan
Write-Host "Backend: https://egchat-api.onrender.com" -ForegroundColor Cyan
Write-Host ""
