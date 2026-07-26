const fs = require('node:fs');
const path = require('node:path');

const dist = path.resolve(__dirname, '..', 'dist');
const main = path.join(dist, 'main.js');
const legacyMain = path.join(dist, 'src', 'main.js');

if (!fs.existsSync(main) && !fs.existsSync(legacyMain)) {
  throw new Error('Build inválido: nenhum arquivo de entrada da API foi gerado.');
}

if (!fs.existsSync(main)) {
  fs.writeFileSync(main, "require('./src/main.js');\n", 'utf8');
}

if (!fs.existsSync(legacyMain)) {
  fs.mkdirSync(path.dirname(legacyMain), { recursive: true });
  fs.writeFileSync(legacyMain, "require('../main.js');\n", 'utf8');
}

console.log('Entradas de produção validadas: dist/main.js e dist/src/main.js');
