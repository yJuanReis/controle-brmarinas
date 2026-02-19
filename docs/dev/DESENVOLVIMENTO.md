# 🛠️ Guia de Desenvolvimento

Este documento fornece orientações completas para desenvolvedores que desejam contribuir ou estender o Sistema de Controle de Acesso.

## 🚀 Configuração do Ambiente

### Requisitos
- **Node.js**: Versão 18 ou superior
- **npm**: Versão 9 ou superior
- **Git**: Para controle de versão

### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sistema-controle-acesso.git

# Entre na pasta do projeto
cd sistema-controle-acesso

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application Configuration
VITE_APP_NAME="Sistema de Controle de Acesso"
VITE_APP_VERSION="1.0.0"
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes de UI (Shadcn/ui)
│   ├── modals/         # Componentes de modais
│   └── shared/         # Componentes compartilhados
├── pages/              # Páginas da aplicação
├── services/           # Camada de serviços/API
├── hooks/              # Hooks personalizados
├── contexts/           # Context API para estado global
├── lib/                # Bibliotecas e utilitários
├── types/              # Tipos TypeScript
├── data/               # Dados mockados (desenvolvimento)
└── styles/             # Estilos globais
```

### Estrutura de Componentes

#### Componentes UI (Shadcn/ui)
Todos os componentes de UI são baseados no [Shadcn/ui](https://ui.shadcn.com/), garantindo consistência e acessibilidade.

```typescript
// Exemplo de componente UI
import { Button } from "@/components/ui/button"

export function MyComponent() {
  return (
    <Button variant="outline" size="lg">
      Clique aqui
    </Button>
  )
}
```

#### Componentes de Negócio
Componentes específicos do domínio do sistema:

```typescript
// Exemplo de componente de negócio
import { RegistrarAcessoForm } from "@/components/RegistrarAcessoForm"

export function Dashboard() {
  return (
    <div>
      <RegistrarAcessoForm />
    </div>
  )
}
```

## 🏗️ Arquitetura

### Arquitetura Frontend
- **React 18**: Biblioteca principal
- **TypeScript**: Tipagem estática
- **Vite**: Build tool
- **React Router**: Navegação
- **TanStack Query**: Gerenciamento de estado assíncrono
- **Tailwind CSS**: Estilização
- **Shadcn/ui**: Componentes de UI

### Camada de Dados
- **Supabase**: Backend como serviço
- **PostgreSQL**: Banco de dados
- **Row Level Security**: Segurança no nível de linha
- **Real-time**: Sincronização em tempo real

### Gerenciamento de Estado
- **Context API**: Estado global (MarinaContext)
- **TanStack Query**: Estado assíncrono
- **React Hook Form**: Formulários

## 🔄 Fluxo de Desenvolvimento

### 1. Criar Branch
```bash
# Crie uma branch para sua feature
git checkout -b feature/nome-da-feature

# Ou para correção de bug
git checkout -b bugfix/descricao-do-bug
```

### 2. Desenvolver
```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Abra http://localhost:5173 no navegador
```

### 3. Testar
```bash
# Testes unitários
npm run test

# Testes de lint
npm run lint

# Testes de type checking
npm run typecheck
```

### 4. Commitar
```bash
# Adicione os arquivos modificados
git add .

# Faça o commit
git commit -m "feat: adiciona funcionalidade X"

# Envie para o repositório remoto
git push origin feature/nome-da-feature
```

## 🧪 Testes

### Testes Unitários
Utilizamos Jest para testes unitários:

```typescript
// Exemplo de teste unitário
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Testes de Integração
Testes de integração com React Testing Library:

```typescript
// Exemplo de teste de integração
import { render, fireEvent } from '@testing-library/react'
import { RegistrarAcessoForm } from '@/components/RegistrarAcessoForm'

describe('RegistrarAcessoForm', () => {
  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn()
    render(<RegistrarAcessoForm onSubmit={mockSubmit} />)
    
    // Simular preenchimento e submissão
    fireEvent.click(screen.getByText('Registrar'))
    
    expect(mockSubmit).toHaveBeenCalled()
  })
})
```

## 🎨 Estilização

### Tailwind CSS
Utilizamos Tailwind CSS para estilização:

```typescript
// Exemplo de estilização com Tailwind
export function MyComponent() {
  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800">
        Título do Componente
      </h1>
      <p className="text-gray-600">
        Descrição do componente
      </p>
    </div>
  )
}
```

### Componentes Customizados
Para componentes que precisam de estilização avançada:

```typescript
// Exemplo de componente customizado
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}>
      {children}
    </div>
  )
}
```

## 🔌 API

### Estrutura de Requisições
```typescript
// Exemplo de chamada API
import { supabase } from '@/lib/supabase'

export async function getPessoas() {
  const { data, error } = await supabase
    .from('pessoas')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
```

### Tipos de Dados
```typescript
// Exemplo de tipos
export interface Pessoa {
  id: string
  nome: string
  documento: string
  tipo: 'funcionario' | 'visitante' | 'fornecedor'
  telefone?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface Acesso {
  id: string
  pessoa_id: string
  tipo: 'entrada' | 'saida'
  data_hora: string
  observacao?: string
}
```

## 🚀 Build e Deploy

### Build para Produção
```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

### Deploy
#### Vercel
```bash
# Instale o CLI da Vercel
npm install -g vercel

# Deploy
vercel
```

#### Netlify
```bash
# Instale o CLI da Netlify
npm install -g netlify-cli

# Deploy
netlify deploy
```

#### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "preview"]
```

```bash
# Build e run Docker
docker build -t sistema-controle-acesso .
docker run -p 3000:3000 sistema-controle-acesso
```

## 📝 Contribuição

### Diretrizes de Código
- **TypeScript**: Sempre use tipagem estática
- **Naming**: Use camelCase para variáveis e funções
- **Componentes**: Use PascalCase para componentes React
- **Importação**: Ordene imports alfabeticamente
- **Comentários**: Comente código complexo

### Convenção de Commits
Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

feat: adiciona nova funcionalidade
fix: corrige bug crítico
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudanças de funcionalidade
test: adiciona testes
chore: mudanças de build ou ferramentas
```

### Pull Requests
1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Atualize a documentação se necessário
4. Teste localmente
5. Crie o Pull Request
6. Descreva as mudanças e o motivo

## 🔧 Ferramentas de Desenvolvimento

### ESLint
Configuração de lint para manter a qualidade do código:

```json
{
  "extends": ["eslint:recommended"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### Prettier
Configuração de formatação automática:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### TypeScript
Configuração TypeScript:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🐛 Debug

### Ferramentas de Debug
- **React DevTools**: Para debug de componentes React
- **Redux DevTools**: Para debug de estado (se usar)
- **Browser DevTools**: Para debug geral

### Logging
Utilize console.log para debug em desenvolvimento:

```typescript
// Exemplo de logging
export function debugExample() {
  const data = { name: 'John', age: 30 }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug data:', data)
  }
  
  return data
}
```

## 📚 Recursos Úteis

### Documentação Oficial
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)

### Tutoriais Recomendados
- [React Hooks Guide](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs)

---

> **Dica**: Sempre mantenha este guia atualizado com as melhores práticas da equipe e mudanças na arquitetura.