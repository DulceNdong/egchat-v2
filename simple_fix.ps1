# Fix simple para App.tsx

$content = Get-Content "App.tsx"
$content = $content -replace "          break;`n      case 'news':", "        break;`n        case 'news':"
Set-Content "App.tsx" -Value $content
Write-Host "Fix aplicado"
