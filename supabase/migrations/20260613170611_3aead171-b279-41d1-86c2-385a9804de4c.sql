DROP POLICY IF EXISTS "Coupons readable" ON public.coupons;
REVOKE SELECT ON public.coupons FROM anon;