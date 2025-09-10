-- Add foreign key constraint between audit_logs and profiles
-- audit_logs.user_id should reference profiles.user_id
ALTER TABLE public.audit_logs
ADD CONSTRAINT fk_audit_logs_user_id
FOREIGN KEY (user_id) REFERENCES profiles(user_id)
ON DELETE SET NULL;