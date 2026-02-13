import React from 'react';
import { useFormField, FieldType } from '../../hooks/useFormField';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label: string;
  type: FieldType;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FormField({
  label,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  validateOnBlur = true,
  validateOnChange = false,
  maxLength,
  className,
  disabled = false,
  required = false
}: FormFieldProps) {
  const field = useFormField({
    type,
    validateOnBlur,
    validateOnChange,
    maxLength
  });

  const displayValue = value ?? field.value;
  const displayError = error ?? field.error;
  const isInvalid = !field.isValid && field.isDirty;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          field.handleChange(e);
          onChange?.(field.sanitizeValue());
        }}
        onBlur={() => {
          field.handleBlur();
          onBlur?.();
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors",
          "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-200",
          isInvalid && "border-red-500 focus:ring-red-200 focus:border-red-500",
          disabled && "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500",
          className
        )}
        maxLength={maxLength}
      />
      {displayError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="w-4 h-4 flex items-center justify-center">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
          {displayError}
        </p>
      )}
    </div>
  );
}