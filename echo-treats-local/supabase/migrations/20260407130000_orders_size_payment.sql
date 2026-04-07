ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS size_preference text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_received boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_amount numeric;
