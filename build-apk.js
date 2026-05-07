#!/usr/bin/env node
/**
 * build-apk.js
 * Script de compilación automática de APK de producción para EGCHAT.
 * Multiplataforma: funciona en Windows, macOS y Linux.
 *
 * Uso:
 *   node build-apk.js              → build completo (web + sync + APK)
 *   node build-apk.js --skip-web   → solo sync + APK (sin npm run build)
 *   node build-apk.js --skip-sync  → solo APK (sin copy/sync)
 *   node build-apk.js --aab        → genera AAB en lugar de APK (para Play Store)
 *
 * Requisitos:
 *   - Node.js >= 18
 *   - Android SDK instalado con ANDROID_HOME configurado
 *   - Java 17+ en el PATH
 */

import { execSync }  from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

// ── Configuración ─────────────────────────────────────────────────────────────

const ROOT      = resolve(fileURLToPath(import.meta.url), '..');
const ANDROID   = join(ROOT, 'android');
const DIST_APK  = join(ROOT, 'dist-apk');
const IS_WIN    = process.platform === 'win32';
const GRADLEW   = IS_WIN ? 'gradlew.bat' : './gradlew';

// Leer versión desde package.json
const pkg       = JSON.parse(await import('fs').then(f => f.promises.readFile(join(ROOT, 'package.json'), 'utf8')));
const VERSION   = pkg.version || '1.0.0';
const TIMESTAMP = new Date().toISOString().slice(0, 10).replace(/-/g, '');

// Argumentos
const args      = process.argv.slice(2);
const SKIP_WEB  = args.includes('--skip-web');
const SKIP_SYNC = args.includes('--skip-sync');
const BUILD_AAB = args.includes('--aab');
const TASK      = BUILD_AAB ? 'bundleRelease' : 'assembleRelease';
const OUTPUT_EXT = BUILD_AAB ? 'aab' : 'apk';

// ── Helpers ───────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

function log(msg)  { console.log(`${CYAN}▶${RESET} ${msg}`); }
function ok(msg)   { console.log(`${GREEN}✔${RESET} ${msg}`); }
function warn(msg) { console.log(`${YELLOW}⚠${RESET} ${msg}`); }
function err(msg)  { console.error(`${RED}✘${RESET} ${msg}`); }
function sep()     { console.log(`${'─'.repeat(55)}`); }

function run(cmd, cwd = ROOT, label = '') {
  const display = label || cmd.slice(0, 60);
  log(display);
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
    ok(`Completado: ${display}`);
  } catch (e) {
    err(`Falló: ${display}`);
    process.exit(1);
  }
}

function findApk(dir) {
  // Busca recursivamente el APK/AAB de release generado por Gradle
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findApk(full);
      if (found) return found;
    } else if (
      entry.name.endsWith(`.${OUTPUT_EXT}`) &&
      (entry.name.includes('release') || entry.name.includes('Release'))
    ) {
      return full;
    }
  }
  return null;
}

// ── Verificaciones previas ────────────────────────────────────────────────────

sep();
console.log(`${BOLD}${CYAN}  EGCHAT — Build APK v${VERSION} (${TIMESTAMP})${RESET}`);
sep();

// Verificar que estamos en la raíz del proyecto
if (!existsSync(join(ROOT, 'capacitor.config.ts'))) {
  err('No se encontró capacitor.config.ts — ejecuta desde la raíz del proyecto.');
  process.exit(1);
}

// Verificar que existe la carpeta android
if (!existsSync(ANDROID)) {
  err('La carpeta android/ no existe. Ejecuta: npx cap add android');
  process.exit(1);
}

// Verificar Java
try {
  execSync('java -version', { stdio: 'pipe' });
  ok('Java disponible.');
} catch {
  err('Java no encontrado. Instala JDK 17+ y añádelo al PATH.');
  process.exit(1);
}

// Verificar gradlew
const gradlewPath = join(ANDROID, IS_WIN ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradlewPath)) {
  err(`gradlew no encontrado en android/. Ruta esperada: ${gradlewPath}`);
  process.exit(1);
}
ok('gradlew encontrado.');

// Crear carpeta dist-apk si no existe
if (!existsSync(DIST_APK)) {
  mkdirSync(DIST_APK, { recursive: true });
  ok('Carpeta dist-apk/ creada.');
}

sep();

// ── Paso 1: Build web ─────────────────────────────────────────────────────────

if (!SKIP_WEB) {
  console.log(`\n${BOLD}[1/4] Build web (npm run build)${RESET}`);
  run('npm run build', ROOT, 'npm run build');
} else {
  warn('[1/4] Build web omitido (--skip-web)');
}

// ── Paso 2: Cap copy ──────────────────────────────────────────────────────────

if (!SKIP_SYNC) {
  console.log(`\n${BOLD}[2/4] Copiar assets a Capacitor (npx cap copy android)${RESET}`);
  run('npx cap copy android', ROOT, 'npx cap copy android');
} else {
  warn('[2/4] Cap copy omitido (--skip-sync)');
}

// ── Paso 3: Cap sync ──────────────────────────────────────────────────────────

if (!SKIP_SYNC) {
  console.log(`\n${BOLD}[3/4] Sincronizar plugins (npx cap sync android)${RESET}`);
  run('npx cap sync android', ROOT, 'npx cap sync android');
} else {
  warn('[3/4] Cap sync omitido (--skip-sync)');
}

// ── Paso 4: Compilar APK/AAB con Gradle ──────────────────────────────────────

console.log(`\n${BOLD}[4/4] Compilar ${OUTPUT_EXT.toUpperCase()} de release (Gradle ${TASK})${RESET}`);
warn('Este paso puede tardar 3-10 minutos la primera vez...');

const gradleCmd = IS_WIN
  ? `gradlew.bat ${TASK} --no-daemon`
  : `./gradlew ${TASK} --no-daemon`;

run(gradleCmd, ANDROID, `Gradle ${TASK}`);

// ── Paso 5: Copiar APK a dist-apk/ ───────────────────────────────────────────

console.log(`\n${BOLD}[5/5] Copiar ${OUTPUT_EXT.toUpperCase()} a dist-apk/${RESET}`);

const outputDir = join(ANDROID, 'app', 'build', 'outputs',
  BUILD_AAB ? 'bundle' : 'apk',
  BUILD_AAB ? 'release' : 'release'
);

const apkPath = findApk(outputDir) || findApk(join(ANDROID, 'app', 'build', 'outputs'));

if (!apkPath) {
  err(`No se encontró el ${OUTPUT_EXT.toUpperCase()} generado en: ${outputDir}`);
  err('Verifica que Gradle compiló correctamente.');
  process.exit(1);
}

ok(`${OUTPUT_EXT.toUpperCase()} encontrado: ${apkPath}`);

const destName = `egchat-v${VERSION}-${TIMESTAMP}-release.${OUTPUT_EXT}`;
const destPath = join(DIST_APK, destName);
copyFileSync(apkPath, destPath);

sep();
ok(`${OUTPUT_EXT.toUpperCase()} copiado a: dist-apk/${destName}`);
sep();

// ── Resumen final ─────────────────────────────────────────────────────────────

console.log(`
${BOLD}${GREEN}  ✔ Build completado exitosamente${RESET}

  Archivo: ${BOLD}dist-apk/${destName}${RESET}
  Versión: ${VERSION}
  Fecha:   ${TIMESTAMP}

${YELLOW}  ⚠ IMPORTANTE: Este APK NO está firmado para producción.${RESET}
  Para publicar en Play Store debes firmarlo con tu keystore.
  Ejecuta: node build-apk.js --help-sign  para ver las instrucciones.
`);

// ── Instrucciones de firma si se pide ─────────────────────────────────────────

if (args.includes('--help-sign')) {
  console.log(`
${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}
${BOLD}  GUÍA DE FIRMA DE APK CON KEYSTORE${RESET}
${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}

${BOLD}PASO 1 — Crear el keystore (solo la primera vez)${RESET}
  keytool -genkey -v \\
    -keystore egchat-release.keystore \\
    -alias egchat \\
    -keyalg RSA \\
    -keysize 2048 \\
    -validity 10000

  Guarda el archivo .keystore en un lugar seguro (NUNCA en Git).

${BOLD}PASO 2 — Firmar el APK${RESET}
  jarsigner -verbose \\
    -sigalg SHA256withRSA \\
    -digestalg SHA-256 \\
    -keystore egchat-release.keystore \\
    dist-apk/${destName} \\
    egchat

${BOLD}PASO 3 — Optimizar con zipalign${RESET}
  zipalign -v 4 \\
    dist-apk/${destName} \\
    dist-apk/egchat-v${VERSION}-signed.apk

${BOLD}PASO 4 — Verificar la firma${RESET}
  apksigner verify --verbose dist-apk/egchat-v${VERSION}-signed.apk

${BOLD}ALTERNATIVA — Firma automática via Gradle (recomendado)${RESET}
  Añade en android/app/build.gradle dentro de android {}:

  signingConfigs {
    release {
      storeFile     file(System.getenv("KEYSTORE_PATH") ?: "egchat-release.keystore")
      storePassword System.getenv("KEYSTORE_PASS") ?: ""
      keyAlias      System.getenv("KEY_ALIAS")     ?: "egchat"
      keyPassword   System.getenv("KEY_PASS")      ?: ""
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled false
    }
  }

  Luego ejecuta con variables de entorno:
  KEYSTORE_PATH=./egchat-release.keystore \\
  KEYSTORE_PASS=tu_password \\
  KEY_ALIAS=egchat \\
  KEY_PASS=tu_password \\
  node build-apk.js

${BOLD}${YELLOW}  ⚠ NUNCA subas el .keystore ni las contraseñas a Git.${RESET}
${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}
`);
}
