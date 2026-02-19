// Final
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
          <p className="text-slate-600 mb-8">
            Você não tem permissões para acessar esta área do sistema.
          </p>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-slate-900 mb-2">Detalhes:</h3>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Área: Painel Administrativo</li>
                <li>• Requisito: Perfil de Administrador ou Proprietário</li>
                <li>• Seu perfil: Usuário Comum</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Início
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}