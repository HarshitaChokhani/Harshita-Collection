import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Category, Product } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const PRODUCT_COLS =
  "id, slug, name, description, fabric, category_id, price, mrp, discount_pct, rating, rating_count, stock, is_new, is_bestseller, is_featured, cotton_percentage, material_composition, wash_care, colors, shipping_info, return_policy";

function rowToProduct(row: any, images: any[] = [], variants: any[] = []): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    fabric: row.fabric,
    category_id: row.category_id,
    category_slug: row.categories?.slug ?? null,
    category_name: row.categories?.name ?? null,
    price: Number(row.price),
    mrp: row.mrp != null ? Number(row.mrp) : null,
    discount_pct: row.discount_pct,
    rating: Number(row.rating ?? 0),
    rating_count: row.rating_count ?? 0,
    stock: row.stock ?? 0,
    is_new: !!row.is_new,
    is_bestseller: !!row.is_bestseller,
    is_featured: !!row.is_featured,
    cotton_percentage: row.cotton_percentage ?? null,
    material_composition: row.material_composition ?? null,
    wash_care: row.wash_care ?? null,
    colors: Array.isArray(row.colors) ? row.colors : null,
    shipping_info: row.shipping_info ?? null,
    return_policy: row.return_policy ?? null,
    images: images.map((i) => ({ url: i.url, alt: i.alt, sort_order: i.sort_order })),
    variants: variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      color_hex: v.color_hex,
      stock: v.stock,
    })),
  };
}

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
});

export const getHomepageProducts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data, error } = await sb
    .from("products")
    .select(`${PRODUCT_COLS}, product_images(url, alt, sort_order)`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  const all = (data ?? []).map((r: any) =>
    rowToProduct(r, r.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? []),
  );
  return {
    featured: all.filter((p) => p.is_featured).slice(0, 6),
    newArrivals: all.filter((p) => p.is_new).slice(0, 6),
    bestSellers: all.filter((p) => p.is_bestseller).slice(0, 6),
  };
});

export const getProductsByCategory = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    // Virtual categories
    if (data.slug === "new-arrivals" || data.slug === "best-sellers" || data.slug === "festive-collection") {
      const filter =
        data.slug === "new-arrivals"
          ? { col: "is_new" }
          : data.slug === "best-sellers"
            ? { col: "is_bestseller" }
            : null;
      let q = sb
        .from("products")
        .select(`${PRODUCT_COLS}, product_images(url, alt, sort_order)`)
        .eq("is_active", true);
      if (filter) q = q.eq(filter.col, true);
      else {
        // festive-collection: filter by category slug
        const { data: cat } = await sb.from("categories").select("id, name").eq("slug", data.slug).maybeSingle();
        if (cat) q = q.eq("category_id", cat.id);
      }
      const { data: rows, error } = await q.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return {
        category: { slug: data.slug, name: titleize(data.slug) },
        products: (rows ?? []).map((r: any) =>
          rowToProduct(r, r.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? []),
        ),
      };
    }

    const { data: cat, error: catErr } = await sb
      .from("categories")
      .select("id, slug, name")
      .eq("slug", data.slug)
      .maybeSingle();
    if (catErr) throw new Error(catErr.message);
    if (!cat) return { category: null, products: [] };

    const { data: rows, error } = await sb
      .from("products")
      .select(`${PRODUCT_COLS}, product_images(url, alt, sort_order)`)
      .eq("is_active", true)
      .eq("category_id", cat.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return {
      category: cat,
      products: (rows ?? []).map((r: any) =>
        rowToProduct(r, r.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? []),
      ),
    };
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: row, error } = await sb
      .from("products")
      .select(`${PRODUCT_COLS}, categories(slug, name), product_images(url, alt, sort_order), product_variants(id, size, color, color_hex, stock)`)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return rowToProduct(
      row,
      (row as any).product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? [],
      (row as any).product_variants ?? [],
    );
  });

export const searchProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const q = data.q.trim();
    if (!q) return [];
    const { data: rows, error } = await sb
      .from("products")
      .select(`${PRODUCT_COLS}, product_images(url, alt, sort_order)`)
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .limit(40);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) =>
      rowToProduct(r, r.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) ?? []),
    );
  });

function titleize(slug: string) {
  return slug
    .split("-")
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join(" ");
}
