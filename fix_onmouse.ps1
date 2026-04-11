# Fix para onMouseEnter incompleto

$lines = Get-Content "App.tsx"

# Corregir las líneas 4268-4270
$lines[4268] = "                        onMouseEnter={(e) => {"
$lines[4269] = "                          e.currentTarget.style.transform = 'scale(1.1)';"
$lines[4270] = "                        }}"

Set-Content "App.tsx" -Value $lines

Write-Host "onMouseEnter corregido completamente"
