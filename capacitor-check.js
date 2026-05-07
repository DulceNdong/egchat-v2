#!/usr/bin/env node
/**
 * capacitor-check.js
 * Script de diagnóstico para verificar el estado de Capacitor en el proyecto EGCHAT.
 * Solo lectura — no realiza ningún cambio.
 *
 * Uso: node capacitor-check.js
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

// ─── Utilidades de consola ────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

const ok   = (msg) => console.log(`  ${GREEN}✔${RESET}  ${msg}`);
const fail = (msg) => console.log(`  ${RED}✘${RESET}  ${msg}`);
const warn = (msg) => console.log(`  ${YELLOW}⚠${RESET}  ${msg}`);
const info = (msg) => console.log(`  ${CYAN}ℹ${RESET}  ${msg}`);
const sep  = ()    => console.log(`${DIM}${'─'.repeat(60)}${RESET}`);

function section(title) {
  console.log();
  console.log(`${BOLD}${CYAN}▶ ${title}${RESET}`);
  sep();
}

function readJSON(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ─── Rutas base ───────────────────────────────────────────────────────────────

// El script puede ejecutarse desde la raíz del workspace o desde cualquier
// subdirectorio; siempre resuelve relativo a su propia ubicación.
const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

// ─── 1. package.json ──────────────────────────────────────────────────────────

section('1 · package.json');

const pkgPath = join(ROOT, 'package.json');
if (!existsSync(pkgPath)) {
  fail('package.json no encontrado en la raíz del proyecto.');
} else {
  ok(`package.json encontrado: ${pkgPath}`);
  const pkg = readJSON(pkgPath);

  if (!pkg) {
    fail('No se pudo parsear package.json.');
  } else {
    info(`Nombre del proyecto : ${pkg.name ?? '(sin nombre)'}`);
    info(`Versión             : ${pkg.version ?? '(sin versión)'}`);

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Paquetes Capacitor esperados
    const capacitorPkgs = [
      '@capacitor/core',
      '@capacitor/cli',
      '@capacitor/android',
    ];

    console.log();
    console.log(`  ${BOLD}Paquetes Capacitor en package.json:${RESET}`);
    for (const dep of capacitorPkgs) {
      if (allDeps[dep]) {
        ok(`${dep}  →  ${allDeps[dep]}`);
      } else {
        fail(`${dep} NO está declarado en package.json`);
      }
    }

    // Push Notifications
    console.log();
    console.log(`  ${BOLD}Plugin de Push Notifications:${RESET}`);
    const pushPkg = '@capacitor/push-notifications';
    if (allDeps[pushPkg]) {
      ok(`${pushPkg}  →  ${allDeps[pushPkg]}`);
    } else {
      warn(`${pushPkg} NO está declarado en package.json`);
      info('Para instalarlo: npm install @capacitor/push-notifications');
    }
  }
}

// ─── 2. node_modules — instalación real ──────────────────────────────────────

section('2 · node_modules (instalación física)');

const nodeModules = join(ROOT, 'node_modules');
if (!existsSync(nodeModules)) {
  fail('La carpeta node_modules no existe. Ejecuta: npm install');
} else {
  ok('node_modules existe.');

  const checkInstalled = (pkg) => {
    const pkgDir = join(nodeModules, ...pkg.split('/'));
    if (existsSync(pkgDir)) {
      // Leer versión instalada
      const installedPkg = readJSON(join(pkgDir, 'package.json'));
      const ver = installedPkg?.version ?? 'desconocida';
      ok(`${pkg}  →  v${ver} (instalado)`);
      return true;
    } else {
      fail(`${pkg} NO está instalado en node_modules`);
      return false;
    }
  };

  checkInstalled('@capacitor/core');
  checkInstalled('@capacitor/cli');
  checkInstalled('@capacitor/android');

  console.log();
  console.log(`  ${BOLD}Plugin de Push Notifications (node_modules):${RESET}`);
  const pushInstalled = checkInstalled('@capacitor/push-notifications');
  if (!pushInstalled) {
    info('Para instalarlo: npm install @capacitor/push-notifications');
    info('Luego ejecuta  : npx cap sync android');
  }
}

// ─── 3. capacitor.config.json ─────────────────────────────────────────────────

section('3 · capacitor.config.json');

// Puede estar en la raíz o en android/app/src/main/assets/
const configCandidates = [
  join(ROOT, 'capacitor.config.json'),
  join(ROOT, 'capacitor.config.ts'),
  join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'capacitor.config.json'),
];

let capConfig = null;
let capConfigPath = null;

for (const candidate of configCandidates) {
  if (existsSync(candidate)) {
    capConfigPath = candidate;
    if (candidate.endsWith('.json')) {
      capConfig = readJSON(candidate);
    }
    break;
  }
}

if (!capConfigPath) {
  fail('capacitor.config.json / capacitor.config.ts NO encontrado.');
  warn('Ejecuta: npx cap init  para crear la configuración.');
} else {
  ok(`Archivo encontrado: ${capConfigPath}`);

  if (capConfig) {
    // Campos obligatorios
    const requiredFields = ['appId', 'appName', 'webDir'];
    for (const field of requiredFields) {
      if (capConfig[field]) {
        ok(`${field}: ${capConfig[field]}`);
      } else {
        fail(`Campo requerido "${field}" falta en capacitor.config.json`);
      }
    }

    // Servidor remoto vs local
    if (capConfig.server?.url) {
      info(`Modo servidor remoto: ${capConfig.server.url}`);
      warn('El webDir local ("dist") no se usa cuando server.url está definido.');
    } else {
      info('Modo servidor local (webDir).');
      const distPath = join(ROOT, capConfig.webDir ?? 'dist');
      if (existsSync(distPath)) {
        ok(`webDir "${capConfig.webDir}" existe en disco.`);
      } else {
        warn(`webDir "${capConfig.webDir}" NO existe. Ejecuta: npm run build`);
      }
    }

    // Plugins declarados en config
    const declaredPlugins = Object.keys(capConfig.plugins ?? {});
    if (declaredPlugins.length > 0) {
      info(`Plugins declarados en config: ${declaredPlugins.join(', ')}`);
    } else {
      info('No hay plugins declarados en capacitor.config.json.');
    }
  }
}

// ─── 4. Plataforma Android ────────────────────────────────────────────────────

section('4 · Plataforma Android');

const androidDir = join(ROOT, 'android');
if (!existsSync(androidDir)) {
  fail('La carpeta "android" NO existe.');
  info('Para añadir la plataforma: npx cap add android');
} else {
  ok('"android" existe.');

  // Archivos clave que debe tener una plataforma Android válida
  const androidRequiredFiles = [
    'build.gradle',
    'settings.gradle',
    'gradlew',
    'gradlew.bat',
    'variables.gradle',
    'gradle.properties',
    join('app', 'build.gradle'),
    join('app', 'src', 'main', 'AndroidManifest.xml'),
    join('app', 'src', 'main', 'assets', 'capacitor.config.json'),
    join('app', 'src', 'main', 'assets', 'capacitor.plugins.json'),
  ];

  console.log();
  console.log(`  ${BOLD}Archivos clave de la plataforma Android:${RESET}`);
  for (const rel of androidRequiredFiles) {
    const full = join(androidDir, rel);
    if (existsSync(full)) {
      ok(rel);
    } else {
      fail(`${rel}  ← FALTA`);
    }
  }

  // google-services.json (necesario para Push Notifications)
  console.log();
  console.log(`  ${BOLD}google-services.json (requerido para Push Notifications):${RESET}`);
  const googleServices = join(androidDir, 'app', 'google-services.json');
  if (existsSync(googleServices)) {
    ok('google-services.json encontrado.');
  } else {
    warn('google-services.json NO encontrado.');
    info('Sin este archivo las notificaciones push (FCM) no funcionarán.');
    info('Descárgalo desde Firebase Console → Configuración del proyecto.');
  }

  // capacitor.plugins.json — plugins registrados en Android
  console.log();
  console.log(`  ${BOLD}Plugins registrados en Android (capacitor.plugins.json):${RESET}`);
  const pluginsJsonPath = join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.plugins.json');
  if (existsSync(pluginsJsonPath)) {
    const plugins = readJSON(pluginsJsonPath);
    if (Array.isArray(plugins) && plugins.length > 0) {
      for (const p of plugins) {
        ok(`${p.pkg ?? p.name ?? JSON.stringify(p)}`);
      }
      // Verificar si push-notifications está entre ellos
      const hasPush = plugins.some(
        (p) => (p.pkg ?? '').includes('push-notifications') ||
                (p.name ?? '').toLowerCase().includes('push')
      );
      if (!hasPush) {
        warn('@capacitor/push-notifications NO está registrado en capacitor.plugins.json');
        info('Instala el plugin y ejecuta: npx cap sync android');
      }
    } else {
      warn('capacitor.plugins.json está vacío — no hay plugins nativos registrados.');
      info('Si instalaste plugins, ejecuta: npx cap sync android');
    }
  }

  // app/build.gradle — verificar si aplica google-services
  const appBuildGradle = join(androidDir, 'app', 'build.gradle');
  if (existsSync(appBuildGradle)) {
    const gradleContent = readFileSync(appBuildGradle, 'utf8');
    console.log();
    console.log(`  ${BOLD}app/build.gradle — google-services plugin:${RESET}`);
    if (gradleContent.includes('com.google.gms.google-services')) {
      ok('El plugin com.google.gms.google-services está referenciado.');
    } else {
      warn('El plugin com.google.gms.google-services NO está en app/build.gradle.');
    }
  }
}

// ─── 5. Resumen final ─────────────────────────────────────────────────────────

section('5 · Resumen y próximos pasos');

const pkg2 = readJSON(pkgPath);
const allDeps2 = { ...pkg2?.dependencies, ...pkg2?.devDependencies };
const pushInPkg  = !!allDeps2?.['@capacitor/push-notifications'];
const pushInNM   = existsSync(join(ROOT, 'node_modules', '@capacitor', 'push-notifications'));
const androidOk  = existsSync(join(ROOT, 'android'));
const gsJson     = existsSync(join(ROOT, 'android', 'app', 'google-services.json'));
const pluginsRaw = readJSON(join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'capacitor.plugins.json'));
const pushSynced = Array.isArray(pluginsRaw) &&
  pluginsRaw.some((p) => (p.pkg ?? '').includes('push-notifications'));

const steps = [];

if (!pushInPkg)  steps.push('npm install @capacitor/push-notifications');
if (!pushInNM && pushInPkg) steps.push('npm install  (para instalar dependencias pendientes)');
if (!gsJson)     steps.push('Añadir google-services.json en android/app/  (desde Firebase Console)');
if (!pushSynced) steps.push('npx cap sync android  (para registrar plugins en la plataforma nativa)');

if (steps.length === 0) {
  ok('Todo parece estar correctamente configurado.');
} else {
  warn('Acciones recomendadas para completar la configuración:');
  steps.forEach((s, i) => console.log(`  ${YELLOW}${i + 1}.${RESET} ${s}`));
}

console.log();
sep();
console.log(`${DIM}  Diagnóstico completado — ningún archivo fue modificado.${RESET}`);
console.log();
