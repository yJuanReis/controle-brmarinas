// Final
// Data types for Marina Access Control System
// Prepared for future Supabase integration

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string | null;
  created_at: string;
}

export interface Pessoa {
  id: string;
  empresa_id: string;
  nome: string;        // obrigatório
  documento: string;   // obrigatório
  tipo?: string | null;
  contato?: string | null;
  placa?: string | null;
  created_at: string;
}

export interface AppUser {
  id: string;
  nome: string;
  email: string;
  empresa_id: string;
  role: 'user' | 'admin' | 'owner';
  created_at: string;
}

export type MovimentacaoStatus = 'DENTRO' | 'FORA';

export interface Movimentacao {
  id: string;
  empresa_id: string;
  pessoa_id: string;
  entrada_em: string;   // ISO datetime
  saida_em?: string | null;    // ISO datetime
  status: MovimentacaoStatus;
  observacao?: string | null;
  created_at: string;
}

// Extended types for UI
export interface MovimentacaoComPessoa extends Movimentacao {
  pessoa: Pessoa;
}

export interface PessoaDentro {
  movimentacaoId: string;
  pessoa: Pessoa;
  entradaEm: string;
  observacao?: string | null;
}

// Form types
export interface NovaPessoaForm {
  nome: string;
  documento: string;
  tipo?: 'cliente' | 'visita' | 'marinheiro' | 'proprietario' | 'colaborador' | 'prestador';
  contato?: string;
  placa?: string;
}

export interface NovaEntradaForm {
  pessoaId: string;
  observacao?: string;
}