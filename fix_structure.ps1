# Script para arreglar estructura switch en App.tsx
# El problema es que falta el break antes del case

# Leer archivo
$lines = Get-Content "App.tsx"

# Buscar línea con case 'news' y agregar break antes
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "case 'news':") {
        # Insertar break antes del case
        $lines[$i-1] = "        break;"
        Write-Host "Break insertado antes de case 'news' en línea $($i)"
        break
    }
}

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "✅ Estructura switch corregida exitosamente"
