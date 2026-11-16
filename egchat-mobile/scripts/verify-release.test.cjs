const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyRelease } = require('./verify-release.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'egchat-release-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'app'));
  fs.mkdirSync(path.join(root, 'assets'));
  const files = { 'index.ts': "import 'expo-router/entry';\n", 'app/legal.tsx': 'export default function Legal() {}\n', 'assets/logo.png': 'test-logo' };
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(root, name), text);
  const hashes = Object.fromEntries(Object.entries(files).map(([name, text]) => [name, crypto.createHash('sha256').update(text).digest('hex')]));
  fs.writeFileSync(path.join(root, 'release-reference.json'), JSON.stringify({ branch: 'release/testflight', projectId: 'test-project', runtimeVersion: '1.0.0', channel: 'testflight', files: hashes, bundledSources: ['index.ts', 'app/legal.tsx'], ios: { bundleSha256: crypto.createHash('sha256').update('test-bundle').digest('hex'), assets: {} } }));
  fs.writeFileSync(path.join(root, 'app.json'), JSON.stringify({ expo: { runtimeVersion: '1.0.0', extra: { eas: { projectId: 'test-project' } } } }));
  fs.writeFileSync(path.join(root, 'eas.json'), JSON.stringify({ build: { testflight: { channel: 'testflight' } } }));
  return { root, files };
}

function exportFixture(root, files) {
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist/index.hbc'), 'test-bundle');
  fs.writeFileSync(path.join(root, 'dist/metadata.json'), JSON.stringify({ fileMetadata: { ios: { bundle: 'index.hbc', assets: [] } } }));
  const map = { sources: ['/index.ts', '/app/legal.tsx'], sourcesContent: [files['index.ts'], files['app/legal.tsx']] };
  fs.writeFileSync(path.join(root, 'dist/index.hbc.map'), JSON.stringify(map));
  return map;
}

test('acepta la referencia intacta', t => {
  const { root } = fixture(t);
  assert.deepEqual(verifyRelease(root).errors, []);
});
test('rechaza una mejora eliminada', t => {
  const { root } = fixture(t);
  fs.unlinkSync(path.join(root, 'app/legal.tsx'));
  assert.ok(verifyRelease(root).errors.some(error => error === 'Falta: app/legal.tsx'));
});
test('rechaza una versión vieja de una pantalla', t => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, 'app/legal.tsx'), 'old version');
  assert.ok(verifyRelease(root).errors.some(error => error.includes('Modificado')));
});
test('rechaza la entrada temporal de pruebas', t => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, 'index.ts'), "import './.qa-group-cover';");
  assert.ok(verifyRelease(root).errors.some(error => error.includes('index.ts')));
});
test('rechaza un asset perdido', t => {
  const { root } = fixture(t);
  fs.unlinkSync(path.join(root, 'assets/logo.png'));
  assert.ok(verifyRelease(root).errors.some(error => error.includes('assets/logo.png')));
});
test('detecta rutas nuevas aún no verificadas', t => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, 'app/new.tsx'), 'new route');
  assert.ok(verifyRelease(root).errors.some(error => error.includes('Ruta aún no incluida')));
});
test('rechaza otro proyecto o runtime', t => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, 'app.json'), JSON.stringify({ expo: { runtimeVersion: '2.0.0', extra: { eas: { projectId: 'wrong-project' } } } }));
  assert.equal(verifyRelease(root).errors.length, 2);
});
test('rechaza otro canal', t => {
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, 'eas.json'), JSON.stringify({ build: { testflight: { channel: 'production' } } }));
  assert.ok(verifyRelease(root).errors.some(error => error.includes('Canal')));
});
for (const name of ['app.json', 'eas.json']) {
  test(`rechaza cambios de configuración en ${name} aunque conserve proyecto y canal`, t => {
    const { root } = fixture(t);
    const referenceFile = path.join(root, 'release-reference.json');
    const reference = JSON.parse(fs.readFileSync(referenceFile, 'utf8'));
    const configFile = path.join(root, name);
    reference.files[name] = crypto.createHash('sha256').update(fs.readFileSync(configFile)).digest('hex');
    fs.writeFileSync(referenceFile, JSON.stringify(reference));
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    if (name === 'app.json') config.expo.updates = { enabled: false };
    else config.build.testflight.env = { EXPO_PUBLIC_API_URL: 'http://127.0.0.1:59996' };
    fs.writeFileSync(configFile, JSON.stringify(config));
    assert.ok(verifyRelease(root).errors.includes(`Modificado respecto a la referencia: ${name}`));
  });
}

test('acepta un mapa que contiene todas las fuentes', t => {
  const { root, files } = fixture(t);
  exportFixture(root, files);
  assert.deepEqual(verifyRelease(root, { exportDir: 'dist' }).errors, []);
});
test('rechaza una exportación sin rutas de la app', t => {
  const { root, files } = fixture(t);
  const map = exportFixture(root, files);
  map.sources = []; map.sourcesContent = [];
  fs.writeFileSync(path.join(root, 'dist/index.hbc.map'), JSON.stringify(map));
  assert.equal(verifyRelease(root, { exportDir: 'dist' }).errors.filter(error => error.includes('No se empaquetó')).length, 2);
});
test('rechaza fuentes exportadas desde otra copia', t => {
  const { root, files } = fixture(t);
  const map = exportFixture(root, files);
  map.sourcesContent[1] = 'outdated route';
  fs.writeFileSync(path.join(root, 'dist/index.hbc.map'), JSON.stringify(map));
  assert.ok(verifyRelease(root, { exportDir: 'dist' }).errors.some(error => error.includes('otra versión')));
});
test('rechaza otro bundle aunque su mapa sea correcto', t => {
  const { root, files } = fixture(t);
  exportFixture(root, files);
  fs.writeFileSync(path.join(root, 'dist/index.hbc'), 'another-bundle');
  assert.ok(verifyRelease(root, { exportDir: 'dist' }).errors.some(error => error.includes('bundle iOS no coincide')));
});
test('detecta assets omitidos de los metadatos', t => {
  const { root, files } = fixture(t);
  exportFixture(root, files);
  const file = path.join(root, 'release-reference.json');
  const reference = JSON.parse(fs.readFileSync(file, 'utf8'));
  reference.ios.assets['assets/logo.png'] = reference.files['assets/logo.png'];
  fs.writeFileSync(file, JSON.stringify(reference));
  assert.ok(verifyRelease(root, { exportDir: 'dist' }).errors.some(error => error.includes('Asset exportado ausente')));
});
