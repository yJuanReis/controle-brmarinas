# Guia de Validação do Singleton Supabase

Este guia ajuda a validar que a refatoração para o padrão Singleton foi bem-sucedida e que o aviso "Multiple GoTrueClient instances detected" foi eliminado.

## Passos para Validar

### 1. Testar no Console do Navegador

1. Abra o console do navegador (F12)
2. Execute o seguinte código:

```javascript
// Importar a função de teste (se estiver usando bundler)
import { testSupabaseSingleton } from './src/lib/supabase.test.js';

// Ou copiar e colar a função no console
function testSupabaseSingleton() {
  const client1 = window.__supabase_client__;
  const client2 = window.__supabase_client__;
  
  console.log('=== Teste de Singleton do Supabase ===');
  console.log('Cliente 1 === Cliente 2:', client1 === client2);
  console.log('Global client existe:', !!window.__supabase_client__);
  console.log('=== Teste concluído ===');
  
  return client1 === client2;
}

testSupabaseSingleton();
```

### 2. Verificar Ausência de Avisos

1. **Reinicie o servidor de desenvolvimento** (importante para HMR)
2. Recarregue a aplicação
3. Observe o console do navegador
4. Confirme que não há mais avisos de "Multiple GoTrueClient instances detected"

### 3. Testar HMR (Hot Module Replacement)

1. Faça uma alteração em qualquer arquivo do projeto
2. Observe se o HMR funciona sem gerar novos avisos
3. Verifique se a aplicação continua funcionando normalmente

### 4. Testar Funcionalidades

1. Realize login/logout várias vezes
2. Navegue entre diferentes páginas da aplicação
3. Verifique se todas as funcionalidades que usam Supabase continuam funcionando

## O que foi Alterado

### Arquivo `src/lib/supabase.ts`

- **Melhorias no Singleton**: Adicionada função `createSupabaseClient()` para criar o cliente de forma controlada
- **Configurações Otimizadas**: Adicionadas configurações para evitar múltiplas instâncias do GoTrueClient
- **Funções de Acesso**: Adicionadas `getSupabaseClient()` e `getSupabaseAdminClient()` para acesso consistente
- **Variável de Controle**: Adicionada `__supabase_initialized__` para rastrear inicialização

### Arquivos de Hooks

- **useAuth.ts**: Atualizado para usar `getSupabaseClient()` ao invés de importar diretamente
- **useProfile.ts**: Atualizado para usar `getSupabaseClient()` ao invés de importar diretamente

### Novo Arquivo de Teste

- **src/lib/supabase.test.ts**: Contém funções de teste para validar o singleton

## Resultados Esperados

✅ **Singleton Garantido**: Apenas uma instância do cliente Supabase é criada  
✅ **Avisos Eliminados**: Não há mais avisos de múltiplas instâncias do GoTrueClient  
✅ **Funcionalidade Preservada**: Todas as operações de Supabase continuam funcionando  
✅ **Performance Melhorada**: Redução de listeners de auth state change duplicados  

## Possíveis Problemas

### Se o aviso persistir:

1. **Cache do Navegador**: Limpe o cache e recarregue a aplicação
2. **Módulos em Cache**: Verifique se não há módulos em cache que ainda importam `createClient` diretamente
3. **Ambiente de Desenvolvimento**: No HMR (Hot Module Replacement), pode ser necessário reiniciar o servidor de desenvolvimento

### Se houver erros de autenticação:

1. **Variáveis de Ambiente**: Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas
2. **Políticas de Segurança**: Verifique as políticas de RLS no Supabase
3. **Conexão com Banco**: Verifique se o banco de dados está acessível

## Remoção do Arquivo de Teste

Após validar que tudo está funcionando corretamente, você pode remover o arquivo `src/lib/supabase.test.ts` pois ele foi criado apenas para fins de validação.