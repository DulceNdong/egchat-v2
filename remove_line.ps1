# Script para eliminar línea 4269 de App.tsx
# Creado por ingeniero senior experto

# Crear backup
Write-Host "Creando backup de App.tsx..."
Copy-Item "App.tsx" "App.tsx.backup" -Force

# Leer archivo
$lines = Get-Content "App.tsx"

# Eliminar línea 4269 (índice 4268 en array)
$newLines = $lines[0..4267] + $lines[4269..($lines.Length-1)]

# Escribir archivo modificado
Write-Host "Eliminando línea 4269..."
Set-Content "App.tsx" -Value $newLines

Write-Host "✅ Línea 4269 eliminada exitosamente"
Write-Host "Backup creado: App.tsx.backup"
