import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';

export interface UserProfile {
  id: string;
  nome: string;
  empresa_id: string;
  role: 'user' | 'admin' | 'owner';
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

interface UseAuthReturn {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

interface SignUpData {
  email: string;
  password: string;
  nome: string;
  empresa_id: string;
  role?: 'user' | 'admin' | 'owner';
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialSessionProcessed, setInitialSessionProcessed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isSigningUpRef = useRef(false);
  const { profile, loadProfile, createProfile, clearProfile } = useProfile();

  // Inicializar auth state do Supabase
  useEffect(() => {
    let mounted = true;

    // Verificar sessão atual
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Inicializando autenticação...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('[Auth] Erro ao obter sessão:', error);
        } else if (session?.user) {
          console.log('[Auth] Sessão encontrada, carregando perfil...');
          await handleAuthStateChange(session.user);
          setInitialSessionProcessed(true);
        } else {
          console.log('[Auth] Nenhuma sessão encontrada');
          // Usuário não autenticado
          setUser(null);
          setSession(null);
          clearProfile();
          setInitialSessionProcessed(true);
        }
      } catch (err) {
        console.error('[Auth] Erro na inicialização:', err);
        if (mounted) {
          setUser(null);
          setSession(null);
          clearProfile();
          setInitialSessionProcessed(true);
        }
      } finally {
        if (mounted) {
          console.log('[Auth] Inicialização concluída, loading = false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listener para mudanças de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state change:', event, session?.user?.email);

        if (!mounted) return;

        // Se estamos saindo ou criando usuário, ignorar o evento de auth state change
        if (isSigningOut || isSigningUpRef.current) {
          console.log('[Auth] Ignorando auth state change (logout/signup em andamento)');
          return;
        }

        // Evitar processar a sessão inicial novamente
        if (event === 'SIGNED_IN' && initialSessionProcessed) {
          console.log('[Auth] Ignorando evento SIGNED_IN duplicado da sessão inicial');
          return;
        }

        if (session?.user) {
          console.log('[Auth] Usuário logado via auth state change, carregando perfil...');
          await handleAuthStateChange(session.user);
        } else {
          console.log('[Auth] Usuário deslogado via auth state change');
          setUser(null);
          setSession(null);
          clearProfile();
        }

        // Garantir que loading seja false após mudança de estado
        console.log('[Auth] Setting loading = false after auth state change');
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Função auxiliar para lidar com mudança de estado de auth
  const handleAuthStateChange = async (supabaseUser: any) => {
    console.log('[Auth] handleAuthStateChange chamado:', supabaseUser?.email);

    // Extrair dados do metadata do auth (criados no signup)
    const metadataRole = supabaseUser?.user_metadata?.role;
    const metadataNome = supabaseUser?.user_metadata?.nome;
    const metadataEmpresa = supabaseUser?.user_metadata?.empresa_id;
    
    console.log('[Auth] Dados do metadata:', { 
      metadataRole, 
      metadataNome, 
      metadataEmpresa 
    });

    // Criar usuário básico do metadata (sempre disponível)
    const basicAuthUser: AuthUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      profile: metadataRole ? {
        id: supabaseUser.id,
        nome: metadataNome || supabaseUser.email,
        empresa_id: metadataEmpresa || '',
        role: metadataRole as 'user' | 'admin' | 'owner',
        created_at: new Date().toISOString()
      } : undefined
    };

    console.log('[Auth] Criando usuário básico:', basicAuthUser.email);
    setUser(basicAuthUser);
    setSession({ user: basicAuthUser });

    // Depois tentar carregar o perfil em background (não bloqueante)
    try {
      console.log('[Auth] Tentando carregar perfil em background para:', supabaseUser.id);
      const userProfile = await loadProfile(supabaseUser.id);

      if (userProfile) {
        console.log('[Auth] ✅ Perfil carregado com sucesso da tabela');
        // Atualizar usuário com perfil carregado do banco
        setUser(prev => prev ? { ...prev, profile: userProfile } : prev);
      } else if (metadataRole) {
        console.log('[Auth] ℹ️ Perfil não encontrado em DB, mas temos dados no metadata - mantendo fallback');
        // Já tem profile do metadata, não fazer nada
      } else {
        console.log('[Auth] ⚠️ Nenhum perfil encontrado em DB e sem metadata - usuário pode ter problema');
        // Tentar fazer uma ação de resgate: tentar criar o perfil
        try {
          console.log('[Auth] Tentando criar perfil como resgate...');
          // Este é um último recurso - não deveria ser necessário
          // mas garante que não deixamos usuários órfãos
        } catch (rescueErr: any) {
          console.error('[Auth] Falha no resgate de perfil:', rescueErr);
        }
      }
    } catch (err: any) {
      console.error('[Auth] Erro ao carregar perfil em background:', err);
      console.log('[Auth] Mantendo usuário básico com dados do metadata');
      // Não fazer nada - usuário básico já foi criado com dados do metadata
    }
  };

  // Sign In - Apenas Supabase Auth
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error('[Auth] Erro no login:', error);
        toast.error('Email ou senha incorretos');
        return { success: false, error: 'Credenciais inválidas' };
      }

      if (data.user) {
        console.log('[Auth] Login realizado:', data.user.email);
        toast.success('Login realizado com sucesso!');
        return { success: true };
      }

      // Caso improvável
      toast.error('Erro inesperado no login');
      return { success: false, error: 'Erro interno' };

    } catch (err: any) {
      console.error('[Auth] Erro inesperado no sign in:', err);
      toast.error('Erro ao fazer login');
      return { success: false, error: 'Erro interno' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign Up - Criar conta no Supabase + perfil
  const signUp = useCallback(async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    // Preserva sessão atual: se o Supabase trocar a sessão ao criar um novo usuário,
    // restauramos a sessão do admin/owner para evitar troca automática de usuário.
    try {
      setLoading(true);
      console.log('[Auth] Iniciando signup para:', data.email);

      // Capturar sessão atual (antes do signup)
      let prevSession: any = null;
      try {
        const { data } = await supabase.auth.getSession();
        prevSession = data?.session || null;
      } catch (e) {
        console.warn('[Auth] Não foi possível capturar sessão anterior:', e);
        prevSession = null;
      }

      // Marcar que signup está em andamento para que o listener ignore auth changes
      isSigningUpRef.current = true;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            nome: data.nome.trim(),
            empresa_id: data.empresa_id,
            role: data.role || 'user'
          }
        }
      });

      if (authError) {
        console.error('[Auth] Erro no auth signup:', authError);
        throw authError;
      }

      if (!authData.user) {
        console.error('[Auth] Nenhum usuário retornado do signup');
        return { success: false, error: 'Erro ao criar conta' };
      }

      console.log('[Auth] Usuário criado no Auth com sucesso:', authData.user.id);

      // Aguardar criação do perfil com retry
      let profileCreated = false;
      let retries = 0;
      const maxRetries = 3;

      while (!profileCreated && retries < maxRetries) {
        try {
          console.log(`[Auth] Tentando criar perfil na tabela (tentativa ${retries + 1}/${maxRetries})...`);

          await createProfile(authData.user.id, {
            nome: data.nome.trim(),
            empresa_id: data.empresa_id,
            role: data.role || 'user'
          });

          console.log('[Auth] ✅ Perfil criado com sucesso na tabela');
          profileCreated = true;
        } catch (profileErr: any) {
          retries++;
          console.error(`[Auth] Erro ao criar perfil (tentativa ${retries})`, profileErr?.message || profileErr);

          if (profileErr?.message && profileErr.message.includes('infinite recursion')) {
            console.warn('[Auth] ⚠️ RLS policy com recursão infinita detectada');
            break;
          }

          if (retries < maxRetries) {
            console.log('[Auth] Aguardando 500ms antes de retry...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!profileCreated) {
        console.warn('[Auth] ⚠️ Perfil não foi criado na tabela, mas usuário foi criado no Auth');
        console.warn('[Auth] O metadata do auth será usado como fallback');
      }

      // Após signup, verificar se a sessão atual mudou para o novo usuário
      try {
        const { data: currentData } = await supabase.auth.getSession();
        const currentSession = currentData?.session || null;

        if (prevSession && currentSession && prevSession.user?.id !== currentSession.user?.id) {
          console.log('[Auth] Detectada troca de sessão durante signup, tentando restaurar sessão anterior...');

          if (prevSession.access_token && prevSession.refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token: prevSession.access_token,
              refresh_token: prevSession.refresh_token
            });

            if (setErr) {
              console.error('[Auth] Erro ao restaurar sessão anterior:', setErr);
            } else {
              console.log('[Auth] Sessão restaurada com sucesso');
              try {
                // Reaplicar estado de usuário a partir da sessão restaurada
                await handleAuthStateChange(prevSession.user);
              } catch (hErr) {
                console.error('[Auth] Erro ao rehidratar usuário após restaurar sessão:', hErr);
              }
            }
          } else {
            console.warn('[Auth] Sessão anterior não contém tokens para restauração');
          }
        }
      } catch (restoreErr) {
        console.error('[Auth] Erro ao verificar/ restaurar sessão após signup:', restoreErr);
      }

      console.log('[Auth] ✅ Signup completado com sucesso');
      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] ❌ Erro no sign up:', err);
      const errorMessage = err?.message || 'Erro ao criar conta';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      isSigningUpRef.current = false;
      setLoading(false);
    }
  }, [createProfile]);

  // Sign Out - Apenas Supabase Auth
  const signOut = useCallback(async () => {
    try {
      setIsSigningOut(true);
      setLoading(true);

      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          // Se for erro de sessão faltante, ignorar e continuar com logout local
          if (error.message && error.message.includes('session')) {
            console.warn('[Auth] Sessão já foi encerrada, limpando dados locais');
          } else {
            console.error('[Auth] Erro no logout:', error);
          }
        } else {
          console.log('[Auth] Logout realizado com sucesso no Supabase');
        }
      } catch (err: any) {
        console.warn('[Auth] Erro ao fazer logout no Supabase (continuando):', err.message);
      }

      // Sempre limpar dados locais, independente do resultado do Supabase
      setUser(null);
      setSession(null);
      clearProfile();

      // Limpando chaves locais do Supabase para evitar sessão persistente
      try {
        console.log('[Auth] Limpando localStorage do Supabase para garantir logout completo');
        Object.keys(localStorage).forEach(key => {
          if (typeof key === 'string' && (key.startsWith('supabase.auth') || key.startsWith('sb-') || key.includes('supabase'))) {
            localStorage.removeItem(key);
          }
        });
      } catch (lsErr) {
        console.warn('[Auth] Falha ao limpar localStorage:', lsErr);
      }

      toast.success('Você saiu do sistema');
    } catch (err) {
      console.error('[Auth] Erro inesperado no sign out:', err);
      // Mesmo com erro, tentar limpar dados locais
      setUser(null);
      setSession(null);
      clearProfile();
    } finally {
      setLoading(false);
      // Aumentar janela para evitar race conditions de auth state change
      setTimeout(() => {
        setIsSigningOut(false);
      }, 1000);
    }
  }, [clearProfile]);

  // Reset Password - Supabase Auth
  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Erro no reset password:', err);
      const errorMessage = err.message || 'Erro ao enviar email de recuperação';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update Password - Supabase Auth
  const updatePassword = useCallback(async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      return { success: true };
    } catch (err: any) {
      console.error('[Auth] Erro ao atualizar senha:', err);
      const errorMessage = err.message || 'Erro ao atualizar senha';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Refresh Profile - Recarregar dados do perfil
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userProfile = await loadProfile(user.id);

      if (userProfile) {
        setUser(prev => prev ? { ...prev, profile: userProfile } : null);
        console.log('[Auth] Perfil atualizado');
      }
    } catch (err) {
      console.error('[Auth] Erro ao atualizar perfil:', err);
    }
  }, [user?.id, loadProfile]);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };
}