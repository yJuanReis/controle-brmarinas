# Sistema BR Marinas - Controle de Acesso 🚤

Sistema profissional web para controle de entrada e saída de pessoas e veículos em marinas e estabelecimentos.

---

## ⚡ Quick Start

```bash
# Clone e instale
npm install

# Rode em desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📚 Documentação

| Guia | Descrição |
|------|-----------|
| **[docs/INDEX.md](docs/INDEX.md)** | 📋 Índice completo - начинайте aqui |
| **[docs/uso/LOGIN.md](docs/uso/LOGIN.md)** | Como fazer login |
| **[docs/uso/CADASTRAR_PESSOA.md](docs/uso/CADASTRAR_PESSOA.md)** | Cadastrar pessoas |
| **[docs/uso/REGISTRAR_ENTRADA.md](docs/uso/REGISTRAR_ENTRADA.md)** | Registrar entrada |
| **[docs/uso/REGISTRAR_SAIDA.md](docs/uso/REGISTRAR_SAIDA.md)** | Registrar saída |

---

## ✨ Funcionalidades

- ✅ Cadastro de pessoas (funcionários, visitantes, fornecedores)
- ✅ Registro de entrada/saída com horário
- ✅ Controle de veículos com placa
- ✅ Histórico com filtros avançados
- ✅ Relatórios em PDF e Excel
- ✅ Sistema multi-empresa
- ✅ Interface responsiva

---

## 🛠️ Stack

- **React 18** + TypeScript
- **Tailwind CSS** + Shadcn/ui
- **Vite**
- **Supabase** (backend)

---

## 📁 Estrutura

```
src/
├── components/       # Componentes React
│   ├── ui/         # Componentes de UI
│   └── modals/     # Modais do sistema
├── pages/          # Páginas principais
├── contexts/       # Estado global
├── hooks/          # Hooks personalizados
├── services/       # Integração com API
├── lib/           # Utilitários
└── types/          # Tipos TypeScript

docs/               # Documentação completa
```

---

## 🚀 Deploy

### Variáveis de Ambiente

Crie `.env.local`:

```env
VITE_SUPABASE_URL=sua-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave
```

### Build

```bash
npm run build
```

Deploy automático via Vercel - basta conectar o repositório GitHub.

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/sua-feature`
3. Commit: `git commit -m 'Add feature X'`
4. Push: `git push origin feature/sua-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - see [LICENSE](LICENSE) for details.

---

**Status**: ✅ Produção Ready  
**Última atualização**: Fevereiro 2026
