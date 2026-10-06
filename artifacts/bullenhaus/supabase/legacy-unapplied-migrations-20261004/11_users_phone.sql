-- Add phone number to users so agents can call clients
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
