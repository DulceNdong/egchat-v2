# Script para arreglar línea 4844 de App.tsx
# Hay un paréntesis inesperado

# Leer archivo
$lines = Get-Content "App.tsx"

# Reemplazar línea 4844 que contiene solo )
$lines[4843] = "          }"

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "✅ Línea 4844 corregida exitosamente"
