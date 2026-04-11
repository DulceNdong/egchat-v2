# Fix simple para el backend
Write-Host "🔧 Aplicando fix simple al backend..." -ForegroundColor Cyan

# Clonar repo
Write-Host "📥 Clonando..." -ForegroundColor Yellow
git clone https://github.com/DulceNdong/egchat-api.git 2>$null
cd egchat-api

# Aplicar fix
Write-Host "🔧 Arreglando línea 878..." -ForegroundColor Cyan
(Get-Content index.js) -replace 'const updates: any = \{\};', 'const updates = {};' | Set-Content index.js

# Verificar
Write-Host "✅ Verificando fix:" -ForegroundColor Green
Get-Content index.js | Select-Object -Index 877

# Subir cambios
Write-Host "📤 Subiendo..." -ForegroundColor Yellow
git add index.js
git commit -m "Fix TypeScript syntax error"
git push

Write-Host "🎉 ¡Listo! Espera el redeploy de Render" -ForegroundColor Green