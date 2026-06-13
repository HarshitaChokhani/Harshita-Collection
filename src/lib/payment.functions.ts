import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getRazorpayKeyId = createServerFn({ method: "GET" }).handler(async () => {
  return { keyId: process.env.RAZORPAY_KEY_ID ?? "" };
});

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, payment_status, user_id, razorpay_order_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.payment_status === "paid") throw new Error("Order already paid");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Payments not configured");

    const amountPaise = Math.round(Number(order.total) * 100);

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: order.order_number,
        notes: { order_id: order.id, user_id: userId },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Razorpay order create failed", t);
      throw new Error("Could not initiate payment");
    }
    const rzpOrder = (await res.json()) as { id: string; amount: number; currency: string };

    await supabaseAdmin
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id);

    return {
      keyId,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderNumber: order.order_number,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      orderId: z.string().uuid(),
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Payments not configured");

    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const sig = Buffer.from(data.razorpay_signature);
    const exp = Buffer.from(expected);
    if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
      throw new Error("Invalid payment signature");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: fErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, razorpay_order_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!order || order.user_id !== userId) throw new Error("Order not found");
    if (order.razorpay_order_id !== data.razorpay_order_id) {
      throw new Error("Order mismatch");
    }

    const { error: uErr } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "processing",
        razorpay_payment_id: data.razorpay_payment_id,
      })
      .eq("id", order.id);
    if (uErr) throw new Error(uErr.message);

    return { ok: true };
  });
