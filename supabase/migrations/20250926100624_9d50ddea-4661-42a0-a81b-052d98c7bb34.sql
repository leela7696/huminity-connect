-- Add email field to employees table for initial contact
ALTER TABLE public.employees ADD COLUMN email text;

-- Add comment to explain this field
COMMENT ON COLUMN public.employees.email IS 'Initial email address for employee contact and notifications. Used before profile is created.';