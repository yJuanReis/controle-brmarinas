import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { APP_VERSION } from '@/lib/version';

interface VersionInfo {
  serverVersion: string;
  hasUpdate: boolean;
  isLoading: boolean;
  checkVersion: () => Promise<void>;
  dismissUpdate: () => void;
}

export function useAppVersion(): VersionInfo {
  const [serverVersion, setServerVersion] = useState<string>('');
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Verificar se a versão local é menor que a do servidor
  const checkVersion = useCallback(async () => {
    try {
      setIsLoading(true);

      // Buscar versão do servidor
      const { data, error } = await supabase
        .rpc('get_app_version');

      if (error) {
        console.error('Erro ao buscar versão do servidor:', error);
        return;
      }

      const latestVersion = data || '0.0.0';
      setServerVersion(latestVersion);

      // Verificar se há atualização disponível
      const needsUpdate = compareVersions(latestVersion, APP_VERSION) > 0;
      
      // Só mostrar notificação se:
      // 1. Houver atualização E
      // 2. O usuário ainda não tiver dispensado essa versão
      const dismissedVersion = localStorage.getItem('dismissed_version');
      const shouldShowUpdate = needsUpdate && dismissedVersion !== latestVersion;

      setHasUpdate(shouldShowUpdate);

      if (shouldShowUpdate) {
        toast({
          title: 'Atualização disponível!',
          description: `Nova versão ${latestVersion} disponível.`,
          variant: 'default',
          duration: 0, // Não fechar automaticamente
        });
      }
    } catch (error) {
      console.error('Erro ao verificar versão:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Dispensar notificação de update
  const dismissUpdate = useCallback(() => {
    if (serverVersion) {
      localStorage.setItem('dismissed_version', serverVersion);
      setHasUpdate(false);
    }
  }, [serverVersion]);

  // Verificar versão ao iniciar
  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  return {
    serverVersion,
    hasUpdate,
    isLoading,
    checkVersion,
    dismissUpdate,
  };
}

// Função para comparar versões semânticas
// Retorna: positivo se v1 > v2, negativo se v1 < v2, zero se igual
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

// Exportar a versão atual do app
export { APP_VERSION };
