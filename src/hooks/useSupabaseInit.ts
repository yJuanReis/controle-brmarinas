// Final
import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Hook para garantir a inicialização correta do Supabase
 * Evita múltiplas instâncias durante HMR e hot reload
 */
export function useSupabaseInit() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    
    initializedRef.current = true;

    // Verificar se o cliente foi criado corretamente
    const client = getSupabaseClient();
    if (!client) {
      console.warn('Supabase client não foi inicializado corretamente');
    }
  }, []);
}
