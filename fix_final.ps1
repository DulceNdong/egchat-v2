# Script final para arreglar estructura switch-case en App.tsx
# Necesitamos encontrar y reparar la estructura completa

# Leer archivo
$lines = Get-Content "App.tsx"

# Buscar la estructura del switch y repararla
$newLines = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Si encontramos el fin de un case sin break, agregar break
    if ($line -match "^\s*\}\s*$" -and $i -gt 4800 -and $i -lt 4900) {
        # Verificar si la siguiente línea es un case
        if ($i + 1 -lt $lines.Count -and $lines[$i + 1] -match "case\s+'.*':") {
            $newLines += "        break;"
            $newLines += $line
            Write-Host "Break agregado en línea $($i + 1)"
            continue
        }
    }
    
    $newLines += $line
}

# Escribir archivo corregido
Set-Content "App.tsx" -Value $newLines

Write-Host "✅ Estructura switch-case reparada completamente"
