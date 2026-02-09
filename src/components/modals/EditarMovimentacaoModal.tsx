import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMarina } from '@/contexts/MarinaContext';
import { MovimentacaoComPessoa, PessoaDentro } from '@/types/marina';
import { Clock, Calendar, FileText, LogIn, LogOut, Users, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatters } from '@/lib/validation';

interface EditarMovimentacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoComPessoa | PessoaDentro | null;
}

export function EditarMovimentacaoModal({ open, onOpenChange, movimentacao }: EditarMovimentacaoModalProps) {
  const { atualizarMovimentacao, excluirMovimentacao, atualizarPessoa } = useMarina();
  const [formData, setFormData] = useState({
    entrada_em: '',
    saida_em: '',
    observacao: '',
    placa: '',
  });
  const [placaOriginal, setPlacaOriginal] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Preencher formulário com dados da movimentação
  useEffect(() => {
    if (!movimentacao) {
      setFormData({ entrada_em: '', saida_em: '', observacao: '', placa: '' });
      return;
    }

    // Compatibilidade com MovimentacaoComPessoa (entrada_em) e PessoaDentro (entradaEm)
    const entradaDate = 'entrada_em' in movimentacao && movimentacao.entrada_em 
      ? movimentacao.entrada_em 
      : 'entradaEm' in movimentacao && movimentacao.entradaEm
        ? movimentacao.entradaEm
        : null;

    if (entradaDate) {
      // Converter datas para formato datetime-local
      let entradaFormatted = '';
      const entrada = new Date(entradaDate);
      if (!isNaN(entrada.getTime())) {
        entradaFormatted = format(entrada, "yyyy-MM-dd'T'HH:mm");
      }
      
      let saidaFormatted = '';
      if (movimentacao.saida_em) {
        const saida = new Date(movimentacao.saida_em);
        if (!isNaN(saida.getTime())) {
          saidaFormatted = format(saida, "yyyy-MM-dd'T'HH:mm");
        }
      }

      const pessoa = 'pessoa' in movimentacao ? movimentacao.pessoa : movimentacao.pessoa;
      const placaPessoa = pessoa?.placa || '';

      setFormData({
        entrada_em: entradaFormatted,
        saida_em: saidaFormatted,
        observacao: movimentacao.observacao || '',
        placa: placaPessoa,
      });
      setPlacaOriginal(placaPessoa);
      setErrors({});
    } else if (!movimentacao) {
      // Reset form when closed
      setFormData({ entrada_em: '', saida_em: '', observacao: '', placa: '' });
    }
  }, [movimentacao, open]);

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

    const movimentacaoId = 'movimentacaoId' in movimentacao ? movimentacao.movimentacaoId : movimentacao.id;
    const pessoa = 'pessoa' in movimentacao ? movimentacao.pessoa : movimentacao.pessoa;

    await atualizarMovimentacao(movimentacaoId, {
      entrada_em: new Date(formData.entrada_em).toISOString(),
      saida_em: formData.saida_em ? new Date(formData.saida_em).toISOString() : undefined,
      observacao: formData.observacao.trim() || undefined,
    });

    // Atualizar placa da pessoa se foi alterada
    if (pessoa && formData.placa !== placaOriginal) {
      await atualizarPessoa(pessoa.id, { placa: formData.placa });
    }

    setFormData({ entrada_em: '', saida_em: '', observacao: '', placa: '' });
    setPlacaOriginal('');
    setErrors({});
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({ entrada_em: '', saida_em: '', observacao: '', placa: '' });
    setErrors({});
    onOpenChange(false);
  };

  const pessoa = movimentacao ? ('pessoa' in movimentacao ? movimentacao.pessoa : movimentacao.pessoa) : null;

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

          {/* Placa */}
          <div className="space-y-2">
            <Label htmlFor="placa" className="flex items-center gap-2 text-sm font-medium">
              Placa do Veículo
            </Label>
            <Input
              id="placa"
              type="text"
              value={formData.placa}
              onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
              placeholder="ABC-1234"
              maxLength={8}
              className="h-11 uppercase"
            />
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
                  const movimentacaoId = 'movimentacaoId' in movimentacao ? movimentacao.movimentacaoId : movimentacao.id;
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
