import { useEffect, useRef } from 'react';
import { getSupabaseClient, resetSupabaseClient } from '@/lib/supabase';

/**
 * Hook para garantir a inicialização correta do Supabase
 * Evita múltiplas instâncias durante HMR e hot reload
 */
export function useSupabaseInit() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    
    initializedRef.current = true;

    // Forçar limpeza de instâncias antigas durante HMR
    if (import.meta.hot) {
      try {
        // Resetar cliente para garantir singleton durante HMR
        resetSupabaseClient();
      } catch (e) {
        // Ignorar erros de reset
      }
    }

    // Verificar se o cliente foi criado corretamente
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client não foi inicializado corretamente');
    }
  }, []);
}