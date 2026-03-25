
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  taste_rating INTEGER NOT NULL CHECK (taste_rating >= 1 AND taste_rating <= 5),
  presentation_rating INTEGER NOT NULL CHECK (presentation_rating >= 1 AND presentation_rating <= 5),
  service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
  product_ids UUID[] DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT TO public USING (has_role(auth.uid(), 'admin'));
