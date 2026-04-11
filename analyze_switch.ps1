# Script para analizar y encontrar el problema exacto del switch

Write-Host "🔍 Analizando estructura del switch en App.tsx..."

# Leer archivo
$lines = Get-Content "App.tsx"

# Buscar el switch y mostrar estructura
$inSwitch = $false
for ($i = 4800; $i -lt 4900; $i++) {
    $line = $lines[$i]
    $lineNum = $i + 1
    
    if ($line -match "switch.*currentView") {
        $inSwitch = $true
        Write-Host "📍 Switch encontrado en línea: $lineNum"
        Write-Host "   $line"
    }
    
    if ($inSwitch -and $line -match "case\s+'.*':") {
        Write-Host "🔹 Case encontrado en línea: $lineNum"
        Write-Host "   $line"
    }
    
    if ($inSwitch -and $line -match "^\s*\}\s*$") {
        Write-Host "🔸 Fin de case/bloque en línea: $lineNum"
        Write-Host "   $line"
    }
    
    if ($line -match "break;") {
        Write-Host "✅ Break encontrado en línea: $lineNum"
        Write-Host "   $line"
    }
}
