// Script para gerar versão baseada em commits
// Executar: node scripts/generate-version.js

const { execSync } = require('child_process');

// Contar commits
const commits = parseInt(execSync('git rev-list --count HEAD').toString().trim());

// Calcular versão
const major = Math.floor(commits / 20);
const minor = Math.floor((commits % 20) / 10);
const patch = commits % 10;

const version = `${major}.${minor}.${patch}`;

console.log(`Commits: ${commits}`);
console.log(`Versão: ${version}`);

// Gerar arquivo de configuração
const fs = require('fs');
const config = `// Auto-generated version
export const APP_VERSION = '${version}';
export const COMMIT_COUNT = ${commits};
`;

fs.writeFileSync('./src/lib/version.ts', config);
console.log('Arquivo src/lib/version.ts gerado!');
