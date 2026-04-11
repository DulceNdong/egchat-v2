# Script para arreglar estructura switch completa en App.tsx
# El problema es que falta el switch wrapper

# Leer archivo
$lines = Get-Content "App.tsx"

# Encontrar la estructura correcta alrededor de la línea 4846
# Buscar el inicio del switch
$switchStart = -1
for ($i = 4800; $i -lt 4900; $i++) {
    if ($lines[$i] -match "switch.*currentView") {
        $switchStart = $i
        break
    }
}

if ($switchStart -gt 0) {
    Write-Host "Switch encontrado en línea: $switchStart"
    # Reemplazar la estructura rota
    $lines[4843] = "          }"
    $lines[4844] = "        break;"
    $lines[4845] = "        case 'news':"
    
    Set-Content "App.tsx" -Value $lines
    Write-Host "✅ Estructura switch corregida"
} else {
    Write-Host "❌ No se encontró el switch"
}
