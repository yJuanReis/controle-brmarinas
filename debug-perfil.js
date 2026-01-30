// Script de debug para identificar o problema com o role do perfil
// Este script simula a lógica de verificação do role

function debugPerfil() {
  console.log('🔍 Debug do perfil do usuário\n');

  // Simular diferentes cenários de perfil
  const perfis = [
    {
      nome: 'Admin Teste',
      role: 'admin',
      empresa_id: 'gloria'
    },
    {
      nome: 'Owner Teste',
      role: 'owner',
      empresa_id: 'br_marinas'
    },
    {
      nome: 'User Teste',
      role: 'user',
      empresa_id: 'gloria'
    },
    {
      nome: 'Perfil sem role',
      role: undefined,
      empresa_id: 'gloria'
    },
    {
      nome: 'Perfil com role inválido',
      role: 'invalido',
      empresa_id: 'gloria'
    }
  ];

  perfis.forEach((perfil, index) => {
    console.log(`Teste ${index + 1}: ${perfil.nome}`);
    console.log(`  - Role: ${perfil.role || 'undefined'}`);
    
    // Verificar se pode ver Admin no Header
    const podeVerAdmin = perfil.role === 'admin' || perfil.role === 'owner';
    console.log(`  - Pode ver Admin no Header: ${podeVerAdmin ? '✅ SIM' : '❌ NÃO'}`);
    
    // Verificar se pode acessar AdminPanel
    const podeAcessarAdminPanel = perfil.role === 'admin' || perfil.role === 'owner';
    console.log(`  - Pode acessar AdminPanel: ${podeAcessarAdminPanel ? '✅ SIM' : '❌ NÃO'}`);
    
    // Verificar se é considerado autenticado
    const isAuthenticated = !!perfil.role;
    console.log(`  - É considerado autenticado: ${isAuthenticated ? '✅ SIM' : '❌ NÃO'}`);
    
    console.log('');
  });

  console.log('📋 Possíveis causas do problema:');
  console.log('1. O role do seu perfil pode estar como "user" em vez de "owner"');
  console.log('2. O perfil pode não estar sendo carregado do banco de dados');
  console.log('3. O role pode estar undefined ou null');
  console.log('4. Pode haver um problema na tabela user_profiles no Supabase');
  
  console.log('\n🔧 Soluções:');
  console.log('1. Verifique o console do navegador para ver os logs do MarinaContext');
  console.log('2. Confira se o role está correto na tabela user_profiles');
  console.log('3. Tente fazer logout e login novamente');
  console.log('4. Se necessário, atualize o role manualmente no Supabase Dashboard');
}

debugPerfil();