# Solución definitiva para App.tsx
# Problema: falta switch antes del case 'news'

# Leer archivo
$lines = Get-Content "App.tsx"

# Encontrar donde insertar el switch
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "case 'news':") {
        # Insertar switch antes del case 'news'
        $lines[$i-1] = "        break;"
        $lines[$i] = "      case 'news':"
        Write-Host "✅ Switch reparado en línea $($i)"
        break
    }
}

# Escribir archivo corregido
Set-Content "App.tsx" -Value $lines

Write-Host "🎯 App.tsx reparado definitivamente"
