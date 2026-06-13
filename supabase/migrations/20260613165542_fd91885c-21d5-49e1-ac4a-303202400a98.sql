-- Remove public SELECT on coupons; validation goes through server function (supabaseAdmin)
DROP POLICY IF EXISTS "Active coupons readable" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;

-- Defensively revoke direct INSERT/UPDATE/DELETE on user_roles from authenticated;
-- the "Admins manage roles" policy still allows admins via has_role check,
-- and service_role retains full access.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;