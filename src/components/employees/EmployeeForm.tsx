import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEmployees } from '@/hooks/useEmployees';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Briefcase, MapPin, DollarSign } from 'lucide-react';

const employeeSchema = z.object({
  // Personal Information
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  
  // Job Information
  employee_id: z.string().min(3, 'Employee ID must be at least 3 characters'),
  job_title: z.string().min(2, 'Job title is required'),
  department: z.string().min(2, 'Department is required'),
  hire_date: z.string().min(1, 'Hire date is required'),
  work_location: z.string().optional(),
  employment_type: z.enum(['full-time', 'part-time', 'contract', 'intern']),
  salary: z.string().optional(),
  benefits_eligible: z.boolean().default(true),
  
  // System
  role: z.enum(['admin', 'hr', 'manager', 'employee']).default('employee'),
  manager_id: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const departments = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'
];

const roles = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' }
];

interface EmployeeFormProps {
  onSuccess?: () => void;
}

export const EmployeeForm = ({ onSuccess }: EmployeeFormProps) => {
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<Array<{ id: string; full_name: string }>>([]);
  const { createEmployee } = useEmployees();
  const { toast } = useToast();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employment_type: 'full-time',
      role: 'employee',
      benefits_eligible: true,
    }
  });

  // Fetch managers for dropdown
  useState(() => {
    const fetchManagers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'manager')
        .eq('is_active', true);
      
      if (data) setManagers(data);
    };
    fetchManagers();
  });

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      setLoading(true);

      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: 'TempPassword123!', // Temporary password - user should change this
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name,
          role: data.role
        }
      });

      if (authError) throw authError;

      // Step 2: Update profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          department: data.department,
          position: data.job_title,
          phone: data.phone,
          address: data.address,
          date_of_birth: data.date_of_birth || null,
          role: data.role
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      // Step 3: Get the profile ID
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (profileFetchError) throw profileFetchError;

      // Step 4: Create employee record
      await createEmployee({
        employee_id: data.employee_id,
        profile_id: profileData.id,
        job_title: data.job_title,
        hire_date: data.hire_date,
        salary: data.salary ? parseFloat(data.salary) : undefined,
        manager_id: data.manager_id || undefined,
        work_location: data.work_location,
        employment_type: data.employment_type,
        benefits_eligible: data.benefits_eligible,
      });

      toast({
        title: "Employee Created",
        description: `${data.full_name} has been successfully added to the system.`,
      });

      form.reset();
      onSuccess?.();

    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="job" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Job Details
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </TabsTrigger>
          <TabsTrigger value="compensation" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Compensation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic personal details for the employee</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    {...form.register('full_name')}
                    placeholder="John Doe"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="john.doe@company.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...form.register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...form.register('date_of_birth')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
              <CardDescription>Employment details and role assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    {...form.register('employee_id')}
                    placeholder="EMP001"
                  />
                  {form.formState.errors.employee_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.employee_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title *</Label>
                  <Input
                    id="job_title"
                    {...form.register('job_title')}
                    placeholder="Software Engineer"
                  />
                  {form.formState.errors.job_title && (
                    <p className="text-sm text-destructive">{form.formState.errors.job_title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => form.setValue('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.department && (
                    <p className="text-sm text-destructive">{form.formState.errors.department.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date *</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    {...form.register('hire_date')}
                  />
                  {form.formState.errors.hire_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.hire_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select onValueChange={(value) => form.setValue('employment_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">System Role</Label>
                  <Select onValueChange={(value) => form.setValue('role', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_id">Reporting Manager</Label>
                <Select onValueChange={(value) => form.setValue('manager_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Work Location</CardTitle>
              <CardDescription>Where the employee will be working</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="work_location">Work Location</Label>
                <Select onValueChange={(value) => form.setValue('work_location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="office-hq">Headquarters</SelectItem>
                    <SelectItem value="office-branch">Branch Office</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="field">Field Work</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compensation & Benefits</CardTitle>
              <CardDescription>Salary and benefits information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Annual Salary (USD)</Label>
                <Input
                  id="salary"
                  type="number"
                  {...form.register('salary')}
                  placeholder="75000"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="benefits_eligible"
                  checked={form.watch('benefits_eligible')}
                  onCheckedChange={(checked) => form.setValue('benefits_eligible', checked)}
                />
                <Label htmlFor="benefits_eligible">Benefits Eligible</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Employee
        </Button>
      </div>
    </form>
  );
};