# Fix específico para línea 4269

# Leer archivo
$lines = Get-Content "App.tsx"

# Corregir solo la línea 4269 (índice 4268)
# Reemplazar el onMouseEnter roto con la versión correcta
$lines[4268] = "                        }}"

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "✅ Línea 4269 corregida específicamente"
