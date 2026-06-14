import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Admin access required");
}

export const checkAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    return { isAdmin: !!data };
  });

// -------- Stats --------
export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [orders, products, users, revenue] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("total").eq("payment_status", "paid"),
    ]);
    const total = (revenue.data ?? []).reduce((s, r) => s + Number(r.total), 0);
    return {
      orders: orders.count ?? 0,
      products: products.count ?? 0,
      customers: users.count ?? 0,
      revenue: Math.round(total),
    };
  });

// -------- Products --------
export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, slug, name, price, stock, is_active, is_featured, is_new, is_bestseller, category_id, description, fabric, mrp, discount_pct, cotton_percentage, material_composition, wash_care, colors, shipping_info, return_policy, categories(name), product_images(id, url, sort_order, alt)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const colorSchema = z.array(z.object({
  name: z.string().trim().min(1).max(40),
  hex: z.string().trim().regex(/^#?[0-9a-fA-F]{3,8}$/, "Invalid hex"),
})).max(20).optional().nullable();

const productInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().max(4000).optional().nullable(),
  fabric: z.string().max(200).optional().nullable(),
  material_composition: z.string().max(200).optional().nullable(),
  cotton_percentage: z.number().int().min(0).max(100).optional().nullable(),
  wash_care: z.string().max(500).optional().nullable(),
  colors: colorSchema,
  shipping_info: z.string().max(500).optional().nullable(),
  return_policy: z.string().max(500).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  price: z.number().positive().max(999999),
  mrp: z.number().positive().max(999999).optional().nullable(),
  discount_pct: z.number().int().min(0).max(99).optional().nullable(),
  stock: z.number().int().min(0).max(99999),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  image_urls: z.array(z.string().url().max(500)).max(15).optional(),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, image_urls, ...row } = data;
    // normalize hex
    if (Array.isArray(row.colors)) {
      row.colors = row.colors.map((c) => ({ name: c.name, hex: c.hex.startsWith("#") ? c.hex : `#${c.hex}` }));
    }
    let productId = id;
    if (id) {
      const { error } = await supabaseAdmin.from("products").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: created, error } = await supabaseAdmin.from("products").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      productId = created.id;
    }
    if (image_urls && productId) {
      await supabaseAdmin.from("product_images").delete().eq("product_id", productId);
      const rows = image_urls.map((url, i) => ({ product_id: productId, url, sort_order: i, alt: row.name }));
      if (rows.length) {
        const { error } = await supabaseAdmin.from("product_images").insert(rows);
        if (error) throw new Error(error.message);
      }
    }
    return { id: productId };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Orders --------
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, user_id, status, payment_status, total, created_at, shipping_address")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending","paid","processing","shipped","delivered","cancelled","refunded"]).optional(),
    payment_status: z.enum(["pending","paid","failed","refunded"]).optional(),
    tracking_number: z.string().max(80).optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("orders").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Coupons --------
export const adminListCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("coupons")
      .select("id, code, description, discount_type, discount_value, min_order, max_discount, is_active, expires_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const couponInput = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(40).regex(/^[A-Z0-9_-]+$/i),
  description: z.string().max(200).optional().nullable(),
  discount_type: z.enum(["percent","flat"]),
  discount_value: z.number().positive().max(100000),
  min_order: z.number().min(0).max(999999),
  max_discount: z.number().min(0).max(999999).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => couponInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...row } = data;
    row.code = row.code.toUpperCase();
    if (id) {
      const { error } = await supabaseAdmin.from("coupons").update(row).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    } else {
      const { data: c, error } = await supabaseAdmin.from("coupons").insert(row).select("id").single();
      if (error) throw new Error(error.message);
      return { id: c.id };
    }
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Categories --------
export const adminListCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("categories").select("id, name, slug").order("sort_order");
    return data ?? [];
  });

// -------- Reviews --------
export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("id, rating, title, body, status, created_at, product_id, user_id, products(name, slug), profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminModerateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "approved", "rejected"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("reviews").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Customers --------
export const adminListCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone, created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("orders").select("user_id, total, payment_status"),
    ]);
    if (error) throw new Error(error.message);
    const totals = new Map<string, { orders: number; spent: number }>();
    for (const o of orders ?? []) {
      const prev = totals.get(o.user_id) ?? { orders: 0, spent: 0 };
      prev.orders += 1;
      if (o.payment_status === "paid") prev.spent += Number(o.total);
      totals.set(o.user_id, prev);
    }
    return (profiles ?? []).map((p) => ({
      ...p,
      orders: totals.get(p.id)?.orders ?? 0,
      spent: totals.get(p.id)?.spent ?? 0,
    }));
  });

// -------- Image upload signed URL --------
export const adminCreateUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    filename: z.string().min(1).max(200).regex(/^[a-zA-Z0-9._-]+$/),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${data.filename}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("product-images")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    return { signedUrl: signed.signedUrl, token: signed.token, path, publicUrl: pub.publicUrl };
  });
