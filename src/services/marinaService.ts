import { supabase } from '@/lib/supabase';
import { Movimentacao, PessoaDentro } from '@/types/marina';

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
   * @param empresaId ID da empresa
   * @param tempoLimiteHoras Tempo limite em horas (padrão: 8 horas)
   * @returns Quantidade de pessoas que tiveram saída registrada automaticamente
   */
  public async executarSaidaAutomatica(empresaId: string, tempoLimiteHoras: number = 13): Promise<number> {
    try {
      console.log(`[MarinaService] Executando saída automática para empresa ${empresaId} com limite de ${tempoLimiteHoras} horas`);

      // Obter todas as movimentações ativas (pessoas dentro) da empresa
      const { data: movimentacoesAtivas, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'DENTRO');

      if (error) {
        console.error('[MarinaService] Erro ao buscar movimentações ativas:', error);
        throw error;
      }

      console.log(`[MarinaService] Movimentações ativas encontradas: ${movimentacoesAtivas?.length || 0}`);

      if (!movimentacoesAtivas || movimentacoesAtivas.length === 0) {
        console.log('[MarinaService] Nenhuma movimentação ativa encontrada');
        return 0;
      }

      const tempoLimiteMs = tempoLimiteHoras * 60 * 60 * 1000; // Converter horas para milissegundos
      const agora = new Date();
      let pessoasRemovidas = 0;

      console.log(`[MarinaService] Tempo limite em milissegundos: ${tempoLimiteMs}`);
      console.log(`[MarinaService] Data/hora atual: ${agora.toISOString()}`);

      // Processar cada movimentação
      for (const movimentacao of movimentacoesAtivas) {
        const tempoDecorrido = agora.getTime() - new Date(movimentacao.entrada_em).getTime();
        const tempoDecorridoHoras = tempoDecorrido / (1000 * 60 * 60);
        
        console.log(`[MarinaService] Movimentação ${movimentacao.id}: tempo decorrido = ${tempoDecorridoHoras.toFixed(2)} horas`);

        if (tempoDecorrido >= tempoLimiteMs) {
          console.log(`[MarinaService] Movimentação ${movimentacao.id} ultrapassou o limite, registrando saída...`);

          // Registrar saída automática
          const resultado = await this.registrarSaidaAutomatica(movimentacao.id, tempoLimiteHoras);
          
          if (resultado.success) {
            pessoasRemovidas++;
            console.log(`[MarinaService] Saída registrada com sucesso para movimentação ${movimentacao.id}`);
          } else {
            console.error(`[MarinaService] Falha ao registrar saída para movimentação ${movimentacao.id}:`, resultado.error);
          }
        } else {
          console.log(`[MarinaService] Movimentação ${movimentacao.id} ainda dentro do limite`);
        }
      }

      console.log(`[MarinaService] Saída automática concluída. Pessoas removidas: ${pessoasRemovidas}`);
      return pessoasRemovidas;
    } catch (error) {
      console.error('[MarinaService] Erro ao executar saída automática:', error);
      throw error;
    }
  }

  /**
   * Registra saída automática para uma movimentação específica
   * @param movimentacaoId ID da movimentação
   * @param tempoLimiteHoras Tempo limite que foi ultrapassado
   * @returns Resultado da operação
   */
  private async registrarSaidaAutomatica(movimentacaoId: string, tempoLimiteHoras: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Obter dados da movimentação para auditoria
      const { data: movimentacao, error: fetchError } = await supabase
        .from('movimentacoes')
        .select('*, pessoas(nome, documento)')
        .eq('id', movimentacaoId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!movimentacao) {
        throw new Error('Movimentação não encontrada');
      }

      // Dados para auditoria
      const pessoaNome = movimentacao.pessoas?.nome || 'Desconhecido';
      const observacao = `Saída automática após ${tempoLimiteHoras} horas de permanência`;

      // Atualizar movimentação com saída automática
      const { error: updateError } = await supabase
        .from('movimentacoes')
        .update({
          status: 'FORA',
          saida_em: new Date().toISOString(),
          observacao: `${movimentacao.observacao || ''} | ${observacao}`
        })
        .eq('id', movimentacaoId);

      if (updateError) {
        throw updateError;
      }


      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
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
}

// Exportar instância única
export const marinaService = MarinaService.getInstance();
