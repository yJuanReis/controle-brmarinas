import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarina } from '@/contexts/MarinaContext';
import { FileText, Phone, Car, Users, Gift, Anchor, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CadastrarPessoaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCadastrarERegistrar?: (pessoaId: string) => void;
  nomePreenchido?: string;
}

export function CadastrarPessoaModal({ open, onOpenChange, onCadastrarERegistrar, nomePreenchido }: CadastrarPessoaModalProps) {
  const { cadastrarPessoa, pessoas, empresas, user } = useMarina();
  const [formData, setFormData] = useState({
    nome: '',
    documento: '',
    tipo: '' as 'cliente' | 'visita' | 'marinheiro' | 'proprietario' | 'colaborador' | '',
    contato: '',
    placa: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessOptions, setShowSuccessOptions] = useState(false);
  const [lastPessoaCadastrada, setLastPessoaCadastrada] = useState<{ id: string; nome: string } | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    } else {
      // Verificar se pessoa com este documento já existe na empresa atual
      const empresaAtual = user?.empresa_id;
      const pessoaExistente = pessoas.find(
        p => p.documento === formData.documento.trim() && p.empresa_id === empresaAtual
      );
      if (pessoaExistente) {
        newErrors.documento = `Pessoa com documento ${formData.documento} já existe nesta empresa`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const novaPessoa = await cadastrarPessoa({
        nome: formData.nome,
        documento: formData.documento,
        tipo: formData.tipo ? (formData.tipo as 'cliente' | 'visita' | 'marinheiro' | 'proprietario' | 'colaborador') : undefined,
        contato: formData.contato.trim() || undefined,
        placa: formData.placa.trim() || undefined,
      });

      // Guardar informações da pessoa cadastrada para mostrar na tela de sucesso
      setLastPessoaCadastrada({ id: novaPessoa.id, nome: novaPessoa.nome });
      setShowSuccessOptions(true);
    } catch (error) {
      // Erro já tratado pelo contexto
    }
  };

  const handleCadastrarERegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const novaPessoa = await cadastrarPessoa({
        nome: formData.nome,
        documento: formData.documento,
        tipo: formData.tipo ? (formData.tipo as 'cliente' | 'visita' | 'marinheiro' | 'proprietario' | 'colaborador') : undefined,
        contato: formData.contato.trim() || undefined,
        placa: formData.placa.trim() || undefined,
      });

      // Guardar informações da pessoa cadastrada para mostrar na tela de sucesso
      setLastPessoaCadastrada({ id: novaPessoa.id, nome: novaPessoa.nome });
      setShowSuccessOptions(true);
      
      // Chamar callback para registrar a pessoa
      if (onCadastrarERegistrar) {
        onCadastrarERegistrar(novaPessoa.id);
      }
    } catch (error) {
      // Erro já tratado pelo contexto
    }
  };

  const handleClose = () => {
    setFormData({ nome: '', documento: '', tipo: '', contato: '', placa: '' });
    setErrors({});
    setShowSuccessOptions(false);
    setLastPessoaCadastrada(null);
    onOpenChange(false);
  };

  // Preencher nome quando modal abre com nomePreenchido
  useEffect(() => {
    if (open && nomePreenchido && nomePreenchido.trim()) {
      setFormData(prev => ({ ...prev, nome: nomePreenchido }));
    }
  }, [open, nomePreenchido]);

  const handleCadastrarOutra = () => {
    setFormData({ nome: '', documento: '', tipo: '', contato: '', placa: '' });
    setErrors({});
    setShowSuccessOptions(false);
    setLastPessoaCadastrada(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Cadastrar Nova Pessoa
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova pessoa ao sistema
          </DialogDescription>
        </DialogHeader>

        {showSuccessOptions ? (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-fit">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-medium text-lg">Sucesso!</h3>
              <p className="text-muted-foreground">
                <strong>{lastPessoaCadastrada?.nome}</strong> foi cadastrado(a) com sucesso.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                O que você gostaria de fazer agora?
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCadastrarOutra} className="flex-1">
                Cadastrar Outra Pessoa
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="CPF, RG ou outro documento (apenas letras e números)"
                value={formData.documento}
                onChange={(e) => {
                  // Permitir apenas letras, números e espaços
                  const cleanValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
                  handleChange('documento', cleanValue);
                }}
                onKeyDown={(e) => {
                  // Bloquear completamente caracteres especiais (incluindo vírgula)
                  const allowedKeys = /^[a-zA-Z0-9\s]$/;
                  const controlKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

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
                placeholder="Telefone ou celular (apenas números)"
                value={formData.contato}
                onChange={(e) => {
                  // Filtrar apenas números
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
                onChange={(e) => handleChange('placa', e.target.value.toUpperCase())}
                className="h-11 font-mono"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              {onCadastrarERegistrar && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCadastrarERegistrar}
                  className="flex-1 bg-success hover:bg-success/90 text-white"
                >
                  Cadastrar e Registrar
                </Button>
              )}
              <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600">
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
