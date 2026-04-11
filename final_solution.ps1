# Solución FINAL para App.tsx
# Corregir el case 'news' fuera del switch

# Leer archivo
$lines = Get-Content "App.tsx"

# Buscar y reemplazar la línea problemática
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "case 'news':") {
        # Reemplazar con indentación correcta
        $lines[$i] = "      case 'news':"
        Write-Host "✅ Case 'news' corregido en línea $($i + 1)"
        break
    }
}

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "🎯 App.tsx reparado completamente"
