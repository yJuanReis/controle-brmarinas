import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { APP_VERSION, COMMIT_COUNT } from '@/lib/version';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GerenciarVersaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarVersaoModal({ open, onOpenChange }: GerenciarVersaoModalProps) {
  const { toast } = useToast();
  const [serverVersion, setServerVersion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Buscar versão do servidor ao abrir o modal
  useEffect(() => {
    if (open) {
      buscarVersaoServidor();
    }
  }, [open]);

  const buscarVersaoServidor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_app_version');
      if (error) throw error;
      setServerVersion(data || '0.0.0');
    } catch (error) {
      console.error('Erro ao buscar versão:', error);
      setServerVersion('0.0.0');
    } finally {
      setLoading(false);
    }
  };

  const handlePublicarAtualizacao = async () => {
    setPublishing(true);
    try {
      const { error } = await supabase.rpc('update_app_version', { new_version: APP_VERSION });
      if (error) throw error;

      toast({
        title: 'Versão atualizada!',
        description: `Versão ${APP_VERSION} publicada com sucesso.`,
        variant: 'default',
      });

      // Atualizar a versão local após publicar
      setServerVersion(APP_VERSION);
    } catch (error) {
      console.error('Erro ao publicar versão:', error);
      toast({
        title: 'Erro ao publicar',
        description: 'Não foi possível atualizar a versão.',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  // Verificar se há atualização pendente
  const hasUpdate = APP_VERSION !== serverVersion && !loading;
  const appVersionNewer = APP_VERSION > serverVersion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gerenciar Versão
          </DialogTitle>
          <DialogDescription>
            Controle a versão do aplicativo para notificar usuários sobre atualizações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Versão do App (commits) */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-700">Versão do App</p>
              <p className="text-xs text-blue-500">Baseado nos commits</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900">{APP_VERSION}</p>
              <p className="text-xs text-blue-500">{COMMIT_COUNT} commits</p>
            </div>
          </div>

          {/* Versão do Servidor */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <p className="text-sm font-medium text-purple-700">Versão do Servidor</p>
              <p className="text-xs text-purple-500">Publicado para os usuários</p>
            </div>
            <div className="text-right">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-purple-900">{serverVersion}</p>
                  <p className="text-xs text-purple-500">No Supabase</p>
                </>
              )}
            </div>
          </div>

          {/* Status */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : APP_VERSION === serverVersion ? (
            <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">App atualizado!</span>
            </div>
          ) : appVersionNewer ? (
            <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Atualização pendente!</span>
            </div>
          ) : null}

          {/* Botão Publicar (apenas para owner) */}
          {hasUpdate && appVersionNewer && (
            <Button
              onClick={handlePublicarAtualizacao}
              disabled={publishing}
              className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Publicar Atualização {APP_VERSION}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
