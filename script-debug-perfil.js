// Script para debugar e corrigir o perfil do usuário
// Este script deve ser executado no console do navegador

(function() {
  console.log('🔍 Iniciando debug do perfil do usuário...');

  // Função para obter o token do Supabase
  function getSupabaseToken() {
    try {
      // Procurar token no localStorage
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.includes('supabase') && key.includes('access_token')) {
          const tokenData = localStorage.getItem(key);
          if (tokenData) {
            try {
              const parsed = JSON.parse(tokenData);
              return parsed.access_token;
            } catch (e) {
              // Ignorar erros de parse
            }
          }
        }
      }
      return null;
    } catch (err) {
      console.error('Erro ao obter token:', err);
      return null;
    }
  }

  // Função para fazer requisição ao Supabase
  async function supabaseRequest(endpoint, method = 'GET', body = null) {
    const token = getSupabaseToken();
    if (!token) {
      console.error('❌ Token do Supabase não encontrado');
      return null;
    }

    const url = 'https://wdqtueefgwwkxelhaajr.supabase.co/rest/v1/' + endpoint;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTczODIzNzY5MywiZXhwIjoxMDU5MzU5MzY5Mywib3JpZ2luIjoiaHR0cHM6Ly93ZHF0dWVlZmd3d2t4ZWxoYWFqci5zdXBhYmFzZS5jb20iLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImFub24iLCJpc19hbm9uIjpmYWxzZSwiZW1haWwiOiJqdWFuLnJlaXNAYnJtYXJpbmFzLmNvbS5iciIsInBob25lIjoiIiwiYXVkIjoicG9zdGdyZXMiLCJhdXRoX2lkIjoiZjM2ZjM5ZjAtZjM2ZC00ZjM5LWI5ZjAtMzI5ZjM5ZjA2ZjM5Iiwic2Vzc2lvbl9pZCI6IjM2ZjM5ZjAtZjM2ZC00ZjM5LWI5ZjAtMzI5ZjM5ZjA2ZjM5In0.0000000000000000000000000000000000000000000000000000000000000000',
      'Prefer': 'return=representation'
    };

    const config = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('❌ Erro na requisição ao Supabase:', err);
      return null;
    }
  }

  // Função principal de debug
  async function debugPerfil() {
    console.log('🔍 Buscando informações do usuário...');

    // Obter informações do usuário atual
    const token = getSupabaseToken();
    if (!token) {
      console.error('❌ Não foi possível obter token do Supabase');
      console.log('💡 Dica: Faça login novamente e tente este script');
      return;
    }

    try {
      // Decodificar token para obter user_id
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.sub;
        console.log('👤 User ID:', userId);

        // Buscar perfil do usuário
        const perfil = await supabaseRequest(`user_profiles?id=eq.${userId}`);
        console.log('📋 Perfil encontrado:', perfil);

        if (perfil && perfil.length > 0) {
          const userPerfil = perfil[0];
          console.log('🔍 Informações do perfil:');
          console.log('  - ID:', userPerfil.id);
          console.log('  - Nome:', userPerfil.nome);
          console.log('  - Empresa ID:', userPerfil.empresa_id);
          console.log('  - Role:', userPerfil.role);
          console.log('  - Created At:', userPerfil.created_at);

          // Verificar se o role está correto
          if (userPerfil.role === 'owner') {
            console.log('✅ Perfil já está configurado corretamente como owner');
          } else if (userPerfil.role === 'admin') {
            console.log('⚠️ Perfil está como admin, mas você disse que é dono');
            console.log('💡 Deseja atualizar para owner? Execute: updateRoleToOwner()');
          } else if (userPerfil.role === 'user') {
            console.log('⚠️ Perfil está como user, mas você disse que é dono');
            console.log('💡 Deseja atualizar para owner? Execute: updateRoleToOwner()');
          } else {
            console.log('⚠️ Role desconhecido ou nulo');
            console.log('💡 Deseja atualizar para owner? Execute: updateRoleToOwner()');
          }
        } else {
          console.log('❌ Perfil não encontrado na tabela user_profiles');
          console.log('💡 Deseja criar um perfil? Execute: createProfile()');
        }
      } else {
        console.error('❌ Token inválido');
      }
    } catch (err) {
      console.error('❌ Erro ao debugar perfil:', err);
    }
  }

  // Função para atualizar role para owner
  async function updateRoleToOwner() {
    console.log('🔧 Atualizando role para owner...');

    const token = getSupabaseToken();
    if (!token) {
      console.error('❌ Token não encontrado');
      return;
    }

    try {
      // Decodificar token para obter user_id
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.sub;

      // Atualizar role para owner
      const result = await supabaseRequest(`user_profiles?id=eq.${userId}`, 'PATCH', {
        role: 'owner'
      });

      if (result) {
        console.log('✅ Role atualizado para owner com sucesso!');
        console.log('💡 Faça logout e login novamente para ver as alterações');
      } else {
        console.error('❌ Falha ao atualizar role');
      }
    } catch (err) {
      console.error('❌ Erro ao atualizar role:', err);
    }
  }

  // Função para criar perfil
  async function createProfile() {
    console.log('➕ Criando perfil...');

    const token = getSupabaseToken();
    if (!token) {
      console.error('❌ Token não encontrado');
      return;
    }

    try {
      // Decodificar token para obter user_id
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.sub;

      // Criar perfil com role owner
      const result = await supabaseRequest('user_profiles', 'POST', {
        id: userId,
        nome: 'Super Admin BR Marinas',
        empresa_id: 'br_marinas',
        role: 'owner'
      });

      if (result) {
        console.log('✅ Perfil criado com sucesso!');
        console.log('💡 Faça logout e login novamente para ver as alterações');
      } else {
        console.error('❌ Falha ao criar perfil');
      }
    } catch (err) {
      console.error('❌ Erro ao criar perfil:', err);
    }
  }

  // Expor funções globais
  window.debugPerfil = debugPerfil;
  window.updateRoleToOwner = updateRoleToOwner;
  window.createProfile = createProfile;

  // Iniciar debug automaticamente
  debugPerfil();

  console.log('💡 Funções disponíveis no console:');
  console.log('  - debugPerfil() - Debugar perfil atual');
  console.log('  - updateRoleToOwner() - Atualizar role para owner');
  console.log('  - createProfile() - Criar perfil com role owner');
})();