-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'manager', 'employee');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  department TEXT,
  position TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create employees table for HR management
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  hire_date DATE,
  status TEXT DEFAULT 'active',
  manager_id UUID REFERENCES public.profiles(id),
  salary DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create policies for employees
CREATE POLICY "Admins and HR can view all employees" 
ON public.employees 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

CREATE POLICY "Managers can view their team" 
ON public.employees 
FOR SELECT 
USING (
  manager_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their own employee record" 
ON public.employees 
FOR SELECT 
USING (
  profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create leave requests table
CREATE TABLE public.leave_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for leave requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for leave requests
CREATE POLICY "Users can view their own leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (employee_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own leave requests" 
ON public.leave_requests 
FOR INSERT 
WITH CHECK (employee_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers and HR can view team leave requests" 
ON public.leave_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.employees e ON e.profile_id = p.id
    WHERE p.user_id = auth.uid() 
    AND (p.role IN ('admin', 'hr', 'manager'))
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();