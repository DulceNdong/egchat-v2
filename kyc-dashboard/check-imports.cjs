const fs   = require('fs');
const path = require('path');

function findFiles(dir, exts) {
  const results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) results.push(...findFiles(full, exts));
    else if (exts.some(e => full.endsWith(e))) results.push(full);
  }
  return results;
}

const srcDir = './src';
const files  = findFiles(srcDir, ['.ts', '.tsx']);
let errors   = 0;
let checked  = 0;

for (const file of files) {
  const content  = fs.readFileSync(file, 'utf8');
  const imports  = [...content.matchAll(/from\s+'(@\/[^']+)'/g)];
  for (const [, imp] of imports) {
    const rel = imp.replace('@/', './src/');
    const candidates = [rel, rel+'.ts', rel+'.tsx', rel+'/index.ts', rel+'/index.tsx'];
    const exists = candidates.some(c => fs.existsSync(c));
    if (!exists) {
      console.log('NO_FOUND:', path.relative('.', file), '->', imp);
      errors++;
    }
    checked++;
  }
}

if (errors === 0) {
  console.log('ALL_OK: ' + files.length + ' files / ' + checked + ' imports');
} else {
  console.log('ERRORS: ' + errors);
  process.exit(1);
}
