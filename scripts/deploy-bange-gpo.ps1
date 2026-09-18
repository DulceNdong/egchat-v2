# deploy-bange-gpo.ps1 — Despliegue de BANGE KYC Admin via GPO
# Ejecutar como administrador del dominio BANGE
# Requiere: BANGE-KYC-Admin_1.0.0_x64.msi en el share de red

param(
    [string]$InstallerPath = "\\server-bange\software\egchat\BANGE-KYC-Admin_1.0.0_x64.msi",
    [string]$LogPath       = "C:\Logs\EGChat-Install"
)

$ErrorActionPreference = "Stop"

Write-Host "🔨 Instalando BANGE KYC Admin..." -ForegroundColor Cyan

# Crear directorio de logs
New-Item -ItemType Directory -Force -Path $LogPath | Out-Null

# Verificar que el instalador existe
if (-not (Test-Path $InstallerPath)) {
    Write-Error "Instalador no encontrado: $InstallerPath"
    exit 1
}

# Instalar silenciosamente
$args = @(
    "/i", $InstallerPath,
    "/quiet",
    "/norestart",
    "/log", "$LogPath\install.log"
)

$proc = Start-Process msiexec.exe -ArgumentList $args -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Error "Error instalando. Exit code: $($proc.ExitCode). Ver log: $LogPath\install.log"
    exit $proc.ExitCode
}

# Crear acceso directo en el escritorio de todos los usuarios
$desktopPath = [Environment]::GetFolderPath("CommonDesktopDirectory")
$shortcutPath = Join-Path $desktopPath "BANGE KYC Admin.lnk"

$shell    = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath  = "${env:ProgramFiles}\BANGE KYC Admin\BANGE KYC Admin.exe"
$shortcut.Description = "Panel de Cumplimiento KYC - BANGE"
$shortcut.Save()

Write-Host "✅ BANGE KYC Admin instalado correctamente" -ForegroundColor Green
Write-Host "   Acceso directo creado en el escritorio" -ForegroundColor Gray
