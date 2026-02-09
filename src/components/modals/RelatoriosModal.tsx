import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useMarina } from '@/contexts/MarinaContext';
import { marinaService } from '@/services/marinaService';
import { Calendar, Download, FileText, FileSpreadsheet, FileText as FileTextIcon, File, Download as DownloadIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import './RelatoriosModal.css';

interface RelatoriosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'txt';

// Utility functions for date calculations
// Retorna o range do dia atual: hoje 00:00:00 até hoje 23:59:59
const getTodayRange = () => {
  const hoje = new Date();
  return {
    dataInicio: format(hoje, 'yyyy-MM-dd'),
    dataFim: format(hoje, 'yyyy-MM-dd'),
    horaInicio: '00:00',
    horaFim: '23:59',
  };
};

// Retorna o range do mês atual: primeiro dia 00:00:00 até último dia 23:59:59
const getCurrentMonthRange = () => {
  const hoje = new Date();
  const primeiroDia = startOfMonth(hoje);
  const ultimoDia = endOfMonth(hoje);
  
  return {
    dataInicio: format(primeiroDia, 'yyyy-MM-dd'),
    dataFim: format(ultimoDia, 'yyyy-MM-dd'),
    horaInicio: '00:00',
    horaFim: '23:59',
  };
};

// Retorna o range de um mês específico de um ano: primeiro dia 00:00:00 até último dia 23:59:59
const getMonthRange = (monthIndex: number, year: number) => {
  // Criar data para o primeiro dia do mês selecionado
  const primeiroDia = new Date(year, monthIndex, 1);
  const ultimoDia = endOfMonth(primeiroDia);
  
  return {
    dataInicio: format(primeiroDia, 'yyyy-MM-dd'),
    dataFim: format(ultimoDia, 'yyyy-MM-dd'),
    horaInicio: '00:00',
    horaFim: '23:59',
  };
};

// Retorna uma lista de anos para o select (atual + últimos 5 anos)
const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => currentYear - index);
};

export function RelatoriosModal({ open, onOpenChange }: RelatoriosModalProps) {
  const { user, empresas, pessoas, empresaAtual: empresaContext } = useMarina();
  
  // Valores iniciais: range do mês atual ao abrir o modal
  const getInitialFiltros = () => {
    return getCurrentMonthRange();
  };

  const [filtros, setFiltros] = useState(getInitialFiltros);
  const [formato, setFormato] = useState<ExportFormat>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [isMonthFilter, setIsMonthFilter] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [incluirExcluidas, setIncluirExcluidas] = useState(false);

  // Resetar filtros quando o modal abre
  useEffect(() => {
    if (open) {
      setFiltros(getInitialFiltros());
      setFormato('pdf');
    }
  }, [open]);

  // Encontrar empresa do usuário
  const empresaAtual = empresaContext ?? empresas.find(e => e.id === user?.empresa_id);

  const handleDownload = async () => {
    if (!empresaAtual) return;

    setIsLoading(true);

    try {
      // Preparar parâmetros de data para a RPC
      let dataInicioStr: string;
      let dataFimStr: string;

      if (isMonthFilter && filtros.dataInicio && filtros.dataFim) {
        // Filtro de mês completo: usar o dia inteiro
        dataInicioStr = `${filtros.dataInicio}T00:00:00`;
        dataFimStr = `${filtros.dataFim}T23:59:59`;
      } else {
        // Usar data e hora selecionadas
        dataInicioStr = `${filtros.dataInicio}T${filtros.horaInicio}:00`;
        dataFimStr = `${filtros.dataFim}T${filtros.horaFim}:59`;
      }

      // Buscar movimentações via RPC (contorna limite de 1000 registros)
      const movimentacoesFiltradas = await marinaService.getMovimentacoesPorPeriodo(
        empresaAtual.id,
        dataInicioStr,
        dataFimStr,
        incluirExcluidas
      );

      // Ordenar por data (mais recente primeiro)
      movimentacoesFiltradas.sort((a, b) => new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime());


      // Se não houver dados, mostrar mensagem
      if (movimentacoesFiltradas.length === 0) {
        toast.info('Nenhuma movimentação encontrada no período selecionado.');
        setIsLoading(false);
        return;
      }

      // Dados formatados para exportação
      const dadosExportacao = movimentacoesFiltradas.map((mov) => {
        const pessoa = pessoas.find(p => p.id === mov.pessoa_id);
        const entradaDate = new Date(mov.entrada_em);
        const saidaDate = mov.saida_em ? new Date(mov.saida_em) : null;

        return {
          dataEntrada: format(entradaDate, 'dd/MM/yyyy'),
          horaEntrada: format(entradaDate, 'HH:mm'),
          dataSaida: saidaDate ? format(saidaDate, 'dd/MM/yyyy') : '',
          horaSaida: saidaDate ? format(saidaDate, 'HH:mm') : '',
          nome: pessoa?.nome || 'Pessoa não encontrada',
          documento: pessoa?.documento || '',
          tipo: pessoa?.tipo || '',
          status: mov.status,
          observacao: mov.observacao || ''
        };
      });

      const headers = ['Data Entrada', 'Hora Entrada', 'Data Saída', 'Hora Saída', 'Nome', 'Documento', 'Tipo', 'Status', 'Observações'];

      // Para relatórios de mês completo, usar horários fixos no cabeçalho
      const periodoInfo = isMonthFilter 
        ? `${filtros.dataInicio} 00:00 até ${filtros.dataFim} 23:59`
        : `${filtros.dataInicio} ${filtros.horaInicio} até ${filtros.dataFim} ${filtros.horaFim}`;

      switch (formato) {
        case 'csv':
          exportarCSV(dadosExportacao, headers, empresaAtual);
          break;
        case 'xlsx':
          exportarExcel(dadosExportacao, headers, empresaAtual);
          break;
        case 'pdf':
          exportarPDF(dadosExportacao, headers, empresaAtual);
          break;
        case 'txt':
          exportarTXT(dadosExportacao, headers, empresaAtual, periodoInfo);
          break;
      }

      toast.success(`Relatório gerado com ${dadosExportacao.length} registro(s)!`);
    } finally {
      setIsLoading(false);
    }
  };

  const exportarCSV = (dados: any[], headers: string[], empresa: any) => {
    const escapeCSVField = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
        return '"' + field.replace(/"/g, '""') + '"';
      }
      return field;
    };

    const csvRows = dados.map(row => {
      const rowArray = [
        row.dataEntrada,
        row.horaEntrada,
        row.dataSaida,
        row.horaSaida,
        row.nome,
        row.documento,
        row.tipo,
        row.status,
        row.observacao
      ];
      return rowArray.map(escapeCSVField).join(',');
    });

    const csvContent = [
      headers.map(escapeCSVField).join(','),
      ...csvRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${empresa.nome}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const exportarExcel = (dados: any[], headers: string[], empresa: any) => {
    const worksheetData = [headers, ...dados.map(row => [
      row.dataEntrada,
      row.horaEntrada,
      row.dataSaida,
      row.horaSaida,
      row.nome,
      row.documento,
      row.tipo,
      row.status,
      row.observacao
    ])];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');

    XLSX.writeFile(workbook, `relatorio_${empresa.nome}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const exportarPDF = (dados: any[], headers: string[], empresa: any) => {
    const doc = new jsPDF();
    
    // Configurar título centralizado
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    const pageWidth = doc.internal.pageSize.width;
    doc.text(`Relatório de Movimentações`, pageWidth / 2, 15, { align: 'center' });
    
    // Informações da empresa e data
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Empresa: ${empresa.nome}`, 14, 25);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 32);

    const tableData = dados.map(row => [
      row.dataEntrada,
      row.horaEntrada,
      row.dataSaida,
      row.horaSaida,
      row.nome,
      row.documento,
      row.tipo,
      row.status,
      row.observacao
    ]);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        textColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: 'bold'
      },
      bodyStyles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      }
    });

    doc.save(`relatorio_${empresa.nome}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const exportarTXT = (dados: any[], headers: string[], empresa: any, periodoInfo: string) => {
    const separator = '='.repeat(80);
    const lines = [
      separator,
      `RELATÓRIO DE MOVIMENTAÇÕES`,
      separator,
      `Empresa: ${empresa.nome}`,
      `Período: ${periodoInfo}`,
      separator,
      '',
      ...dados.map((row, index) => {
        return [
          `Registro ${index + 1}`,
          '-'.repeat(40),
          `Data/Hora Entrada: ${row.dataEntrada} ${row.horaEntrada}`,
          `Data/Hora Saída: ${row.dataSaida} ${row.horaSaida}`,
          `Nome: ${row.nome}`,
          `Documento: ${row.documento}`,
          `Tipo: ${row.tipo}`,
          `Status: ${row.status}`,
          `Observações: ${row.observacao}`,
          ''
        ].join('\n');
      }),
      separator,
      `Total de registros: ${dados.length}`,
      `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`
    ].filter(line => line !== '');

    const txtContent = lines.join('\n');
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${empresa.nome}_${format(new Date(), 'yyyy-MM-dd')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  if (!empresaAtual) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-full bg-gradient-to-br from-blue-50 to-white">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <File className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 font-display">
                Relatório de Movimentações
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros de período */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <Calendar className="h-5 w-5 text-blue-500" />
                Período
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Botão para selecionar mês */}
              <div className="flex justify-start mb-2">
                <Popover>
                  <PopoverContent className="w-100 p-4 bg-white border border-blue-100 shadow-xl rounded-lg">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-800">Selecione o ano</p>
                        <Select
                          onValueChange={(value) => {
                            // Quando mudar o ano, manter o mês selecionado (janeiro por padrão)
                            const selectedYear = parseInt(value);
                            setSelectedYear(selectedYear);
                            const currentMonth = 0; // Janeiro (índice 0)
                            const mesRange = getMonthRange(currentMonth, selectedYear);
                            setFiltros(mesRange);
                            setIsMonthFilter(true);
                          }}
                          defaultValue={new Date().getFullYear().toString()}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o ano" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableYears().map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-800 mb-1">Selecione o mês</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                        {Array.from({ length: 12 }, (_, index) => {
                          const mesRange = getMonthRange(index, selectedYear);
                          const mesDate = new Date(mesRange.dataInicio);
                          const mesNome = format(mesDate, 'MMM', { locale: ptBR }).toUpperCase();
                          
                          return (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-sm hover:scale-105"
                              onClick={() => {
                                // Usar o ano que está sendo exibido no seletor (selectedYear)
                                const mesRange = getMonthRange(index, selectedYear);
                                setFiltros(mesRange);
                                setIsMonthFilter(true);
                              }}
                            >
                              <span className="font-medium text-sm capitalize text-gray-700 group-hover:text-blue-700">
                                {mesNome}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Data início</Label>
                  <Input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, dataInicio: e.target.value }));
                      setIsMonthFilter(false);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Data fim</Label>
                  <Input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, dataFim: e.target.value }));
                      setIsMonthFilter(false);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Hora início</Label>
                  <Input
                    type="time"
                    value={filtros.horaInicio}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, horaInicio: e.target.value }));
                      setIsMonthFilter(false);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Hora fim</Label>
                  <Input
                    type="time"
                    value={filtros.horaFim}
                    onChange={(e) => {
                      setFiltros(prev => ({ ...prev, horaFim: e.target.value }));
                      setIsMonthFilter(false);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de formato */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <FileTextIcon className="h-5 w-5 text-blue-500" />
                Formato do Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="mydict">
                  <div>
                    <label>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formato === 'pdf'}
                        onChange={() => setFormato('pdf')}
                      />
                      <span>PDF</span>
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formato === 'xlsx'}
                        onChange={() => setFormato('xlsx')}
                      />
                      <span>Excel</span>
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formato === 'csv'}
                        onChange={() => setFormato('csv')}
                      />
                      <span>CSV</span>
                    </label>
                    <label>
                      <input 
                        type="radio" 
                        name="formato" 
                        checked={formato === 'txt'}
                        onChange={() => setFormato('txt')}
                      />
                      <span>TXT</span>
                    </label>
                  </div>
                </div>
                
                {/* Opção para incluir movimentações excluídas */}
                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                  <Checkbox
                    id="incluirExcluidas"
                    checked={incluirExcluidas}
                    onCheckedChange={(checked) => setIncluirExcluidas(checked as boolean)}
                  />
                  <label
                    htmlFor="incluirExcluidas"
                    className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"
                  >
                    <span>Incluir movimentações excluídas</span>
                    <span className="text-xs text-muted-foreground">(registradas como excluido_em)</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2 flex items-center gap-2">
                  <span className="bg-blue-200 p-1 rounded">📊</span>
                  Sobre o relatório:
                </p>
                <ul className="space-y-1 text-blue-700">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Formato: <span className="font-medium">{formato.toUpperCase()}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Contém: Todas as movimentações do período
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Empresa: <span className="font-medium">{empresaAtual.nome}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Gerando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DownloadIcon className="h-4 w-4" />
                <span>Baixar Relatório</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}