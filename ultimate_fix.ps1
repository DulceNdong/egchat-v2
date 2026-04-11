# Solución ULTIMA para App.tsx
# El problema es que el case 'news' está fuera del switch

# Leer archivo
$content = Get-Content "App.tsx" -Raw

# Reemplazar la estructura rota
# Buscar: break; seguido de case 'news':
$oldPattern = '(\s+break;\s+)(case\s+''news''':)'
$newPattern = '$1      case ''news'':'

# Aplicar corrección
$newContent = $content -replace $oldPattern, $newPattern

# Escribir archivo corregido
Set-Content "App.tsx" -Value $newContent

Write-Host "🔧 App.tsx corregido con solución definitiva"
Write-Host "✅ Patrones reemplazados correctamente"
