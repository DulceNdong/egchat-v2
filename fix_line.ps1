# Script para arreglar la línea 4269 de App.tsx
# El problema es que la línea está incompleta

# Leer archivo
$lines = Get-Content "App.tsx"

# Reemplazar la línea rota 4269 con la versión correcta
$lines[4268] = "                        }}"

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "✅ Línea 4269 corregida exitosamente"
