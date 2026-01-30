import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMarina } from '@/contexts/MarinaContext';
import { PessoaDentro } from '@/types/marina';
import { UserTypeAvatar } from '@/lib/userTypeIcons';
import { LogOut, Check, MessageSquare, Search, X, History, User, Phone, Car, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RegistrarSaidaLoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoasDentro: PessoaDentro[];
}

export function RegistrarSaidaLoteModal({ open, onOpenChange, pessoasDentro }: RegistrarSaidaLoteModalProps) {
  const { registrarSaida } = useMarina();
  const navigate = useNavigate();
  const [saidaRegistrada, setSaidaRegistrada] = useState<Set<string>>(new Set());
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [mostrando, setMostrando] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmandoSaida, setConfirmandoSaida] = useState<PessoaDentro | null>(null);
  const [horarioSaida, setHorarioSaida] = useState<string>('');
  const [observacaoConfirm, setObservacaoConfirm] = useState<string>('');

  const handleRegistrarSaida = async (movimentacaoId: string) => {
    const result = await registrarSaida(movimentacaoId);
    if (result.success) {
      setSaidaRegistrada(prev => new Set(prev).add(movimentacaoId));
      setConfirmandoSaida(null);
      setHorarioSaida('');
      setObservacaoConfirm('');
    }
  };

  const handleAbrirConfirmacao = (pessoa: PessoaDentro) => {
    setConfirmandoSaida(pessoa);
    const agora = new Date();
    setHorarioSaida(format(agora, "yyyy-MM-dd'T'HH:mm"));
    setObservacaoConfirm('');
  };

  const handleClose = () => {
    setSaidaRegistrada(new Set());
    setObservacoes({});
    setMostrando(new Set());
    setConfirmandoSaida(null);
    onOpenChange(false);
  };



  const formatHora = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  };

  const getTempoDecorrido = (dateStr: string) => {
    const minutos = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    if (horas > 0) return `${horas}h ${minutos % 60}min`;
    return `${minutos}min`;
  };

  // Filtrar pessoas baseado no termo de busca
  const pessoasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return [...pessoasDentro].sort((a, b) =>
      new Date(b.entradaEm).getTime() - new Date(a.entradaEm).getTime()
    );

    const term = searchTerm.toLowerCase();
    return [...pessoasDentro]
      .filter(item =>
        item.pessoa.nome.toLowerCase().includes(term) ||
        item.pessoa.documento.toLowerCase().includes(term) ||
        item.pessoa.placa?.toLowerCase().includes(term)
      )
      .sort((a, b) =>
        new Date(b.entradaEm).getTime() - new Date(a.entradaEm).getTime()
      );
  }, [pessoasDentro, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">

        <div className="space-y-4">
          {/* Campo de pesquisa */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, documento ou placa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="gap-1.5 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          <div className="text-base text-muted-foreground">
            <p className="font-medium">
              {pessoasFiltradas.length} de {pessoasDentro.length} pessoa{pessoasDentro.length > 1 ? 's' : ''} dentro da marina
              {searchTerm && ` (filtrado${pessoasFiltradas.length !== 1 ? 's' : ''})`}
            </p>
            {saidaRegistrada.size > 0 && (
              <span className="block mt-2 text-success font-medium text-lg">
                ✓ {saidaRegistrada.size} saída{saidaRegistrada.size > 1 ? 's' : ''} registrada{saidaRegistrada.size > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {pessoasFiltradas.map((item) => {
              const jaRegistrou = saidaRegistrada.has(item.movimentacaoId);
              const mostraObs = mostrando.has(item.movimentacaoId);
              return (
                <div
                  key={item.movimentacaoId}
                  className={`rounded-lg border p-3 transition-smooth ${
                    jaRegistrou
                      ? 'bg-success/10 border-success/50'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Informações compactas */}
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Nome</p>
                          <p className="font-medium text-foreground truncate">{item.pessoa.nome}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Documento</p>
                          <p className="text-muted-foreground truncate">{item.pessoa.documento}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Placa</p>
                          {item.pessoa.placa ? (
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                              {item.pessoa.placa}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Entrada</p>
                          <p className="font-medium text-primary">{formatHora(item.entradaEm)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => setMostrando(prev => {
                          const next = new Set(prev);
                          if (next.has(item.movimentacaoId)) {
                            next.delete(item.movimentacaoId);
                          } else {
                            next.add(item.movimentacaoId);
                          }
                          return next;
                        })}
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-8 w-8 p-0"
                        title="Adicionar observação"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          if (!jaRegistrou) {
                            handleAbrirConfirmacao(item);
                          }
                        }}
                        disabled={jaRegistrou}
                        size="default"
                        className={`gap-2 px-12 ${jaRegistrou ? '' : 'bg-destructive hover:bg-destructive/90'}`}
                      >
                        {jaRegistrou ? (
                          <>
                            <Check className="h-4 w-4" />
                            Saída Registrada
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4" />
                            Registrar Saída
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Observação (expandida) */}
                  {mostraObs && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Textarea
                        placeholder="Adicione uma observação sobre a saída..."
                        value={observacoes[item.movimentacaoId] || ''}
                        onChange={(e) => setObservacoes(prev => ({
                          ...prev,
                          [item.movimentacaoId]: e.target.value
                        }))}
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClose}>
            Fechar
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => {
              handleClose();
              navigate('/historico');
            }}
            className="gap-1.5"
          >
            <History className="h-4 w-4" />
            Ir para Histórico
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Modal */}
      <Dialog open={!!confirmandoSaida} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setConfirmandoSaida(null);
          setHorarioSaida('');
          setObservacaoConfirm('');
        }
      }}>
        <DialogContent className="sm:max-w-md">

          {confirmandoSaida && (
            <div className="space-y-4">
              {/* Person info */}
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{confirmandoSaida.pessoa.nome}</p>
                    <p className="text-sm text-muted-foreground">{confirmandoSaida.pessoa.documento}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {confirmandoSaida.pessoa.contato && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {confirmandoSaida.pessoa.contato}
                    </div>
                  )}
                  {confirmandoSaida.pessoa.placa && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Car className="h-3.5 w-3.5" />
                      {confirmandoSaida.pessoa.placa}
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
                    {formatHora(confirmandoSaida.entradaEm)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tempo na marina</p>
                  <p className="font-semibold text-primary">{getTempoDecorrido(confirmandoSaida.entradaEm)}</p>
                </div>
              </div>

              {/* Exit time */}
              <div className="space-y-2">
                <label className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário de saída
                </label>
                <Input
                  type="datetime-local"
                  value={horarioSaida}
                  onChange={(e) => setHorarioSaida(e.target.value)}
                />
              </div>

              {/* Observation */}
              <div className="space-y-2">
                <label className="font-medium text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Observação (opcional)
                </label>
                <Textarea
                  placeholder="Adicione uma observação sobre a saída..."
                  value={observacaoConfirm}
                  onChange={(e) => setObservacaoConfirm(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setConfirmandoSaida(null);
                setHorarioSaida('');
                setObservacaoConfirm('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (confirmandoSaida) {
                  handleRegistrarSaida(confirmandoSaida.movimentacaoId);
                }
              }} 
              variant="destructive" 
              className="px-6"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Confirmar Saída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}