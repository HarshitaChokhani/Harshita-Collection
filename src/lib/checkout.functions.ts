import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  image: z.string().max(500).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  price: z.number().positive(),
  qty: z.number().int().min(1).max(20),
});

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c, error } = await supabaseAdmin
      .from("coupons")
      .select("code, description, discount_type, discount_value, min_order, max_discount, is_active, expires_at")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!c || !c.is_active) return { valid: false as const, reason: "Invalid coupon code" };
    if (c.expires_at && new Date(c.expires_at) < new Date()) return { valid: false as const, reason: "Coupon expired" };
    if (data.subtotal < Number(c.min_order ?? 0)) {
      return { valid: false as const, reason: `Minimum order ₹${Number(c.min_order).toFixed(0)}` };
    }
    let discount = c.discount_type === "percent"
      ? (data.subtotal * Number(c.discount_value)) / 100
      : Number(c.discount_value);
    if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
    discount = Math.min(discount, data.subtotal);
    return { valid: true as const, code: c.code, discount: Math.round(discount), description: c.description };
  });

const createOrderInput = z.object({
  items: z.array(itemSchema).min(1).max(50),
  address: z.object({
    full_name: z.string().min(2).max(80),
    phone: z.string().min(7).max(20),
    line1: z.string().min(3).max(200),
    line2: z.string().max(200).optional().nullable(),
    city: z.string().min(2).max(80),
    state: z.string().min(2).max(80),
    pincode: z.string().regex(/^\d{6}$/),
    country: z.string().max(60).default("India"),
  }),
  coupon_code: z.string().trim().max(40).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createOrderInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Re-fetch authoritative prices
    const ids = data.items.map((i) => i.productId);
    const { data: dbProducts, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, slug, name, price, stock, is_active")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    const byId = new Map(dbProducts?.map((p) => [p.id, p]) ?? []);

    let subtotal = 0;
    const itemsToInsert: Array<{
      product_id: string;
      product_name: string;
      product_slug: string;
      image_url: string | null;
      size: string | null;
      qty: number;
      price: number;
    }> = [];
    for (const it of data.items) {
      const p = byId.get(it.productId);
      if (!p || !p.is_active) throw new Error(`Item unavailable: ${it.name}`);
      const price = Number(p.price);
      subtotal += price * it.qty;
      itemsToInsert.push({
        product_id: p.id,
        product_name: p.name,
        product_slug: p.slug,
        image_url: it.image ?? null,
        size: it.size ?? null,
        qty: it.qty,
        price,
      });
    }

    // Coupon
    let discount = 0;
    let couponCode: string | null = null;
    if (data.coupon_code) {
      const { data: c } = await supabaseAdmin
        .from("coupons")
        .select("code, discount_type, discount_value, min_order, max_discount, is_active, expires_at")
        .eq("code", data.coupon_code.toUpperCase())
        .maybeSingle();
      if (c && c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date()) && subtotal >= Number(c.min_order ?? 0)) {
        let d = c.discount_type === "percent" ? (subtotal * Number(c.discount_value)) / 100 : Number(c.discount_value);
        if (c.max_discount) d = Math.min(d, Number(c.max_discount));
        discount = Math.min(Math.round(d), subtotal);
        couponCode = c.code;
      }
    }

    const shipping = 0; // free shipping
    const total = Math.max(0, subtotal - discount + shipping);

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        subtotal,
        discount,
        shipping,
        total,
        coupon_code: couponCode,
        shipping_address: data.address,
        notes: data.notes ?? null,
        status: "pending",
        payment_status: "pending",
      })
      .select("id, order_number, total")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await supabase
      .from("order_items")
      .insert(itemsToInsert.map((i) => ({ ...i, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { id: order.id, order_number: order.order_number, total: Number(order.total) };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, status, payment_status, subtotal, discount, shipping, total, coupon_code, shipping_address, notes, tracking_number, created_at, order_items(id, product_name, product_slug, image_url, size, qty, price)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });
