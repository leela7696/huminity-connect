import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Calendar, AlertTriangle, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OnboardingTask {
  id: string;
  task_name: string;
  task_description: string | null;
  assigned_to: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null;
  priority: string;
  created_at: string;
}

export default function EmployeeOnboarding() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!profile?.id) return;

      try {
        // First get the employee record
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('profile_id', profile.id)
          .single();

        if (employeeError) throw employeeError;
        setEmployee(employeeData);

        // Then get onboarding tasks for this employee
        const { data: tasksData, error: tasksError } = await supabase
          .from('onboarding_checklist')
          .select('*')
          .eq('employee_id', employeeData.id)
          .order('priority', { ascending: false })
          .order('due_date', { ascending: true });

        if (tasksError) throw tasksError;
        setTasks(tasksData || []);
      } catch (error) {
        console.error('Error fetching employee onboarding data:', error);
        toast.error('Failed to load onboarding data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [profile]);

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
      
      // Refresh tasks
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, is_completed: true, completed_at: new Date().toISOString() }
          : task
      ));
      
      toast.success('Task completed successfully!');
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTaskStatus = (task: OnboardingTask) => {
    if (task.is_completed) return { label: 'Completed', variant: 'default' as const };
    if (task.due_date && new Date(task.due_date) < new Date()) return { label: 'Overdue', variant: 'destructive' as const };
    return { label: 'Pending', variant: 'secondary' as const };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading your onboarding tasks...</div>;
  }

  if (!employee) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You don't have an employee record yet. Please contact HR to set up your onboarding.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const overdueTasks = tasks.filter(task => 
    !task.is_completed && 
    task.due_date && 
    new Date(task.due_date) < new Date()
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to the Team!</h1>
        <p className="text-muted-foreground">
          Complete your onboarding tasks to get started
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Onboarding Progress
          </CardTitle>
          <CardDescription>
            {completedTasks} of {totalTasks} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {Math.round(progressPercentage)}% complete
              </span>
              <span className="text-muted-foreground">
                {totalTasks - completedTasks} tasks remaining
              </span>
            </div>
            {overdueTasks > 0 && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">You have {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Onboarding Tasks</h2>
        
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No onboarding tasks assigned yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => {
              const status = getTaskStatus(task);
              const isOverdue = !task.is_completed && task.due_date && new Date(task.due_date) < new Date();
              
              return (
                <Card key={task.id} className={cn(
                  "transition-all duration-200",
                  task.is_completed ? "bg-muted/50" : "",
                  isOverdue ? "border-destructive" : ""
                )}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className={cn(
                          "text-lg",
                          task.is_completed ? "line-through text-muted-foreground" : ""
                        )}>
                          {task.task_name}
                        </CardTitle>
                        <CardDescription>
                          Assigned to: {task.assigned_to}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {task.task_description && (
                        <p className="text-sm text-muted-foreground">
                          {task.task_description}
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-sm">
                        {task.due_date && (
                          <div className={cn(
                            "flex items-center gap-1",
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                          )}>
                            <Clock className="w-3 h-3" />
                            <span>
                              Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        
                        {task.is_completed && task.completed_at && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              Completed: {format(new Date(task.completed_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {!task.is_completed && (
                        <div className="flex justify-end">
                          <Button onClick={() => completeTask(task.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {totalTasks > 0 && completedTasks === totalTasks && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h3 className="text-lg font-semibold">Congratulations! 🎉</h3>
              <p className="text-muted-foreground">
                You've completed all your onboarding tasks. Welcome to the team!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}