const fs = require('fs');
const zlib = require('zlib');
const buf = fs.readFileSync('build-log3.txt');
const txt = zlib.brotliDecompressSync(buf).toString('utf8');
fs.writeFileSync('build-log3.txt.decoded.txt', txt);
const re = /error|failed|exception|bundle|JavaScript|React|Syntax/i;
const lines = txt.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  if (re.test(lines[i])) {
    const start = Math.max(0, i - 3);
    const end = Math.min(lines.length, i + 4);
    console.log('---' + i + '---');
    console.log(lines.slice(start, end).join('\n'));
  }
}
