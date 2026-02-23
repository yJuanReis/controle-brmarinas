// Final
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMarina } from '@/contexts/MarinaContext';
import { MovimentacaoComPessoa, PessoaDentro } from '@/types/marina';
import { FileText, LogIn, LogOut, Users, Edit, Trash2, Plus, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getPlacasPorPessoa, adicionarPlacaPessoa, PlacaPessoa } from '@/services/marinaService';
import { toast } from 'sonner';

// Type guards for union type handling
const isMovimentacaoComPessoa = (m: MovimentacaoComPessoa | PessoaDentro): m is MovimentacaoComPessoa => {
  return 'entrada_em' in m;
};

const isPessoaDentro = (m: MovimentacaoComPessoa | PessoaDentro): m is PessoaDentro => {
  return 'entradaEm' in m;
};

interface EditarMovimentacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoComPessoa | PessoaDentro | null;
}

export function EditarMovimentacaoModal({ open, onOpenChange, movimentacao }: EditarMovimentacaoModalProps) {
  const { atualizarMovimentacao, excluirMovimentacao } = useMarina();
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    entrada_em: '',
    saida_em: '',
    observacao: '',
  });
  
  // Estados de placa (chips/botões)
  const [placasPessoa, setPlacasPessoa] = useState<PlacaPessoa[]>([]);
  const [placaSelecionada, setPlacaSelecionada] = useState<string>('');
  const [novaPlaca, setNovaPlaca] = useState<string>('');
  const [showNovaPlaca, setShowNovaPlaca] = useState<boolean>(false);
  const [isLoadingPlacas, setIsLoadingPlacas] = useState<boolean>(false);
  const [isAddingPlaca, setIsAddingPlaca] = useState<boolean>(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Preencher formulário com dados da movimentação
  useEffect(() => {
    if (!movimentacao) {
      setFormData({ entrada_em: '', saida_em: '', observacao: '' });
      setPlacasPessoa([]);
      setPlacaSelecionada('');
      setShowNovaPlaca(false);
      setNovaPlaca('');
      return;
    }

    // Compatibilidade com MovimentacaoComPessoa (entrada_em) e PessoaDentro (entradaEm)
    let entradaDate: string | null = null;
    let saidaDate: string | null = null;
    let observacao: string | null = null;
    let pessoa: PessoaDentro['pessoa'] | MovimentacaoComPessoa['pessoa'] | null = null;
    let placaMovimentacao: string | null = null;

    if (isMovimentacaoComPessoa(movimentacao)) {
      entradaDate = movimentacao.entrada_em;
      saidaDate = movimentacao.saida_em || null;
      observacao = movimentacao.observacao || null;
      pessoa = movimentacao.pessoa;
      placaMovimentacao = movimentacao.placa || null;
    } else if (isPessoaDentro(movimentacao)) {
      entradaDate = movimentacao.entradaEm;
      saidaDate = null; // PessoaDentro não tem saida_em
      observacao = movimentacao.observacao || null;
      pessoa = movimentacao.pessoa;
    }

    if (entradaDate) {
      // Converter datas para formato datetime-local
      let entradaFormatted = '';
      const entrada = new Date(entradaDate);
      if (!isNaN(entrada.getTime())) {
        entradaFormatted = format(entrada, "yyyy-MM-dd'T'HH:mm");
      }
      
      let saidaFormatted = '';
      if (saidaDate) {
        const saida = new Date(saidaDate);
        if (!isNaN(saida.getTime())) {
          saidaFormatted = format(saida, "yyyy-MM-dd'T'HH:mm");
        }
      }

      setFormData({
        entrada_em: entradaFormatted,
        saida_em: saidaFormatted,
        observacao: observacao || '',
      });
      
      // Buscar placas da pessoa
      if (pessoa) {
        carregarPlacasPessoa(pessoa.id, placaMovimentacao);
      }
      
      setErrors({});
    }
  }, [movimentacao, open]);

  // Função para carregar placas da pessoa
  const carregarPlacasPessoa = async (pessoaId: string, placaMovimentacao: string | null) => {
    setIsLoadingPlacas(true);
    try {
      const placas = await getPlacasPorPessoa(pessoaId);
      setPlacasPessoa(placas);
      
      // Se a movimentação tem placa salva, usar ela
      // Caso contrário, usar a primeira placa disponível ou vazio
      if (placaMovimentacao) {
        setPlacaSelecionada(placaMovimentacao);
      } else if (placas.length > 0) {
        setPlacaSelecionada(placas[0].placa);
      } else {
        setPlacaSelecionada('');
      }
    } catch (error) {
      console.error('Erro ao carregar placas:', error);
    } finally {
      setIsLoadingPlacas(false);
    }
  };

  // Função para adicionar nova placa
  const handleAdicionarNovaPlaca = async () => {
    if (!novaPlaca.trim() || !movimentacao) return;
    
    // Encontrar o ID da pessoa
    let pessoaId: string | null = null;
    if (isMovimentacaoComPessoa(movimentacao)) {
      pessoaId = movimentacao.pessoa.id;
    } else if (isPessoaDentro(movimentacao)) {
      pessoaId = movimentacao.pessoa.id;
    }
    
    if (!pessoaId) return;
    
    setIsAddingPlaca(true);
    try {
      const placaAdicionada = await adicionarPlacaPessoa(pessoaId, novaPlaca);
      
      if (placaAdicionada) {
        // Recarregar placas
        const placas = await getPlacasPorPessoa(pessoaId);
        setPlacasPessoa(placas);
        
        // Selecionar a nova placa
        setPlacaSelecionada(placaAdicionada.placa);
        
        // Limpar e fechar input
        setNovaPlaca('');
        setShowNovaPlaca(false);
        
        toast.success('Placa adicionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao adicionar placa:', error);
      toast.error('Erro ao adicionar placa');
    } finally {
      setIsAddingPlaca(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.entrada_em.trim()) {
      newErrors.entrada_em = 'Entrada é obrigatória';
    }

    // Validar que saída não pode ser antes da entrada
    if (formData.saida_em && formData.entrada_em) {
      const entrada = new Date(formData.entrada_em);
      const saida = new Date(formData.saida_em);
      if (saida < entrada) {
        newErrors.saida_em = 'Saída não pode ser antes da entrada';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !movimentacao) return;

    let movimentacaoId: string;

    if (isMovimentacaoComPessoa(movimentacao)) {
      movimentacaoId = movimentacao.id;
    } else {
      movimentacaoId = movimentacao.movimentacaoId;
    }

    // Atualiza movimentação com a placa selecionada (NUNCA altera tabela de pessoas)
    await atualizarMovimentacao(movimentacaoId, {
      entrada_em: new Date(formData.entrada_em).toISOString(),
      saida_em: formData.saida_em ? new Date(formData.saida_em).toISOString() : undefined,
      observacao: formData.observacao.trim() || undefined,
      placa: placaSelecionada || undefined,
    });

    setFormData({ entrada_em: '', saida_em: '', observacao: '' });
    setPlacasPessoa([]);
    setPlacaSelecionada('');
    setErrors({});
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({ entrada_em: '', saida_em: '', observacao: '' });
    setPlacasPessoa([]);
    setPlacaSelecionada('');
    setShowNovaPlaca(false);
    setNovaPlaca('');
    setErrors({});
    onOpenChange(false);
  };

  // Get pessoa using type guard
  const getPessoa = (): PessoaDentro['pessoa'] | MovimentacaoComPessoa['pessoa'] | null => {
    if (!movimentacao) return null;
    if (isMovimentacaoComPessoa(movimentacao)) {
      return movimentacao.pessoa;
    }
    return movimentacao.pessoa;
  };

  // Get movimentacaoId using type guard
  const getMovimentacaoId = (): string => {
    if (!movimentacao) return '';
    if (isMovimentacaoComPessoa(movimentacao)) {
      return movimentacao.id;
    }
    return movimentacao.movimentacaoId;
  };

  const pessoa = getPessoa();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Movimentação
          </DialogTitle>
          <DialogDescription>
            Atualize os dados da movimentação{pessoa && ` de ${pessoa.nome}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pessoa info */}
          {pessoa && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{pessoa.nome}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {pessoa.contato && <span>• Contato: {pessoa.contato}</span>}
                {pessoa.documento && <span>• Doc: {pessoa.documento}</span>}
              </div>
            </div>
          )}

          {/* Placa - Interface de Chips/Botões */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Car className="h-4 w-4" />
              Placa do Veículo
            </Label>
            
            {isLoadingPlacas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Carregando placas...
              </div>
            ) : placasPessoa.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {placasPessoa.map((placa) => (
                  <button
                    key={placa.id}
                    type="button"
                    onClick={() => setPlacaSelecionada(placa.placa)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-200 border-2",
                      placaSelecionada === placa.placa
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-foreground"
                    )}
                  >
                    {placa.placa}
                  </button>
                ))}
                
                {/* Botão Nova Placa */}
                {!showNovaPlaca ? (
                  <button
                    type="button"
                    onClick={() => setShowNovaPlaca(true)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Nova Placa
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      type="text"
                      value={novaPlaca}
                      onChange={(e) => {
                        let value = e.target.value.toUpperCase();
                        // Formatar como placa (ABC-1234)
                        value = value.replace(/[^a-zA-Z0-9]/g, '');
                        if (value.length >= 3 && !value.includes('-')) {
                          value = value.substring(0, 3) + '-' + value.substring(3, 7);
                        }
                        setNovaPlaca(value.substring(0, 8));
                      }}
                      placeholder="ABC-1234"
                      maxLength={8}
                      className="h-10 w-28 text-sm font-mono uppercase"
                      disabled={isAddingPlaca}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdicionarNovaPlaca}
                      disabled={novaPlaca.length < 7 || isAddingPlaca}
                      className="h-10"
                    >
                      {isAddingPlaca ? (
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowNovaPlaca(false);
                        setNovaPlaca('');
                      }}
                      className="h-10 px-2"
                    >
                      ✕
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                Nenhuma placa cadastrada
                <button
                  type="button"
                  onClick={() => setShowNovaPlaca(true)}
                  className="ml-2 text-primary hover:underline"
                >
                  Adicionar placa
                </button>
              </div>
            )}
            
            {showNovaPlaca && placasPessoa.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Input
                  type="text"
                  value={novaPlaca}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase();
                    value = value.replace(/[^a-zA-Z0-9]/g, '');
                    if (value.length >= 3 && !value.includes('-')) {
                      value = value.substring(0, 3) + '-' + value.substring(3, 7);
                    }
                    setNovaPlaca(value.substring(0, 8));
                  }}
                  placeholder="ABC-1234"
                  maxLength={8}
                  className="h-10 w-28 text-sm font-mono uppercase"
                  disabled={isAddingPlaca}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAdicionarNovaPlaca}
                  disabled={novaPlaca.length < 7 || isAddingPlaca}
                >
                  {isAddingPlaca ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Adicionar'
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowNovaPlaca(false);
                    setNovaPlaca('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>


          {/* Entrada */}
          <div className="space-y-2">
            <Label htmlFor="entrada_em" className="flex items-center gap-2 text-sm font-medium">
              <LogIn className="h-4 w-4 text-success" />
              Entrada *
            </Label>
            <Input
              id="entrada_em"
              type="datetime-local"
              value={formData.entrada_em}
              onChange={(e) => handleChange('entrada_em', e.target.value)}
              className={cn("h-11", errors.entrada_em ? 'border-destructive' : '')}
            />
            {errors.entrada_em && (
              <p className="text-xs text-destructive">{errors.entrada_em}</p>
            )}
          </div>

          {/* Saída */}
          <div className="space-y-2">
            <Label htmlFor="saida_em" className="flex items-center gap-2 text-sm font-medium">
              <LogOut className="h-4 w-4 text-destructive" />
              Saída
            </Label>
            <Input
              id="saida_em"
              type="datetime-local"
              value={formData.saida_em}
              onChange={(e) => handleChange('saida_em', e.target.value)}
              className={cn("h-11", errors.saida_em ? 'border-destructive' : '')}
            />
            {errors.saida_em && (
              <p className="text-xs text-destructive">{errors.saida_em}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Deixe vazio se a pessoa ainda está dentro
            </p>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Observação
            </Label>
            <textarea
              id="observacao"
              value={formData.observacao}
              onChange={(e) => handleChange('observacao', e.target.value)}
              placeholder="Informações adicionais sobre a movimentação..."
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>


          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 order-2 sm:order-1 mb-2 sm:mb-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <div className="flex gap-2 flex-1 order-1 sm:order-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Movimentação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita
              e a movimentação será marcada como excluída no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (movimentacao) {
                  const movimentacaoId = getMovimentacaoId();
                  await excluirMovimentacao(movimentacaoId);
                  setShowDeleteDialog(false);
                  onOpenChange(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
