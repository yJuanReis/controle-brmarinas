// Final
/**
 * Funções de formatação para diferentes tipos de campos
 */

export const formatters = {
  /**
   * Formata CPF: 12345678909 → 123.456.789-09
   */
  cpf: (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 3) return cleanValue;
    if (cleanValue.length <= 6) return cleanValue.replace(/(\d{3})(\d+)/, '$1.$2');
    if (cleanValue.length <= 9) return cleanValue.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  /**
   * Formata RG: 123456789 → 12.345.678-9 (formato genérico)
   */
  rg: (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 2) return cleanValue;
    if (cleanValue.length <= 5) return cleanValue.replace(/(\d{2})(\d+)/, '$1.$2');
    if (cleanValue.length <= 8) return cleanValue.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
  },

  /**
   * Formata telefone: 11987654321 → (11) 98765-4321
   */
  phone: (value: string): string => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 2) return cleanValue;
    if (cleanValue.length <= 6) return cleanValue.replace(/(\d{2})(\d+)/, '($1) $2');
    if (cleanValue.length <= 10) return cleanValue.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  },

  /**
   * Formata placa: ABC1234 → ABC-1234 ou ABC1D23 → ABC-1D23
   */
  placa: (value: string): string => {
    const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleanValue.length >= 7) {
      // Formato antigo: ABC-1234
      return cleanValue.replace(/(\w{3})(\w{4})/, '$1-$2');
    } else if (cleanValue.length >= 6) {
      // Formato Mercosul: ABC-1D23
      return cleanValue.replace(/(\w{3})(\w{3})/, '$1-$2');
    }
    
    return cleanValue;
  }
};