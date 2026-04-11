# Script para arreglar estructura de case en App.tsx
# Necesitamos agregar break antes del case

# Leer archivo
$lines = Get-Content "App.tsx"

# Insertar break antes de case en línea 4845
$lines[4843] = "          }"
$lines[4844] = "        break;"
$lines[4845] = "        case 'news':"

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "✅ Estructura case corregida exitosamente"
