import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OnboardingTask {
  id: string;
  employee_id: string;
  task_name: string;
  task_description: string | null;
  assigned_to: string;
  is_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  due_date: string | null;
  priority: string;
  created_at: string;
  employee?: {
    profile_id: string;
    employee_id: string;
    profiles?: {
      full_name: string;
    } | null;
  } | null;
  completed_by_profile?: {
    full_name: string;
  } | null;
}

export interface OnboardingStats {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  employees_onboarding: number;
}

export const useOnboarding = () => {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [stats, setStats] = useState<OnboardingStats>({
    total_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    employees_onboarding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select(`
          *,
          employee:employees!inner(
            profile_id,
            employee_id,
            profiles(full_name)
          ),
          completed_by_profile:profiles!onboarding_checklist_completed_by_fkey(
            full_name
          )
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks((data as unknown as OnboardingTask[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch onboarding tasks');
      console.error('Error fetching onboarding tasks:', err);
    }
  };

  const fetchOnboardingStats = async () => {
    try {
      const { data: tasksData } = await supabase
        .from('onboarding_checklist')
        .select('is_completed, due_date, employee_id');

      if (tasksData) {
        const total_tasks = tasksData.length;
        const completed_tasks = tasksData.filter(task => task.is_completed).length;
        const now = new Date();
        const overdue_tasks = tasksData.filter(task => 
          !task.is_completed && 
          task.due_date && 
          new Date(task.due_date) < now
        ).length;
        
        const unique_employees = new Set(tasksData.map(task => task.employee_id));
        const employees_onboarding = unique_employees.size;

        setStats({
          total_tasks,
          completed_tasks,
          overdue_tasks,
          employees_onboarding,
        });
      }
    } catch (err) {
      console.error('Error fetching onboarding stats:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchOnboardingTasks(), fetchOnboardingStats()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const completeTask = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('onboarding_checklist')
        .update({
          is_completed: true,
          completed_by: user.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      
      await Promise.all([fetchOnboardingTasks(), fetchOnboardingStats()]);
      toast.success('Task completed successfully');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const addTask = async (taskData: {
    employee_id: string;
    task_name: string;
    task_description?: string;
    assigned_to: string;
    due_date?: string;
    priority?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('onboarding_checklist')
        .insert([taskData]);

      if (error) throw error;
      
      await Promise.all([fetchOnboardingTasks(), fetchOnboardingStats()]);
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<OnboardingTask>) => {
    try {
      const { error } = await supabase
        .from('onboarding_checklist')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      
      await Promise.all([fetchOnboardingTasks(), fetchOnboardingStats()]);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('onboarding_checklist')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      await Promise.all([fetchOnboardingTasks(), fetchOnboardingStats()]);
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  return {
    tasks,
    stats,
    loading,
    error,
    completeTask,
    addTask,
    updateTask,
    deleteTask,
    refreshData: () => {
      fetchOnboardingTasks();
      fetchOnboardingStats();
    }
  };
};