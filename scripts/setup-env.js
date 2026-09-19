// Copia cada .env.example a .env si el .env aún no existe.
// Uso: node scripts/setup-env.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function findEnvExamples(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findEnvExamples(full));
    } else if (entry.name === '.env.example') {
      results.push(full);
    }
  }
  return results;
}

const examples = findEnvExamples(root);
let created = 0;

for (const examplePath of examples) {
  const envPath = examplePath.replace(/\.env\.example$/, '.env');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log(`Creado: ${path.relative(root, envPath)}`);
    created += 1;
  }
}

console.log(`\nListo. ${created} archivo(s) .env creado(s) a partir de .env.example.`);
