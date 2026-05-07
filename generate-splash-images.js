#!/usr/bin/env node
/**
 * generate-splash-images.js
 * Genera imágenes de Splash Screen para todas las densidades Android e iOS
 * desde una imagen base de 1024x1024.
 *
 * Instalación: npm install sharp
 * Uso:
 *   node generate-splash-images.js                          → usa splash-source.png
 *   node generate-splash-images.js --source mi-splash.png  → imagen personalizada
 *   node generate-splash-images.js --bg "#00c8a0"          → color de fondo
 *
 * La imagen fuente debe ser el LOGO (sin fondo) — el script añade el fondo de color.
 */

import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const ARGS = process.argv.slice(2);

// ── Configuración ─────────────────────────────────────────────────────────────

const sourceArg = ARGS.indexOf('--source');
const bgArg     = ARGS.indexOf('--bg');

const SOURCE    = sourceArg >= 0
  ? resolve(ARGS[sourceArg + 1])
  : existsSync(join(ROOT, 'splash-source.png'))
    ? join(ROOT, 'splash-source.png')
    : join(ROOT, 'public', 'logo-transparent.png'); // fallback al logo de la app

const BG_COLOR  = bgArg >= 0 ? ARGS[bgArg + 1] : '#00c8a0'; // verde EGCHAT

// ── Tamaños Android ───────────────────────────────────────────────────────────
// Tamaño del canvas de splash por densidad
// El logo ocupa el 33% del ancho — centrado con fondo de color
const ANDROID_SPLASH = [
  { density: 'drawable-mdpi',    w: 320,  h: 480  },
  { density: 'drawable-hdpi',    w: 480,  h: 800  },
  { density: 'drawable-xhdpi',   w: 720,  h: 1280 },
  { density: 'drawable-xxhdpi',  w: 1080, h: 1920 },
  { density: 'drawable-xxxhdpi', w: 1440, h: 2560 },
];

// ── Tamaños iOS ───────────────────────────────────────────────────────────────
const IOS_SPLASH = [
  { name: 'splash-640x1136.png',   w: 640,  h: 1136 }, // iPhone SE/5
  { name: 'splash-750x1334.png',   w: 750,  h: 1334 }, // iPhone 6/7/8
  { name: 'splash-1125x2436.png',  w: 1125, h: 2436 }, // iPhone X/11 Pro
  { name: 'splash-1242x2688.png',  w: 1242, h: 2688 }, // iPhone Plus
  { name: 'splash-828x1792.png',   w: 828,  h: 1792 }, // iPhone XR/11
  { name: 'splash-1284x2778.png',  w: 1284, h: 2778 }, // iPhone 12/13/14 Pro Max
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const G = '\x1b[32m'; const R = '\x1b[31m'; const Y = '\x1b[33m';
const C = '\x1b[36m'; const B = '\x1b[1m';  const X = '\x1b[0m';

const ok   = (m) => console.log(`  ${G}✔${X}  ${m}`);
const fail = (m) => console.log(`  ${R}✘${X}  ${m}`);
const info = (m) => console.log(`  ${C}ℹ${X}  ${m}`);
const sep  = ()  => console.log(`${'─'.repeat(55)}`);

// Parsear color hex a RGB
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    alpha: 1,
  };
}

// ── Verificar dependencias ────────────────────────────────────────────────────

console.log();
console.log(`${B}${C}  EGCHAT — Generador de Splash Screens${X}`);
sep();

if (!existsSync(SOURCE)) {
  fail(`Imagen fuente no encontrada: ${SOURCE}`);
  info('Opciones:');
  info('  1. Crea splash-source.png (1024x1024, logo sin fondo)');
  info('  2. Usa: node generate-splash-images.js --source tu-logo.png');
  info('  3. El script usará public/logo-transparent.png como fallback');
  process.exit(1);
}

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  fail('sharp no está instalado. Ejecuta: npm install sharp');
  process.exit(1);
}

const bg = hexToRgb(BG_COLOR);
info(`Imagen fuente : ${SOURCE}`);
info(`Color de fondo: ${BG_COLOR}`);
sep();

// ── Función para crear splash con logo centrado ───────────────────────────────

async function createSplash(outputPath, canvasW, canvasH) {
  // El logo ocupa el 33% del ancho del canvas
  const logoW = Math.round(canvasW * 0.33);
  const logoH = logoW; // cuadrado

  // Redimensionar el logo
  const logoBuffer = await sharp(SOURCE)
    .resize(logoW, logoH, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Crear canvas con fondo de color y logo centrado
  await sharp({
    create: {
      width:      canvasW,
      height:     canvasH,
      channels:   4,
      background: bg,
    },
  })
    .composite([{
      input:     logoBuffer,
      gravity:   'center',
    }])
    .png()
    .toFile(outputPath);
}

// ── Generar Android ───────────────────────────────────────────────────────────

console.log(`\n${B}Android — Splash Screens${X}`);

for (const { density, w, h } of ANDROID_SPLASH) {
  const dir  = join(ROOT, 'android', 'app', 'src', 'main', 'res', density);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'splash.png');
  await createSplash(path, w, h);
  ok(`${density}/splash.png (${w}x${h}px)`);
}

// ── Generar iOS ───────────────────────────────────────────────────────────────

console.log(`\n${B}iOS — Splash Screens${X}`);

const iosDir = join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'SplashScreen.imageset');
mkdirSync(iosDir, { recursive: true });

for (const { name, w, h } of IOS_SPLASH) {
  const path = join(iosDir, name);
  await createSplash(path, w, h);
  ok(`SplashScreen.imageset/${name} (${w}x${h}px)`);
}

// Crear Contents.json para iOS
const iosContents = {
  images: [
    { idiom: 'universal', filename: 'splash-750x1334.png',  scale: '1x' },
    { idiom: 'universal', filename: 'splash-1125x2436.png', scale: '2x' },
    { idiom: 'universal', filename: 'splash-1284x2778.png', scale: '3x' },
  ],
  info: { author: 'xcode', version: 1 },
};

import { writeFileSync } from 'fs';
writeFileSync(join(iosDir, 'Contents.json'), JSON.stringify(iosContents, null, 2));
ok('SplashScreen.imageset/Contents.json generado');

// ── Resumen ───────────────────────────────────────────────────────────────────

sep();
console.log(`
${G}${B}  ✔ Splash screens generadas correctamente${X}

  Android : ${ANDROID_SPLASH.length} archivos en drawable-*/splash.png
  iOS     : ${IOS_SPLASH.length} archivos en SplashScreen.imageset/

  ${Y}Próximos pasos:${X}
  1. npx cap sync android
  2. Recompila: node build-apk.js
`);
