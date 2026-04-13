-- Add email column to profiles so it's queryable client-side for all login types
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
