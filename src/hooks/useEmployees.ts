import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLogs } from './useAuditLogs';

export interface Employee {
  id: string;
  employee_id: string;
  profile_id: string;
  job_title: string | null;
  hire_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  salary: number | null;
  manager_id: string | null;
  work_location: string | null;
  employment_type: string;
  benefits_eligible: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
    role: string;
    department: string | null;
    position: string | null;
    avatar_url: string | null;
    phone: string | null;
    address: string | null;
    date_of_birth: string | null;
    is_active: boolean;
    user_id: string;
  } | null;
  manager?: {
    full_name: string;
  } | null;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  employment_type?: string;
  manager_id?: string;
}

export const useEmployees = (filters: EmployeeFilters = {}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logEvent } = useAuditLogs();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('employees')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            role,
            department,
            position,
            avatar_url,
            phone,
            address,
            date_of_birth,
            is_active,
            user_id
          ),
          manager:profiles!employees_manager_id_fkey(
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`profiles.full_name.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`);
      }
      if (filters.department && filters.department !== 'all') {
        query = query.eq('profiles.department', filters.department);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.employment_type && filters.employment_type !== 'all') {
        query = query.eq('employment_type', filters.employment_type);
      }
      if (filters.manager_id) {
        query = query.eq('manager_id', filters.manager_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees((data as unknown) as Employee[] || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const createEmployee = async (employeeData: {
    employee_id: string;
    profile_id: string;
    job_title?: string;
    hire_date?: string;
    salary?: number;
    manager_id?: string;
    work_location?: string;
    employment_type?: string;
    benefits_eligible?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;

      await logEvent('CREATE', 'employee', data.id, null, employeeData);
      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      const { data: oldData } = await supabase
        .from('employees')
        .select()
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await logEvent('UPDATE', 'employee', id, oldData, updates);
      await fetchEmployees();
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { data: oldData } = await supabase
        .from('employees')
        .select()
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logEvent('DELETE', 'employee', id, oldData, null);
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  };

  const toggleEmployeeStatus = async (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    const newStatus = employee.status === 'active' ? 'inactive' : 'active';
    await updateEmployee(id, { status: newStatus });
  };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    toggleEmployeeStatus
  };
};