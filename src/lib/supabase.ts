import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Garantir singleton entre reloads/HMR para evitar múltiplas instâncias do GoTrueClient
declare global {
  var __supabase_client__: ReturnType<typeof createClient> | undefined;
  var __supabase_admin_client__: ReturnType<typeof createClient> | undefined;
  var __supabase_initialized__: boolean | undefined;
  var __supabase_cleanup_ran__: boolean | undefined;
}

const _global = globalThis as any;

// Função para limpar instâncias antigas (para HMR)
function cleanupOldInstances() {
  if (_global.__supabase_cleanup_ran__) return;
  
  try {
    // Limpar instâncias antigas se existirem
    if (_global.__supabase_client__) {
      try {
        // Tentar limpar listeners de auth
        if (_global.__supabase_client__.auth) {
          _global.__supabase_client__.auth.removeAllListeners();
        }
      } catch (e) {
        // Ignorar erros de limpeza
      }
    }
  } catch (e) {
    // Ignorar erros de limpeza
  } finally {
    _global.__supabase_cleanup_ran__ = true;
  }
}

// Função para criar cliente Supabase com configurações otimizadas
function createSupabaseClient() {
  // Limpar instâncias antigas antes de criar nova
  cleanupOldInstances();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Configurações para evitar múltiplas instâncias do GoTrueClient
      storage: window?.localStorage,
      flowType: 'pkce'
    }
  });
}

// Função para criar cliente admin
function createSupabaseAdminClient() {
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Garantir que o cliente seja criado apenas uma vez
if (!_global.__supabase_client__) {
  _global.__supabase_client__ = createSupabaseClient();
  _global.__supabase_initialized__ = true;
}

export const supabase = _global.__supabase_client__;

// Cliente admin (para operações privilegiadas)
export const supabaseAdmin = (() => {
  if (!_global.__supabase_admin_client__) {
    _global.__supabase_admin_client__ = createSupabaseAdminClient();
  }
  return _global.__supabase_admin_client__;
})();

// Função para obter o cliente singleton (para garantir consistência)
export function getSupabaseClient() {
  return _global.__supabase_client__;
}

// Função para obter o cliente admin singleton
export function getSupabaseAdminClient() {
  return _global.__supabase_admin_client__;
}

// Função para forçar recriação do cliente (para debug)
export function resetSupabaseClient() {
  if (_global.__supabase_client__) {
    try {
      if (_global.__supabase_client__.auth) {
        _global.__supabase_client__.auth.removeAllListeners();
      }
    } catch (e) {
      // Ignorar erros
    }
  }
  _global.__supabase_client__ = undefined;
  _global.__supabase_admin_client__ = undefined;
  _global.__supabase_cleanup_ran__ = false;
  _global.__supabase_initialized__ = false;
  
  // Criar nova instância
  _global.__supabase_client__ = createSupabaseClient();
  _global.__supabase_admin_client__ = createSupabaseAdminClient();
  _global.__supabase_initialized__ = true;
  
  return _global.__supabase_client__;
}
