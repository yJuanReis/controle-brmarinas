import { useState, useMemo, useEffect } from 'react';
import { useMarina } from '@/contexts/MarinaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { EditarPessoaModal } from '@/components/modals/EditarPessoaModal';
import { CadastrarPessoaModal } from '@/components/modals/CadastrarPessoaModal';
import { ExcluirPessoaModal } from '@/components/modals/ExcluirPessoaModal';
import { Pessoa } from '@/types/marina';
import { UserTypeAvatar } from '@/lib/userTypeIcons';
import { smartSearch } from '@/lib/utils';
import { formatters } from '@/lib/validation';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Phone,
  FileText,
  Car,
  X,
  UserPlus,
  ArrowUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tiposUsuario = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'visita', label: 'Visita' },
  { value: 'marinheiro', label: 'Marinheiro' },
  { value: 'proprietario', label: 'Proprietário' },
  { value: 'colaborador', label: 'Colaborador' },
];

export function PessoasPage() {
  const { pessoas } = useMarina();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editandoPessoa, setEditandoPessoa] = useState<Pessoa | null>(null);
  const [excluindoPessoa, setExcluindoPessoa] = useState<Pessoa | null>(null);
  const [showCadastrar, setShowCadastrar] = useState(false);
  const [nomePreenchidoCadastro, setNomePreenchidoCadastro] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Pagination helpers
  const getTotalPages = (totalItems: number, size: number) => Math.ceil(totalItems / size);
  const getPaginatedItems = <T,>(items: T[], page: number, size: number): T[] => {
    const startIndex = (page - 1) * size;
    return items.slice(startIndex, startIndex + size);
  };

  // Resetar página ao alterar filtros
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const pessoasFiltradas = useMemo(() => {
    const filteredBySearch = pessoas.filter(p => 
      smartSearch(p.nome, searchTerm) ||
      smartSearch(p.documento, searchTerm) ||
      smartSearch(p.placa || '', searchTerm)
    );
    
    return filteredBySearch.filter(p => 
      tipoFiltro === 'all' || p.tipo === tipoFiltro
    );
  }, [pessoas, searchTerm, tipoFiltro]);

  const pessoasPaginadas = useMemo(() => {
    return getPaginatedItems(pessoasFiltradas, currentPage, pageSize);
  }, [pessoasFiltradas, currentPage, pageSize]);

  const totalPages = getTotalPages(pessoasFiltradas.length, pageSize);

  // Efeito para controlar visibilidade do botão flutuante
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}


        {/* Search and Filters */}
        <div className="card-elevated p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-1 flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Pessoas Cadastradas
              </h2>
              <p className="text-muted-foreground">
                {pessoasFiltradas.length} de {pessoas.length} pessoa{pessoas.length !== 1 ? 's' : ''}
              </p>
            </div>

            <Button 
              onClick={() => setShowCadastrar(true)}
              size="lg"
              className="gap-2 bg-orange-500 hover:bg-orange-600 px-6 py-4 text-base h-auto"
            >
              <UserPlus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Cadastrar Pessoa</div>
                <div className="text-xs opacity-75">Adicionar nova pessoa</div>
              </div>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Search className="h-3 w-3" />
                Buscar pessoa
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Nome, documento ou placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                Tipo de pessoa
              </Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  {tiposUsuario.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end mt-4">
            {(searchTerm || tipoFiltro !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTipoFiltro('all');
                }}
                className="text-muted-foreground gap-1.5"
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {pessoasFiltradas.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-1">Nenhuma pessoa encontrada</h4>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Cadastre uma pessoa para começar'}
            </p>
          </div>
        ) : (
          <>
              <div className="grid gap-4 md:grid-cols-2">
                {pessoasPaginadas.map((pessoa) => (
                  <div 
                    key={pessoa.id}
                    className="card-elevated p-5 hover:shadow-lg transition-smooth"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <UserTypeAvatar pessoa={pessoa} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {pessoa.nome}
                        </h3>
                        {pessoa.tipo && (
                          <p className="text-xs font-medium text-primary mt-1">
                            {pessoa.tipo.charAt(0).toUpperCase() + pessoa.tipo.slice(1)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditandoPessoa(pessoa)}
                          className="gap-1.5"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExcluindoPessoa(pessoa)}
                          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Excluir</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      {/* Documento */}
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Documento:</span>
                        <span className="font-mono text-foreground">{pessoa.documento}</span>
                      </div>

                      {/* Contato */}
                      {pessoa.contato && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Contato:</span>
                          <span className="font-medium text-foreground">{pessoa.contato}</span>
                        </div>
                      )}

                      {/* Placa */}
                      {pessoa.placa && (
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Placa:</span>
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs font-medium text-foreground">
                            {formatters.placa(pessoa.placa)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {Math.min((currentPage - 1) * pageSize + 1, pessoasFiltradas.length)} a {Math.min(currentPage * pageSize, pessoasFiltradas.length)} de {pessoasFiltradas.length} pessoas
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={pageSize.toString()} onValueChange={(value) => { setPageSize(parseInt(value)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 por página</SelectItem>
                        <SelectItem value="50">50 por página</SelectItem>
                        <SelectItem value="75">75 por página</SelectItem>
                      </SelectContent>
                    </Select>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const totalP = totalPages;
                          let pageNum;
                          if (totalP <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalP - 2) {
                            pageNum = totalP - 4 + i;
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
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </div>
              )}
            </>
          )}
      </main>

      {/* Modals */}
      <CadastrarPessoaModal 
        open={showCadastrar} 
        onOpenChange={setShowCadastrar}
        nomePreenchido={nomePreenchidoCadastro}
      />
      <EditarPessoaModal 
        open={editandoPessoa !== null} 
        onOpenChange={(open) => !open && setEditandoPessoa(null)}
        pessoa={editandoPessoa}
      />
      <ExcluirPessoaModal 
        open={excluindoPessoa !== null} 
        onOpenChange={(open) => !open && setExcluindoPessoa(null)}
        pessoa={excluindoPessoa}
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
