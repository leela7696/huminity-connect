import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Users, UserPlus, Edit, Trash2, Search, Calendar, Building, MapPin } from 'lucide-react';

interface Employee {
  id: string;
  employee_id: string;
  profile_id: string | null;
  job_title: string;
  department?: string;
  hire_date: string;
  salary?: number;
  employment_type: string;
  work_location?: string;
  status: string;
  manager_id?: string;
  benefits_eligible: boolean;
  termination_date?: string;
  termination_reason?: string;
  created_at: string;
  updated_at: string;
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

interface EmployeeFormData {
  employee_id: string;
  full_name: string;
  job_title: string;
  department?: string;
  hire_date: string;
  salary?: number;
  employment_type: string;
  work_location?: string;
  status: string;
  manager_id?: string;
  benefits_eligible: boolean;
  phone?: string;
  profile_id?: string;
}

export const EmployeeManagement = () => {
  const { profile } = useAuth();
  const { canManageUsers, isAdmin, isHR } = usePermissions();
  const { logEvent } = useAuditLogs();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const canManageEmployees = canManageUsers || isAdmin || isHR;
  const isEmployee = profile?.role === 'employee';

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
  }, []);

  const fetchEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select(`
          *,
          profiles!employees_profile_id_fkey(id, full_name, role, avatar_url, phone, user_id),
          manager:profiles!employees_manager_id_fkey(id, full_name)
        `);

      // If employee, only show their own record
      if (isEmployee && profile) {
        query = query.eq('profiles.user_id', profile.user_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['manager', 'hr', 'admin']);

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  };

  const handleCreateEmployee = async (employeeData: EmployeeFormData) => {
    try {
      // For now, create employee without profile (profile will be created when user registers)
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          employee_id: employeeData.employee_id,
          profile_id: null, // Will be set later when user registers
          job_title: employeeData.job_title,
          hire_date: employeeData.hire_date,
          salary: employeeData.salary,
          employment_type: employeeData.employment_type,
          work_location: employeeData.work_location,
          status: employeeData.status,
          manager_id: employeeData.manager_id,
          benefits_eligible: employeeData.benefits_eligible
        }])
        .select()
        .single();

      if (error) throw error;

      // Store employee name and other details for future profile creation
      // For now, we'll store the full name in a temporary way
      const employeeData_extended = {
        ...employeeData,
        temp_full_name: employeeData.full_name // Store for when profile is created
      };

      await logEvent('CREATE', 'employee', data.id, null, employeeData_extended);
      
      // Create notification
      if (profile?.user_id) {
        await supabase.rpc('create_notification', {
          p_user_id: profile.user_id,
          p_title: 'New Employee Added',
          p_message: `Employee ${employeeData.employee_id} has been added to the system`,
          p_type: 'info'
        });
      }
      
      toast({
        title: 'Success',
        description: `Employee ${employeeData.employee_id} created successfully. They can register later to complete their profile.`
      });
      
      setIsCreateDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to create employee',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateEmployee = async (employeeId: string, updates: Partial<EmployeeFormData>) => {
    try {
      const oldEmployee = employees.find(e => e.id === employeeId);
      
      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', employeeId);

      if (error) throw error;

      await logEvent('UPDATE', 'employee', employeeId, oldEmployee, { ...oldEmployee, ...updates });
      
      // Create notification
      if (profile?.user_id) {
        await supabase.rpc('create_notification', {
          p_user_id: profile.user_id,
          p_title: 'Employee Updated',
          p_message: `Employee record has been updated`,
          p_type: 'info'
        });
      }
      
      toast({
        title: 'Success',
        description: 'Employee updated successfully'
      });
      
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const oldEmployee = employees.find(e => e.id === employeeId);
      
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      await logEvent('DELETE', 'employee', employeeId, oldEmployee, null);
      
      toast({
        title: 'Success',
        description: 'Employee deleted successfully'
      });
      
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive'
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = (employee.profiles?.full_name || employee.employee_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         employee.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'terminated': return 'destructive';
      default: return 'outline';
    }
  };

  if (!canManageEmployees && !isEmployee) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">You don't have permission to view employees.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Employee Management
          </h2>
          <p className="text-muted-foreground">Manage employee records and information</p>
        </div>
        {canManageEmployees && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Employee</DialogTitle>
                <DialogDescription>Add a new employee to the system</DialogDescription>
              </DialogHeader>
              <CreateEmployeeForm onSubmit={handleCreateEmployee} managers={managers} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48 bg-background/50 border-border/50">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32 bg-background/50 border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Status</TableHead>
                {canManageEmployees && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} className="border-border/50 hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={employee.profiles?.avatar_url} />
                      <AvatarFallback className="bg-primary/10">
                        {employee.profiles?.full_name 
                          ? employee.profiles.full_name.split(' ').map(n => n[0]).join('')
                          : employee.employee_id.slice(0, 2).toUpperCase()
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {employee.profiles?.full_name || `Employee ${employee.employee_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        {employee.job_title}
                      </p>
                      {!employee.profiles && (
                        <p className="text-xs text-amber-600">Profile pending registration</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {employee.employee_id}
                    </Badge>
                  </TableCell>
                  <TableCell>{employee.department || 'N/A'}</TableCell>
                  <TableCell>{employee.manager?.full_name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(employee.status)}>
                      {employee.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  {canManageEmployees && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingEmployee(employee)}
                          className="hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingEmployee && (
        <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>Update employee information</DialogDescription>
            </DialogHeader>
            <EditEmployeeForm
              employee={editingEmployee}
              managers={managers}
              onSubmit={(updates) => handleUpdateEmployee(editingEmployee.id, updates)}
              onCancel={() => setEditingEmployee(null)}
              isEmployeeView={isEmployee}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const CreateEmployeeForm = ({ onSubmit, managers }: { 
  onSubmit: (data: EmployeeFormData) => void;
  managers: any[];
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_id: '',
    full_name: '',
    job_title: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    employment_type: 'full-time',
    work_location: '',
    status: 'active',
    benefits_eligible: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_id">Employee ID</Label>
          <Input
            id="employee_id"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            required
            placeholder="EMP001"
          />
        </div>
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="John Doe"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="job_title">Job Title</Label>
          <Input
            id="job_title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            required
            placeholder="Software Engineer"
          />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="Engineering"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hire_date">Hire Date</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="work_location">Work Location</Label>
          <Input
            id="work_location"
            value={formData.work_location}
            onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
            placeholder="New York Office"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employment_type">Employment Type</Label>
          <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full Time</SelectItem>
              <SelectItem value="part-time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="intern">Intern</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="manager_id">Manager</Label>
          <Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              {managers.map(manager => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.full_name} ({manager.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">Create Employee</Button>
    </form>
  );
};

const EditEmployeeForm = ({ employee, managers, onSubmit, onCancel, isEmployeeView }: { 
  employee: Employee; 
  managers: any[];
  onSubmit: (data: Partial<EmployeeFormData>) => void;
  onCancel: () => void;
  isEmployeeView?: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<EmployeeFormData>>({
    employee_id: employee.employee_id,
    job_title: employee.job_title,
    department: employee.department || '',
    hire_date: employee.hire_date,
    employment_type: employee.employment_type,
    work_location: employee.work_location || '',
    status: employee.status,
    manager_id: employee.manager_id || '',
    benefits_eligible: employee.benefits_eligible,
    full_name: employee.profiles?.full_name || '',
    phone: employee.profiles?.phone || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Employee can edit personal info */}
      {isEmployeeView && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Admin/HR can edit all fields */}
      {!isEmployeeView && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <Select value={formData.employment_type} onValueChange={(value) => setFormData({ ...formData, employment_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="manager_id">Manager</Label>
            <Select value={formData.manager_id} onValueChange={(value) => setFormData({ ...formData, manager_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map(manager => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.full_name} ({manager.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="work_location">Work Location</Label>
            <Input
              id="work_location"
              value={formData.work_location}
              onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
            />
          </div>
        </>
      )}

      <div className="flex space-x-2">
        <Button type="submit">Update Employee</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};