import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarina } from '@/contexts/MarinaContext';
import { Calendar, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatoriosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelatoriosModal({ open, onOpenChange }: RelatoriosModalProps) {
  const { user, empresas, movimentacoes, pessoas, empresaAtual: empresaContext } = useMarina();
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Limpar filtros quando o modal abre
  useEffect(() => {
    if (open) {
      // Definir período padrão mensal (mês atual)
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const diaSeguinte = new Date(hoje);
      diaSeguinte.setDate(hoje.getDate() + 1); // Dia seguinte

      setFiltros({
        dataInicio: format(primeiroDiaMes, 'yyyy-MM-dd'),
        dataFim: format(diaSeguinte, 'yyyy-MM-dd'),
      });
    }
  }, [open]);

  // Encontrar empresa do usuário — priorizar `empresaAtual` do contexto
  const empresaAtual = empresaContext ?? empresas.find(e => e.id === user?.profile?.empresa_id);

  const handleDownload = async () => {
    if (!empresaAtual) return;

    setIsLoading(true);

    try {
      // Filtrar movimentações da empresa do usuário
      let movimentacoesFiltradas = movimentacoes.filter(m => m.empresa_id === empresaAtual.id);

      // Aplicar filtros de data se definidos
      if (filtros.dataInicio) {
        const inicio = new Date(filtros.dataInicio);
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => new Date(m.entrada_em) >= inicio);
      }

      if (filtros.dataFim) {
        const fim = new Date(filtros.dataFim);
        fim.setHours(23, 59, 59, 999); // Fim do dia
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => new Date(m.entrada_em) <= fim);
      }

      // Ordenar por data
      movimentacoesFiltradas.sort((a, b) => new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime());

      // Criar conteúdo CSV
      const headers = ['Data Entrada', 'Hora Entrada', 'Data Saída', 'Hora Saída', 'Nome', 'Documento', 'Tipo', 'Status', 'Observações'];

      // Função para escapar campos CSV corretamente
      const escapeCSVField = (field: string) => {
        // Se o campo contém vírgula, aspas ou quebras de linha, deve ser escapado
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
          return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
      };

      const csvRows = movimentacoesFiltradas.map((mov) => {
        try {
          const pessoa = pessoas.find(p => p.id === mov.pessoa_id);
          const entradaDate = new Date(mov.entrada_em);
          const saidaDate = mov.saida_em ? new Date(mov.saida_em) : null;

          const row = [
            format(entradaDate, 'dd/MM/yyyy'),
            format(entradaDate, 'HH:mm'),
            saidaDate ? format(saidaDate, 'dd/MM/yyyy') : '',
            saidaDate ? format(saidaDate, 'HH:mm') : '',
            pessoa?.nome || 'Pessoa não encontrada',
            pessoa?.documento || '',
            pessoa?.tipo || '',
            mov.status,
            mov.observacao || ''
          ];

          return row.map(escapeCSVField).join(',');
        } catch (error) {
          console.error('Erro ao gerar linha CSV:', error);
          return null;
        }
      }).filter(row => row !== null);

      const csvContent = [
        headers.map(escapeCSVField).join(','),
        ...csvRows
      ].join('\n');

      // Criar blob e download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_${empresaAtual.nome}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpar URL do objeto
      setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!empresaAtual) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileText className="h-6 w-6 text-primary" />
            Relatório de Movimentações
          </DialogTitle>
          <DialogDescription>
            Baixe o relatório da marina <strong>{empresaAtual.nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros de período */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Data início</Label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Data fim</Label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">📊 Sobre o relatório:</p>
                <ul className="text-xs space-y-1 ml-4">
                  <li>• Formato: CSV (planilha)</li>
                  <li>• Contém: Todas as movimentações do período</li>
                  <li>• Empresa: {empresaAtual.nome}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Baixar Relatório
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
