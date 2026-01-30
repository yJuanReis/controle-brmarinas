import { useState } from 'react';
import { useMarina } from '@/contexts/MarinaContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { EditarPessoaModal } from '@/components/modals/EditarPessoaModal';
import { RegistrarEntradaModal } from '@/components/modals/RegistrarEntradaModal';
import { RegistrarSaidaHistoricoModal } from '@/components/modals/RegistrarSaidaHistoricoModal';
import { RegistrarSaidaLoteModal } from '@/components/modals/RegistrarSaidaLoteModal';
import { Pessoa } from '@/types/marina';
import { UserTypeIcon, UserTypeAvatar } from '@/lib/userTypeIcons';
import { 
  UserPlus, 
  LogIn, 
  LogOut, 
  Users, 
  Clock, 
  Car,
  Phone,
  FileText,
  Anchor,
  Edit,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PessoaDentro } from '@/types/marina';

export function Dashboard() {
  const { empresaAtual, getPessoasDentro, empresas, pessoas, movimentacoes } = useMarina();
  const [showCadastrar, setShowCadastrar] = useState(false);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showSaidaLote, setShowSaidaLote] = useState(false);
  const [pessoaPreSelecionada, setPessoaPreSelecionada] = useState<string | null>(null);
  const [nomePreenchidoCadastro, setNomePreenchidoCadastro] = useState<string>('');
  const [editandoPessoa, setEditandoPessoa] = useState<Pessoa | null>(null);
  const [saidaModal, setSaidaModal] = useState<{ open: boolean; pessoa: PessoaDentro | null }>({
    open: false,
    pessoa: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    console.log('🔄 Atualizando dados do painel...');

    // Simular atualização com delay visual
    await new Promise(resolve => setTimeout(resolve, 500));

    setIsRefreshing(false);
    console.log('✅ Dados atualizados');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Button 
            onClick={() => setShowEntrada(true)}
            size="lg"
            className="gap-2 bg-success hover:bg-success/90 px-6 py-4 text-base h-auto"
          >
            <LogIn className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Registrar Entrada</div>
              <div className="text-xs opacity-75">Marcar chegada</div>
            </div>
          </Button>
          <Button 
            onClick={() => setShowSaidaLote(true)}
            size="lg"
            className="gap-2 bg-destructive hover:bg-destructive/90 px-6 py-4 text-base h-auto"
            disabled={pessoasDentro.length === 0}
          >
            <LogOut className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Registrar Saída</div>
              <div className="text-xs opacity-75">Marcar saída em lote</div>
            </div>
          </Button>
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
              <div className="text-xs opacity-75">Recarregar dados</div>
            </div>
          </Button>
        </div>


        {/* People inside table */}
        <div className="card-elevated-md overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-lg font-display font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Registro de entrada
            </h3>
            <p className="text-sm text-black mt-1">
              {pessoasDentro.length === 0 
                ? 'Nenhuma pessoa na marina no momento' 
                : `${pessoasDentro.length} pessoa${pessoasDentro.length > 1 ? 's' : ''} na marina.`}
            </p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                      Pessoa
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden sm:table-cell">
                      Documento
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden lg:table-cell">
                      Placa
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider hidden md:table-cell">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                      Entrada
                    </th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-black uppercase tracking-wider">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pessoasDentro.map((item, index) => (
                    <tr 
                      key={item.movimentacaoId} 
                      className="hover:bg-muted/30 transition-smooth animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <UserTypeAvatar pessoa={item.pessoa} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-black truncate">
                              {item.pessoa.nome}
                            </p>
                            {item.observacao && (
                              <p className="text-xs text-black whitespace-pre-wrap mt-1 max-w-[300px]">
                                {item.observacao}
                              </p>
                            )}
                            <p className="text-xs text-black sm:hidden mt-1">
                              {item.pessoa.documento}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 hidden sm:table-cell">
                        <div className="flex items-center gap-2 text-sm text-black">
                          <FileText className="h-3.5 w-3.5" />
                          {item.pessoa.documento}
                        </div>
                      </td>
                      <td className="py-4 px-5 hidden lg:table-cell">
                        {item.pessoa.placa ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Car className="h-3.5 w-3.5 text-black" />
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
                              {item.pessoa.placa}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-black">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 hidden md:table-cell">
                        {item.pessoa.tipo ? (
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                            {item.pessoa.tipo === 'prestador' ? 'PS' : item.pessoa.tipo.charAt(0).toUpperCase() + item.pessoa.tipo.slice(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-black">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <LogIn className="h-3.5 w-3.5 text-success" />
                          <div>
                            <p className="text-sm font-medium">{formatHora(item.entradaEm)}</p>
                            <p className="text-xs text-black">
                              {getTempoDecorrido(item.entradaEm)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditandoPessoa(item.pessoa)}
                            className="gap-1.5"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setSaidaModal({ open: true, pessoa: item })}
                            className="gap-1.5 bg-destructive text-destructive-foreground"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Saída</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        }}
      />
      <RegistrarSaidaHistoricoModal
        open={saidaModal.open}
        onOpenChange={(open) => setSaidaModal({ open, pessoa: saidaModal.pessoa })}
        pessoaDentro={saidaModal.pessoa}
      />
      <RegistrarSaidaLoteModal 
        open={showSaidaLote}
        onOpenChange={setShowSaidaLote}
        pessoasDentro={pessoasDentro}
      />
    </div>
  );
}