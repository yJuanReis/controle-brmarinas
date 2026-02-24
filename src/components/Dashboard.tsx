// Final
import React from 'react';
import { useState, useEffect } from 'react';
import { useMarina } from '@/contexts/MarinaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { SaidaAutomaticaButton } from '@/components/ui/SaidaAutomaticaButton';
import { EditarPessoaModal } from '@/components/modals/EditarPessoaModal';
import { EditarMovimentacaoModal } from '@/components/modals/EditarMovimentacaoModal';
import { RegistrarEntradaModal } from '@/components/modals/RegistrarEntradaModal';
import { CadastrarPessoaModal } from '@/components/modals/CadastrarPessoaModal';
import { RegistrarSaidaPersonalizadaModal } from '@/components/modals/RegistrarSaidaPersonalizadaModal';
import { RegistrarSaidaEmLoteModal } from '@/components/modals/RegistrarSaidaEmLoteModal';
import { Pessoa } from '@/types/marina';
import { marinaService } from '@/services/marinaService';
import { UserTypeIcon, UserTypeAvatar } from '@/lib/userTypeIcons';
import { supabase } from '@/lib/supabase';
import { 
  UserPlus, 
  LogIn, 
  LogOut, 
  Users, 
  Clock, 
  Car,
  Phone,
  FileText,
  Ship,
  Edit,
  RefreshCw,
  ArrowUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PessoaDentro } from '@/types/marina';
import { formatters } from '@/lib/validation';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Dashboard() {
  const { empresaAtual, getPessoasDentro, empresas, pessoas, movimentacoes } = useMarina();
  const [showCadastrar, setShowCadastrar] = useState(false);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showSaidaLote, setShowSaidaLote] = useState(false);
  const [pessoaPreSelecionada, setPessoaPreSelecionada] = useState<string | null>(null);
  const [nomePreenchidoCadastro, setNomePreenchidoCadastro] = useState<string>('');
  const [editandoPessoa, setEditandoPessoa] = useState<Pessoa | null>(null);
  const [editandoMovimentacao, setEditandoMovimentacao] = useState<PessoaDentro | null>(null);
  const [saidaModal, setSaidaModal] = useState<{ open: boolean; pessoa: PessoaDentro | null }>({
    open: false,
    pessoa: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmandoSaidaLote, setConfirmandoSaidaLote] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Efeito para controlar visibilidade do botão flutuante
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pagination helpers
  const getPaginatedItems = (items: any[], currentPage: number, pageSize: number) => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  };

  const getTotalPages = (totalItems: number, pageSize: number) => {
    return Math.ceil(totalItems / pageSize);
  };

  // Monitoramento automático de 30 dias (720 horas)
  useEffect(() => {
    if (!empresaAtual) return;

    const verificarTempoPermanencia = async () => {
      try {
        const pessoasRemovidas = await marinaService.executarSaidaAutomatica(empresaAtual.id, 720);
        if (pessoasRemovidas > 0) {}
      } catch (error) {}
    };

    const interval = setInterval(verificarTempoPermanencia, 3600000);
    verificarTempoPermanencia();
    return () => clearInterval(interval);
  }, [empresaAtual]);

  const handleCadastrarERegistrar = (pessoaId: string) => {
    setPessoaPreSelecionada(pessoaId);
    setShowCadastrar(false);
    setShowEntrada(true);
  };

  const pessoasDentro = getPessoasDentro();

  const formatHora = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  };

  const getTempoDecorrido = (dateStr: string) => {
    const minutos = Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    if (horas > 0) return `${horas}h ${minutos % 60}min`;
    return `${minutos}min`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setIsRefreshing(false);
    }
  };

  const toggleCardExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const paginatedItems = getPaginatedItems(pessoasDentro, currentPage, pageSize);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="w-full px-3 md:px-4 py-6">
        {/* Action buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          
          <div className="col-span-1">
            <Button
              onClick={() => setShowEntrada(true)}
              size="lg"
              className="gap-2 bg-success hover:bg-success/90 w-full h-auto py-3 md:py-4 text-sm md:text-base"
            >
              <LogIn className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Registrar Entrada</div>
              </div>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <Button
              onClick={() => setShowSaidaLote(true)}
              size="lg"
              className="gap-2 bg-destructive hover:bg-destructive/90 h-auto py-3 md:py-4 text-sm md:text-base"
              disabled={pessoasDentro.length === 0}
            >
              <LogOut className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Registrar Saída</div>
              </div>
            </Button>

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="lg"
              className="gap-2 h-auto py-3 md:py-4 text-sm md:text-base"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <div className="text-left">
                <div className="font-semibold">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</div>
              </div>
            </Button>
          </div>
        </div>

        {/* People inside table */}
        <div className="card-elevated-md overflow-hidden w-full">
          <div className="p-3 md:p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registro de entrada
              </h3>
              <div className="text-lg text-black mt-1">
                {pessoasDentro.length} pessoa{pessoasDentro.length !== 1 ? 's' : ''} na marina
              </div>
            </div>
          </div>

          {pessoasDentro.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                <Users className="h-8 w-8 text-black" />
              </div>
              <h4 className="font-medium text-black mb-1 text-lg">Marina vazia</h4>
              <p className="text-sm text-black mb-6 max-w-md mx-auto">
                Registre uma entrada para começar a controlar o acesso à sua marina
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <Button onClick={() => setShowEntrada(true)} className="bg-success hover:bg-success/90 gap-2">
                  <LogIn className="h-4 w-4" />
                  Registrar Entrada
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ── MOBILE CARDS (≤750px) ── */}
              <div className="block min-[751px]:hidden divide-y divide-border">
                {paginatedItems.map((item, index) => {
                  const isExpanded = expandedCards.has(item.movimentacaoId);
                  return (
                    <div
                      key={item.movimentacaoId}
                      className="p-3 animate-fade-in"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      {/* Top row: avatar + name + entry time */}
                      <div className="flex items-center gap-3 mb-3">
                        <UserTypeAvatar pessoa={item.pessoa} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-black text-base truncate leading-tight">
                            {item.pessoa.nome}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {item.pessoa.tipo && (
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {item.pessoa.tipo === 'prestador' ? 'Prestador' : item.pessoa.tipo.charAt(0).toUpperCase() + item.pessoa.tipo.slice(1)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-black">
                              <LogIn className="h-3 w-3 text-success" />
                              {formatHora(item.entradaEm)}
                              <span className="text-black/60">· {getTempoDecorrido(item.entradaEm)}</span>
                            </span>
                          </div>
                        </div>
                        {/* Expand toggle */}
                        <button
                          onClick={() => toggleCardExpanded(item.movimentacaoId)}
                          className="p-1.5 rounded-md text-black/50 hover:text-black hover:bg-muted/50 transition-colors flex-shrink-0"
                          aria-label={isExpanded ? 'Recolher detalhes' : 'Ver detalhes'}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div className="mb-3 pl-11 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          <div>
                            <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Documento</p>
                            <p className="text-black">{item.pessoa.documento || '—'}</p>
                          </div>
                          {(item.placa || item.pessoa.placa) && (
                            <div>
                              <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Placa</p>
                              <p className="font-mono bg-muted px-2 py-0.5 rounded text-xs inline-block">
                                {formatters.placa(item.placa || item.pessoa.placa || '')}
                              </p>
                            </div>
                          )}
                          {item.observacao && (
                            <div className="col-span-2">
                              <p className="text-xs text-black/50 uppercase tracking-wide font-medium mb-0.5">Observação</p>
                              <p className="text-black whitespace-pre-wrap text-xs">{item.observacao}</p>
                            </div>
                          )}
                          {!item.observacao && (
                            <div className="col-span-2">
                              <p className="text-xs text-red-500 font-medium">⚠️ Observação obrigatória</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons — always visible, full-width, large touch targets */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="default"
                          variant="outline"
                          onClick={() => setEditandoMovimentacao(item)}
                          className="gap-2 h-11 text-sm font-medium w-full"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          size="default"
                          variant="destructive"
                          onClick={() => setSaidaModal({ open: true, pessoa: item })}
                          className="gap-2 h-11 text-sm font-medium w-full bg-destructive text-destructive-foreground"
                        >
                          <LogOut className="h-4 w-4" />
                          Saída
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── DESKTOP TABLE (≥751px) ── */}
              <div className="hidden min-[751px]:block overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-center py-3 px-2 md:px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Ação
                      </th>
                      <th className="text-center py-3 px-2 md:px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Pessoa
                      </th>
                      <th className="text-center py-3 px-2 md:px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="text-center py-3 px-2 md:px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Placa
                      </th>
                      <th className="text-center py-3 px-2 md:px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="text-center py-3 px-2 md:px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Entrada
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedItems.map((item, index) => (
                      <React.Fragment key={item.movimentacaoId}>
                        <tr
                          id={`row-${item.movimentacaoId}`}
                          className="hover:bg-muted/30 transition-smooth animate-fade-in cursor-pointer"
                          style={{ animationDelay: `${index * 50}ms` }}
                          onClick={() => {
                            const row = document.getElementById(`row-${item.movimentacaoId}`);
                            const details = document.getElementById(`details-${item.movimentacaoId}`);
                            if (row && details) {
                              if (details.style.display === 'none' || !details.style.display) {
                                details.style.display = 'table-row';
                                row.classList.add('bg-muted/50');
                              } else {
                                details.style.display = 'none';
                                row.classList.remove('bg-muted/50');
                              }
                            }
                          }}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <UserTypeAvatar pessoa={item.pessoa} />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-black truncate">
                                  {item.pessoa.nome}
                                </p>
                                {item.observacao ? (
                                  <p className="text-xs text-black whitespace-pre-wrap mt-1 max-w-[300px] truncate">
                                    {item.observacao}
                                  </p>
                                ) : (
                                  <p className="text-xs text-black sm:hidden mt-1">
                                    {item.pessoa.documento}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 md:px-5 text-center">
                            <div className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm text-black">
                              <FileText className="h-3.5 w-3.5 hidden md:inline" />
                              {item.pessoa.documento}
                            </div>
                          </td>
                          <td className="py-4 px-2 md:px-5 text-center">
                            {(item.placa || item.pessoa.placa) ? (
                              <div className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm">
                                <Car className="h-3.5 w-3.5 text-black hidden md:inline" />
                                <span className="font-mono bg-muted px-1 md:px-2 py-0.5 rounded text-xs">
                                  {formatters.placa(item.placa || item.pessoa.placa || '')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs md:text-sm text-black">—</span>
                            )}
                          </td>
                          <td className="py-4 px-2 md:px-5 text-center">
                            {item.pessoa.tipo ? (
                              <span className="text-xs font-medium bg-primary/10 text-primary px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full">
                                {item.pessoa.tipo === 'prestador' ? 'PS' : item.pessoa.tipo.charAt(0).toUpperCase() + item.pessoa.tipo.slice(1)}
                              </span>
                            ) : (
                              <span className="text-xs md:text-sm text-black">—</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <LogIn className="h-3.5 w-3.5 text-success" />
                              <div>
                                <p className="text-sm font-medium">{formatHora(item.entradaEm)}</p>
                                <p className="text-xs text-black">
                                  {getTempoDecorrido(item.entradaEm)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditandoMovimentacao(item);
                                }}
                                className="gap-1.5"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Editar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSaidaModal({ open: true, pessoa: item });
                                }}
                                className="gap-1.5 bg-destructive text-destructive-foreground"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Saída</span>
                              </Button>
                            </div>
                          </td>
                        </tr>

                        <tr
                          id={`details-${item.movimentacaoId}`}
                          className="hover:bg-muted/30 transition-smooth"
                          style={{ display: 'none' }}
                        >
                          <td colSpan={6} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                {item.observacao ? (
                                  <p className="text-sm text-black whitespace-pre-wrap">
                                    {item.observacao}
                                  </p>
                                ) : (
                                  <p className="text-sm text-red-600 font-medium">
                                    ⚠️ Observação obrigatória
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {getTotalPages(pessoasDentro.length, pageSize) > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
                  <div className="text-sm text-black">
                    Mostrando {Math.min((currentPage - 1) * pageSize + 1, pessoasDentro.length)} a{' '}
                    {Math.min(currentPage * pageSize, pessoasDentro.length)} de {pessoasDentro.length} pessoas
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.min(5, getTotalPages(pessoasDentro.length, pageSize)) }, (_, i) => {
                        const totalPages = getTotalPages(pessoasDentro.length, pageSize);
                        let pageNum;

                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < getTotalPages(pessoasDentro.length, pageSize) && setCurrentPage(currentPage + 1)}
                          className={currentPage >= getTotalPages(pessoasDentro.length, pageSize) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <EditarPessoaModal
        open={editandoPessoa !== null}
        onOpenChange={(open) => !open && setEditandoPessoa(null)}
        pessoa={editandoPessoa}
      />
      <RegistrarEntradaModal
        open={showEntrada}
        onOpenChange={setShowEntrada}
        pessoaPreSelecionada={pessoaPreSelecionada}
        onPessoaPreSelecionadaUsada={() => setPessoaPreSelecionada(null)}
        onAbrirCadastro={(nomePreenchido) => {
          setNomePreenchidoCadastro(nomePreenchido);
          setShowCadastrar(true);
          setShowEntrada(false);
        }}
      />
      <CadastrarPessoaModal
        open={showCadastrar}
        onOpenChange={setShowCadastrar}
        nomePreenchido={nomePreenchidoCadastro}
        onCadastrarERegistrar={handleCadastrarERegistrar}
      />
      <RegistrarSaidaPersonalizadaModal
        open={saidaModal.open}
        onOpenChange={(open) => setSaidaModal({ open, pessoa: saidaModal.pessoa })}
        pessoaDentro={saidaModal.pessoa}
      />
      <RegistrarSaidaEmLoteModal
        open={showSaidaLote}
        onOpenChange={setShowSaidaLote}
        pessoasDentro={pessoasDentro}
      />
      <EditarMovimentacaoModal
        open={editandoMovimentacao !== null}
        onOpenChange={(open) => !open && setEditandoMovimentacao(null)}
        movimentacao={editandoMovimentacao}
      />

      {/* Botão flutuante para rolar até o topo */}
      <Button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-in-out ${
          showScrollTop 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        variant="default"
        size="icon"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
}