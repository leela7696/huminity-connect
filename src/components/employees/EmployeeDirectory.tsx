import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useEmployees, type EmployeeFilters } from '@/hooks/useEmployees';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { EmployeeForm } from './EmployeeForm';
import { EmployeeProfile } from './EmployeeProfile';

const departments = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'
];

const employmentTypes = [
  'full-time', 'part-time', 'contract', 'intern'
];

const statusTypes = [
  'active', 'onboarding', 'inactive'
];

export const EmployeeDirectory = () => {
  const { profile } = useAuth();
  const { canManageUsers, isAdmin, isHR } = usePermissions();
  const [filters, setFilters] = useState<EmployeeFilters>({});
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { employees, loading, error } = useEmployees(filters);

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const handleFilterChange = (key: keyof EmployeeFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value 
    }));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'onboarding': return 'secondary';
      case 'inactive': return 'destructive';
      default: return 'outline';
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case 'full-time': return 'Full Time';
      case 'part-time': return 'Part Time';
      case 'contract': return 'Contract';
      case 'intern': return 'Intern';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Directory</h1>
            <p className="text-muted-foreground">Manage your organization's employees</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Directory</h1>
            <p className="text-muted-foreground">Manage your organization's employees</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading employees: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Employee Directory
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's {employees.length} employees
          </p>
        </div>
        
        {(isAdmin || isHR) && (
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee record and user account
                </DialogDescription>
              </DialogHeader>
              <EmployeeForm onSuccess={() => setShowCreateForm(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-10"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <Select onValueChange={(value) => handleFilterChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusTypes.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => handleFilterChange('employment_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Employment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {employmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getEmploymentTypeBadge(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees ({employees.length})</CardTitle>
          <CardDescription>
            List of all employees in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={employee.profiles?.avatar_url || undefined} 
                            alt={employee.profiles?.full_name} 
                          />
                          <AvatarFallback>
                            {employee.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'N/A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {employee.profiles?.full_name || 'N/A'}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {employee.profiles?.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{employee.profiles.phone}</span>
                              </div>
                            )}
                            {employee.work_location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                <span>{employee.work_location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {employee.employee_id}
                    </TableCell>
                    <TableCell>
                      {employee.profiles?.department || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {employee.job_title || employee.profiles?.position || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(employee.status)}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getEmploymentTypeBadge(employee.employment_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.hire_date ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{format(new Date(employee.hire_date), 'MMM dd, yyyy')}</span>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(employee.id);
                              setShowProfile(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          {(isAdmin || isHR) && (
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Employee
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Employee Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedEmployee && (
            <EmployeeProfile 
              employeeId={selectedEmployee} 
              onClose={() => setShowProfile(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};