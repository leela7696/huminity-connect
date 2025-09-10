import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeLifecycle } from '@/hooks/useEmployeeLifecycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Award,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import type { Employee } from '@/hooks/useEmployees';

interface EmployeeProfileProps {
  employeeId: string;
  onClose?: () => void;
}

export const EmployeeProfile = ({ employeeId, onClose }: EmployeeProfileProps) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const { lifecycleEvents, onboardingTasks, completeOnboardingTask } = useEmployeeLifecycle(employeeId);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const { data, error } = await supabase
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
              date_of_birth,
              is_active,
              user_id
            ),
            manager:profiles!employees_manager_id_fkey(
              full_name
            )
          `)
          .eq('id', employeeId)
          .single();

        if (error) throw error;
        setEmployee((data as unknown) as Employee);
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'onboarding': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const onboardingProgress = onboardingTasks.length > 0 
    ? (onboardingTasks.filter(task => task.is_completed).length / onboardingTasks.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage 
              src={employee.profiles?.avatar_url || undefined} 
              alt={employee.profiles?.full_name} 
            />
            <AvatarFallback className="text-lg">
              {employee.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {employee.profiles?.full_name || 'N/A'}
            </h2>
            <p className="text-lg text-muted-foreground">
              {employee.job_title || employee.profiles?.position || 'N/A'}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={getStatusBadgeVariant(employee.status)}>
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </Badge>
              <Badge variant="outline">
                ID: {employee.employee_id}
              </Badge>
            </div>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="job">Job Details</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{employee.profiles?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{employee.work_location || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{employee.profiles?.department || 'N/A'}</p>
                <p className="text-xs text-muted-foreground">
                  Manager: {employee.manager?.full_name || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Employment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">
                  {employee.employment_type.charAt(0).toUpperCase() + employee.employment_type.slice(1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Since: {employee.hire_date ? format(new Date(employee.hire_date), 'MMM yyyy') : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {employee.status === 'onboarding' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Onboarding Progress
                </CardTitle>
                <CardDescription>
                  {onboardingTasks.filter(t => t.is_completed).length} of {onboardingTasks.length} tasks completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={onboardingProgress} className="w-full" />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(onboardingProgress)}% complete
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <p className="text-sm">{employee.profiles?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                  <p className="text-sm">
                    {employee.profiles?.date_of_birth 
                      ? format(new Date(employee.profiles.date_of_birth), 'MMM dd, yyyy')
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{employee.profiles?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-sm">{employee.profiles?.address || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                  <p className="text-sm font-mono">{employee.employee_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                  <p className="text-sm">{employee.job_title || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                  <p className="text-sm">{employee.profiles?.department || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Employment Type</Label>
                  <p className="text-sm">{employee.employment_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Hire Date</Label>
                  <p className="text-sm">
                    {employee.hire_date ? format(new Date(employee.hire_date), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                  <p className="text-sm">{employee.work_location || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Benefits Eligible</Label>
                  <p className="text-sm">{employee.benefits_eligible ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reporting Manager</Label>
                  <p className="text-sm">{employee.manager?.full_name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Onboarding Checklist
              </CardTitle>
              <CardDescription>
                Track completion of onboarding tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {onboardingTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No onboarding tasks found</p>
              ) : (
                <div className="space-y-3">
                  {onboardingTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        task.is_completed ? 'bg-green-50 border-green-200' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {task.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.task_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {task.task_description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.assigned_to}
                            </Badge>
                            {task.priority && (
                              <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground">
                                Due: {format(new Date(task.due_date), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {!task.is_completed && (
                        <Button 
                          size="sm" 
                          onClick={() => completeOnboardingTask(task.id)}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Employee Lifecycle
              </CardTitle>
              <CardDescription>
                Timeline of important events and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lifecycleEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No lifecycle events recorded</p>
              ) : (
                <div className="space-y-4">
                  {lifecycleEvents.map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        {index < lifecycleEvents.length - 1 && (
                          <div className="w-px h-8 bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">{event.event_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {event.details && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {JSON.stringify(event.details)}
                          </p>
                        )}
                        {event.profiles && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Triggered by: {event.profiles.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={className}>{children}</div>
);