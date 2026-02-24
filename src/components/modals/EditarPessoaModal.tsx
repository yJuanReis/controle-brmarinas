// Final
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarina } from '@/contexts/MarinaContext';
import { Pessoa } from '@/types/marina';
import { FileText, Phone, Car, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectDocumentType } from '@/lib/validation';
import { normalizarPlaca } from '@/lib/validation/formatters';
import { supabase } from '@/lib/supabase';

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
    placa: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [documentType, setDocumentType] = useState<'cpf' | 'rg' | 'outro' | null>(null);
  const [loading, setLoading] = useState(false);

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
            placa: data.placa || '',
          });
        }
      } catch (err) {
        // Se der erro, usa os dados do props como fallback (normalizando para minúsculas)
        setFormData({
          nome: pessoa.nome,
          documento: pessoa.documento,
          tipo: (pessoa.tipo ? pessoa.tipo.toLowerCase() : '') as TipoPessoa,
          contato: pessoa.contato || '',
          placa: pessoa.placa || '',
        });
      } finally {
        setLoading(false);
        setErrors({});
      }
    };

    fetchPessoaData();
  }, [pessoa, open]);

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
    } else if (field === 'placa') {
      // Usar normalizarPlaca para formatar: ABC-1234
      processedValue = normalizarPlaca(value);
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
    // Removida validação rigorosa de CPF e placa - agora aceita qualquer valor mantendo o formato
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !pessoa) return;

    // Normalizar a placa antes de salvar
    const placaNormalizada = formData.placa ? normalizarPlaca(formData.placa) : '';

    atualizarPessoa(pessoa.id, {
      nome: formData.nome,
      documento: formData.documento,
      tipo: (formData.tipo as TipoPessoa) || undefined,
      contato: formData.contato || undefined,
      placa: placaNormalizada || undefined,
    });

    setFormData({ nome: '', documento: '', tipo: '', contato: '', placa: '' });
    setErrors({});
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({ nome: '', documento: '', tipo: '', contato: '', placa: '' });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-6" hideCloseButton>
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
                <Label htmlFor="tipo" className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Tipo de Pessoa
                </Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  className="h-11 px-3 rounded-md border border-input bg-background text-sm"
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

              <div className="space-y-2">
                <Label htmlFor="placa" className="flex items-center gap-2 text-sm font-medium">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  Placa do veículo
                </Label>
                <Input
                  id="placa"
                  placeholder="ABC-1234"
                  value={formData.placa}
                  onChange={(e) => {
                    handleChange('placa', e.target.value);
                  }}
                  onKeyDown={(e) => {
                    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
                    if (!controlKeys.includes(e.key) && !/^[a-zA-Z0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className={cn("h-11 font-mono", errors.placa ? 'border-destructive' : '')}
                  maxLength={8}
                />
                {errors.placa && (
                  <p className="text-xs text-destructive">{errors.placa}</p>
                )}
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
