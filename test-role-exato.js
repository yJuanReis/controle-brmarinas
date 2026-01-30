#!/usr/bin/env node

console.log('🔍 Testando valor exato do role');

// Testar diferentes valores de role
const testes = [
  { role: 'owner', descricao: 'Role exato "owner"' },
  { role: 'owner ', descricao: 'Role com espaço "owner "' },
  { role: ' owner', descricao: 'Role com espaço no início " owner"' },
  { role: 'OWNER', descricao: 'Role em maiúsculo "OWNER"' },
  { role: 'Owner', descricao: 'Role capitalizado "Owner"' },
  { role: 'admin', descricao: 'Role "admin"' },
  { role: 'user', descricao: 'Role "user"' },
  { role: undefined, descricao: 'Role undefined' },
  { role: null, descricao: 'Role null' },
  { role: '', descricao: 'Role vazio ""' },
  { role: '  ', descricao: 'Role com espaços "  "' },
];

testes.forEach((teste, index) => {
  const podeVerAdmin = teste.role === 'admin' || teste.role === 'owner';
  const ehOwner = teste.role === 'owner';
  const ehAdmin = teste.role === 'admin';
  
  console.log(`\nTeste ${index + 1}: ${teste.descricao}`);
  console.log(`  - Role: ${JSON.stringify(teste.role)}`);
  console.log(`  - Tipo: ${typeof teste.role}`);
  console.log(`  - Comprimento: ${teste.role ? teste.role.length : 'N/A'}`);
  console.log(`  - ehOwner: ${ehOwner}`);
  console.log(`  - ehAdmin: ${ehAdmin}`);
  console.log(`  - podeVerAdmin: ${podeVerAdmin}`);
  
  if (teste.role && typeof teste.role === 'string') {
    console.log(`  - Trimmed: "${teste.role.trim()}"`);
    console.log(`  - Lowercase: "${teste.role.toLowerCase()}"`);
    console.log(`  - Uppercase: "${teste.role.toUpperCase()}"`);
  }
});

console.log('\n🎯 Conclusão:');
console.log('Para que o botão Admin apareça, o role deve ser exatamente:');
console.log('- "owner" (minúsculo, sem espaços)');
console.log('- "admin" (minúsculo, sem espaços)');
console.log('\nSe o seu role for diferente disso, será necessário corrigir no banco de dados.');