/**
 * Filtro de console para produção
 * - Em produção: bloqueia todos os logs exceto erros
 * - Em desenvolvimento: filtra apenas warnings específicos do Radix UI
 */

const isProduction = import.meta.env.PROD;

// Armazenar funções originais
const originalConsole = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  error: console.error,
};

if (isProduction) {
  // Em produção: silenciar tudo exceto erros
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  // console.error permanece ativo para capturar erros
} else {
  // Em desenvolvimento: filtrar apenas warnings do Radix UI
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    const isRadixDialogWarning = 
      message.includes('DialogContent') && 
      (message.includes('DialogTitle') || 
       message.includes('aria-describedby') ||
       message.includes('accessible for screen reader users'));
    
    if (!isRadixDialogWarning) {
      originalConsole.warn(...args);
    }
  };
}

export { originalConsole };