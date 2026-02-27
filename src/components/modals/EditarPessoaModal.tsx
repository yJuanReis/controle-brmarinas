// Final
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarina } from '@/contexts/MarinaContext';
import { Pessoa } from '@/types/marina';
import { FileText, Phone, Car, Users, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectDocumentType } from '@/lib/validation';
import { normalizarPlaca, formatters } from '@/lib/validation/formatters';
import { supabase } from '@/lib/supabase';
import { getPlacasPorPessoa, excluirPlacaPessoa, PlacaPessoa } from '@/services/marinaService';
import { toast } from 'sonner';

type TipoPessoa = 'cliente' | 'visita' | 'marinheiro' | 'proprietario' | 'colaborador' | 'prestador' | '';

interface EditarPessoaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: Pessoa | null;
}

export function EditarPessoaModal({ open, onOpenChange, pessoa }: EditarPessoaModalProps) {
  const { atualizarPessoa } = useMarina();
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    tipo: '' as TipoPessoa,
    contato: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentType, setDocumentType] = useState<'cpf' | 'rg' | 'outro' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para gerenciar placas
  const [placasExtras, setPlacasExtras] = useState<PlacaPessoa[]>([]);
  const [loadingPlacas, setLoadingPlacas] = useState(false);
  const [novaPlaca, setNovaPlaca] = useState('');
  const [excluindoPlaca, setExcluindoPlaca] = useState<string | null>(null);

  // Preencher formulário com dados da pessoa - busca dados frescos do banco
  useEffect(() => {
    const fetchPessoaData = async () => {
      if (!pessoa || !open) return;
      
      setLoading(true);
      try {
        // Buscar dados atualizados diretamente do banco
        const { data, error } = await supabase
          .from('pessoas')
          .select('*')
          .eq('id', pessoa.id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setFormData({
            nome: data.nome,
            documento: data.documento,
            // Normalizar tipo para minúsculas para funcionar no select
            tipo: (data.tipo ? data.tipo.toLowerCase() : '') as TipoPessoa,
            contato: data.contato || '',
          });
        }
      } catch (err) {
        // Se der erro, usa os dados do props como fallback (normalizando para minúsculas)
        setFormData({
          nome: pessoa.nome,
          documento: pessoa.documento,
          tipo: (pessoa.tipo ? pessoa.tipo.toLowerCase() : '') as TipoPessoa,
          contato: pessoa.contato || '',
        });
      } finally {
        setLoading(false);
        setErrors({});
      }
    };

    fetchPessoaData();
  }, [pessoa, open]);

  // Carregar placas extras da pessoa
  useEffect(() => {
    const carregarPlacas = async () => {
      if (!pessoa || !open) return;
      
      setLoadingPlacas(true);
      try {
        const placas = await getPlacasPorPessoa(pessoa.id);
        setPlacasExtras(placas);
      } catch (err) {
        console.error('Erro ao carregar placas:', err);
      } finally {
        setLoadingPlacas(false);
      }
    };

    carregarPlacas();
  }, [pessoa, open]);

  // Função para adicionar nova placa
  const handleAdicionarPlaca = async () => {
    if (!pessoa || !novaPlaca.trim()) return;

    const placaNormalizada = normalizarPlaca(novaPlaca.trim());
    if (!placaNormalizada) {
      toast.error('Placa inválida');
      return;
    }

    try {
      const { adicionarPlacaPessoa } = await import('@/services/marinaService');
      const placaAdicionada = await adicionarPlacaPessoa(pessoa.id, placaNormalizada);
      
      if (placaAdicionada) {
        // Recarregar placas
        const placas = await getPlacasPorPessoa(pessoa.id);
        setPlacasExtras(placas);
        setNovaPlaca('');
        toast.success('Placa adicionada com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao adicionar placa:', err);
      toast.error('Erro ao adicionar placa');
    }
  };

  // Função para excluir placa
  const handleExcluirPlaca = async (placaId: string) => {
    if (!pessoa) return;

    setExcluindoPlaca(placaId);
    try {
      const sucesso = await excluirPlacaPessoa(placaId);
      
      if (sucesso) {
        // Atualizar lista local
        setPlacasExtras(prev => prev.filter(p => p.id !== placaId));
        toast.success('Placa excluída com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao excluir placa:', err);
      toast.error('Erro ao excluir placa');
    } finally {
      setExcluindoPlaca(null);
    }
  };

  const handleChange = (field: string, value: string) => {
    let processedValue = value;
    
    // Processamento específico para cada campo
    if (field === 'documento') {
      // Detectar tipo de documento e formatar automaticamente
      const detectedType = detectDocumentType(value);
      setDocumentType(detectedType);
      
      if (detectedType === 'cpf') {
        // Formatar CPF: 123.456.789-01
        const numericOnly = value.replace(/\D/g, '');
        if (numericOnly.length <= 11) {
          processedValue = numericOnly.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/\.$/, '').replace(/\.$/, '').replace(/-$/, '');
        }
      } else if (detectedType === 'rg') {
        // Formatar RG: 12.345.678-9
        const numericOnly = value.replace(/\D/g, '');
        if (numericOnly.length >= 4 && numericOnly.length <= 10) {
          processedValue = numericOnly.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4').replace(/\.$/, '').replace(/\.$/, '').replace(/-$/, '');
        }
      } else {
        // Outros documentos: converter para maiúsculas
        processedValue = value.toUpperCase();
      }
    } else if (field === 'contato') {
      processedValue = value.replace(/\D/g, '');
    }
    // Campo tipo não precisa de processamento especial
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    if (!formData.documento.trim()) {
      newErrors.documento = 'Documento é obrigatório';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !pessoa) return;

    atualizarPessoa(pessoa.id, {
      nome: formData.nome,
      documento: formData.documento,
      tipo: (formData.tipo as TipoPessoa) || undefined,
      contato: formData.contato || undefined,
    });

    setFormData({ nome: '', documento: '', tipo: '', contato: '' });
    setErrors({});
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({ nome: '', documento: '', tipo: '', contato: '' });
    setErrors({});
    setPlacasExtras([]);
    setNovaPlaca('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-6" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Editar Pessoa
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da pessoa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando dados...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Nome *
                </Label>
                <Input
                  id="nome"
                  placeholder="Nome completo"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={cn("h-11", errors.nome ? 'border-destructive' : '')}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento" className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Documento *
                </Label>
                <Input
                  id="documento"
                  placeholder="CPF, RG ou outro documento"
                  value={formData.documento}
                  onChange={(e) => {
                    const cleanValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
                    handleChange('documento', cleanValue);
                  }}
                  onKeyDown={(e) => {
                    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '];
                    const allowedKeys = /^[a-zA-Z0-9]$/;
                    if (!controlKeys.includes(e.key) && !allowedKeys.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className={cn("h-11", errors.documento ? 'border-destructive' : '')}
                  maxLength={20}
                />
                {errors.documento && (
                  <p className="text-xs text-destructive">{errors.documento}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <Label htmlFor="tipo" className="flex items-center gap-2 flex-shrink-0 text-sm font-medium">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Tipo de Pessoa
                  </Label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => handleChange('tipo', e.target.value)}
                    className="h-11 px-3 rounded-md border border-input bg-background text-sm flex-1"
                  >
                    <option value="">Selecione um tipo</option>
                    <option value="cliente">Cliente</option>
                    <option value="colaborador">Colaborador</option>
                    <option value="marinheiro">Marinheiro</option>
                    <option value="prestador">Prestador de Serviço</option>
                    <option value="proprietario">Proprietário</option>
                    <option value="visita">Visita</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato" className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Contato
                </Label>
                <Input
                  id="contato"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Telefone ou celular"
                  value={formData.contato}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    handleChange('contato', numericValue);
                  }}
                  className="h-11"
                  maxLength={15}
                />
              </div>

              {/* Seção de Placas */}
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Placas cadastradas
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {placasExtras.length} plaque(s)
                  </span>
                </div>

                {/* Lista de placas */}
                {loadingPlacas ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Carregando placas...
                  </div>
                ) : placasExtras.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {placasExtras.map((placa) => (
                      <div
                        key={placa.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono border bg-background border-border"
                      >
                        <span>{formatters.placa(placa.placa)}</span>
                        <button
                          type="button"
                          onClick={() => handleExcluirPlaca(placa.id)}
                          disabled={excluindoPlaca === placa.id}
                          className="p-1 hover:bg-destructive/10 rounded text-destructive disabled:opacity-50"
                          title="Excluir placa"
                        >
                          {excluindoPlaca === placa.id ? (
                            <div className="h-4 w-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma placa adicional cadastrada
                  </div>
                )}

                {/* Adicionar nova placa */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova placa (ABC-1234)"
                    value={novaPlaca}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase();
                      value = value.replace(/[^A-Z0-9-]/g, '');
                      if (value.length >= 4 && !value.includes('-')) {
                        value = value.substring(0, 3) + '-' + value.substring(3);
                      }
                      setNovaPlaca(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarPlaca();
                      }
                    }}
                    className="h-10 font-mono flex-1"
                    maxLength={8}
                  />
                  <Button
                    type="button"
                    onClick={handleAdicionarPlaca}
                    disabled={!novaPlaca.trim() || novaPlaca.length < 4}
                    size="sm"
                    className="h-10"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
