-- Ensure the product-images storage bucket exists and is publicly readable.
-- Admin uploads use storage.getPublicUrl(), which only resolves when the
-- bucket's `public` flag is true; otherwise the <img> renders as a broken
-- image ("question mark"). RLS read policies alone are not sufficient.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
