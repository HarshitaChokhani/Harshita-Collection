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

function getProductImagePath(value: string): string | null {
  const trimmed = value.trim();
  const proxyPrefix = "/api/public/product-image?";

  if (trimmed.startsWith(proxyPrefix)) {
    const params = new URLSearchParams(trimmed.slice(proxyPrefix.length));
    return cleanStoragePath(params.get("path"));
  }

  try {
    const url = new URL(trimmed);
    if (url.pathname === "/api/public/product-image") {
      return cleanStoragePath(url.searchParams.get("path"));
    }
    const match = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/product-images\/([^?]+)/.exec(url.pathname);
    if (match) return cleanStoragePath(decodeURIComponent(match[1]));
  } catch {
    // Not an absolute URL; handled below.
  }

  return null;
}

function cleanStoragePath(path: string | null): string | null {
  if (!path) return null;
  const normalized = path.replace(/^\/+/, "").trim();
  if (!normalized || normalized.includes("..") || normalized.length > 500) return null;
  return normalized;
}

function isAcceptedProductImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (getProductImagePath(trimmed)) return true;
  if (/^[a-zA-Z0-9._-]+\.(?:jpe?g|png|webp|gif)$/i.test(trimmed)) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const productImageUrlSchema = z.string().trim().min(1).max(2000).refine(
  isAcceptedProductImageUrl,
  "Invalid product image URL",
);

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
  image_urls: z.array(productImageUrlSchema).max(15).optional(),
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

// -------- AI autofill product details from an image --------
const autofillSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", description: "Concise, appealing product title (e.g. 'Royal Blue Chikankari Anarkali Kurti'). Empty string if unclear." },
    description: { type: "string", description: "2-4 sentence marketing description of the garment, its look and occasion. Empty string if unclear." },
    fabric: { type: "string", description: "Primary fabric if identifiable (e.g. 'Cotton', 'Georgette', 'Silk Blend'). Empty string if unsure." },
    material_composition: { type: "string", description: "Composition if evident (e.g. '70% Cotton, 30% Silk'). Empty string if unsure." },
    cotton_percentage: { type: "integer", description: "Estimated cotton percentage 0-100, or 0 if unknown." },
    wash_care: { type: "string", description: "Typical wash-care guidance for this fabric (e.g. 'Dry clean only. Do not bleach.'). Empty string if unsure." },
    category: { type: "string", description: "The single best-matching category name from the provided list, exactly as written. Empty string if none fit." },
    colors: {
      type: "array",
      description: "Distinct colours visible in the garment.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Human colour name, e.g. 'Royal Blue'." },
          hex: { type: "string", description: "Approximate hex code including leading #, e.g. '#1E3A8A'." },
        },
        required: ["name", "hex"],
      },
    },
  },
  required: ["name", "description", "fabric", "material_composition", "cotton_percentage", "wash_care", "category", "colors"],
} as const;

export const adminAutofillFromImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    imageUrl: productImageUrlSchema,
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI autofill is not configured (missing ANTHROPIC_API_KEY).");

    // Category list guides the model toward a valid choice.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Fetch the image server-side and send it inline as base64 so this works
    // regardless of whether the storage bucket is publicly reachable by Anthropic.
    const storagePath = getProductImagePath(data.imageUrl);
    let mediaType = "image/jpeg";
    let imageBytes: ArrayBuffer;

    if (storagePath) {
      const { data: blob, error } = await supabaseAdmin.storage
        .from("product-images")
        .download(storagePath);
      if (error || !blob) throw new Error("Could not load the uploaded image.");
      mediaType = blob.type || mediaType;
      imageBytes = await blob.arrayBuffer();
    } else {
      const imgRes = await fetch(data.imageUrl);
      if (!imgRes.ok) throw new Error("Could not load the uploaded image.");
      mediaType = imgRes.headers.get("content-type")?.split(";")[0] || mediaType;
      imageBytes = await imgRes.arrayBuffer();
    }

    if (!/^image\/(jpeg|png|gif|webp)$/.test(mediaType)) throw new Error("Unsupported image type for autofill.");
    const base64 = Buffer.from(imageBytes).toString("base64");

    const { data: cats } = await supabaseAdmin.from("categories").select("name").order("sort_order");
    const categoryNames = (cats ?? []).map((c) => c.name);

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: autofillSchema } },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data: base64 } },
            {
              type: "text",
              text:
                "You are cataloguing an item for an Indian ethnic-wear boutique (kurtis, suits, sarees, dupattas, etc.). " +
                "Examine the garment in this photo and fill in the product details. Be specific and accurate; only state what you can reasonably infer from the image. " +
                "Leave a field as an empty string (or 0 for cotton_percentage) when you are unsure rather than guessing wildly.\n\n" +
                "Choose `category` from exactly one of these options (or empty string if none fit):\n" +
                categoryNames.map((n) => `- ${n}`).join("\n"),
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b): b is Extract<typeof b, { type: "text" }> => b.type === "text");
    if (!textBlock) throw new Error("AI autofill returned no result.");
    let parsed: z.infer<typeof autofillResult>;
    try {
      parsed = autofillResult.parse(JSON.parse(textBlock.text));
    } catch {
      throw new Error("AI autofill returned an unexpected result.");
    }
    // Map the returned category name back to a real category id.
    let categoryId: string | null = null;
    if (parsed.category) {
      const { data: match } = await supabaseAdmin
        .from("categories").select("id").ilike("name", parsed.category).maybeSingle();
      categoryId = match?.id ?? null;
    }
    return { ...parsed, category_id: categoryId };
  });

const autofillResult = z.object({
  name: z.string(),
  description: z.string(),
  fabric: z.string(),
  material_composition: z.string(),
  cotton_percentage: z.number().int().min(0).max(100),
  wash_care: z.string(),
  category: z.string(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })),
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
    return { signedUrl: signed.signedUrl, token: signed.token, path };
  });

// After the file is PUT, return a stable public proxy URL served by our origin.
export const adminSignImageUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    path: z.string().min(1).max(500).refine((path) => !!cleanStoragePath(path), "Invalid image path"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const path = cleanStoragePath(data.path)!;
    return { url: `/api/public/product-image?path=${encodeURIComponent(path)}` };
  });


// One-shot: rewrite every stored product_images.url that references this bucket
// to the stable public proxy URL.
export const adminResignAllProductImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("product_images").select("id, url");
    if (error) throw new Error(error.message);
    let updated = 0;
    for (const r of rows ?? []) {
      const u = r.url ?? "";
      const path = getProductImagePath(u);
      if (!path) continue;
      const next = `/api/public/product-image?path=${encodeURIComponent(path)}`;
      if (next === u) continue;
      const { error: uErr } = await supabaseAdmin.from("product_images").update({ url: next }).eq("id", r.id);
      if (!uErr) updated++;
    }
    return { updated, total: rows?.length ?? 0 };
  });

