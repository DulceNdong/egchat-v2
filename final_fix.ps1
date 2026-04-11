# Script final para reparar App.tsx
# El problema es que hay líneas duplicadas con }}

# Leer archivo
$lines = Get-Content "App.tsx"

# Encontrar y eliminar la línea 4269 que contiene solo }}
$newLines = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($i -ne 4268) {  # Saltar línea 4269 (índice 4268)
        $newLines += $lines[$i]
    }
}

# Escribir archivo corregido
Set-Content "App.tsx" -Value $newLines

Write-Host "✅ App.tsx reparado exitosamente"
Write-Host "Lineas eliminadas: 1 (linea 4269)"
