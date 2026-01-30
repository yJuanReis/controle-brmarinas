import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { Empresa, Pessoa, Movimentacao, PessoaDentro, NovaPessoaForm, MovimentacaoComPessoa, AppUser } from '@/types/marina';
import { supabase } from '@/lib/supabase';
import { useAuth, UserProfile } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { auditService } from '@/services/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';

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

  // Movimentação actions
  registrarEntrada: (pessoaId: string, observacao?: string) => Promise<{ success: boolean; error?: string }>;
  registrarSaida: (movimentacaoId: string, saidaEm?: string, observacao?: string) => Promise<{ success: boolean; error?: string }>;

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
}

interface HistoricoFiltros {
  dataInicio?: string;
  dataFim?: string;
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

  console.log('[MarinaContext] authUser:', authUser);
  console.log('[MarinaContext] authUser?.profile:', authUser?.profile);
  console.log('[MarinaContext] authUser?.profile?.role:', authUser?.profile?.role);
  console.log('[MarinaContext] isAuthenticated:', isAuthenticated);
  console.log('[MarinaContext] empresaAtual:', empresaAtual);

  // Load business data when user changes
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

        console.log(`📍 Carregando dados para empresa: ${empresaId}`);

        // Load pessoas and movimentacoes in parallel
        const [pessoasResult, movimentacoesResult] = await Promise.all([
          supabase.from('pessoas').select('*'),
          supabase.from('movimentacoes').select('*').eq('empresa_id', empresaId)
        ]);

        if (pessoasResult.error) {
          console.error('❌ Erro ao carregar pessoas:', pessoasResult.error);
          // Não lançar erro, apenas logar
        }
        if (movimentacoesResult.error) {
          console.error('❌ Erro ao carregar movimentações:', movimentacoesResult.error);
          // Não lançar erro, apenas logar
        }

        setPessoas(pessoasResult.data || []);
        setMovimentacoes(movimentacoesResult.data || []);

        console.log(`✅ Dados carregados: ${pessoasResult.data?.length || 0} pessoas, ${movimentacoesResult.data?.length || 0} movimentações`);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        // Não mostrar toast de erro para evitar spam
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
          console.log('📍 Usando empresas hardcoded');
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
        console.error('❌ Erro ao carregar empresas:', error);
        // Fallback: usar empresas hardcoded
        console.log('📍 Fallback: usando empresas hardcoded');
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
      
      // Registrar auditoria
      await auditService.logAction(
        AuditAction.CADASTRAR_PESSOA,
        AuditEntityType.PESSOA,
        novaPessoa.id,
        novaPessoa.nome,
        {
          before: null,
          after: {
            nome: novaPessoa.nome,
            documento: novaPessoa.documento,
            tipo: novaPessoa.tipo,
            contato: novaPessoa.contato,
            placa: novaPessoa.placa,
            empresa_id: novaPessoa.empresa_id
          }
        }
      );

      toast.success('Pessoa cadastrada com sucesso!');
      return novaPessoa;
    } catch (err) {
      console.error('Erro ao cadastrar pessoa:', err);
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
      
      // Registrar auditoria
      await auditService.logAction(
        AuditAction.UPDATE,
        AuditEntityType.PESSOA,
        pessoaAtualizada.id,
        pessoaAtualizada.nome,
        {
          before: pessoaAntiga ? {
            nome: pessoaAntiga.nome,
            documento: pessoaAntiga.documento,
            tipo: pessoaAntiga.tipo,
            contato: pessoaAntiga.contato,
            placa: pessoaAntiga.placa
          } : null,
          after: {
            nome: pessoaAtualizada.nome,
            documento: pessoaAtualizada.documento,
            tipo: pessoaAtualizada.tipo,
            contato: pessoaAtualizada.contato,
            placa: pessoaAtualizada.placa
          }
        }
      );

      toast.success('Pessoa atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar pessoa:', err);
      toast.error('Erro ao atualizar pessoa');
      throw err;
    }
  }, [pessoas]);

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
      
      // Registrar auditoria
      await auditService.logAction(
        AuditAction.ENTRADA,
        AuditEntityType.MOVIMENTACAO,
        novaMovimentacao.id,
        pessoa?.nome || 'Visitante',
        {
          before: null,
          after: {
            pessoa_id: novaMovimentacao.pessoa_id,
            empresa_id: novaMovimentacao.empresa_id,
            entrada_em: novaMovimentacao.entrada_em,
            status: novaMovimentacao.status,
            observacao: novaMovimentacao.observacao
          }
        }
      );

      return { success: true };
    } catch (err) {
      console.error('Erro ao registrar entrada:', err);
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

      const updateData: any = {
        status: 'FORA',
      };

      // Usar horário personalizado se fornecido, senão usar horário atual
      if (saidaEm) {
        updateData.saida_em = new Date(saidaEm).toISOString();
      } else {
        updateData.saida_em = new Date().toISOString();
      }

      // Adicionar observação se fornecida
      if (observacao !== undefined) {
        updateData.observacao = observacao?.trim() || null;
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
      
      // Registrar auditoria
      await auditService.logAction(
        AuditAction.SAIDA,
        AuditEntityType.MOVIMENTACAO,
        movimentacaoAtualizada.id,
        pessoa?.nome || 'Visitante',
        {
          before: {
            pessoa_id: movimentacao.pessoa_id,
            empresa_id: movimentacao.empresa_id,
            entrada_em: movimentacao.entrada_em,
            status: movimentacao.status,
            observacao: movimentacao.observacao,
            saida_em: movimentacao.saida_em
          },
          after: {
            pessoa_id: movimentacaoAtualizada.pessoa_id,
            empresa_id: movimentacaoAtualizada.empresa_id,
            entrada_em: movimentacaoAtualizada.entrada_em,
            status: movimentacaoAtualizada.status,
            observacao: movimentacaoAtualizada.observacao,
            saida_em: movimentacaoAtualizada.saida_em
          }
        }
      );

      return { success: true };
    } catch (err) {
      console.error('Erro ao registrar saída:', err);
      toast.error('Erro ao registrar saída');
      return { success: false, error: 'Erro interno' };
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
    console.log('🔍 [MarinaContext] getHistoricoMovimentacoes chamado');
    console.log('🔍 [MarinaContext] Empresa atual:', empresaAtual?.id);
    console.log('🔍 [MarinaContext] Total movimentacoes no estado:', movimentacoes.length);
    console.log('🔍 [MarinaContext] Total pessoas no estado:', pessoas.length);
    console.log('🔍 [MarinaContext] Filtros recebidos:', filtros);

    if (!empresaAtual) {
      console.log('❌ [MarinaContext] Sem empresa atual, retornando vazio');
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

    console.log('🔍 [MarinaContext] Movimentações após filtro empresa:', resultado.length);

    if (filtros) {
      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        console.log('🔍 [MarinaContext] Aplicando filtro dataInicio:', inicio);
        resultado = resultado.filter(m => new Date(m.entrada_em) >= inicio);
      }
      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        fim.setHours(23, 59, 59, 999);
        console.log('🔍 [MarinaContext] Aplicando filtro dataFim:', fim);
        resultado = resultado.filter(m => new Date(m.entrada_em) <= fim);
      }
      if (filtros.nome) {
        const nome = filtros.nome.toLowerCase();
        console.log('🔍 [MarinaContext] Aplicando filtro nome:', nome);
        resultado = resultado.filter(m => m.pessoa.nome.toLowerCase().includes(nome));
      }
      if (filtros.documento) {
        console.log('🔍 [MarinaContext] Aplicando filtro documento:', filtros.documento);
        resultado = resultado.filter(m => m.pessoa.documento.includes(filtros.documento!));
      }
      if (filtros.placa) {
        const placa = filtros.placa.toLowerCase();
        console.log('🔍 [MarinaContext] Aplicando filtro placa:', placa);
        resultado = resultado.filter(m => m.pessoa.placa?.toLowerCase().includes(placa));
      }
    }

    const resultadoFinal = resultado.sort((a, b) => new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime());
    console.log('✅ [MarinaContext] Retornando resultado final:', resultadoFinal.length);

    return resultadoFinal;
  }, [movimentacoes, pessoas, empresaAtual]);

  // User management actions
  const adicionarUsuario = useCallback(async (data: { nome: string; email: string; senha: string; empresa_id: string; role?: 'user' | 'admin' | 'owner' }): Promise<void> => {
    try {
      console.log('[MarinaContext] 🔄 Iniciando adição de novo usuário:', data.email);

      // Validar permissões - apenas owner pode adicionar usuários
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        console.error('[MarinaContext] ❌ Usuário não tem permissão (não é owner)');
        toast.error('Apenas proprietários podem adicionar usuários');
        throw new Error('Permissão negada');
      }

      console.log('[MarinaContext] ✅ Verificação de permissão passou');

      // Validar dados
      if (!data.email || !data.senha || !data.nome) {
        throw new Error('Email, senha e nome são obrigatórios');
      }

      console.log('[MarinaContext] ✅ Validação de dados passou');

      // Fazer o signup
      console.log('[MarinaContext] 📝 Chamando signUp...');
      const result = await signUp({
        email: data.email,
        password: data.senha,
        nome: data.nome,
        empresa_id: data.empresa_id,
        role: data.role || 'user'
      });

      if (!result.success) {
        console.error('[MarinaContext] ❌ signUp falhou:', result.error);
        throw new Error(result.error || 'Erro ao criar conta');
      }

      console.log('[MarinaContext] ✅ Usuário criado com sucesso');
      console.log('[MarinaContext] 📧 Email de confirmação enviado para:', data.email);
      
      // Mostrar mensagem adicional
      toast.info(`Novo usuário criado! Email de confirmação enviado para ${data.email}`);
      
    } catch (err: any) {
      console.error('[MarinaContext] ❌ Erro ao adicionar usuário:', err);
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
      console.log('[MarinaContext] Removendo usuário:', usuarioId);

      // Validar permissões - apenas owner pode remover usuários
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        toast.error('Apenas proprietários podem remover usuários');
        throw new Error('Permissão negada');
      }

      // Como não temos acesso admin completo, apenas avisar que não é possível
      toast.error('Remoção de usuários requer acesso administrativo ao Supabase Dashboard');
      throw new Error('Operação não disponível nesta versão');
    } catch (err: any) {
      console.error('[MarinaContext] Erro ao remover usuário:', err);
      const errorMessage = err.message || 'Erro ao remover usuário';
      if (!errorMessage.includes('Erro ao') && !errorMessage.includes('sucesso')) {
        toast.error(errorMessage);
      }
      throw err;
    }
  }, [authUser?.profile?.role]);

  const alterarSenhaUsuario = useCallback(async (usuarioId: string, novaSenha: string): Promise<void> => {
    try {
      console.log('[MarinaContext] Alterando senha do usuário:', usuarioId);

      // Validar permissões - apenas owner pode alterar senhas
      if (!authUser?.profile || authUser.profile.role !== 'owner') {
        toast.error('Apenas proprietários podem alterar senhas');
        throw new Error('Permissão negada');
      }

      // Como não temos acesso admin completo, apenas avisar que não é possível
      toast.error('Alteração de senha requer acesso administrativo ao Supabase Dashboard');
      throw new Error('Operação não disponível nesta versão');
    } catch (err: any) {
      console.error('[MarinaContext] Erro ao alterar senha:', err);
      const errorMessage = err.message || 'Erro ao alterar senha';
      if (!errorMessage.includes('Erro ao') && !errorMessage.includes('sucesso')) {
        toast.error(errorMessage);
      }
      throw err;
    }
  }, [authUser?.profile?.role]);

  const deletarEmpresa = useCallback(async (empresaId: string): Promise<void> => {
    try {
      console.log('[MarinaContext] Deletando empresa...', empresaId);

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
        console.error('[MarinaContext] Erro ao verificar usuários:', usuariosError);
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
        console.error('[MarinaContext] Erro ao verificar pessoas:', pessoasError);
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

      console.log('[MarinaContext] ✅ Empresa deletada com sucesso');
      toast.success('Empresa deletada com sucesso!');

    } catch (err) {
      console.error('[MarinaContext] Erro ao deletar empresa:', err);
      const errorMessage = err.message || 'Erro desconhecido ao deletar empresa';
      toast.error(errorMessage);
      throw err;
    }
  }, [authUser]);

  const getUsuarios = useCallback(async (): Promise<AppUser[]> => {
    try {
      console.log('[MarinaContext] Buscando usuários do Supabase...');

      // Tentar buscar usuários reais da tabela user_profiles
      try {
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('id, nome, empresa_id, role, created_at');

        if (error) {
          console.log('[MarinaContext] Erro ao buscar user_profiles:', error);
        } else if (profiles && profiles.length > 0) {
          console.log('[MarinaContext] Usuários encontrados em user_profiles:', profiles.length);
          
          // Filtrar usuários por permissão
          let usuariosFiltrados = profiles;
          
          // Se não é owner, filtrar apenas usuários da mesma empresa
          if (authUser?.profile?.role !== 'owner') {
            console.log('[MarinaContext] Filtrando usuários pela empresa:', authUser?.profile?.empresa_id);
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
          
          console.log('[MarinaContext] Retornando usuários do DB:', usuarios.length);
          return usuarios;
        } else {
          console.log('[MarinaContext] Nenhum usuário encontrado em user_profiles');
        }
      } catch (dbErr) {
        console.log('[MarinaContext] Exceção ao buscar user_profiles:', dbErr);
      }

      // Fallback: Retornar usuários hardcoded filtrados por empresa
      console.log('[MarinaContext] Usando usuários hardcoded como fallback...');
      
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
        console.log('[MarinaContext] Filtrando fallback pela empresa:', authUser?.profile?.empresa_id);
        usuariosFiltrados = hardcodedUsuarios.filter(u => u.empresa_id === authUser?.profile?.empresa_id);
      }

      console.log(`[MarinaContext] Retornando ${usuariosFiltrados.length} usuários (fallback)`);
      return usuariosFiltrados;
    } catch (err) {
      console.error('[MarinaContext] Erro crítico na função getUsuarios:', err);
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
    registrarEntrada,
    registrarSaida,
    adicionarUsuario,
    removerUsuario,
    alterarSenhaUsuario,
    deletarEmpresa,
    getPessoasDentro,
    getHistoricoMovimentacoes,
    podeEntrar,
    getUsuarios,
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
    registrarEntrada,
    registrarSaida,
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
    console.error('❌ useMarina called outside MarinaProvider');
    throw new Error('useMarina must be used within a MarinaProvider');
  }
  return context;
}