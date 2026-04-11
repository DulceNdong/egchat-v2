# Fix para doble }} en línea 4269

$lines = Get-Content "App.tsx"
$lines[4268] = "                        }"
Set-Content "App.tsx" -Value $lines

Write-Host "Doble }} corregido en línea 4269"
