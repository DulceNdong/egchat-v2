#!/usr/bin/env node
/**
 * debug-check.js
 * Script de diagnóstico automático para EGCHAT en Android.
 * Verifica el estado de notificaciones, Doze, permisos y Firebase.
 *
 * Uso:
 *   node debug-check.js              → diagnóstico completo
 *   node debug-check.js --logcat     → monitorear logcat en tiempo real
 *   node debug-check.js --doze-test  → simular ciclo Doze completo
 *   node debug-check.js --send-test  → enviar notificación de prueba via servidor
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const PKG_ID  = 'com.egchat.app';
const ARGS    = process.argv.slice(2);

// ── Colores ───────────────────────────────────────────────────────────────────
const G = '\x1b[32m'; const R = '\x1b[31m'; const Y = '\x1b[33m';
const C = '\x1b[36m'; const B = '\x1b[1m';  const D = '\x1b[2m'; const X = '\x1b[0m';

const ok   = (m) => console.log(`  ${G}✔${X}  ${m}`);
const fail = (m) => console.log(`  ${R}✘${X}  ${m}`);
const warn = (m) => console.log(`  ${Y}⚠${X}  ${m}`);
const info = (m) => console.log(`  ${C}ℹ${X}  ${m}`);
const sep  = ()  => console.log(`${D}${'─'.repeat(55)}${X}`);
const hdr  = (m) => { console.log(); console.log(`${B}${C}▶ ${m}${X}`); sep(); };

function adb(cmd, silent = false) {
  try {
    return execSync(`adb ${cmd}`, { encoding: 'utf8', stdio: silent ? 'pipe' : 'pipe' }).trim();
  } catch (e) {
    return null;
  }
}

// ── Verificar adb disponible ──────────────────────────────────────────────────
try { execSync('adb version', { stdio: 'pipe' }); }
catch { fail('adb no encontrado. Instala Android SDK Platform Tools.'); process.exit(1); }

// ── Verificar dispositivo conectado ──────────────────────────────────────────
const devices = adb('devices');
const connected = devices?.split('\n').filter(l => l.includes('\tdevice')).length > 0;

console.log();
console.log(`${B}${C}  EGCHAT — Diagnóstico Android${X}`);
sep();

if (!connected) {
  fail('No hay dispositivo Android conectado.');
  info('Conecta el dispositivo por USB y activa "Depuración USB".');
  info('Luego ejecuta: adb devices');
  process.exit(1);
}
ok(`Dispositivo conectado: ${devices.split('\n').find(l => l.includes('\tdevice'))?.split('\t')[0]}`);

// ── Modo logcat en tiempo real ────────────────────────────────────────────────
if (ARGS.includes('--logcat')) {
  console.log(`\n${B}Monitoreando logcat — Ctrl+C para salir${X}\n`);
  const tags = ['EGChat','AlarmReceiver','VoipForegroundService','CallScreen',
                'FirebaseMessaging','PushNotifications','Capacitor','FCM'];
  const filter = tags.map(t => `${t}:V`).join(' ') + ' *:S';
  const proc = spawnSync('adb', ['logcat', filter], { stdio: 'inherit', shell: true });
  process.exit(0);
}

// ── Test Doze ─────────────────────────────────────────────────────────────────
if (ARGS.includes('--doze-test')) {
  hdr('Simulación de ciclo Doze');
  warn('Desactivando WiFi y datos...');
  adb('shell svc wifi disable');
  adb('shell svc data disable');
  warn('Forzando modo Doze...');
  adb('shell dumpsys deviceidle force-idle');
  ok('Dispositivo en modo Doze. Envía una notificación ahora desde Firebase Console.');
  info('Monitorea con: adb logcat | grep -E "AlarmReceiver|FCM|EGChat"');
  info('Para salir del Doze: node debug-check.js --doze-restore');
  process.exit(0);
}

if (ARGS.includes('--doze-restore')) {
  adb('shell dumpsys deviceidle unforce');
  adb('shell svc wifi enable');
  adb('shell svc data enable');
  ok('Doze desactivado. WiFi y datos restaurados.');
  process.exit(0);
}

// ── Diagnóstico completo ──────────────────────────────────────────────────────

// 1. Plugin de notificaciones
hdr('1 · Plugin de notificaciones');

const pluginsJson = join(ROOT, 'android/app/src/main/assets/capacitor.plugins.json');
if (existsSync(pluginsJson)) {
  const plugins = JSON.parse(readFileSync(pluginsJson, 'utf8'));
  const hasPush = plugins.some(p => p.pkg?.includes('push-notifications'));
  const hasCall = plugins.some(p => p.pkg?.includes('call-screen'));
  hasPush ? ok('@capacitor/push-notifications registrado') : fail('@capacitor/push-notifications NO registrado → ejecuta: npx cap sync android');
  hasCall ? ok('call-screen registrado') : warn('call-screen NO registrado → ejecuta: npx cap sync android');
  info(`Total plugins: ${plugins.length}`);
} else {
  fail('capacitor.plugins.json no encontrado');
}

const logcatPush = adb('logcat -d -s "Capacitor" | findstr /i "PushNotifications"') ||
                   adb('logcat -d | grep -i "PushNotificationsPlugin" 2>/dev/null');
logcatPush ? ok('PushNotificationsPlugin visto en logcat') : warn('PushNotificationsPlugin no encontrado en logcat reciente');

// 2. google-services.json
hdr('2 · google-services.json');

const gsPath = join(ROOT, 'android/app/google-services.json');
if (existsSync(gsPath)) {
  ok('google-services.json encontrado en android/app/');
  const gs = JSON.parse(readFileSync(gsPath, 'utf8'));
  const projectId = gs.project_info?.project_id;
  const clients   = gs.client || [];
  const pkgMatch  = clients.some(c => c.client_info?.android_client_info?.package_name === PKG_ID);
  projectId ? ok(`project_id: ${projectId}`) : fail('project_id no encontrado en google-services.json');
  pkgMatch  ? ok(`package_name ${PKG_ID} encontrado`) : fail(`package_name ${PKG_ID} NO encontrado en google-services.json`);
} else {
  fail('google-services.json NO encontrado en android/app/');
  info('Descárgalo desde Firebase Console → Configuración del proyecto → General');
}

const fcmLog = adb('logcat -d | grep -i "FirebaseApp initialization"');
fcmLog?.includes('successful')
  ? ok('FirebaseApp inicializado correctamente')
  : warn('No se encontró "FirebaseApp initialization successful" en logcat');

// 3. Token FCM
hdr('3 · Token FCM del dispositivo');

const tokenLog = adb('logcat -d | grep -i "fcm_token\\|FCM.*token\\|Token FCM"');
if (tokenLog) {
  ok('Token FCM detectado en logcat');
  const match = tokenLog.match(/[A-Za-z0-9_\-:]{100,}/);
  if (match) info(`Token (primeros 40 chars): ${match[0].slice(0, 40)}...`);
} else {
  warn('Token FCM no encontrado en logcat reciente');
  info('Abre la app, inicia sesión y vuelve a ejecutar este diagnóstico');
}

// 4. Permisos
hdr('4 · Permisos de la app');

const perms = adb(`shell dumpsys package ${PKG_ID}`);
if (perms) {
  const checkPerm = (name, label) => {
    const line = perms.split('\n').find(l => l.includes(name));
    if (!line) { warn(`${label}: no encontrado`); return; }
    line.includes('granted=true') ? ok(`${label}: concedido`) : fail(`${label}: DENEGADO`);
  };
  checkPerm('POST_NOTIFICATIONS',    'POST_NOTIFICATIONS (Android 13+)');
  checkPerm('FOREGROUND_SERVICE',    'FOREGROUND_SERVICE');
  checkPerm('WAKE_LOCK',             'WAKE_LOCK');
  checkPerm('VIBRATE',               'VIBRATE');
  checkPerm('USE_FULL_SCREEN_INTENT','USE_FULL_SCREEN_INTENT');
  checkPerm('RECEIVE_BOOT_COMPLETED','RECEIVE_BOOT_COMPLETED');
} else {
  warn('No se pudo obtener información de permisos');
}

// 5. Doze / Batería
hdr('5 · Modo Doze y optimización de batería');

const whitelist = adb('shell dumpsys deviceidle whitelist');
whitelist?.includes(PKG_ID)
  ? ok(`${PKG_ID} está en la whitelist de Doze (no afectado)`)
  : warn(`${PKG_ID} NO está en la whitelist de Doze`);

const dozeState = adb('shell dumpsys deviceidle | grep "mState"');
dozeState ? info(`Estado Doze: ${dozeState.trim()}`) : info('Estado Doze: no disponible');

const alarms = adb(`shell dumpsys alarm | grep ${PKG_ID}`);
if (alarms) {
  const count = alarms.split('\n').filter(Boolean).length;
  ok(`${count} alarma(s) programada(s) para ${PKG_ID}`);
} else {
  info('No hay alarmas programadas actualmente (normal si no hay mensajes pendientes)');
}

// 6. Foreground Service
hdr('6 · Foreground Service VoIP');

const services = adb(`shell dumpsys activity services ${PKG_ID}`);
services?.includes('VoipForegroundService')
  ? ok('VoipForegroundService está activo')
  : info('VoipForegroundService no está activo (normal si no hay llamada en curso)');

// 7. Notificaciones activas
hdr('7 · Notificaciones activas');

const notifs = adb(`shell dumpsys notification | grep -A3 "${PKG_ID}"`);
if (notifs) {
  const count = (notifs.match(/NotificationRecord/g) || []).length;
  count > 0 ? ok(`${count} notificación(es) activa(s)`) : info('No hay notificaciones activas');
} else {
  info('No se pudo obtener información de notificaciones');
}

// ── Resumen ───────────────────────────────────────────────────────────────────
hdr('Comandos útiles de referencia rápida');

console.log(`
  ${B}Logcat en tiempo real:${X}
  ${D}node debug-check.js --logcat${X}

  ${B}Simular Doze:${X}
  ${D}node debug-check.js --doze-test${X}
  ${D}node debug-check.js --doze-restore${X}

  ${B}Abrir ajustes de la app:${X}
  ${D}adb shell am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d "package:${PKG_ID}"${X}

  ${B}Añadir a whitelist Doze:${X}
  ${D}adb shell dumpsys deviceidle whitelist +${PKG_ID}${X}

  ${B}Ver guía completa:${X}
  ${D}cat debug-guide.md${X}
`);
