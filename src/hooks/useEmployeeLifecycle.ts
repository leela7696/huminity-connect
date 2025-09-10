import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LifecycleEvent {
  id: string;
  employee_id: string;
  event_type: string;
  event_date: string;
  details: any;
  triggered_by: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
}

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
}

export const useEmployeeLifecycle = (employeeId?: string) => {
  const [lifecycleEvents, setLifecycleEvents] = useState<LifecycleEvent[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLifecycleEvents = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('employee_lifecycle_events')
        .select(`
          *,
          profiles!employee_lifecycle_events_triggered_by_fkey(
            full_name
          )
        `)
        .eq('employee_id', employeeId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      setLifecycleEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchOnboardingTasks = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('employee_id', employeeId)
        .order('priority', { ascending: false });

      if (error) throw error;
      setOnboardingTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchLifecycleEvents(), fetchOnboardingTasks()]);
      setLoading(false);
    };

    fetchData();
  }, [employeeId]);

  const addLifecycleEvent = async (eventData: {
    employee_id: string;
    event_type: string;
    event_date: string;
    details?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('employee_lifecycle_events')
        .insert([{
          ...eventData,
          triggered_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchLifecycleEvents();
      return data;
    } catch (error) {
      console.error('Error adding lifecycle event:', error);
      throw error;
    }
  };

  const completeOnboardingTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('onboarding_checklist')
        .update({
          is_completed: true,
          completed_by: (await supabase.auth.getUser()).data.user?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      await fetchOnboardingTasks();
    } catch (error) {
      console.error('Error completing onboarding task:', error);
      throw error;
    }
  };

  const addOnboardingTask = async (taskData: {
    employee_id: string;
    task_name: string;
    task_description?: string;
    assigned_to: string;
    due_date?: string;
    priority?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      await fetchOnboardingTasks();
      return data;
    } catch (error) {
      console.error('Error adding onboarding task:', error);
      throw error;
    }
  };

  return {
    lifecycleEvents,
    onboardingTasks,
    loading,
    error,
    addLifecycleEvent,
    completeOnboardingTask,
    addOnboardingTask,
    refreshData: () => {
      fetchLifecycleEvents();
      fetchOnboardingTasks();
    }
  };
};