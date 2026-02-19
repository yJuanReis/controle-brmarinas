# Inputs Profissionais - Guia de Implementação

Este documento descreve a arquitetura de inputs profissionais implementada para o projeto, combinando Input Masking, Input Validation, Controlled Inputs, Data Sanitization e Real-time Formatting.

## Arquitetura

### Estrutura de Arquivos

```
src/
├── lib/validation/          # Funções de validação e formatação
│   ├── formatters.ts        # Formatação automática de campos
│   ├── validators.ts        # Validação de dados
│   └── index.ts            # Exportações
├── hooks/                   # Hooks customizados
│   └── useFormField.ts     # Lógica de controle de inputs
├── components/ui/          # Componentes reutilizáveis
│   └── FormField.tsx       # Componente React para inputs
└── examples/               # Exemplos de uso
    └── ProfessionalFormExample.tsx
```

## Componentes Principais

### 1. useFormField Hook

Hook customizado que encapsula toda a lógica de validação e formatação de inputs.

```typescript
import { useFormField } from '../hooks/useFormField';

const field = useFormField({
  type: 'cpf',              // Tipo do campo
  validateOnBlur: true,     // Valida ao sair do campo
  validateOnChange: false,  // Valida em tempo real
  maxLength: 14            // Limite de caracteres
});
```

**Métodos retornados:**
- `value`: Valor formatado do campo
- `error`: Mensagem de erro (se houver)
- `isValid`: Estado de validade
- `isDirty`: Indica se o campo foi modificado
- `handleChange`: Manipulador de mudança
- `handleBlur`: Manipulador de blur
- `sanitizeValue`: Retorna valor limpo (sem formatação)
- `reset`: Reseta o campo

### 2. FormField Component

Componente React reutilizável para criação de inputs profissionais.

```typescript
import { FormField } from '../components/ui/FormField';

<FormField
  label="CPF"
  type="cpf"
  placeholder="123.456.789-09"
  value={cpf}
  onChange={setCpf}
  error={errors.cpf}
  validateOnChange={true}
  validateOnBlur={true}
  required
/>
```

**Propriedades:**
- `label`: Texto do rótulo
- `type`: Tipo do campo (cpf, rg, phone, placa, text)
- `placeholder`: Texto de placeholder
- `value`: Valor controlado
- `onChange`: Callback de mudança
- `error`: Mensagem de erro externa
- `validateOnChange`: Validação em tempo real
- `validateOnBlur`: Validação ao sair do campo
- `maxLength`: Limite de caracteres
- `disabled`: Campo desabilitado
- `required`: Campo obrigatório

## Tipos de Campos Suportados

### CPF
- **Formato**: `123.456.789-09`
- **Validação**: Algoritmo de dígitos verificadores
- **Máscara**: Automática com pontos e hífen

### RG
- **Formato**: `12.345.678-9` (formato genérico)
- **Validação**: 8-15 dígitos
- **Máscara**: Automática com pontos e hífen

### Telefone
- **Formato**: `(11) 98765-4321`
- **Validação**: 10-11 dígitos
- **Máscara**: Automática com parênteses e hífen

### Placa
- **Formatos**: `ABC-1234` (antiga) ou `ABC-1D23` (Mercosul)
- **Validação**: Padrões de placas brasileiras
- **Máscara**: Automática com hífen

### Text
- **Formato**: Texto livre
- **Validação**: Sem validação automática
- **Máscara**: Nenhuma

## Exemplos de Uso

### Formulário Simples

```typescript
import { FormField } from '../components/ui/FormField';
import { useState } from 'react';

export function SimpleForm() {
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <form>
      <FormField
        label="CPF"
        type="cpf"
        value={cpf}
        onChange={setCpf}
        validateOnChange={true}
      />
      
      <FormField
        label="RG"
        type="rg"
        value={rg}
        onChange={setRg}
        validateOnBlur={true}
      />
      
      <FormField
        label="Telefone"
        type="phone"
        value={phone}
        onChange={setPhone}
        validateOnChange={true}
      />
    </form>
  );
}
```

### Formulário com Validação Completa

```typescript
import { FormField } from '../components/ui/FormField';
import { useState } from 'react';

export function CompleteForm() {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    telefone: ''
  });
  const [errors, setErrors] = useState({});

  const handleFieldChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.rg) newErrors.rg = 'RG é obrigatório';
    if (!formData.telefone) newErrors.telefone = 'Telefone é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormField
        label="Nome"
        type="text"
        value={formData.nome}
        onChange={handleFieldChange('nome')}
        required
      />
      
      <FormField
        label="CPF"
        type="cpf"
        value={formData.cpf}
        onChange={handleFieldChange('cpf')}
        error={errors.cpf}
        validateOnChange={true}
        required
      />
      
      <FormField
        label="RG"
        type="rg"
        value={formData.rg}
        onChange={handleFieldChange('rg')}
        error={errors.rg}
        validateOnBlur={true}
        required
      />
      
      <FormField
        label="Telefone"
        type="phone"
        value={formData.telefone}
        onChange={handleFieldChange('telefone')}
        error={errors.telefone}
        validateOnChange={true}
        required
      />
    </form>
  );
}
```

## Boas Práticas

### 1. Performance
- Use `validateOnChange` apenas quando necessário
- Evite validações muito complexas em tempo real
- Considere usar debounce para validações assíncronas

### 2. UX
- Sempre forneça mensagens de erro claras
- Use `placeholder` para guiar o usuário
- Indique campos obrigatórios com asterisco
- Forneça feedback visual imediato

### 3. DX (Developer Experience)
- Use TypeScript para melhor tipagem
- Crie hooks específicos para casos de uso complexos
- Documente os tipos de campos disponíveis
- Teste as validações com diversos cenários

### 4. Data Integrity
- Sempre sanitize os dados antes de enviar
- Valide tanto no frontend quanto no backend
- Armazene dados limpos (sem formatação)
- Use validações consistentes em todos os inputs

## Integração com Bibliotecas

### React Hook Form
```typescript
import { useForm } from 'react-hook-form';
import { FormField } from '../components/ui/FormField';

export function HookFormExample() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="CPF"
        type="cpf"
        {...register('cpf')}
        error={errors.cpf?.message}
      />
    </form>
  );
}
```

### Formik
```typescript
import { Formik, Field } from 'formik';
import { FormField } from '../components/ui/FormField';

export function FormikExample() {
  return (
    <Formik initialValues={{ cpf: '' }} onSubmit={onSubmit}>
      {({ values, setFieldValue }) => (
        <FormField
          label="CPF"
          type="cpf"
          value={values.cpf}
          onChange={(value) => setFieldValue('cpf', value)}
        />
      )}
    </Formik>
  );
}
```

## Testes

### Testes Unitários

```typescript
import { render, fireEvent } from '@testing-library/react';
import { FormField } from '../components/ui/FormField';

test('deve formatar CPF corretamente', () => {
  const { getByPlaceholderText } = render(
    <FormField type="cpf" placeholder="123.456.789-09" />
  );
  
  const input = getByPlaceholderText('123.456.789-09');
  fireEvent.change(input, { target: { value: '12345678909' } });
  
  expect(input.value).toBe('123.456.789-09');
});
```

### Testes de Validação

```typescript
import { validators } from '../lib/validation';

test('deve validar CPF válido', () => {
  expect(validators.cpf('123.456.789-09')).toBe(true);
});

test('deve rejeitar CPF inválido', () => {
  expect(validators.cpf('111.111.111-11')).toBe(false);
});
```

## Extensões Futuras

### Novos Tipos de Campos
- CNPJ
- CEP
- Cartão de Crédito
- Data/Hora
- E-mail

### Internacionalização
- Suporte a diferentes formatos por país
- Mensagens de erro em múltiplos idiomas
- Configurações regionais

### Acessibilidade
- Suporte a leitores de tela
- Navegação por teclado
- Contraste adequado

## Contribuição

Para contribuir com novos tipos de campos ou melhorias:

1. Adicione a formatação em `src/lib/validation/formatters.ts`
2. Adicione a validação em `src/lib/validation/validators.ts`
3. Atualize o tipo `FieldType` em `src/hooks/useFormField.ts`
4. Crie testes para a nova funcionalidade
5. Atualize a documentação

## Licença

Este código é fornecido como exemplo e pode ser adaptado conforme necessário para o seu projeto.