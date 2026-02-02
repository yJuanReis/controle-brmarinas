import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMarina } from '@/contexts/MarinaContext';
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

// Retorna o range de um mês específico: primeiro dia 00:00:00 até último dia 23:59:59
const getMonthRange = (monthIndex: number) => {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  
  // Criar data para o primeiro dia do mês selecionado
  const primeiroDia = new Date(anoAtual, monthIndex, 1);
  const ultimoDia = endOfMonth(primeiroDia);
  
  return {
    dataInicio: format(primeiroDia, 'yyyy-MM-dd'),
    dataFim: format(ultimoDia, 'yyyy-MM-dd'),
    horaInicio: '00:00',
    horaFim: '23:59',
  };
};

// Função para combinar data e hora corretamente usando timezone local
const combinarDataHora = (dataStr: string, horaStr: string): Date => {
  // Parse manual para evitar problemas de timezone
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const [horas, minutos] = horaStr.split(':').map(Number);
  
  // Criar data com timezone local (não UTC)
  return new Date(ano, mes - 1, dia, horas, minutos, 0, 0);
};

export function RelatoriosModal({ open, onOpenChange }: RelatoriosModalProps) {
  const { user, empresas, movimentacoes, pessoas, empresaAtual: empresaContext } = useMarina();
  
  // Valores iniciais: range do dia atual ao abrir o modal
  const getInitialFiltros = () => {
    return getTodayRange();
  };

  const [filtros, setFiltros] = useState(getInitialFiltros);
  const [formato, setFormato] = useState<ExportFormat>('pdf');
  const [isLoading, setIsLoading] = useState(false);
  const [isMonthFilter, setIsMonthFilter] = useState(false);

  // Resetar filtros quando o modal abre
  useEffect(() => {
    if (open) {
      setFiltros(getInitialFiltros());
      setFormato('csv');
    }
  }, [open]);

  // Encontrar empresa do usuário
  const empresaAtual = empresaContext ?? empresas.find(e => e.id === user?.empresa_id);

  const handleDownload = async () => {
    if (!empresaAtual) return;

    setIsLoading(true);

    try {
      // Filtrar movimentações da empresa do usuário
      let movimentacoesFiltradas = movimentacoes.filter(m => m.empresa_id === empresaAtual.id);

      console.log('Total de movimentações da empresa:', movimentacoesFiltradas.length);

      // Aplicar filtros combinando data e hora corretamente
      // Quando estiver usando filtro de mês completo, ignorar os filtros de hora
      if (!isMonthFilter && filtros.dataInicio && filtros.horaInicio) {
        const dataHoraInicio = combinarDataHora(filtros.dataInicio, filtros.horaInicio);
        console.log('Filtro início:', dataHoraInicio.toLocaleString());
        
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => {
          const entrada = new Date(m.entrada_em);
          return entrada >= dataHoraInicio;
        });
        
        console.log('Após filtro início:', movimentacoesFiltradas.length);
      }

      if (!isMonthFilter && filtros.dataFim && filtros.horaFim) {
        const dataHoraFim = combinarDataHora(filtros.dataFim, filtros.horaFim);
        // Adicionar 59 segundos e 999ms para pegar até o último segundo da hora especificada
        dataHoraFim.setSeconds(59, 999);
        console.log('Filtro fim:', dataHoraFim.toLocaleString());
        
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => {
          const entrada = new Date(m.entrada_em);
          return entrada <= dataHoraFim;
        });
        
        console.log('Após filtro fim:', movimentacoesFiltradas.length);
      }

      // Quando estiver usando filtro de mês completo, aplicar filtro apenas por data (todo o dia)
      if (isMonthFilter && filtros.dataInicio) {
        const dataInicio = new Date(filtros.dataInicio);
        const dataFim = new Date(filtros.dataFim);
        
        console.log('Filtro mês início:', dataInicio.toLocaleString());
        console.log('Filtro mês fim:', dataFim.toLocaleString());
        
        // Definir início do dia (00:00:00)
        dataInicio.setHours(0, 0, 0, 0);
        // Definir fim do dia (23:59:59)
        dataFim.setHours(23, 59, 59, 999);
        
        movimentacoesFiltradas = movimentacoesFiltradas.filter(m => {
          const entrada = new Date(m.entrada_em);
          return entrada >= dataInicio && entrada <= dataFim;
        });
        
        console.log('Após filtro mês:', movimentacoesFiltradas.length);
      }

      // Ordenar por data (mais recente primeiro)
      movimentacoesFiltradas.sort((a, b) => new Date(b.entrada_em).getTime() - new Date(a.entrada_em).getTime());

      console.log('Movimentações filtradas final:', movimentacoesFiltradas.length);

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

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório. Verifique o console para mais detalhes.');
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
    
    doc.setFontSize(18);
    doc.text(`Relatório de Movimentações`, 14, 15);
    doc.setFontSize(11);
    doc.text(`Empresa: ${empresa.nome}`, 14, 22);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, 14, 28);

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
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
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
              <div className="flex justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 hover:shadow-md hover:border-blue-300"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Filtrar por Mês
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-6 bg-white border border-blue-100 shadow-xl rounded-lg">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-1">Selecione o mês</p>
                          <p className="text-xs text-gray-500">Clique para aplicar filtro</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Ano atual</p>
                          <p className="text-sm font-medium text-blue-600">{new Date().getFullYear()}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-2">
                        {Array.from({ length: 12 }, (_, index) => {
                          const mesRange = getMonthRange(index);
                          const mesDate = new Date(mesRange.dataInicio);
                          const mesNome = format(mesDate, 'MMMM', { locale: ptBR });
                          const mesAno = format(mesDate, 'yyyy');
                          
                          return (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="group justify-start text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-sm hover:scale-105"
                              onClick={() => {
                                setFiltros(mesRange);
                                setIsMonthFilter(true);
                                // Executa o download imediatamente no formato selecionado
                                handleDownload();
                              }}
                            >
                              <div className="flex flex-col items-start w-full">
                                <span className="font-medium capitalize text-gray-800 group-hover:text-blue-700">
                                  {mesNome}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  {mesAno}
                                </span>
                              </div>
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