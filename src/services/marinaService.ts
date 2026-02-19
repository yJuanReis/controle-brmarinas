// Final
import { supabase } from '@/lib/supabase';
import { Movimentacao, PessoaDentro, Pessoa } from '@/types/marina';

/**
 * Serviço de gerenciamento de marina com funções de saída automática
 */
export class MarinaService {
  private static instance: MarinaService;

  private constructor() {}

  public static getInstance(): MarinaService {
    if (!MarinaService.instance) {
      MarinaService.instance = new MarinaService();
    }
    return MarinaService.instance;
  }

  /**
   * Executa saída automática para todas as pessoas que ultrapassaram o tempo limite
   * VERSÃO OTIMIZADA com bulk operations para melhor performance
   * @param empresaId ID da empresa
   * @param tempoLimiteHoras Tempo limite em horas (padrão: 8 horas)
   * @returns Quantidade de pessoas que tiveram saída registrada automaticamente
   */
  public async executarSaidaAutomatica(empresaId: string, tempoLimiteHoras: number = 13): Promise<number> {
    try {
      console.log(`[MarinaService] Executando saída automática para empresa ${empresaId} com limite de ${tempoLimiteHoras} horas`);

      // Obter TODAS as movimentações ativas da empresa (com índice otimizado)
      // Nota: Para escalas muito grandes, considere paginar esta query
      const { data: movimentacoesAtivas, error } = await supabase
        .from('movimentacoes')
        .select('id, entrada_em, observacao')
        .eq('empresa_id', empresaId)
        .eq('status', 'DENTRO');

      if (error) {
        console.error('[MarinaService] Erro ao buscar movimentações ativas:', error);
        throw error;
      }

      const count = movimentacoesAtivas?.length || 0;
      console.log(`[MarinaService] Movimentações ativas encontradas: ${count}`);

      if (count === 0) {
        return 0;
      }

      const tempoLimiteMs = tempoLimiteHoras * 60 * 60 * 1000;
      const agora = new Date().toISOString();

      // Identificar movimentações que ultrapassaram o limite
      const movimentacoesParaSair = movimentacoesAtivas!.filter(m => {
        const tempoDecorrido = new Date().getTime() - new Date(m.entrada_em).getTime();
        return tempoDecorrido >= tempoLimiteMs;
      });

      console.log(`[MarinaService] Movimentações que ultrapassaram limite: ${movimentacoesParaSair.length}`);

      if (movimentacoesParaSair.length === 0) {
        return 0;
      }

      // BULK UPDATE - Atualizar todas de uma vez (MUITO mais rápido!)
      const observacaoPadrao = `Saída automática após ${tempoLimiteHoras}h`;

      const updates = movimentacoesParaSair.map(m => {
        const observacaoOriginal = m.observacao || '';
        const observacaoFinal = observacaoOriginal 
          ? `${observacaoOriginal} | ${observacaoPadrao}`
          : observacaoPadrao;

        return {
          id: m.id,
          status: 'FORA',
          saida_em: agora,
          observacao: observacaoFinal
        };
      });

      // Usar upsert para bulk update (Supabase suporta até 1000 por operação)
      if (updates.length > 0) {
        const { error: bulkError } = await supabase
          .from('movimentacoes')
          .upsert(updates, { onConflict: 'id' });

        if (bulkError) {
          console.error('[MarinaService] Erro no bulk update:', bulkError);
          throw bulkError;
        }

        console.log(`[MarinaService] Bulk update concluído: ${updates.length} registros`);
      }

      return movimentacoesParaSair.length;
    } catch (error) {
      console.error('[MarinaService] Erro ao executar saída automática:', error);
      throw error;
    }
  }

  /**
   * Verifica pessoas que estão próximas do limite de tempo
   * @param empresaId ID da empresa
   * @param tempoLimiteHoras Tempo limite em horas
   * @param alertaHoras Horas antes do limite para considerar "próximo"
   * @returns Lista de pessoas próximas do limite
   */
  public async verificarPessoasProximasDoLimite(
    empresaId: string, 
    tempoLimiteHoras: number = 8, 
    alertaHoras: number = 1
  ): Promise<PessoaDentro[]> {
    try {
      const { data: movimentacoesAtivas, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'DENTRO');

      if (error) {
        throw error;
      }

      if (!movimentacoesAtivas || movimentacoesAtivas.length === 0) {
        return [];
      }

      const tempoLimiteMs = tempoLimiteHoras * 60 * 60 * 1000;
      const tempoAlertaMs = (tempoLimiteHoras - alertaHoras) * 60 * 60 * 1000;
      const agora = new Date();
      const pessoasProximas: PessoaDentro[] = [];

      for (const movimentacao of movimentacoesAtivas) {
        const tempoDecorrido = agora.getTime() - new Date(movimentacao.entrada_em).getTime();
        
        // Considerar próximas se estiverem no intervalo de alerta
        if (tempoDecorrido >= tempoAlertaMs && tempoDecorrido < tempoLimiteMs) {
          // Buscar dados da pessoa
          const { data: pessoa, error: pessoaError } = await supabase
            .from('pessoas')
            .select('*')
            .eq('id', movimentacao.pessoa_id)
            .single();

          if (pessoaError) {
            continue;
          }

          if (pessoa) {
            pessoasProximas.push({
              movimentacaoId: movimentacao.id,
              pessoa: pessoa,
              entradaEm: movimentacao.entrada_em,
              observacao: movimentacao.observacao
            });
          }
        }
      }

      return pessoasProximas;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém estatísticas de tempo de permanência
   * @param empresaId ID da empresa
   * @param tempoLimiteHoras Tempo limite em horas
   * @returns Estatísticas de permanência
   */
  public async getEstatisticasPermanencia(empresaId: string, tempoLimiteHoras: number = 8): Promise<{
    totalDentro: number;
    proximosDoLimite: number;
    acimaDoLimite: number;
    tempoMedio: number;
  }> {
    try {
      const { data: movimentacoesAtivas, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'DENTRO');

      if (error) {
        throw error;
      }

      if (!movimentacoesAtivas || movimentacoesAtivas.length === 0) {
        return {
          totalDentro: 0,
          proximosDoLimite: 0,
          acimaDoLimite: 0,
          tempoMedio: 0
        };
      }

      const tempoLimiteMs = tempoLimiteHoras * 60 * 60 * 1000;
      const tempoAlertaMs = (tempoLimiteHoras - 1) * 60 * 60 * 1000; // 1 hora antes do limite
      const agora = new Date();
      let totalTempo = 0;
      let proximosDoLimite = 0;
      let acimaDoLimite = 0;

      for (const movimentacao of movimentacoesAtivas) {
        const tempoDecorrido = agora.getTime() - new Date(movimentacao.entrada_em).getTime();
        totalTempo += tempoDecorrido;

        if (tempoDecorrido >= tempoAlertaMs && tempoDecorrido < tempoLimiteMs) {
          proximosDoLimite++;
        } else if (tempoDecorrido >= tempoLimiteMs) {
          acimaDoLimite++;
        }
      }

      const tempoMedio = movimentacoesAtivas.length > 0 
        ? totalTempo / movimentacoesAtivas.length 
        : 0;

      return {
        totalDentro: movimentacoesAtivas.length,
        proximosDoLimite,
        acimaDoLimite,
        tempoMedio: Math.floor(tempoMedio / (1000 * 60 * 60)) // Em horas
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca todas as movimentações de uma empresa com paginação
   * Contorna o limite de 1000 registros do Supabase
   * @param empresaId ID da empresa
   * @returns Lista de todas as movimentações
   */
  public async getMovimentacoesPorEmpresa(empresaId: string): Promise<Movimentacao[]> {
    try {
      console.log(`[MarinaService] Buscando todas as movimentações via RPC para empresa ${empresaId}`);

      const BATCH_SIZE = 1000;
      let offset = 0;
      let todasMovimentacoes: Movimentacao[] = [];
      let temMaisRegistros = true;

      // Fazer requisições sequenciais até não haver mais registros
      while (temMaisRegistros) {
        const { data, error } = await supabase
          .rpc('get_movimentacoes_por_empresa', {
            p_empresa_id: empresaId,
            p_limit: BATCH_SIZE,
            p_offset: offset
          });

        if (error) {
          console.error('[MarinaService] Erro ao buscar movimentações via RPC:', JSON.stringify(error, null, 2));
          throw error;
        }

        const batch = data || [];
        console.log(`[MarinaService] Batch movimentações offset ${offset}: ${batch.length} registros`);

        if (batch.length === 0 || batch.length < BATCH_SIZE) {
          todasMovimentacoes = [...todasMovimentacoes, ...batch];
          temMaisRegistros = false;
        } else {
          todasMovimentacoes = [...todasMovimentacoes, ...batch];
          offset += BATCH_SIZE;
        }
      }

      console.log(`[MarinaService] Total de movimentações encontradas: ${todasMovimentacoes.length}`);
      return todasMovimentacoes;
    } catch (error) {
      console.error('[MarinaService] Erro ao buscar movimentações por empresa:', error);
      throw error;
    }
  }

  /**
   * Busca movimentações por período usando RPC com paginação
   * Esta função contorna o limite de 1000 registros do Supabase
   * fazendo múltiplas requisições até buscar todos os registros
   * @param empresaId ID da empresa
   * @param dataInicio Data/hora de início do período
   * @param dataFim Data/hora de fim do período
   * @param incluirExcluidas Se true, inclui movimentações marcadas como excluídas
   * @returns Lista de movimentações no período
   */
  public async getMovimentacoesPorPeriodo(
    empresaId: string,
    dataInicio: string,
    dataFim: string,
    incluirExcluidas: boolean = false
  ): Promise<Movimentacao[]> {
    try {
      console.log(`[MarinaService] Buscando movimentações via RPC para empresa ${empresaId}`);
      console.log(`[MarinaService] Período: ${dataInicio} até ${dataFim}`);

      const BATCH_SIZE = 1000;
      let offset = 0;
      let todasMovimentacoes: Movimentacao[] = [];
      let temMaisRegistros = true;

      // Fazer requisições sequenciais até não haver mais registros
      while (temMaisRegistros) {
        const { data, error } = await supabase
          .rpc('get_movimentacoes_por_periodo', {
            p_empresa_id: empresaId,
            p_data_inicio: dataInicio,
            p_data_fim: dataFim,
            p_limit: BATCH_SIZE,
            p_offset: offset,
            p_incluir_excluidas: incluirExcluidas
          });

        if (error) {
          console.error('[MarinaService] Erro ao buscar movimentações via RPC:', JSON.stringify(error, null, 2));
          throw error;
        }

        const batch = data || [];
        console.log(`[MarinaService] Batch offset ${offset}: ${batch.length} registros`);

        if (batch.length === 0 || batch.length < BATCH_SIZE) {
          // último batch ou结果 vazio
          todasMovimentacoes = [...todasMovimentacoes, ...batch];
          temMaisRegistros = false;
        } else {
          // Há mais registros para buscar
          todasMovimentacoes = [...todasMovimentacoes, ...batch];
          offset += BATCH_SIZE;
        }
      }

      console.log(`[MarinaService] Total de movimentações encontradas: ${todasMovimentacoes.length}`);
      return todasMovimentacoes;
    } catch (error) {
      console.error('[MarinaService] Erro ao buscar movimentações por período:', error);
      throw error;
    }
  }

  /**
   * Busca todas as pessoas de uma empresa usando paginação
   * Contorna o limite de 1000 registros do Supabase
   * @param empresaId ID da empresa
   * @returns Lista de todas as pessoas
   */
  public async getPessoasPorEmpresa(empresaId: string): Promise<Pessoa[]> {
    try {
      console.log(`[MarinaService] Buscando todas as pessoas via RPC para empresa ${empresaId}`);

      const BATCH_SIZE = 1000;
      let offset = 0;
      let todasPessoas: Pessoa[] = [];
      let temMaisRegistros = true;

      // Fazer requisições sequenciais até não haver mais registros
      while (temMaisRegistros) {
        const { data, error } = await supabase
          .rpc('get_pessoas_por_empresa', {
            p_empresa_id: empresaId,
            p_limit: BATCH_SIZE,
            p_offset: offset
          });

        if (error) {
          console.error('[MarinaService] Erro ao buscar pessoas via RPC:', JSON.stringify(error, null, 2));
          throw error;
        }

        const batch = data || [];
        console.log(`[MarinaService] Batch pessoas offset ${offset}: ${batch.length} registros`);

        if (batch.length === 0 || batch.length < BATCH_SIZE) {
          todasPessoas = [...todasPessoas, ...batch];
          temMaisRegistros = false;
        } else {
          todasPessoas = [...todasPessoas, ...batch];
          offset += BATCH_SIZE;
        }
      }

      console.log(`[MarinaService] Total de pessoas encontradas: ${todasPessoas.length}`);
      return todasPessoas;
    } catch (error) {
      console.error('[MarinaService] Erro ao buscar pessoas por empresa:', error);
      throw error;
    }
  }
}

// Exportar instância única
export const marinaService = MarinaService.getInstance();
