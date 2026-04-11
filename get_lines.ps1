# Script para obtener líneas específicas de App.tsx

# Leer archivo
$lines = Get-Content "App.tsx"

# Mostrar líneas solicitadas
Write-Host "=== LÍNEAS 4847-4848 DE App.tsx ==="
Write-Host ""
Write-Host "Línea 4847:"
Write-Host $lines[4846]
Write-Host ""
Write-Host "Línea 4848:"
Write-Host $lines[4847]
Write-Host ""
Write-Host "Línea 4849 (contexto):"
Write-Host $lines[4848]
