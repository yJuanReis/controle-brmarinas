import { Button } from '@/components/ui/button';
import { LogOut, Clock, Users } from 'lucide-react';
import { useMarina } from '@/contexts/MarinaContext';
import { toast } from 'sonner';
import { marinaService } from '@/services/marinaService';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SaidaAutomaticaButtonProps {
  className?: string;
}

export function SaidaAutomaticaButton({ className }: SaidaAutomaticaButtonProps) {
  const { empresaAtual, getPessoasDentro, setMovimentacoes } = useMarina();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecutarSaidaAutomatica = async () => {
    if (!empresaAtual) {
      toast.error('Nenhuma empresa selecionada');
      return;
    }

    try {
      setIsExecuting(true);
      
      console.log('🚀 Iniciando saída automática...');
      
      // Executar saída automática
      const pessoasRemovidas = await marinaService.executarSaidaAutomatica(empresaAtual.id, 8);
      
      if (pessoasRemovidas > 0) {
        toast.success(
          `Saída automática concluída! ${pessoasRemovidas} pessoa${pessoasRemovidas > 1 ? 's' : ''} removida${pessoasRemovidas > 1 ? 's' : ''} da marina.`,
          {
            duration: 5000,
            icon: <LogOut className="h-4 w-4" />
          }
        );
        
        // Atualizar a lista de pessoas dentro (opcional, pois o Supabase já atualiza)
        // Mas podemos forçar a atualização para garantir que o UI esteja sincronizado
        const novasMovimentacoes = await supabase
          .from('movimentacoes')
          .select('*')
          .eq('empresa_id', empresaAtual.id);
        
        if (novasMovimentacoes.data) {
          setMovimentacoes(novasMovimentacoes.data);
        }
      } else {
        toast.info(
          'Nenhuma pessoa ultrapassou o limite de 8 horas de permanência.',
          {
            duration: 3000,
            icon: <Clock className="h-4 w-4" />
          }
        );
      }
    } catch (error) {
      console.error('❌ Erro ao executar saída automática:', error);
      toast.error('Erro ao executar saída automática. Verifique o console para mais detalhes.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Verificar se há pessoas dentro da marina
  const pessoasDentro = getPessoasDentro();
  const temPessoasDentro = pessoasDentro.length > 0;

  return (
    <Button
      onClick={handleExecutarSaidaAutomatica}
      disabled={!temPessoasDentro || isExecuting || !empresaAtual}
      className={`gap-2 bg-destructive hover:bg-destructive/90 px-6 py-4 text-base h-auto ${className}`}
      variant="destructive"
    >
      {isExecuting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          <span>Executando...</span>
        </>
      ) : (
        <>
          <LogOut className="h-5 w-5" />
          <div className="text-left">
            <div className="font-semibold">Saída Automática</div>
            <div className="text-xs opacity-75">
              {temPessoasDentro 
                ? `${pessoasDentro.length} pessoa${pessoasDentro.length > 1 ? 's' : ''} dentro`
                : 'Nenhuma pessoa na marina'
              }
            </div>
          </div>
        </>
      )}
    </Button>
  );
}