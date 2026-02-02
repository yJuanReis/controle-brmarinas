import { useState, useCallback } from 'react';
import { formatters, validators } from '../lib/validation';

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
    const validator = validators[options.type];
    
    if (!validator) return { isValid: true, error: '' };
    
    const isValid = validator(cleanValue);
    const error = isValid ? '' : getErrorMessage(options.type);
    
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
    const formatter = formatters[options.type];
    const formattedValue = formatter ? formatter(inputValue) : inputValue;
    
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