# Limpieza completa de estructura duplicada

# Leer archivo
$content = Get-Content "App.tsx" -Raw

# Eliminar el bloque duplicado después del switch principal
# Buscar el segundo bloque return null; default: y eliminar todo hasta el final
$lines = $content -split "`n"
$newLines = @()
$foundEnd = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Si encontramos el segundo bloque dañado, eliminar hasta el final
    if ($line -match "return null;") {
        $foundEnd = $true
        Write-Host "Bloque duplicado encontrado en línea $($i + 1), limpiando..."
        continue
    }
    
    if (-not $foundEnd) {
        $newLines += $line
    }
}

# Escribir archivo limpio
Set-Content "App.tsx" -Value ($newLines -join "`n")

Write-Host "✅ Estructura limpiada completamente"
