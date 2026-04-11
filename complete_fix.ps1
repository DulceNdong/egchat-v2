# Solución COMPLETA para el problema del switch

# Leer archivo
$content = Get-Content "App.tsx" -Raw

# Reemplazar el bloque problemático completo
$oldBlock = @()
$oldBlock += "          break;"
$oldBlock += "      case 'news':"

$newBlock = @()
$newBlock += "        break;"
$newBlock += "        case 'news':"

# Unir las líneas para reemplazar
$oldText = $oldBlock -join "`r`n"
$newText = $newBlock -join "`r`n"

# Aplicar reemplazo
$newContent = $content -replace [regex]::Escape($oldText), $newText

# Escribir archivo corregido
Set-Content "App.tsx" -Value $newContent

Write-Host "🔧 Bloque switch corregido completamente"
Write-Host "App.tsx reparado"
