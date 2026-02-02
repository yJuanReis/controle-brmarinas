import { supabase } from '@/lib/supabase';
import { Movimentacao, PessoaDentro } from '@/types/marina';
import { auditService } from './auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';

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
      console.log(`🔍 Iniciando saída automática para empresa: ${empresaId}`);
      console.log(`⏰ Tempo limite configurado: ${tempoLimiteHoras} horas`);

      // Obter todas as movimentações ativas (pessoas dentro) da empresa
      const { data: movimentacoesAtivas, error } = await supabase
        .from('movimentacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'DENTRO');

      if (error) {
        console.error('❌ Erro ao buscar movimentações ativas:', error);
        throw error;
      }

      if (!movimentacoesAtivas || movimentacoesAtivas.length === 0) {
        console.log('✅ Nenhuma pessoa dentro da marina');
        return 0;
      }

      console.log(`📍 Encontradas ${movimentacoesAtivas.length} pessoas dentro da marina`);

      const tempoLimiteMs = tempoLimiteHoras * 60 * 60 * 1000; // Converter horas para milissegundos
      const agora = new Date();
      let pessoasRemovidas = 0;

      // Processar cada movimentação
      for (const movimentacao of movimentacoesAtivas) {
        const tempoDecorrido = agora.getTime() - new Date(movimentacao.entrada_em).getTime();
        
        console.log(`⏱️ Pessoa ${movimentacao.pessoa_id}: tempo decorrido = ${Math.floor(tempoDecorrido / (1000 * 60))} minutos`);

        if (tempoDecorrido >= tempoLimiteMs) {
          console.log(`🚨 Pessoa ${movimentacao.pessoa_id} ultrapassou o limite! Registrando saída automática...`);

          // Registrar saída automática
          const resultado = await this.registrarSaidaAutomatica(movimentacao.id, tempoLimiteHoras);
          
          if (resultado.success) {
            pessoasRemovidas++;
            console.log(`✅ Saída automática registrada para pessoa ${movimentacao.pessoa_id}`);
          } else {
            console.error(`❌ Falha ao registrar saída automática para pessoa ${movimentacao.pessoa_id}`);
          }
        }
      }

      console.log(`🎉 Saída automática concluída: ${pessoasRemovidas} pessoas removidas`);
      return pessoasRemovidas;
    } catch (error) {
      console.error('❌ Erro ao executar saída automática:', error);
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
        console.error('❌ Erro ao buscar movimentação para auditoria:', fetchError);
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
          observacao: observacao
        })
        .eq('id', movimentacaoId);

      if (updateError) {
        console.error('❌ Erro ao atualizar movimentação:', updateError);
        throw updateError;
      }

      // Registrar auditoria
      await auditService.logAction(
        AuditAction.SAIDA,
        AuditEntityType.MOVIMENTACAO,
        movimentacaoId,
        pessoaNome,
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
            pessoa_id: movimentacao.pessoa_id,
            empresa_id: movimentacao.empresa_id,
            entrada_em: movimentacao.entrada_em,
            status: 'FORA',
            observacao: observacao,
            saida_em: new Date().toISOString()
          },
          metadata: {
            tipo_saida: 'automatica',
            tempo_limite_horas: tempoLimiteHoras,
            tempo_decorrido_horas: Math.floor((new Date().getTime() - new Date(movimentacao.entrada_em).getTime()) / (1000 * 60 * 60))
          }
        }
      );

      console.log(`✅ Saída automática registrada com sucesso para ${pessoaNome}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao registrar saída automática:', error);
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
        console.error('❌ Erro ao buscar movimentações ativas:', error);
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
            console.error('❌ Erro ao buscar pessoa:', pessoaError);
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
      console.error('❌ Erro ao verificar pessoas próximas do limite:', error);
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
        console.error('❌ Erro ao buscar movimentações ativas:', error);
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
      console.error('❌ Erro ao obter estatísticas de permanência:', error);
      throw error;
    }
  }
}

// Exportar instância única
export const marinaService = MarinaService.getInstance();
