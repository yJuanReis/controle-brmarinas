// Teste de exibição do botão Admin no Header
// Este script simula a lógica de exibição do botão Admin

function testarExibicaoAdmin() {
  console.log('🧪 Testando lógica de exibição do botão Admin no Header\n');

  // Teste 1: Usuário Admin
  console.log('Teste 1: Usuário Admin');
  const adminUser = {
    profile: {
      role: 'admin',
      empresa_id: 'gloria'
    }
  };
  
  const podeVerAdminAdmin = adminUser?.profile?.role === 'admin' || adminUser?.profile?.role === 'owner';
  console.log(`  - podeVerAdmin: ${podeVerAdminAdmin ? '✅ true' : '❌ false'}`);
  
  const navItemsAdmin = [
    { href: '/', label: 'Painel', icon: 'LayoutDashboard' },
    { href: '/historico', label: 'Histórico', icon: 'History' },
    { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
    ...(podeVerAdminAdmin ? [{ href: '/admin', label: 'Admin', icon: 'Settings' }] : []),
  ];
  
  console.log(`  - NavItems: ${JSON.stringify(navItemsAdmin, null, 2)}`);
  console.log(`  - Botão Admin aparece: ${navItemsAdmin.some(item => item.href === '/admin') ? '✅ SIM' : '❌ NÃO'}\n`);

  // Teste 2: Usuário Owner
  console.log('Teste 2: Usuário Owner');
  const ownerUser = {
    profile: {
      role: 'owner',
      empresa_id: 'br_marinas'
    }
  };
  
  const podeVerAdminOwner = ownerUser?.profile?.role === 'admin' || ownerUser?.profile?.role === 'owner';
  console.log(`  - podeVerAdmin: ${podeVerAdminOwner ? '✅ true' : '❌ false'}`);
  
  const navItemsOwner = [
    { href: '/', label: 'Painel', icon: 'LayoutDashboard' },
    { href: '/historico', label: 'Histórico', icon: 'History' },
    { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
    ...(podeVerAdminOwner ? [{ href: '/admin', label: 'Admin', icon: 'Settings' }] : []),
  ];
  
  console.log(`  - NavItems: ${JSON.stringify(navItemsOwner, null, 2)}`);
  console.log(`  - Botão Admin aparece: ${navItemsOwner.some(item => item.href === '/admin') ? '✅ SIM' : '❌ NÃO'}\n`);

  // Teste 3: Usuário Comum
  console.log('Teste 3: Usuário Comum');
  const userUser = {
    profile: {
      role: 'user',
      empresa_id: 'gloria'
    }
  };
  
  const podeVerAdminUser = userUser?.profile?.role === 'admin' || userUser?.profile?.role === 'owner';
  console.log(`  - podeVerAdmin: ${podeVerAdminUser ? '✅ true' : '❌ false'}`);
  
  const navItemsUser = [
    { href: '/', label: 'Painel', icon: 'LayoutDashboard' },
    { href: '/historico', label: 'Histórico', icon: 'History' },
    { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
    ...(podeVerAdminUser ? [{ href: '/admin', label: 'Admin', icon: 'Settings' }] : []),
  ];
  
  console.log(`  - NavItems: ${JSON.stringify(navItemsUser, null, 2)}`);
  console.log(`  - Botão Admin aparece: ${navItemsUser.some(item => item.href === '/admin') ? '✅ SIM' : '❌ NÃO'}\n`);

  // Teste 4: Usuário sem perfil
  console.log('Teste 4: Usuário sem perfil');
  const noProfileUser = {
    id: '123',
    email: 'test@example.com'
  };
  
  const podeVerAdminNoProfile = noProfileUser?.profile?.role === 'admin' || noProfileUser?.profile?.role === 'owner';
  console.log(`  - podeVerAdmin: ${podeVerAdminNoProfile ? '✅ true' : '❌ false'}`);
  
  const navItemsNoProfile = [
    { href: '/', label: 'Painel', icon: 'LayoutDashboard' },
    { href: '/historico', label: 'Histórico', icon: 'History' },
    { href: '/pessoas', label: 'Pessoas', icon: 'Users' },
    ...(podeVerAdminNoProfile ? [{ href: '/admin', label: 'Admin', icon: 'Settings' }] : []),
  ];
  
  console.log(`  - NavItems: ${JSON.stringify(navItemsNoProfile, null, 2)}`);
  console.log(`  - Botão Admin aparece: ${navItemsNoProfile.some(item => item.href === '/admin') ? '✅ SIM' : '❌ NÃO'}\n`);

  console.log('📋 Resumo:');
  console.log('✅ Admins veem o botão Admin no Header');
  console.log('✅ Owners veem o botão Admin no Header');
  console.log('❌ Usuários comuns não veem o botão Admin no Header');
  console.log('❌ Usuários sem perfil não veem o botão Admin no Header');
}

testarExibicaoAdmin();