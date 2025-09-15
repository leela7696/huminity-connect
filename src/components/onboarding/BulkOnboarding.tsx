import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Upload, Users, CheckCircle2, Clock, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useEmployees } from '@/hooks/useEmployees';

interface BulkEmployee {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  hire_date: string;
  selected: boolean;
}

export default function BulkOnboarding() {
  const { addTask } = useOnboarding();
  const { employees } = useEmployees();
  const [selectedEmployees, setSelectedEmployees] = useState<BulkEmployee[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data for demonstration
  const newEmployees: BulkEmployee[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      employee_id: 'EMP003',
      department: 'Engineering',
      position: 'Software Developer',
      hire_date: '2024-01-15',
      selected: false
    },
    {
      id: '2',
      name: 'Bob Wilson',
      employee_id: 'EMP004',
      department: 'Marketing',
      position: 'Marketing Specialist',
      hire_date: '2024-01-20',
      selected: false
    },
    {
      id: '3',
      name: 'Carol Brown',
      employee_id: 'EMP005',
      department: 'HR',
      position: 'HR Coordinator',
      hire_date: '2024-01-25',
      selected: false
    }
  ];

  const [employeeList, setEmployeeList] = useState<BulkEmployee[]>(newEmployees);

  const toggleEmployeeSelection = (employeeId: string) => {
    setEmployeeList(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, selected: !emp.selected } : emp
    ));
  };

  const selectAllEmployees = () => {
    const allSelected = employeeList.every(emp => emp.selected);
    setEmployeeList(prev => prev.map(emp => ({ ...emp, selected: !allSelected })));
  };

  const processSelectedEmployees = async () => {
    const selected = employeeList.filter(emp => emp.selected);
    if (selected.length === 0 || !bulkAction) return;

    setIsProcessing(true);
    setProgress(0);

    for (let i = 0; i < selected.length; i++) {
      const employee = selected[i];
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply bulk action (e.g., standard onboarding template)
      if (bulkAction === 'standard') {
        const standardTasks = [
          {
            task_name: 'IT Setup',
            task_description: 'Create accounts and provide hardware',
            assigned_to: 'IT Department',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high'
          },
          {
            task_name: 'HR Documentation',
            task_description: 'Complete all HR forms and documentation',
            assigned_to: 'HR Department',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'high'
          }
        ];
        
        for (const task of standardTasks) {
          await addTask({
            employee_id: employee.id,
            ...task
          });
        }
      }
      
      setProgress(((i + 1) / selected.length) * 100);
    }

    setIsProcessing(false);
    // Reset selections
    setEmployeeList(prev => prev.map(emp => ({ ...emp, selected: false })));
  };

  const selectedCount = employeeList.filter(emp => emp.selected).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bulk Onboarding</h1>
          <p className="text-muted-foreground">Process multiple employees simultaneously</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeList.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isProcessing ? selectedCount : 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Employees...</CardTitle>
            <CardDescription>
              Please wait while we set up onboarding for selected employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {Math.round(progress)}% complete
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Actions</CardTitle>
          <CardDescription>
            Select employees and apply actions to multiple employees at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="bulk-action">Action to Apply</Label>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Apply Standard Onboarding</SelectItem>
                  <SelectItem value="manager">Apply Manager Onboarding</SelectItem>
                  <SelectItem value="remote">Apply Remote Employee Setup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-6">
              <Button 
                onClick={processSelectedEmployees}
                disabled={selectedCount === 0 || !bulkAction || isProcessing}
              >
                {isProcessing ? 'Processing...' : `Apply to ${selectedCount} Employees`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>New Employees</CardTitle>
              <CardDescription>
                Select employees to process for onboarding
              </CardDescription>
            </div>
            <Button variant="outline" onClick={selectAllEmployees}>
              {employeeList.every(emp => emp.selected) ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeList.map((employee) => (
              <div key={employee.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Checkbox
                  checked={employee.selected}
                  onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                />
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-sm">{employee.department}</p>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <div>
                    <p className="text-sm">Hire Date</p>
                    <p className="text-sm text-muted-foreground">{employee.hire_date}</p>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="secondary">New</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}