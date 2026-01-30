import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/hooks/useAuth';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingUserId = useRef<string | null>(null);

  // Carregar perfil do usuário atual
  const loadProfile = async (userId: string) => {
    console.log('[Profile] loadProfile chamado para:', userId);

    // Verificar se já está carregando o mesmo userId
    if (loading && loadingUserId.current === userId) {
      console.log('[Profile] Já está carregando perfil para o mesmo userId, retornando imediatamente');
      return null;
    }

    try {
      setLoading(true);
      loadingUserId.current = userId;

      console.log('[Profile] Fazendo query na tabela user_profiles...');

      // Criar um timeout curto para liberar UI rapidamente (fallback para metadata)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 2 seconds')), 2000);
      });

      const queryPromise = supabase
        .from('user_profiles')
        .select('id, nome, empresa_id, role, created_at')
        .eq('id', userId)
        .maybeSingle();

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      console.log('[Profile] Query completada, processando resultado...');

      if (error) {
        console.error('[Profile] Erro ao carregar perfil:', error);
        console.log('[Profile] Detalhes do erro:', error.message, error.code);

        // Se for erro de política RLS ou recursão, tentar uma abordagem alternativa
        if (error.message && error.message.includes('infinite recursion')) {
          console.log('[Profile] Detectada recursão infinita, tentando abordagem alternativa via RPC...');
          
          // Tentar carregar via RPC function que não tem RLS
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile', { user_id: userId });
            
            if (!rpcError && rpcData) {
              console.log('[Profile] Perfil carregado via RPC:', rpcData);
              const userProfile: UserProfile = {
                id: rpcData.id,
                nome: rpcData.nome,
                empresa_id: rpcData.empresa_id,
                role: rpcData.role as 'user' | 'admin' | 'owner',
                created_at: rpcData.created_at
              };
              setProfile(userProfile);
              return userProfile;
            }
          } catch (rpcErr) {
            console.log('[Profile] RPC não disponível, usando fallback...');
          }
          
          return null;
        }

        // Para outros erros, continuar normalmente
        if (error.code === 'PGRST116') {
          console.log('[Profile] Usuário não tem perfil criado ainda');
          return null;
        }
        return null;
      }

      // Se data for null, significa que não encontrou o perfil
      if (!data) {
        console.log('[Profile] Nenhum perfil encontrado para o usuário');
        return null;
      }

      console.log('[Profile] Dados do perfil recebidos:', data);

      const userProfile: UserProfile = {
        id: data.id,
        nome: data.nome,
        empresa_id: data.empresa_id,
        role: data.role as 'user' | 'admin' | 'owner',
        created_at: data.created_at
      };

      console.log('[Profile] Perfil criado:', userProfile);
      setProfile(userProfile);
      return userProfile;
    } catch (err: any) {
      console.error('[Profile] Erro inesperado ao carregar perfil:', err);

      // Se for timeout, retornar null para permitir continuação
      if (err.message && err.message.includes('Query timeout')) {
        console.log('[Profile] Query timeout - retornando null para evitar travamento');
        return null;
      }

      return null;
    } finally {
      console.log('[Profile] Finalizando loadProfile, setLoading(false)');
      setLoading(false);
      loadingUserId.current = null;
    }
  };

  // Atualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return null;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          nome: updates.nome,
          empresa_id: updates.empresa_id,
          role: updates.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      const updatedProfile: UserProfile = {
        id: data.id,
        nome: data.nome,
        empresa_id: data.empresa_id,
        role: data.role as 'user' | 'admin' | 'owner',
        created_at: data.created_at
      };

      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      throw err;
    }
  };

  // Criar perfil (usado durante signup)
  const createProfile = async (userId: string, profileData: Omit<UserProfile, 'id' | 'created_at'>) => {
    try {
      console.log('[Profile] 📝 createProfile chamado para:', userId);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          nome: profileData.nome,
          empresa_id: profileData.empresa_id,
          role: profileData.role
        })
        .select()
        .single();

      if (error) {
        console.error('[Profile] ❌ Erro ao inserir perfil:', error);
        throw error;
      }

      if (!data) {
        console.error('[Profile] ❌ Nenhum dado retornado após inserção');
        throw new Error('Nenhum dado retornado após criar perfil');
      }

      console.log('[Profile] ✅ Perfil criado com sucesso:', data.id);

      const newProfile: UserProfile = {
        id: data.id,
        nome: data.nome,
        empresa_id: data.empresa_id,
        role: data.role as 'user' | 'admin' | 'owner',
        created_at: data.created_at
      };

      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      console.error('[Profile] ❌ Erro ao criar perfil:', err);
      
      // Log detalhado do erro
      if (err.code) {
        console.error('[Profile] Código de erro:', err.code);
      }
      if (err.message) {
        console.error('[Profile] Mensagem de erro:', err.message);
      }
      
      // Re-lançar o erro para tratamento na camada superior
      throw err;
    }
  };

  // Limpar perfil (logout)
  const clearProfile = () => {
    setProfile(null);
    setLoading(false);
    loadingUserId.current = null;
  };

  return {
    profile,
    loading,
    loadProfile,
    updateProfile,
    createProfile,
    clearProfile
  };
}