-- Add media_urls JSONB column to products
-- Stores up to 3 images, 1 video, 1 gif per product
-- Format: [{"type": "image"|"video"|"gif", "url": "..."}]
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;

-- Fix feedback RLS: explicitly allow anonymous (unauthenticated) users to submit
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
