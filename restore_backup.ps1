# Script para restaurar backup y analizar estructura

# Restaurar backup original
Copy-Item "App.tsx.backup" "App.tsx" -Force

Write-Host "✅ Backup restaurado"
Write-Host "📊 Analizando estructura alrededor de línea 4846..."

# Mostrar líneas alrededor del problema
$lines = Get-Content "App.tsx"
for ($i = 4830; $i -lt 4860; $i++) {
    $lineNum = $i + 1
    Write-Host "$lineNum`: $lines[$i]"
}
