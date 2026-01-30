import { auditService } from '../auditService';
import { AuditAction, AuditEntityType } from '@/types/audit';

// Mock do Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      eq: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

describe('auditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('should log action successfully', async () => {
      const result = await auditService.logAction(
        AuditAction.CADASTRAR_PESSOA,
        AuditEntityType.PESSOA,
        'test-id',
        'Test Person',
        {
          before: null,
          after: { nome: 'Test Person', documento: '123456789' }
        }
      );

      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock error response
      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValueOnce({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: null, 
              error: new Error('Database error') 
            }))
          }))
        }))
      });

      const result = await auditService.logAction(
        AuditAction.CADASTRAR_PESSOA,
        AuditEntityType.PESSOA,
        'test-id',
        'Test Person',
        {
          before: null,
          after: { nome: 'Test Person', documento: '123456789' }
        }
      );

      expect(result).toBe(false);
    });
  });

  describe('getLogs', () => {
    it('should get logs successfully', async () => {
      const mockLogs = [
        {
          id: 'log1',
          action: AuditAction.CADASTRAR_PESSOA,
          entity_type: AuditEntityType.PESSOA,
          entity_id: 'test-id',
          entity_name: 'Test Person',
          user_id: 'user1',
          user_name: 'Test User',
          before_data: null,
          after_data: { nome: 'Test Person' },
          created_at: new Date().toISOString()
        }
      ];

      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockLogs, error: null }))
          }))
        }))
      });

      const result = await auditService.getLogs('test-user', {
        limit: 10,
        offset: 0
      });

      expect(result).toEqual(mockLogs);
    });

    it('should handle filter parameters', async () => {
      const { supabase } = require('@/lib/supabase');
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      };
      supabase.from.mockReturnValueOnce(mockQuery);

      await auditService.getLogs('test-user', {
        limit: 10,
        offset: 0,
        action: AuditAction.ENTRADA,
        entityType: AuditEntityType.MOVIMENTACAO,
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      });

      expect(mockQuery.select).toHaveBeenCalledWith(
        'id',
        'action',
        'entity_type',
        'entity_id',
        'entity_name',
        'user_id',
        'user_name',
        'before_data',
        'after_data',
        'created_at'
      );
    });
  });

  describe('getActionsByEntity', () => {
    it('should get actions by entity', async () => {
      const mockActions = [
        {
          action: AuditAction.CADASTRAR_PESSOA,
          count: 5,
          last_occurrence: new Date().toISOString()
        }
      ];

      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockActions, error: null }))
          }))
        }))
      });

      const result = await auditService.getActionsByEntity(
        'test-user',
        AuditEntityType.PESSOA,
        'test-entity-id'
      );

      expect(result).toEqual(mockActions);
    });
  });

  describe('getRecentActivity', () => {
    it('should get recent activity', async () => {
      const mockActivity = [
        {
          action: AuditAction.ENTRADA,
          entity_type: AuditEntityType.MOVIMENTACAO,
          entity_name: 'John Doe',
          created_at: new Date().toISOString()
        }
      ];

      const { supabase } = require('@/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: mockActivity, error: null }))
          }))
        }))
      });

      const result = await auditService.getRecentActivity('test-user', 5);

      expect(result).toEqual(mockActivity);
    });
  });
});