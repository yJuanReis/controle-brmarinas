# 🔌 Referência da API

Este documento fornece a referência completa da API do Sistema de Controle de Acesso.

## 📋 Visão Geral

A API do Sistema de Controle de Acesso é baseada em REST e utiliza JSON para troca de dados. A API é fornecida pelo Supabase e expõe endpoints para todas as operações do sistema.

## 🔐 Autenticação

### JWT Token
Todos os endpoints requerem autenticação via JWT token no header da requisição:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obter Token
```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@empresa.com",
    "user_metadata": {
      "empresa_id": "uuid-da-empresa"
    }
  }
}
```

## 🧑‍💼 Usuários

### Listar Usuários
```http
GET /rest/v1/usuarios
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `select`: Campos a serem retornados (default: *)
- `order`: Ordenação (ex: created_at.desc)
- `limit`: Limite de registros (default: 1000)

**Resposta:**
```json
[
  {
    "id": "uuid-do-usuario",
    "email": "usuario@empresa.com",
    "nome": "João Silva",
    "empresa_id": "uuid-da-empresa",
    "perfil": "admin",
    "ativo": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
]
```

### Criar Usuário
```http
POST /rest/v1/usuarios
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "novo@empresa.com",
  "nome": "Novo Usuário",
  "empresa_id": "uuid-da-empresa",
  "perfil": "operador"
}
```

### Atualizar Usuário
```http
PATCH /rest/v1/usuarios?id=eq.uuid-do-usuario
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Nome Atualizado",
  "perfil": "admin"
}
```

### Deletar Usuário
```http
DELETE /rest/v1/usuarios?id=eq.uuid-do-usuario
Authorization: Bearer <token>
```

## 👥 Pessoas

### Listar Pessoas
```http
GET /rest/v1/pessoas
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `select`: Campos a serem retornados
- `order`: Ordenação
- `limit`: Limite de registros
- `nome=ilike.*`: Busca por nome (case insensitive)
- `documento=eq.*`: Busca por documento

**Resposta:**
```json
[
  {
    "id": "uuid-da-pessoa",
    "nome": "João Silva",
    "documento": "123.456.789-00",
    "tipo": "funcionario",
    "telefone": "(11) 99999-9999",
    "email": "joao@empresa.com",
    "empresa_id": "uuid-da-empresa",
    "observacoes": "Funcionário da empresa X",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
]
```

### Criar Pessoa
```http
POST /rest/v1/pessoas
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Maria Santos",
  "documento": "987.654.321-00",
  "tipo": "visitante",
  "telefone": "(11) 88888-8888",
  "email": "maria@empresa.com",
  "empresa_id": "uuid-da-empresa"
}
```

### Atualizar Pessoa
```http
PATCH /rest/v1/pessoas?id=eq.uuid-da-pessoa
Authorization: Bearer <token>
Content-Type: application/json

{
  "telefone": "(11) 77777-7777",
  "observacoes": "Atualização de contato"
}
```

### Deletar Pessoa
```http
DELETE /rest/v1/pessoas?id=eq.uuid-da-pessoa
Authorization: Bearer <token>
```

## 🚪 Acessos

### Listar Acessos
```http
GET /rest/v1/acessos
Authorization: Bearer <token>
```

**Parâmetros de Query:**
- `select`: Campos a serem retornados
- `order`: Ordenação (default: data_hora.desc)
- `limit`: Limite de registros
- `pessoa_id=eq.*`: Filtrar por pessoa
- `data_hora=gte.*`: Data/hora maior ou igual
- `data_hora=lte.*`: Data/hora menor ou igual
- `tipo=eq.entrada`: Filtrar por tipo de acesso

**Resposta:**
```json
[
  {
    "id": "uuid-do-acesso",
    "pessoa_id": "uuid-da-pessoa",
    "tipo": "entrada",
    "data_hora": "2023-01-01T08:00:00.000Z",
    "observacao": "Entrada normal",
    "empresa_id": "uuid-da-empresa",
    "created_at": "2023-01-01T08:00:00.000Z",
    "pessoa": {
      "nome": "João Silva",
      "documento": "123.456.789-00"
    }
  }
]
```

### Criar Acesso
```http
POST /rest/v1/acessos
Authorization: Bearer <token>
Content-Type: application/json

{
  "pessoa_id": "uuid-da-pessoa",
  "tipo": "entrada",
  "observacao": "Entrada via catraca"
}
```

### Deletar Acesso
```http
DELETE /rest/v1/acessos?id=eq.uuid-do-acesso
Authorization: Bearer <token>
```

## 📊 Relatórios

### Acessos por Período
```http
GET /rest/v1/acessos?select=count(*),tipo&data_hora=gte.2023-01-01&data_hora=lte.2023-01-31&group=tipo
Authorization: Bearer <token>
```

**Resposta:**
```json
[
  {
    "count": 150,
    "tipo": "entrada"
  },
  {
    "count": 148,
    "tipo": "saida"
  }
]
```

### Pessoas Ativas
```http
GET /rest/v1/acessos?select=pessoa_id,pessoa(nome),data_hora&tipo=eq.entrada&order=data_hora.desc&group=pessoa_id
Authorization: Bearer <token>
```

### Tempo Médio de Permanência
```http
GET /rest/v1/acessos?select=pessoa_id,avg(data_hora)&tipo=eq.saida&group=pessoa_id
Authorization: Bearer <token>
```

## 🔍 Busca Avançada

### Busca por Nome
```http
GET /rest/v1/pessoas?nome=ilike.*João*
Authorization: Bearer <token>
```

### Busca por Documento
```http
GET /rest/v1/pessoas?documento=eq.123.456.789-00
Authorization: Bearer <token>
```

### Busca por Tipo de Pessoa
```http
GET /rest/v1/pessoas?tipo=eq.funcionario
Authorization: Bearer <token>
```

### Busca por Data de Acesso
```http
GET /rest/v1/acessos?data_hora=gte.2023-01-01T00:00:00Z&data_hora=lte.2023-01-31T23:59:59Z
Authorization: Bearer <token>
```

## 📈 Métricas

### Total de Pessoas
```http
GET /rest/v1/pessoas?select=count(*)
Authorization: Bearer <token>
```

### Total de Acessos no Dia
```http
GET /rest/v1/acessos?select=count(*),tipo&data_hora=gte.2023-01-01T00:00:00Z&data_hora=lte.2023-01-01T23:59:59Z&group=tipo
Authorization: Bearer <token>
```

### Acessos por Hora
```http
GET /rest/v1/acessos?select=date_trunc(hour,data_hora),count(*)&group=date_trunc
Authorization: Bearer <token>
```

## ⚠️ Erros Comuns

### Token Inválido
```json
{
  "code": "42703",
  "details": null,
  "hint": null,
  "message": "column \"id\" does not exist"
}
```

**Solução:** Verifique se o token JWT está correto e não expirou.

### Permissão Negada
```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"pessoas\""
}
```

**Solução:** Verifique as permissões do usuário e se ele pertence à empresa correta.

### Dados Inválidos
```json
{
  "code": "23502",
  "details": null,
  "hint": null,
  "message": "null value in column \"nome\" violates not-null constraint"
}
```

**Solução:** Preencha todos os campos obrigatórios.

## 🔄 Webhooks

### Configurar Webhook
Para receber notificações em tempo real, configure webhooks no Supabase:

1. Acesse o painel do Supabase
2. Vá para Settings > Webhooks
3. Configure o endpoint de callback
4. Selecione os eventos desejados (INSERT, UPDATE, DELETE)

### Eventos Disponíveis
- **pessoas:INSERT**: Quando uma nova pessoa é cadastrada
- **pessoas:UPDATE**: Quando uma pessoa é atualizada
- **pessoas:DELETE**: Quando uma pessoa é excluída
- **acessos:INSERT**: Quando um novo acesso é registrado
- **acessos:UPDATE**: Quando um acesso é atualizado
- **acessos:DELETE**: Quando um acesso é excluído

### Formato do Webhook
```json
{
  "type": "INSERT",
  "table": "pessoas",
  "record": {
    "id": "uuid-da-pessoa",
    "nome": "João Silva",
    "documento": "123.456.789-00"
  },
  "schema": "public",
  "old_record": null
}
```

## 📝 Exemplos de Uso

### Registro de Entrada
```javascript
async function registrarEntrada(pessoaId, observacao) {
  const response = await fetch('/rest/v1/acessos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      pessoa_id: pessoaId,
      tipo: 'entrada',
      observacao: observacao
    })
  })
  
  return await response.json()
}
```

### Consulta de Histórico
```javascript
async function getHistorico(dataInicial, dataFinal, pessoaId) {
  let url = `/rest/v1/acessos?order=data_hora.desc`
  
  if (dataInicial) {
    url += `&data_hora=gte.${dataInicial}`
  }
  
  if (dataFinal) {
    url += `&data_hora=lte.${dataFinal}`
  }
  
  if (pessoaId) {
    url += `&pessoa_id=eq.${pessoaId}`
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}
```

---

> **Importante**: Esta API utiliza Row Level Security (RLS) do PostgreSQL para garantir que usuários só acessem dados da sua própria empresa.