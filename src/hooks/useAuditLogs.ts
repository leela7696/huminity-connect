import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  } | null;
}

interface AuditLogFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}

export const useAuditLogs = (filters: AuditLogFilters = {}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('audit_logs')
          .select(`
            *,
            profiles!inner(
              full_name,
              role
            )
          `)
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters.action && filters.action !== 'all') {
          query = query.eq('action', filters.action);
        }
        if (filters.resource_type && filters.resource_type !== 'all') {
          query = query.eq('resource_type', filters.resource_type);
        }
        if (filters.date_from) {
          query = query.gte('created_at', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('created_at', filters.date_to);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        setLogs(data as any[] || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [filters]);

  const logEvent = async (
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      await supabase.rpc('log_audit_event', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_old_values: oldValues,
        p_new_values: newValues
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  return {
    logs,
    loading,
    error,
    logEvent
  };
};