ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cotton_percentage INTEGER CHECK (cotton_percentage IS NULL OR (cotton_percentage >= 0 AND cotton_percentage <= 100)),
  ADD COLUMN IF NOT EXISTS material_composition TEXT,
  ADD COLUMN IF NOT EXISTS wash_care TEXT,
  ADD COLUMN IF NOT EXISTS colors JSONB,
  ADD COLUMN IF NOT EXISTS shipping_info TEXT,
  ADD COLUMN IF NOT EXISTS return_policy TEXT;