import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface OnboardingDetails {
  id: string;
  employee_id: string;
  personal_info: any;
  job_info: any;
  education_background: any;
  banking_payroll: any;
  it_system_access: any;
  compliance_declaration: any;
  status: 'pending' | 'verified' | 'completed';
  submitted_at: string;
  verified_at?: string;
  verified_by?: string;
}

interface OnboardingTask {
  id: string;
  employee_id: string;
  task_name: string;
  task_description: string;
  task_type: 'document' | 'policy' | 'it_setup' | 'training' | 'general';
  status: 'pending' | 'submitted' | 'verified' | 'completed' | 'rejected';
  assigned_to: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  document_url?: string;
  validation_result?: any;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  progress_percentage: number;
  created_at: string;
  // Some fields from database schema
  is_completed?: boolean;
  completed_by?: string;
  completed_at?: string;
}

export const useOnboarding = (employeeId?: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Get employee onboarding details
  const {
    data: onboardingDetails,
    isLoading: detailsLoading,
    error: detailsError
  } = useQuery({
    queryKey: ['onboarding-details', employeeId || profile?.id],
    queryFn: async () => {
      let targetEmployeeId = employeeId;
      
      if (!targetEmployeeId && profile?.id) {
        // Get employee ID from profile
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        targetEmployeeId = employee?.id;
      }

      if (!targetEmployeeId) return null;

      const { data, error } = await supabase
        .from('employee_onboarding_details')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as OnboardingDetails | null;
    },
    enabled: !!(employeeId || profile?.id)
  });

  // Get employee onboarding tasks
  const {
    data: onboardingTasks = [],
    isLoading: tasksLoading,
    error: tasksError
  } = useQuery({
    queryKey: ['onboarding-tasks', employeeId || profile?.id],
    queryFn: async () => {
      let targetEmployeeId = employeeId;
      
      if (!targetEmployeeId && profile?.id) {
        // Get employee ID from profile
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        
        targetEmployeeId = employee?.id;
      }

      if (!targetEmployeeId) return [];

      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as OnboardingTask[];
    },
    enabled: !!(employeeId || profile?.id)
  });

  // Submit onboarding details
  const submitOnboardingDetails = useMutation({
    mutationFn: async (details: Omit<OnboardingDetails, 'id' | 'submitted_at' | 'verified_at' | 'verified_by'>) => {
      const { data, error } = await supabase
        .from('employee_onboarding_details')
        .insert([details])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-details'] });
    }
  });

  // Update task status
  const updateTaskStatus = useMutation({
    mutationFn: async ({ 
      taskId, 
      status, 
      documentUrl, 
      rejectionReason 
    }: { 
      taskId: string; 
      status: OnboardingTask['status']; 
      documentUrl?: string;
      rejectionReason?: string;
    }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (documentUrl) updateData.document_url = documentUrl;
      if (rejectionReason) updateData.rejection_reason = rejectionReason;
      if (status === 'verified') updateData.verified_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('onboarding_checklist')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
    }
  });

  // Verify onboarding details (HR/Admin only)
  const verifyOnboardingDetails = useMutation({
    mutationFn: async ({ 
      detailsId, 
      status 
    }: { 
      detailsId: string; 
      status: 'verified' | 'rejected'; 
    }) => {
      const { data, error } = await supabase
        .from('employee_onboarding_details')
        .update({
          status,
          verified_at: new Date().toISOString(),
          verified_by: profile?.user_id
        })
        .eq('id', detailsId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-details'] });
    }
  });

  // Generate tasks from template
  const generateTasksFromTemplate = useMutation({
    mutationFn: async ({ 
      employeeId, 
      templateId 
    }: { 
      employeeId: string; 
      templateId?: string; 
    }) => {
      const { error } = await supabase.rpc('create_onboarding_tasks_from_template', {
        p_employee_id: employeeId,
        p_template_id: templateId
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
    }
  });

  // Calculate progress
  const calculateProgress = () => {
    if (onboardingTasks.length === 0) return 0;
    
    const completedTasks = onboardingTasks.filter(task => 
      task.status === 'completed' || task.status === 'verified'
    ).length;
    
    return Math.round((completedTasks / onboardingTasks.length) * 100);
  };

  // Get task stats
  const getTaskStats = () => {
    const stats = {
      total: onboardingTasks.length,
      pending: 0,
      submitted: 0,
      completed: 0,
      rejected: 0,
      overdue: 0
    };

    onboardingTasks.forEach(task => {
      stats[task.status as keyof typeof stats]++;
      
      if ((task.status === 'pending' || task.status === 'rejected') && 
          new Date(task.due_date) < new Date()) {
        stats.overdue++;
      }
    });

    return stats;
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to onboarding tasks updates
    const tasksSubscription = supabase
      .channel('onboarding-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'onboarding_checklist'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['onboarding-tasks'] });
        }
      )
      .subscribe();

    // Subscribe to onboarding details updates
    const detailsSubscription = supabase
      .channel('onboarding-details-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_onboarding_details'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['onboarding-details'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksSubscription);
      supabase.removeChannel(detailsSubscription);
    };
  }, [profile?.id, queryClient]);

  return {
    // Data
    onboardingDetails,
    onboardingTasks,
    
    // Loading states
    detailsLoading,
    tasksLoading,
    isLoading: detailsLoading || tasksLoading,
    
    // Errors
    detailsError,
    tasksError,
    
    // Mutations
    submitOnboardingDetails,
    updateTaskStatus,
    verifyOnboardingDetails,
    generateTasksFromTemplate,
    
    // Computed values
    progress: calculateProgress(),
    taskStats: getTaskStats()
  };
};