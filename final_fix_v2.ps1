# Fix final v2 - agregar 2 espacios

$content = Get-Content "App.tsx"
$content = $content -replace "case 'news':", "  case 'news':"
Set-Content "App.tsx" -Value $content

Write-Host "Espacios agregados - longitud corregida"
