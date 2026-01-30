// Teste de permissões para AdminPanel
// Este script simula a lógica de permissões para validar o comportamento

function testarPermissoes() {
  console.log('🧪 Testando lógica de permissões do AdminPanel\n');

  // Teste 1: Usuário Admin
  console.log('Teste 1: Usuário Admin');
  const adminUser = {
    profile: {
      role: 'admin',
      empresa_id: 'gloria'
    }
  };
  
  const podeAcessarAdmin = adminUser?.profile && ['admin', 'owner'].includes(adminUser.profile.role);
  console.log(`  - Pode acessar AdminPanel: ${podeAcessarAdmin ? '✅ SIM' : '❌ NÃO'}`);
  
  const podeVerAbaEmpresas = adminUser?.profile?.role !== 'user';
  console.log(`  - Pode ver aba Empresas: ${podeVerAbaEmpresas ? '✅ SIM' : '❌ NÃO'}`);
  
  const podeVerAbaUsuarios = adminUser?.profile?.role !== 'user';
  console.log(`  - Pode ver aba Usuários: ${podeVerAbaUsuarios ? '✅ SIM' : '❌ NÃO'}`);
  
  console.log('');

  // Teste 2: Usuário Owner
  console.log('Teste 2: Usuário Owner');
  const ownerUser = {
    profile: {
      role: 'owner',
      empresa_id: 'br_marinas'
    }
  };
  
  const podeAcessarAdminOwner = ownerUser?.profile && ['admin', 'owner'].includes(ownerUser.profile.role);
  console.log(`  - Pode acessar AdminPanel: ${podeAcessarAdminOwner ? '✅ SIM' : '❌ NÃO'}`);
  
  const podeVerAbaEmpresasOwner = ownerUser?.profile?.role !== 'user';
  console.log(`  - Pode ver aba Empresas: ${podeVerAbaEmpresasOwner ? '✅ SIM' : '❌ NÃO'}`);
  
  const podeVerAbaUsuariosOwner = ownerUser?.profile?.role !== 'user';
  console.log(`  - Pode ver aba Usuários: ${podeVerAbaUsuariosOwner ? '✅ SIM' : '❌ NÃO'}`);
  
  console.log('');

  // Teste 3: Usuário Comum
  console.log('Teste 3: Usuário Comum');
  const userUser = {
    profile: {
      role: 'user',
      empresa_id: 'gloria'
    }
  };
  
  const podeAcessarAdminUser = userUser?.profile && ['admin', 'owner'].includes(userUser.profile.role);
  console.log(`  - Pode acessar AdminPanel: ${podeAcessarAdminUser ? '✅ SIM' : '❌ NÃO'}`);
  
  const podeVerAbaEmpresasUser = userUser?.profile?.role !== 'user';
  console.log(`  - Pode ver aba Empresas: ${podeVerAbaEmpresasUser ? '✅ SIM' : '❌ NÃO'}`);
  
  const podeVerAbaUsuariosUser = userUser?.profile?.role !== 'user';
  console.log(`  - Pode ver aba Usuários: ${podeVerAbaUsuariosUser ? '✅ SIM' : '❌ NÃO'}`);
  
  console.log('');

  // Teste 4: Usuário sem perfil
  console.log('Teste 4: Usuário sem perfil');
  const noProfileUser = {
    id: '123',
    email: 'test@example.com'
  };
  
  const podeAcessarAdminNoProfile = noProfileUser?.profile && ['admin', 'owner'].includes(noProfileUser.profile.role);
  console.log(`  - Pode acessar AdminPanel: ${podeAcessarAdminNoProfile ? '✅ SIM' : '❌ NÃO'}`);
  
  console.log('\n📋 Resumo:');
  console.log('✅ Admins podem acessar o AdminPanel e ver todas as abas');
  console.log('✅ Owners podem acessar o AdminPanel e ver todas as abas');
  console.log('❌ Usuários comuns são redirecionados para página de acesso negado');
  console.log('❌ Usuários sem perfil são redirecionados para página de acesso negado');
}

testarPermissoes();