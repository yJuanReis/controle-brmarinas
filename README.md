# Sistema BR Marinas - Controle de Acesso 🚤

Sistema profissional web para controle de entrada e saída de pessoas e veículos em marinas e estabelecimentos náuticos.

---

## ⚡ Quick Start

```bash
# Clone o repositório
git clone https://github.com/yJuanReis/controle-brmarinas.git
cd controle-brmarinas

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Rode em desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📚 Documentação

| Guia | Descrição |
|------|-----------|
| **[docs/INDEX.md](docs/INDEX.md)** | Índice completo - começar aqui |
| **[docs/getting-started/COMECE_AQUI.md](docs/getting-started/COMECE_AQUI.md)** | Primeiros passos |
| **[docs/manual/MANUAL_USUARIO.md](docs/manual/MANUAL_USUARIO.md)** | Manual do usuário |
| **[docs/admin/DOCUMENTACAO.md](docs/admin/DOCUMENTACAO.md)** | Documentação administrativa |

### Guias de Uso
- **[docs/uso/LOGIN.md](docs/uso/LOGIN.md)** - Como fazer login
- **[docs/uso/CADASTRAR_PESSOA.md](docs/uso/CADASTRAR_PESSOA.md)** - Cadastrar pessoas
- **[docs/uso/REGISTRAR_ENTRADA.md](docs/uso/REGISTRAR_ENTRADA.md)** - Registrar entrada
- **[docs/uso/REGISTRAR_SAIDA.md](docs/uso/REGISTRAR_SAIDA.md)** - Registrar saída
- **[docs/uso/HISTORICO.md](docs/uso/HISTORICO.md)** - Consultar histórico
- **[docs/uso/RELATORIOS.md](docs/uso/RELATORIOS.md)** - Gerar relatórios

---

## ✨ Funcionalidades

### Controle de Acesso
- ✅ Cadastro de pessoas (clientes, colaboradores, marinheiros, proprietários, visitas)
- ✅ Registro de entrada/saída com horário automático
- ✅ Controle de veículos com placa
- ✅ Observação obrigatória por registro
- ✅ Saída individual ou em lote

### Gestão
- ✅ Histórico com filtros avançados (data, tipo, nome, documento, placa)
- ✅ Visualização em lista ou diário
- ✅ Relatórios em PDF e Excel
- ✅ Sistema multi-empresa
- ✅ Perfis de usuário (admin, owner, comum)

### Interface
- ✅ Interface responsiva (mobile, tablet, desktop)
- ✅ Design moderno e intuitivo
- ✅ Atualização em tempo real
- ✅ Notificações toast

---

## 🛠️ Stack

- **React 18** + TypeScript
- **Tailwind CSS** + Shadcn/ui
- **Vite** (build tool)
- **Supabase** (backend as a service)
  - PostgreSQL
  - Auth (GoTrue)
  - Row Level Security (RLS)
  - Edge Functions

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas Principais
- **empresas** - Marina/empresa
- **pessoas** - Cadastro de pessoas
- **movimentacoes** - Registros de entrada/saída
- **placas** - Placas de veículos
- **profiles** - Perfis de usuários
- **app_config** - Configurações do app
- **auditoria** - Log de ações

### Funções RPC
- `get_movimentacoes_completo` - Movimentações com dados da pessoa
- `get_movimentacoes_por_empresa` - Filtrar por empresa
- `get_movimentacoes_por_periodo` - Filtrar por período
- `get_pessoas_por_empresa` - Listar pessoas por empresa

---

## 📁 Estrutura do Projeto

```
controle-brmarinas/
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/              # Componentes de UI (shadcn)
│   │   ├── modals/          # Modais do sistema
│   │   ├── Dashboard.tsx    # Página inicial
│   │   ├── Header.tsx       # Cabeçalho
│   │   ├── HistoricoPage.tsx # Histórico
│   │   └── LoginPage.tsx    # Login
│   ├── pages/               # Páginas principais
│   ├── contexts/             # Estado global (MarinaContext)
│   ├── hooks/                # Hooks personalizados
│   ├── services/             # Integração com API
│   ├── lib/                 # Utilitários
│   │   ├── supabase.ts      # Cliente Supabase
│   │   └── validation/      # Validações
│   └── types/               # Tipos TypeScript
├── supabase/
│   ├── functions/           # Edge Functions
│   └── migrations/          # Migrations do banco
├── docs/                    # Documentação
└── public/                  # Arquivos estáticos
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie o arquivo `.env.local`:

```env
# URL do projeto Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave anônima (obtida em: Project Settings > API)
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Chave de serviço (opcional, apenas para operações admin)
# VITE_SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico

# Versão do app (para sistema de atualizações)
VITE_APP_VERSION=1.0.0
```

### Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute as migrations em `supabase/migrations/`
3. Configure as políticas RLS para segurança
4. Adicione as variáveis no Vercel (se deployed)

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte o repositório GitHub na Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Build para Produção

```bash
npm run build
```

O build será gerado em `dist/`

---

## 👥 Papéis de Usuário

| Papel | Acesso |
|-------|--------|
| **Comum** | Painel, Histórico, Pessoas |
| **Admin** | + Painel Admin (gestão de usuários) |
| **Owner** | + Auditoria (log completo) |

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Commit suas alterações: `git commit -m 'Add feature X'`
4. Push para a branch: `git push origin feature/sua-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - voir [LICENSE](LICENSE) para detalhes.

---

## 📞 Suporte

Para questões ou problemas:
- Abra uma [Issue](https://github.com/yJuanReis/controle-brmarinas/issues)
- Consulte a documentação em `docs/`

---

**Status**: ✅ Produção Ready  
**Última atualização**: Fevereiro 2026  
**Versão**: 1.0.0
