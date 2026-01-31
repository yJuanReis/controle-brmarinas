import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAudit, useAuditLog } from '@/hooks/useAudit';
import { useMarina } from '@/contexts/MarinaContext';
import { auditService } from '@/services/auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';

export function DebugAudit() {
  const { user } = useMarina();
  const { fetchLogs, fetchSummary, logs, summary, loading, error } = useAudit();
  const { logAction } = useAuditLog();
  const [testResult, setTestResult] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);

  const handleTestAuth = async () => {
    setTestLoading(true);
    setTestResult('');

    try {
      console.log('🧪 Iniciando teste de auditoria...');

      // Testar autenticação
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('🧪 Teste de autenticação:', { authData, authError });

      // Testar empresa_id
      const empresaId = localStorage.getItem('empresa_id');
      console.log('🧪 Teste de empresa_id:', empresaId);

      // Testar consulta direta ao banco
      const { data: directData, error: directError } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(5);

      console.log('🧪 Teste de consulta direta:', { directData, directError });

      // Testar inserção direta
      const { data: insertData, error: insertError } = await supabase
        .from('audit_logs')
        .insert({
          empresa_id: empresaId || 'test-empresa',
          user_id: authData?.user?.id || 'test-user',
          user_name: authData?.user?.email || 'Test User',
          action: 'LOGIN',
          entity_type: 'USUARIO',
          entity_id: authData?.user?.id || 'test-user',
          entity_name: authData?.user?.email || 'Test User',
          details: { test: true, debug: true }
        });

      console.log('🧪 Teste de inserção direta:', { insertData, insertError });

      // Testar serviço de auditoria
      await auditService.logAction(
        AuditAction.LOGIN,
        AuditEntityType.USUARIO,
        authData?.user?.id || 'test-user',
        authData?.user?.email || 'Test User',
        { debug: true, test: 'audit_service' }
      );

      setTestResult(`
✅ Teste concluído com sucesso!
- Autenticação: ${authData?.user ? 'OK' : 'FALHA'}
- Empresa ID: ${empresaId || 'NÃO DEFINIDA'}
- Consulta direta: ${directError ? 'FALHA' : 'OK'}
- Inserção direta: ${insertError ? 'FALHA' : 'OK'}
      `);

    } catch (error) {
      console.error('❌ Erro no teste de auditoria:', error);
      setTestResult(`❌ Erro no teste: ${error}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleTestPageAccess = () => {
    console.log('🧪 Teste de acesso à página de auditoria:');
    console.log('user:', user);
    console.log('user?.profile:', user?.profile);
    console.log('user?.profile?.role:', user?.profile?.role);
    console.log('role === admin:', user?.profile?.role === 'admin');
    console.log('role === owner:', user?.profile?.role === 'owner');
    console.log('pode acessar:', user && (user.profile?.role === 'admin' || user.profile?.role === 'owner'));
  };

  const handleTestService = async () => {
    setTestLoading(true);
    try {
      await fetchLogs();
      await fetchSummary();
      setTestResult('✅ Teste do serviço de auditoria concluído!');
    } catch (error) {
      setTestResult(`❌ Erro no serviço: ${error}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Debug de Auditoria
        </CardTitle>
        <CardDescription>
          Ferramenta de teste para debugar o sistema de auditoria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={handleTestAuth}
            disabled={testLoading}
            className="w-full"
          >
            Testar Autenticação & Banco
          </Button>
          <Button
            onClick={handleTestPageAccess}
            disabled={testLoading}
            className="w-full"
          >
            Testar Acesso à Página
          </Button>
          <Button
            onClick={handleTestService}
            disabled={testLoading}
            className="w-full"
          >
            Testar Serviço de Auditoria
          </Button>
        </div>

        {testResult && (
          <div className="p-4 bg-muted rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}

        {loading && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">Carregando logs...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Logs Recentes:</h4>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{log.action}</span> - {log.entity_type} - {log.user_name}
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(summary.by_action).length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Resumo:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total: {summary.total}</div>
              <div>Usuários: {Object.keys(summary.by_user).length}</div>
              <div>Entidades: {Object.keys(summary.by_entity).length}</div>
              <div>Ações Hoje: {summary.recent_actions.length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}