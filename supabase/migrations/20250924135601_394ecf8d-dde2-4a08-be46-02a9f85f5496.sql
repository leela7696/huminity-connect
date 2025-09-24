-- Allow profile_id to be null for employees created before user registration
ALTER TABLE public.employees ALTER COLUMN profile_id DROP NOT NULL;

-- Add a comment to explain this design decision
COMMENT ON COLUMN public.employees.profile_id IS 'Can be null for employees created before user registration. Will be populated when user creates their account.';