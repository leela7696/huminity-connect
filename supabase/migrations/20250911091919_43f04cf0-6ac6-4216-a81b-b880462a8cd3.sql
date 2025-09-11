-- Fix infinite recursion in RLS policies by creating security definer functions
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Admins and HR can create user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and HR can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and HR can update all profiles" ON public.profiles;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Recreate policies using the security definer function
CREATE POLICY "Admins and HR can create user profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  public.get_current_user_role() IN ('admin', 'hr')
);

CREATE POLICY "Admins and HR can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  public.get_current_user_role() IN ('admin', 'hr')
);

CREATE POLICY "Admins and HR can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  public.get_current_user_role() IN ('admin', 'hr')
);

-- Also fix the employees policies to use the same function
DROP POLICY IF EXISTS "Admins and HR can create employees" ON public.employees;
DROP POLICY IF EXISTS "Admins and HR can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins and HR can delete employees" ON public.employees;

CREATE POLICY "Admins and HR can create employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (public.get_current_user_role() IN ('admin', 'hr'));

CREATE POLICY "Admins and HR can update employees" 
ON public.employees 
FOR UPDATE 
USING (public.get_current_user_role() IN ('admin', 'hr'));

CREATE POLICY "Admins and HR can delete employees" 
ON public.employees 
FOR DELETE 
USING (public.get_current_user_role() IN ('admin', 'hr'));