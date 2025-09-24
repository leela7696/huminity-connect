import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OnboardingSession {
  employee_id: string;
  employee_name: string;
  department: string;
  start_date: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  progress_percentage: number;
  last_activity: string;
}

interface OnboardingTask {
  id: string;
  employee_id: string;
  employee_name: string;
  task_name: string;
  task_description: string;
  task_type: string;
  status: string;
  due_date: string;
  priority: string;
  document_url?: string;
  submitted_at?: string;
}

export const HROnboardingDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<OnboardingTask | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all onboarding sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['hr-onboarding-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select(`
          employee_id,
          status,
          due_date,
          created_at,
          employees!inner(
            id,
            hire_date,
            profile_id,
            profiles!employees_profile_id_fkey(
              full_name,
              department
            )
          )
        `);

      if (error) throw error;

      // Group tasks by employee and calculate stats
      const employeeStats = data.reduce((acc: Record<string, any>, task) => {
        const empId = task.employee_id;
        const empName = task.employees.profiles?.full_name || 'Unknown';
        const department = task.employees.profiles?.department || 'Not assigned';
        const hireDate = task.employees.hire_date;

        if (!acc[empId]) {
          acc[empId] = {
            employee_id: empId,
            employee_name: empName,
            department: department || 'Not assigned',
            start_date: hireDate,
            total_tasks: 0,
            completed_tasks: 0,
            pending_tasks: 0,
            overdue_tasks: 0,
            progress_percentage: 0,
            last_activity: task.created_at
          };
        }

        acc[empId].total_tasks++;
        
        if (task.status === 'completed' || task.status === 'verified') {
          acc[empId].completed_tasks++;
        } else if (task.status === 'pending' || task.status === 'rejected') {
          acc[empId].pending_tasks++;
          if (new Date(task.due_date) < new Date()) {
            acc[empId].overdue_tasks++;
          }
        }

        return acc;
      }, {});

      // Calculate progress percentages
      Object.values(employeeStats).forEach((stats: any) => {
        stats.progress_percentage = stats.total_tasks > 0 
          ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
          : 0;
      });

      return Object.values(employeeStats) as OnboardingSession[];
    }
  });

  // Fetch tasks requiring HR action
  const { data: pendingTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['hr-pending-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select(`
          *,
          employees!inner(
            profile_id,
            profiles!employees_profile_id_fkey(
              full_name
            )
          )
        `)
        .in('status', ['submitted', 'pending'])
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map(task => ({
        ...task,
        employee_name: task.employees.profiles?.full_name || 'Unknown'
      })) as OnboardingTask[];
    }
  });

  // Task verification mutation
  const verifyTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, reason }: { 
      taskId: string; 
      status: 'verified' | 'rejected';
      reason?: string;
    }) => {
      const updateData: any = { 
        status,
        verified_at: new Date().toISOString()
      };
      
      if (reason) updateData.rejection_reason = reason;

      const { error } = await supabase
        .from('onboarding_checklist')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-onboarding-sessions'] });
      refetchTasks();
      toast({
        title: 'Task Updated',
        description: 'Task has been successfully updated.',
      });
      setSelectedTask(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update task.',
        variant: 'destructive',
      });
    }
  });

  const handleApprove = (task: OnboardingTask) => {
    verifyTaskMutation.mutate({
      taskId: task.id,
      status: 'verified'
    });
  };

  const handleReject = () => {
    if (!selectedTask || !rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    verifyTaskMutation.mutate({
      taskId: selectedTask.id,
      status: 'rejected',
      reason: rejectionReason
    });
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'completed' && session.progress_percentage === 100) ||
                         (statusFilter === 'in-progress' && session.progress_percentage > 0 && session.progress_percentage < 100) ||
                         (statusFilter === 'not-started' && session.progress_percentage === 0);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalEmployees: sessions.length,
    completedOnboarding: sessions.filter(s => s.progress_percentage === 100).length,
    inProgress: sessions.filter(s => s.progress_percentage > 0 && s.progress_percentage < 100).length,
    notStarted: sessions.filter(s => s.progress_percentage === 0).length,
    pendingVerification: pendingTasks.filter(t => t.status === 'submitted').length
  };

  if (sessionsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Onboarding Management</h1>
        <Badge variant="outline" className="px-4 py-2">
          {stats.totalEmployees} Employees
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedOnboarding}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-purple-600">{stats.pendingVerification}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Sessions */}
      <div className="grid gap-4">
        {filteredSessions.map((session) => (
          <Card key={session.employee_id} className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold text-foreground">{session.employee_name}</h3>
                    <Badge variant="outline">{session.department}</Badge>
                    <Badge className={
                      session.progress_percentage === 100 
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : session.progress_percentage > 0 
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }>
                      {session.progress_percentage}% Complete
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                    <div>Total Tasks: {session.total_tasks}</div>
                    <div>Completed: {session.completed_tasks}</div>
                    <div>Pending: {session.pending_tasks}</div>
                    <div className={session.overdue_tasks > 0 ? 'text-red-600 font-medium' : ''}>
                      Overdue: {session.overdue_tasks}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${session.progress_percentage}%` }}
                    />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tasks Requiring Verification */}
      {pendingTasks.length > 0 && (
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Tasks Requiring Review ({pendingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{task.task_name}</h4>
                      <Badge variant="outline">{task.employee_name}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.task_description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                      {task.submitted_at && (
                        <span>Submitted: {new Date(task.submitted_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(task)}
                      className="gap-2"
                      disabled={verifyTaskMutation.isPending}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedTask(task)}
                          className="gap-2"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejection-reason">Reason for Rejection</Label>
                            <Textarea
                              id="rejection-reason"
                              placeholder="Please provide a clear reason for rejecting this task..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => {
                              setSelectedTask(null);
                              setRejectionReason('');
                            }}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleReject}
                              disabled={verifyTaskMutation.isPending || !rejectionReason.trim()}
                              variant="destructive"
                            >
                              {verifyTaskMutation.isPending ? 'Rejecting...' : 'Reject Task'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};