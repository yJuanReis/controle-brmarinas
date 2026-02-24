// Final
import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMarina } from '@/contexts/MarinaContext';
import { 
  LogIn, Search, FileText, Phone, Car, AlertCircle, 
  UserPlus, Edit2, X, Users, Gift, Ship, Briefcase, 
  CheckCircle, XCircle, Save, LogOut, Plus, Moon, Badge,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserTypeAvatar } from '@/lib/userTypeIcons';
import { validateCPF, validateRG, validatePlaca } from '@/lib/validation';
import { smartSearch } from '@/lib/utils';
import { validators, formatters } from '@/lib/validation';
import { getPlacasPorPessoa, adicionarPlacaPessoa, PlacaPessoa, verificarPessoaEstaDentro } from '@/services/marinaService';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { normalizarPlaca } from '@/lib/validation/formatters';

type TipoPessoa = 'cliente' | 'visita' | 'marinheiro' | 'proprietario' | 'colaborador' | 'prestador' | '';

const isValidTipoPessoa = (value: string): value is TipoPessoa => {
  return ['', 'cliente', 'visita', 'marinheiro', 'proprietario', 'colaborador', 'prestador'].includes(value);
};

interface RegistrarEntradaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoaPreSelecionada?: string | null;
  onPessoaPreSelecionadaUsada?: () => void;
  onAbrirCadastro?: (nomePreenchido: string) => void;
}

export function RegistrarEntradaModal({ 
  open, 
  onOpenChange, 
  pessoaPreSelecionada,
  onPessoaPreSelecionadaUsada,
  onAbrirCadastro
}: RegistrarEntradaModalProps) {
  const { pessoas, registrarEntrada, registrarSaida, podeEntrar, atualizarPessoa, movimentacoes, empresaAtual } = useMarina();
  
  // Estado para controlar a etapa (mobile/tablet vs desktop)
  const [currentStep, setCurrentStep] = useState<'search' | 'data'>('search');
  
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPessoaId, setSelectedPessoaId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRegistrandoSaida, setIsRegistrandoSaida] = useState(false);
  const [isVerificandoBanco, setIsVerificandoBanco] = useState(false);
  
  // Paginação da lista
  const [visibleCount, setVisibleCount] = useState(20);
  const LOAD_MORE_COUNT = 50;
  
  // Estados de placas (chips/botões)
  const [placasPessoa, setPlacasPessoa] = useState<PlacaPessoa[]>([]);
  const [placaSelecionada, setPlacaSelecionada] = useState<string>('');
  const [novaPlaca, setNovaPlaca] = useState<string>('');
  const [showNovaPlaca, setShowNovaPlaca] = useState<boolean>(false);
  const [isLoadingPlacas, setIsLoadingPlacas] = useState<boolean>(false);
  const [isAddingPlaca, setIsAddingPlaca] = useState<boolean>(false);
  
  // Estados de pernoite
  const [pernoite, setPernoite] = useState<boolean>(false);
  const [diasPernoite, setDiasPernoite] = useState<number>(1);
  
  // Estado para movimentação ativa verificada no banco (mais robusta)
  const [movimentacaoAtivaBanco, setMovimentacaoAtivaBanco] = useState<{
    movimentacaoId: string;
    entradaEm: string;
    observacao?: string;
    placa?: string;
    pernoite?: boolean;
    diasPernoite?: number;
  } | null>(null);
  
  // Encontrar movimentação ativa da pessoa selecionada (usando dados locais)
  const movimentacaoAtiva = useMemo(() => {
    if (!selectedPessoaId) return null;
    return movimentacoes.find(m => m.pessoa_id === selectedPessoaId && m.status === 'DENTRO') || null;
  }, [selectedPessoaId, movimentacoes]);
  
  // Usar verificação do banco se disponível, caso contrário usar dados locais
  const movimentacaoAtivaExibir = movimentacaoAtivaBanco || (movimentacaoAtiva ? {
    movimentacaoId: movimentacaoAtiva.id,
    entradaEm: movimentacaoAtiva.entrada_em,
    observacao: movimentacaoAtiva.observacao,
    placa: movimentacaoAtiva.placa,
    pernoite: movimentacaoAtiva.pernoite,
    diasPernoite: movimentacaoAtiva.dias_pernoite,
  } : null);
  
  // Handler para registrar saída por esquecimento
  const handleSaidaPorEsquecimento = async () => {
    // Usar verificação do banco se disponível, caso contrário usar dados locais
    const movimentacaoId = movimentacaoAtivaExibir?.movimentacaoId || movimentacaoAtiva?.id;
    
    if (!movimentacaoId) return;
    
    setIsRegistrandoSaida(true);
    const result = await registrarSaida(
      movimentacaoId,
      undefined,
      'Saída registrada por esquecimento ao tentar nova entrada'
    );
    
    if (result.success) {
      // Limpar estado de verificação do banco
      setMovimentacaoAtivaBanco(null);
      // Limpar observação para permitir nova entrada
      setObservacao('');
    }
    setIsRegistrandoSaida(false);
  };
  
  // Função para carregar placas da pessoa
  const carregarPlacasPessoa = async (pessoaId: string, placaPrincipal?: string) => {
    setIsLoadingPlacas(true);
    try {
      const placas = await getPlacasPorPessoa(pessoaId);
      
      // Se a pessoa tem placa principal e ela não está na lista de placas extras,
      // adicionar temporariamente para exibir como opção selecionável
      let placasExibir = [...placas];
      if (placaPrincipal && !placas.some(p => p.placa === placaPrincipal)) {
        placasExibir.unshift({
          id: 'principal',
          pessoa_id: pessoaId,
          placa: placaPrincipal,
          created_at: new Date().toISOString()
        } as PlacaPessoa);
      }
      
      setPlacasPessoa(placasExibir);
      
      // Selecionar a placa principal da pessoa por padrão, se existir
      if (placaPrincipal) {
        setPlacaSelecionada(placaPrincipal);
      } else if (placasExibir.length > 0) {
        // Caso contrário, selecionar a primeira placa da lista
        setPlacaSelecionada(placasExibir[0].placa);
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
    if (!novaPlaca.trim() || !selectedPessoaId) return;
    
    // Normalizar a placa antes de salvar (adicionar espaços ao redor do hífen)
    const placaNormalizada = normalizarPlaca(novaPlaca);
    
    setIsAddingPlaca(true);
    try {
      const placaAdicionada = await adicionarPlacaPessoa(selectedPessoaId, placaNormalizada);
      
      if (placaAdicionada) {
        // Recarregar placas
        const placas = await getPlacasPorPessoa(selectedPessoaId);
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
  
  // Estado do formulário de edição
  const [editData, setEditData] = useState({
    nome: '',
    documento: '',
    tipo: '' as TipoPessoa,
    contato: '',
    placa: '',
  });

  // Filtragem com paginação - otimizada para performance
  const filteredPessoas = useMemo(() => {
    if (!searchTerm.trim()) return pessoas;
    return pessoas.filter(p => 
      smartSearch(p.nome, searchTerm) || 
      smartSearch(p.documento, searchTerm) ||
      smartSearch(p.placa || '', searchTerm)
    );
  }, [pessoas, searchTerm]);

  // Lista limitada para renderização (paginação infinita)
  const visiblePessoas = useMemo(() => {
    return filteredPessoas.slice(0, visibleCount);
  }, [filteredPessoas, visibleCount]);

  // Reset da paginação quando a busca mudar
  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm]);

  // Função para carregar mais pessoas ao scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    
    if (isAtBottom && visibleCount < filteredPessoas.length) {
      setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, filteredPessoas.length));
    }
  };

  // Verificar se há mais pessoas para carregar
  const hasMore = visibleCount < filteredPessoas.length;

  const selectedPessoa = useMemo(() => {
    return pessoas.find(p => p.id === selectedPessoaId);
  }, [pessoas, selectedPessoaId]);

  const validacao = useMemo(() => {
    if (!selectedPessoaId) return null;
    return podeEntrar(selectedPessoaId);
  }, [selectedPessoaId, podeEntrar]);

  // Handlers
  const carregarDadosEdicao = (pessoa: any) => {
    setEditData({
      nome: pessoa.nome,
      documento: pessoa.documento,
      tipo: (pessoa.tipo || '') as TipoPessoa,
      contato: pessoa.contato || '',
      placa: pessoa.placa || '',
    });
  };

  // Função para verificar no banco se pessoa está dentro
  const verificarPessoaNoBanco = async (pessoaId: string) => {
    if (!empresaAtual) return;
    
    setIsVerificandoBanco(true);
    try {
      const resultado = await verificarPessoaEstaDentro(pessoaId, empresaAtual.id);
      if (resultado && resultado.estaDentro) {
        setMovimentacaoAtivaBanco({
          movimentacaoId: resultado.movimentacaoId!,
          entradaEm: resultado.entradaEm!,
          observacao: resultado.observacao,
          placa: resultado.placa,
          pernoite: resultado.pernoite,
          diasPernoite: resultado.diasPernoite,
        });
      } else {
        setMovimentacaoAtivaBanco(null);
      }
    } catch (error) {
      console.error('Erro ao verificar pessoa no banco:', error);
      // Em caso de erro, usa os dados locais
      setMovimentacaoAtivaBanco(null);
    } finally {
      setIsVerificandoBanco(false);
    }
  };

  const handleSelectPessoa = (pessoaId: string) => {
    setSelectedPessoaId(pessoaId);
    const pessoa = pessoas.find(p => p.id === pessoaId);
    if (pessoa) {
      carregarDadosEdicao(pessoa);
      setIsEditing(false);
      // Resetar pernoite ao selecionar nova pessoa
      setPernoite(false);
      setDiasPernoite(1);
      // Carregar placas da pessoa passando a placa principal como parâmetro
      carregarPlacasPessoa(pessoaId, pessoa.placa);
      
      // No mobile/tablet, mudar para etapa de dados
      setCurrentStep('data');
      
      // Focus on observação field after a small delay to ensure the form is rendered
      setTimeout(() => {
        const observacaoElement = document.getElementById('observacao-input');
        if (observacaoElement) {
          observacaoElement.focus();
        }
      }, 100);
    }
  };
  
  // Voltar para etapa de busca (mobile/tablet)
  const handleBackToSearch = () => {
    setCurrentStep('search');
    setSelectedPessoaId(null);
    setObservacao('');
    setPernoite(false);
    setDiasPernoite(1);
  };

  const handleEditDirectlyFromList = (e: React.MouseEvent, pessoaId: string) => {
    e.stopPropagation();
    handleSelectPessoa(pessoaId);
    setIsEditing(true);
  };

  useEffect(() => {
    if (open && pessoaPreSelecionada) {
      handleSelectPessoa(pessoaPreSelecionada);
    }
  }, [open, pessoaPreSelecionada]);

  const handleCancelEdit = () => {
    if (selectedPessoa) {
      carregarDadosEdicao(selectedPessoa);
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (selectedPessoaId) {
      // Normalizar a placa antes de salvar (adicionar espaços ao redor do hífen se necessário)
      const placaNormalizada = editData.placa ? normalizarPlaca(editData.placa) : '';
      
      await atualizarPessoa(selectedPessoaId, {
        nome: editData.nome,
        documento: editData.documento,
        tipo: editData.tipo === '' ? undefined : editData.tipo,
        contato: editData.contato,
        placa: placaNormalizada,
      });
      setIsEditing(false);
      
      // Normalizar a placa selecionada antes de registrar entrada
      const placaSelecionadaNormalizada = placaSelecionada ? normalizarPlaca(placaSelecionada) : '';
      
      // After saving edits, automatically register the entry (with pernoite data and selected plate)
      const result = await registrarEntrada(selectedPessoaId, observacao, placaSelecionadaNormalizada, pernoite, pernoite ? diasPernoite : undefined);
      if (result.success) {
        if (pessoaPreSelecionada && onPessoaPreSelecionadaUsada) {
          onPessoaPreSelecionadaUsada();
        }
        handleClose();
      }
    }
  };

  const handleSubmitEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPessoaId || !validacao?.pode) return;

    // Normalizar a placa selecionada antes de registrar entrada
    const placaNormalizada = placaSelecionada ? normalizarPlaca(placaSelecionada) : '';
    
    const result = await registrarEntrada(selectedPessoaId, observacao, placaNormalizada, pernoite, pernoite ? diasPernoite : undefined);
    if (result.success) {
      if (pessoaPreSelecionada && onPessoaPreSelecionadaUsada) {
        onPessoaPreSelecionadaUsada();
      }
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedPessoaId(null);
    setObservacao('');
    setIsEditing(false);
    setEditData({ nome: '', documento: '', tipo: '', contato: '', placa: '' });
    setMovimentacaoAtivaBanco(null);
    onOpenChange(false);
  };


  // Função para resetar o estado quando o modal abre
  useEffect(() => {
    if (open) {
      setCurrentStep('search');
    }
  }, [open]);

  // Helper para verificar se é mobile/tablet (abaixo de lg = 1024px)
  const isMobileOrTablet = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-6xl h-[90vh] max-h-[900px] flex flex-col p-0 overflow-hidden bg-slate-50 gap-0" hideCloseButton>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* LADO ESQUERDO: LISTA E BUSCA - Oculto no mobile/tablet quando estiver na etapa de dados */}
          <div className={cn(
            "flex-1 flex flex-col border-r border-slate-200 bg-white min-w-0",
            // No mobile/tablet: ocultar se estiver na etapa de dados
            currentStep === 'data' && "hidden lg:flex"
          )}>
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-100 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, CPF ou placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 text-base pl-10 bg-white border-slate-300 focus:bg-white transition-colors"
                />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (onAbrirCadastro) {
                    onAbrirCadastro(searchTerm);
                    onOpenChange(false);
                  }
                }}
                className="h-11 gap-2 bg-orange-500 hover:bg-orange-600 text-white border-orange-600 hover:border-orange-700"
              >
                <UserPlus className="h-4 w-4" />
                Cadastrar
              </Button>
            </div>

            {/* List - com paginação infinita */}
            <div 
              className="flex-1 overflow-y-auto p-2 space-y-1"
              onScroll={handleScroll}
            >
              {filteredPessoas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                  <UserPlus className="h-10 w-10 mb-3 opacity-20" />
                  <p className="font-medium mb-4">Ninguém encontrado</p>
                </div>
              ) : (
                <>
                  {visiblePessoas.map((pessoa) => {
                    const check = podeEntrar(pessoa.id);
                    const isSelected = selectedPessoaId === pessoa.id;

                    return (
                      <div
                        key={pessoa.id}
                        onClick={() => handleSelectPessoa(pessoa.id)}
                        className={cn(
                          "group w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 border border-transparent",
                          isSelected
                            ? "bg-primary/5 border-primary/20 shadow-sm"
                            : "hover:bg-slate-50 hover:border-slate-200 cursor-pointer"
                        )}
                      >
                        {/* Avatar/Initials */}
                        <UserTypeAvatar pessoa={pessoa} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn("font-medium text-sm truncate", 
                              isSelected && !validacao?.pode ? "text-red-700" : 
                              isSelected ? "text-primary" : "text-black")}>
                              {pessoa.nome}
                            </p>
                            {/* Badges de Status */}
                            <div className="flex items-center gap-2">
                              {!check.pode && (
                                <span className="flex items-center gap-1 text-[11px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                  Na Marina
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-xs text-black">
                            <span className="truncate">{pessoa.documento || 'Sem doc'}</span>
                            {pessoa.placa && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="font-mono bg-slate-100 px-1 rounded">{formatters.placa(pessoa.placa)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Indicador de mais resultados */}
                  {hasMore && (
                    <div className="flex items-center justify-center py-4 text-sm text-slate-400">
                      <div className="h-1 w-8 bg-slate-200 rounded-full mr-2" />
                      Carregando mais...
                      <div className="h-1 w-8 bg-slate-200 rounded-full ml-2" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* LADO DIREITO: DETALHES E AÇÃO */}
          <div className="lg:w-[500px] flex flex-col bg-slate-50/50">
            {/* Header visível apenas no mobile/tablet quando está na etapa de dados */}
            <div className={cn(
              "lg:hidden flex items-center justify-between gap-3 p-4 border-b border-slate-200 bg-white",
              currentStep === 'search' && "hidden"
            )}>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToSearch}
                  className="h-10 w-10"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <div>
                  <h3 className="font-semibold text-black">Dados da Entrada</h3>
                  <p className="text-xs text-muted-foreground">Preencha os dados e confirme</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-1.5 h-9"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">{isEditing ? 'Cancelar' : 'Editar'}</span>
              </Button>
            </div>

            {/* Desktop: botão editar fixo no topo */}
            <div className="hidden lg:flex items-center justify-end p-4 pb-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-1.5"
              >
                <Edit2 className="h-4 w-4" />
                {isEditing ? 'Cancelar' : 'Editar Dados'}
              </Button>
            </div>

            {selectedPessoa ? (
              <form onSubmit={handleSubmitEntrada} className="flex-1 flex flex-col h-full">
                
                {/* 2. Área de Conteúdo (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                  
                  {/* Grid de Dados */}
                  <div className="space-y-4">
                      <div className="space-y-2">

                      <div className="grid gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3 text-black" />
                            <Label className="text-xs text-black">Nome</Label>
                          </div>
                          <Input
                            value={editData.nome}
                            disabled={!isEditing}
                            onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                            className={cn(
                              "bg-white",
                              !isEditing && "bg-slate-50 border-slate-200 text-slate-500 font-normal"
                            )}
                            placeholder="Nome Completo"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-3 w-3 text-black" />
                              <Label className="text-[11px] text-black">Documento</Label>
                            </div>
                            <Input
                              value={editData.documento}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  // Permitir apenas letras, números e espaços
                                  const cleanValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
                                  setEditData({ ...editData, documento: cleanValue });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (isEditing) {
                                  // Permitir teclas de controle e caracteres alfanuméricos e espaços
                                  const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '];
                                  const allowedKeys = /^[a-zA-Z0-9]$/;

                                  if (!controlKeys.includes(e.key) && !allowedKeys.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }
                              }}
                              className={cn(
                                "bg-white",
                                !isEditing && "bg-slate-50 border-slate-300 text-black"
                              )}
                              maxLength={20}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="h-3 w-3 text-black" />
                              <Label className="text-[11px] text-black">Tipo</Label>
                            </div>
                            {isEditing ? (
                              <select
                                value={editData.tipo}
                                onChange={(e) => {
                                  if (isValidTipoPessoa(e.target.value)) {
                                    setEditData({ ...editData, tipo: e.target.value });
                                  }
                                }}
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Selecione...</option>
                                <option value="cliente">Cliente</option>
                                <option value="colaborador">Colaborador</option>
                                <option value="marinheiro">Marinheiro</option>
                                <option value="prestador">Prestador de Serviço</option>
                                <option value="proprietario">Proprietário</option>
                                <option value="visita">Visita</option>
                              </select>
                            ) : (
                              <div className={cn(
                                "flex h-10 w-full items-center rounded-md border border-slate-300 px-3 text-sm",
                                !isEditing && "bg-slate-50 border-slate-300 text-slate-500"
                              )}>
                                {editData.tipo || '—'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Phone className="h-3 w-3 text-black" />
                              <Label className="text-xs text-black">Telefone</Label>
                            </div>
                            <Input
                              value={editData.contato}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (isEditing) {
                                  // Filtrar apenas números
                                  const numericValue = e.target.value.replace(/\D/g, '');
                                  setEditData({ ...editData, contato: numericValue });
                                }
                              }}
                              className={cn(
                                "bg-white",
                                !isEditing && "bg-slate-50 border-slate-300 text-black"
                              )}
                              placeholder="Nenhum registro"
                              maxLength={15}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Moon className="h-3 w-3 text-black" />
                              <Label className="text-xs text-black">Pernoite</Label>
                            </div>
                            <div className="flex items-center gap-2 h-10">
                              <Switch
                                checked={pernoite}
                                onCheckedChange={setPernoite}
                                className="data-[state=checked]:bg-indigo-600"
                              />
                              {pernoite ? (
                                <select
                                  value={diasPernoite}
                                  onChange={(e) => setDiasPernoite(Number(e.target.value))}
                                  className="h-8 rounded border border-slate-300 bg-white px-1 text-sm"
                                >
                                  <option value={1}>1 dia</option>
                                  <option value={2}>2 dias</option>
                                  <option value={3}>3 dias</option>
                                  <option value={4}>4 dias</option>
                                  <option value={5}>5 dias</option>
                                  <option value={7}>7 dias</option>
                                  <option value={15}>15 dias</option>
                                  <option value={30}>30 dias</option>
                                </select>
                              ) : (
                                <span className="text-sm text-muted-foreground">Não</span>
                              )}


                              
                            </div>

                            
                          </div>

                          
                        </div>
                                              {/* Label e Botão Nova Placa na mesma linha */}
                      <div className="flex items-center gap-2 mt-4">
                        <Label className="flex items-center gap-2 text-sm font-medium text-black">
                          <Car className="h-4 w-4" />
                          Placa do Veículo
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNovaPlaca(true)}
                          className="h-8 px-3 text-xs font-medium gap-1.5 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-600 hover:text-primary transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Nova Placa
                        </Button>
                      </div>
                      
                      {/* Input de Nova Placa (quando ativado) */}
                      {showNovaPlaca && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={novaPlaca}
                            onChange={(e) => {
                              // Usar normalizarPlaca para formatar com espaços: ABC - 1234
                              const normalized = normalizarPlaca(e.target.value);
                              setNovaPlaca(normalized);
                            }}
                            placeholder="ABC - 1234"
                            maxLength={9}
                            className="h-9 text-sm font-mono uppercase"
                            disabled={isAddingPlaca}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAdicionarNovaPlaca}
                            disabled={novaPlaca.length < 7 || isAddingPlaca}
                            className="h-9"
                          >
                            {isAddingPlaca ? (
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Salvar'
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
                            className="h-9 px-2"
                          >
                            ✕
                          </Button>
                        </div>
                      )}
                      
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
                        </div>
                      ) : !showNovaPlaca ? (
                        <div className="text-sm text-muted-foreground py-2">
                          Nenhuma placa cadastrada
                        </div>
                      ) : null}
                    </div>


                    <div className="space-y-2 pt-4 border-t border-slate-300">
                      <Label className="flex items-center gap-2 text-sm font-medium text-black">
                        <FileText className="h-4 w-4 text-primary" />
                        Observação de Entrada 
                      </Label>
                      <Textarea
                        id="observacao-input"
                        placeholder="Ex: Vai para o barco X, entrega de material..."
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        className={`resize-none min-h-[100px] bg-white border-slate-300 focus:border-primary ${!validators.observacao(observacao) && observacao.trim() !== '' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                        required
                      />
                      {!validators.observacao(observacao) && observacao.trim() !== '' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                          <AlertCircle className="h-4 w-4" />
                          A observação deve conter pelo menos um caractere alfanumérico (letras ou números)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Alerta se não pode entrar */}
                  {validacao && !validacao.pode && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-red-50 p-4 border border-red-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-900 text-sm">Entrada Bloqueada</h4>
                          <p className="text-sm text-red-700 mt-1">{validacao.motivo}</p>
                        </div>
                      </div>
                      
                      {/* Botão de saída por esquecimento - usa verificação do banco se disponível */}
                      {(movimentacaoAtivaExibir || movimentacaoAtiva) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSaidaPorEsquecimento}
                          disabled={isRegistrandoSaida}
                          className="w-full h-10 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:border-amber-400"
                        >
                          {isRegistrandoSaida ? (
                            <div className="h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <LogOut className="h-4 w-4 mr-2" />
                          )}
                          Registrar Saída por Esquecimento
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Rodapé com Ação Principal */}
                <div className="p-6 border-t border-slate-200 bg-white mt-auto">
                  <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleClose}
                    className="flex-1 h-12 text-base font-semibold border-slate-300 text-black hover:bg-slate-50"
                  >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={!selectedPessoaId || !validacao?.pode || !validators.observacao(observacao)}
                      className={cn(
                        "flex-1 h-12 text-base font-semibold shadow-md transition-all",
                        validacao?.pode && validators.observacao(observacao) ? "bg-green-600 hover:bg-green-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        if (isEditing) {
                          e.preventDefault();
                          handleSaveEdit();
                        }
                      }}
                    >
                      {!selectedPessoaId ? (
                        "Selecione uma pessoa"
                      ) : isEditing ? (
                        <>
                          <Save className="h-5 w-5 mr-2" />
                          Salvar e Registrar Entrada
                        </>
                      ) : !validacao?.pode ? (
                        "Entrada não permitida"
                      ) : (
                        <>
                          <LogIn className="h-5 w-5 mr-2" />
                          Confirmar Entrada
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              // Empty State (Lado Direito)
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-300 shadow-sm">
                    <Search className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-lg font-semibold text-black">Selecione uma pessoa</h3>
                  <p className="text-black max-w-xs mt-2">
                    Clique em alguém na lista ao lado para ver detalhes, editar ou registrar a entrada.
                  </p>
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
