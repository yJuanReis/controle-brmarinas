/**
 * Teste para validar que o singleton do Supabase está funcionando corretamente
 * Este arquivo pode ser removido após a validação
 */

import { getSupabaseClient, getSupabaseAdminClient } from './supabase';

/**
 * Função para testar o singleton do cliente Supabase
 * Deve ser chamada no console do navegador para validar
 */
export function testSupabaseSingleton() {
  console.log('=== Teste de Singleton do Supabase ===');
  
  // Testar cliente regular
  const client1 = getSupabaseClient();
  const client2 = getSupabaseClient();
  
  console.log('Cliente 1 === Cliente 2:', client1 === client2);
  console.log('Cliente 1 ID:', client1?.auth?.currentUser?.id || 'N/A');
  
  // Testar cliente admin
  const adminClient1 = getSupabaseAdminClient();
  const adminClient2 = getSupabaseAdminClient();
  
  console.log('Admin Client 1 === Admin Client 2:', adminClient1 === adminClient2);
  
  // Verificar se estamos usando a mesma instância global
  const globalClient = (globalThis as any).__supabase_client__;
  console.log('Global client === getSupabaseClient():', globalClient === client1);
  
  console.log('=== Teste concluído ===');
  
  return {
    regularSingleton: client1 === client2,
    adminSingleton: adminClient1 === adminClient2,
    globalConsistency: globalClient === client1
  };
}

/**
 * Função para monitorar eventos de criação de cliente
 * Pode ser usada para detectar se múltiplas instâncias estão sendo criadas
 */
export function monitorSupabaseClients() {
  const originalCreateClient = (globalThis as any).createClient;
  
  if (originalCreateClient) {
    console.warn('⚠️  createClient foi chamado diretamente! Isso pode causar múltiplas instâncias.');
  }
  
  // Monitorar listeners de auth
  const auth = getSupabaseClient()?.auth;
  if (auth && (auth as any)._events) {
    const eventCount = Object.keys((auth as any)._events).length;
    console.log(`Listeners de auth ativos: ${eventCount}`);
  }
}