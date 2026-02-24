// Script para gerar versão baseada em commits
// Executar: node scripts/generate-version.js

const { execSync } = require('child_process');
const fs = require('fs');

let commits = 0;

try {
  // Tentar usar git para contar commits (funciona localmente)
  commits = parseInt(execSync('git rev-list --count HEAD').toString().trim());
} catch (error) {
  // Se falhar (ambiente Vercel), ler do arquivo existente e incrementar
  console.log('Git não disponível, lendo versão existente...');
  try {
    const existingVersion = fs.readFileSync('./src/lib/version.ts', 'utf8');
    const match = existingVersion.match(/COMMIT_COUNT = (\d+)/);
    if (match) {
      commits = parseInt(match[1]) + 1;
      console.log(`Incrementando versão de ${match[1]} para ${commits}...`);
    }
  } catch (e) {
    commits = 43; // Valor padrão se não conseguir ler
    console.log('Usando valor padrão: 43');
  }
}

// Calcular versão
const major = Math.floor(commits / 20);
const minor = Math.floor((commits % 20) / 10);
const patch = commits % 10;

const version = `${major}.${minor}.${patch}`;

console.log(`Commits: ${commits}`);
console.log(`Versão: ${version}`);

// Gerar arquivo de configuração
const config = `// Auto-generated version
export const APP_VERSION = '${version}';
export const COMMIT_COUNT = ${commits};
`;

fs.writeFileSync('./src/lib/version.ts', config);
console.log('Arquivo src/lib/version.ts gerado!');
