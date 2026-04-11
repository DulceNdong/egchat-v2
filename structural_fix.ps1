# Solución estructural - mover case 'news' al switch correcto

$content = Get-Content "App.tsx" -Raw

# Encontrar todos los case 'news' y eliminarlos
# El case 'news' debe estar dentro del switch principal
$lines = $content -split "`n"
$newLines = @()
$insideMainSwitch = $false

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Detectar inicio del switch principal
    if ($line -match "switch.*currentView.*{") {
        $insideMainSwitch = $true
        Write-Host "Switch principal encontrado en línea $($i + 1)"
    }
    
    # Detectar fin del switch principal
    if ($line -match "^\s*}\s*$" -and $insideMainSwitch) {
        $insideMainSwitch = $false
        Write-Host "Switch principal terminado en línea $($i + 1)"
    }
    
    # Omitir case 'news' fuera del switch principal
    if (-not $insideMainSwitch -and $line -match "case\s+'news':") {
        Write-Host "Omitiendo case 'news' fuera de switch en línea $($i + 1)"
        continue
    }
    
    $newLines += $line
}

# Escribir archivo corregido
Set-Content "App.tsx" -Value ($newLines -join "`n")

Write-Host "✅ Estructura switch corregida"
