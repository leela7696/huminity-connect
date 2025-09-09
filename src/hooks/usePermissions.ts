import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Permission {
  resource: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export const usePermissions = () => {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!profile?.role) return;

      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', profile.role);

        if (error) throw error;
        setPermissions(data || []);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [profile?.role]);

  const hasPermission = (resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    const permission = permissions.find(p => p.resource === resource);
    if (!permission) return false;

    switch (action) {
      case 'create': return permission.can_create;
      case 'read': return permission.can_read;
      case 'update': return permission.can_update;
      case 'delete': return permission.can_delete;
      default: return false;
    }
  };

  const canManageUsers = () => hasPermission('users', 'read');
  const canViewAuditLogs = () => hasPermission('audit_logs', 'read');
  const canManageRoles = () => hasPermission('roles', 'update');
  const canManageSettings = () => hasPermission('settings', 'update');

  return {
    permissions,
    loading,
    hasPermission,
    canManageUsers,
    canViewAuditLogs,
    canManageRoles,
    canManageSettings,
    isAdmin: profile?.role === 'admin',
    isHR: profile?.role === 'hr',
    isManager: profile?.role === 'manager',
    isEmployee: profile?.role === 'employee'
  };
};