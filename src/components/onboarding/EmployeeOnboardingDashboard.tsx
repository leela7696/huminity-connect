import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Shield, 
  Monitor, 
  GraduationCap, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingTask {
  id: string;
  task_name: string;
  task_description: string;
  task_type: 'document' | 'policy' | 'it_setup' | 'training' | 'general';
  status: 'pending' | 'submitted' | 'verified' | 'completed' | 'rejected';
  due_date: string;
  priority: 'high' | 'medium' | 'low';
  document_url?: string;
  rejection_reason?: string;
}

const taskTypeIcons = {
  document: FileText,
  policy: Shield,
  it_setup: Monitor,
  training: GraduationCap,
  general: Clock
};

const statusColors = {
  pending: 'bg-orange-100 text-orange-800 border-orange-200',
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

const priorityColors = {
  high: 'text-red-600',
  medium: 'text-orange-600',
  low: 'text-green-600'
};

export const EmployeeOnboardingDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  // Fetch employee's onboarding tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['employee-onboarding-tasks', profile?.id],
    queryFn: async () => {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!employee) return [];

      const { data, error } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('employee_id', employee.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as OnboardingTask[];
    },
    enabled: !!profile?.id
  });

  // Calculate progress
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' || task.status === 'verified'
  ).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status, documentUrl }: { 
      taskId: string; 
      status: string; 
      documentUrl?: string;
    }) => {
      const updateData: any = { status };
      if (documentUrl) updateData.document_url = documentUrl;

      const { error } = await supabase
        .from('onboarding_checklist')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-onboarding-tasks'] });
      toast({
        title: 'Task Updated',
        description: 'Task status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update task status.',
        variant: 'destructive',
      });
    }
  });

  const handleFileUpload = async (taskId: string, file: File) => {
    setUploadingTaskId(taskId);
    try {
      // Here you would typically upload to Supabase Storage or another service
      // For now, we'll just simulate an upload
      const documentUrl = `uploads/${file.name}`;
      
      await updateTaskMutation.mutateAsync({
        taskId,
        status: 'submitted',
        documentUrl
      });

      // Create notification for HR
      await supabase.rpc('create_notification', {
        p_user_id: profile?.user_id,
        p_title: 'Document Uploaded',
        p_message: `${profile?.full_name} has uploaded a document for review.`,
        p_type: 'info'
      });

    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      status: 'completed'
    });
  };

  const getActionButton = (task: OnboardingTask) => {
    switch (task.task_type) {
      case 'document':
        if (task.status === 'pending' || task.status === 'rejected') {
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="document">Select Document</Label>
                    <Input
                      id="document"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(task.id, file);
                        }
                      }}
                      disabled={uploadingTaskId === task.id}
                    />
                  </div>
                  {uploadingTaskId === task.id && (
                    <div className="text-sm text-muted-foreground">
                      Uploading...
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          );
        }
        return null;
      
      case 'policy':
        if (task.status === 'pending') {
          return (
            <Button size="sm" onClick={() => handleCompleteTask(task.id)} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Acknowledge
            </Button>
          );
        }
        return null;
      
      case 'training':
        if (task.status === 'pending') {
          return (
            <Button size="sm" onClick={() => handleCompleteTask(task.id)} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Mark Complete
            </Button>
          );
        }
        return null;
      
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-foreground">My Onboarding</h1>
        <Badge variant="outline" className="px-4 py-2">
          {completedTasks} of {totalTasks} completed
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card className="bg-background/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Onboarding Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {tasks.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'submitted').length}
                </div>
                <div className="text-xs text-muted-foreground">Submitted</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'verified' || t.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => t.status === 'rejected').length}
                </div>
                <div className="text-xs text-muted-foreground">Rejected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-4">
        {tasks.map((task) => {
          const TaskIcon = taskTypeIcons[task.task_type];
          const isOverdue = new Date(task.due_date) < new Date() && 
            (task.status === 'pending' || task.status === 'rejected');
          
          return (
            <Card key={task.id} className={`bg-background/50 backdrop-blur-sm border-border/50 ${
              isOverdue ? 'border-red-200 bg-red-50/50' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      <TaskIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{task.task_name}</h3>
                        <Badge className={statusColors[task.status]}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.task_description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            Overdue
                          </div>
                        )}
                      </div>
                      {task.rejection_reason && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Rejection Reason:</strong> {task.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    {getActionButton(task)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <Card className="bg-background/50 backdrop-blur-sm border-border/50">
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Onboarding Tasks</h3>
            <p className="text-muted-foreground">
              No onboarding tasks have been assigned yet. Please complete your onboarding details first.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};