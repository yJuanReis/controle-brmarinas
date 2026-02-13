import React, { useState } from 'react';
import { FormField } from '../components/ui/FormField';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export function ProfessionalFormExample() {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    telefone: '',
    placa: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Remove erro quando o usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.cpf) {
      newErrors.cpf = 'CPF é obrigatório';
    }
    
    if (!formData.rg) {
      newErrors.rg = 'RG é obrigatório';
    }
    
    if (!formData.telefone) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simula envio de dados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
        ...formData,
        // Dados sanitizados para envio
        cpf: formData.cpf.replace(/\D/g, ''),
        rg: formData.rg.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        placa: formData.placa.toUpperCase().replace(/[^A-Z0-9]/g, '')
      });
      
      alert('Formulário enviado com sucesso!');
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulário Profissional</CardTitle>
          <CardDescription>
            Exemplo de inputs com formatação automática, validação em tempo real e sanitização de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo de Nome */}
            <FormField
              label="Nome Completo"
              type="text"
              placeholder="Digite seu nome completo"
              value={formData.nome}
              onChange={handleFieldChange('nome')}
              error={errors.nome}
              required
              maxLength={100}
            />

            {/* Campo de CPF */}
            <FormField
              label="CPF"
              type="cpf"
              placeholder="123.456.789-09"
              value={formData.cpf}
              onChange={handleFieldChange('cpf')}
              error={errors.cpf}
              validateOnChange={true}
              validateOnBlur={true}
              required
              maxLength={14}
            />

            {/* Campo de RG */}
            <FormField
              label="RG"
              type="rg"
              placeholder="12.345.678-9"
              value={formData.rg}
              onChange={handleFieldChange('rg')}
              error={errors.rg}
              validateOnChange={false}
              validateOnBlur={true}
              required
              maxLength={12}
            />

            {/* Campo de Telefone */}
            <FormField
              label="Telefone"
              type="phone"
              placeholder="(11) 98765-4321"
              value={formData.telefone}
              onChange={handleFieldChange('telefone')}
              error={errors.telefone}
              validateOnChange={true}
              validateOnBlur={true}
              required
              maxLength={15}
            />

            {/* Campo de Placa */}
            <FormField
              label="Placa do Veículo"
              type="placa"
              placeholder="ABC-1234 ou ABC-1D23"
              value={formData.placa}
              onChange={handleFieldChange('placa')}
              error={errors.placa}
              validateOnChange={false}
              validateOnBlur={true}
              maxLength={8}
            />

            {/* Botão de Envio */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  'Enviar Formulário'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    nome: '',
                    cpf: '',
                    rg: '',
                    telefone: '',
                    placa: ''
                  });
                  setErrors({});
                }}
                className="flex-1"
              >
                Limpar
              </Button>
            </div>

            {/* Dados para demonstração */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Dados para Teste:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div><strong>Nome:</strong> João Silva</div>
                <div><strong>CPF:</strong> 123.456.789-09</div>
                <div><strong>RG:</strong> 12.345.678-9</div>
                <div><strong>Telefone:</strong> (11) 98765-4321</div>
                <div><strong>Placa:</strong> ABC-1234</div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}