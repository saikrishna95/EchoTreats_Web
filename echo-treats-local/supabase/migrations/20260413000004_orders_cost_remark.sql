-- Admin remark and cost price per order
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_remark TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cost_price NUMERIC;

-- Cost price per product (standard making cost)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC;
