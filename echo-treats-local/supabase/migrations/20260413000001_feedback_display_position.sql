-- Add display_position to feedback so admin can pin up to 4 reviews on the homepage
-- Allowed values: 1, 2, 3, 4 (NULL = not pinned)
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS display_position INTEGER CHECK (display_position BETWEEN 1 AND 4);

-- Allow admin / service-role to update feedback (set display_position)
DROP POLICY IF EXISTS "Admin can update feedback" ON public.feedback;
CREATE POLICY "Admin can update feedback" ON public.feedback
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anyone to read feedback (needed for homepage reviews)
DROP POLICY IF EXISTS "Anyone can read feedback" ON public.feedback;
CREATE POLICY "Anyone can read feedback" ON public.feedback
  FOR SELECT TO anon, authenticated
  USING (true);
