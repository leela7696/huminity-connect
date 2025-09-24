import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Employee {
  id: string;
  employee_id: string;
  profile_id: string;
  job_title: string;
  department?: string;
  hire_date: string;
  salary?: number;
  employment_type: string;
  work_location?: string;
  status: string;
  manager_id?: string;
  benefits_eligible: boolean;
  profiles?: {
    id: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    phone?: string;
    user_id: string;
  };
  manager?: {
    id: string;
    full_name: string;
  };
}

export const useEmployees = () => {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('employees')
        .select(`
          *,
          profiles!employees_profile_id_fkey(id, full_name, role, avatar_url, phone, user_id),
          manager:profiles!employees_manager_id_fkey(id, full_name)
        `);

      // If employee role, only show their own record
      if (profile?.role === 'employee') {
        query = query.eq('profiles.user_id', profile.user_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [profile?.role, profile?.user_id]);

  // Get employees as dropdown options
  const getEmployeeOptions = () => {
    return employees.map(employee => ({
      value: employee.id,
      label: `${employee.profiles?.full_name} (${employee.employee_id})`,
      employee_id: employee.employee_id,
      department: employee.department,
      job_title: employee.job_title
    }));
  };

  // Get employees by department
  const getEmployeesByDepartment = (department: string) => {
    return employees.filter(emp => emp.department === department);
  };

  // Get active employees only
  const getActiveEmployees = () => {
    return employees.filter(emp => emp.status === 'active');
  };

  // Get managers
  const getManagers = () => {
    return employees.filter(emp => 
      emp.profiles?.role === 'manager' || 
      emp.profiles?.role === 'hr' || 
      emp.profiles?.role === 'admin'
    );
  };

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    getEmployeeOptions,
    getEmployeesByDepartment,
    getActiveEmployees,
    getManagers
  };
};