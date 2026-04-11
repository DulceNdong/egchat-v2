# Script simple para analizar switch

Write-Host "🔍 Analizando estructura del switch..."

# Leer archivo línea por línea
Get-Content "App.tsx" | ForEach-Object {
    $line = $_
    
    if ($line -match "switch.*currentView") {
        Write-Host "📍 Switch encontrado:"
        Write-Host "   $line"
    }
    
    if ($line -match "case\s+'.*':") {
        Write-Host "🔹 Case encontrado:"
        Write-Host "   $line"
    }
    
    if ($line -match "break;") {
        Write-Host "✅ Break encontrado:"
        Write-Host "   $line"
    }
    
    if ($line -match "^\s*\}\s*$") {
        Write-Host "🔸 Fin de bloque:"
        Write-Host "   $line"
    }
}
