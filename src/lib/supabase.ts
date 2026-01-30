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
}

const _global = globalThis as any;

if (!_global.__supabase_client__) {
  _global.__supabase_client__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // usar storage padrão (evita problemas em alguns ambientes)
      storage: window?.localStorage,
      flowType: 'pkce'
    },
  });
}

export const supabase = _global.__supabase_client__;

// Cliente admin (para operações privilegiadas)
export const supabaseAdmin = (() => {
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  if (!_global.__supabase_admin_client__) {
    _global.__supabase_admin_client__ = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _global.__supabase_admin_client__;
})();
