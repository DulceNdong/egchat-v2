#!/usr/bin/env node
/**
 * generate-icons.js
 * Genera todos los iconos de la app EGCHAT desde una imagen base 1024x1024.
 * Usa sharp (npm install sharp) para redimensionar.
 *
 * Uso:
 *   node generate-icons.js                        → usa icon-source.png por defecto
 *   node generate-icons.js --source mi-logo.png   → usa imagen personalizada
 *   node generate-icons.js --check                → solo verifica dependencias
 *
 * Genera:
 *   Android: mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi (ic_launcher.png, ic_launcher_round.png)
 *   iOS:     AppIcon.appiconset con todos los tamaños requeridos
 *   Web:     favicon.ico, logo-192.png, logo-512.png (para PWA)
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const ARGS = process.argv.slice(2);

// ── Configuración ─────────────────────────────────────────────────────────────

const SOURCE_DEFAULT = join(ROOT, 'icon-source.png');
const sourceArg = ARGS.indexOf('--source');
const SOURCE = sourceArg >= 0 ? resolve(ARGS[sourceArg + 1]) : SOURCE_DEFAULT;

// ── Tamaños Android ───────────────────────────────────────────────────────────
// Tamaño del ic_launcher.png por densidad
// El foreground (ic_launcher_foreground.png) es 1.5x más grande para el padding 33%
const ANDROID_SIZES = [
  { density: 'mipmap-mdpi',    launcher: 48,  foreground: 108 },
  { density: 'mipmap-hdpi',    launcher: 72,  foreground: 162 },
  { density: 'mipmap-xhdpi',   launcher: 96,  foreground: 216 },
  { density: 'mipmap-xxhdpi',  launcher: 144, foreground: 324 },
  { density: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
];

// ── Tamaños iOS ───────────────────────────────────────────────────────────────
const IOS_SIZES = [
  // iPhone
  { name: 'Icon-20@1x.png',   size: 20  },
  { name: 'Icon-20@2x.png',   size: 40  },
  { name: 'Icon-20@3x.png',   size: 60  },
  { name: 'Icon-29@1x.png',   size: 29  },
  { name: 'Icon-29@2x.png',   size: 58  },
  { name: 'Icon-29@3x.png',   size: 87  },
  { name: 'Icon-40@1x.png',   size: 40  },
  { name: 'Icon-40@2x.png',   size: 80  },
  { name: 'Icon-40@3x.png',   size: 120 },
  { name: 'Icon-60@2x.png',   size: 120 },
  { name: 'Icon-60@3x.png',   size: 180 },
  // iPad
  { name: 'Icon-76@1x.png',   size: 76  },
  { name: 'Icon-76@2x.png',   size: 152 },
  { name: 'Icon-83.5@2x.png', size: 167 },
  // App Store
  { name: 'Icon-1024.png',    size: 1024 },
];

// ── Tamaños PWA/Web ───────────────────────────────────────────────────────────
const WEB_SIZES = [
  { name: 'favicon-16.png',  size: 16  },
  { name: 'favicon-32.png',  size: 32  },
  { name: 'logo-192.png',    size: 192 },
  { name: 'logo-512.png',    size: 512 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const G = '\x1b[32m'; const R = '\x1b[31m'; const Y = '\x1b[33m';
const C = '\x1b[36m'; const B = '\x1b[1m';  const X = '\x1b[0m';

const ok   = (m) => console.log(`  ${G}✔${X}  ${m}`);
const fail = (m) => console.log(`  ${R}✘${X}  ${m}`);
const info = (m) => console.log(`  ${C}ℹ${X}  ${m}`);
const sep  = ()  => console.log(`${'─'.repeat(55)}`);

// ── Verificar dependencias ────────────────────────────────────────────────────

if (ARGS.includes('--check')) {
  try {
    await import('sharp');
    ok('sharp está instalado y listo.');
  } catch {
    fail('sharp no está instalado. Ejecuta: npm install sharp');
  }
  process.exit(0);
}

// ── Verificar imagen fuente ───────────────────────────────────────────────────

console.log();
console.log(`${B}${C}  EGCHAT — Generador de Iconos${X}`);
sep();

if (!existsSync(SOURCE)) {
  fail(`Imagen fuente no encontrada: ${SOURCE}`);
  info('Coloca tu logo en: icon-source.png (1024x1024px, fondo transparente)');
  info('O especifica la ruta: node generate-icons.js --source tu-logo.png');
  info('');
  info('Requisitos de la imagen fuente:');
  info('  • Tamaño: 1024x1024 px');
  info('  • Formato: PNG con fondo transparente');
  info('  • El logo debe ocupar el 66% central (33% de padding en cada borde)');
  info('  • Sin esquinas redondeadas — Android las aplica automáticamente');
  process.exit(1);
}

// ── Cargar sharp ──────────────────────────────────────────────────────────────

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  fail('sharp no está instalado. Ejecuta: npm install sharp');
  process.exit(1);
}

info(`Imagen fuente: ${SOURCE}`);
const meta = await sharp(SOURCE).metadata();
info(`Dimensiones: ${meta.width}x${meta.height}px`);

if (meta.width !== meta.height) {
  console.log(`  ${Y}⚠${X}  La imagen no es cuadrada. Se recortará al centro.`);
}

sep();

// ── Generar iconos Android ────────────────────────────────────────────────────

console.log(`\n${B}Android — Iconos adaptativos${X}`);

for (const { density, launcher, foreground } of ANDROID_SIZES) {
  const dir = join(ROOT, 'android', 'app', 'src', 'main', 'res', density);
  mkdirSync(dir, { recursive: true });

  // ic_launcher.png — icono legacy (fondo + logo juntos)
  await sharp(SOURCE)
    .resize(launcher, launcher, { fit: 'contain', background: { r: 0, g: 200, b: 160, alpha: 1 } })
    .png()
    .toFile(join(dir, 'ic_launcher.png'));

  // ic_launcher_round.png — igual que launcher para compatibilidad
  await sharp(SOURCE)
    .resize(launcher, launcher, { fit: 'contain', background: { r: 0, g: 200, b: 160, alpha: 1 } })
    .png()
    .toFile(join(dir, 'ic_launcher_round.png'));

  // ic_launcher_foreground.png — solo el logo con padding 33%
  // El canvas es foreground x foreground, el logo ocupa el 66% central
  const logoSize = Math.round(foreground * 0.66);
  const padding  = Math.round((foreground - logoSize) / 2);

  await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top:    padding,
      bottom: padding,
      left:   padding,
      right:  padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(join(dir, 'ic_launcher_foreground.png'));

  ok(`${density}: ic_launcher.png (${launcher}px), ic_launcher_foreground.png (${foreground}px)`);
}

// ── Generar iconos iOS ────────────────────────────────────────────────────────

console.log(`\n${B}iOS — AppIcon.appiconset${X}`);

const iosDir = join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
mkdirSync(iosDir, { recursive: true });

const iosContents = { images: [], info: { author: 'xcode', version: 1 } };

for (const { name, size } of IOS_SIZES) {
  await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 200, b: 160, alpha: 1 } })
    .png()
    .toFile(join(iosDir, name));

  ok(`iOS: ${name} (${size}x${size}px)`);

  // Añadir al Contents.json
  const scale = name.includes('@3x') ? '3x' : name.includes('@2x') ? '2x' : '1x';
  const pt    = size / parseInt(scale);
  iosContents.images.push({
    filename: name,
    idiom:    size >= 76 ? 'ipad' : 'iphone',
    scale,
    size:     `${pt}x${pt}`,
  });
}

// Icono App Store
iosContents.images.push({
  filename: 'Icon-1024.png',
  idiom:    'ios-marketing',
  scale:    '1x',
  size:     '1024x1024',
});

writeFileSync(join(iosDir, 'Contents.json'), JSON.stringify(iosContents, null, 2));
ok('iOS: Contents.json generado');

// ── Generar iconos Web/PWA ────────────────────────────────────────────────────

console.log(`\n${B}Web / PWA${X}`);

const publicDir = join(ROOT, 'public');
mkdirSync(publicDir, { recursive: true });

for (const { name, size } of WEB_SIZES) {
  await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 200, b: 160, alpha: 1 } })
    .png()
    .toFile(join(publicDir, name));
  ok(`Web: public/${name} (${size}x${size}px)`);
}

// ── Resumen ───────────────────────────────────────────────────────────────────

sep();
console.log(`
${G}${B}  ✔ Iconos generados correctamente${X}

  Android : ${ANDROID_SIZES.length * 3} archivos en mipmap-*/
  iOS     : ${IOS_SIZES.length} archivos en Assets.xcassets/AppIcon.appiconset/
  Web/PWA : ${WEB_SIZES.length} archivos en public/

  ${Y}Próximos pasos:${X}
  1. Ejecuta: npx cap sync android
  2. Ejecuta: npx cap sync ios  (si tienes iOS)
  3. Recompila la APK: node build-apk.js
`);
