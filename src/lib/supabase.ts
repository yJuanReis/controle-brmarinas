import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton global para evitar múltiplas instâncias do GoTrueClient
declare global {
  var __supabase_client__: ReturnType<typeof createClient> | undefined;
  var __supabase_admin_client__: ReturnType<typeof createClient> | undefined;
}

const _global = globalThis as any;

// Criar cliente Supabase com storage fixo para evitar múltiplas instâncias
const supabaseClientOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage, // Usar localStorage diretamente com chave fixa
  },
};

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

// Inicializar cliente apenas uma vez
if (!_global.__supabase_client__) {
  _global.__supabase_client__ = createClient(supabaseUrl, supabaseAnonKey, supabaseClientOptions);
}

export const supabase = _global.__supabase_client__;

// Cliente admin singleton
export const supabaseAdmin = _global.__supabase_admin_client__ ?? 
  (_global.__supabase_admin_client__ = createSupabaseAdminClient());

// Funções para obter clientes
export function getSupabaseClient() {
  return _global.__supabase_client__;
}

export function getSupabaseAdminClient() {
  return _global.__supabase_admin_client__;
}

// Reset simples apenas para HMR
export function resetSupabaseClient() {
  // Não criar novas instâncias, apenas garantir que a existente está disponível
  return _global.__supabase_client__;
}
