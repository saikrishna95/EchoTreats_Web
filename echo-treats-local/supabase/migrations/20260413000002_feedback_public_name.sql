-- Add public_name to feedback — shown on homepage instead of real full name
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS public_name TEXT;
