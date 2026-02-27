# Guia Rápido - Sistema BR Marinas (Usuário Comum)

Este documento explica as funcionalidades disponíveis para o usuário comum do sistema.

---

## 1. Login

**O que faz:** Página inicial de autenticação.
- Usuário informa email e senha para acessar o sistema
- Após login, redireciona para o Painel

---

## 2. Painel (Página Inicial)

**O que faz:** Controle principal de acesso à marina.

### Botões de Ação:
- **Registrar Entrada:** Abre modal para registrar entrada de pessoa na marina
- **Registrar Saída:** Registra saída de todas as pessoas que estão dentro (saída em lote)
- **Atualizar:** Recarrega os dados na tela

### Lista de Pessoas na Marina:
- Exibe todas as pessoas que estão atualmente dentro da marina
- Cada registro mostra: nome, documento, placa, tipo, horário de entrada e tempo decorrido
- **Editar:** Abre modal para editar dados da movimentação (horário, observação)
- **Saída:** Registra saída individual dessa pessoa

---

## 3. Histórico

**O que faz:** Visualiza todas as movimentações passadas (entradas e saídas).

### Recursos:
- **Busca global:** Pesquisa em todo o histórico por nome, documento, placa, etc.
- **Filtros disponíveis:**
  - Data de início e fim
  - Tipo de pessoa (colaborador, cliente, marinheiro, proprietário, visita)
  - Nome, documento, placa

### Modos de Visualização:
- **Lista:** Mostra todos os registros em formato de tabela
- **Diário:** Agrupa registros por dia

### Ações em cada registro:
- **Editar:** Altera dados da movimentação
- **Saída:** Registra saída (apenas para quem está "Dentro")

---

## 4. Pessoas

**O que faz:** Gerencia o cadastro de pessoas.

### Recursos:
- **Buscar:** Pesquisa por nome, documento ou placa
- **Filtrar por tipo:** Colaborador, Cliente, Marinheiro, Proprietário, Visita

### Cada cartão de pessoa mostra:
- Nome e tipo
- Documento
- Contato (telefone)
- Placa do veículo

### Ações:
- **Editar:** Altera dados do cadastro
- **Excluir:** Remove o cadastro (apenas se não estiver dentro da marina)

---

## 5. Funcionalidades dos Modais

### Registrar Entrada:
- Seleciona pessoa já cadastrada OU cria nova
- Preenche: tipo, documento, nome, contato, placa, observação
- Observation é obrigatória

### Registrar Saída:
- Pode ser individual (por pessoa) ou em lote (todas de uma vez)
- Saída individual permite escolher horário personalizado
- Saída em lote registra saída de todas as pessoas que estão dentro

### Cadastrar Pessoa:
- Cria novo cadastro com: nome, documento, tipo, contato, placa
- Após cadastrar, pode direto registrar a entrada

---

## Observações Importantes

1. **Saída Automática:** O sistema remove automaticamente pessoas que estão há mais de 30 dias dentro da marina

2. **Tipos de Usuário:**
   - Usuário comum: acesso ao Painel, Histórico e Pessoas
   - Admin/Owner: acesso adicional às páginas de Admin e Auditoria

3. **Empresa Atual:** O sistema mostra qual marina/empresa está selecionada no header

---

*Documento preparado para suporte durante férias - BR Marinas*
