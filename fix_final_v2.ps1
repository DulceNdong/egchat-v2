# Fix final v2 - eliminar ); sobrante

$content = Get-Content "App.tsx"
$content = $content -replace '\);\s*case ''news'':', 'case ''news'':'
Set-Content "App.tsx" -Value $content

Write-Host "Fix final v2 aplicado"
