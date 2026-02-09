import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Empresa, Pessoa, Movimentacao, PessoaDentro, NovaPessoaForm, MovimentacaoComPessoa, AppUser } from '@/types/marina';
import { supabase } from '@/lib/supabase';
import { useAuth, UserProfile } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { validators } from '@/lib/validation';
import { marinaService } from '@/services/marinaService';
import { format } from 'date-fns';

interface MarinaContextType {
  // Auth state (from useAuth)
  user: UserProfile | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  // Business state
  empresas: Empresa[];
  pessoas: Pessoa[];
  movimentacoes: Movimentacao[];
  empresaAtual: Empresa | null;
  businessLoading: boolean;

  // Auth actions
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Pessoa actions
  cadastrarPessoa: (data: NovaPessoaForm) => Promise<Pessoa>;
  buscarPessoaPorDocumento: (documento: string) => Pessoa | undefined;
  atualizarPessoa: (pessoaId: string, data: Partial<NovaPessoaForm>) => Promise<void>;
  excluirPessoa: (pessoaId: string) => Promise<void>;

  // Movimentação actions
  registrarEntrada: (pessoaId: string, observacao?: string) => Promise<{ success: boolean; error?: string }>;
  registrarSaida: (movimentacaoId: string, saidaEm?: string, observacao?: string) => Promise<{ success: boolean; error?: string }>;
  atualizarMovimentacao: (movimentacaoId: string, data: { entrada_em: string; saida_em?: string; observacao?: string }) => Promise<void>;
  excluirMovimentacao: (movimentacaoId: string) => Promise<void>;

  // User management actions
  adicionarUsuario: (data: { nome: string; email: string; senha: string; empresa_id: string; role?: 'user' | 'admin' | 'owner' }) => Promise<void>;
  removerUsuario: (usuarioId: string) => Promise<void>;
  alterarSenhaUsuario: (usuarioId: string, novaSenha: string) => Promise<void>;

  // Empresa actions
  deletarEmpresa: (empresaId: string) => Promise<void>;

  // Queries
  getPessoasDentro: () => PessoaDentro[];
  getHistoricoMovimentacoes: (filtros?: HistoricoFiltros) => MovimentacaoComPessoa[];
  podeEntrar: (pessoaId: string) => { pode: boolean; motivo?: string };
  getUsuarios: () => Promise<AppUser[]>;
  refreshPessoas: () => Promise<void>;
}

interface HistoricoFiltros {
  dataInicio?: string;
  dataFim?: string;
  tipo?: string;
  nome?: string;
  documento?: string;
  placa?: string;
}

const MarinaContext = createContext<MarinaContextType | undefined>(undefined);

export function MarinaProvider({ children }: { children: ReactNode }) {
  // Auth state from useAuth hook
  const { user: authUser, loading: authLoading, signIn, signOut, signUp } = useAuth();

  // Business state
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);

  // Computed values
  const isAuthenticated = !!authUser && !!authUser.profile;
  const empresaAtual = authUser?.profile ? empresas.find(e => e.id === authUser.profile.empresa_id) || null : null;


  // Load business data when user changes
  // OPTIMIZED: Load only active records first, full data on demand
  useEffect(() => {
    if (!authUser?.profile) {
      setPessoas([]);
      setMovimentacoes([]);
      return;
    }

    const loadBusinessData = async () => {
      setBusinessLoading(true);
      try {
        const empresaId = authUser.profile.empresa_id;

        // STEP 1: Load only active movimentacoes (people inside) - much faster!
        const { data: movimentacoesAtivas } = await supabase
          .from('movimentacoes')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('status', 'DENTRO')
          .order('entrada_em', { ascending: false });

        // STEP 2: Load pessoas that are inside the marina (just those needed for display)
        const pessoasIdsInside = movimentacoesAtivas?.map(m => m.pessoa_id) || [];
        
        let pessoasData: Pessoa[] = [];
        
        if (pessoasIdsInside.length > 0) {
          const { data: pessoasInside } = await supabase
            .from('pessoas')
            .select('*')
            .in('id', pessoasIdsInside);
          pessoasData = pessoasInside || [];
        }

        // Set initial state with just active data
        setMovimentacoes(movimentacoesAtivas || []);
        setPessoas(pessoasData);

        // STEP 3: Background load ALL data for history/reports (not blocking UI)
        // This can take longer but won't block the user experience
        setTimeout(async () => {
          try {
            const [allPessoas, allMovimentacoes] = await Promise.all([
              marinaService.getPessoasPorEmpresa(empresaId),
              marinaService.getMovimentacoesPorEmpresa(empresaId)
            ]);
            
            // Only update if component is still mounted and data changed
            setPessoas(prev => {
              if (prev.length < allPessoas.length) {
                return allPessoas;
              }
              return prev;
            });
            
            setMovimentacoes(prev => {
              if (prev.length < allMovimentacoes.length) {
                return allMovimentacoes;
              }
              return prev;
            });
          } catch (bgError) {
            console.warn('[MarinaContext] Background load failed (non-critical):', bgError);
          }
        }, 1000); // Delay to not block initial render

      } catch (error) {
        console.error('[MarinaContext] Erro ao carregar dados:', error);
      } finally {
        setBusinessLoading(false);
      }
    };

    loadBusinessData();
  }, [authUser?.profile?.empresa_id]);

  // Load empresas (shared data) - hardcoded marinas
  useEffect(() => {
    const hardcodedEmpresas: Empresa[] = [
      { id: 'br_marinas', nome: 'BR Marinas', created_at: new Date().toISOString() },
      { id: 'gloria', nome: 'Glória', created_at: new Date().toISOString() },
      { id: 'verolme', nome: 'Verolme', created_at: new Date().toISOString() },
      { id: 'piratas', nome: 'Piratas', created_at: new Date().toISOString() },
      { id: 'bracuhy_jl', nome: 'Bracuhy JL', created_at: new Date().toISOString() },
      { id: 'ribeira', nome: 'Ribeira', created_at: new Date().toISOString() },
      { id: 'itacuruca', nome: 'Itacuruçá', created_at: new Date().toISOString() },
      { id: 'buzios', nome: 'Búzios', created_at: new Date().toISOString() },
      { id: 'paraty', nome: 'Paraty', created_at: new Date().toISOString() },
      { id: 'boavista', nome: 'Boavista', created_at: new Date().toISOString() },
      { id: 'piccola', nome: 'Piccola', created_at: new Date().toISOString() }
    ];

    const loadEmpresas = async () => {
      try {
        // Tentar carregar do Supabase primeiro
        const { data, error } = await supabase.from('empresas').select('*');
        if (error) throw error;

        // Se não há empresas no Supabase, usar as hardcoded
        if (!data || data.length === 0) {
          setEmpresas(hardcodedEmpresas);
          return;
        }

        // Combinar empresas do banco com hardcoded (priorizando banco)
        const combinedEmpresas = [...data];
        hardcodedEmpresas.forEach(hardcoded => {
          if (!combinedEmpresas.find(e => e.id === hardcoded.id)) {
            combinedEmpresas.push(hardcoded);
          }
        });

        setEmpresas(combinedEmpresas);
      } catch (error) {
        // Fallback: usar empresas hardcoded
        setEmpresas(hardcodedEmpresas);
      }
    };

    loadEmpresas();
  }, []);

  // Auth actions (delegate to useAuth)
  const login = useCallback(async (email: string, senha: string) => {
    return await signIn(email, senha);
  }, [signIn]);

  const logout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Pessoa actions
  const cadastrarPessoa = useCallback(async (data: NovaPessoaForm): Promise<Pessoa> => {
    if (!authUser?.profile) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Verificar se a empresa do usuário existe
      const empresaExiste = empresas.find(e => e.id === authUser.profile.empresa_id);
      if (!empresaExiste) {
        throw new Error(`Empresa ${authUser.profile.empresa_id} não encontrada no sistema`);
      }

      // Gerar UUID para o id da pessoa
      const pessoaId = crypto.randomUUID();

      const insertData: any = {
        id: pessoaId,
        empresa_id: authUser.profile.empresa_id,
        nome: data.nome.trim(),
        documento: data.documento.trim(),
        contato: data.contato ? data.contato.trim() : null,
        placa: data.placa ? data.placa.trim() : null,
      };

      // Apenas adicionar tipo se houver um valor válido
      if (data.tipo) {
        insertData.tipo = data.tipo;
      }

      const { data: novaPessoa, error } = await supabase
        .from('pessoas')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setPessoas(prev => [...prev, novaPessoa]);
      

      toast.success('Pessoa cadastrada com sucesso!');
      return novaPessoa;
    } catch (err) {
      toast.error(`Erro ao cadastrar pessoa: ${err.message}`);
      throw err;
    }
  }, [authUser?.profile, empresas]);

  const buscarPessoaPorDocumento = useCallback((documento: string): Pessoa | undefined => {
    return pessoas.find(p => p.documento === documento);
  }, [pessoas]);

  const atualizarPessoa = useCallback(async (pessoaId: string, data: Partial<NovaPessoaForm>): Promise<void> => {
    try {
      // Buscar pessoa antes da atualização para auditoria
      const pessoaAntiga = pessoas.find(p => p.id === pessoaId);
      
      const updateData: any = {};
      if (data.nome !== undefined) updateData.nome = data.nome.trim();
      if (data.documento !== undefined) updateData.documento = data.documento.trim();
      if (data.tipo !== undefined) updateData.tipo = data.tipo;
      if (data.contato !== undefined) updateData.contato = data.contato?.trim() || null;
      if (data.placa !== undefined) updateData.placa = data.placa?.trim() || null;

      const { data: pessoaAtualizada, error } = await supabase
        .from('pessoas')
        .update(updateData)
        .eq('id', pessoaId)
        .select()
        .single();

      if (error) throw error;

      setPessoas(prev => prev.map(p => p.id === pessoaId ? pessoaAtualizada : p));
      

      toast.success('Pessoa atualizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar pessoa');
      throw err;
    }
  }, [pessoas]);

  // Refresh pessoas cache - force reload from database
  const refreshPessoas = useCallback(async (): Promise<void> => {
    if (!authUser?.profile) return;

    try {
      const allPessoas = await marinaService.getPessoasPorEmpresa(authUser.profile.empresa_id);
      setPessoas(allPessoas);
    } catch (error) {
      console.error('[MarinaContext] Erro ao atualizar pessoas:', error);
      toast.error('Erro ao atualizar dados de pessoas');
    }
  }, [authUser?.profile]);

  // Movimentação validation
  const podeEntrar = useCallback((pessoaId: string): { pode: boolean; motivo?: string } => {
    if (!empresaAtual) {
      return { pode: false, motivo: 'Nenhuma empresa selecionada' };
    }

    const entradaAberta = movimentacoes.find(
      m => m.pessoa_id === pessoaId &&
           m.empresa_id === empresaAtual.id &&
           m.status === 'DENTRO'
    );

    if (entradaAberta) {
      return { pode: false, motivo: 'Esta pessoa já está dentro da marina' };
    }

    return { pode: true };
  }, [movimentacoes, empresaAtual]);

  // Movimentação actions
  const registrarEntrada = useCallback(async (pessoaId: string, observacao?: string): Promise<{ success: boolean; error?: string }> => {
    if (!empresaAtual) {
      return { success: false, error: 'Nenhuma empresa selecionada' };
    }

    const validacao = podeEntrar(pessoaId);
    if (!validacao.pode) {
      toast.error(validacao.motivo);
      return { success: false, error: validacao.motivo };
    }

    // Validar observação apenas se houver conteúdo (campo opcional)
    if (observacao !== undefined && observacao.trim() !== '' && !validators.observacao(observacao)) {
      toast.error('Observação inválida. Deve conter pelo menos um caractere alfanumérico (letras ou números)');
      return { success: false, error: 'Observação inválida' };
    }

    try {
      // Gerar UUID para o id da movimentação
      const movimentacaoId = crypto.randomUUID();

      const { data: novaMovimentacao, error } = await supabase
        .from('movimentacoes')
        .insert({
          id: movimentacaoId,
          empresa_id: empresaAtual.id,
          pessoa_id: pessoaId,
          entrada_em: new Date().toISOString(),
          status: 'DENTRO',
          observacao: observacao?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setMovimentacoes(prev => [...prev, novaMovimentacao]);

      const pessoa = pessoas.find(p => p.id === pessoaId);
      toast.success(`Entrada registrada: ${pessoa?.nome || 'Visitante'}`);
      

      return { success: true };
    } catch (err) {
      toast.error('Erro ao registrar entrada');
      return { success: false, error: 'Erro interno' };
    }
  }, [empresaAtual, podeEntrar, pessoas]);

  const registrarSaida = useCallback(async (movimentacaoId: string, saidaEm?: string, observacao?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const movimentacao = movimentacoes.find(m => m.id === movimentacaoId);

      if (!movimentacao) {
        return { success: false, error: 'Movimentação não encontrada' };
      }

      if (movimentacao.status !== 'DENTRO') {
        toast.error('Esta pessoa já registrou saída');
        return { success: false, error: 'Pessoa já registrou saída' };
      }

      // Validar observação apenas se houver conteúdo (campo opcional)
      if (observacao !== undefined && observacao.trim() !== '' && !validators.observacao(observacao)) {
        toast.error('Observação inválida. Deve conter pelo menos um caractere alfanumérico (letras ou números)');
        return { success: false, error: 'Observação inválida' };
      }

      const updateData: any = {
        status: 'FORA',
      };

      // Usar horário personalizado se fornecido, senão usar horário atual
      if (saidaEm) {
        updateData.saida_em = new Date(saidaEm).toISOString();
      } else {
        updateData.saida_em = new Date().toISOString();
      }

      // Concatenar observação da saída com a observação existente da entrada
      // NUNCA deixar observacao vazia ou null - sempre concatenar
      const observacaoEntrada = movimentacao.observacao || '';
      const observacaoSaida = (observacao || '').trim();
      const observacaoSaidaPadrao = "Saída finalizada";
      
      if (observacaoSaida !== '') {
        // Se用户提供 observação de saída, concatenar
        if (observacaoEntrada !== '') {
          updateData.observacao = `${observacaoEntrada} | ${observacaoSaida}`;
        } else {
          updateData.observacao = observacaoSaida;
        }
      } else {
        // Se observação não foi fornecida, usar observação padrão
        if (observacaoEntrada !== '') {
          updateData.observacao = `${observacaoEntrada} | ${observacaoSaidaPadrao}`;
        } else {
          updateData.observacao = observacaoSaidaPadrao;
        }
      }

      const { data: movimentacaoAtualizada, error } = await supabase
        .from('movimentacoes')
        .update(updateData)
        .eq('id', movimentacaoId)
        .select()
        .single();

      if (error) throw error;

      setMovimentacoes(prev => prev.map(m =>
        m.id === movimentacaoId ? movimentacaoAtualizada : m
      ));

      const pessoa = pessoas.find(p => p.id === movimentacao.pessoa_id);
      toast.success(`Saída registrada: ${pessoa?.nome || 'Visitante'}`);
      

      return { success: true };
    } catch (err) {
      toast.error('Erro ao registrar saída');
      return { success: false, error: 'Erro interno' };
    }
  }, [movimentacoes, pessoas]);

  // Atualizar movimentação (entrada, saída, observação)
  const atualizarMovimentacao = useCallback(async (
    movimentacaoId: string,
    data: { entrada_em: string; saida_em?: string; observacao?: string }
  ): Promise<void> => {
    try {
      const movimentacao = movimentacoes.find(m => m.id === movimentacaoId);

      if (!movimentacao) {
        throw new Error('Movimentação não encontrada');
      }

      const updateData: any = {
        entrada_em: data.entrada_em,
      };

      // Se houver saída definida, atualizar status e saida_em
      if (data.saida_em) {
        updateData.saida_em = data.saida_em;
        updateData.status = 'FORA';
      } else {
        // Se não há saída, manter status atual
        updateData.status = movimentacao.status;
      }

      // Atualizar observação
      if (data.observacao !== undefined) {
        updateData.observacao = data.observacao;
      }

      const { data: movimentacaoAtualizada, error } = await supabase
        .from('movimentacoes')
        .update(updateData)
        .eq('id', movimentacaoId)
        .select()
        .single();

      if (error) throw error;

      setMovimentacoes(prev => prev.map(m =>
        m.id === movimentacaoId ? movimentacaoAtualizada : m
      ));

      toast.success('Movimentação atualizada com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar movimentação');
      throw err;
    }
  }, [movimentacoes]);

  // Excluir movimentação (soft delete - registra excluido_em e adiciona texto na observação)
  const excluirMovimentacao = useCallback(async (movimentacaoId: string): Promise<void> => {
    try {
      const movimentacao = movimentacoes.find(m => m.id === movimentacaoId);

      if (!movimentacao) {
        throw new Error('Movimentação não encontrada');
      }

      // Concatenar texto de exclusão na observação existente
      const observacaoOriginal = movimentacao.observacao || '';
      const observacaoExclusao = observacaoOriginal 
        ? `${observacaoOriginal} | EXCLUÍDA em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
        : `EXCLUÍDA em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`;

      const { data: movimentacaoExcluida, error } = await supabase
        .from('movimentacoes')
        .update({ 
          excluido_em: new Date().toISOString(),
          observacao: observacaoExclusao
        })
        .eq('id', movimentacaoId)
        .select()
        .single();

      if (error) throw error;

      setMovimentacoes(prev => prev.map(m =>
        m.id === movimentacaoId ? movimentacaoExcluida : m
      ));

      const pessoa = pessoas.find(p => p.id === movimentacao.pessoa_id);
      toast.success('Movimentação excluída com sucesso!');
    } catch (err) {
      toast.error('Erro ao excluir movimentação');
      throw err;
    }
  }, [movimentacoes, pessoas]);

  // Queries
  const getPessoasDentro = useCallback((): PessoaDentro[] => {
    if (!empresaAtual) return [];

    return movimentacoes
      .filter(m => m.empresa_id === empresaAtual.id && m.status === 'DENTRO')
      .map(m => {
        const pessoa = pessoas.find(p => p.id === m.pessoa_id);
        if (!pessoa) return null;
        return {
          movimentacaoId: m.id,
          pessoa,
          entradaEm: m.entrada_em,
          observacao: m.observacao,
        };
      })
      .filter((item): item is { movimentacaoId: string; pessoa: Pessoa; entradaEm: string; observacao: string } => item !== null && item.pessoa !== undefined)
      .sort((a, b) => new Date(b.entradaEm).getTime() - new Date(a.entradaEm).getTime());
  }, [movimentacoes, pessoas, empresaAtual]);

  const getHistoricoMovimentacoes = useCallback((filtros?: HistoricoFiltros): MovimentacaoComPessoa[] => {

    if (!empresaAtual) {
      return [];
    }

    let resultado = movimentacoes
      .filter(m => m.empresa_id === empresaAtual.id)
      .map(m => {
        const pessoa = pessoas.find(p => p.id === m.pessoa_id);
        if (!pessoa) return null;
        return { ...m, pessoa };
      })
      .filter((item): item is MovimentacaoComPessoa => item !== null);


    if (filtros) {
      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        resultado = resultado.filter(m => new Date(m.entrada_em) >= inicio);
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        fim.setHours(23, 59, 59, 999);
        resultado = resultado.filter(m => new Date(m.entrada_em) <= fim);
      }
      if (filtros.nome) {
        const nome = filtros.nome.toLowerCase();
        resultado = resultado.filter(m => m.pessoa.nome.toLowerCase().includes(nome));
      }
      if (filtros.documento) {
        resultado = resultado.filter(m => m.pessoa.documento.includes(filtros.documento!));
      }
      if (filtros.placa) {
        const placa = filtros.placa.toLowerCase();
        resultado = resultado.filter(m => m.pessoa.placa?.toLowerCase().includes(placa));
      }
    }

    const resultadoFinal = resultado.sort((a, b) => new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime());

    return resultadoFinal;
  }, [movimentacoes, pessoas, empresaAtual]);

  // Pessoa actions
  const excluirPessoa = useCallback(async (pessoaId: string): Promise<void> => {
    if (!authUser?.profile) {
      throw new Error('Usuário não autenticado');
    }

    try {
      // Verificar se a pessoa pertence à empresa do usuário
      const pessoa = pessoas.find(p => p.id === pessoaId);
      if (!pessoa) {
        throw new Error('Pessoa não encontrada');
      }

      if (pessoa.empresa_id !== authUser.profile.empresa_id) {
        throw new Error('Permissão negada: pessoa não pertence à sua empresa');
      }

      // Verificar se há movimentações ativas para esta pessoa
      const movimentacoesAtivas = movimentacoes.filter(m => 
        m.pessoa_id === pessoaId && m.status === 'DENTRO'
      );

      if (movimentacoesAtivas.length > 0) {
        throw new Error('Não é possível excluir uma pessoa que tem movimentações ativas (dentro da marina)');
      }

      // Verificar se há movimentações associadas (para evitar violação de chave estrangeira)
      const movimentacoesAssociadas = movimentacoes.filter(m => m.pessoa_id === pessoaId);

      if (movimentacoesAssociadas.length > 0) {
        // Tentar excluir as movimentações primeiro
        const { error: deleteMovimentacoesError } = await supabase
          .from('movimentacoes')
          .delete()
          .eq('pessoa_id', pessoaId);

        if (deleteMovimentacoesError) {
          throw new Error('Erro ao remover movimentações associadas. Não é possível excluir a pessoa.');
        }

        // Atualizar estado local das movimentações
        setMovimentacoes(prev => prev.filter(m => m.pessoa_id !== pessoaId));
      }

      const { error } = await supabase
        .from('pessoas')
        .delete()
        .eq('id', pessoaId);

      if (error) throw error;

      setPessoas(prev => prev.filter(p => p.id !== pessoaId));
      
      toast.success('Pessoa excluída com sucesso!');
    } catch (err) {
      const errorMessage = err.message || 'Erro ao excluir pessoa';
      toast.error(errorMessage);
      throw err;
    }
  }, [authUser?.profile, pessoas, movimentacoes]);

  // User management actions
  const adicionarUsuario = useCallback(async (data: { nome: string; email: string; senha: string; empresa_id: string; role?: 'user' | 'admin' | 'owner' }): Promise<void> => {
    try {

      // Validar permissões - apenas owner pode adicionar usuários
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        toast.error('Apenas proprietários podem adicionar usuários');
        throw new Error('Permissão negada');
      }


      // Validar dados
      if (!data.email || !data.senha || !data.nome) {
        throw new Error('Email, senha e nome são obrigatórios');
      }


      // Fazer o signup
      const result = await signUp({
        email: data.email,
        password: data.senha,
        nome: data.nome,
        empresa_id: data.empresa_id,
        role: data.role || 'user'
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conta');
      }

      
      // Mostrar mensagem adicional
      toast.info(`Novo usuário criado! Email de confirmação enviado para ${data.email}`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao adicionar usuário';
      
      // Verificar se é erro de email já existente
      if (errorMessage.includes('already registered') || errorMessage.includes('User already exists')) {
        toast.error('Este email já está registrado no sistema');
      } else if (errorMessage.includes('password')) {
        toast.error('Senha fraca. Use pelo menos 8 caracteres');
      } else {
        toast.error(errorMessage);
      }
      
      throw err;
    }
  }, [authUser?.profile?.role, signUp]);

  const removerUsuario = useCallback(async (usuarioId: string): Promise<void> => {
    try {

      // Validar permissões - apenas owner pode remover usuários
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        toast.error('Apenas proprietários podem remover usuários');
        throw new Error('Permissão negada');
      }

      // Como não temos acesso admin completo, apenas avisar que não é possível
      toast.error('Remoção de usuários requer acesso administrativo ao Supabase Dashboard');
      throw new Error('Operação não disponível nesta versão');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao remover usuário';
      if (!errorMessage.includes('Erro ao') && !errorMessage.includes('sucesso')) {
        toast.error(errorMessage);
      }
      throw err;
    }
  }, [authUser?.profile?.role]);

  const alterarSenhaUsuario = useCallback(async (usuarioId: string, novaSenha: string): Promise<void> => {
    try {

      // Validar permissões - apenas owner pode alterar senhas
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        toast.error('Apenas proprietários podem alterar senhas');
        throw new Error('Permissão negada');
      }

      // Como não temos acesso admin completo, apenas avisar que não é possível
      toast.error('Alteração de senha requer acesso administrativo ao Supabase Dashboard');
      throw new Error('Operação não disponível nesta versão');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao alterar senha';
      if (!errorMessage.includes('Erro ao') && !errorMessage.includes('sucesso')) {
        toast.error(errorMessage);
      }
      throw err;
    }
  }, [authUser?.profile?.role]);

  const deletarEmpresa = useCallback(async (empresaId: string): Promise<void> => {
    try {

      // Verificar se o usuário é owner
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        toast.error('Apenas owners podem deletar empresas');
        throw new Error('Permissão negada');
      }

      // Verificar se há usuários associados a esta empresa
      const { data: usuariosAssociados, error: usuariosError } = await supabase
        .from('user_profiles')
        .select('id, nome')
        .eq('empresa_id', empresaId);

      if (usuariosError) {
        throw usuariosError;
      }

      if (usuariosAssociados && usuariosAssociados.length > 0) {
        const nomesUsuarios = usuariosAssociados.map(u => u.nome).join(', ');
        throw new Error(`Não é possível deletar a empresa porque há ${usuariosAssociados.length} usuário(s) associado(s): ${nomesUsuarios}. Remova todos os usuários primeiro.`);
      }

      // Verificar se há pessoas associadas (opcional - pode deletar em cascata)
      const { data: pessoasAssociadas, error: pessoasError } = await supabase
        .from('pessoas')
        .select('id, nome')
        .eq('empresa_id', empresaId);

      if (pessoasError) {
        throw pessoasError;
      }

      if (pessoasAssociadas && pessoasAssociadas.length > 0) {
        const nomesPessoas = pessoasAssociadas.map(p => p.nome).join(', ');
        throw new Error(`Não é possível deletar a empresa porque há ${pessoasAssociadas.length} pessoa(s) cadastrada(s): ${nomesPessoas}. Remova todas as pessoas primeiro.`);
      }

      // Deletar empresa
      const { error: deleteError } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresaId);

      if (deleteError) throw deleteError;

      // Atualizar estado local
      setEmpresas(prev => prev.filter(e => e.id !== empresaId));

      toast.success('Empresa deletada com sucesso!');

    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao deletar empresa';
      toast.error(errorMessage);
      throw err;
    }
  }, [authUser]);

  const getUsuarios = useCallback(async (): Promise<AppUser[]> => {
    try {

      // Tentar buscar usuários reais da tabela user_profiles
      try {
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('id, nome, empresa_id, role, created_at');

        if (error) {
          throw error;
        }

        if (profiles && profiles.length > 0) {
          
          // Filtrar usuários por permissão
          let usuariosFiltrados = profiles;
          
          // Se não é owner, filtrar apenas usuários da mesma empresa
          if (authUser?.profile?.role !== 'owner') {
            usuariosFiltrados = profiles.filter(p => p.empresa_id === authUser?.profile?.empresa_id);
          }
          
          // Converter para AppUser
          const usuarios: AppUser[] = usuariosFiltrados.map(profile => ({
            id: profile.id,
            nome: profile.nome,
            email: profile.id,
            empresa_id: profile.empresa_id,
            role: profile.role as 'user' | 'admin' | 'owner',
            created_at: profile.created_at
          }));
          
          return usuarios;
        }
      } catch (dbErr) {
      }

      // Fallback: Retornar usuários hardcoded filtrados por empresa
      
      const hardcodedUsuarios: AppUser[] = Object.entries({
        // Administradores por marina
        'admin@gloria.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Glória',
          empresa_id: 'gloria'
        },
        'admin@verolme.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Verolme',
          empresa_id: 'verolme'
        },
        'admin@piratas.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Piratas',
          empresa_id: 'piratas'
        },
        'admin@bracuhy.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Bracuhy JL',
          empresa_id: 'bracuhy_jl'
        },
        'admin@ribeira.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Ribeira',
          empresa_id: 'ribeira'
        },
        'admin@itacuruca.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Itacuruçá',
          empresa_id: 'itacuruca'
        },
        'admin@buzios.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Búzios',
          empresa_id: 'buzios'
        },
        'admin@paraty.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Paraty',
          empresa_id: 'paraty'
        },
        'admin@boavista.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Boavista',
          empresa_id: 'boavista'
        },
        'admin@piccola.com': {
          password: 'admin123',
          role: 'admin' as const,
          nome: 'Admin Piccola',
          empresa_id: 'piccola'
        },

        // Usuários comuns
        'user@gloria.com': {
          password: 'user123',
          role: 'user' as const,
          nome: 'Usuário Glória',
          empresa_id: 'gloria'
        },
        'user@verolme.com': {
          password: 'user123',
          role: 'user' as const,
          nome: 'Usuário Verolme',
          empresa_id: 'verolme'
        },

        // Owner (super admin)
        'juan.reis@brmarinas.com.br': {
          password: 'j@9738gt',
          role: 'owner' as const,
          nome: 'Super Admin BR Marinas',
          empresa_id: 'br_marinas'
        }
      }).map(([email, data]) => ({
        id: email,
        nome: data.nome,
        email: email,
        empresa_id: data.empresa_id,
        role: data.role,
        created_at: new Date().toISOString()
      }));

      // Filtrar por empresa se não for owner
      let usuariosFiltrados = hardcodedUsuarios;
      if (authUser?.profile?.role !== 'owner') {
        usuariosFiltrados = hardcodedUsuarios.filter(u => u.empresa_id === authUser?.profile?.empresa_id);
      }

      return usuariosFiltrados;
    } catch (err) {
      toast.error('Erro ao carregar usuários');
      throw err;
    }
  }, [authUser?.profile?.role, authUser?.profile?.empresa_id]);

  const value: MarinaContextType = useMemo(() => ({
    // Auth state from useAuth
    user: authUser?.profile || null,
    isAuthenticated,
    authLoading,

    // Business state
    empresas,
    pessoas,
    movimentacoes,
    empresaAtual,
    businessLoading,

    // Auth actions
    login,
    logout,

    // Business actions
    cadastrarPessoa,
    buscarPessoaPorDocumento,
    atualizarPessoa,
    excluirPessoa,
    registrarEntrada,
    registrarSaida,
    atualizarMovimentacao,
    excluirMovimentacao,
    adicionarUsuario,
    removerUsuario,
    alterarSenhaUsuario,
    deletarEmpresa,
    getPessoasDentro,
    getHistoricoMovimentacoes,
    podeEntrar,
    getUsuarios,
    refreshPessoas,
  }), [
    // Auth state
    authUser?.profile,
    isAuthenticated,
    authLoading,

    // Business state
    empresas,
    pessoas,
    movimentacoes,
    empresaAtual,
    businessLoading,

    // Actions
    login,
    logout,
    cadastrarPessoa,
    buscarPessoaPorDocumento,
    atualizarPessoa,
    excluirPessoa,
    registrarEntrada,
    registrarSaida,
    atualizarMovimentacao,
    excluirMovimentacao,
    adicionarUsuario,
    removerUsuario,
    alterarSenhaUsuario,
    deletarEmpresa,
    getPessoasDentro,
    getHistoricoMovimentacoes,
    podeEntrar,
    getUsuarios,
  ]);

  return (
    <MarinaContext.Provider value={value}>
      {children}
    </MarinaContext.Provider>
  );
}

export function useMarina() {
  const context = useContext(MarinaContext);
  if (context === undefined) {
    throw new Error('useMarina must be used within a MarinaProvider');
  }
  return context;
}