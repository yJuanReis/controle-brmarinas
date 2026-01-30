import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAudit } from '@/hooks/useAudit';
import { AuditAction, AuditEntityType } from '@/types/audit';

export function AuditExample() {
  const { logAction, fetchLogs, logs, loading, error } = useAudit();
  const [entityName, setEntityName] = useState('');
  const [entityId, setEntityId] = useState('');

  const handleLogAction = async () => {
    if (!entityName || !entityId) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    await logAction(
      AuditAction.CADASTRAR_PESSOA,
      AuditEntityType.PESSOA,
      entityId,
      entityName,
      {
        metadata: {
          source: 'example-component',
          additional_info: 'Exemplo de auditoria'
        }
      }
    );

    setEntityName('');
    setEntityId('');
  };

  const handleFetchLogs = async () => {
    await fetchLogs();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entityName">Nome da Entidade</Label>
              <Input
                id="entityName"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Digite o nome da entidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityId">ID da Entidade</Label>
              <Input
                id="entityId"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Digite o ID da entidade"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleLogAction} disabled={loading}>
              Registrar Ação de Auditoria
            </Button>
            <Button variant="outline" onClick={handleFetchLogs} disabled={loading}>
              Buscar Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600">Carregando...</p>
        </div>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{log.user_name}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {log.action}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">Entidade:</span> {log.entity_name} ({log.entity_type})
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <span className="font-medium">Detalhes:</span> {JSON.stringify(log.details)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}