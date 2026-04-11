# Script completo para arreglar App.tsx línea 4269
# Necesitamos eliminar la línea 4269 completamente

# Leer archivo
$lines = Get-Content "App.tsx"

# Eliminar línea 4269 (índice 4268) y reorganizar
$newLines = $lines[0..4267] + $lines[4269..($lines.Length-1)]

# Escribir archivo corregido
Set-Content "App.tsx" -Value $newLines

Write-Host "✅ Línea 4269 eliminada completamente"
Write-Host "📊 Total líneas antes: $($lines.Count)"
Write-Host "📊 Total líneas después: $($newLines.Count)"
