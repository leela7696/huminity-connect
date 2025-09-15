import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Copy, FileText } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  tasks: {
    task_name: string;
    task_description: string;
    assigned_to: string;
    due_days: number;
    priority: string;
  }[];
}

const defaultTemplates: OnboardingTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Employee Onboarding',
    description: 'Complete onboarding process for new employees',
    tasks: [
      {
        task_name: 'IT Setup',
        task_description: 'Create accounts and provide hardware',
        assigned_to: 'IT Department',
        due_days: 1,
        priority: 'high'
      },
      {
        task_name: 'HR Documentation',
        task_description: 'Complete all HR forms and documentation',
        assigned_to: 'HR Department',
        due_days: 3,
        priority: 'high'
      },
      {
        task_name: 'Office Tour',
        task_description: 'Introduce to team and office facilities',
        assigned_to: 'Manager',
        due_days: 0,
        priority: 'medium'
      },
      {
        task_name: 'Training Schedule',
        task_description: 'Assign relevant training modules',
        assigned_to: 'HR Department',
        due_days: 7,
        priority: 'medium'
      },
      {
        task_name: 'Payroll Setup',
        task_description: 'Setup payroll and benefits',
        assigned_to: 'Payroll Department',
        due_days: 5,
        priority: 'high'
      }
    ]
  },
  {
    id: 'manager',
    name: 'Manager Onboarding',
    description: 'Specialized onboarding for management positions',
    tasks: [
      {
        task_name: 'IT Setup',
        task_description: 'Create accounts, provide hardware, and admin access',
        assigned_to: 'IT Department',
        due_days: 1,
        priority: 'high'
      },
      {
        task_name: 'HR Documentation',
        task_description: 'Complete all HR forms and management agreements',
        assigned_to: 'HR Department',
        due_days: 3,
        priority: 'high'
      },
      {
        task_name: 'Leadership Training',
        task_description: 'Attend leadership and management training',
        assigned_to: 'Training Department',
        due_days: 14,
        priority: 'high'
      },
      {
        task_name: 'Team Introduction',
        task_description: 'Meet with team members and stakeholders',
        assigned_to: 'Senior Manager',
        due_days: 2,
        priority: 'high'
      },
      {
        task_name: 'Budget and Goals Review',
        task_description: 'Review department budget and quarterly goals',
        assigned_to: 'Finance Department',
        due_days: 7,
        priority: 'high'
      }
    ]
  }
];

export default function OnboardingTemplates() {
  const { addTask } = useOnboarding();
  const [templates, setTemplates] = useState<OnboardingTemplate[]>(defaultTemplates);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    tasks: []
  });

  const applyTemplate = async (template: OnboardingTemplate, employeeId: string) => {
    if (!employeeId) return;

    for (const task of template.tasks) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + task.due_days);
      
      await addTask({
        employee_id: employeeId,
        task_name: task.task_name,
        task_description: task.task_description,
        assigned_to: task.assigned_to,
        due_date: dueDate.toISOString().split('T')[0],
        priority: task.priority
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Templates</h1>
          <p className="text-muted-foreground">Manage reusable onboarding templates</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Onboarding Template</DialogTitle>
              <DialogDescription>
                Build a reusable template for onboarding new employees
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                  id="template_name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template_description">Description</Label>
                <Textarea
                  id="template_description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this template"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>Create Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant="secondary">
                  {template.tasks.length} tasks
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Tasks included:</h4>
                  <div className="space-y-1">
                    {template.tasks.slice(0, 3).map((task, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{task.task_name}</span>
                        <Badge variant={
                          task.priority === 'high' ? 'destructive' : 
                          task.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                    {template.tasks.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        +{template.tasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`employee-${template.id}`}>Apply to Employee</Label>
                  <div className="flex gap-2">
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emp-1">John Doe (EMP001)</SelectItem>
                        <SelectItem value="emp-2">Jane Smith (EMP002)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm"
                      onClick={() => applyTemplate(template, selectedEmployee)}
                      disabled={!selectedEmployee}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}