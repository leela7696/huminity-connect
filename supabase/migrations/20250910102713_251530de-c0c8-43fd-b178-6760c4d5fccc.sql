-- Create employee documents table
CREATE TABLE public.employee_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_verified BOOLEAN DEFAULT false,
  notes TEXT
);

-- Create employee lifecycle events table
CREATE TABLE public.employee_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'onboarding', 'promotion', 'transfer', 'offboarding'
  event_date DATE NOT NULL,
  details JSONB,
  triggered_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding checklist table
CREATE TABLE public.onboarding_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_description TEXT,
  assigned_to TEXT, -- department or person
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance reviews table
CREATE TABLE public.performance_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  goals_achieved TEXT,
  areas_for_improvement TEXT,
  manager_comments TEXT,
  employee_comments TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee analytics table for reporting
CREATE TABLE public.employee_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  total_employees INTEGER DEFAULT 0,
  new_joiners INTEGER DEFAULT 0,
  resignations INTEGER DEFAULT 0,
  active_employees INTEGER DEFAULT 0,
  onboarding_employees INTEGER DEFAULT 0,
  department_distribution JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_documents
CREATE POLICY "Admins and HR can view all documents" 
ON public.employee_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can view their own documents" 
ON public.employee_documents 
FOR SELECT 
USING (
  employee_id = (
    SELECT e.id FROM employees e 
    JOIN profiles p ON e.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and HR can manage documents" 
ON public.employee_documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for employee_lifecycle_events
CREATE POLICY "Admins and HR can view all lifecycle events" 
ON public.employee_lifecycle_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Managers can view their team lifecycle events" 
ON public.employee_lifecycle_events 
FOR SELECT 
USING (
  employee_id IN (
    SELECT e.id FROM employees e 
    WHERE e.manager_id = (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins and HR can manage lifecycle events" 
ON public.employee_lifecycle_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for onboarding_checklist
CREATE POLICY "Admins and HR can view all onboarding tasks" 
ON public.onboarding_checklist 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can view their own onboarding tasks" 
ON public.onboarding_checklist 
FOR SELECT 
USING (
  employee_id = (
    SELECT e.id FROM employees e 
    JOIN profiles p ON e.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and HR can manage onboarding tasks" 
ON public.onboarding_checklist 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for performance_reviews
CREATE POLICY "Admins and HR can view all performance reviews" 
ON public.performance_reviews 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Users can view their own performance reviews" 
ON public.performance_reviews 
FOR SELECT 
USING (
  employee_id = (
    SELECT e.id FROM employees e 
    JOIN profiles p ON e.profile_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can view their team performance reviews" 
ON public.performance_reviews 
FOR SELECT 
USING (
  employee_id IN (
    SELECT e.id FROM employees e 
    WHERE e.manager_id = (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins and HR can manage performance reviews" 
ON public.performance_reviews 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

-- RLS Policies for employee_analytics
CREATE POLICY "Admins and HR can view analytics" 
ON public.employee_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Admins can manage analytics" 
ON public.employee_analytics 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX idx_employee_documents_employee_id ON public.employee_documents(employee_id);
CREATE INDEX idx_employee_lifecycle_events_employee_id ON public.employee_lifecycle_events(employee_id);
CREATE INDEX idx_onboarding_checklist_employee_id ON public.onboarding_checklist(employee_id);
CREATE INDEX idx_performance_reviews_employee_id ON public.performance_reviews(employee_id);
CREATE INDEX idx_employee_analytics_date ON public.employee_analytics(date);

-- Create update triggers for timestamps
CREATE TRIGGER update_performance_reviews_updated_at
BEFORE UPDATE ON public.performance_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create onboarding checklist for new employees
CREATE OR REPLACE FUNCTION public.create_onboarding_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default onboarding tasks
  INSERT INTO public.onboarding_checklist (employee_id, task_name, task_description, assigned_to, due_date, priority)
  VALUES
    (NEW.id, 'IT Setup', 'Create accounts and provide hardware', 'IT Department', NEW.hire_date + INTERVAL '1 day', 'high'),
    (NEW.id, 'HR Documentation', 'Complete all HR forms and documentation', 'HR Department', NEW.hire_date + INTERVAL '3 days', 'high'),
    (NEW.id, 'Office Tour', 'Introduce to team and office facilities', 'Manager', NEW.hire_date, 'medium'),
    (NEW.id, 'Training Schedule', 'Assign relevant training modules', 'HR Department', NEW.hire_date + INTERVAL '1 week', 'medium'),
    (NEW.id, 'Payroll Setup', 'Setup payroll and benefits', 'Payroll Department', NEW.hire_date + INTERVAL '5 days', 'high');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new employee onboarding
CREATE TRIGGER trigger_create_onboarding_checklist
AFTER INSERT ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.create_onboarding_checklist();