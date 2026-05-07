# build-apk.ps1
# Script de compilación de APK de producción para EGCHAT (Windows PowerShell)
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File build-apk.ps1
#   powershell -ExecutionPolicy Bypass -File build-apk.ps1 -SkipWeb
#   powershell -ExecutionPolicy Bypass -File build-apk.ps1 -SkipSync
#   powershell -ExecutionPolicy Bypass -File build-apk.ps1 -Aab
#   powershell -ExecutionPolicy Bypass -File build-apk.ps1 -HelpSign

param(
    [switch]$SkipWeb,    # Omitir npm run build
    [switch]$SkipSync,   # Omitir cap copy y cap sync
    [switch]$Aab,        # Generar AAB en lugar de APK (para Play Store)
    [switch]$HelpSign    # Mostrar instrucciones de firma
)

$ErrorActionPreference = "Stop"

# ── Colores ───────────────────────────────────────────────────────────────────
function Log-Ok($msg)   { Write-Host "  ✔  $msg" -ForegroundColor Green }
function Log-Err($msg)  { Write-Host "  ✘  $msg" -ForegroundColor Red }
function Log-Warn($msg) { Write-Host "  ⚠  $msg" -ForegroundColor Yellow }
function Log-Info($msg) { Write-Host "  ▶  $msg" -ForegroundColor Cyan }
function Sep()          { Write-Host ("─" * 55) }

# ── Configuración ─────────────────────────────────────────────────────────────
$ROOT     = $PSScriptRoot
$ANDROID  = Join-Path $ROOT "android"
$DIST_APK = Join-Path $ROOT "dist-apk"
$TASK     = if ($Aab) { "bundleRelease" } else { "assembleRelease" }
$EXT      = if ($Aab) { "aab" } else { "apk" }

# Leer versión desde package.json
$pkg      = Get-Content (Join-Path $ROOT "package.json") | ConvertFrom-Json
$VERSION  = $pkg.version
$DATE     = Get-Date -Format "yyyyMMdd"

Sep
Write-Host "  EGCHAT — Build APK v$VERSION ($DATE)" -ForegroundColor Cyan
Sep

# ── Verificaciones previas ────────────────────────────────────────────────────

if (-not (Test-Path (Join-Path $ROOT "capacitor.config.ts"))) {
    Log-Err "No se encontró capacitor.config.ts — ejecuta desde la raíz del proyecto."
    exit 1
}

if (-not (Test-Path $ANDROID)) {
    Log-Err "La carpeta android/ no existe. Ejecuta: npx cap add android"
    exit 1
}

try { java -version 2>&1 | Out-Null; Log-Ok "Java disponible." }
catch { Log-Err "Java no encontrado. Instala JDK 17+ y añádelo al PATH."; exit 1 }

if (-not (Test-Path (Join-Path $ANDROID "gradlew.bat"))) {
    Log-Err "gradlew.bat no encontrado en android/"
    exit 1
}
Log-Ok "gradlew.bat encontrado."

if (-not (Test-Path $DIST_APK)) {
    New-Item -ItemType Directory -Path $DIST_APK | Out-Null
    Log-Ok "Carpeta dist-apk/ creada."
}

Sep

# ── Paso 1: Build web ─────────────────────────────────────────────────────────
if (-not $SkipWeb) {
    Write-Host "`n[1/4] Build web (npm run build)" -ForegroundColor White
    Log-Info "npm run build"
    npm run build
    if ($LASTEXITCODE -ne 0) { Log-Err "npm run build falló."; exit 1 }
    Log-Ok "Build web completado."
} else {
    Log-Warn "[1/4] Build web omitido (-SkipWeb)"
}

# ── Paso 2: Cap copy ──────────────────────────────────────────────────────────
if (-not $SkipSync) {
    Write-Host "`n[2/4] Copiar assets (npx cap copy android)" -ForegroundColor White
    Log-Info "npx cap copy android"
    npx cap copy android
    if ($LASTEXITCODE -ne 0) { Log-Err "cap copy falló."; exit 1 }
    Log-Ok "Assets copiados."
} else {
    Log-Warn "[2/4] Cap copy omitido (-SkipSync)"
}

# ── Paso 3: Cap sync ──────────────────────────────────────────────────────────
if (-not $SkipSync) {
    Write-Host "`n[3/4] Sincronizar plugins (npx cap sync android)" -ForegroundColor White
    Log-Info "npx cap sync android"
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { Log-Err "cap sync falló."; exit 1 }
    Log-Ok "Plugins sincronizados."
} else {
    Log-Warn "[3/4] Cap sync omitido (-SkipSync)"
}

# ── Paso 4: Gradle assembleRelease ───────────────────────────────────────────
Write-Host "`n[4/4] Compilar $($EXT.ToUpper()) con Gradle ($TASK)" -ForegroundColor White
Log-Warn "Este paso puede tardar 3-10 minutos la primera vez..."
Log-Info "gradlew.bat $TASK --no-daemon"

Push-Location $ANDROID
try {
    .\gradlew.bat $TASK --no-daemon
    if ($LASTEXITCODE -ne 0) { Log-Err "Gradle $TASK falló."; exit 1 }
    Log-Ok "Gradle completado."
} finally {
    Pop-Location
}

# ── Paso 5: Copiar APK a dist-apk/ ───────────────────────────────────────────
Write-Host "`n[5/5] Copiar $($EXT.ToUpper()) a dist-apk/" -ForegroundColor White

$outputSubdir = if ($Aab) { "bundle\release" } else { "apk\release" }
$outputDir    = Join-Path $ANDROID "app\build\outputs\$outputSubdir"

# Buscar el archivo generado
$apkFile = Get-ChildItem -Path $outputDir -Filter "*release*.$EXT" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $apkFile) {
    # Búsqueda más amplia
    $apkFile = Get-ChildItem -Path (Join-Path $ANDROID "app\build\outputs") -Filter "*.$EXT" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
}

if (-not $apkFile) {
    Log-Err "$($EXT.ToUpper()) no encontrado en: $outputDir"
    Log-Err "Verifica que Gradle compiló correctamente."
    exit 1
}

Log-Ok "$($EXT.ToUpper()) encontrado: $($apkFile.FullName)"

$destName = "egchat-v$VERSION-$DATE-release.$EXT"
$destPath = Join-Path $DIST_APK $destName
Copy-Item $apkFile.FullName $destPath

Sep
Log-Ok "$($EXT.ToUpper()) copiado a: dist-apk\$destName"
Sep

Write-Host @"

  ✔ Build completado exitosamente

  Archivo : dist-apk\$destName
  Versión : $VERSION
  Fecha   : $DATE

  ⚠ Este APK NO está firmado para producción.
  Usa -HelpSign para ver las instrucciones de firma.

"@ -ForegroundColor Green

# ── Instrucciones de firma ────────────────────────────────────────────────────
if ($HelpSign) {
    Write-Host @"
═══════════════════════════════════════════════════════
  GUÍA DE FIRMA DE APK CON KEYSTORE
═══════════════════════════════════════════════════════

PASO 1 — Crear el keystore (solo la primera vez)
  keytool -genkey -v `
    -keystore egchat-release.keystore `
    -alias egchat `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000

  Guarda el .keystore en lugar seguro (NUNCA en Git).

PASO 2 — Firmar el APK
  jarsigner -verbose `
    -sigalg SHA256withRSA `
    -digestalg SHA-256 `
    -keystore egchat-release.keystore `
    dist-apk\$destName `
    egchat

PASO 3 — Optimizar con zipalign
  zipalign -v 4 `
    dist-apk\$destName `
    dist-apk\egchat-v$VERSION-signed.apk

PASO 4 — Verificar la firma
  apksigner verify --verbose dist-apk\egchat-v$VERSION-signed.apk

ALTERNATIVA — Firma automática via Gradle (recomendado)
  Añade en android/app/build.gradle:

  signingConfigs {
    release {
      storeFile     file(System.getenv("KEYSTORE_PATH") ?: "egchat-release.keystore")
      storePassword System.getenv("KEYSTORE_PASS") ?: ""
      keyAlias      System.getenv("KEY_ALIAS")     ?: "egchat"
      keyPassword   System.getenv("KEY_PASS")      ?: ""
    }
  }

  Luego ejecuta:
  `$env:KEYSTORE_PATH=".\egchat-release.keystore"
  `$env:KEYSTORE_PASS="tu_password"
  `$env:KEY_ALIAS="egchat"
  `$env:KEY_PASS="tu_password"
  powershell -File build-apk.ps1

  ⚠ NUNCA subas el .keystore ni las contraseñas a Git.
═══════════════════════════════════════════════════════
"@ -ForegroundColor Cyan
}
