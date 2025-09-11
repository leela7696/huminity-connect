-- Add missing RLS policies for employee management
-- Allow admins and HR to create employees
CREATE POLICY "Admins and HR can create employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

-- Allow admins and HR to update employees
CREATE POLICY "Admins and HR can update employees" 
ON public.employees 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

-- Allow admins and HR to delete employees
CREATE POLICY "Admins and HR can delete employees" 
ON public.employees 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

-- Also add missing policies for profiles table to allow admins/HR to create profiles for new employees
CREATE POLICY "Admins and HR can create user profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  -- Allow admins/HR to create profiles for others
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

CREATE POLICY "Admins and HR can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);

CREATE POLICY "Admins and HR can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'hr')
  )
);