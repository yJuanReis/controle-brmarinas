// Final
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

  const getTotalPages = (totalItems: number, size: number) => Math.ceil(totalItems / size);
  const getPaginatedItems = <T,>(items: T[], page: number, size: number): T[] => {
    return items.slice((page - 1) * size, page * size);
  };

  const pessoasFiltradas = useMemo(() => {
    const filteredBySearch = pessoas.filter(p =>
      smartSearch(p.nome, searchTerm) ||
      smartSearch(p.documento, searchTerm) ||
      smartSearch(p.placa || '', searchTerm)
    );
    return filteredBySearch.filter(p => tipoFiltro === 'all' || p.tipo === tipoFiltro);
  }, [pessoas, searchTerm, tipoFiltro]);

  const pessoasPaginadas = useMemo(() => {
    return getPaginatedItems(pessoasFiltradas, currentPage, pageSize);
  }, [pessoasFiltradas, currentPage, pageSize]);

  const totalPages = getTotalPages(pessoasFiltradas.length, pageSize);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop((window.pageYOffset || document.documentElement.scrollTop) > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">

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
              className="gap-2 bg-orange-500 hover:bg-orange-600 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base h-auto w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
              <div className="text-left hidden sm:block">
                <div className="font-semibold">Cadastrar Pessoa</div>
                <div className="text-xs opacity-75">Adicionar nova pessoa</div>
              </div>
              <div className="text-left sm:hidden">
                <div className="font-semibold">Cadastrar</div>
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
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Users className="h-3 w-3" />
                Tipo de pessoa
              </Label>
              <Select value={tipoFiltro} onValueChange={(v) => { setTipoFiltro(v); setCurrentPage(1); }}>
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

          {(searchTerm || tipoFiltro !== 'all') && (
            <div className="flex items-center justify-end mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchTerm(''); setTipoFiltro('all'); }}
                className="text-muted-foreground gap-1.5"
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          )}
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
            <div className="grid gap-3 md:gap-4 md:grid-cols-2">
              {pessoasPaginadas.map((pessoa) => (
                <div
                  key={pessoa.id}
                  className="card-elevated hover:shadow-lg transition-smooth flex flex-col"
                >
                  {/* Card body */}
                  <div className="p-4 flex-1">
                    {/* Top: avatar + name + tipo */}
                    <div className="flex items-start gap-3 mb-3">
                      <UserTypeAvatar pessoa={pessoa} />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-base leading-tight">
                          {pessoa.nome}
                        </h3>
                        {pessoa.tipo && (
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">
                            {pessoa.tipo.charAt(0).toUpperCase() + pessoa.tipo.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info fields */}
                    <div className="space-y-2 border-t border-border pt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Documento:</span>
                        <span className="font-mono text-foreground">{pessoa.documento}</span>
                      </div>

                      {pessoa.contato && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Contato:</span>
                          <span className="font-medium text-foreground">{pessoa.contato}</span>
                        </div>
                      )}

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

                  {/* Action buttons — full-width, large touch targets */}
                  <div className="grid grid-cols-2 gap-2 p-3 pt-0">
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => setEditandoPessoa(pessoa)}
                      className="gap-2 h-11 text-sm font-medium w-full"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => setExcluindoPessoa(pessoa)}
                      className="gap-2 h-11 text-sm font-medium w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
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
                        let pageNum: number;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
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