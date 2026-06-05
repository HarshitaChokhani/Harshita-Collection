export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface ProductImage {
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  fabric: string | null;
  category_id: string | null;
  category_slug?: string | null;
  category_name?: string | null;
  price: number;
  mrp: number | null;
  discount_pct: number | null;
  rating: number;
  rating_count: number;
  stock: number;
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  images: ProductImage[];
  variants?: ProductVariant[];
}
