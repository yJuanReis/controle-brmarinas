// Final
import { useState, useCallback } from 'react';
import { formatName, formatPhone, formatPlaca } from '../lib/validation';
import { validateCPF, validateRG, validatePlaca } from '../lib/validation';

export type FieldType = 'cpf' | 'rg' | 'phone' | 'placa' | 'text';

interface UseFormFieldOptions {
  type: FieldType;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  maxLength?: number;
}

interface UseFormFieldReturn {
  value: string;
  error: string;
  isValid: boolean;
  isDirty: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  sanitizeValue: () => string;
  reset: () => void;
}

export function useFormField(options: UseFormFieldOptions): UseFormFieldReturn {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback((inputValue: string) => {
    const cleanValue = inputValue.replace(/\D/g, '');
    let isValid = true;
    let error = '';
    
    switch (options.type) {
      case 'cpf':
        isValid = validateCPF(cleanValue).isValid;
        error = isValid ? '' : 'CPF inválido';
        break;
      case 'rg':
        isValid = validateRG(cleanValue).isValid;
        error = isValid ? '' : 'RG inválido';
        break;
      case 'phone':
        // Para telefone, validamos se tem pelo menos 8 dígitos
        isValid = cleanValue.length >= 8;
        error = isValid ? '' : 'Telefone inválido';
        break;
      case 'placa':
        isValid = validatePlaca(cleanValue).isValid;
        error = isValid ? '' : 'Placa inválida';
        break;
      case 'text':
        isValid = true;
        error = '';
        break;
    }
    
    return { isValid, error };
  }, [options.type]);

  const getErrorMessage = useCallback((type: FieldType): string => {
    const messages = {
      cpf: 'CPF inválido',
      rg: 'RG inválido',
      phone: 'Telefone inválido',
      placa: 'Placa inválida',
      text: ''
    };
    return messages[type] || 'Valor inválido';
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Limita o comprimento se especificado
    if (options.maxLength && inputValue.length > options.maxLength) {
      return;
    }
    
    // Formatação em tempo real
    let formattedValue = inputValue;
    const cleanValue = inputValue.replace(/\D/g, '');
    
    switch (options.type) {
      case 'cpf':
        // Formata CPF: 123.456.789-09
        formattedValue = cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        break;
      case 'rg':
        // Formata RG: 12.345.678-9
        formattedValue = cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
        break;
      case 'phone':
        // Formata telefone: (11) 91234-5678
        formattedValue = formatPhone(inputValue);
        break;
      case 'placa':
        // Formata placa: ABC-1234 ou ABC-1D23
        formattedValue = formatPlaca(inputValue);
        break;
      case 'text':
        // Texto: converte para maiúsculas
        formattedValue = formatName(inputValue);
        break;
    }
    
    setValue(formattedValue);
    setIsDirty(true);
    
    // Validação em tempo real (opcional)
    if (options.validateOnChange) {
      const validation = validate(inputValue);
      setIsValid(validation.isValid);
      setError(validation.error);
    }
  }, [options.type, options.validateOnChange, options.maxLength, validate]);

  const handleBlur = useCallback(() => {
    if (options.validateOnBlur && isDirty) {
      const validation = validate(value);
      setIsValid(validation.isValid);
      setError(validation.error);
    }
  }, [options.validateOnBlur, isDirty, validate, value]);

  const sanitizeValue = useCallback(() => {
    return value.replace(/\D/g, '');
  }, [value]);

  const reset = useCallback(() => {
    setValue('');
    setError('');
    setIsDirty(false);
    setIsValid(true);
  }, []);

  return {
    value,
    error,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    sanitizeValue,
    reset
  };
}