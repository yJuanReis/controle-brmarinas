# EXPLICACAO SISTEMA BR MARINAS - USUARIO COMUM

Este documento explica todas as funcionalidades do sistema BR Marinas para o usuario comum (nao admin).

---

## 1. TELA DE LOGIN

- Pagina inicial onde o usuario faz autenticacao com email e senha
- Apos login bem-sucedido, redireciona para o Painel

---

## 2. PAINEL (Dashboard)

E a pagina inicial do sistema, accessible em: /

### Botoes Principais:

- **Registrar Entrada** (botao verde): Abre modal para registrar entrada de pessoa na marina
- **Registrar Saida** (botao vermelho): Registra saida de todas as pessoas que estao dentro (saida em lote)
- **Atualizar**: Recarrega os dados da tela

### Lista de Pessoas na Marina:

- Exibe todas as pessoas que estao atualmente dentro da marina
- Cada linha mostra:
  - Nome da pessoa
  - Documento (CPF/RG)
  - Placa do veiculo (se houver)
  - Tipo (Colaborador, Cliente, Marinheiro, Proprietario, Visita)
  - Horario de entrada
  - Tempo decorrido desde a entrada

### Acoes por Pessoa:

- **Editar**: Abre modal para editar dados da movimentacao (horario, observacao)
- **Saida**: Registra saida individual dessa pessoa

---

## 3. HISTORICO

Visualiza todas as movimentacoes passadas. Accessivel em: /historico

### Filtros Disponiveis:

- **Busca global**: Pesquisa em todo o historico por nome, documento, placa, contato, tipo ou observacao
- **Data de inicio** e **Data fim**: Filtra por periodo
- **Tipo**: Colaborador, Cliente, Marinheiro, Prestador, Proprietario, Visita
- **Nome**: Busca por nome
- **Documento**: Busca por CPF/RG
- **Placa**: Busca por placa de veiculo

### Modos de Visualizacao:

- **Lista**: Mostra todos os registros em formato de tabela
- **Diario**: Agrupa registros por dia (expansivel)

### Acoes em cada Registro:

- **Editar**: Altera dados da movimentacao (horario de entrada/saida, observacao)
- **Saida**: Registra saida (apenas para quem esta "Dentro")

---

## 4. PESSOAS

Gerencia o cadastro de pessoas. Accessivel em: /pessoas

### Recursos:

- **Buscar**: Pesquisa por nome, documento ou placa
- **Filtrar por tipo**: Colaborador, Cliente, Marinheiro, Proprietario, Visita

### Cada Cartao de Pessoa exibe:

- Nome e tipo
- Documento (CPF/RG)
- Contato (telefone)
- Placa do veiculo (se houver)

### Acoes:

- **Editar**: Altera dados do cadastro (nome, documento, tipo, contato, placa)
- **Excluir**: Remove o cadastro (apenas se a pessoa nao estiver dentro da marina)

---

## 5. MODAIS (Pop-ups)

### Modal Registrar Entrada:

- Permite selecionar pessoa ja cadastrada OU criar nova
- Campos: tipo, documento, nome, contato, placa, observacao
- **Observacao e obrigatoria**

### Modal Registrar Saida:

- **Saida individual**: Escolhe uma pessoa especifica e registra saida
- **Saida em lote**: Registra saida de todas as pessoas que estao dentro
- Permite escolher horario personalizado de saida

### Modal Cadastrar Pessoa:

- Cria novo cadastro com: nome, documento, tipo, contato, placa
- Apos cadastrar, pode registrar entrada diretamente

### Modal Editar Pessoa:

- Altera dados do cadastro (nao e movimentacao)

### Modal Editar Movimentacao:

- Altera dados da movimentacao (horario de entrada/saida, observacao)

---

## 6. INFORMACOES IMPORTANTES

### Saida Automatica:

- O sistema remove automaticamente pessoas que estao ha mais de 30 dias (720 horas) dentro da marina

### Tipos de Usuario:

- **Usuario comum**: Acesso ao Painel, Historico e Pessoas
- **Admin/Owner**: Acesso adicional as paginas de Admin e Auditoria

### Empresa Atual:

- O sistema mostra qual marina/empresa esta selecionada no header
- O usuario so ve dados da empresa que esta vinculada

---

## 7. ESTRUTURA DE ROTAS

- `/` - Painel (Dashboard)
- `/historico` - Historico de movimentacoes
- `/pessoas` - Gerenciamento de pessoas
- `/admin` - Painel administrativo (apenas admin)
- `/auditoria` - Log de auditoria (apenas admin/owner)
- `/login` - Pagina de login

---

## 8. FLUXO BASICO DE USO

### Registrar entrada:
1. Clicar em "Registrar Entrada" no Painel
2. Selecionar pessoa ja cadastrada OU preencher dados para nova pessoa
3. Preencher observacao (obrigatorio)
4. Clicar em "Registrar"
5. Pessoa aparecera na lista do Painel

### Registrar saida:
1. No Painel, clicar em "Saida" na linha da pessoa OU
2. Clicar em "Registrar Saida" para saida em lote de todas as pessoas

### Buscar pessoa:
1. Ir para pagina "Pessoas"
2. Usar barra de busca ou filtros por tipo
3. Clicar em "Editar" para alterar dados

### Ver historico:
1. Ir para pagina "Historico"
2. Aplicar filtros desejados (data, tipo, nome, etc)
3. Visualizar em modo Lista ou Diario

---

================================================================================
================================================================================
## PARTE 2: INTEGRACAO COM SUPABASE
================================================================================
================================================================================

Este documento explica como o sistema BR Marinas se integra com o Supabase.

---

## 1. CONFIGURACAO DO SUPABASE

### Variaveis de Ambiente

O sistema usa as seguintes variaveis de ambiente (arquivo .env.local):

```
VITE_SUPABASE_URL=https://xxxxxx-xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (opcional, apenas para admin)
```

- **VITE_SUPABASE_URL**: URL do projeto Supabase
- **VITE_SUPABASE_ANON_KEY**: Chave publica anonima (usada pelo frontend)
- **VITE_SUPABASE_SERVICE_ROLE_KEY**: Chave de servico (apenas para operacoes admin, nunca exposta no frontend)

---

## 2. ARQUITETURA DE DADOS

### Tabelas Principais (criadas via migrations):

1. **empresas** - Marina/empresa que usa o sistema
2. **pessoas** - Cadastro de pessoas (nome, documento, contato, tipo)
3. **movimentacoes** - Registros de entrada e saida (entrada_em, saida_em, status)
4. **placas** - Placas de veiculos vinculadas a pessoas
5. **profiles** - Perfis de usuario (vinculados ao auth.users)
6. **app_config** - Configuracoes do aplicativo
7. **auditoria** - Log de acoes dos usuarios

---

## 3. FUNCOES RPC (Remote Procedure Call)

O sistema usa funcoes RPC do Supabase para operacoes complexas:

### Funcoes Disponiveis:

- **get_movimentacoes_completo**: Retorna movimentacoes completas com dados da pessoa
- **get_movimentacoes_por_empresa**: Filtra movimentacoes por empresa
- **get_movimentacoes_por_periodo**: Filtra por periodo de datas
- **get_pessoas_por_empresa**: Lista pessoas de uma empresa especifica

---

## 4. SEGURANCA (RLS - Row Level Security)

O sistema implementa politicas RLS (Row Level Security) para garantir que:

- Cada empresa so veja seus proprios dados
- Usuarios comuns vejam apenas dados da empresa vinculada
- Admins possam ver dados de todas as empresas

### Politicas principais:

- **pessoas**: Apenas registros da empresa do usuario
- **movimentacoes**: Apenas registros da empresa do usuario
- **empresas**: Apenas empresas que o usuario tem acesso
- **profiles**: Apenas o proprio perfil do usuario

---

## 5. AUTENTICACAO

### Sistema de Login:

- Usa o **Supabase Auth** (GoTrue) para autenticacao
- Armazena sessao no **localStorage**
- Token JWT e refresh automatico

### Fluxo de Login:

1. Usuario informa email e senha
2. Supabase Auth valida credenciais
3. Sistema busca perfil do usuario na tabela "profiles"
4. Define permissao baseada no campo "role" (admin, owner, comum)

---

## 6. ESTRUTURA DE PASTAS

### Arquivos de integracao:

- `src/lib/supabase.ts` - Cliente Supabase (criacao singleton)
- `src/hooks/useSupabaseInit.ts` - Hook de inicializacao
- `src/contexts/MarinaContext.tsx` - Contexto principal (gerencia dados)
- `src/services/marinaService.ts` - Servicos de negocio

---

## 7. MIGRATIONS (historico de mudancas no banco)

O projeto tem migrations que criam e alteram a estrutura do banco:

- `001_add_performance_indexes.sql` - Indices de performance
- `002_add_incluir_excluidas_param.sql` - Parametro para incluir/excluidas
- `003_add_placa_to_movimentacoes.sql` - Coluna placa
- `004_create_placas_pessoa.sql` - Tabela de placas
- `005_add_pernoite_to_movimentacoes.sql` - Campo pernoite
- `006_add_rls_policies.sql` - Politicas de seguranca RLS
- `007_fix_rls_recursion.sql` - Correcao RLS
- `008_disable_rls_temporarily.sql` - Desabilitar RLS temporariamente
- `009_fix_rpc_functions.sql` - Correcao funcoes RPC
- `010_fix_get_pessoas.sql` - Correcao get_pessoas
- `011_migrate_placas_to_new_table.sql` - Migrar placas
- `012_create_app_config.sql` - Tabela de configuracao
- `013_create_auditoria.sql` - Tabela de auditoria

---

## 8. PROBLEMAS COMUNS E SOLUCOES

### Erro: "Missing Supabase environment variables"
- Verificar se as variaveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estao definidas no .env.local

### Erro: "Session not found" ou login nao persiste
- Verificar se o localStorage esta funcionando (nao bloqueado por extensoes/privacidade)
- Verificar se a chave anonima esta correta no dashboard do Supabase

### Erro: "Row-level security denied"
- Verificar se RLS esta habilitado nas tabelas
- Verificar se as politicas (policies) estao criadas corretamente
- Verificar se o usuario tem profile vinculado

### Dados nao aparecem
- Verificar se a empresa do usuario esta correta
- Verificar se RLS esta filtrando corretamente

### Problemas com HMR (Hot Module Replacement)
- O sistema usa singleton para evitar multiplas instancias do cliente Supabase

---

## 9. VERIFICACOES PARA SUPORTE

### Checklist de verificacao:

1. **Supabase online?**
   - Acessar dashboard.supabase.com e verificar status

2. **Tabelas existem?**
   - Verificar no SQL Editor: SELECT * FROM empresas LIMIT 1

3. **RLS habilitado?**
   - Verificar: SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('pessoas', 'movimentacoes', 'empresas')

4. **Policies criadas?**
   - Verificar: SELECT * FROM pg_policies WHERE tablename IN ('pessoas', 'movimentacoes')

5. **Usuario tem profile?**
   - Verificar: SELECT * FROM profiles WHERE id = 'user-id-do-auth'

6. **Empresa vinculada ao usuario?**
   - Verificar: SELECT * FROM profiles WHERE empresa_id IS NOT NULL

---

Documento preparado para suporte durante ferias
Sistema: BR Marinas - Controle de Acesso
