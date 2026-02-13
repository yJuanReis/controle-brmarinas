/**
 * Filtro de console para bloquear warnings específicos do Radix UI
 * relacionados a DialogContent sem DialogTitle
 */

// Armazenar a função original do console.warn
const originalConsoleWarn = console.warn;

// Função para filtrar warnings indesejados do Radix UI
console.warn = (...args: any[]) => {
  const message = args.join(' ');
  
  // Verificar se a mensagem contém indícios de warnings do Radix UI sobre Dialog
  const isRadixDialogWarning = 
    message.includes('DialogContent') && 
    (message.includes('DialogTitle') || 
     message.includes('aria-describedby') ||
     message.includes('accessible for screen reader users'));
  
  // Se for um warning do Radix UI que queremos filtrar, não exibir
  if (!isRadixDialogWarning) {
    originalConsoleWarn(...args);
  }
};

// Exportar a função original caso seja necessária em algum lugar
export { originalConsoleWarn };
