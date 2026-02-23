import { useAppVersion, APP_VERSION } from '@/hooks/useAppVersion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpdateNotification() {
  const { serverVersion, hasUpdate, isLoading, dismissUpdate } = useAppVersion();

  // Se está carregando ou não tem update, não mostrar nada
  if (isLoading || !hasUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-900 border border-amber-500 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Atualização Disponível!</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nova versão <span className="font-medium">{serverVersion}</span> disponível.
              Atualize para obter as últimas melhorias.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={dismissUpdate}
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente simples para mostrar a versão atual no rodapé
export function AppVersion() {
  return (
    <span className="text-xs text-gray-400">
      v{APP_VERSION}
    </span>
  );
}

export default UpdateNotification;
