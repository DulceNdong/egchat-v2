# Script para fix manual - reemplazo exacto

$file = "App.tsx"
(Get-Content $file) -replace "          case 'news':", "        case 'news':" | Set-Content $file

Write-Host "Fix manual aplicado - case 'news' corregido"
