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
  ArrowUp
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

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

  // Monitoramento automático de 8 horas
  useEffect(() => {
    if (!empresaAtual) return;

    const verificarTempoPermanencia = async () => {
      try {

        // Executar saída automática para quem ultrapassou 8 horas
        const pessoasRemovidas = await marinaService.executarSaidaAutomatica(empresaAtual.id, 8);

        if (pessoasRemovidas > 0) {
        }
      } catch (error) {
      }
    };

    // Executar verificação a cada 1 hora (3600000ms)
    const interval = setInterval(verificarTempoPermanencia, 3600000);

    // Executar verificação imediatamente ao montar o componente
    verificarTempoPermanencia();

    // Limpar intervalo ao desmontar
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

  // Função para atualizar apenas os dados, não a página
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Forçar recarregamento da página para atualizar todos os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 justify-center">

          {/* Botao de Registrar Entrada */}
          <Button
            onClick={() => setShowEntrada(true)}
            size="lg"
            className="gap-2 bg-success hover:bg-success/90 px-6 py-4 text-base h-auto"
          >
            <LogIn className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Registrar Entrada</div>
            </div>
          </Button>

          {/* Botao de Saída */}
          <Button
            onClick={() => setShowSaidaLote(true)}
            size="lg"
            className="gap-2 bg-destructive hover:bg-destructive/90 px-6 py-4 text-base h-auto"
            disabled={pessoasDentro.length === 0}
          >
            <LogOut className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Registrar Saída</div>
            </div>
          </Button>

          {/* Botao de Atualizar */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="lg"
            className="gap-2 px-6 py-4 text-base h-auto"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <div className="text-left">
              <div className="font-semibold">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</div>

            </div>
          </Button>
        </div>


        {/* People inside table */}
        <div className="card-elevated-md overflow-hidden">
          <div className="p-5 border-b border-border">
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


              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Pessoa
                      </th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden sm:table-cell">
                        Documento
                      </th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden lg:table-cell">
                        Placa
                      </th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden md:table-cell">
                        Tipo
                      </th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Entrada
                      </th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                        Ação
                      </th>
                    </tr>
                  </thead>
<tbody className="divide-y divide-border">
                    {getPaginatedItems(pessoasDentro, currentPage, pageSize).map((item, index) => (
                      <React.Fragment key={item.movimentacaoId}>
                        {/* Linha principal */}
                        <tr
                          key={item.movimentacaoId}
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
                          <td className="py-4 px-5 hidden sm:table-cell text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-black">
                              <FileText className="h-3.5 w-3.5" />
                              {item.pessoa.documento}
                            </div>
                          </td>
                          <td className="py-4 px-5 hidden lg:table-cell text-center">
                            {item.pessoa.placa ? (
                              <div className="flex items-center justify-center gap-2 text-sm">
                                <Car className="h-3.5 w-3.5 text-black" />
                                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                                  {formatters.placa(item.pessoa.placa)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-black">—</span>
                            )}
                          </td>
                          <td className="py-4 px-5 hidden md:table-cell text-center">
                            {item.pessoa.tipo ? (
                              <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                                {item.pessoa.tipo === 'prestador' ? 'PS' : item.pessoa.tipo.charAt(0).toUpperCase() + item.pessoa.tipo.slice(1)}
                              </span>
                            ) : (
                              <span className="text-sm text-black">—</span>
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

                        {/* Linha de detalhes (observação) */}
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
                <div className="flex items-center justify-between p-4 border-t border-border">
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

                      {/* Page numbers */}
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
          setShowEntrada(false); // Fechar o modal de entrada
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
