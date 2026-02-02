import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMarina } from '@/contexts/MarinaContext';
import { LogOut, User, Clock, Car, Phone } from 'lucide-react';
import { PessoaDentro } from '@/types/marina';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistrarSaidaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoaDentro: PessoaDentro | null;
}

export function RegistrarSaidaModal({ open, onOpenChange, pessoaDentro }: RegistrarSaidaModalProps) {
  const { registrarSaida } = useMarina();

  const handleConfirm = async () => {
    if (!pessoaDentro) return;

    const result = await registrarSaida(pessoaDentro.movimentacaoId);
    if (result.success) {
      onOpenChange(false);
    }
  };

  if (!pessoaDentro) return null;

  const { pessoa, entradaEm } = pessoaDentro;
  const entradaDate = new Date(entradaEm);
  const tempoDecorrido = Math.round((Date.now() - entradaDate.getTime()) / (1000 * 60));
  const horas = Math.floor(tempoDecorrido / 60);
  const minutos = tempoDecorrido % 60;
  const tempoFormatado = horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive-light">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            Registrar Saída
          </DialogTitle>
          <DialogDescription>
            Confirme a saída da pessoa abaixo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Person info */}
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{pessoa.nome}</p>
                <p className="text-sm text-muted-foreground">{pessoa.documento}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {pessoa.contato && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {pessoa.contato}
                </div>
              )}
              {pessoa.placa && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Car className="h-4 w-4" />
                  <span className="font-mono bg-muted px-2 py-1 rounded">{pessoa.placa}</span>
                </div>
              )}
            </div>
          </div>

          {/* Time info */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Entrada:</span>
              <span className="font-medium">
                {format(entradaDate, "HH:mm", { locale: ptBR })}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Tempo na marina</p>
              <p className="font-semibold text-primary text-lg">{tempoFormatado}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Observation */}
          <div className="space-y-2">
            <label className="font-medium text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Observação de Saída <span className="text-red-600 font-bold">*</span>
            </label>
            <Textarea
              placeholder="Ex: Saída para entrega, finalização de serviço..."
              value={observacaoConfirm}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacaoConfirm(e.target.value)}
              rows={3}
              required
            />
            {observacaoConfirm.trim() === '' && (
              <p className="text-red-600 text-sm font-medium">
                ⚠️ A observação é obrigatória para registrar a saída
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} variant="destructive" className="flex-1 gap-2">
            <LogOut className="h-4 w-4" />
            Confirmar Saída
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
