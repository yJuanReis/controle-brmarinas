# 📖 Documentação do Sistema de Controle de Acesso

Este documento fornece uma visão completa de como usar e administrar o Sistema de Controle de Acesso.

## 🎯 Visão Geral

O Sistema de Controle de Acesso é uma aplicação web completa que permite gerenciar entradas e saídas de pessoas e veículos em empresas e estabelecimentos.

### Principais Benefícios
- **Segurança**: Controle rigoroso de acesso
- **Produtividade**: Processos automatizados
- **Auditoria**: Histórico completo de movimentações
- **Multi-empresa**: Isolamento total entre empresas
- **Relatórios**: Dados para tomada de decisão

## 🚀 Primeiros Passos

### Acesso ao Sistema
1. Abra seu navegador
2. Acesse: `https://seusistema.com.br` (ou `http://localhost:5173` para desenvolvimento)
3. Faça login com suas credenciais

### Tipos de Usuário
- **Administrador**: Acesso total ao sistema
- **Operador**: Registro de acessos e consultas
- **Visitante**: Acesso limitado (se habilitado)

## 📋 Funcionalidades Principais

### 1. Dashboard
**Objetivo**: Visão geral do sistema

**Funcionalidades**:
- Estatísticas de acesso (entradas/saídas)
- Alertas e notificações
- Gráficos de movimentação
- Resumo do dia

**Como usar**:
1. Acesse a página inicial após o login
2. Visualize as estatísticas no painel
3. Clique nos gráficos para detalhes

### 2. Cadastro de Pessoas
**Objetivo**: Registrar e gerenciar usuários do sistema

**Campos obrigatórios**:
- Nome completo
- Documento (CPF/CNPJ)
- Tipo de pessoa (Funcionário/Visitante/Fornecedor)

**Campos opcionais**:
- Telefone
- Email
- Departamento
- Foto
- Observações

**Como cadastrar**:
1. Acesse "Cadastro de Pessoas"
2. Clique em "Novo Cadastro"
3. Preencha os campos obrigatórios
4. Salve o registro

**Como editar**:
1. Selecione a pessoa na lista
2. Clique em "Editar"
3. Faça as alterações necessárias
4. Salve as mudanças

### 3. Registro de Acesso
**Objetivo**: Controlar entradas e saídas em tempo real

**Tipos de registro**:
- **Entrada**: Registro de chegada
- **Saída**: Registro de saída
- **Saída em Lote**: Saída de múltiplas pessoas

**Validações**:
- Pessoa deve estar cadastrada
- Não pode registrar saída sem entrada
- Não pode registrar entrada duplicada

**Como registrar entrada**:
1. Acesse "Registro de Acesso"
2. Selecione a pessoa
3. Clique em "Registrar Entrada"
4. Confirme a operação

**Como registrar saída**:
1. Acesse "Registro de Acesso"
2. Selecione a pessoa que está "DENTRO"
3. Clique em "Registrar Saída"
4. Confirme a operação

### 4. Histórico de Acessos
**Objetivo**: Consultar e exportar registros de acesso

**Filtros disponíveis**:
- Data inicial e final
- Tipo de pessoa
- Status (Dentro/Fora)
- Nome da pessoa
- Documento

**Exportação**:
- PDF
- Excel
- CSV

**Como consultar**:
1. Acesse "Histórico de Acessos"
2. Defina os filtros desejados
3. Clique em "Buscar"
4. Visualize os resultados

**Como exportar**:
1. Realize a consulta desejada
2. Clique no botão "Exportar"
3. Escolha o formato
4. Salve o arquivo

### 5. Administração
**Objetivo**: Gerenciar usuários e configurações do sistema

**Funcionalidades**:
- Gestão de usuários
- Configurações do sistema
- Controle de permissões
- Logs de auditoria

**Como gerenciar usuários**:
1. Acesse "Administração"
2. Selecione "Usuários"
3. Clique em "Novo Usuário" ou edite existentes
4. Defina permissões e salve

## 🔐 Segurança

### Controle de Acesso
- **Autenticação**: Login e senha
- **Autorização**: Permissões por perfil
- **Auditoria**: Registro de todas as ações
- **Sessão**: Tempo limite de inatividade

### Boas Práticas
- Use senhas fortes
- Não compartilhe credenciais
- Faça logout ao finalizar
- Altere a senha periodicamente

## 📊 Relatórios

### Relatórios Disponíveis
1. **Acessos Diários**: Movimentação por dia
2. **Acessos Mensais**: Resumo mensal
3. **Pessoas Ativas**: Quem está no local
4. **Tempo de Permanência**: Tempo médio de visita
5. **Frequência**: Visitas por pessoa

### Como Gerar Relatórios
1. Acesse "Relatórios"
2. Selecione o tipo desejado
3. Defina o período
4. Clique em "Gerar"
5. Exporte se necessário

## ⚙️ Configurações

### Configurações Gerais
- **Nome da Empresa**: Identificação do sistema
- **Horário de Funcionamento**: Definir horários
- **Mensagens Personalizadas**: Textos customizados

### Configurações de Segurança
- **Tempo de Sessão**: Tempo máximo de inatividade
- **Histórico de Logs**: Período de retenção
- **Backup Automático**: Configurar backups

## 🆘 Suporte

### Problemas Comuns

#### Login não funciona
- Verifique usuário e senha
- Confira se a conta está ativa
- Tente redefinir a senha

#### Erro ao registrar acesso
- Verifique se a pessoa está cadastrada
- Confira se não há registro duplicado
- Verifique conexão com internet

#### Sistema lento
- Limpe o cache do navegador
- Verifique conexão de internet
- Reinicie o navegador

### Contatos de Suporte
- **Suporte Técnico**: suporte@empresa.com
- **Horário de Atendimento**: Seg-Sex, 8h-18h
- **Telefone**: (11) 99999-9999

## 📱 Aplicativo Móvel

### Funcionalidades Móveis
- Registro de acesso via QR Code
- Consulta de histórico
- Notificações push
- Geolocalização

### Como usar
1. Baixe o app nas lojas
2. Faça login com suas credenciais
3. Use as funcionalidades disponíveis

## 🔗 Integrações

### Integrações Disponíveis
- **Catracas**: Integração com catracas eletrônicas
- **Câmeras**: Integração com sistemas de CCTV
- **CRM**: Integração com sistemas de gestão
- **RH**: Integração com sistemas de RH

### Como configurar integrações
1. Acesse "Administração"
2. Selecione "Integrações"
3. Escolha a integração desejada
4. Siga as instruções de configuração

---

## 📝 Glossário

- **Entrada**: Registro de chegada de uma pessoa
- **Saída**: Registro de saída de uma pessoa
- **DENTRO**: Pessoa que fez entrada e ainda não fez saída
- **FORA**: Pessoa que fez saída ou ainda não fez entrada
- **Lote**: Conjunto de registros processados em grupo
- **Audit**: Registro de todas as ações no sistema

## 🔄 Atualizações

### Como saber se há atualizações
- Notificações no dashboard
- Email de aviso
- Verificação manual em "Administração > Sistema"

### Como atualizar
- Atualizações automáticas (se configurado)
- Atualizações manuais via administração
- Comunicação prévia sobre manutenções

---

> **Importante**: Esta documentação é atualizada regularmente. Consulte sempre a versão mais recente.