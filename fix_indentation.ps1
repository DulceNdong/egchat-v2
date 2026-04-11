# Script para corregir indentación del case 'news'

# Leer archivo
$lines = Get-Content "App.tsx"

# Corregir indentación de la línea 4848 (índice 4847)
# Cambiar de "      case 'news':" a "        case 'news':"
$lines[4847] = "        case 'news':"

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "✅ Indentación corregida en línea 4848"
Write-Host "case 'news' ahora esta dentro del switch"
