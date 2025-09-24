-- Create employee onboarding details table
CREATE TABLE public.employee_onboarding_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  personal_info JSONB,
  job_info JSONB,
  education_background JSONB,
  banking_payroll JSONB,
  it_system_access JSONB,
  compliance_declaration JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create onboarding templates table
CREATE TABLE public.onboarding_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  department TEXT,
  role TEXT,
  tasks JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extend onboarding_checklist with additional fields for comprehensive task management
ALTER TABLE public.onboarding_checklist 
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'general' CHECK (task_type IN ('document', 'policy', 'it_setup', 'training', 'general')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'completed', 'rejected')),
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS validation_result JSONB,
ADD COLUMN IF NOT EXISTS verified_by UUID,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0;

-- Create document validation results table
CREATE TABLE public.document_validation_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.onboarding_checklist(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'requires_review')),
  validation_details JSONB,
  ai_confidence_score DECIMAL(3,2),
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_onboarding_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_validation_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_onboarding_details
CREATE POLICY "Users can view their own onboarding details" 
ON public.employee_onboarding_details 
FOR SELECT 
USING (employee_id = ( SELECT e.id FROM employees e JOIN profiles p ON e.profile_id = p.id WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can insert their own onboarding details" 
ON public.employee_onboarding_details 
FOR INSERT 
WITH CHECK (employee_id = ( SELECT e.id FROM employees e JOIN profiles p ON e.profile_id = p.id WHERE p.user_id = auth.uid()));

CREATE POLICY "HR and Admins can view all onboarding details" 
ON public.employee_onboarding_details 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'hr')));

CREATE POLICY "HR and Admins can update onboarding details" 
ON public.employee_onboarding_details 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'hr')));

-- RLS Policies for onboarding_templates
CREATE POLICY "HR and Admins can manage onboarding templates" 
ON public.onboarding_templates 
FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'hr')));

CREATE POLICY "All authenticated users can view active templates" 
ON public.onboarding_templates 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for document_validation_results
CREATE POLICY "Users can view validation results for their tasks" 
ON public.document_validation_results 
FOR SELECT 
USING (task_id IN (
  SELECT oc.id FROM onboarding_checklist oc 
  JOIN employees e ON oc.employee_id = e.id 
  JOIN profiles p ON e.profile_id = p.id 
  WHERE p.user_id = auth.uid()
));

CREATE POLICY "HR and Admins can view all validation results" 
ON public.document_validation_results 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'hr')));

CREATE POLICY "System can insert validation results" 
ON public.document_validation_results 
FOR INSERT 
WITH CHECK (true);

-- Create function to auto-generate onboarding tasks
CREATE OR REPLACE FUNCTION public.create_onboarding_tasks_from_template(
  p_employee_id UUID,
  p_template_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_record RECORD;
  template_tasks JSONB;
BEGIN
  -- Get template tasks (use default if no template specified)
  IF p_template_id IS NULL THEN
    SELECT tasks INTO template_tasks 
    FROM onboarding_templates 
    WHERE template_name = 'Default Onboarding' AND is_active = true 
    LIMIT 1;
  ELSE
    SELECT tasks INTO template_tasks 
    FROM onboarding_templates 
    WHERE id = p_template_id AND is_active = true;
  END IF;

  -- Insert tasks from template
  IF template_tasks IS NOT NULL THEN
    FOR task_record IN 
      SELECT * FROM jsonb_array_elements(template_tasks) AS task
    LOOP
      INSERT INTO onboarding_checklist (
        employee_id,
        task_name,
        task_description,
        task_type,
        assigned_to,
        due_date,
        priority,
        status
      ) VALUES (
        p_employee_id,
        task_record.task->>'task_name',
        task_record.task->>'task_description',
        task_record.task->>'task_type',
        task_record.task->>'assigned_to',
        (CURRENT_DATE + INTERVAL '1 day' * (task_record.task->>'due_days')::INTEGER),
        task_record.task->>'priority',
        'pending'
      );
    END LOOP;
  END IF;
END;
$$;

-- Insert default onboarding template
INSERT INTO public.onboarding_templates (template_name, tasks) VALUES (
  'Default Onboarding',
  '[
    {
      "task_name": "Upload Identity Document",
      "task_description": "Upload a valid government-issued ID (passport, driver license, etc.)",
      "task_type": "document",
      "assigned_to": "Employee",
      "due_days": "3",
      "priority": "high"
    },
    {
      "task_name": "Bank Account Information",
      "task_description": "Provide bank account details for payroll setup",
      "task_type": "document", 
      "assigned_to": "Employee",
      "due_days": "5",
      "priority": "high"
    },
    {
      "task_name": "Employment Contract Acknowledgment",
      "task_description": "Review and acknowledge employment contract terms",
      "task_type": "policy",
      "assigned_to": "Employee", 
      "due_days": "2",
      "priority": "high"
    },
    {
      "task_name": "IT Equipment Setup",
      "task_description": "Set up laptop, email, and system access",
      "task_type": "it_setup",
      "assigned_to": "IT Department",
      "due_days": "1",
      "priority": "high"
    },
    {
      "task_name": "Company Orientation Training",
      "task_description": "Complete mandatory company orientation and training modules",
      "task_type": "training",
      "assigned_to": "Employee",
      "due_days": "7",
      "priority": "medium"
    },
    {
      "task_name": "Safety Training",
      "task_description": "Complete workplace safety and emergency procedures training",
      "task_type": "training",
      "assigned_to": "Employee",
      "due_days": "10",
      "priority": "medium"
    }
  ]'::jsonb
);

-- Add trigger to update updated_at columns
CREATE TRIGGER update_employee_onboarding_details_updated_at
BEFORE UPDATE ON public.employee_onboarding_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_templates_updated_at
BEFORE UPDATE ON public.onboarding_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();