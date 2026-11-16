const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function verifyRelease(root, { exportDir, requireClean = false } = {}) {
  const reference = readJson(path.join(root, 'release-reference.json'));
  const config = readJson(path.join(root, 'app.json')).expo;
  const eas = readJson(path.join(root, 'eas.json'));
  const errors = [];
  if (config.extra?.eas?.projectId !== reference.projectId) errors.push('Proyecto EAS distinto de la referencia.');
  if (config.runtimeVersion !== reference.runtimeVersion) errors.push('Runtime distinto de la referencia.');
  if (eas.build?.testflight?.channel !== reference.channel) errors.push('Canal TestFlight distinto de la referencia.');

  for (const [name, hash] of Object.entries(reference.files)) {
    const file = path.resolve(root, name);
    if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error(`Ruta fuera del proyecto: ${name}`);
    if (!fs.existsSync(file)) errors.push(`Falta: ${name}`);
    else if (sha256(fs.readFileSync(file)) !== hash) errors.push(`Modificado respecto a la referencia: ${name}`);
  }

  const expectedRoutes = new Set(reference.bundledSources.filter(name => name.startsWith('app/')));
  function checkRoutes(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) checkRoutes(file);
      else if (/\.[jt]sx?$/.test(entry.name)) {
        const name = path.relative(root, file).split(path.sep).join('/');
        if (!expectedRoutes.has(name)) errors.push(`Ruta aún no incluida en la referencia: ${name}`);
      }
    }
  }
  if (fs.existsSync(path.join(root, 'app'))) checkRoutes(path.join(root, 'app'));

  if (exportDir) {
    const directory = path.resolve(root, exportDir);
    const metadata = readJson(path.join(directory, 'metadata.json'));
    const ios = metadata.fileMetadata?.ios;
    if (!ios?.bundle) errors.push('La exportación no contiene un bundle iOS.');
    else {
      const bundle = path.join(directory, ios.bundle);
      if (!fs.existsSync(bundle)) errors.push('Falta el archivo del bundle iOS.');
      else if (sha256(fs.readFileSync(bundle)) !== reference.ios.bundleSha256) errors.push('El bundle iOS no coincide con la referencia publicada.');
      const map = readJson(path.join(directory, `${ios.bundle}.map`));
      const sources = new Map(map.sources.map((name, i) => [name.replace(/^\//, ''), map.sourcesContent[i]]));
      for (const name of reference.bundledSources) {
        if (!sources.has(name)) errors.push(`No se empaquetó: ${name}`);
        else if (sha256(sources.get(name)) !== reference.files[name]) errors.push(`La exportación contiene otra versión: ${name}`);
      }
      const exportedAssets = new Set((ios.assets ?? []).map(asset => asset.path));
      for (const [name, hash] of Object.entries(reference.ios.assets)) {
        const asset = path.join(directory, name);
        if (!exportedAssets.has(name) || !fs.existsSync(asset)) errors.push(`Asset exportado ausente: ${name}`);
        else if (sha256(fs.readFileSync(asset)) !== hash) errors.push(`Asset exportado modificado: ${name}`);
      }
    }
  }

  if (requireClean) {
    const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    if (git(['branch', '--show-current']) !== reference.branch) errors.push(`La entrega debe salir de ${reference.branch}.`);
    if (git(['status', '--porcelain', '--untracked-files=normal'])) errors.push('Hay cambios sin guardar en Git; no publicar ni compilar.');
  }
  return { errors, files: Object.keys(reference.files).length, sources: reference.bundledSources.length };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    let exportDir;
    let requireClean = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--require-clean') requireClean = true;
      else if (args[i] === '--export' && args[i + 1]) exportDir = args[++i];
      else throw new Error('Uso: node scripts/verify-release.cjs [--require-clean] [--export directorio]');
    }
    const result = verifyRelease(path.resolve(__dirname, '..'), { exportDir, requireClean });
    if (result.errors.length) {
      console.error(result.errors.join('\n'));
      console.error('Entrega bloqueada: revisar los cambios y aprobar una nueva referencia antes de publicar.');
      process.exitCode = 1;
    } else console.log(`Referencia verificada: ${result.files} archivos, ${result.sources} fuentes publicadas.`);
  } catch (error) {
    console.error(`No se pudo verificar la entrega: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { verifyRelease };
