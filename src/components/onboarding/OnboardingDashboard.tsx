import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarIcon, Users, CheckCircle2, Clock, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useEmployees } from '@/hooks/useEmployees';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function OnboardingDashboard() {
  const { tasks, stats, loading, completeTask, addTask, updateTask, deleteTask } = useOnboarding();
  const { employees } = useEmployees();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const [newTask, setNewTask] = useState({
    employee_id: '',
    task_name: '',
    task_description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium'
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (task: any) => {
    if (task.is_completed) return 'default';
    if (task.due_date && new Date(task.due_date) < new Date()) return 'destructive';
    return 'secondary';
  };

  const handleAddTask = async () => {
    if (!newTask.employee_id || !newTask.task_name || !newTask.assigned_to) return;
    
    await addTask(newTask);
    setNewTask({
      employee_id: '',
      task_name: '',
      task_description: '',
      assigned_to: '',
      due_date: '',
      priority: 'medium'
    });
    setIsAddDialogOpen(false);
  };

  const handleEditTask = async () => {
    if (!editingTask) return;
    
    await updateTask(editingTask.id, {
      task_name: editingTask.task_name,
      task_description: editingTask.task_description,
      assigned_to: editingTask.assigned_to,
      due_date: editingTask.due_date,
      priority: editingTask.priority
    });
    setEditingTask(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading onboarding data...</div>;
  }

  const completionRate = stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Management</h1>
          <p className="text-muted-foreground">Manage employee onboarding tasks and progress</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Onboarding Task</DialogTitle>
              <DialogDescription>
                Create a new onboarding task for an employee
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="employee">Employee</Label>
                <Select value={newTask.employee_id} onValueChange={(value) => setNewTask(prev => ({ ...prev, employee_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.profiles?.full_name} ({employee.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task_name">Task Name</Label>
                <Input
                  id="task_name"
                  value={newTask.task_name}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task_name: e.target.value }))}
                  placeholder="Enter task name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task_description">Description</Label>
                <Textarea
                  id="task_description"
                  value={newTask.task_description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task_description: e.target.value }))}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assigned_to">Assigned To</Label>
                <Input
                  id="assigned_to"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                  placeholder="Department or person name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTask}>Add Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_tasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_tasks}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(completionRate)}% completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue_tasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees Onboarding</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.employees_onboarding}</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Onboarding Progress</CardTitle>
          <CardDescription>
            {stats.completed_tasks} of {stats.total_tasks} tasks completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(completionRate)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{task.task_name}</CardTitle>
                      <CardDescription>
                        Employee: {task.employee?.profiles?.full_name} ({task.employee?.employee_id})
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge variant={getStatusColor(task)}>
                        {task.is_completed ? 'Completed' : 
                         task.due_date && new Date(task.due_date) < new Date() ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.task_description && (
                      <p className="text-sm text-muted-foreground">{task.task_description}</p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span>Assigned to: {task.assigned_to}</span>
                      {task.due_date && (
                        <span className={cn(
                          "flex items-center gap-1",
                          new Date(task.due_date) < new Date() && !task.is_completed ? "text-destructive" : ""
                        )}>
                          <Clock className="w-3 h-3" />
                          Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                    {task.is_completed && task.completed_by_profile && (
                      <p className="text-sm text-muted-foreground">
                        Completed by {task.completed_by_profile.full_name} on{' '}
                        {task.completed_at && format(new Date(task.completed_at), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                    {!task.is_completed && (
                      <Button
                        size="sm"
                        onClick={() => completeTask(task.id)}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {tasks.filter(task => !task.is_completed).map((task) => (
              <Card key={task.id}>
                {/* ... similar content as above ... */}
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {tasks.filter(task => task.is_completed).map((task) => (
              <Card key={task.id}>
                {/* ... similar content as above ... */}
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          <div className="grid gap-4">
            {tasks.filter(task => 
              !task.is_completed && 
              task.due_date && 
              new Date(task.due_date) < new Date()
            ).map((task) => (
              <Card key={task.id}>
                {/* ... similar content as above ... */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Onboarding Task</DialogTitle>
              <DialogDescription>
                Update the task details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_task_name">Task Name</Label>
                <Input
                  id="edit_task_name"
                  value={editingTask.task_name}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, task_name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_task_description">Description</Label>
                <Textarea
                  id="edit_task_description"
                  value={editingTask.task_description || ''}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, task_description: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_assigned_to">Assigned To</Label>
                <Input
                  id="edit_assigned_to"
                  value={editingTask.assigned_to}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_due_date">Due Date</Label>
                <Input
                  id="edit_due_date"
                  type="date"
                  value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_priority">Priority</Label>
                <Select value={editingTask.priority} onValueChange={(value) => setEditingTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
              <Button onClick={handleEditTask}>Update Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}